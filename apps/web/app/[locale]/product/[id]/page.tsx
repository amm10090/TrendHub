import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProductDetail } from '@/components/product-detail';
import { type ProductDetail as ProductDetailType } from '@/types/product';

interface ProductPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

async function getProductData(id: string): Promise<ProductDetailType | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}/api/public/products/${id}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch product ${id}: ${res.statusText}`);
    }
    const productData = await res.json();

    return productData as ProductDetailType;
  } catch {
    return null;
  }
}

type PropsForMetadata = {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: PropsForMetadata): Promise<Metadata> {
  const awaitedParams = await params;
  const product = await getProductData(awaitedParams.id);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: `${product.name} - ${product.brand.name}`,
    description: product.description.substring(0, 160),
    openGraph: {
      title: `${product.name} - ${product.brand.name}`,
      description: product.description.substring(0, 160),
      images: [
        {
          url: product.images?.[0] || '/images/products/placeholder.jpg',
          width: 800,
          height: 600,
        },
      ],
      url: `/product/${product.id}`,
      type: 'website',
    },
  };
}

/**
 * 商品详情页面
 * 使用服务器组件渲染商品详情
 */
export default async function ProductPage({ params }: ProductPageProps) {
  const awaitedParams = await params;
  const product = await getProductData(awaitedParams.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-bg-primary-light dark:bg-bg-primary-dark py-8">
      <ProductDetail product={product} />
    </div>
  );
}
