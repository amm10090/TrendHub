import { ProductDetail } from '@/types/product';

// 模拟商品数据
export const products: ProductDetail[] = [
    {
        id: '1',
        name: '经典风衣',
        brand: 'Burberry',
        price: 19800,
        image: '/images/products/coat.jpg',
        description: '经典格纹风衣，采用优质棉质面料，搭配标志性格纹内衬。',
        availableQuantity: 5,
        isNew: true,
        details: [
            '标志性格纹棉质面料',
            '双排扣设计',
            '可调节的肩部扣带',
            '腰间皮带',
            '两侧口袋'
        ],
        images: [
            '/images/products/coat.jpg',
            '/images/products/coat-2.jpg',
            '/images/products/coat-3.jpg'
        ],
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
        isFavorite: false
    },
    {
        id: '2',
        name: 'GG Marmont 链条包',
        brand: 'Gucci',
        price: 21500,
        image: '/images/products/bag.jpg',
        description: 'GG Marmont系列链条包，采用绗缝皮革制成，配以双G logo。',
        availableQuantity: 3,
        discount: 20,
        originalPrice: 26875,
        isNew: true,
        details: [
            '绗缝皮革',
            '金色双G logo',
            '链条肩带',
            '内部隔层',
            '磁性按扣闭合'
        ],
        images: [
            '/images/products/bag.jpg',
            '/images/products/bag-2.jpg',
            '/images/products/bag-3.jpg'
        ],
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
        isFavorite: false
    },
    {
        id: '3',
        name: '高跟凉鞋',
        brand: 'Jimmy Choo',
        price: 7980,
        image: '/images/products/shoes.jpg',
        description: '优雅的高跟凉鞋，采用意大利制造的优质皮革，搭配水晶装饰。',
        availableQuantity: 8,
        isNew: true,
        details: [
            '意大利制造',
            '真皮鞋面',
            '10厘米鞋跟',
            '水晶装饰',
            '皮革鞋底'
        ],
        images: [
            '/images/products/shoes.jpg',
            '/images/products/shoes-2.jpg',
            '/images/products/shoes-3.jpg'
        ],
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
        isFavorite: false
    },
    {
        id: '4',
        name: '金色贝壳耳环',
        brand: 'Alessandra Rich',
        price: 2980,
        image: '/images/products/earrings.jpg',
        description: '金色贝壳造型耳环，采用镀金黄铜制成，搭配人造珍珠装饰。',
        availableQuantity: 10,
        isNew: true,
        details: [
            '镀金黄铜材质',
            '人造珍珠装饰',
            '贝壳造型',
            '蝴蝶后扣',
            '意大利制造'
        ],
        images: [
            '/images/products/earrings.jpg',
            '/images/products/earrings-2.jpg',
            '/images/products/earrings-3.jpg'
        ],
        sizes: ['均码'],
        colors: [
            { name: '金色', value: '#FFD700' },
        ],
        material: '镀金黄铜、人造珍珠',
        careInstructions: ['避免接触水和化妆品', '存放时使用首饰盒'],
        sku: 'ALE001',
        relatedProducts: [],
        adUrl: 'https://www.alessandrarich.com/',
        isFavorite: false
    },
]; 