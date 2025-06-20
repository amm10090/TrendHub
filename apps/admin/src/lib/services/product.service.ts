import { PrismaClient, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

import { db } from "@/lib/db";

// 定义Product类型，使用内联类型定义
export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number; // 转换为 number 类型以便前端使用
  originalPrice: number | null;
  discount: number | null;
  sku: string;
  inventory: number;
  status: string;
  images: string[];
  videos: string[];
  colors: string[];
  sizes: string[];
  tags: string[];
  material: string | null;
  cautions: string | null;
  promotionUrl: string | null;
  source: string | null;
  url: string | null;
  adurl: string | null;
  coupon: string | null;
  couponDescription: string | null;
  couponExpirationDate: Date | null;
  gender: string | null;
  isFeatured: boolean;
  isOnSale: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string;
  brandId: string;
  brand: {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    logo: string | null;
    website: string | null;
    isActive: boolean;
    popularity: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  category: {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    parentId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};

// Base type for API, accepting numbers for prices
type ProductApiData = Product;

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

// Base type for creation, using number for price fields
export type CreateProductData = Omit<
  ProductApiData,
  "id" | "brand" | "category" | "createdAt" | "updatedAt" | "isDeleted"
>;

// Update type is partial and also uses number for price fields
export type UpdateProductData = Partial<CreateProductData>;

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

  // 辅助方法：将 Prisma 对象转换为 Product 类型
  private convertPrismaToProduct(
    prismaProduct: Record<string, unknown>,
  ): Product {
    return {
      ...prismaProduct,
      price:
        typeof prismaProduct.price === "object"
          ? parseFloat((prismaProduct.price as Decimal).toString())
          : (prismaProduct.price as number),
      originalPrice: prismaProduct.originalPrice
        ? typeof prismaProduct.originalPrice === "object"
          ? parseFloat((prismaProduct.originalPrice as Decimal).toString())
          : (prismaProduct.originalPrice as number)
        : null,
      discount: prismaProduct.discount
        ? typeof prismaProduct.discount === "object"
          ? parseFloat((prismaProduct.discount as Decimal).toString())
          : (prismaProduct.discount as number)
        : null,
      isFeatured: (prismaProduct.isFeatured as boolean) ?? false,
      isOnSale: (prismaProduct.isOnSale as boolean) ?? false,
    } as Product;
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
      minPrice,
      maxPrice,
    } = params;

    // 构建查询条件
    const where: Prisma.ProductWhereInput = {
      isDeleted: false,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { brand: { name: { contains: search, mode: "insensitive" } } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(brandId && { brandId }),
      ...(status && { status }),
    };

    if (minPrice) {
      where.price = {
        ...(where.price as Prisma.DecimalFilter),
        gte: new Prisma.Decimal(minPrice),
      };
    }
    if (maxPrice) {
      where.price = {
        ...(where.price as Prisma.DecimalFilter),
        lte: new Prisma.Decimal(maxPrice),
      };
    }

    // 执行查询
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          brand: true,
          category: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: products.map((item) => this.convertPrismaToProduct(item)),
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
      return this.convertPrismaToProduct(product);
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

      return this.convertPrismaToProduct(product);
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

    return this.convertPrismaToProduct(updatedProduct);
  }

  // 删除商品（软删除）
  async deleteProduct(id: string): Promise<Product> {
    const product = await this.getProduct(id);

    if (!product) {
      throw new Error("Product not found");
    }

    const deletedProduct = await this.prisma.product.update({
      where: { id },
      data: { isDeleted: true },
      include: {
        category: true,
        brand: true,
      },
    });

    return this.convertPrismaToProduct(deletedProduct);
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
