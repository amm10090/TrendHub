import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { productService } from "@/lib/services/product.service";

// 获取单个商品
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = await params;

  try {
    const product = await db.product.findUnique({
      where: { id },
      include: {
        brand: true,
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 });
    }

    const productSerializable = {
      ...product,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() ?? null,
      discount: product.discount?.toString() ?? null,
      coupon: product.coupon,
      couponDescription: product.couponDescription,
      couponExpirationDate: product.couponExpirationDate?.toISOString() ?? null,
      tags: product.tags,
      updatedAt: product.updatedAt.toISOString(),
    };

    return NextResponse.json(productSerializable);
  } catch {
    return NextResponse.json(
      { error: "获取产品时发生内部错误" },
      { status: 500 },
    );
  }
}

// 更新商品
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = await params;

  try {
    const data = await request.json();
    const product = await productService.updateProduct(id, data);

    return NextResponse.json(product);
  } catch (error) {
    if ((error as Error).message === "Product not found") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

// 删除单个商品
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = await params;

  try {
    // 检查产品是否存在
    const existingProduct = await db.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 });
    }

    // 如果已经软删除了，可以直接返回成功或特定消息
    if (existingProduct.isDeleted) {
      return NextResponse.json({ message: "产品已被删除" });
    }

    // 执行软删除
    await db.product.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true, message: "产品已标记为删除" });
  } catch {
    return NextResponse.json(
      { error: "删除产品时发生内部错误" },
      { status: 500 },
    );
  }
}

// Zod Schema for updating a product (all fields optional)
const UpdateProductSchema = z.object({
  name: z.string().min(1, "产品名称不能为空").optional(),
  brandId: z.string().min(1, "品牌不能为空").optional(),
  categoryId: z.string().min(1, "分类不能为空").optional(),
  price: z.number().positive("价格必须是正数").optional(),
  originalPrice: z.number().positive("原价必须是正数").optional().nullable(),
  discount: z.number().nonnegative("折扣值不能为负").optional().nullable(),
  status: z.string().min(1, "状态不能为空").optional(),
  description: z.string().optional().nullable(),
  images: z.array(z.string().url("必须是有效的图片URL")).optional(),
  sku: z.string().min(1, "SKU不能为空").optional(),
  inventory: z.number().int().nonnegative("库存必须是非负整数").optional(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  material: z.string().optional().nullable(),
  cautions: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  promotionUrl: z.string().url("必须是有效的推广URL").optional().nullable(),
  videos: z.array(z.string().url("必须是有效的视频URL")).optional(),
  coupon: z.string().optional().nullable(),
  couponDescription: z.string().optional().nullable(),
  couponExpirationDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .nullable(),
  gender: z.enum(["women", "men", "unisex"]).nullable().optional(),
  // isDeleted is handled separately by the DELETE endpoint
});

// --- 更新商品 (Admin) ---
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const validatedData = UpdateProductSchema.parse(body);

    const existingProduct = await db.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 });
    }

    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
      const skuExists = await db.product.findFirst({
        where: {
          sku: validatedData.sku,
          NOT: { id: existingProduct.id },
        },
      });

      if (skuExists) {
        return NextResponse.json(
          { error: "此SKU已被其他产品使用", field: "sku" },
          { status: 400 },
        );
      }
    }

    const dataToUpdate: Prisma.ProductUpdateInput = {};

    if (validatedData.name) dataToUpdate.name = validatedData.name;
    if (validatedData.brandId)
      dataToUpdate.brand = { connect: { id: validatedData.brandId } };
    if (validatedData.categoryId)
      dataToUpdate.category = { connect: { id: validatedData.categoryId } };
    if (validatedData.price)
      dataToUpdate.price = new Prisma.Decimal(validatedData.price);
    if (validatedData.originalPrice !== undefined)
      dataToUpdate.originalPrice =
        validatedData.originalPrice === null
          ? null
          : new Prisma.Decimal(validatedData.originalPrice);
    if (validatedData.discount !== undefined)
      dataToUpdate.discount =
        validatedData.discount === null
          ? null
          : new Prisma.Decimal(validatedData.discount);
    if (validatedData.status) dataToUpdate.status = validatedData.status;
    if (validatedData.description !== undefined)
      dataToUpdate.description = validatedData.description;
    if (validatedData.gender !== undefined)
      dataToUpdate.gender = validatedData.gender;
    if (validatedData.images) dataToUpdate.images = validatedData.images;
    if (validatedData.sku) dataToUpdate.sku = validatedData.sku;
    if (validatedData.inventory !== undefined)
      dataToUpdate.inventory = validatedData.inventory;
    if (validatedData.colors) dataToUpdate.colors = validatedData.colors;
    if (validatedData.sizes) dataToUpdate.sizes = validatedData.sizes;
    if (validatedData.material !== undefined)
      dataToUpdate.material = validatedData.material;
    if (validatedData.cautions !== undefined)
      dataToUpdate.cautions = validatedData.cautions;
    if (validatedData.tags !== undefined)
      dataToUpdate.tags = validatedData.tags;
    if (validatedData.promotionUrl !== undefined)
      dataToUpdate.promotionUrl = validatedData.promotionUrl;
    if (validatedData.videos) dataToUpdate.videos = validatedData.videos;
    if (validatedData.coupon !== undefined)
      dataToUpdate.coupon = validatedData.coupon;
    if (validatedData.couponDescription !== undefined)
      dataToUpdate.couponDescription = validatedData.couponDescription;
    if (validatedData.couponExpirationDate !== undefined)
      dataToUpdate.couponExpirationDate =
        validatedData.couponExpirationDate === null
          ? null
          : new Date(validatedData.couponExpirationDate);

    const updatedProduct = await db.product.update({
      where: { id },
      data: dataToUpdate,
    });

    const updatedProductSerializable = {
      ...updatedProduct,
      price: updatedProduct.price.toString(),
      originalPrice: updatedProduct.originalPrice?.toString() ?? null,
      discount: updatedProduct.discount?.toString() ?? null,
      coupon: updatedProduct.coupon,
      couponDescription: updatedProduct.couponDescription,
      couponExpirationDate:
        updatedProduct.couponExpirationDate?.toISOString() ?? null,
      tags: updatedProduct.tags,
      updatedAt: updatedProduct.updatedAt.toISOString(),
    };

    return NextResponse.json(updatedProductSerializable);
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
      { error: "更新产品时发生内部错误" },
      { status: 500 },
    );
  }
}
