import { NextResponse } from "next/server";

import { categoryService } from "@/lib/services/category.service";

interface RouteParams {
  params: {
    id: string;
  };
}

// 获取单个分类
export async function GET(_: Request, { params }: RouteParams) {
  try {
    const category = await categoryService.getCategory(params.id);

    if (!category) {
      return NextResponse.json({ error: "分类不存在" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "获取分类失败" }, { status: 500 });
  }
}

// 更新分类
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const data = await request.json();
    const category = await categoryService.updateCategory(params.id, data);

    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "更新分类失败" }, { status: 500 });
  }
}

// 删除分类
export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    await categoryService.deleteCategory(params.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除分类失败" }, { status: 500 });
  }
}
