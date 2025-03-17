import { NextResponse } from "next/server";

import { productService } from "@/lib/services/product.service";

// 获取单个商品
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const product = await productService.getProduct(params.id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

// 更新商品
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const data = await request.json();
    const product = await productService.updateProduct(params.id, data);

    return NextResponse.json(product);
  } catch (error) {
    if ((error as Error).message === "Product not found") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

// 删除单个商品
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const product = await productService.deleteProduct(params.id);

    return NextResponse.json(product);
  } catch (error) {
    if ((error as Error).message === "Product not found") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
