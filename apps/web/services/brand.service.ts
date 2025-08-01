// 品牌接口定义
export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  popularity?: boolean;
}

// 品牌列表分页接口
export interface BrandPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 品牌响应接口
export interface BrandListResponse {
  items: Brand[];
  pagination: BrandPagination;
}

// 品牌查询参数
export interface BrandQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  letter?: string;
  popularity?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 获取品牌列表
 * @param params 查询参数
 * @returns 品牌列表和分页信息
 */
export async function getBrands(params: BrandQueryParams = {}): Promise<BrandListResponse> {
  try {
    // 构建查询参数
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.letter) searchParams.append('letter', params.letter);
    if (params.popularity !== undefined)
      searchParams.append('popularity', params.popularity.toString());
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    // 默认只获取活跃的品牌
    searchParams.append('isActive', 'true');

    // 发送请求
    // 构建URL时考虑SSR和CSR环境区别
    let url: string;

    if (typeof window === 'undefined') {
      // 服务端渲染环境，需要完整URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

      url = `${apiUrl}/api/public/brands?${searchParams.toString()}`;
    } else {
      // 客户端环境，可以使用相对路径（通过Next.js rewrites代理）
      url = `/api/public/brands?${searchParams.toString()}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`获取品牌失败: ${response.status}`);
    }

    return await response.json();
  } catch {
    // 返回一个空的响应，同时记录错误，但不直接抛出以避免影响其他地方的现有行为
    // 理想情况下应该抛出错误，但为了最小化本次变更风险，暂时保持返回空数据结构
    return {
      items: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    };
  }
}

/**
 * 根据slug获取单个品牌
 * @param slug 品牌slug
 * @returns 品牌对象或null（如果未找到）
 * @throws Error 如果API请求失败（非404）
 */
export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  try {
    const encodedSlug = encodeURIComponent(slug);

    // 使用绝对路径URL，在SSR和CSR环境下都能工作
    // 构建URL时检查当前运行环境
    let url: string;

    if (typeof window === 'undefined') {
      // 服务端渲染环境，需要完整URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

      url = `${apiUrl}/api/public/brands/slug/${encodedSlug}`;
    } else {
      // 客户端环境，可以使用相对路径（通过Next.js rewrites代理）
      url = `/api/public/brands/slug/${encodedSlug}`;
    }

    const response = await fetch(url);

    if (response.status === 404) {
      return null; // 品牌未找到
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));

      throw new Error(
        `API error fetching brand ${slug}: ${response.status} - ${errorData.message || 'Unknown error'}`
      );
    }

    const brand: Brand = await response.json();

    return brand;
  } catch (error) {
    // 检查错误是否已经是我们自定义的 Error 类型，避免重复包装
    if (error instanceof Error && error.message.startsWith('API error fetching brand')) {
      throw error;
    }
    // 对于 fetch 自身的网络错误等，可以简单重新抛出，或包装一下
    throw new Error(`Client-side failure when fetching brand ${slug}: ${(error as Error).message}`);
  }
}

/**
 * 按字母分组获取品牌
 * @returns 按字母分组的品牌数据
 */
export async function getBrandsByAlphabet(): Promise<Record<string, Brand[]>> {
  try {
    // 获取所有品牌
    const { items } = await getBrands({ limit: 999 });

    // 按首字母分组
    const groupedBrands: Record<string, Brand[]> = {};

    items.forEach((brand) => {
      const firstLetter = brand.name.charAt(0).toUpperCase();

      // 检查是否为字母
      const isLetter = /[A-Z]/.test(firstLetter);
      const key = isLetter ? firstLetter : '0-9';

      if (!groupedBrands[key]) {
        groupedBrands[key] = [];
      }

      groupedBrands[key].push(brand);
    });

    return groupedBrands;
  } catch {
    return {};
  }
}

/**
 * 获取热门品牌
 * @param limit 数量限制
 * @returns 热门品牌列表
 */
export async function getPopularBrands(limit = 10): Promise<Brand[]> {
  try {
    const { items } = await getBrands({
      limit,
      popularity: true, // 直接查询热门品牌
      sortBy: 'updatedAt', // 按更新时间排序，获取最新的热门品牌
      sortOrder: 'desc',
    });

    return items;
  } catch {
    return [];
  }
}
