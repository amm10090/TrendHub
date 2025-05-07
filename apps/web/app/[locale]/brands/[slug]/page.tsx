import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getBrandBySlug, Brand } from '@/services/brand.service';
import { ProductListResponse, getProducts } from '@/services/product.service';

import BrandDetailClient from './brand-detail-client';

// interface BrandPageProps {
//   params: {
//     locale: string;
//     slug: string;
//   };
// }

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  // 解构 params 避免直接访问其属性
  const { locale, slug } = await paramsPromise;
  const t = await getTranslations({ locale, namespace: 'brands' });

  // 获取品牌信息
  let brand: Brand | null = null;

  try {
    brand = await getBrandBySlug(slug);
  } catch {
    return {
      title: t('seo.notFound'),
      description: t('seo.notFoundDesc'),
    };
  }

  if (!brand) {
    return {
      title: t('seo.notFound'),
      description: t('seo.notFoundDesc'),
    };
  }

  return {
    title: t('seo.brandTitle', { brand: brand.name }),
    description: t('seo.brandDescription', { brand: brand.name }),
  };
}

export default async function BrandPage({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  // 解构 params 避免直接访问其属性
  const { locale, slug } = await paramsPromise;

  // 获取品牌信息
  let brand: Brand | null = null;

  try {
    brand = await getBrandBySlug(slug);
  } catch {
    // 如果 getBrandBySlug 抛出错误（例如API服务故障，非404），则显示404页面
    notFound();
  }

  if (!brand) {
    // 如果 getBrandBySlug 返回 null (API返回404，表示品牌未找到)，则显示404页面
    notFound();
  }

  // 获取该品牌的产品
  let products: ProductListResponse | null = null;

  try {
    products = await getProducts({
      brand: brand.id,
      limit: 12,
      page: 1,
    });
  } catch {
    return;
  }

  // 将数据传递给客户端组件
  return <BrandDetailClient brand={brand} products={products} locale={locale} />;
}
