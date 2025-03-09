export interface Product {
  id: string; //商品ID
  name: string; //商品名称
  brand: string; //品牌
  price: number; //价格
  originalPrice?: number; // 原价（用于显示折扣）
  image: string; //商品图片
  discount?: number; // 折扣百分比
  isNew?: boolean; // 是否为新品
  isFavorite?: boolean; // 是否已收藏
  currency: string; // 货币符号
  gender: 'women' | 'men' | 'unisex'; // 性别类别
  categories?: string[]; // 商品分类（不包含性别）
}

export interface ProductDetail extends Product {
  images: string[];
  description: string;
  specifications: {
    material: string;
    color: string;
    size: string;
    origin: string;
  };
  details: string[]; // 商品详情列表
  sizes: string[]; // 可选尺寸
  colors: ProductColor[]; // 可选颜色
  material: string; // 材质
  careInstructions: string[]; // 保养说明
  sku: string; // 库存单位
  availableQuantity: number; // 可用库存
  relatedProducts: Product[]; // 相关商品
  adUrl?: string; // 广告联盟链接
}

export interface ProductColor {
  name: string;
  value: string; // CSS颜色值
  image?: string; // 颜色对应的商品图片
}

// 模拟数据 - 用于前端开发
export const mockProducts: Product[] = [
  {
    id: '1',
    name: '羊毛混纺大衣',
    brand: 'GUCCI',
    price: 25999,
    originalPrice: 29999,
    image: '/images/products/coat.jpg',
    discount: 15,
    isNew: true,
    currency: 'CNY',
    gender: 'women',
    categories: ['clothing', 'coats'],
  },
  {
    id: '2',
    name: '链条单肩包',
    brand: 'PRADA',
    price: 19999,
    image: '/images/products/bag.jpg',
    isNew: true,
    currency: 'CNY',
    gender: 'women',
    categories: ['bags', 'shoulder-bags'],
  },
  {
    id: '3',
    name: '高跟凉鞋',
    brand: 'Jimmy Choo',
    price: 7999,
    originalPrice: 9999,
    image: '/images/products/shoes.jpg',
    discount: 20,
    currency: 'CNY',
    gender: 'women',
    categories: ['shoes', 'heels'],
  },
  {
    id: '4',
    name: '珍珠耳环',
    brand: 'Tiffany & Co.',
    price: 5999,
    image: '/images/products/earrings.jpg',
    isNew: true,
    currency: 'CNY',
    gender: 'women',
    categories: ['accessories', 'jewelry', 'earrings'],
  },
];

// 模拟商品详情数据
export const mockProductDetails: Record<string, ProductDetail> = {
  '1': {
    id: '1',
    name: '羊毛混纺大衣',
    brand: 'GUCCI',
    price: 25999,
    originalPrice: 29999,
    image: '/images/products/coat.jpg',
    images: [
      '/images/products/coat.jpg',
      '/images/products/coat-2.jpg',
      '/images/products/coat-3.jpg',
      '/images/products/coat-4.jpg',
    ],
    discount: 15,
    isNew: true,
    currency: 'CNY',
    gender: 'women',
    categories: ['clothing', 'coats'],
    description: '这款羊毛混纺大衣采用优质面料，突显优雅气质。',
    specifications: {
      material: '80% 羊毛, 20% 聚酯纤维',
      color: '驼色',
      size: 'S, M, L',
      origin: '意大利制造',
    },
    details: ['双排扣设计', '侧边口袋', '可调节袖口', '内衬设计'],
    sizes: ['S', 'M', 'L'],
    colors: [
      { name: '驼色', value: '#D2B48C' },
      { name: '黑色', value: '#000000' },
    ],
    material: '80% 羊毛, 20% 聚酯纤维',
    careInstructions: ['干洗', '不可漂白', '低温熨烫', '平铺晾干'],
    sku: 'GUC-COAT-2023',
    availableQuantity: 10,
    relatedProducts: [],
  },
  '2': {
    id: '2',
    name: '链条单肩包',
    brand: 'PRADA',
    price: 19999,
    image: '/images/products/bag.jpg',
    images: [
      '/images/products/bag.jpg',
      '/images/products/bag-2.jpg',
      '/images/products/bag-3.jpg',
      '/images/products/bag-4.jpg',
    ],
    isNew: true,
    currency: 'CNY',
    gender: 'women',
    categories: ['bags', 'shoulder-bags'],
    description: '经典链条单肩包，采用优质小牛皮制作，展现奢华品质。',
    specifications: {
      material: '小牛皮',
      color: '黑色',
      size: '中号',
      origin: '意大利制造',
    },
    details: ['可调节链条肩带', '内部拉链隔层', '磁扣开合', '金色五金件'],
    sizes: ['小号', '中号', '大号'],
    colors: [
      { name: '黑色', value: '#000000' },
      { name: '红色', value: '#FF0000' },
    ],
    material: '100%小牛皮',
    careInstructions: ['避免接触水', '存放时使用防尘袋', '定期护理', '避免阳光直射'],
    sku: 'PRA-BAG-2023',
    availableQuantity: 8,
    relatedProducts: [],
  },
  '3': {
    id: '3',
    name: '高跟凉鞋',
    brand: 'Jimmy Choo',
    price: 7999,
    originalPrice: 9999,
    image: '/images/products/shoes.jpg',
    images: [
      '/images/products/shoes.jpg',
      '/images/products/shoes-2.jpg',
      '/images/products/shoes-3.jpg',
      '/images/products/shoes-4.jpg',
    ],
    discount: 20,
    currency: 'CNY',
    gender: 'women',
    categories: ['shoes', 'heels'],
    description: '优雅的高跟凉鞋设计，采用精致的材质，突显女性魅力。',
    specifications: {
      material: '小羊皮',
      color: '裸色',
      size: '35-40',
      origin: '意大利制造',
    },
    details: ['10cm细跟', '真皮鞋垫', '防滑鞋底', '脚踝绑带设计'],
    sizes: ['35', '36', '37', '38', '39', '40'],
    colors: [
      { name: '裸色', value: '#E6BEAE' },
      { name: '黑色', value: '#000000' },
    ],
    material: '100%小羊皮',
    careInstructions: ['避免淋雨', '定期护理', '使用鞋撑存放', '防潮防霉'],
    sku: 'JC-SHOES-2023',
    availableQuantity: 12,
    relatedProducts: [],
  },
  '4': {
    id: '4',
    name: '珍珠耳环',
    brand: 'Tiffany & Co.',
    price: 5999,
    image: '/images/products/earrings.jpg',
    images: [
      '/images/products/earrings.jpg',
      '/images/products/earrings-2.jpg',
      '/images/products/earrings-3.jpg',
      '/images/products/earrings-4.jpg',
    ],
    isNew: true,
    currency: 'CNY',
    gender: 'women',
    categories: ['accessories', 'jewelry', 'earrings'],
    description: '精致的珍珠耳环，采用优质珍珠和925银制作，展现优雅气质。',
    specifications: {
      material: '925银、天然珍珠',
      color: '银色/珍珠白',
      size: '单一尺码',
      origin: '美国制造',
    },
    details: ['925银材质', '天然珍珠', '蝴蝶扣设计', '优雅简约风格'],
    sizes: ['均码'],
    colors: [{ name: '银色', value: '#C0C0C0' }],
    material: '925银、天然珍珠',
    careInstructions: ['避免接触化学品', '柔软布料擦拭', '专用首饰盒存放', '定期保养'],
    sku: 'TIF-EAR-2023',
    availableQuantity: 15,
    relatedProducts: [],
  },
};

// 设置相关产品
mockProductDetails['1'].relatedProducts = [mockProducts[1], mockProducts[3]];
mockProductDetails['2'].relatedProducts = [mockProducts[0], mockProducts[2]];
mockProductDetails['3'].relatedProducts = [mockProducts[1], mockProducts[3]];
mockProductDetails['4'].relatedProducts = [mockProducts[0], mockProducts[2]];
