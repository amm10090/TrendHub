'use client';

import { Chip } from '@heroui/react';
import { useTranslations } from 'next-intl';

import { type ProductDetail as ProductDetailType } from '@/types/product';

interface ProductInfoProps {
  product: ProductDetailType;
}

/**
 * 商品信息组件
 * 展示品牌、商品名称、价格和折扣信息
 */
export function ProductInfo({ product }: ProductInfoProps) {
  const t = useTranslations('product');

  // 计算折扣价格显示
  const hasDiscount = !!product.discount && product.discount > 0;
  const discountLabel = hasDiscount ? `-${product.discount}%` : '';

  return (
    <div className="flex flex-col gap-y-4">
      {/* 品牌名 */}
      <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-text-primary-light dark:text-text-primary-dark">
        {product.brand.name}
      </h1>

      {/* 商品名称 */}
      <h2 className="text-xl md:text-2xl font-light text-text-primary-light dark:text-text-primary-dark">
        {product.name}
      </h2>

      {/* 价格信息 */}
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-xl md:text-2xl font-medium ${hasDiscount ? 'text-red-600 dark:text-red-400' : 'text-text-primary-light dark:text-text-primary-dark'}`}
          >
            ¥{Number(product.price).toLocaleString()}
          </span>

          {hasDiscount && product.originalPrice && (
            <span className="text-sm md:text-base line-through text-text-tertiary-light dark:text-text-tertiary-dark">
              ¥{Number(product.originalPrice).toLocaleString()}
            </span>
          )}
        </div>

        {hasDiscount && (
          <Chip
            classNames={{
              base: 'bg-red-600 dark:bg-red-700 h-6',
              content: 'text-white dark:text-white text-xs px-2 py-0.5',
            }}
            variant="flat"
          >
            {discountLabel}
          </Chip>
        )}
      </div>

      {/* 商品状态标签 */}
      <div className="flex flex-wrap gap-2 mt-2">
        {product.isNew && (
          <Chip
            classNames={{
              base: 'bg-bg-secondary-light dark:bg-bg-tertiary-dark',
              content:
                'text-xs font-medium px-2 py-0.5 text-text-primary-light dark:text-text-primary-dark',
            }}
            variant="flat"
          >
            {t('tags.new')}
          </Chip>
        )}

        <Chip
          classNames={{
            base: 'bg-bg-secondary-light dark:bg-bg-tertiary-dark',
            content:
              'text-xs font-medium px-2 py-0.5 text-text-primary-light dark:text-text-primary-dark',
          }}
          variant="flat"
        >
          {t('tags.freeShipping')}
        </Chip>

        <Chip
          classNames={{
            base: 'bg-bg-secondary-light dark:bg-bg-tertiary-dark',
            content:
              'text-xs font-medium px-2 py-0.5 text-text-primary-light dark:text-text-primary-dark',
          }}
          variant="flat"
        >
          {t('tags.freeReturns')}
        </Chip>
      </div>

      {/* SKU信息 */}
      <div className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark mt-4">
        {t('sku')}: {product.sku}
      </div>
    </div>
  );
}
