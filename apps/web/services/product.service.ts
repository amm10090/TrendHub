// 产品基本信息接口
export interface ProductBasic {
  id: string;
  name: string;
  price: string;
  originalPrice: string | null;
  discount: string | null;
  coupon: boolean;
  isNew: boolean;
  sku: string;
  status: string;
  brandName: string;
  brandSlug: string;
  categoryName: string;
  categorySlug: string;
  image: string;
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
    // 构建查询参数
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

    // 发送请求
    // 构建URL时考虑SSR和CSR环境区别
    let url: string;

    if (typeof window === 'undefined') {
      // 服务端渲染环境，需要完整URL
      url = `http://localhost:3001/api/public/products?${searchParams.toString()}`;
    } else {
      // 客户端环境，可以使用相对路径
      url = `/api/public/products?${searchParams.toString()}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`获取产品失败: ${response.status}`);
    }

    return await response.json();
  } catch {
    // 返回一个空的响应
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        totalPages: 0,
        totalItems: 0,
      },
    };
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
      url = `http://localhost:3001/api/public/products/${id}`;
    } else {
      // 客户端环境，可以使用相对路径
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
