import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/../auth";
import { db } from "@/lib/db";

/**
 * GET /api/fmtc-merchants
 * 获取 FMTC 商户列表
 * 查询参数: page, limit, search, country, network, status, brandMatched
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const country = searchParams.get("country") || "";
    const network = searchParams.get("network") || "";
    const status = searchParams.get("status") || "";
    const brandMatched = searchParams.get("brandMatched") || "";
    const activeStatus = searchParams.get("activeStatus") || ""; // 新增：商户活跃状态筛选

    const offset = (page - 1) * limit;

    // 构建查询条件
    const andConditions: Prisma.FMTCMerchantWhereInput[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { homepage: { contains: search, mode: "insensitive" } },
          { primaryCategory: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (country) {
      andConditions.push({ country: country });
    }

    if (network) {
      andConditions.push({ network: network });
    }

    if (status) {
      andConditions.push({ status: status });
    }

    if (brandMatched === "matched") {
      andConditions.push({ brandId: { not: null } });
    } else if (brandMatched === "unmatched") {
      andConditions.push({ brandId: null });
    }

    // 添加活跃状态筛选
    if (activeStatus === "active") {
      andConditions.push({ isActive: true });
    } else if (activeStatus === "inactive") {
      andConditions.push({ isActive: false });
    }
    // 如果不指定activeStatus或为"all"，则显示所有商户

    const where: Prisma.FMTCMerchantWhereInput = {
      ...(andConditions.length > 0 && { AND: andConditions }),
    };

    // 获取商户列表
    const [merchants, totalCount] = await Promise.all([
      db.fMTCMerchant.findMany({
        where,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          networks: {
            select: {
              networkName: true,
              networkId: true,
              status: true,
            },
          },
        },
        orderBy: [{ lastScrapedAt: "desc" }, { createdAt: "desc" }],
        skip: offset,
        take: limit,
      }),
      db.fMTCMerchant.count({ where }),
    ]);

    // 获取统计信息 - 包含所有商户状态
    const stats = await Promise.all([
      // 总商户数（包括活跃和禁用的）
      db.fMTCMerchant.count(),
      // 活跃商户数
      db.fMTCMerchant.count({ where: { isActive: true } }),
      // 禁用商户数
      db.fMTCMerchant.count({ where: { isActive: false } }),
      // 品牌匹配数（所有商户）
      db.fMTCMerchant.count({ where: { brandId: { not: null } } }),
      // 未匹配数（所有商户）
      db.fMTCMerchant.count({ where: { brandId: null } }),
      // 最近更新数（所有商户）
      db.fMTCMerchant.count({
        where: {
          lastScrapedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        merchants,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        stats: {
          totalMerchants: stats[0],
          activeMerchants: stats[1],
          inactiveMerchants: stats[2],
          brandMatched: stats[3],
          unmatched: stats[4],
          recentlyUpdated: stats[5],
        },
      },
    });
  } catch {
    // 记录错误但不使用console.log
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/fmtc-merchants
 * 创建或更新商户信息
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { merchants, action = "create" } = body;

    if (!merchants || !Array.isArray(merchants)) {
      return NextResponse.json(
        { success: false, error: "商户数据格式不正确" },
        { status: 400 },
      );
    }

    if (action === "create") {
      // 批量创建商户
      const createdMerchants = [];
      const errors = [];

      for (const merchantData of merchants) {
        try {
          // 检查是否已存在
          const existing = await db.fMTCMerchant.findFirst({
            where: {
              name: merchantData.name,
              isActive: true,
            },
          });

          if (existing) {
            // 更新现有商户
            const updated = await db.fMTCMerchant.update({
              where: { id: existing.id },
              data: {
                ...merchantData,
                lastScrapedAt: new Date(),
                updatedAt: new Date(),
              },
            });

            createdMerchants.push(updated);
          } else {
            // 创建新商户
            const created = await db.fMTCMerchant.create({
              data: {
                ...merchantData,
                lastScrapedAt: new Date(),
              },
            });

            createdMerchants.push(created);
          }
        } catch (error) {
          errors.push({
            merchantName: merchantData.name,
            error: error instanceof Error ? error.message : "创建失败",
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          created: createdMerchants.length,
          errors: errors.length,
          merchants: createdMerchants,
          errorDetails: errors,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "不支持的操作" },
      { status: 400 },
    );
  } catch {
    // 记录错误但不使用console.log
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/fmtc-merchants
 * 批量更新商户信息
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids, action, data } = body;

    // 改进的参数验证
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "商户ID列表不能为空" },
        { status: 400 },
      );
    }

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { success: false, error: "操作类型不能为空" },
        { status: 400 },
      );
    }

    let result;

    switch (action) {
      case "activate":
        result = await db.fMTCMerchant.updateMany({
          where: { id: { in: ids } },
          data: { isActive: true },
        });
        break;

      case "deactivate":
        result = await db.fMTCMerchant.updateMany({
          where: { id: { in: ids } },
          data: { isActive: false },
        });
        break;

      case "update_brand":
        if (!data?.brandId) {
          return NextResponse.json(
            { success: false, error: "品牌ID不能为空" },
            { status: 400 },
          );
        }
        result = await db.fMTCMerchant.updateMany({
          where: { id: { in: ids } },
          data: {
            brandId: data.brandId,
            brandMatchConfirmed: true,
            brandMatchConfidence: new Prisma.Decimal(1.0),
          },
        });
        break;

      case "remove_brand":
        result = await db.fMTCMerchant.updateMany({
          where: { id: { in: ids } },
          data: {
            brandId: null,
            brandMatchConfirmed: false,
            brandMatchConfidence: null,
          },
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: `不支持的操作: ${action}` },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: result.count,
        action,
      },
    });
  } catch {
    // 记录错误但不使用console.log
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/fmtc-merchants
 * 批量删除商户
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "商户ID列表不能为空" },
        { status: 400 },
      );
    }

    // 真删除 - 从数据库中完全删除记录
    const result = await db.fMTCMerchant.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.count,
      },
    });
  } catch {
    // 记录错误但不使用console.log
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}
