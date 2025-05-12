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
  const idsQueryParam = searchParams.get("ids") || undefined; // 新增：获取ids参数
  const gender = searchParams.get("gender") || undefined; // 新增：获取 gender 参数

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

  let productIdsOrder: string[] | undefined = undefined;

  if (idsQueryParam) {
    const ids = idsQueryParam.split(",").filter((id) => id.trim() !== "");
    if (ids.length > 0) {
      where.id = { in: ids };
      productIdsOrder = ids; // 保存请求的ID顺序
      // 当按ID列表查询时，通常不应用其他筛选条件，除非特定设计需求
      // 为简化，如果提供了ids，我们将忽略 categoryId, brandId, sale, minPrice, maxPrice, searchTerm
      // 同时，分页和排序可能也需要特别处理或禁用
    }
  } else {
    // 只有在没有ids参数时，才应用其他筛选
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (
      gender &&
      (gender === "women" || gender === "men" || gender === "unisex")
    ) {
      where.gender = gender;
    }
    if (sale) {
      where.AND = [
        ...(Array.isArray(where.AND)
          ? where.AND
          : where.AND
            ? [where.AND]
            : []),
        { originalPrice: { not: null } },
        { price: { lt: db.product.fields.originalPrice } },
      ];
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined)
        where.price.gte = new Prisma.Decimal(minPrice);
      if (maxPrice !== undefined)
        where.price.lte = new Prisma.Decimal(maxPrice);
    }
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { sku: { contains: searchTerm, mode: "insensitive" } },
      ];
    }
  }

  // --- 构建排序条件 ---
  const orderBy: Prisma.ProductOrderByWithRelationInput = productIdsOrder
    ? {}
    : { [sortBy]: order };
  // 如果是按ID列表查询，排序应由代码后续处理以匹配输入顺序，或不排序由Prisma默认行为（可能按ID）
  // 如果不是按ID列表查询，则使用用户指定的排序或默认排序

  // --- 执行查询 ---
  try {
    interface ProductWithSelectedRelations {
      id: string;
      name: string;
      price: Prisma.Decimal;
      originalPrice: Prisma.Decimal | null;
      images: string[];
      description: string | null;
      discount: Prisma.Decimal | null;
      isNew: boolean;
      sku: string | null;
      status: string;
      videos: string[];
      currency: string | null;
      gender: string | null;
      breadcrumbs: string[];
      material: string | null;
      materialDetails: string[];
      sizes: string[];
      colors: string[];
      metadata: Prisma.JsonValue | null;
      promotionUrl: string | null;
      cautions: string | null;
      inventory: number | null;
      brand: {
        id: string;
        name: string;
        slug: string;
        logo: string | null;
      } | null;
      category: {
        id: string;
        name: string;
        slug: string;
      } | null;
    }

    const productsFromDbRaw = await db.product.findMany({
      where,
      orderBy: productIdsOrder ? undefined : orderBy,
      skip: productIdsOrder ? undefined : skip,
      take: productIdsOrder ? undefined : limit,
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        images: true,
        description: true,
        discount: true,
        isNew: true,
        sku: true,
        status: true,
        videos: true,
        currency: true,
        gender: true,
        breadcrumbs: true,
        material: true,
        materialDetails: true,
        sizes: true,
        colors: true,
        metadata: true,
        promotionUrl: true,
        cautions: true,
        inventory: true,
        brand: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    const productsFromDb = productsFromDbRaw as ProductWithSelectedRelations[];

    let finalProducts: ProductWithSelectedRelations[] = productsFromDb;
    if (productIdsOrder && productIdsOrder.length > 0) {
      const productMap = new Map(productsFromDb.map((p) => [p.id, p]));
      // filter(Boolean) 用于移除 productMap.get(id) 可能返回的 undefined
      finalProducts = productIdsOrder
        .map((id) => productMap.get(id))
        .filter(Boolean) as ProductWithSelectedRelations[];
    }

    const totalProducts = await db.product.count({ where });

    const productsSerializable = finalProducts.map(
      (p: ProductWithSelectedRelations) => {
        return {
          id: p.id,
          name: p.name,
          price: p.price.toString(),
          originalPrice: p.originalPrice?.toString() ?? null,
          images: p.images || [],
          description: p.description || undefined,
          discount: p.discount?.toString() ?? null,
          isNew: p.isNew || false,
          sku: p.sku || undefined,
          status: p.status || undefined,
          videos: p.videos || [],
          brandName: p.brand?.name,
          brandSlug: p.brand?.slug,
          brandId: p.brand?.id,
          brandLogo: p.brand?.logo || undefined,
          categoryName: p.category?.name,
          categorySlug: p.category?.slug,
          categoryId: p.category?.id,
          inventory: p.inventory === null ? undefined : p.inventory,
          currency: p.currency || undefined,
          gender: p.gender as ("women" | "men" | "unisex") | undefined,
          categories: p.breadcrumbs || [],
          material: p.material || undefined,
          details: p.materialDetails || [],
          sizes: p.sizes || [],
          colors:
            p.colors.map((colorName) => ({
              name: colorName,
              value: colorName,
            })) || [],
          specifications: (p.metadata as Prisma.JsonObject) || undefined,
          adUrl: p.promotionUrl || undefined,
          careInstructions: p.cautions ? [p.cautions] : [],
        };
      },
    );

    return NextResponse.json({
      data: productsSerializable,
      pagination:
        productIdsOrder && productIdsOrder.length > 0
          ? {
              page: 1,
              limit: productsSerializable.length,
              totalPages: 1,
              totalItems: productsSerializable.length,
            }
          : {
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
