import { NextResponse } from "next/server";

import { brandService } from "@/lib/services/brand.service";

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

    // 如果有letter参数，在search中加入首字母筛选逻辑
    // 这里我们通过修改search参数来实现字母筛选，因为BrandQueryParams接口中没有letter字段
    let brandsResult;
    if (letter) {
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
