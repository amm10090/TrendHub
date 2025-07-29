import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { brandMatchingService } from "@/lib/services/brand-matching.service";

// POST - 批量品牌匹配
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantNames } = body;

    if (!Array.isArray(merchantNames) || merchantNames.length === 0) {
      return NextResponse.json(
        { success: false, error: "商家名称列表不能为空" },
        { status: 400 },
      );
    }

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    const results: Array<{
      merchantName: string;
      success: boolean;
      brandId?: string;
      brandName?: string;
      confidence?: number;
      error?: string;
    }> = [];

    // 批量处理每个商家
    for (const merchantName of merchantNames) {
      processedCount++;

      try {
        // 检查是否已经有映射
        const existingMapping = await db.brandMapping.findUnique({
          where: { merchantName },
          include: {
            brand: {
              select: { id: true, name: true },
            },
          },
        });

        if (existingMapping && existingMapping.brand) {
          // 已有映射，跳过
          results.push({
            merchantName,
            success: true,
            brandId: existingMapping.brandId!,
            brandName: existingMapping.brand.name,
            confidence: Number(existingMapping.confidence) || 1.0,
          });
          successCount++;
          continue;
        }

        // 尝试自动匹配
        const matchResult = await brandMatchingService.matchBrand(merchantName);

        if (matchResult.brandId && matchResult.confidence >= 0.7) {
          // 置信度足够高，创建映射
          await db.brandMapping.upsert({
            where: { merchantName },
            update: {
              brandId: matchResult.brandId,
              confidence: matchResult.confidence,
              isConfirmed: false, // 自动匹配设为未确认
            },
            create: {
              merchantName,
              brandId: matchResult.brandId,
              confidence: matchResult.confidence,
              isConfirmed: false,
            },
          });

          // 更新相关折扣
          await db.discount.updateMany({
            where: {
              merchantName,
              brandId: null,
            },
            data: {
              brandId: matchResult.brandId,
            },
          });

          results.push({
            merchantName,
            success: true,
            brandId: matchResult.brandId,
            brandName: matchResult.brand?.name,
            confidence: matchResult.confidence,
          });
          successCount++;
        } else {
          // 置信度不够或无匹配
          results.push({
            merchantName,
            success: false,
            error: `未找到高置信度匹配 (置信度: ${matchResult.confidence.toFixed(2)})`,
          });
          errorCount++;
        }
      } catch {
        results.push({
          merchantName,
          success: false,
          error: error instanceof Error ? error.message : "未知错误",
        });
        errorCount++;
      }
    }

    // 获取更新后的统计信息
    const stats = await getBrandMatchingStats();

    return NextResponse.json({
      success: true,
      data: {
        processed: processedCount,
        successful: successCount,
        failed: errorCount,
        results: results.slice(0, 20), // 只返回前20个结果，避免响应过大
        stats,
      },
      message: `批量匹配完成: ${successCount}/${processedCount} 成功`,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "批量品牌匹配失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// 获取品牌匹配统计信息
async function getBrandMatchingStats() {
  const [totalMappings, confirmedMappings, totalUnmatched, recentMatches] =
    await Promise.all([
      db.brandMapping.count(),
      db.brandMapping.count({ where: { isConfirmed: true } }),
      db.discount.count({ where: { brandId: null } }),
      db.brandMapping.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 最近24小时
          },
        },
      }),
    ]);

  return {
    totalMappings,
    confirmedMappings,
    unconfirmedMappings: totalMappings - confirmedMappings,
    totalUnmatched,
    recentMatches,
  };
}
