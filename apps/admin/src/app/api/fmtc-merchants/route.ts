import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

import { auth } from "../../../../auth";

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

    const offset = (page - 1) * limit;

    // 构建查询条件
    const where: Prisma.FMTCMerchantWhereInput = {
      isActive: true,
      AND: [],
    };

    if (search) {
      where.AND!.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { homepage: { contains: search, mode: "insensitive" } },
          { primaryCategory: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (country) {
      where.AND!.push({ country: country });
    }

    if (network) {
      where.AND!.push({ network: network });
    }

    if (status) {
      where.AND!.push({ status: status });
    }

    if (brandMatched === "matched") {
      where.AND!.push({ brandId: { not: null } });
    } else if (brandMatched === "unmatched") {
      where.AND!.push({ brandId: null });
    }

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

    // 获取统计信息
    const stats = await Promise.all([
      db.fMTCMerchant.count({ where: { isActive: true } }),
      db.fMTCMerchant.count({
        where: { isActive: true, brandId: { not: null } },
      }),
      db.fMTCMerchant.count({ where: { isActive: true, brandId: null } }),
      db.fMTCMerchant.count({
        where: {
          isActive: true,
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
          brandMatched: stats[1],
          unmatched: stats[2],
          recentlyUpdated: stats[3],
        },
      },
    });
  } catch (error) {
    console.error("FMTC Merchants API Error:", error);

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
  } catch (error) {
    console.error("FMTC Merchants Create Error:", error);

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

    if (!ids || !Array.isArray(ids) || !action) {
      return NextResponse.json(
        { success: false, error: "参数不完整" },
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
          { success: false, error: "不支持的操作" },
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
  } catch (error) {
    console.error("FMTC Merchants Update Error:", error);

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

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids")?.split(",") || [];

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "商户ID不能为空" },
        { status: 400 },
      );
    }

    // 软删除 - 标记为不活跃
    const result = await db.fMTCMerchant.updateMany({
      where: { id: { in: ids } },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.count,
      },
    });
  } catch (error) {
    console.error("FMTC Merchants Delete Error:", error);

    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}
