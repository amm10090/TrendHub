/**
 * FMTC 商户管理 API
 */

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/../auth";
import { db } from "@/lib/db";
import { FMTCMerchantService } from "@/lib/services/fmtc-merchant.service";

const fmtcMerchantService = new FMTCMerchantService();

/**
 * GET /api/fmtc/merchants
 * 获取 FMTC 商户列表
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const country = searchParams.get("country") || "";
    const network = searchParams.get("network") || "";
    const brandMatched = searchParams.get("brandMatched"); // "true", "false", null
    const sortBy = searchParams.get("sortBy") || "lastScrapedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const stats = searchParams.get("stats") === "true";

    // 构建查询条件
    const where: {
      isActive: boolean;
      name?: { contains: string; mode: "insensitive" };
      country?: string;
      network?: string;
      brandId?: { not: null } | null;
    } = {
      isActive: true,
    };

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (country) {
      where.country = country;
    }

    if (network) {
      where.network = network;
    }

    if (brandMatched === "true") {
      where.brandId = { not: null };
    } else if (brandMatched === "false") {
      where.brandId = null;
    }

    // 获取统计信息
    if (stats) {
      const statsData = await fmtcMerchantService.getStats();

      return NextResponse.json({
        success: true,
        stats: statsData,
      });
    }

    // 分页查询
    const offset = (page - 1) * limit;
    const [merchants, total] = await Promise.all([
      db.fMTCMerchant.findMany({
        where,
        include: {
          brand: {
            select: { id: true, name: true, logo: true },
          },
          networks: {
            where: { isActive: true },
            take: 3, // 最多显示3个网络
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        take: limit,
        skip: offset,
      }),
      db.fMTCMerchant.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: merchants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取 FMTC 商户列表失败:", error);

    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/fmtc/merchants
 * 创建或更新商户信息
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "create": {
        const newMerchant = await fmtcMerchantService.createMerchant(data);

        return NextResponse.json({
          success: true,
          data: newMerchant,
          message: "商户创建成功",
        });
      }

      case "import": {
        const { merchants } = data;
        const importResult =
          await fmtcMerchantService.importMerchants(merchants);

        return NextResponse.json({
          success: true,
          data: importResult,
          message: `成功导入 ${importResult.successCount} 个商户`,
        });
      }

      case "sync_with_scraper": {
        // 从爬虫数据同步到数据库
        const syncResult = await fmtcMerchantService.syncFromScraperData();

        return NextResponse.json({
          success: true,
          data: syncResult,
          message: "数据同步完成",
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "不支持的操作类型" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("FMTC 商户操作失败:", error);

    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/fmtc/merchants
 * 批量更新商户信息
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { ids, action, data } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "请选择要操作的商户" },
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

      case "match_brand": {
        const { brandId } = data;

        result = await fmtcMerchantService.batchMatchBrand(ids, brandId);
        break;
      }

      case "auto_match_brands":
        result = await fmtcMerchantService.batchAutoMatchBrands(ids);
        break;

      case "refresh_data":
        result = await fmtcMerchantService.batchRefreshMerchantData(ids);
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
      message: `批量操作完成，影响 ${result.count || ids.length} 个商户`,
    });
  } catch (error) {
    console.error("批量操作失败:", error);

    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/fmtc/merchants
 * 批量删除商户
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json(
        { success: false, error: "请提供要删除的商户ID" },
        { status: 400 },
      );
    }

    const ids = idsParam.split(",");

    const result = await db.fMTCMerchant.updateMany({
      where: { id: { in: ids } },
      data: { isActive: false }, // 软删除
    });

    return NextResponse.json({
      success: true,
      data: { count: result.count },
      message: `成功删除 ${result.count} 个商户`,
    });
  } catch (error) {
    console.error("删除商户失败:", error);

    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}
