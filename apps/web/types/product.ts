export interface Product {
  id: string; //商品ID
  name: string; //商品名称
  price: number; //价格
  originalPrice?: number; // 原价（用于显示折扣）
  images: string[]; // 商品图片数组，列表至少需要主图 images[0]
  description?: string; // 可选的简短描述
  discount?: number; // 折扣百分比
  isNew?: boolean; // 是否为新品
  isFavorite?: boolean; // 是否已收藏 (通常由前端状态管理)
  currency?: string; // 货币符号 (如果需要)
  gender?: 'women' | 'men' | 'unisex'; // 性别类别 (如果需要)
  categories?: string[]; // 商品分类（不包含性别）(如果需要)
  sku?: string; // 列表可能需要 sku
  status?: string; // 列表可能需要状态
  videos?: string[]; // 视频 URL 列表 (如果列表需要)
  brandName?: string;
  brandSlug?: string;
  brandId?: string; // 添加 brandId
  brandLogo?: string; // 添加 brandLogo
  categoryName?: string;
  categorySlug?: string;
  categoryId?: string; // 添加 categoryId
  inventory?: number; // 添加 inventory
  material?: string;
  details?: string[];
  sizes?: string[];
  colors?: ProductColor[];
  specifications?: { material?: string; color?: string; size?: string; origin?: string };
  adUrl?: string;
  careInstructions?: string[];
  relatedProducts?: Product[];
  url?: string;
  source?: string; // 商品来源/商店
}

export interface ProductDetail
  extends Pick<
    Product,
    | 'id'
    | 'name'
    | 'price'
    | 'originalPrice'
    | 'images'
    | 'description'
    | 'discount'
    | 'isNew'
    | 'isFavorite'
    | 'currency'
    | 'gender'
    | 'categories'
    | 'videos'
    | 'brandName'
    | 'brandSlug'
    | 'brandId'
    | 'brandLogo'
    | 'categoryName'
    | 'categorySlug'
    | 'categoryId'
    | 'inventory'
    | 'sku'
    | 'status'
    | 'material'
    | 'details'
    | 'sizes'
    | 'colors'
    | 'specifications'
    | 'adUrl'
    | 'careInstructions'
    | 'relatedProducts'
    | 'url'
    | 'source'
  > {
  images: string[]; // 确保 images 是必须的数组
  description: string; // 确保 description 是必须的字符串

  specifications?: {
    material?: string;
    color?: string;
    size?: string;
    origin?: string;
  };
  details?: string[]; // 商品详情列表
  sizes?: string[]; // 可选尺寸
  colors?: ProductColor[]; // 可选颜色
  material?: string; // 材质
  careInstructions?: string[]; // 保养说明
  availableQuantity: number; // 可用库存
  relatedProducts?: Product[]; // 相关商品
  adUrl?: string; // 广告联盟链接
  url?: string;
  brand: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ProductColor {
  name: string;
  value: string; // CSS颜色值
  image?: string; // 颜色对应的商品图片
}

// --- 移除或注释掉模拟数据 ---
/*
export const mockProducts: Product[] = [
  // ... data ...
];

export const mockProductDetails: Record<string, ProductDetail> = {
  // ... data ...
};
*/
