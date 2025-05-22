'use client';

import { Button } from '@heroui/react';
import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { ProductDetail } from '@/types/product';

interface ProductOptionsProps {
  product: ProductDetail;
  selectedSize: string | null;
  setSelectedSize: (size: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  quantity: number;
  setQuantity: (qty: number) => void;
}

/**
 * 商品选项组件
 * 包含尺寸选择、颜色选择、数量选择和添加购物车按钮
 */
export function ProductOptions({
  product,
  selectedSize,
  setSelectedSize,
  selectedColor,
  setSelectedColor,
  quantity,
  setQuantity,
}: ProductOptionsProps) {
  const t = useTranslations('product');
  const [isFavorite, setIsFavorite] = useState(product.isFavorite || false);

  // 增加商品数量
  const increaseQuantity = () => {
    if (quantity < product.availableQuantity) {
      setQuantity(quantity + 1);
    }
  };

  // 减少商品数量
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // 切换收藏状态
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  return (
    <div className=" flex flex-col gap-y-6">
      {/* 尺寸选择 */}
      {product.sizes && product.sizes.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
              {t('options.selectSize')}
            </h3>
            <button
              className="text-xs text-text-secondary-light dark:text-text-secondary-dark underline hover:text-text-primary-light dark:hover:text-text-primary-dark"
              onClick={() => {}}
            >
              {t('options.sizeGuide')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                className={`min-w-12 h-10 px-3 border rounded-md text-sm transition-all ${
                  selectedSize === size
                    ? 'border-border-secondary-light dark:border-border-secondary-dark bg-bg-secondary-light dark:bg-bg-tertiary-dark text-text-primary-light dark:text-text-primary-dark'
                    : 'border-border-primary-light dark:border-border-primary-dark text-text-secondary-light dark:text-text-secondary-dark hover:border-border-secondary-light dark:hover:border-border-secondary-dark'
                }`}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 颜色选择 */}
      {product.colors && product.colors.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
            {t('options.selectColor')}
          </h3>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((color) => (
              <button
                key={color.name}
                aria-label={`${t('options.color')}: ${color.name}`}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  selectedColor === color.name
                    ? 'ring-2 ring-offset-2 ring-border-secondary-light dark:ring-border-secondary-dark'
                    : ''
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
                onClick={() => setSelectedColor(color.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 数量选择 */}
      <div>
        <h3 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
          {t('options.quantity')}
        </h3>
        <div className="flex items-center max-w-[120px]">
          <button
            className="w-8 h-8 flex items-center justify-center border border-border-primary-light dark:border-border-primary-dark rounded-l-md bg-bg-secondary-light dark:bg-bg-tertiary-dark text-text-primary-light dark:text-text-primary-dark"
            disabled={quantity <= 1}
            onClick={decreaseQuantity}
          >
            -
          </button>
          <div className="w-12 h-8 flex items-center justify-center border-t border-b border-border-primary-light dark:border-border-primary-dark bg-bg-primary-light dark:bg-bg-secondary-dark text-text-primary-light dark:text-text-primary-dark">
            {quantity}
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center border border-border-primary-light dark:border-border-primary-dark rounded-r-md bg-bg-secondary-light dark:bg-bg-tertiary-dark text-text-primary-light dark:text-text-primary-dark"
            disabled={quantity >= product.availableQuantity}
            onClick={increaseQuantity}
          >
            +
          </button>
        </div>
      </div>

      {/* 库存信息 */}
      <div className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
        {product.availableQuantity > 0 ? (
          <>
            <span className="text-green-600 dark:text-green-400">{t('inStock')}</span> -{' '}
            {t('availableItems', { count: product.availableQuantity })}
          </>
        ) : (
          <span className="text-red-600 dark:text-red-400">{t('outOfStock')}</span>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-4">
        <Button className="flex-1 py-6 font-medium" isDisabled={product.availableQuantity === 0}>
          {t('addToCart')}
        </Button>
        <Button
          isIconOnly
          aria-label={isFavorite ? t('removeFromWishlist') : t('addToWishlist')}
          className={`p-0 min-w-14 w-14 h-14 ${
            isFavorite
              ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'
              : 'bg-bg-secondary-light dark:bg-bg-tertiary-dark text-text-primary-light dark:text-text-primary-dark'
          }`}
          variant="flat"
          onPress={toggleFavorite}
        >
          <Heart className="h-6 w-6" fill={isFavorite ? 'currentColor' : 'none'} />
        </Button>
      </div>
    </div>
  );
}
