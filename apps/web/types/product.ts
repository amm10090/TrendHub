export interface Product {
  id: string; //商品ID
  name: string; //商品名称
  price: number; //价格
  originalPrice?: number; // 原价（用于显示折扣）
  image: string; //商品图片
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
  categoryName?: string;
  categorySlug?: string;
}

export interface ProductDetail extends Omit<Product, 'brand' | 'category'> {
  // Omit brand/category strings if using objects below
  images: string[];
  description: string;
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
  sku: string; // 库存单位 (详情页通常必填)
  availableQuantity: number; // 可用库存
  relatedProducts?: Product[]; // 相关商品
  adUrl?: string; // 广告联盟链接
  videos: string[]; // 视频 URL 列表 (详情页必填)
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
