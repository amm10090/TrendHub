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
    const resolvedParams = await params;
    const category = await categoryService.getCategory(resolvedParams.id);

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
    const resolvedParams = await params;
    const category = await categoryService.updateCategory(
      resolvedParams.id,
      data,
    );

    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "更新分类失败" }, { status: 500 });
  }
}

// 删除分类
export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;

    await categoryService.deleteCategory(resolvedParams.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除分类失败" }, { status: 500 });
  }
}
