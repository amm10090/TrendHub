import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { productService } from "@/lib/services/product.service";

// 获取商品列表 (Admin)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // TODO: 添加管理员可能需要的筛选、排序、分页逻辑 (例如: 包含软删除项)
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  try {
    const products = await db.product.findMany({
      skip: skip,
      take: limit,
      // include: { brand: true, category: true }, // 根据需要包含关联数据
      orderBy: {
        createdAt: "desc", // 默认按创建时间降序
      },
    });

    const totalProducts = await db.product.count(); // 获取总数以进行分页

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
  description: z.string().optional(),
  images: z.array(z.string().url("必须是有效的图片URL")).optional().default([]),
  sku: z.string().min(1, "SKU不能为空"),
  inventory: z.number().int().nonnegative("库存必须是非负整数").default(0),
  colors: z.array(z.string()).optional().default([]),
  sizes: z.array(z.string()).optional().default([]),
  material: z.string().optional(),
  cautions: z.string().optional(),
  promotionUrl: z.string().url("必须是有效的推广URL").optional().nullable(),
  videos: z.array(z.string().url("必须是有效的视频URL")).optional().default([]),
});

// 创建商品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateProductSchema.parse(body);

    // 检查SKU是否已存在
    const existingProductBySku = await db.product.findUnique({
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
      sku: validatedData.sku,
      inventory: validatedData.inventory,
      description: validatedData.description,
      images: validatedData.images,
      colors: validatedData.colors,
      sizes: validatedData.sizes,
      material: validatedData.material,
      cautions: validatedData.cautions,
      promotionUrl: validatedData.promotionUrl,
      videos: validatedData.videos,
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
