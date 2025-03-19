import { useQuery } from "@tanstack/react-query";

// 定义Brand类型
export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 分页响应接口
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API调用函数
const fetchBrands = async (): Promise<Brand[]> => {
  const response = await fetch(`/api/brands`);

  if (!response.ok) {
    throw new Error("获取品牌列表失败");
  }

  const data = await response.json();

  return data.items || data;
};

export function useBrands() {
  // 查询品牌列表
  const brandsQuery = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
  });

  return {
    // 查询状态和数据
    brands: brandsQuery.data || [],
    isLoading: brandsQuery.isLoading,
    error: brandsQuery.error,
  };
}
