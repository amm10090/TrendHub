import { NextResponse } from "next/server";

import { categoryService } from "@/lib/services/category.service";

// 获取分类列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const level = searchParams.get("level")
      ? parseInt(searchParams.get("level")!)
      : undefined;
    const parentId = searchParams.get("parentId") || undefined;
    const isActive =
      searchParams.get("isActive") !== null
        ? searchParams.get("isActive") === "true"
        : undefined;
    const getAllRelated = searchParams.get("getAllRelated") === "true";
    const familyPaging = searchParams.get("familyPaging") === "true";

    const categories = await categoryService.getCategories({
      page,
      limit,
      search,
      level,
      parentId,
      isActive,
      getAllRelated,
      familyPaging,
    });

    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ status: 500 });
  }
}

// 创建分类
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 验证必填字段
    if (!data.name?.trim()) {
      return NextResponse.json({ error: "分类名称不能为空" }, { status: 400 });
    }
    if (!data.slug?.trim()) {
      return NextResponse.json({ error: "分类标识不能为空" }, { status: 400 });
    }
    if (!data.level || data.level < 1 || data.level > 3) {
      return NextResponse.json({ error: "分类层级无效" }, { status: 400 });
    }
    // showInNavbar 是可选的布尔值，无需特定验证，除非有更复杂规则

    const category = await categoryService.createCategory(data);

    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ status: 500 });
  }
}
