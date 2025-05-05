import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

// 可接受的排序字段
const allowedSortFields = ["name", "price", "createdAt", "updatedAt"] as const;

// 公共获取产品列表 API
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // --- 参数解析与验证 ---
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20"); // 默认每页 20 条
  const categoryId = searchParams.get("category") || undefined;
  const brandId = searchParams.get("brand") || undefined;
  const sale = searchParams.get("sale") === "true"; // 是否仅显示打折商品
  const minPrice = searchParams.get("minPrice")
    ? parseFloat(searchParams.get("minPrice")!)
    : undefined;
  const maxPrice = searchParams.get("maxPrice")
    ? parseFloat(searchParams.get("maxPrice")!)
    : undefined;
  const sort = searchParams.get("sort") || "createdAt"; // 默认按创建时间排序
  const order = (searchParams.get("order") || "desc") as "asc" | "desc";
  const searchTerm = searchParams.get("q") || undefined; // 搜索关键词

  // 验证排序字段
  const sortBy = allowedSortFields.includes(
    sort as (typeof allowedSortFields)[number],
  )
    ? sort
    : "createdAt";

  const skip = (page - 1) * limit;

  // --- 构建 Prisma 查询条件 ---
  const where: Prisma.ProductWhereInput = {
    isDeleted: false,
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (brandId) {
    where.brandId = brandId;
  }
  if (sale) {
    // 修正字段比较: 确保 originalPrice 存在且 price < originalPrice
    // 使用 AND 条件组合确保类型正确
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), // 保留可能已存在的 AND 条件
      { originalPrice: { not: null } },
      { price: { lt: db.product.fields.originalPrice } }, // 使用 Prisma.fieldReference 替代 { field: '...' }
    ];
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) {
      where.price.gte = new Prisma.Decimal(minPrice);
    }
    if (maxPrice !== undefined) {
      where.price.lte = new Prisma.Decimal(maxPrice);
    }
  }
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
      { sku: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // --- 构建排序条件 ---
  const orderBy: Prisma.ProductOrderByWithRelationInput = {
    [sortBy]: order,
  };

  // --- 执行查询 ---
  try {
    const products = await db.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        brand: {
          select: { name: true, slug: true },
        },
        category: {
          select: { name: true, slug: true },
        },
        price: true,
        images: true, // 获取所有图片，稍后处理第一张
        discount: true,
        originalPrice: true,
        isNew: true,
        sku: true,
        status: true,
      },
    });

    const totalProducts = await db.product.count({ where });

    // 转换 Decimal 为字符串并处理数据结构
    const productsSerializable = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price.toString(),
      originalPrice: p.originalPrice?.toString() ?? null,
      discount: p.discount,
      isNew: p.isNew,
      sku: p.sku,
      status: p.status,
      brandName: p.brand.name, // 现在 brand 应该存在
      brandSlug: p.brand.slug,
      categoryName: p.category.name, // 现在 category 应该存在
      categorySlug: p.category.slug,
      image: p.images.length > 0 ? p.images[0] : "", // 取第一张图
    }));

    return NextResponse.json({
      data: productsSerializable,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalProducts / limit),
        totalItems: totalProducts,
      },
    });
  } catch (error) {
    // 特别处理字段比较错误 (如果使用 Prisma < 6.x)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2010"
    ) {
      // Example error code, adjust if needed
      console.error("字段比较错误 (可能需要 Prisma 6.x+ 或替代方案):", error);
      return NextResponse.json(
        { error: "筛选打折商品时发生错误 (字段比较)" },
        { status: 500 },
      );
    }

    console.error("获取公共产品列表失败:", error);
    return NextResponse.json(
      { error: "获取产品列表时发生内部错误" },
      { status: 500 },
    );
  }
}
