import { NextResponse } from "next/server";

import { brandService, Brand } from "@/lib/services/brand.service"; // 改为从服务中导入 Brand 类型
// 移除 Prisma 类型的导入
// import { Brand as PrismaBrand } from '@prisma/client';

/**
 * GET /api/public/brands/slug/[slug]
 * 通过品牌slug获取单个品牌的公共API端点。
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug } = await Promise.resolve(params);

    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { error: "Slug parameter is required and must be a string." },
        { status: 400 },
      );
    }

    // 使用服务中定义的 Brand 类型
    const brand: Brand | null = await brandService.findOneBySlug(slug, {
      isActive: true,
    });

    if (!brand) {
      return NextResponse.json(
        { error: `Brand with slug '${slug}' not found.` },
        { status: 404 },
      );
    }

    // 从完整的品牌对象中选择要公开暴露的字段
    // 这有助于避免意外泄露内部数据或过大的响应
    const publicBrandData = {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo,
      description: brand.description, // 品牌描述，在单页中可能有用
      website: brand.website, // 品牌官网，在单页中可能有用
      popularity: brand.popularity, // 热门度
      // 根据需要添加其他字段，例如:
      // images: brand.images, // 如果有品牌特定图片集
      // relatedProductsCount: await productService.countByBrand(brand.id), // 示例：关联产品数量
    };

    return NextResponse.json(publicBrandData, { status: 200 });
  } catch {
    // 记录服务器端错误，但不要将详细错误信息直接暴露给客户端
    // [API ERROR] Failed to fetch brand by slug
    return NextResponse.json(
      { error: "An internal server error occurred while fetching the brand." },
      { status: 500 },
    );
  }
}
