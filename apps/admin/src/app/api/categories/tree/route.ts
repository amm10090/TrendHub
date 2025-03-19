import { NextResponse } from "next/server";

import { categoryService } from "@/lib/services/category.service";

// 获取分类树结构
export async function GET() {
  try {
    const categoryTree = await categoryService.getCategoryTree();

    return NextResponse.json(categoryTree);
  } catch {
    return NextResponse.json({ error: "获取分类树失败" }, { status: 500 });
  }
}
