import { NextResponse } from "next/server";

import { brandService } from "@/lib/services/brand.service";

// 获取品牌列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "999"); // 默认获取所有品牌
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive") === "true";
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = (searchParams.get("sortOrder") || "asc") as
      | "asc"
      | "desc";

    const brands = await brandService.getBrands({
      page,
      limit,
      search,
      ...(searchParams.has("isActive") && { isActive }),
      sortBy,
      sortOrder,
    });

    return NextResponse.json(brands);
  } catch {
    return NextResponse.json({ error: "获取品牌列表失败" }, { status: 500 });
  }
}

// 创建品牌
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const brand = await brandService.createBrand(data);

    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "创建品牌失败";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
