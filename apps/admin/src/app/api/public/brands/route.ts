import { NextResponse } from "next/server";

import { brandService } from "@/lib/services/brand.service";
import { db } from "@/lib/db";

// 公共获取品牌列表 API
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "999"); // 默认获取所有品牌
    const search = searchParams.get("search") || "";
    // 默认只返回活跃品牌
    const isActive = searchParams.has("isActive")
      ? searchParams.get("isActive") === "true"
      : true;
    // 热门品牌筛选
    const popularity = searchParams.has("popularity")
      ? searchParams.get("popularity") === "true"
      : undefined;
    // 新增：只显示有商品的品牌
    const withProducts = searchParams.has("withProducts")
      ? searchParams.get("withProducts") === "true"
      : false;
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = (searchParams.get("sortOrder") || "asc") as
      | "asc"
      | "desc";
    const letter = searchParams.get("letter") || "";

    // 构建基本查询参数
    const queryParams = {
      page,
      limit,
      search,
      isActive,
      popularity,
      sortBy,
      sortOrder,
    };

    // 如果需要只显示有商品的品牌，使用直接数据库查询
    let brandsResult;
    if (withProducts) {
      // 直接查询有商品的品牌
      const brandsWithProducts = await db.brand.findMany({
        where: {
          isActive,
          ...(popularity !== undefined ? { popularity } : {}),
          ...(search
            ? {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              }
            : {}),
          ...(letter && letter.length === 1
            ? {
                name: {
                  startsWith: letter.toUpperCase(),
                  mode: "insensitive" as const,
                },
              }
            : {}),
          // 只包含有商品的品牌
          products: {
            some: {
              isDeleted: false,
            },
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          popularity: true,
          _count: {
            select: {
              products: {
                where: {
                  isDeleted: false,
                },
              },
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await db.brand.count({
        where: {
          isActive,
          ...(popularity !== undefined ? { popularity } : {}),
          ...(search
            ? {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              }
            : {}),
          ...(letter && letter.length === 1
            ? {
                name: {
                  startsWith: letter.toUpperCase(),
                  mode: "insensitive" as const,
                },
              }
            : {}),
          products: {
            some: {
              isDeleted: false,
            },
          },
        },
      });

      brandsResult = {
        items: brandsWithProducts.map((brand) => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          logo: brand.logo,
          popularity: brand.popularity,
          productCount: brand._count.products,
        })),
        total,
        totalPages: Math.ceil(total / limit),
      };
    } else if (letter) {
      // 当有字母筛选时，优先使用字母筛选
      brandsResult = await brandService.getBrands({
        ...queryParams,
        search: letter.length === 1 ? `^${letter}` : search, // 假设服务支持正则搜索首字母
      });
    } else {
      brandsResult = await brandService.getBrands(queryParams);
    }

    // 转换为前端所需格式，移除敏感或不必要的数据
    const { items, total, totalPages } = brandsResult;
    const publicBrands = {
      items: items.map((brand) => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
        popularity: brand.popularity,
        // 不返回 description、website、createdAt、updatedAt 等敏感或不必要字段
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };

    return NextResponse.json(publicBrands);
  } catch (error) {
    console.error("获取公共品牌列表失败:", error);
    return NextResponse.json({ error: "获取品牌列表失败" }, { status: 500 });
  }
}
