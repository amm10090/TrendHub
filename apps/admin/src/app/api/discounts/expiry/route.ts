import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

// POST - 手动触发过期检查和处理
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, dryRun = false } = body;

    const now = new Date();
    let result;

    switch (action) {
      case "check_expired":
        result = await checkAndUpdateExpiredDiscounts(dryRun);
        break;
      case "cleanup_expired":
        result = await cleanupExpiredDiscounts(dryRun);
        break;
      case "check_expiring_soon":
        result = await getExpiringSoonDiscounts();
        break;
      default:
        return NextResponse.json(
          { success: false, error: "不支持的操作类型" },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "过期处理失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// GET - 获取过期相关统计
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");

    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const [
      expiredCount,
      expiringSoonCount,
      recentlyExpiredCount,
      expiringSoonDetails,
    ] = await Promise.all([
      // 总过期数量
      db.discount.count({
        where: { isExpired: true },
      }),
      // 即将过期数量（指定天数内）
      db.discount.count({
        where: {
          isActive: true,
          isExpired: false,
          endDate: {
            gte: now,
            lte: futureDate,
          },
        },
      }),
      // 最近过期数量（过去7天）
      db.discount.count({
        where: {
          isExpired: true,
          endDate: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            lte: now,
          },
        },
      }),
      // 即将过期的详细信息
      db.discount.findMany({
        where: {
          isActive: true,
          isExpired: false,
          endDate: {
            gte: now,
            lte: futureDate,
          },
        },
        include: {
          brand: {
            select: { id: true, name: true, logo: true },
          },
        },
        orderBy: { endDate: "asc" },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          expired: expiredCount,
          expiringSoon: expiringSoonCount,
          recentlyExpired: recentlyExpiredCount,
          checkDays: days,
        },
        expiringSoon: expiringSoonDetails,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "获取过期统计失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// 检查并更新过期折扣
async function checkAndUpdateExpiredDiscounts(dryRun: boolean = false) {
  const now = new Date();

  // 查找应该标记为过期的折扣
  const expiredDiscounts = await db.discount.findMany({
    where: {
      endDate: { lt: now },
      isExpired: false,
    },
    select: {
      id: true,
      merchantName: true,
      title: true,
      endDate: true,
    },
  });

  if (dryRun) {
    return {
      action: "check_expired",
      dryRun: true,
      found: expiredDiscounts.length,
      discounts: expiredDiscounts,
    };
  }

  // 批量更新为过期状态
  const updateResult = await db.discount.updateMany({
    where: {
      id: { in: expiredDiscounts.map((d) => d.id) },
    },
    data: {
      isExpired: true,
      isActive: false, // 同时设置为不活跃
    },
  });

  return {
    action: "check_expired",
    processed: updateResult.count,
    discounts: expiredDiscounts.slice(0, 10), // 只返回前10个
  };
}

// 清理过期折扣（删除过期超过指定天数的折扣）
async function cleanupExpiredDiscounts(
  dryRun: boolean = false,
  daysOld: number = 30,
) {
  const cutoffDate = new Date();

  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  // 查找需要清理的过期折扣
  const oldExpiredDiscounts = await db.discount.findMany({
    where: {
      isExpired: true,
      endDate: { lt: cutoffDate },
    },
    select: {
      id: true,
      merchantName: true,
      title: true,
      endDate: true,
    },
  });

  if (dryRun) {
    return {
      action: "cleanup_expired",
      dryRun: true,
      found: oldExpiredDiscounts.length,
      cutoffDate: cutoffDate.toISOString(),
      discounts: oldExpiredDiscounts.slice(0, 10),
    };
  }

  // 删除过期折扣
  const deleteResult = await db.discount.deleteMany({
    where: {
      id: { in: oldExpiredDiscounts.map((d) => d.id) },
    },
  });

  return {
    action: "cleanup_expired",
    deleted: deleteResult.count,
    cutoffDate: cutoffDate.toISOString(),
    discounts: oldExpiredDiscounts.slice(0, 10),
  };
}

// 获取即将过期的折扣
async function getExpiringSoonDiscounts(days: number = 7) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const expiringSoon = await db.discount.findMany({
    where: {
      isActive: true,
      isExpired: false,
      endDate: {
        gte: now,
        lte: futureDate,
      },
    },
    include: {
      brand: {
        select: { id: true, name: true, logo: true },
      },
    },
    orderBy: { endDate: "asc" },
  });

  // 按天分组
  const groupedByDay: Record<string, unknown[]> = {};

  expiringSoon.forEach((discount) => {
    if (discount.endDate) {
      const dateKey = discount.endDate.toISOString().split("T")[0];

      if (!groupedByDay[dateKey]) {
        groupedByDay[dateKey] = [];
      }
      groupedByDay[dateKey].push(discount);
    }
  });

  return {
    action: "check_expiring_soon",
    days,
    total: expiringSoon.length,
    byDay: groupedByDay,
    discounts: expiringSoon,
  };
}
