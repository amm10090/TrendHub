import { ImportStatus, ImportType, DiscountType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { brandMatchingService } from "@/lib/services/brand-matching.service";
import { FMTCDiscountData } from "@/lib/services/fmtc-parser.service";

interface ImportRequest {
  discounts: FMTCDiscountData[];
  source: string;
  importType: "PASTE" | "FILE" | "API";
  rawContent?: string;
  fileName?: string;
}

// POST - 批量导入折扣
export async function POST(request: NextRequest) {
  let importRecord: { id: string } | null = null;

  try {
    const body: ImportRequest = await request.json();
    const { discounts, source, importType, rawContent, fileName } = body;

    if (!discounts || !Array.isArray(discounts) || discounts.length === 0) {
      return NextResponse.json(
        { success: false, error: "没有要导入的折扣数据" },
        { status: 400 },
      );
    }

    // 创建导入记录
    importRecord = await db.discountImport.create({
      data: {
        fileName: fileName || null,
        rawContent: rawContent || JSON.stringify(discounts),
        parsedData: JSON.parse(JSON.stringify(discounts)),
        status: ImportStatus.PROCESSING,
        totalRecords: discounts.length,
        importType: importType as ImportType,
        // userId: 可以从session中获取用户ID
      },
    });

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const importedDiscounts: unknown[] = [];

    // 批量获取品牌匹配
    const merchantNames = [...new Set(discounts.map((d) => d.merchantName))];
    const brandMatches =
      await brandMatchingService.batchMatchBrands(merchantNames);

    // 处理每个折扣
    for (let i = 0; i < discounts.length; i++) {
      const discountData = discounts[i];

      try {
        // 重复检测
        const existingDiscount = await findDuplicateDiscount(discountData);

        if (existingDiscount) {
          skippedCount++;
          errors.push(`第${i + 1}行: 折扣已存在 - ${discountData.title}`);
          continue;
        }

        // 品牌匹配
        const brandMatch = brandMatches.get(discountData.merchantName);
        const brandId = brandMatch?.brandId || null;

        // 检查过期状态
        const isExpired = discountData.endDate
          ? discountData.endDate < new Date()
          : false;

        // 创建折扣记录
        const discount = await db.discount.create({
          data: {
            merchantName: discountData.merchantName,
            title: discountData.title,
            code: discountData.code || null,
            type: discountData.type || DiscountType.OTHER,
            value: discountData.value || null,
            minAmount: discountData.minAmount || null,
            maxAmount: discountData.maxAmount || null,
            startDate: discountData.startDate || null,
            endDate: discountData.endDate || null,
            rating: discountData.rating || null,
            dealStatus: discountData.dealStatus || null,
            fmtcUpdated: discountData.fmtcUpdated || null,
            brandId,
            source,
            isExpired,
            rawData: JSON.parse(JSON.stringify(discountData)),
          },
        });

        importedDiscounts.push(discount);
        successCount++;
      } catch (error) {
        errorCount++;
        const errorMessage =
          error instanceof Error ? error.message : "未知错误";

        errors.push(`第${i + 1}行: ${errorMessage} - ${discountData.title}`);
      }
    }

    // 更新导入记录
    const finalStatus =
      errorCount > 0
        ? successCount > 0
          ? ImportStatus.PARTIAL
          : ImportStatus.FAILED
        : ImportStatus.COMPLETED;

    await db.discountImport.update({
      where: { id: importRecord.id },
      data: {
        status: finalStatus,
        successCount,
        errorCount,
        skippedCount,
        errors: errors.length > 0 ? errors : null,
        completedAt: new Date(),
      },
    });

    // 统计信息
    const stats = {
      total: discounts.length,
      imported: successCount,
      errors: errorCount,
      skipped: skippedCount,
    };

    return NextResponse.json({
      success: true,
      data: {
        importId: importRecord.id,
        discounts: importedDiscounts,
        stats,
      },
      message: `导入完成: 成功 ${successCount} 条，错误 ${errorCount} 条，跳过 ${skippedCount} 条`,
      errors: errors.slice(0, 10), // 只返回前10个错误
      ...stats,
    });
  } catch (error) {
    // 更新导入记录为失败状态
    if (importRecord) {
      try {
        await db.discountImport.update({
          where: { id: importRecord.id },
          data: {
            status: ImportStatus.FAILED,
            errors: [
              error instanceof Error ? error.message : "导入过程中发生未知错误",
            ],
            completedAt: new Date(),
          },
        });
      } catch {
        // 如果更新失败，忽略错误
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "批量导入失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// GET - 获取导入历史
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [imports, total] = await Promise.all([
      db.discountImport.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      db.discountImport.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: imports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "获取导入历史失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// 重复检测辅助函数
async function findDuplicateDiscount(discountData: FMTCDiscountData) {
  const conditions = [];

  // 1. 相同商家 + 相同折扣码
  if (discountData.code) {
    conditions.push({
      merchantName: discountData.merchantName,
      code: discountData.code,
      isActive: true,
    });
  }

  // 2. 相同商家 + 相同标题 + 相似时间范围
  conditions.push({
    merchantName: discountData.merchantName,
    title: discountData.title,
    isActive: true,
  });

  for (const condition of conditions) {
    const existing = await db.discount.findFirst({
      where: condition,
    });

    if (existing) {
      // 如果有时间信息，进一步检查时间重叠
      if (
        discountData.startDate &&
        discountData.endDate &&
        existing.startDate &&
        existing.endDate
      ) {
        const hasTimeOverlap =
          discountData.startDate <= existing.endDate &&
          discountData.endDate >= existing.startDate;

        if (hasTimeOverlap) {
          return existing;
        }
      } else {
        return existing;
      }
    }
  }

  return null;
}
