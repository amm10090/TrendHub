import { NextResponse } from "next/server";

import { productService } from "@/lib/services/product.service";

// 获取商品列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || undefined;
    const brand = searchParams.get("brand") || undefined;
    const status = searchParams.get("status") || undefined;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as
      | "asc"
      | "desc";

    const products = await productService.getProducts({
      page,
      limit,
      search,
      category,
      brand,
      status,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(products);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

// 创建商品
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const product = await productService.createProduct(data);

    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}

// 批量删除商品
export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { error: "Invalid request: ids must be an array" },
        { status: 400 },
      );
    }
    const count = await productService.deleteProducts(ids);

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete products" },
      { status: 500 },
    );
  }
}
