import { PrismaClient, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

import { db } from "@/lib/db";

// 定义Product类型
export type Product = {
  id: string;
  name: string;
  brandId: string;
  categoryId: string;
  brand?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
  price: number | Decimal;
  originalPrice?: number | Decimal | null;
  discount?: number | Decimal | null;
  status: string;
  description?: string;
  images?: string[];
  videos?: string[];
  inventory: number;
  sku: string;
  source?: string;
  colors: string[];
  sizes: string[];
  material?: string;
  cautions?: string;
  promotionUrl?: string;
  coupon?: string | null;
  couponDescription?: string | null;
  couponExpirationDate?: Date | string | null;
  tags?: string[];
  gender?: "women" | "men" | "unisex" | string | null;
  isDeleted: boolean;
  isNew?: boolean;
  updatedAt: Date;
  createdAt: Date;
};

// 定义查询参数接口
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  minPrice?: number;
  maxPrice?: number;
  hasCoupon?: boolean;
  hasDiscount?: boolean;
}

// 定义创建商品的数据接口
export interface CreateProductData {
  name: string;
  brandId: string;
  categoryId: string;
  price: number;
  status: string;
  description?: string;
  images?: string[];
  inventory: number;
  sku: string;
  source: string;
  colors?: string[];
  sizes?: string[];
  material?: string;
  cautions?: string;
  promotionUrl?: string;
  tags?: string[];
  originalPrice?: number | null;
  discount?: number | null;
  coupon?: string | null;
  couponDescription?: string | null;
  couponExpirationDate?: string | null;
  gender?: "women" | "men" | "unisex" | null;
}

// 定义更新商品的数据接口
export interface UpdateProductData {
  name?: string;
  brandId?: string;
  categoryId?: string;
  price?: number;
  status?: string;
  description?: string;
  images?: string[];
  videos?: string[];
  inventory?: number;
  sku?: string;
  source?: string;
  colors?: string[];
  sizes?: string[];
  material?: string;
  cautions?: string;
  promotionUrl?: string;
  tags?: string[];
  originalPrice?: number | null;
  discount?: number | null;
  coupon?: string | null;
  couponDescription?: string | null;
  couponExpirationDate?: string | null;
  gender?: "women" | "men" | "unisex" | null;
}

// 定义分页响应接口
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ProductService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = db;
  }

  // 获取商品列表，支持分页、搜索和筛选
  async getProducts(
    params: ProductQueryParams,
  ): Promise<PaginatedResponse<Product>> {
    const {
      page = 1,
      limit = 10,
      search = "",
      categoryId,
      brandId,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    // 构建查询条件
    const where: Prisma.ProductWhereInput = {
      isDeleted: false,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          {
            description: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(brandId && { brandId }),
      ...(status && { status }),
    };

    // 执行查询
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: true,
          brand: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        price:
          typeof item.price === "object"
            ? parseFloat(item.price.toString())
            : item.price,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 获取单个商品
  async getProduct(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findFirst({
      where: { id, isDeleted: false },
      include: {
        category: true,
        brand: true,
      },
    });

    if (product) {
      return {
        ...product,
        price:
          typeof product.price === "object"
            ? parseFloat(product.price.toString())
            : product.price,
      };
    }

    return null;
  }

  // 创建商品
  async createProduct(data: CreateProductData): Promise<Product> {
    try {
      // 验证必填字段
      if (!data.name?.trim()) {
        throw new Error("商品名称不能为空");
      }
      if (!data.brandId) {
        throw new Error("品牌不能为空");
      }
      if (!data.categoryId) {
        throw new Error("分类不能为空");
      }
      if (data.price === undefined || data.price < 0) {
        throw new Error("商品价格无效");
      }
      if (!data.sku?.trim()) {
        throw new Error("SKU不能为空");
      }

      // 检查品牌是否存在
      const brand = await this.prisma.brand.findUnique({
        where: { id: data.brandId },
      });

      if (!brand) {
        throw new Error(`品牌ID '${data.brandId}' 不存在，请选择有效的品牌`);
      }

      // 检查分类是否存在
      const category = await this.prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new Error(`分类ID '${data.categoryId}' 不存在，请选择有效的分类`);
      }

      // 检查SKU是否已存在
      const existingSku = await this.prisma.product.findFirst({
        where: { sku: data.sku },
      });

      if (existingSku) {
        throw new Error(`SKU '${data.sku}' 已存在，请使用其他SKU`);
      }

      const {
        brandId,
        categoryId,
        price,
        originalPrice,
        discount,
        couponExpirationDate,
        colors,
        sizes,
        tags,
        images,
        gender,
        ...restOfData
      } = data;

      const createInputData: Prisma.ProductCreateInput = {
        ...restOfData,
        price: new Decimal(price.toString()),
        brand: { connect: { id: brandId } },
        category: { connect: { id: categoryId } },
        colors: colors || [],
        sizes: sizes || [],
        images: images || [],
        // videos: videos || [], // 如果 CreateProductData 中有 videos
        tags: tags || [],
        gender: gender,
        ...(originalPrice !== undefined &&
          originalPrice !== null && {
            originalPrice: new Decimal(originalPrice.toString()),
          }),
        ...(discount !== undefined &&
          discount !== null && { discount: new Decimal(discount.toString()) }),
        ...(couponExpirationDate !== undefined &&
          couponExpirationDate !== null && {
            couponExpirationDate: new Date(couponExpirationDate),
          }),
      };

      const product = await this.prisma.product.create({
        data: createInputData,
        include: {
          category: true,
          brand: true,
        },
      });

      return {
        ...product,
        price:
          typeof product.price === "object"
            ? parseFloat(product.price.toString())
            : product.price,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "创建商品失败";

      throw new Error(errorMessage);
    }
  }

  // 更新商品
  async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
    const product = await this.getProduct(id);

    if (!product) {
      throw new Error("Product not found");
    }

    const {
      brandId,
      categoryId,
      price,
      originalPrice,
      discount,
      couponExpirationDate,
      gender,
      ...restOfData
    } = data;

    const updateInputData: Prisma.ProductUpdateInput = {
      ...restOfData,
      ...(price !== undefined && { price: new Decimal(price.toString()) }),
      ...(brandId && { brand: { connect: { id: brandId } } }),
      ...(categoryId && { category: { connect: { id: categoryId } } }),
      ...(gender !== undefined && { gender: gender }),
      ...(originalPrice !== undefined &&
        originalPrice !== null && {
          originalPrice: new Decimal(originalPrice.toString()),
        }),
      ...(discount !== undefined &&
        discount !== null && { discount: new Decimal(discount.toString()) }),
      ...(couponExpirationDate !== undefined &&
        couponExpirationDate !== null && {
          couponExpirationDate: new Date(couponExpirationDate),
        }),
      // 注意：对于数组类型如 colors, sizes, tags, images, videos，如果允许在更新时完全替换或清空，
      // 它们应该已经包含在 restOfData 中 (如果 UpdateProductData 定义正确)，或者需要像下面这样显式处理：
      // ...(data.tags !== undefined && { tags: data.tags }),
      // 当前 UpdateProductData 中的数组字段已经是可选的，所以它们会通过 restOfData 传递 (如果存在于 data 中)
    };

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateInputData,
      include: {
        category: true,
        brand: true,
      },
    });

    return {
      ...updatedProduct,
      price:
        typeof updatedProduct.price === "object"
          ? parseFloat(updatedProduct.price.toString())
          : updatedProduct.price,
      gender: updatedProduct.gender as Product["gender"],
    };
  }

  // 删除商品（软删除）
  async deleteProduct(id: string): Promise<Product> {
    const product = await this.getProduct(id);

    if (!product) {
      throw new Error("Product not found");
    }

    return this.prisma.product.update({
      where: { id },
      data: { isDeleted: true },
      include: {
        category: true,
        brand: true,
      },
    });
  }

  // 批量删除商品
  async deleteProducts(ids: string[]): Promise<number> {
    const result = await this.prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { isDeleted: true },
    });

    return result.count;
  }

  // 获取商品统计信息
  async getProductStats() {
    const [total, lowStock, outOfStock] = await Promise.all([
      this.prisma.product.count({ where: { isDeleted: false } }),
      this.prisma.product.count({
        where: {
          isDeleted: false,
          status: "Low Stock",
        },
      }),
      this.prisma.product.count({
        where: {
          isDeleted: false,
          inventory: 0,
        },
      }),
    ]);

    return { total, lowStock, outOfStock };
  }
}

// 导出单例实例
export const productService = new ProductService();
