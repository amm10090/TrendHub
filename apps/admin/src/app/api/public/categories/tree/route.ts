import { NextResponse } from "next/server";

import { categoryService } from "@/lib/services/category.service";

// GET: /api/public/categories/tree
// 获取用于前端导航的公共分类树结构
// 该树只包含 isActive: true 和 showInNavbar: true 的分类及其子分类
export async function GET() {
  try {
    const categoryTree = await categoryService.getCategoryTree();
    return NextResponse.json(categoryTree);
  } catch (error) {
    // 考虑记录更详细的错误日志
    console.error(
      "[API_PUBLIC_CATEGORIES_TREE] Error fetching category tree:",
      error,
    );
    return NextResponse.json(
      {
        error: "获取分类导航数据失败",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
