import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { brandMatchingService } from "@/lib/services/brand-matching.service";

// GET - 获取品牌匹配信息
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "stats":
        return getMatchingStats();
      case "unmatched":
        return getUnmatchedMerchants(searchParams);
      case "suggestions":
        return getBrandSuggestions(searchParams);
      default:
        return getBrandMappings(searchParams);
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "获取品牌匹配信息失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST - 创建或确认品牌映射
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantName, brandId, action } = body;

    if (!merchantName) {
      return NextResponse.json(
        { success: false, error: "商家名称不能为空" },
        { status: 400 },
      );
    }

    switch (action) {
      case "confirm": {
        if (!brandId) {
          return NextResponse.json(
            { success: false, error: "品牌ID不能为空" },
            { status: 400 },
          );
        }

        const mapping = await brandMatchingService.confirmBrandMapping(
          merchantName,
          brandId,
        );

        return NextResponse.json({
          success: true,
          data: mapping,
          message: "品牌映射确认成功",
        });
      }

      case "auto_match": {
        const matchResult = await brandMatchingService.matchBrand(merchantName);

        if (matchResult.brandId) {
          return NextResponse.json({
            success: true,
            data: matchResult,
            message: "自动匹配成功",
          });
        } else {
          return NextResponse.json({
            success: false,
            error: "未找到匹配的品牌",
            data: matchResult,
          });
        }
      }

      case "batch_auto_match": {
        const { merchantNames } = body;

        if (!Array.isArray(merchantNames)) {
          return NextResponse.json(
            { success: false, error: "商家名称列表格式错误" },
            { status: 400 },
          );
        }

        const batchResults =
          await brandMatchingService.batchMatchBrands(merchantNames);
        const successCount = Array.from(batchResults.values()).filter(
          (result) => result.brandId,
        ).length;

        return NextResponse.json({
          success: true,
          data: Object.fromEntries(batchResults),
          message: `批量匹配完成: ${successCount}/${merchantNames.length} 个成功匹配`,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "不支持的操作类型" },
          { status: 400 },
        );
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "品牌匹配操作失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE - 删除品牌映射
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantName = searchParams.get("merchantName");

    if (!merchantName) {
      return NextResponse.json(
        { success: false, error: "商家名称不能为空" },
        { status: 400 },
      );
    }

    await db.brandMapping.delete({
      where: { merchantName },
    });

    // 同时清除相关折扣的品牌关联
    await db.discount.updateMany({
      where: { merchantName },
      data: { brandId: null },
    });

    return NextResponse.json({
      success: true,
      message: "品牌映射删除成功",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "删除品牌映射失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// 获取品牌映射列表
async function getBrandMappings(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search");
  const confirmed = searchParams.get("confirmed");

  const where: Record<string, unknown> = {};

  if (search) {
    where.merchantName = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (confirmed !== null) {
    where.isConfirmed = confirmed === "true";
  }

  const [mappings, total] = await Promise.all([
    db.brandMapping.findMany({
      where,
      include: {
        brand: {
          select: { id: true, name: true, logo: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: "desc" },
    }),
    db.brandMapping.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: mappings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// 获取匹配统计
async function getMatchingStats() {
  const stats = await brandMatchingService.getMatchingStats();

  return NextResponse.json({
    success: true,
    data: stats,
  });
}

// 获取未匹配的商家
async function getUnmatchedMerchants(searchParams: URLSearchParams) {
  const limit = parseInt(searchParams.get("limit") || "50");

  const unmatchedMerchants = await brandMatchingService.getUnmatchedMerchants();

  // 获取每个商家的折扣数量
  const merchantCounts = await Promise.all(
    unmatchedMerchants.slice(0, limit).map(async (merchantName) => {
      const count = await db.discount.count({
        where: {
          merchantName,
          brandId: null,
        },
      });

      return {
        merchantName,
        discountCount: count,
      };
    }),
  );

  // 按折扣数量降序排序
  merchantCounts.sort((a, b) => b.discountCount - a.discountCount);

  return NextResponse.json({
    success: true,
    data: {
      merchants: merchantCounts,
      total: unmatchedMerchants.length,
    },
  });
}

// 获取品牌建议
async function getBrandSuggestions(searchParams: URLSearchParams) {
  const merchantName = searchParams.get("merchantName");
  const limit = parseInt(searchParams.get("limit") || "5");

  if (!merchantName) {
    return NextResponse.json(
      { success: false, error: "商家名称不能为空" },
      { status: 400 },
    );
  }

  const suggestions = await brandMatchingService.getBrandSuggestions(
    merchantName,
    limit,
  );

  return NextResponse.json({
    success: true,
    data: suggestions,
  });
}
