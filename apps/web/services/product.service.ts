// 在文件顶部，如果 ProductTypeFromAppTypes (即 Product) 不是从这里导出的，需要导入
import type { Product as ProductTypeFromAppTypes } from '@/types/product';

// 产品基本信息接口 (扩展它以更接近 ProductTypeFromAppTypes)
export interface ProductBasic {
  id: string;
  name: string;
  price: string; // API返回的是string
  originalPrice: string | null;
  images: string[]; // 从 ProductTypeFromAppTypes 对齐
  description?: string;
  discount?: string | null;
  coupon?: string | null; // API 返回的是 coupon?: string | null, 之前是 boolean
  isNew: boolean;
  sku?: string;
  status?: string;
  brandName?: string;
  brandSlug?: string;
  brandId?: string; // ProductTypeFromAppTypes 有这些
  brandLogo?: string;
  categoryName?: string;
  categorySlug?: string;
  categoryId?: string;
  inventory?: number; // ProductTypeFromAppTypes 有 inventory
  adUrl?: string;
  // videos, currency, gender, categories, material, details, sizes, colors, specifications, adUrl, careInstructions 尚未在 ProductBasic 中
}

// 产品列表分页接口
export interface ProductPagination {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

// 产品列表响应接口
export interface ProductListResponse {
  data: ProductBasic[];
  pagination: ProductPagination;
}

// 产品详情接口
export interface ProductDetail extends ProductBasic {
  description: string;
  images: string[];
  videos: string[];
  details: string[];
  sizes: string[];
  colors: Array<{ name: string; value: string }>;
  material: string;
  specifications: Record<string, string>;
  brand: {
    id: string;
    name: string;
    slug: string;
    logo: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

// 产品查询参数
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sale?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
  q?: string;
}

/**
 * 获取产品列表
 * @param params 查询参数
 * @returns 产品列表和分页信息
 */
export async function getProducts(params: ProductQueryParams = {}): Promise<ProductListResponse> {
  try {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.category) searchParams.append('category', params.category);
    if (params.brand) searchParams.append('brand', params.brand);
    if (params.minPrice) searchParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice) searchParams.append('maxPrice', params.maxPrice.toString());
    if (params.sale) searchParams.append('sale', 'true');
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.order) searchParams.append('order', params.order);
    if (params.q) searchParams.append('q', params.q);

    let url: string;

    if (typeof window === 'undefined') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

      url = `${apiUrl}/api/public/products?${searchParams.toString()}`;
    } else {
      url = `/api/public/products?${searchParams.toString()}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`获取产品失败: ${response.status}`);
    }

    // API 返回的 data 已经是 ProductBasic[] (根据 ProductListResponse 定义)
    return await response.json();
  } catch {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: params.limit || 10, // 使用 params.limit
        totalPages: 0,
        totalItems: 0,
      },
    };
  }
}

/**
 * 根据ID列表获取产品
 * @param ids 产品ID数组
 * @param limit 可选的限制数量
 * @returns 产品列表 (ProductTypeFromAppTypes[]) - 返回更完整的类型
 */
export async function getProductsByIds(
  ids: string[],
  limit?: number
): Promise<ProductTypeFromAppTypes[]> {
  if (!ids || ids.length === 0) {
    return [];
  }
  try {
    const searchParams = new URLSearchParams();

    searchParams.append('ids', ids.join(','));
    // API 现在会根据传入的ids数量返回，前端的 limit 参数可能用于截断，如果需要的话
    // 但通常内容块配置的 maxDisplayItems 应该在获取数据后应用，或API侧支持limit
    if (limit !== undefined && limit > 0 && limit < ids.length) {
      // 如果确实需要用limit截断请求的ids (不推荐，最好是API层面处理或获取全量后截断)
      // searchParams.set('ids', ids.slice(0, limit).join(','));
      // 或者，如果API支持对ids查询也应用limit，可以传递limit参数
      // searchParams.append('limit', limit.toString());
      // 当前公共API的ids查询会返回所有ids对应的产品，limit用于分页查询，不适用于ids查询
    }

    let url: string;

    if (typeof window === 'undefined') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

      url = `${apiUrl}/api/public/products?${searchParams.toString()}`;
    } else {
      url = `/api/public/products?${searchParams.toString()}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`根据ID获取产品失败: ${response.status}`);
    }
    // API 返回的 data 已经是 ProductBasic[] (根据 ProductListResponse 定义)
    // 但我们需要确保返回的是 ProductTypeFromAppTypes[]
    const result = (await response.json()) as {
      data: ProductTypeFromAppTypes[];
      pagination: ProductPagination;
    };

    // API改造后，当使用ids参数时，返回的数据结构应该直接是 data: ProductTypeFromAppTypes[]
    // 并且顺序与请求的ids一致，price已经是string
    // 需要进行类型转换和字段对齐，特别是 price, originalPrice, discount, inventory
    return result.data.map((p) => ({
      ...p,
      price: parseFloat(p.price as unknown as string), // API返回 price as string, ProductTypeFromAppTypes 需要 number
      originalPrice: p.originalPrice ? parseFloat(p.originalPrice as unknown as string) : undefined,
      discount: p.discount ? parseFloat(p.discount as unknown as string) : undefined, // API可能返回string或null, ProductTypeFromAppTypes需要number或undefined
      inventory:
        p.inventory !== undefined && p.inventory !== null ? Number(p.inventory) : undefined, // Prisma Decimal to number
      images: p.images || [], // 确保是数组
      // 根据 ProductTypeFromAppTypes 确保其他字段也得到正确处理
      // 例如，API 返回的 brand/category 可能是对象，而 ProductTypeFromAppTypes 可能只需要名称/slug
      // 从 public/products/route.ts 的返回看，brandName/categoryName 等已扁平化
    }));
  } catch {
    return [];
  }
}

/**
 * 获取产品详情
 * @param id 产品ID
 * @returns 产品详情
 */
export async function getProductDetail(id: string): Promise<ProductDetail | null> {
  try {
    // 构建URL时考虑SSR和CSR环境区别
    let url: string;

    if (typeof window === 'undefined') {
      // 服务端渲染环境，需要完整URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

      url = `${apiUrl}/api/public/products/${id}`;
    } else {
      // 客户端环境，可以使用相对路径（通过Next.js rewrites代理）
      url = `/api/public/products/${id}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`获取产品详情失败: ${response.status}`);
    }

    return await response.json();
  } catch {
    return null;
  }
}
