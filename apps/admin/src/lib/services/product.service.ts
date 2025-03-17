import { PrismaClient, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

import { db } from "@/lib/db";

// 定义Product类型
export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: Decimal;
  status: string;
  description?: string;
  images?: string[];
  inventory: number;
  isDeleted: boolean;
  updatedAt: Date;
  createdAt: Date;
};

// 定义查询参数接口
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// 定义创建商品的数据接口
export interface CreateProductData {
  name: string;
  brand: string;
  category: string;
  price: number;
  status: string;
  description?: string;
  images?: string[];
  inventory: number;
  sku: string;
}

// 定义更新商品的数据接口
export interface UpdateProductData {
  name?: string;
  brand?: string;
  category?: string;
  price?: number;
  status?: string;
  description?: string;
  images?: string[];
  inventory?: number;
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
    this.prisma = db; // 使用全局 db 实例
  }

  // 获取商品列表，支持分页、搜索和筛选
  async getProducts(
    params: ProductQueryParams,
  ): Promise<
    PaginatedResponse<
      Prisma.ProductGetPayload<{ select: Record<string, never> }>
    >
  > {
    const {
      page = 1,
      limit = 10,
      search = "",
      category,
      brand,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    // 构建查询条件
    const where: Prisma.ProductWhereInput = {
      isDeleted: false,
      ...(search && {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          {
            description: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      }),
      ...(category && { category }),
      ...(brand && { brand }),
      ...(status && { status }),
    };

    // 执行查询
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.product.count({ where }),
    ]);

    // 转换 Decimal 为数字
    const formattedItems = items.map((item) => ({
      ...item,
      price: Number(item.price),
    }));

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 获取单个商品
  async getProduct(
    id: string,
  ): Promise<Prisma.ProductGetPayload<{
    select: Record<string, never>;
  }> | null> {
    const product = await this.prisma.product.findFirst({
      where: { id, isDeleted: false },
    });

    if (product) {
      return {
        ...product,
        price: Number(product.price),
      };
    }

    return null;
  }

  // 创建商品
  async createProduct(
    data: CreateProductData,
  ): Promise<Prisma.ProductGetPayload<{ select: Record<string, never> }>> {
    const product = await this.prisma.product.create({
      data: {
        ...data,
        price: new Decimal(data.price.toString()),
      },
    });

    return {
      ...product,
      price: Number(product.price),
    };
  }

  // 更新商品
  async updateProduct(
    id: string,
    data: UpdateProductData,
  ): Promise<Prisma.ProductGetPayload<{ select: Record<string, never> }>> {
    const product = await this.getProduct(id);

    if (!product) {
      throw new Error("Product not found");
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(data.price && { price: new Decimal(data.price.toString()) }),
      },
    });

    return {
      ...updatedProduct,
      price: Number(updatedProduct.price),
    };
  }

  // 删除商品（软删除）
  async deleteProduct(
    id: string,
  ): Promise<Prisma.ProductGetPayload<{ select: Record<string, never> }>> {
    const product = await this.getProduct(id);

    if (!product) {
      throw new Error("Product not found");
    }

    return this.prisma.product.update({
      where: { id },
      data: { isDeleted: true },
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
