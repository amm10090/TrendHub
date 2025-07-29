import { useState } from "react";
import useSWR from "swr";

import type {
  Category,
  CategoryTreeNode,
  CreateCategoryData,
  UpdateCategoryData,
} from "@/lib/services/category.service";

interface UseCategoriesOptions {
  page?: number;
  limit?: number;
  search?: string;
  level?: number;
  parentId?: string;
  isActive?: boolean;
  getAllRelated?: boolean;
  familyPaging?: boolean;
}

// 添加 fetcher 函数
const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("请求失败");
  }

  return response.json();
};

export function useCategories(options: UseCategoriesOptions = {}) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 构建查询参数
  const queryParams = new URLSearchParams();

  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  // 获取分类列表
  const {
    data: categoriesData,
    error: categoriesError,
    mutate: mutateCategories,
  } = useSWR<{
    items: Category[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/api/categories?${queryParams.toString()}`, fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
    dedupingInterval: 5000, // 5秒内重复请求会被去重
    errorRetryCount: 3, // 最多重试3次
  });

  // 获取分类树
  const {
    data: categoryTree,
    error: categoryTreeError,
    mutate: mutateCategoryTree,
  } = useSWR<CategoryTreeNode[]>("/api/categories/tree", fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    errorRetryCount: 3,
  });

  // 创建分类
  const createCategory = async (data: CreateCategoryData) => {
    try {
      setIsCreating(true);
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("创建分类失败");
      }

      const newCategory = await response.json();

      await Promise.all([mutateCategories(), mutateCategoryTree()]);

      return newCategory;
    } catch {
      const errorMessage =
        error instanceof Error ? error.message : "创建分类失败";

      throw new Error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // 更新分类
  const updateCategory = async (id: string, data: UpdateCategoryData) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("更新分类失败");
      }

      const updatedCategory = await response.json();

      await Promise.all([mutateCategories(), mutateCategoryTree()]);

      return updatedCategory;
    } catch {
      const errorMessage =
        error instanceof Error ? error.message : "更新分类失败";

      throw new Error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  // 删除分类
  const deleteCategory = async (id: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("删除分类失败");
      }

      await Promise.all([mutateCategories(), mutateCategoryTree()]);

      return { success: true };
    } catch {
      const errorMessage =
        error instanceof Error ? error.message : "删除分类失败";

      throw new Error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // 更新分类状态
  const updateCategoryStatus = async (id: string, isActive: boolean) => {
    return await updateCategory(id, { isActive });
  };

  return {
    categories: categoriesData?.items || [],
    totalCategories: categoriesData?.total || 0,
    currentPage: categoriesData?.page || 1,
    totalPages: categoriesData?.totalPages || 1,
    categoryTree: categoryTree || [],
    isLoading: !categoriesError && !categoriesData,
    isError: categoriesError || categoryTreeError,
    isCreating,
    isUpdating,
    isDeleting,
    createCategory,
    updateCategory,
    deleteCategory,
    updateCategoryStatus,
    mutateCategories,
    mutateCategoryTree,
  };
}
