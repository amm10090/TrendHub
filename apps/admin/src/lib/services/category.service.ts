import { PrismaClient, Prisma } from "@prisma/client";

import { db } from "@/lib/db";

// 定义Category类型
export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  level: number;
  parentId?: string;
  parentName?: string;
  image?: string;
  isActive: boolean;
  showInNavbar?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// 定义分类树节点类型
export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  parentName?: string;
}

// 定义查询参数接口
export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  level?: number;
  parentId?: string;
  isActive?: boolean;
  getAllRelated?: boolean; // 是否获取所有相关分类（包括子分类的子分类）
  familyPaging?: boolean; // 是否按分类家族为单位进行分页
}

// 定义创建分类的数据接口
export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  level: number;
  parentId?: string;
  image?: string;
  isActive?: boolean;
  showInNavbar?: boolean;
}

// 定义更新分类的数据接口
export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  level?: number;
  parentId?: string;
  image?: string;
  isActive?: boolean;
  showInNavbar?: boolean;
}

// 定义分页响应接口
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class CategoryService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = db;
  }

  // 获取分类列表，支持分页、搜索和筛选
  async getCategories(
    params: CategoryQueryParams = {},
  ): Promise<PaginatedResponse<Category>> {
    const {
      page = 1,
      limit = 10,
      search = "",
      level,
      parentId,
      isActive,
      getAllRelated = false,
      familyPaging = false,
    } = params;

    // 构建查询条件
    const where: Prisma.CategoryWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(level !== undefined && { level }),
      ...(isActive !== undefined && { isActive }),
    };

    const allDbCategories = await this.prisma.category.findMany({
      where,
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });

    const parentIdToNameMap = new Map<string, string>();

    allDbCategories.forEach((cat) => {
      if (cat.id && cat.name) {
        parentIdToNameMap.set(cat.id, cat.name);
      }
    });

    // Helper to add parentName consistently
    const addParentNameToCategory = (
      dbCat: (typeof allDbCategories)[0],
    ): Category => ({
      ...dbCat,
      createdAt: new Date(dbCat.createdAt), // Ensure Date type
      updatedAt: new Date(dbCat.updatedAt), // Ensure Date type
      parentName: dbCat.parentId
        ? parentIdToNameMap.get(dbCat.parentId)
        : undefined,
    });

    let processedCategories: Category[] = [];

    if (parentId) {
      const parentCategoryFromDb = allDbCategories.find(
        (cat) => cat.id === parentId,
      );

      if (getAllRelated) {
        const childDbCategories = allDbCategories.filter(
          (cat) => cat.parentId === parentId,
        );
        const childIds = childDbCategories.map((cat) => cat.id);
        const grandChildDbCategories = allDbCategories.filter((cat) =>
          childIds.includes(cat.parentId || ""),
        );

        if (parentCategoryFromDb) {
          processedCategories.push(
            addParentNameToCategory(parentCategoryFromDb),
          );
        }
        processedCategories.push(
          ...childDbCategories.map(addParentNameToCategory),
        );
        processedCategories.push(
          ...grandChildDbCategories.map(addParentNameToCategory),
        );
      } else {
        const directChildDbCategories = allDbCategories.filter(
          (cat) => cat.parentId === parentId,
        );

        if (parentCategoryFromDb) {
          processedCategories.push(
            addParentNameToCategory(parentCategoryFromDb),
          );
        }
        processedCategories.push(
          ...directChildDbCategories.map(addParentNameToCategory),
        );
      }
    } else {
      processedCategories = allDbCategories.map(addParentNameToCategory);
    }

    if (familyPaging) {
      const treeOrderedCategories = this.organizeTreeOrder(processedCategories);
      const categoryFamilies = this.splitCategoriesByFamily(
        treeOrderedCategories,
      );
      const totalFamilies = categoryFamilies.length;
      const familiesPerPage = Math.max(1, Math.floor(limit / 10));
      const startFamilyIndex = (page - 1) * familiesPerPage;
      const endFamilyIndex = Math.min(
        startFamilyIndex + familiesPerPage,
        totalFamilies,
      );
      const paginatedFamilyItems = categoryFamilies
        .slice(startFamilyIndex, endFamilyIndex)
        .flat();

      return {
        items: paginatedFamilyItems, // These items already include parentName
        total: treeOrderedCategories.length, // Total items in all relevant families
        page,
        limit, // This 'limit' is the requested item limit, not family limit
        totalPages: Math.ceil(totalFamilies / familiesPerPage),
      };
    }

    // Traditional pagination
    processedCategories.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;

      return a.name.localeCompare(b.name);
    });

    const startIndex = (page - 1) * limit;
    const paginatedItems = processedCategories.slice(
      startIndex,
      startIndex + limit,
    );
    const sortedItems = this.sortCategoriesForDisplay(paginatedItems);

    return {
      items: sortedItems, // These items already include parentName
      total: processedCategories.length,
      page,
      limit,
      totalPages: Math.ceil(processedCategories.length / limit),
    };
  }

  // 按照树形结构排序分类
  private organizeTreeOrder(categories: Category[]): Category[] {
    const treeOrderedCategories: Category[] = [];

    // 先获取所有一级分类并排序
    const level1Categories = categories
      .filter((cat) => cat.level === 1)
      .sort((a, b) => a.name.localeCompare(b.name));

    // 对每个一级分类，添加它及其所有子分类和孙子分类
    level1Categories.forEach((parent) => {
      // 添加一级分类
      treeOrderedCategories.push(parent);

      // 添加属于该一级分类的所有二级分类
      const children = categories
        .filter((cat) => cat.level === 2 && cat.parentId === parent.id)
        .sort((a, b) => a.name.localeCompare(b.name));

      children.forEach((child) => {
        // 添加二级分类
        treeOrderedCategories.push(child);

        // 添加属于该二级分类的所有三级分类
        const grandChildren = categories
          .filter((cat) => cat.level === 3 && cat.parentId === child.id)
          .sort((a, b) => a.name.localeCompare(b.name));

        treeOrderedCategories.push(...grandChildren);
      });
    });

    return treeOrderedCategories;
  }

  // 将分类按照家族进行组织和排序
  private organizeCategoriesByFamily(categories: Category[]): Category[] {
    return this.organizeTreeOrder(categories);
  }

  // 将分类列表按照家族分割成多个数组
  private splitCategoriesByFamily(categories: Category[]): Category[][] {
    const families: Category[][] = [];
    let currentFamily: Category[] = [];
    let currentTopLevelId: string | null = null;

    for (const category of categories) {
      if (category.level === 1) {
        // 如果遇到新的顶级分类，先保存当前家族（如果有），然后开始新家族
        if (currentFamily.length > 0) {
          families.push(currentFamily);
        }
        currentFamily = [category];
        currentTopLevelId = category.id;
      } else if (category.level > 1) {
        // 找到当前分类的顶级祖先分类
        let ancestorId = category.parentId;
        let ancestorCategory = categories.find((c) => c.id === ancestorId);

        while (
          ancestorCategory &&
          ancestorCategory.level > 1 &&
          ancestorCategory.parentId
        ) {
          ancestorId = ancestorCategory.parentId;
          ancestorCategory = categories.find((c) => c.id === ancestorId);
        }

        // 如果该分类属于当前家族，添加到当前家族
        if (ancestorId === currentTopLevelId) {
          currentFamily.push(category);
        } else {
          // 否则，寻找该分类的顶级分类，并将其添加到对应的家族
          // 这种情况通常不应该发生，因为分类应该已经按树形结构排序
          // 但为了健壮性，我们仍然处理这种情况
          const topLevelCategory = categories.find((c) => c.id === ancestorId);

          if (topLevelCategory) {
            // 查找或创建该顶级分类的家族
            const familyIndex = families.findIndex(
              (family) => family.length > 0 && family[0].id === ancestorId,
            );

            if (familyIndex === -1) {
              families.push([topLevelCategory, category]);
            } else {
              families[familyIndex].push(category);
            }
          } else {
            // 如果找不到顶级分类，作为单独的家族处理
            families.push([category]);
          }
        }
      }
    }

    // 添加最后一个家族
    if (currentFamily.length > 0) {
      families.push(currentFamily);
    }

    return families;
  }

  // 对分类进行排序以优化显示
  private sortCategoriesForDisplay(items: Category[]): Category[] {
    const sortedItems = [...items];

    // 获取当前所有分类的ID
    const itemIds = new Set(items.map((item) => item.id));

    // 将非一级分类但父级不在当前页面的分类 ID 收集起来
    const orphanItemIds = items
      .filter(
        (item) =>
          item.level > 1 && item.parentId && !itemIds.has(item.parentId),
      )
      .map((item) => item.id);

    if (orphanItemIds.length > 0) {
      // 如果有"孤儿"分类，尝试重新组织顺序
      // 首先获取"孤儿"分类的父类IDs
      const orphanParentIds = new Set(
        items
          .filter(
            (item) =>
              item.level > 1 && item.parentId && !itemIds.has(item.parentId),
          )
          .map((item) => item.parentId),
      );

      // 重新排序，确保一级分类在前，同一父级的分类相邻
      sortedItems.sort((a, b) => {
        // 首先按层级排序
        if (a.level !== b.level) {
          return a.level - b.level;
        }

        // 对于非一级分类，先按父ID分组
        if (a.level > 1 && b.level > 1 && a.parentId && b.parentId) {
          if (a.parentId === b.parentId) {
            return a.name.localeCompare(b.name);
          }
          // 如果其中一个的父ID是"孤儿"父ID，我们尽量把它排到后面
          if (
            orphanParentIds.has(a.parentId) &&
            !orphanParentIds.has(b.parentId)
          ) {
            return 1;
          }
          if (
            !orphanParentIds.has(a.parentId) &&
            orphanParentIds.has(b.parentId)
          ) {
            return -1;
          }
        }

        // 最后按名称排序
        return a.name.localeCompare(b.name);
      });
    }

    return sortedItems;
  }

  // 获取分类树结构 (管理面板用，包含所有子分类)
  async getCategoryTree(): Promise<CategoryTreeNode[]> {
    const categoriesFromDb = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });

    const parentIdToNameMap = new Map(
      categoriesFromDb.map((cat) => [cat.id, cat.name]),
    );

    const buildTree = (
      items: typeof categoriesFromDb,
      parentId: string | null = null,
      level: number = 1,
    ): CategoryTreeNode[] => {
      return items
        .filter((item) => {
          // 对所有层级，只检查parentId、level和isActive，移除showInNavbar条件
          return (
            item.parentId === parentId && item.level === level && item.isActive
          );
        })
        .map((item) => {
          const parentName = item.parentId
            ? parentIdToNameMap.get(item.parentId)
            : undefined;

          return {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
            parentName,
            children: buildTree(items, item.id, level + 1),
          };
        });
    };

    return buildTree(categoriesFromDb);
  }

  // 获取公共分类树结构 (前端导航用，只包含showInNavbar为true的分类)
  async getPublicCategoryTree(): Promise<CategoryTreeNode[]> {
    const categoriesFromDb = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });

    const parentIdToNameMap = new Map(
      categoriesFromDb.map((cat) => [cat.id, cat.name]),
    );

    const buildTree = (
      items: typeof categoriesFromDb,
      parentId: string | null = null,
      level: number = 1,
    ): CategoryTreeNode[] => {
      return items
        .filter((item) => {
          if (level === 1) {
            return (
              item.parentId === parentId &&
              item.level === level &&
              item.isActive
            );
          }

          return (
            item.parentId === parentId &&
            item.level === level &&
            item.isActive &&
            item.showInNavbar === true
          );
        })
        .map((item) => {
          const parentName = item.parentId
            ? parentIdToNameMap.get(item.parentId)
            : undefined;

          return {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
            parentName,
            children: buildTree(items, item.id, level + 1),
          };
        });
    };

    return buildTree(categoriesFromDb);
  }

  // 获取单个分类
  async getCategory(id: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { parent: { select: { name: true } } },
    });

    if (!category) return null;

    return {
      ...category,
      createdAt: new Date(category.createdAt), // Ensure Date type
      updatedAt: new Date(category.updatedAt), // Ensure Date type
      parentName: category.parent?.name,
    };
  }

  // 创建分类
  async createCategory(data: CreateCategoryData): Promise<Category> {
    // 如果有parentId，验证父分类是否存在
    if (data.parentId) {
      const parentCategory = await this.getCategory(data.parentId);

      if (!parentCategory) {
        throw new Error("父分类不存在");
      }
      if (parentCategory.level >= data.level) {
        throw new Error("子分类的层级必须大于父分类");
      }
    } else if (data.level !== 1) {
      throw new Error("顶级分类的层级必须为1");
    }

    // 创建分类时，如果是一级分类，确保parentId为null
    const categoryData = {
      ...data,
      isActive: data.isActive ?? true,
      parentId: data.level === 1 ? null : data.parentId, // 一级分类的parentId必须为null
      showInNavbar:
        data.showInNavbar === undefined
          ? data.level === 2
            ? false
            : undefined
          : data.showInNavbar, // 根据层级和传入值设置
    };

    return this.prisma.category.create({
      data: categoryData,
    });
  }

  // 更新分类
  async updateCategory(
    id: string,
    data: UpdateCategoryData,
  ): Promise<Category> {
    // 验证分类是否存在
    const existingCategory = await this.getCategory(id);

    if (!existingCategory) {
      throw new Error("分类不存在");
    }

    // 如果更新了parentId，进行相关验证
    if (data.parentId && data.parentId !== existingCategory.parentId) {
      const parentCategory = await this.getCategory(data.parentId);

      if (!parentCategory) {
        throw new Error("父分类不存在");
      }
      if (parentCategory.level >= (data.level || existingCategory.level)) {
        throw new Error("子分类的层级必须大于父分类");
      }
    }

    // 更新分类
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  // 删除分类
  async deleteCategory(id: string): Promise<Category> {
    // 检查是否有子分类
    const hasChildren = await this.prisma.category.findFirst({
      where: { parentId: id },
    });

    if (hasChildren) {
      throw new Error("无法删除含有子分类的分类");
    }

    // 检查是否有关联的商品
    const hasProducts = await this.prisma.product.findFirst({
      where: { categoryId: id },
    });

    if (hasProducts) {
      throw new Error("无法删除含有关联商品的分类");
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  // 批量更新分类状态
  async updateCategoriesStatus(
    ids: string[],
    isActive: boolean,
  ): Promise<number> {
    const result = await this.prisma.category.updateMany({
      where: { id: { in: ids } },
      data: { isActive },
    });

    return result.count;
  }

  // 获取分类路径（从顶级分类到当前分类的完整路径）
  async getCategoryPath(id: string): Promise<Category[]> {
    const path: Category[] = [];
    let currentCategory = await this.getCategory(id);

    while (currentCategory) {
      path.unshift(currentCategory);
      if (currentCategory.parentId) {
        currentCategory = await this.getCategory(currentCategory.parentId);
      } else {
        break;
      }
    }

    return path;
  }
}

// 导出单例实例
export const categoryService = new CategoryService();
