import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

// GET - 获取品牌映射列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");
    const confirmed = searchParams.get("confirmed");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        {
          merchantName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          brand: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    if (confirmed !== null && confirmed !== "all") {
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

    // 为每个映射获取折扣数量
    const mappingsWithCounts = await Promise.all(
      mappings.map(async (mapping) => {
        const discountCount = await db.discount.count({
          where: {
            merchantName: mapping.merchantName,
          },
        });

        return {
          ...mapping,
          discountCount,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      data: mappingsWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "获取品牌映射失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST - 创建品牌映射
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantName, brandId, isConfirmed = true } = body;

    if (!merchantName) {
      return NextResponse.json(
        { success: false, error: "商家名称不能为空" },
        { status: 400 },
      );
    }

    if (!brandId) {
      return NextResponse.json(
        { success: false, error: "品牌ID不能为空" },
        { status: 400 },
      );
    }

    // 检查品牌是否存在
    const brand = await db.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return NextResponse.json(
        { success: false, error: "指定的品牌不存在" },
        { status: 400 },
      );
    }

    // 检查映射是否已存在
    const existingMapping = await db.brandMapping.findUnique({
      where: { merchantName },
    });

    let mapping;

    if (existingMapping) {
      // 更新现有映射
      mapping = await db.brandMapping.update({
        where: { merchantName },
        data: {
          brandId,
          isConfirmed,
          confidence: 1.0, // 手动映射设置为100%置信度
        },
        include: {
          brand: {
            select: { id: true, name: true, logo: true },
          },
        },
      });
    } else {
      // 创建新映射
      mapping = await db.brandMapping.create({
        data: {
          merchantName,
          brandId,
          isConfirmed,
          confidence: 1.0,
        },
        include: {
          brand: {
            select: { id: true, name: true, logo: true },
          },
        },
      });
    }

    // 更新所有相关折扣的品牌关联
    await db.discount.updateMany({
      where: {
        merchantName,
        brandId: null, // 只更新未关联品牌的折扣
      },
      data: {
        brandId,
      },
    });

    return NextResponse.json({
      success: true,
      data: mapping,
      message: "品牌映射创建成功",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "创建品牌映射失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// PUT - 更新品牌映射
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { mappingId, brandId, isConfirmed } = body;

    if (!mappingId) {
      return NextResponse.json(
        { success: false, error: "映射ID不能为空" },
        { status: 400 },
      );
    }

    // 检查映射是否存在
    const existingMapping = await db.brandMapping.findUnique({
      where: { id: mappingId },
    });

    if (!existingMapping) {
      return NextResponse.json(
        { success: false, error: "映射不存在" },
        { status: 404 },
      );
    }

    const updateData: {
      brandId?: string;
      isConfirmed?: boolean;
      confidence?: number;
    } = {};

    if (brandId !== undefined) {
      // 验证品牌存在
      const brand = await db.brand.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        return NextResponse.json(
          { success: false, error: "指定的品牌不存在" },
          { status: 400 },
        );
      }

      updateData.brandId = brandId;
      updateData.confidence = 1.0; // 手动更新设置为100%置信度
    }

    if (isConfirmed !== undefined) {
      updateData.isConfirmed = isConfirmed;
    }

    // 更新映射
    const mapping = await db.brandMapping.update({
      where: { id: mappingId },
      data: updateData,
      include: {
        brand: {
          select: { id: true, name: true, logo: true },
        },
      },
    });

    // 如果更新了brandId，同时更新相关折扣
    if (updateData.brandId) {
      await db.discount.updateMany({
        where: {
          merchantName: existingMapping.merchantName,
        },
        data: {
          brandId: updateData.brandId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: mapping,
      message: "品牌映射更新成功",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "更新品牌映射失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE - 删除品牌映射
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { mappingId } = body;

    if (!mappingId) {
      return NextResponse.json(
        { success: false, error: "映射ID不能为空" },
        { status: 400 },
      );
    }

    // 获取映射信息
    const mapping = await db.brandMapping.findUnique({
      where: { id: mappingId },
    });

    if (!mapping) {
      return NextResponse.json(
        { success: false, error: "映射不存在" },
        { status: 404 },
      );
    }

    // 删除映射
    await db.brandMapping.delete({
      where: { id: mappingId },
    });

    // 清除相关折扣的品牌关联
    await db.discount.updateMany({
      where: {
        merchantName: mapping.merchantName,
      },
      data: {
        brandId: null,
      },
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
