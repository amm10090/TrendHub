import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { brandMatchingService } from "@/lib/services/brand-matching.service";

// GET - 获取未匹配的商家
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search");

    // 获取所有没有品牌映射的商家名称
    let whereCondition: Record<string, unknown> = {
      brandId: null,
    };

    if (search) {
      whereCondition = {
        ...whereCondition,
        merchantName: {
          contains: search,
          mode: "insensitive",
        },
      };
    }

    // 获取未匹配的商家及其折扣数量
    const unmatchedMerchants = await db.discount.groupBy({
      by: ["merchantName"],
      where: whereCondition,
      _count: {
        merchantName: true,
      },
      orderBy: {
        _count: {
          merchantName: "desc",
        },
      },
      take: limit,
    });

    // 为每个商家获取示例标题和建议品牌
    const merchantsWithDetails = await Promise.all(
      unmatchedMerchants.map(async (merchant) => {
        // 获取示例折扣标题
        const sampleDiscounts = await db.discount.findMany({
          where: {
            merchantName: merchant.merchantName,
            brandId: null,
          },
          select: {
            title: true,
          },
          take: 3,
          orderBy: {
            createdAt: "desc",
          },
        });

        const sampleTitles = sampleDiscounts.map((d) => d.title);

        // 获取品牌建议
        let suggestedBrands: Array<{
          brand: { id: string; name: string; logo?: string };
          confidence: number;
        }> = [];

        try {
          // 使用品牌匹配服务获取建议
          const matchResult = await brandMatchingService.matchBrand(
            merchant.merchantName,
          );

          if (matchResult.brandId && matchResult.brand) {
            suggestedBrands.push({
              brand: {
                id: matchResult.brand.id,
                name: matchResult.brand.name,
                logo: matchResult.brand.logo,
              },
              confidence: matchResult.confidence,
            });
          }

          // 如果没有高置信度匹配，尝试获取多个候选品牌
          if (matchResult.confidence < 0.8) {
            const suggestions = await getFuzzyBrandSuggestions(
              merchant.merchantName,
              3,
            );

            suggestedBrands = suggestions;
          }
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: "获取未匹配商家失败",
            details: error instanceof Error ? error.message : "Unknown error",
          });
        }

        return {
          merchantName: merchant.merchantName,
          discountCount: merchant._count.merchantName,
          sampleTitles,
          suggestedBrands,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      data: merchantsWithDetails,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "获取未匹配商家失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// 获取模糊品牌建议的辅助函数
async function getFuzzyBrandSuggestions(
  merchantName: string,
  limit: number = 3,
): Promise<
  Array<{
    brand: { id: string; name: string; logo?: string };
    confidence: number;
  }>
> {
  // 获取所有品牌
  const brands = await db.brand.findMany({
    select: {
      id: true,
      name: true,
      logo: true,
    },
  });

  // 计算相似度并排序
  const similarities = brands
    .map((brand) => {
      const confidence = calculateStringSimilarity(
        merchantName.toLowerCase(),
        brand.name.toLowerCase(),
      );

      return {
        brand,
        confidence,
      };
    })
    .filter((item) => item.confidence > 0.3) // 只保留相似度大于30%的
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);

  return similarities;
}

// 计算字符串相似度（简化版Levenshtein距离）
function calculateStringSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);

  if (maxLength === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);

  return 1 - distance / maxLength;
}

// Levenshtein距离算法
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + cost, // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}
