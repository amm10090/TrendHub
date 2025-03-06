export interface Product {
    id: string;
    name: string;
    brand: string;
    price: number;
    originalPrice?: number; // 原价（用于显示折扣）
    image: string;
    discount?: number; // 折扣百分比
    isNew?: boolean; // 是否为新品
    isFavorite?: boolean; // 是否已收藏
    currency: string; // 货币符号
}

export interface ProductDetail extends Product {
    description: string; // 商品描述
    details: string[]; // 商品详情列表
    images: string[]; // 商品图片列表
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
        name: '经典风衣',
        brand: 'Burberry',
        price: 19800,
        originalPrice: 22000,
        image: '/images/products/coat.jpg',
        isNew: true,
        discount: 10,
        currency: '¥',
    },
    {
        id: '2',
        name: 'GG Marmont 链条包',
        brand: 'Gucci',
        price: 21500,
        image: '/images/products/bag.jpg',
        currency: '¥',
    },
    {
        id: '3',
        name: '高跟凉鞋',
        brand: 'Jimmy Choo',
        price: 7980,
        originalPrice: 9800,
        image: '/images/products/shoes.jpg',
        discount: 18,
        currency: '¥',
    },
    {
        id: '4',
        name: '金色贝壳耳环',
        brand: 'Alessandra Rich',
        price: 2980,
        image: '/images/products/earrings.jpg',
        isNew: true,
        currency: '¥',
    },
];

// 模拟商品详情数据
export const mockProductDetails: Record<string, ProductDetail> = {
    '1': {
        id: '1',
        name: '经典风衣',
        brand: 'Burberry',
        price: 19800,
        originalPrice: 22000,
        image: '/images/products/coat.jpg',
        isNew: true,
        discount: 10,
        currency: '¥',
        description: 'Burberry经典风衣采用防风防水面料，具有标志性格纹设计，是秋冬季节的理想选择。',
        details: [
            '采用100%纯棉防水面料',
            '经典双排扣设计',
            '可调节袖口',
            '内部格纹衬里',
            '带有风帽设计，适合多变天气'
        ],
        images: [
            '/images/products/coat.jpg',
            '/images/products/coat_2.jpg',
            '/images/products/coat_3.jpg',
        ],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: [
            { name: '经典驼色', value: '#D2B48C' },
            { name: '黑色', value: '#000000' },
            { name: '海军蓝', value: '#000080' }
        ],
        material: '面料：100%纯棉；衬里：100%棉；袖里：100%粘胶纤维',
        careInstructions: [
            '专业干洗',
            '不可漂白',
            '不可熨烫',
            '不可机洗',
            '平铺晾干'
        ],
        sku: 'BUR-COAT-2023',
        availableQuantity: 10,
        relatedProducts: [],
    },
    '2': {
        id: '2',
        name: 'GG Marmont 链条包',
        brand: 'Gucci',
        price: 21500,
        image: '/images/products/bag.jpg',
        currency: '¥',
        description: 'Gucci GG Marmont系列链条包，采用优质绗缝皮革制成，配有标志性双G硬件。',
        details: [
            '优质绗缝皮革',
            '古铜色金属双G硬件',
            '链条肩带',
            '内部拉链口袋',
            '磁性按扣闭合'
        ],
        images: [
            '/images/products/bag.jpg',
            '/images/products/bag_2.jpg',
            '/images/products/bag_3.jpg',
        ],
        sizes: ['小号', '中号', '大号'],
        colors: [
            { name: '黑色', value: '#000000' },
            { name: '红色', value: '#FF0000' },
            { name: '裸粉色', value: '#E6BEAE' }
        ],
        material: '100%优质牛皮',
        careInstructions: [
            '存放于防尘袋中',
            '避免接触水或潮湿环境',
            '避免与尖锐物体接触',
            '定期使用皮革护理产品'
        ],
        sku: 'GUC-BAG-2023',
        availableQuantity: 5,
        relatedProducts: [],
    },
    '3': {
        id: '3',
        name: '高跟凉鞋',
        brand: 'Jimmy Choo',
        price: 7980,
        originalPrice: 9800,
        image: '/images/products/shoes.jpg',
        discount: 18,
        currency: '¥',
        description: 'Jimmy Choo经典高跟凉鞋，采用意大利优质皮革制作，细节精致，舒适度高。',
        details: [
            '鞋跟高度：10cm',
            '意大利手工制作',
            '真皮鞋面和内里',
            '皮革鞋底',
            '可调节脚踝绑带'
        ],
        images: [
            '/images/products/shoes.jpg',
            '/images/products/shoes_2.jpg',
            '/images/products/shoes_3.jpg',
        ],
        sizes: ['35', '36', '37', '38', '39', '40'],
        colors: [
            { name: '黑色', value: '#000000' },
            { name: '裸色', value: '#E8CEBF' },
            { name: '金色', value: '#FFD700' }
        ],
        material: '鞋面：小牛皮；内里：羊皮；鞋底：皮革',
        careInstructions: [
            '避免在潮湿环境中穿着',
            '使用专业鞋履清洁产品',
            '存放时使用鞋撑',
            '避免长时间暴露在阳光下'
        ],
        sku: 'JIM-SHOE-2023',
        availableQuantity: 8,
        relatedProducts: [],
    },
    '4': {
        id: '4',
        name: '金色贝壳耳环',
        brand: 'Alessandra Rich',
        price: 2980,
        image: '/images/products/earrings.jpg',
        isNew: true,
        currency: '¥',
        description: 'Alessandra Rich金色贝壳耳环，采用贝壳和水晶元素，展现优雅复古的风格。',
        details: [
            '黄铜镀金材质',
            '镶嵌施华洛世奇水晶',
            '贝壳形状设计',
            '适合各种场合',
            '长度：5cm'
        ],
        images: [
            '/images/products/earrings.jpg',
            '/images/products/earrings_2.jpg',
            '/images/products/earrings_3.jpg',
        ],
        sizes: ['均码'],
        colors: [
            { name: '金色', value: '#FFD700' },
            { name: '银色', value: '#C0C0C0' }
        ],
        material: '黄铜镀金，施华洛世奇水晶，贝壳元素',
        careInstructions: [
            '避免接触水和化学物质',
            '使用柔软干布擦拭',
            '单独存放于首饰盒',
            '避免长时间暴露在阳光下'
        ],
        sku: 'AR-EAR-2023',
        availableQuantity: 15,
        relatedProducts: [],
    }
};

// 设置相关产品
mockProductDetails['1'].relatedProducts = [mockProducts[1], mockProducts[3]];
mockProductDetails['2'].relatedProducts = [mockProducts[0], mockProducts[2]];
mockProductDetails['3'].relatedProducts = [mockProducts[1], mockProducts[3]];
mockProductDetails['4'].relatedProducts = [mockProducts[0], mockProducts[2]]; 