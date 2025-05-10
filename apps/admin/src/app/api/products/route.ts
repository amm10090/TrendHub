import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { productService } from "@/lib/services/product.service";

// 获取商品列表 (Admin)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  // 添加筛选参数
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const brandId = searchParams.get("brandId") || "";
  const minPrice = searchParams.get("minPrice")
    ? parseFloat(searchParams.get("minPrice") || "0")
    : undefined;
  const maxPrice = searchParams.get("maxPrice")
    ? parseFloat(searchParams.get("maxPrice") || "0")
    : undefined;
  const hasCoupon = searchParams.get("hasCoupon") === "true" ? true : undefined;
  const hasDiscount =
    searchParams.get("hasDiscount") === "true" ? true : undefined;

  try {
    // 构建查询条件
    const whereConditions: Prisma.ProductWhereInput = {
      // 默认不显示已删除商品
      isDeleted: false,
    };

    // 如果有搜索关键词
    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // 按状态筛选
    if (status && status.toLowerCase() !== "all") {
      whereConditions.status = status;
    }

    // 按分类筛选
    if (categoryId && categoryId !== "_all") {
      whereConditions.categoryId = categoryId;
    }

    // 按品牌筛选
    if (brandId && brandId !== "_all") {
      whereConditions.brandId = brandId;
    }

    // 按价格范围筛选
    if (minPrice !== undefined || maxPrice !== undefined) {
      whereConditions.price = {};
      if (minPrice !== undefined) {
        whereConditions.price.gte = new Prisma.Decimal(minPrice);
      }
      if (maxPrice !== undefined) {
        whereConditions.price.lte = new Prisma.Decimal(maxPrice);
      }
    }

    // 只显示有优惠券的商品
    if (hasCoupon) {
      whereConditions.coupon = { not: null };
    }

    // 只显示有折扣的商品（简化版本）
    if (hasDiscount) {
      whereConditions.originalPrice = { not: null };
      // 注意：这里是简化逻辑，实际情况需要在应用层做进一步筛选
      // 完整逻辑应当是筛选 price < originalPrice 的商品
    }

    const products = await db.product.findMany({
      where: whereConditions,
      skip: skip,
      take: limit,
      include: {
        brand: true,
        category: true,
      },
      orderBy: {
        createdAt: "desc", // 默认按创建时间降序
      },
    });

    const totalProducts = await db.product.count({
      where: whereConditions,
    });

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalProducts / limit),
        totalItems: totalProducts,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "获取产品列表时发生内部错误" },
      { status: 500 },
    );
  }
}

// Zod Schema for creating a product
const CreateProductSchema = z.object({
  name: z.string().min(1, "产品名称不能为空"),
  brandId: z.string().min(1, "品牌不能为空"),
  categoryId: z.string().min(1, "分类不能为空"),
  price: z.number().positive("价格必须是正数"), // Prisma expects Decimal, but typically receives number from JSON
  status: z.string().min(1, "状态不能为空"),
  source: z.string().min(1, "来源不能为空"),
  description: z.string().optional(),
  images: z.array(z.string().url("必须是有效的图片URL")).optional().default([]),
  sku: z.string().min(1, "SKU不能为空"),
  inventory: z.number().int().nonnegative("库存必须是非负整数").default(0),
  colors: z.array(z.string()).optional().default([]),
  sizes: z.array(z.string()).optional().default([]),
  material: z.string().optional(),
  cautions: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  promotionUrl: z.string().url("必须是有效的推广URL").optional().nullable(),
  videos: z.array(z.string().url("必须是有效的视频URL")).optional().default([]),
  originalPrice: z.number().positive("原价必须是正数").optional(),
  discount: z
    .number()
    .min(0, "折扣必须是非负数")
    .max(100, "折扣不能超过100%")
    .optional(),
  coupon: z.string().optional(),
  couponDescription: z.string().optional(),
  couponExpirationDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

// 创建商品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateProductSchema.parse(body);

    // 检查SKU是否已存在
    const existingProductBySku = await db.product.findFirst({
      where: { sku: validatedData.sku },
    });

    if (existingProductBySku) {
      return NextResponse.json(
        { error: "此SKU已被使用", field: "sku" },
        { status: 400 },
      );
    }

    // 准备创建数据，确保 price 是 Decimal 类型
    const productDataToCreate: Prisma.ProductCreateInput = {
      name: validatedData.name,
      brand: { connect: { id: validatedData.brandId } },
      category: { connect: { id: validatedData.categoryId } },
      price: new Prisma.Decimal(validatedData.price),
      status: validatedData.status,
      source: validatedData.source,
      sku: validatedData.sku,
      inventory: validatedData.inventory,
      description: validatedData.description,
      images: validatedData.images,
      colors: validatedData.colors,
      sizes: validatedData.sizes,
      material: validatedData.material,
      cautions: validatedData.cautions,
      tags: validatedData.tags,
      promotionUrl: validatedData.promotionUrl,
      videos: validatedData.videos,
      originalPrice: validatedData.originalPrice
        ? new Prisma.Decimal(validatedData.originalPrice)
        : undefined,
      discount: validatedData.discount
        ? new Prisma.Decimal(validatedData.discount)
        : undefined,
      coupon: validatedData.coupon,
      couponDescription: validatedData.couponDescription,
      couponExpirationDate: validatedData.couponExpirationDate,
    };

    const newProduct = await db.product.create({
      data: productDataToCreate,
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      return NextResponse.json(
        { error: "验证失败", details: errorDetails },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "创建产品时发生内部错误" },
      { status: 500 },
    );
  }
}

// 批量删除商品
export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { error: "Invalid request: ids must be an array" },
        { status: 400 },
      );
    }
    const count = await productService.deleteProducts(ids);

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete products" },
      { status: 500 },
    );
  }
}
