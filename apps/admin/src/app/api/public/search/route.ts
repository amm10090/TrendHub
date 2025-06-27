import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

// Lightweight search API for navbar search suggestions
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse parameters
  const query = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "8"); // Default 8 suggestions

  // Validate query
  if (!query || query.trim().length < 2) {
    return NextResponse.json({
      data: [],
      suggestions: [],
    });
  }

  const searchTerm = query.trim();

  try {
    // Build search conditions
    const where: Prisma.ProductWhereInput = {
      isDeleted: false,
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { sku: { contains: searchTerm, mode: "insensitive" } },
        {
          brand: {
            name: { contains: searchTerm, mode: "insensitive" },
          },
        },
      ],
    };

    // Get products for suggestions
    const products = await db.product.findMany({
      where,
      take: limit,
      orderBy: [
        { isNew: "desc" }, // Prioritize new products
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        images: true,
        sku: true,
        gender: true,
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Get brand suggestions
    const brands = await db.brand.findMany({
      where: {
        name: { contains: searchTerm, mode: "insensitive" },
        isActive: true,
      },
      take: 3,
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
      },
    });

    // Format products for suggestions
    const productSuggestions = products.map((product) => ({
      id: product.id,
      type: "product" as const,
      name: product.name,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || null,
      image: product.images?.[0] || null,
      brandName: product.brand?.name || null,
      brandSlug: product.brand?.slug || null,
      categoryName: product.category?.name || null,
      categorySlug: product.category?.slug || null,
      gender: product.gender as ("women" | "men" | "unisex") | null,
      url: `/products/${product.id}`,
    }));

    // Format brands for suggestions
    const brandSuggestions = brands.map((brand) => ({
      id: brand.id,
      type: "brand" as const,
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo,
      url: `/brands/${brand.slug}`,
    }));

    // Combine suggestions
    const allSuggestions = [...productSuggestions, ...brandSuggestions].slice(
      0,
      limit,
    );

    return NextResponse.json({
      data: allSuggestions,
      query: searchTerm,
      totalResults: products.length + brands.length,
    });
  } catch (error) {
    console.error("Search suggestions failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch search suggestions" },
      { status: 500 },
    );
  }
}
