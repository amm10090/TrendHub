import { Prisma, DiscountType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

// GET - 获取折扣列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 分页参数
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // 筛选参数
    const brandId = searchParams.get("brandId");
    const merchantName = searchParams.get("merchantName");
    const status = searchParams.get("status"); // active, expired, all
    const type = searchParams.get("type") as DiscountType;
    const search = searchParams.get("search"); // 搜索关键词
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // 构建查询条件
    const where: Prisma.DiscountWhereInput = {};

    if (brandId) {
      where.brandId = brandId;
    }

    if (merchantName) {
      where.merchantName = {
        contains: merchantName,
        mode: "insensitive",
      };
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { merchantName: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    // 状态筛选
    switch (status) {
      case "active":
        where.isActive = true;
        where.isExpired = false;
        break;
      case "expired":
        where.isExpired = true;
        break;
      case "inactive":
        where.isActive = false;
        break;
      // 'all' 或其他值不添加状态筛选
    }

    // 构建排序
    const orderBy: Prisma.DiscountOrderByWithRelationInput = {};

    if (sortBy === "endDate") {
      orderBy.endDate = sortOrder as "asc" | "desc";
    } else if (sortBy === "rating") {
      orderBy.rating = sortOrder as "asc" | "desc";
    } else if (sortBy === "merchantName") {
      orderBy.merchantName = sortOrder as "asc" | "desc";
    } else {
      orderBy.createdAt = sortOrder as "asc" | "desc";
    }

    // 执行查询
    const [discounts, total] = await Promise.all([
      db.discount.findMany({
        where,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      db.discount.count({ where }),
    ]);

    // 计算统计信息
    const stats = await db.discount.groupBy({
      by: ["isActive", "isExpired"],
      _count: true,
      where: brandId ? { brandId } : undefined,
    });

    const statsMap = {
      total,
      active: 0,
      expired: 0,
      inactive: 0,
    };

    stats.forEach((stat) => {
      if (stat.isActive && !stat.isExpired) {
        statsMap.active += stat._count;
      } else if (stat.isExpired) {
        statsMap.expired += stat._count;
      } else if (!stat.isActive) {
        statsMap.inactive += stat._count;
      }
    });

    return NextResponse.json({
      success: true,
      data: discounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      stats: statsMap,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "获取折扣列表失败",
      },
      { status: 500 },
    );
  }
}

// POST - 创建新折扣
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      merchantName,
      title,
      code,
      type,
      value,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      rating,
      dealStatus,
      brandId,
      source = "MANUAL",
    } = body;

    // 数据验证
    if (!merchantName?.trim()) {
      return NextResponse.json(
        { success: false, error: "商家名称不能为空" },
        { status: 400 },
      );
    }

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "折扣标题不能为空" },
        { status: 400 },
      );
    }

    // 检查重复折扣
    if (code) {
      const existingDiscount = await db.discount.findFirst({
        where: {
          code,
          merchantName,
          isActive: true,
        },
      });

      if (existingDiscount) {
        return NextResponse.json(
          { success: false, error: "该商家的折扣码已存在" },
          { status: 409 },
        );
      }
    }

    // 创建折扣
    const discount = await db.discount.create({
      data: {
        merchantName,
        title,
        code: code || null,
        type: type || DiscountType.OTHER,
        value: value ? parseFloat(value) : null,
        minAmount: minAmount ? parseFloat(minAmount) : null,
        maxAmount: maxAmount ? parseFloat(maxAmount) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        rating: rating ? parseFloat(rating) : null,
        dealStatus,
        brandId: brandId || null,
        source,
        isExpired: endDate ? new Date(endDate) < new Date() : false,
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
    });

    return NextResponse.json({
      success: true,
      data: discount,
      message: "折扣创建成功",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "创建折扣失败",
      },
      { status: 500 },
    );
  }
}

// PUT - 批量更新折扣状态
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, action, data } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "请选择要操作的折扣" },
        { status: 400 },
      );
    }

    let updateData: Prisma.DiscountUpdateManyMutationInput = {};

    switch (action) {
      case "activate":
        updateData = { isActive: true };
        break;
      case "deactivate":
        updateData = { isActive: false };
        break;
      case "delete":
        // 软删除，设置为不活跃
        updateData = { isActive: false };
        break;
      case "update_brand":
        if (data?.brandId) {
          // 对于brandId字段，需要使用单独的更新操作，因为它不在DiscountUpdateManyMutationInput中
          const brandUpdateResult = await db.discount.updateMany({
            where: { id: { in: ids } },
            data: { brandId: data.brandId },
          });

          return NextResponse.json({
            success: true,
            data: { updated: brandUpdateResult.count },
            message: `成功更新 ${brandUpdateResult.count} 条折扣品牌`,
          });
        }
        break;
      default:
        return NextResponse.json(
          { success: false, error: "不支持的操作类型" },
          { status: 400 },
        );
    }

    const result = await db.discount.updateMany({
      where: {
        id: { in: ids },
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: { updated: result.count },
      message: `成功更新 ${result.count} 条折扣`,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "批量更新失败",
      },
      { status: 500 },
    );
  }
}

// DELETE - 批量删除折扣
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json(
        { success: false, error: "请指定要删除的折扣ID" },
        { status: 400 },
      );
    }

    const ids = idsParam.split(",");

    const result = await db.discount.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: result.count },
      message: `成功删除 ${result.count} 条折扣`,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "删除折扣失败",
      },
      { status: 500 },
    );
  }
}
