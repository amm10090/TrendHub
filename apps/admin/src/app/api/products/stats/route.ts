import { NextResponse } from "next/server";

import { productService } from "@/lib/services/product.service";

// 获取商品统计信息
export async function GET() {
  try {
    const stats = await productService.getProductStats();

    return NextResponse.json(stats);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch product statistics" },
      { status: 500 },
    );
  }
}
