import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

// 公共获取单个产品详情 API
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
    const product = await db.product.findUnique({
      where: {
        id,
        isDeleted: false, // 确保只获取未删除的产品
      },
      include: {
        brand: true, // 包含品牌信息
        category: true, // 包含分类信息
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "产品不存在或已被删除" },
        { status: 404 },
      );
    }

    // 转换 Decimal 为字符串，处理关联数据
    const productSerializable = {
      ...product,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() ?? null,
      discount: product.discount?.toString() ?? null,
      coupon: product.coupon,
      couponDescription: product.couponDescription,
      couponExpirationDate: product.couponExpirationDate?.toISOString() ?? null,
      brand: {
        // 只选择需要的品牌字段
        id: product.brand.id,
        name: product.brand.name,
        slug: product.brand.slug,
        logo: product.brand.logo,
        // 不暴露 website 等可能不需要的信息
      },
      category: {
        // 只选择需要的分类字段
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
        // 不暴露 level, parentId 等内部结构
      },
      updatedAt: product.updatedAt.toISOString(),
      // videos 字段已包含在 product 中
    };

    return NextResponse.json(productSerializable);
  } catch (error) {
    console.error(`获取公共产品 ${id} 失败:`, error);
    return NextResponse.json(
      { error: "获取产品详情时发生内部错误" },
      { status: 500 },
    );
  }
}
