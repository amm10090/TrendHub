import { PrismaClient, Prisma } from "@prisma/client";

import { db } from "@/lib/db";

// 定义Brand类型
export type Brand = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  popularity: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// 定义查询参数接口
export interface BrandQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  popularity?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// 定义创建品牌的数据接口
export interface CreateBrandData {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive?: boolean;
  popularity?: boolean;
}

// 定义更新品牌的数据接口
export interface UpdateBrandData {
  name?: string;
  slug?: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive?: boolean;
  popularity?: boolean;
}

// 定义分页响应接口
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class BrandService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = db;
  }

  // 映射前端排序字段到数据库字段 - 不再需要临时映射
  private mapSortField(field: string): string {
    // 所有字段已在数据库中定义，无需映射
    return field;
  }

  // 获取品牌列表，支持分页、搜索和筛选
  async getBrands(
    params: BrandQueryParams = {},
  ): Promise<PaginatedResponse<Brand>> {
    const {
      page = 1,
      limit = 10,
      search = "",
      isActive,
      popularity,
      sortBy = "name",
      sortOrder = "asc",
    } = params;

    // 构建查询条件
    const where: Prisma.BrandWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
      ...(popularity !== undefined && { popularity }),
    };

    // 处理排序字段
    const orderByField = this.mapSortField(sortBy);

    // 执行查询
    const [items, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderByField]: sortOrder },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          website: true,
          isActive: true,
          popularity: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.brand.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 获取单个品牌
  async getBrand(id: string): Promise<Brand | null> {
    return this.prisma.brand.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        website: true,
        isActive: true,
        popularity: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // 通过 slug 查找单个品牌
  async findOneBySlug(
    slug: string,
    options: { isActive?: boolean } = {},
  ): Promise<Brand | null> {
    try {
      // 构建查询条件
      const where: Prisma.BrandWhereInput = {
        slug,
        // 如果指定了 isActive，则添加到查询条件中
        ...(options.isActive !== undefined && { isActive: options.isActive }),
      };

      return this.prisma.brand.findFirst({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          website: true,
          isActive: true,
          popularity: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw new Error(
        `查找品牌失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  }

  // 创建品牌
  async createBrand(data: CreateBrandData): Promise<Brand> {
    try {
      // 验证必填字段
      if (!data.name?.trim()) {
        throw new Error("品牌名称不能为空");
      }
      if (!data.slug?.trim()) {
        throw new Error("品牌标识不能为空");
      }

      // 检查品牌名称是否已存在
      const existingName = await this.prisma.brand.findUnique({
        where: { name: data.name },
      });

      if (existingName) {
        throw new Error(`品牌名称 '${data.name}' 已存在`);
      }

      // 检查品牌标识是否已存在
      const existingSlug = await this.prisma.brand.findUnique({
        where: { slug: data.slug },
      });

      if (existingSlug) {
        throw new Error(`品牌标识 '${data.slug}' 已存在`);
      }

      // 创建品牌
      return this.prisma.brand.create({
        data: {
          ...data,
          isActive: data.isActive ?? true, // 默认为激活状态
          popularity: data.popularity ?? false, // 默认非热门
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          website: true,
          isActive: true,
          popularity: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "创建品牌失败";

      throw new Error(errorMessage);
    }
  }

  // 更新品牌
  async updateBrand(id: string, data: UpdateBrandData): Promise<Brand> {
    try {
      // 验证品牌是否存在
      const existingBrand = await this.getBrand(id);

      if (!existingBrand) {
        throw new Error("品牌不存在");
      }

      // 如果更新了名称，检查名称是否已被其他品牌使用
      if (data.name && data.name !== existingBrand.name) {
        const existingName = await this.prisma.brand.findFirst({
          where: {
            name: data.name,
            id: { not: id },
          },
        });

        if (existingName) {
          throw new Error(`品牌名称 '${data.name}' 已存在`);
        }
      }

      // 如果更新了标识，检查标识是否已被其他品牌使用
      if (data.slug && data.slug !== existingBrand.slug) {
        const existingSlug = await this.prisma.brand.findFirst({
          where: {
            slug: data.slug,
            id: { not: id },
          },
        });

        if (existingSlug) {
          throw new Error(`品牌标识 '${data.slug}' 已存在`);
        }
      }

      // 更新品牌
      return this.prisma.brand.update({
        where: { id },
        data,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "更新品牌失败";

      throw new Error(errorMessage);
    }
  }

  // 删除品牌
  async deleteBrand(id: string): Promise<Brand> {
    try {
      // 验证品牌是否存在
      const existingBrand = await this.getBrand(id);

      if (!existingBrand) {
        throw new Error("品牌不存在");
      }

      // 检查是否有关联的商品
      const relatedProducts = await this.prisma.product.findFirst({
        where: { brandId: id },
      });

      if (relatedProducts) {
        throw new Error("无法删除已关联商品的品牌");
      }

      // 删除品牌
      return this.prisma.brand.delete({
        where: { id },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "删除品牌失败";

      throw new Error(errorMessage);
    }
  }

  // 批量更新品牌状态
  async updateBrandsStatus(ids: string[], isActive: boolean): Promise<number> {
    const result = await this.prisma.brand.updateMany({
      where: { id: { in: ids } },
      data: { isActive },
    });

    return result.count;
  }
}

// 导出单例实例
export const brandService = new BrandService();
