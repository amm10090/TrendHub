'use client';

import { Breadcrumbs, BreadcrumbItem } from '@heroui/react';
import { useState } from 'react';
import { useTranslations } from 'use-intl';

import { type ProductDetail as ProductDetailType } from '@/types/product';

import { ProductAccordion } from './product-accordion';
import { ProductImages } from './product-images';
import { ProductInfo } from './product-info';
import { ProductOptions } from './product-options';
import { RelatedProducts } from './related-products';

export interface ProductDetailProps {
  product: ProductDetailType;
}

/**
 * 商品详情页主组件
 * 展示完整的商品信息、图片、购买选项和相关商品
 */
export function ProductDetail({ product }: ProductDetailProps) {
  const t = useTranslations('product');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="bg-bg-primary-light dark:bg-bg-primary-dark min-h-screen pb-12">
      <div className="container px-4 py-4 md:py-8">
        {/* 面包屑导航 */}
        <Breadcrumbs className="mb-4">
          <BreadcrumbItem href="/">{t('breadcrumb.home')}</BreadcrumbItem>
          <BreadcrumbItem href={`/category/${product.category.slug}`}>
            {product.category.name}
          </BreadcrumbItem>
          <BreadcrumbItem isCurrent>{product.name}</BreadcrumbItem>
        </Breadcrumbs>

        {/* 商品展示区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* 商品图片 */}
          <div>
            <ProductImages images={product.images || [product.image]} productName={product.name} />
          </div>

          {/* 商品信息和购买选项 */}
          <div className="  flex flex-col gap-y-8">
            {/* 商品信息 */}
            <ProductInfo product={product} />

            {/* 购买选项 */}
            <ProductOptions
              product={product}
              quantity={quantity}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              setQuantity={setQuantity}
              setSelectedColor={setSelectedColor}
              setSelectedSize={setSelectedSize}
            />

            {/* 商品详情折叠区域 */}
            <ProductAccordion product={product} />
          </div>
        </div>

        {/* 相关商品 */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div className="mt-16">
            <RelatedProducts products={product.relatedProducts} />
          </div>
        )}
      </div>
    </div>
  );
}

// 导出所有组件
export * from './product-images';
export * from './product-info';
export * from './product-options';
export * from './product-accordion';
export * from './related-products';
