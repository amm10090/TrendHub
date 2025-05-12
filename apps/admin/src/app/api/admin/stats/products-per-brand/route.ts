import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 7;

    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json(
        { error: "Limit 参数必须是一个正整数" },
        { status: 400 },
      );
    }

    const brandsWithProductCount = await db.brand.findMany({
      where: {
        isActive: true, // 只统计活跃品牌的产品
      },
      include: {
        _count: {
          select: {
            products: {
              where: { isDeleted: false }, // 只统计未删除的产品
            },
          },
        },
      },
    });

    let result = brandsWithProductCount.map((brand) => ({
      id: brand.id,
      name: brand.name,
      productCount: brand._count.products,
    }));

    result.sort((a, b) => b.productCount - a.productCount);

    result = result.slice(0, limit);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "获取品牌产品统计失败" },
      { status: 500 },
    );
  }
}
