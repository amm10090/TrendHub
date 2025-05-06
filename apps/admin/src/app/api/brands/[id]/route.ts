import { NextResponse } from "next/server";

import { brandService } from "@/lib/services/brand.service";

interface RouteParams {
  params: {
    id: string;
  };
}

// 获取单个品牌
export async function GET(_: Request, context: Promise<RouteParams>) {
  try {
    const { params } = await context;
    const { id } = await params;
    const brand = await brandService.getBrand(id);

    if (!brand) {
      return NextResponse.json({ error: "品牌不存在" }, { status: 404 });
    }

    return NextResponse.json(brand);
  } catch {
    return NextResponse.json({ error: "获取品牌失败" }, { status: 500 });
  }
}

// 更新品牌
export async function PUT(request: Request, context: Promise<RouteParams>) {
  try {
    const { params } = await context;
    const { id } = await params;
    const data = await request.json();
    const brand = await brandService.updateBrand(id, data);

    return NextResponse.json(brand);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "更新品牌失败";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// 删除品牌
export async function DELETE(_: Request, context: Promise<RouteParams>) {
  try {
    const { params } = await context;
    const { id } = await params;

    await brandService.deleteBrand(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "删除品牌失败";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
