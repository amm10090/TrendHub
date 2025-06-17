import { NextRequest, NextResponse } from "next/server";

import { brandService } from "@/lib/services/brand.service";

// 获取品牌列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || undefined;
    const isActive = searchParams.get("isActive");
    const popularity = searchParams.get("popularity");
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder =
      (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

    const result = await brandService.getBrands({
      page,
      limit,
      search,
      isActive: isActive !== null ? isActive === "true" : undefined,
      popularity: popularity !== null ? popularity === "true" : undefined,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching brands:", error);

    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 },
    );
  }
}

// 创建品牌
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const brand = await brandService.createBrand(body);

    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    console.error("Error creating brand:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create brand",
      },
      { status: 400 },
    );
  }
}

// 批量操作端点
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ids } = body;

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Missing action or ids" },
        { status: 400 },
      );
    }

    let result;

    switch (action) {
      case "activate":
        result = await brandService.updateBrandsStatus(ids, true);
        break;
      case "deactivate":
        result = await brandService.updateBrandsStatus(ids, false);
        break;
      case "delete":
        result = await brandService.deleteBrands(ids);
        break;
      case "set_popular":
        result = await brandService.updateBrandsPopularity(ids, true);
        break;
      case "unset_popular":
        result = await brandService.updateBrandsPopularity(ids, false);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      count: result,
      message: `${result} brands ${action}d successfully`,
    });
  } catch (error) {
    console.error("Error in bulk operation:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Bulk operation failed",
      },
      { status: 500 },
    );
  }
}
