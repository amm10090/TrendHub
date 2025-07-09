import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

import { auth } from "../../../../../auth";

/**
 * 计算字符串相似度 (Levenshtein距离)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = str1.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalized2 = str2.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (normalized1 === normalized2) return 1.0;

  const matrix = Array(normalized2.length + 1)
    .fill(null)
    .map(() => Array(normalized1.length + 1).fill(null));

  for (let i = 0; i <= normalized1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= normalized2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= normalized2.length; j++) {
    for (let i = 1; i <= normalized1.length; i++) {
      const indicator = normalized1[i - 1] === normalized2[j - 1] ? 0 : 1;

      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator,
      );
    }
  }

  const distance = matrix[normalized2.length][normalized1.length];
  const maxLength = Math.max(normalized1.length, normalized2.length);

  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

/**
 * GET /api/fmtc-merchants/brand-matching
 * 获取品牌匹配信息
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "stats";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    switch (action) {
      case "stats": {
        // 获取匹配统计信息
        const stats = await Promise.all([
          db.fMTCMerchant.count({ where: { isActive: true } }),
          db.fMTCMerchant.count({
            where: { isActive: true, brandId: { not: null } },
          }),
          db.fMTCMerchant.count({ where: { isActive: true, brandId: null } }),
          db.fMTCMerchant.count({
            where: { isActive: true, brandMatchConfirmed: true },
          }),
          db.fMTCMerchant.count({
            where: {
              isActive: true,
              brandMatchConfirmed: false,
              brandId: { not: null },
            },
          }),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            totalMerchants: stats[0],
            matched: stats[1],
            unmatched: stats[2],
            confirmed: stats[3],
            needsConfirmation: stats[4],
          },
        });
      }

      case "unmatched": {
        // 获取未匹配的商户列表
        const [unmatchedMerchants, unmatchedCount] = await Promise.all([
          db.fMTCMerchant.findMany({
            where: {
              isActive: true,
              brandId: null,
            },
            select: {
              id: true,
              name: true,
              country: true,
              network: true,
              homepage: true,
              primaryCategory: true,
              lastScrapedAt: true,
            },
            orderBy: { name: "asc" },
            skip: offset,
            take: limit,
          }),
          db.fMTCMerchant.count({
            where: {
              isActive: true,
              brandId: null,
            },
          }),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            merchants: unmatchedMerchants,
            pagination: {
              page,
              limit,
              totalCount: unmatchedCount,
              totalPages: Math.ceil(unmatchedCount / limit),
            },
          },
        });
      }

      case "suggestions": {
        // 获取品牌匹配建议
        const merchantName = searchParams.get("merchantName");

        if (!merchantName) {
          return NextResponse.json(
            { success: false, error: "商户名称不能为空" },
            { status: 400 },
          );
        }

        const brands = await db.brand.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            logo: true,
            description: true,
          },
        });

        const suggestions = brands
          .map((brand) => ({
            ...brand,
            similarity: calculateSimilarity(merchantName, brand.name),
          }))
          .filter((brand) => brand.similarity > 0.3)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 10);

        return NextResponse.json({
          success: true,
          data: {
            merchantName,
            suggestions,
          },
        });
      }

      case "need_confirmation": {
        // 获取需要确认的匹配
        const [needConfirmation, needConfirmationCount] = await Promise.all([
          db.fMTCMerchant.findMany({
            where: {
              isActive: true,
              brandId: { not: null },
              brandMatchConfirmed: false,
            },
            include: {
              brand: {
                select: {
                  id: true,
                  name: true,
                  logo: true,
                },
              },
            },
            orderBy: { brandMatchConfidence: "desc" },
            skip: offset,
            take: limit,
          }),
          db.fMTCMerchant.count({
            where: {
              isActive: true,
              brandId: { not: null },
              brandMatchConfirmed: false,
            },
          }),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            merchants: needConfirmation,
            pagination: {
              page,
              limit,
              totalCount: needConfirmationCount,
              totalPages: Math.ceil(needConfirmationCount / limit),
            },
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "不支持的操作" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("FMTC Brand Matching API Error:", error);

    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/fmtc-merchants/brand-matching
 * 执行品牌匹配操作
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      action,
      merchantId,
      brandId,
      merchantIds,
      autoMatchThreshold = 0.8,
    } = body;

    switch (action) {
      case "confirm": {
        // 确认品牌匹配
        if (!merchantId || !brandId) {
          return NextResponse.json(
            { success: false, error: "商户ID和品牌ID不能为空" },
            { status: 400 },
          );
        }

        const merchant = await db.fMTCMerchant.findUnique({
          where: { id: merchantId },
        });

        if (!merchant) {
          return NextResponse.json(
            { success: false, error: "商户不存在" },
            { status: 404 },
          );
        }

        const brand = await db.brand.findUnique({
          where: { id: brandId },
        });

        if (!brand) {
          return NextResponse.json(
            { success: false, error: "品牌不存在" },
            { status: 404 },
          );
        }

        // 更新商户的品牌匹配
        const updatedMerchant = await db.fMTCMerchant.update({
          where: { id: merchantId },
          data: {
            brandId,
            brandMatchConfirmed: true,
            brandMatchConfidence: new Prisma.Decimal(1.0),
          },
        });

        // 创建或更新品牌映射
        await db.brandMapping.upsert({
          where: { merchantName: merchant.name },
          create: {
            merchantName: merchant.name,
            brandId,
            isConfirmed: true,
            confidence: new Prisma.Decimal(1.0),
            fmtcMerchantId: merchantId,
          },
          update: {
            brandId,
            isConfirmed: true,
            confidence: new Prisma.Decimal(1.0),
            fmtcMerchantId: merchantId,
          },
        });

        return NextResponse.json({
          success: true,
          data: updatedMerchant,
        });
      }

      case "reject": {
        // 拒绝品牌匹配
        if (!merchantId) {
          return NextResponse.json(
            { success: false, error: "商户ID不能为空" },
            { status: 400 },
          );
        }

        const rejectedMerchant = await db.fMTCMerchant.update({
          where: { id: merchantId },
          data: {
            brandId: null,
            brandMatchConfirmed: false,
            brandMatchConfidence: null,
          },
        });

        return NextResponse.json({
          success: true,
          data: rejectedMerchant,
        });
      }

      case "auto_match": {
        // 自动匹配单个商户
        if (!merchantId) {
          return NextResponse.json(
            { success: false, error: "商户ID不能为空" },
            { status: 400 },
          );
        }

        const targetMerchant = await db.fMTCMerchant.findUnique({
          where: { id: merchantId },
        });

        if (!targetMerchant) {
          return NextResponse.json(
            { success: false, error: "商户不存在" },
            { status: 404 },
          );
        }

        // 获取所有品牌进行匹配
        const allBrands = await db.brand.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
        });

        let bestMatch = null;
        let bestSimilarity = 0;

        for (const brand of allBrands) {
          const similarity = calculateSimilarity(
            targetMerchant.name,
            brand.name,
          );

          if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestMatch = brand;
          }
        }

        if (bestMatch && bestSimilarity >= autoMatchThreshold) {
          // 执行自动匹配
          const autoMatchedMerchant = await db.fMTCMerchant.update({
            where: { id: merchantId },
            data: {
              brandId: bestMatch.id,
              brandMatchConfirmed: false,
              brandMatchConfidence: new Prisma.Decimal(bestSimilarity),
            },
          });

          return NextResponse.json({
            success: true,
            data: {
              merchant: autoMatchedMerchant,
              match: bestMatch,
              similarity: bestSimilarity,
            },
          });
        } else {
          return NextResponse.json({
            success: false,
            error: "未找到足够相似的品牌",
          });
        }
      }

      case "batch_auto_match": {
        // 批量自动匹配
        const targetMerchantIds = merchantIds || [];

        if (targetMerchantIds.length === 0) {
          return NextResponse.json(
            { success: false, error: "商户ID列表不能为空" },
            { status: 400 },
          );
        }

        const targetMerchants = await db.fMTCMerchant.findMany({
          where: {
            id: { in: targetMerchantIds },
            isActive: true,
            brandId: null,
          },
          select: { id: true, name: true },
        });

        const batchBrands = await db.brand.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
        });

        const matchResults = [];
        const unmatchedMerchants = [];

        for (const merchant of targetMerchants) {
          let bestBatchMatch = null;
          let bestBatchSimilarity = 0;

          for (const brand of batchBrands) {
            const similarity = calculateSimilarity(merchant.name, brand.name);

            if (similarity > bestBatchSimilarity) {
              bestBatchSimilarity = similarity;
              bestBatchMatch = brand;
            }
          }

          if (bestBatchMatch && bestBatchSimilarity >= autoMatchThreshold) {
            // 执行匹配
            await db.fMTCMerchant.update({
              where: { id: merchant.id },
              data: {
                brandId: bestBatchMatch.id,
                brandMatchConfirmed: false,
                brandMatchConfidence: new Prisma.Decimal(bestBatchSimilarity),
              },
            });

            matchResults.push({
              merchantId: merchant.id,
              merchantName: merchant.name,
              brandId: bestBatchMatch.id,
              brandName: bestBatchMatch.name,
              similarity: bestBatchSimilarity,
            });
          } else {
            unmatchedMerchants.push({
              merchantId: merchant.id,
              merchantName: merchant.name,
              reason: "未找到足够相似的品牌",
            });
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            matched: matchResults.length,
            unmatched: unmatchedMerchants.length,
            matchResults,
            unmatchedMerchants,
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "不支持的操作" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("FMTC Brand Matching Action Error:", error);

    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/fmtc-merchants/brand-matching
 * 删除品牌匹配
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get("merchantId");

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: "商户ID不能为空" },
        { status: 400 },
      );
    }

    const merchant = await db.fMTCMerchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: "商户不存在" },
        { status: 404 },
      );
    }

    // 删除品牌匹配
    await db.fMTCMerchant.update({
      where: { id: merchantId },
      data: {
        brandId: null,
        brandMatchConfirmed: false,
        brandMatchConfidence: null,
      },
    });

    // 删除品牌映射
    await db.brandMapping.deleteMany({
      where: { fmtcMerchantId: merchantId },
    });

    return NextResponse.json({
      success: true,
      data: { message: "品牌匹配已删除" },
    });
  } catch (error) {
    console.error("FMTC Brand Matching Delete Error:", error);

    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}
