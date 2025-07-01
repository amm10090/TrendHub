import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

// GET - 获取折扣统计信息
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "30d"; // 7d, 30d, 90d, 1y, all
    const brandId = searchParams.get("brandId");

    // 计算时间范围
    const now = new Date();
    let startDate: Date | undefined;

    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      // 'all' 不设置开始时间
    }

    // 基础查询条件
    const baseWhere: Prisma.DiscountWhereInput = {};

    if (startDate) {
      baseWhere.createdAt = { gte: startDate };
    }
    if (brandId) {
      baseWhere.brandId = brandId;
    }

    // 1. 基础统计
    const [
      totalDiscounts,
      activeDiscounts,
      expiredDiscounts,
      inactiveDiscounts,
    ] = await Promise.all([
      db.discount.count({ where: baseWhere }),
      db.discount.count({
        where: { ...baseWhere, isActive: true, isExpired: false },
      }),
      db.discount.count({
        where: { ...baseWhere, isExpired: true },
      }),
      db.discount.count({
        where: { ...baseWhere, isActive: false, isExpired: false },
      }),
    ]);

    // 2. 按类型分组统计
    const discountsByType = await db.discount.groupBy({
      by: ["type"],
      where: baseWhere,
      _count: true,
      orderBy: { _count: { type: "desc" } },
    });

    // 3. 按来源分组统计
    const discountsBySource = await db.discount.groupBy({
      by: ["source"],
      where: baseWhere,
      _count: true,
      orderBy: { _count: { source: "desc" } },
    });

    // 4. 顶级商家统计
    const topMerchants = await db.discount.groupBy({
      by: ["merchantName"],
      where: baseWhere,
      _count: true,
      orderBy: { _count: { merchantName: "desc" } },
      take: 10,
    });

    // 5. 品牌统计（如果有品牌关联）
    const topBrands = await db.discount.groupBy({
      by: ["brandId"],
      where: { ...baseWhere, brandId: { not: null } },
      _count: true,
      orderBy: { _count: { brandId: "desc" } },
      take: 10,
    });

    // 获取品牌详细信息
    const brandIds = topBrands
      .map((b) => b.brandId)
      .filter(Boolean) as string[];
    const brandsInfo = await db.brand.findMany({
      where: { id: { in: brandIds } },
      select: { id: true, name: true, logo: true },
    });

    const brandsMap = new Map(brandsInfo.map((b) => [b.id, b]));
    const topBrandsWithInfo = topBrands.map((stat) => ({
      brand: brandsMap.get(stat.brandId!),
      count: stat._count,
    }));

    // 6. 时间趋势分析（按天）
    const trendDays = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const trendData = await getTrendData(baseWhere, trendDays);

    // 7. 即将过期的折扣
    const upcomingExpiry = await db.discount.findMany({
      where: {
        ...baseWhere,
        isActive: true,
        isExpired: false,
        endDate: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7天内过期
        },
      },
      include: {
        brand: {
          select: { id: true, name: true, logo: true },
        },
      },
      orderBy: { endDate: "asc" },
      take: 10,
    });

    // 8. 评分统计
    const ratingStats = await db.discount.aggregate({
      where: { ...baseWhere, rating: { not: null } },
      _avg: { rating: true },
      _min: { rating: true },
      _max: { rating: true },
      _count: { rating: true },
    });

    // 9. 无品牌关联的折扣数量
    const unmatchedDiscounts = await db.discount.count({
      where: { ...baseWhere, brandId: null },
    });

    // 10. 导入统计
    const importStats = await db.discountImport.groupBy({
      by: ["status"],
      where: startDate ? { createdAt: { gte: startDate } } : {},
      _count: true,
      _sum: {
        totalRecords: true,
        successCount: true,
        errorCount: true,
        skippedCount: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total: totalDiscounts,
          active: activeDiscounts,
          expired: expiredDiscounts,
          inactive: inactiveDiscounts,
          unmatched: unmatchedDiscounts,
        },
        byType: discountsByType.map((stat) => ({
          type: stat.type,
          count: stat._count,
        })),
        bySource: discountsBySource.map((stat) => ({
          source: stat.source,
          count: stat._count,
        })),
        topMerchants: topMerchants.map((stat) => ({
          merchantName: stat.merchantName,
          count: stat._count,
        })),
        topBrands: topBrandsWithInfo,
        trend: trendData,
        upcomingExpiry,
        rating: {
          average: ratingStats._avg.rating,
          min: ratingStats._min.rating,
          max: ratingStats._max.rating,
          count: ratingStats._count.rating,
        },
        imports: importStats.map((stat) => ({
          status: stat.status,
          count: stat._count,
          totalRecords: stat._sum.totalRecords || 0,
          successCount: stat._sum.successCount || 0,
          errorCount: stat._sum.errorCount || 0,
          skippedCount: stat._sum.skippedCount || 0,
        })),
        timeRange,
        generatedAt: now.toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "获取统计信息失败",
      },
      { status: 500 },
    );
  }
}

// 获取时间趋势数据
async function getTrendData(
  baseWhere: Prisma.DiscountWhereInput,
  days: number,
) {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // 生成日期数组
  const dateRange: Date[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);

    dateRange.push(date);
  }

  // 按日期分组查询
  const trendData = await Promise.all(
    dateRange.map(async (date) => {
      const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const [created, expired] = await Promise.all([
        db.discount.count({
          where: {
            ...baseWhere,
            createdAt: {
              gte: date,
              lt: nextDay,
            },
          },
        }),
        db.discount.count({
          where: {
            ...baseWhere,
            endDate: {
              gte: date,
              lt: nextDay,
            },
            isExpired: true,
          },
        }),
      ]);

      return {
        date: date.toISOString().split("T")[0],
        created,
        expired,
      };
    }),
  );

  return trendData;
}
