import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type {
  Product,
  CreateProductData,
  UpdateProductData,
  ProductQueryParams,
  PaginatedResponse,
} from "@/lib/services/product.service";

// API调用函数
const fetchProducts = async (
  params: ProductQueryParams,
): Promise<PaginatedResponse<Product>> => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/products?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
};

const createProduct = async (data: CreateProductData): Promise<Product> => {
  const response = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create product");
  }

  return response.json();
};

const updateProduct = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateProductData;
}): Promise<Product> => {
  const response = await fetch(`/api/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update product");
  }

  return response.json();
};

const deleteProduct = async (id: string): Promise<Product> => {
  const response = await fetch(`/api/products/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete product");
  }

  return response.json();
};

const deleteProducts = async (ids: string[]): Promise<{ count: number }> => {
  const response = await fetch("/api/products", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) {
    throw new Error("Failed to delete products");
  }

  return response.json();
};

interface ProductStats {
  total: number;
  lowStock: number;
  outOfStock: number;
}

const fetchProductStats = async (): Promise<ProductStats> => {
  const response = await fetch("/api/products/stats");

  if (!response.ok) {
    throw new Error("Failed to fetch product stats");
  }

  return response.json();
};

export function useProducts(params: ProductQueryParams = {}) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 查询商品列表
  const productsQuery = useQuery({
    queryKey: ["products", params],
    queryFn: () => fetchProducts(params),
  });

  // 查询商品统计
  const statsQuery = useQuery({
    queryKey: ["products", "stats"],
    queryFn: fetchProductStats,
  });

  // 创建商品
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // 更新商品
  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // 删除单个商品
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // 批量删除商品
  const deleteManyMutation = useMutation({
    mutationFn: deleteProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelectedIds([]);
    },
  });

  return {
    // 查询状态和数据
    products: productsQuery.data?.items ?? [],
    total: productsQuery.data?.total ?? 0,
    totalPages: productsQuery.data?.totalPages ?? 0,
    isLoading: productsQuery.isLoading,
    error: productsQuery.error,

    // 统计数据
    stats: statsQuery.data,
    isStatsLoading: statsQuery.isLoading,
    statsError: statsQuery.error,

    // 变更操作
    createProduct: createMutation.mutate,
    updateProduct: updateMutation.mutate,
    deleteProduct: deleteMutation.mutate,
    deleteProducts: deleteManyMutation.mutate,

    // 选择状态管理
    selectedIds,
    setSelectedIds,

    // 变更状态
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDeletingMany: deleteManyMutation.isPending,
  };
}
