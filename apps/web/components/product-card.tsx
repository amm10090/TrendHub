'use client';

import { Heart } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState, useCallback } from 'react';

import { useProductModal } from '@/contexts/product-modal-context';
import { ProductBasic } from '@/services/product.service';
import { ProductDetail as ProductDetailType } from '@/types/product';

interface ProductCardProps {
  product: ProductBasic;
  locale: string;
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const t = useTranslations('products');
  const [isFavorite, setIsFavorite] = useState(false);
  const { openProductModal } = useProductModal();

  // 计算折扣百分比
  const discountPercent = product.discount
    ? parseInt(product.discount)
    : product.originalPrice
      ? Math.round(100 - (parseFloat(product.price) / parseFloat(product.originalPrice)) * 100)
      : 0;

  const handleProductClick = useCallback(async () => {
    // 1. 在新标签页打开中转页面
    window.open(`/${locale}/track-redirect/product/${product.id}`, '_blank');

    // 2. 在当前页面打开模态框
    // 为此，我们需要获取完整的商品详情
    try {
      const response = await fetch(`/api/public/products/${product.id}`);

      if (!response.ok) {
        // 如果获取失败，可以选择不打开模态框或显示错误
        return;
      }
      const fullProductDetails: ProductDetailType = await response.json();

      openProductModal(fullProductDetails);
    } catch {
      // 网络错误等
    }
  }, [product, locale, openProductModal]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    // 这里可以添加收藏/取消收藏的API调用
  };

  return (
    <div
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-border-primary-light transition-all hover:-translate-y-1 hover:shadow-md dark:border-border-primary-dark"
      onClick={handleProductClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleProductClick();
      }}
      role="button"
      tabIndex={0}
    >
      {/* 产品图片 */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-bg-tertiary-light dark:bg-bg-tertiary-dark">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-text-secondary-light dark:text-text-secondary-dark">
              {t('noImage')}
            </span>
          </div>
        )}

        {/* 收藏按钮 */}
        <button
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 backdrop-blur transition-colors hover:bg-white dark:bg-black/50 dark:hover:bg-black/70"
          onClick={toggleFavorite}
          aria-label={isFavorite ? t('removeFromWishlist') : t('addToWishlist')}
        >
          <Heart
            className={`h-5 w-5 ${
              isFavorite
                ? 'fill-red-500 text-red-500'
                : 'text-text-primary-light dark:text-text-primary-dark'
            }`}
          />
        </button>

        {/* 折扣标签 */}
        {discountPercent > 0 && !product.isNew && (
          <div className="absolute left-0 top-2 bg-red-500 px-2 py-1 text-xs font-bold text-white">
            -{discountPercent}%
          </div>
        )}

        {/* 新品标签 */}
        {product.isNew && (
          <div className="absolute left-0 top-2 bg-green-500 px-2 py-1 text-xs font-bold text-white">
            {t('new')}
          </div>
        )}
      </div>

      {/* 产品信息 */}
      <div className="flex flex-1 flex-col p-4">
        {/* 品牌名称 */}
        <div className="mb-1 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
          {product.brandName}
        </div>

        {/* 产品名称 */}
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-text-primary-light group-hover:underline dark:text-text-primary-dark">
          {product.name}
        </h3>

        {/* 价格信息 */}
        <div className="mt-auto flex items-center">
          {product.originalPrice ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-red-500">
                ¥{parseFloat(product.price).toLocaleString('zh-CN')}
              </span>
              <span className="text-xs text-text-secondary-light line-through dark:text-text-secondary-dark">
                ¥{parseFloat(product.originalPrice).toLocaleString('zh-CN')}
              </span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
              ¥{parseFloat(product.price).toLocaleString('zh-CN')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
