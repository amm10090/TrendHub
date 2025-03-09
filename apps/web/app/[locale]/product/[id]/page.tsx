import { notFound } from 'next/navigation';

import { ProductDetail } from '@/components/product-detail';
import { isFeatureEnabled } from '@/lib/dev-config';

interface ProductPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

/**
 * 商品详情页面
 * 使用服务器组件渲染商品详情
 */
export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;

  if (!isFeatureEnabled('enableTraditionalProductPage')) {
    notFound();
  }

  // TODO: 从 API 获取商品数据
  const product = {
    id: resolvedParams.id,
    name: '商品名称',
    brand: '品牌名称',
    price: 1000,
    image: '/images/products/placeholder.jpg',
    description: '商品描述',
    availableQuantity: 10,
    images: ['/images/products/placeholder.jpg'],
    sizes: ['S', 'M', 'L'],
    colors: [
      { name: '黑色', value: '#000000' },
      { name: '白色', value: '#FFFFFF' },
    ],
    details: ['商品详细信息', '商品特点', '商品规格'],
    material: '材质信息',
    careInstructions: ['干洗', '不可漂白', '中温熨烫'],
    sku: 'SKU123456',
    relatedProducts: [],
    currency: '$',
  };

  return (
    <div className="min-h-screen bg-bg-primary-light dark:bg-bg-primary-dark py-8">
      <ProductDetail product={product} />
    </div>
  );
}
