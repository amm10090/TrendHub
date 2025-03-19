import { NextResponse } from "next/server";

import { brandService } from "@/lib/services/brand.service";

interface RouteParams {
  params: {
    id: string;
  };
}

// 获取单个品牌
export async function GET(_: Request, { params }: RouteParams) {
  try {
    const brand = await brandService.getBrand(params.id);

    if (!brand) {
      return NextResponse.json({ error: "品牌不存在" }, { status: 404 });
    }

    return NextResponse.json(brand);
  } catch {
    return NextResponse.json({ error: "获取品牌失败" }, { status: 500 });
  }
}

// 更新品牌
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const data = await request.json();
    const brand = await brandService.updateBrand(params.id, data);

    return NextResponse.json(brand);
  } catch {
    return NextResponse.json({ error: "更新品牌失败" }, { status: 500 });
  }
}

// 删除品牌
export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    await brandService.deleteBrand(params.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ status: 500 });
  }
}
