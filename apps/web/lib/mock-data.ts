import { ProductDetail } from '@/types/product';

// 模拟商品数据
export const products: ProductDetail[] = [
  {
    id: '1',
    name: '经典风衣',
    brand: {
      id: 'b001',
      name: 'Burberry',
      slug: 'burberry',
    },
    price: 19800,
    images: ['/images/products/coat.jpg'],
    description: '经典格纹风衣，采用优质棉质面料，搭配标志性格纹内衬。',
    availableQuantity: 5,
    isNew: true,
    details: ['标志性格纹棉质面料', '双排扣设计', '可调节的肩部扣带', '腰间皮带', '两侧口袋'],

    videos: [],
    sizes: ['S', 'M', 'L'],
    colors: [
      { name: '驼色', value: '#D2B48C' },
      { name: '黑色', value: '#000000' },
    ],
    material: '100% 棉',
    careInstructions: ['专业干洗', '不可漂白', '中温熨烫'],
    sku: 'BUR001',
    relatedProducts: [],
    adUrl: 'https://www.burberry.com/zh-cn/',
    isFavorite: false,
    currency: '$',
    gender: 'unisex' as const,
    specifications: {
      material: '100% 棉',
      color: '驼色/黑色',
      size: 'S-L',
      origin: '英国',
    },
    category: {
      id: 'c001',
      name: '外套',
      slug: 'coats',
    },
  },
  {
    id: '2',
    name: 'GG Marmont 链条包',
    brand: {
      id: 'b002',
      name: 'Gucci',
      slug: 'gucci',
    },
    price: 21500,
    images: ['/images/products/bag.jpg'],
    description: 'GG Marmont系列链条包，采用绗缝皮革制成，配以双G logo。',
    availableQuantity: 3,
    discount: 20,
    originalPrice: 26875,
    isNew: true,
    details: ['绗缝皮革', '金色双G logo', '链条肩带', '内部隔层', '磁性按扣闭合'],

    videos: [],
    sizes: ['均码'],
    colors: [
      { name: '黑色', value: '#000000' },
      { name: '白色', value: '#FFFFFF' },
    ],
    material: '100% 小牛皮',
    careInstructions: ['避免雨水', '存放时使用防尘袋', '定期护理'],
    sku: 'GUC001',
    relatedProducts: [],
    adUrl: 'https://www.gucci.com/us/en/',
    isFavorite: false,
    currency: '¥',
    gender: 'women' as const,
    specifications: {
      material: '100% 小牛皮',
      color: '黑色/白色',
      size: '均码',
      origin: '意大利',
    },
    category: {
      id: 'c002',
      name: '手袋',
      slug: 'bags',
    },
  },
  {
    id: '3',
    name: '高跟凉鞋',
    brand: {
      id: 'b003',
      name: 'Jimmy Choo',
      slug: 'jimmy-choo',
    },
    price: 7980,
    images: ['/images/products/shoes.jpg'],
    description: '优雅的高跟凉鞋，采用意大利制造的优质皮革，搭配水晶装饰。',
    availableQuantity: 8,
    isNew: true,
    details: ['意大利制造', '真皮鞋面', '10厘米鞋跟', '水晶装饰', '皮革鞋底'],

    videos: [],
    sizes: ['35', '36', '37', '38', '39'],
    colors: [
      { name: '银色', value: '#C0C0C0' },
      { name: '金色', value: '#FFD700' },
    ],
    material: '100% 小羊皮',
    careInstructions: ['避免雨水', '使用专业清洁剂', '存放时使用鞋撑'],
    sku: 'JMC001',
    relatedProducts: [],
    adUrl: 'https://www.jimmychoo.com/',
    isFavorite: false,
    currency: '¥',
    gender: 'women' as const,
    specifications: {
      material: '100% 小羊皮',
      color: '银色/金色',
      size: '35-39',
      origin: '意大利',
    },
    category: {
      id: 'c003',
      name: '鞋履',
      slug: 'shoes',
    },
  },
  {
    id: '4',
    name: '金色贝壳耳环',
    brand: {
      id: 'b004',
      name: 'Alessandra Rich',
      slug: 'alessandra-rich',
    },
    price: 2980,
    images: ['/images/products/earrings.jpg'],
    description: '金色贝壳造型耳环，采用镀金黄铜制成，搭配人造珍珠装饰。',
    availableQuantity: 10,
    isNew: true,
    details: ['镀金黄铜材质', '人造珍珠装饰', '贝壳造型', '蝴蝶后扣', '意大利制造'],

    videos: [],
    sizes: ['均码'],
    colors: [{ name: '金色', value: '#FFD700' }],
    material: '镀金黄铜、人造珍珠',
    careInstructions: ['避免接触水和化妆品', '存放时使用首饰盒'],
    sku: 'ALE001',
    relatedProducts: [],
    adUrl: 'https://www.alessandrarich.com/',
    isFavorite: false,
    currency: '¥',
    gender: 'women' as const,
    specifications: {
      material: '镀金黄铜、人造珍珠',
      color: '金色',
      size: '均码',
      origin: '意大利',
    },
    category: {
      id: 'c004',
      name: '配饰',
      slug: 'accessories',
    },
  },
];

// 新增模拟商品数据 - Gucci商品
export const mockGucciProducts = [
  {
    id: 'g001',
    name: 'Gucci Diana 小号手提包',
    brand: {
      id: 'b002',
      name: 'Gucci',
      slug: 'gucci',
    },
    price: 19800,
    originalPrice: 22000,
    image: 'https://www.mytheresa.com/media/1094/1238/100/48/P01036967.jpg',
    discount: 10,
    isNew: true,
    isFavorite: false,
    currency: '¥',
    gender: 'women',
    categories: ['bags', 'new-season'],
  },
  {
    id: 'g002',
    name: 'Gucci Horsebit 1955 肩背包',
    brand: {
      id: 'b002',
      name: 'Gucci',
      slug: 'gucci',
    },
    price: 18500,
    image: '/images/products/gucci-horsebit-bag.jpg',
    isNew: true,
    isFavorite: false,
    currency: '¥',
    gender: 'women',
    categories: ['bags', 'new-season'],
  },
  {
    id: 'g003',
    name: 'Gucci GG Marmont 绗缝肩背包',
    brand: {
      id: 'b002',
      name: 'Gucci',
      slug: 'gucci',
    },
    price: 17800,
    originalPrice: 20500,
    image: '/images/products/gucci-marmont-bag.jpg',
    discount: 13,
    isFavorite: false,
    currency: '¥',
    gender: 'women',
    categories: ['bags'],
  },
  {
    id: 'g004',
    name: 'Gucci 印花真丝衬衫',
    brand: {
      id: 'b002',
      name: 'Gucci',
      slug: 'gucci',
    },
    price: 12500,
    image: '/images/products/gucci-silk-shirt.jpg',
    isNew: true,
    isFavorite: false,
    currency: '¥',
    gender: 'men',
    categories: ['clothing', 'new-season'],
  },
];

// 新增模拟商品数据 - Valentino商品
export const mockValentinoProducts = [
  {
    id: 'v001',
    name: 'Valentino Garavani Roman Stud 手拿包',
    brand: {
      id: 'b005',
      name: 'Valentino',
      slug: 'valentino',
    },
    price: 15800,
    image: '/images/products/valentino-stud-clutch.jpg',
    isNew: true,
    isFavorite: false,
    currency: '¥',
    gender: 'women',
    categories: ['accessories', 'bags', 'new-season'],
  },
  {
    id: 'v002',
    name: 'Valentino Garavani Rockstud 皮革手环',
    brand: {
      id: 'b005',
      name: 'Valentino',
      slug: 'valentino',
    },
    price: 3200,
    image: '/images/products/valentino-bracelet.jpg',
    isFavorite: false,
    currency: '¥',
    gender: 'women',
    categories: ['accessories', 'jewelry'],
  },
  {
    id: 'v003',
    name: 'Valentino Garavani VLOGO 耳环',
    brand: {
      id: 'b005',
      name: 'Valentino',
      slug: 'valentino',
    },
    price: 3500,
    originalPrice: 4200,
    image: '/images/products/valentino-earrings.jpg',
    discount: 16,
    isFavorite: false,
    currency: '¥',
    gender: 'women',
    categories: ['accessories', 'jewelry'],
  },
];

// 新增模拟商品数据 - Prada商品
export const mockPradaProducts = [
  {
    id: 'p001',
    name: 'Prada Re-Edition 2005 再版尼龙手提包',
    brand: {
      id: 'b006',
      name: 'Prada',
      slug: 'prada',
    },
    price: 13500,
    image: '/images/products/prada-re-edition-bag.jpg',
    isNew: true,
    isFavorite: false,
    currency: '¥',
    gender: 'women',
    categories: ['bags', 'new-season'],
  },
  {
    id: 'p002',
    name: 'Prada Symbole 太阳镜',
    brand: {
      id: 'b006',
      name: 'Prada',
      slug: 'prada',
    },
    price: 3800,
    originalPrice: 4500,
    image: '/images/products/prada-sunglasses.jpg',
    discount: 15,
    isFavorite: false,
    currency: '¥',
    gender: 'women',
    categories: ['accessories', 'eyewear'],
  },
];

// 合并所有商品到一个数组
export const mockAllProducts = [
  ...products,
  ...mockGucciProducts,
  ...mockValentinoProducts,
  ...mockPradaProducts,
];

// 为模拟商品详情添加更多数据
export const mockGucciProductDetails = [
  {
    ...mockGucciProducts[0],
    images: [
      'https://www.mytheresa.com/media/356/402/30/48/P01036967.jpg',
      'https://www.mytheresa.com/media/356/402/30/48/P01036967_b1.jpg',
      'https://www.mytheresa.com/media/356/402/30/48/P01036967_d1.jpg',
    ],
    videos: [],
    image: 'https://www.mytheresa.com/media/1094/1238/100/48/P01036967.jpg',
    description: 'Gucci Go GG帆布S号单肩包',
    details: ['竹节手柄', '可拆卸、可调节肩带', '内部拉链口袋', '内衬麂皮', '磁性按扣封口'],
    sizes: ['小号', '中号', '大号'],
    colors: [
      { name: '黑色', value: '#000000' },
      { name: '米色', value: '#E8E6D9' },
      { name: '绿色', value: '#1D6D53' },
    ],
    material: '质感皮革',
    careInstructions: ['避免接触水、油和香水', '存放时应填充适当物品保持形状', '放置在阴凉干燥处'],
    sku: 'GC-DIANA-001',
    availableQuantity: 5,
    relatedProducts: [],
    adUrl: 'https://www.gucci.com/',
    specifications: {
      material: '质感皮革',
      color: '黑色',
      size: '小号',
      origin: '意大利',
    },
    category: {
      id: 'c002',
      name: '手袋',
      slug: 'bags',
    },
  },
];

export const mockValentinoProductDetails = [
  {
    ...mockValentinoProducts[0],
    images: [
      '/images/products/valentino-stud-clutch.jpg',
      '/images/products/valentino-stud-clutch-2.jpg',
      '/images/products/valentino-stud-clutch-3.jpg',
    ],
    videos: [],
    description:
      'Valentino Garavani Roman Stud 手拿包由柔软的绗缝小羊皮制成，点缀大号金色铆钉，彰显品牌标志性的奢华风格。',
    details: ['翻盖设计配以磁性按扣', '内部卡片槽', '可拆卸链条肩带', 'Valentino标志'],
    sizes: ['均码'],
    colors: [
      { name: '黑色', value: '#000000' },
      { name: '象牙白', value: '#FFFFF0' },
      { name: '玫瑰粉', value: '#E8CEBF' },
    ],
    material: '小羊皮',
    careInstructions: ['避免接触水', '用柔软干布擦拭', '存放在专用防尘袋中'],
    sku: 'VG-ROMAN-001',
    availableQuantity: 3,
    relatedProducts: [],
    adUrl: 'https://www.valentino.com/',
    specifications: {
      material: '小羊皮',
      color: '黑色',
      size: '均码',
      origin: '意大利',
    },
    category: {
      id: 'c002',
      name: '手袋',
      slug: 'bags',
    },
  },
];

// 合并所有商品详情
export const mockAllProductDetails = [
  ...products,
  ...mockGucciProductDetails,
  ...mockValentinoProductDetails,
];
