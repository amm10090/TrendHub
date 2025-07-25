'use client';

import { Button, Image } from '@heroui/react';
import { Heart } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useCallback } from 'react';
import Slider from 'react-slick';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import { useProductModal } from '@/contexts/product-modal-context';
import { type Product as ProductType, ProductDetail } from '@/types/product';

interface RelatedProductsProps {
  products: ProductType[];
}

interface ArrowProps {
  onClick?: () => void;
  className?: string;
}

/**
 * 相关产品组件
 * 展示与当前商品相关的其他推荐商品
 */
export function RelatedProducts({ products }: RelatedProductsProps) {
  const t = useTranslations('product');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const { openProductModal } = useProductModal();
  const locale = useLocale();

  const handleProductClick = useCallback(
    async (product: ProductType) => {
      // 1. 在新标签页打开中转页面
      window.open(`/${locale}/track-redirect/product/${product.id}`, '_blank');
      // 2. 在当前页面打开模态框，先获取完整数据
      try {
        const response = await fetch(`/api/public/products/${product.id}`);

        if (!response.ok) {
          return;
        }
        const fullProductDetails: ProductDetail = await response.json();

        openProductModal(fullProductDetails);
      } catch {
        // console.error("Failed to fetch product details:", error);
      }
    },
    [locale, openProductModal]
  );

  // 切换收藏状态
  const toggleFavorite = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    setFavorites((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // 轮播设置
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: Math.min(4, products.length),
    slidesToScroll: 1,
    arrows: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(3, products.length),
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: Math.min(2, products.length),
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          centerMode: true,
          centerPadding: '40px',
        },
      },
    ],
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="related-products">
      <h2 className="text-xl font-medium mb-6 text-text-primary-light dark:text-text-primary-dark">
        {t('relatedProducts')}
      </h2>

      <div className="relative px-0 sm:px-2 md:px-4">
        <Slider {...settings} className="product-slider">
          {products.map((product) => (
            <div key={product.id} className="px-2 sm:px-3 md:px-4">
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleProductClick(product)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleProductClick(product);
                }}
                className="group relative p-3 sm:p-4 bg-bg-primary-light dark:bg-bg-secondary-dark rounded-xl shadow-xs dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-border-primary-light dark:border-border-primary-dark transition-all duration-300 hover:shadow-md dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] block cursor-pointer"
              >
                {product.isNew && (
                  <div className="absolute top-5 left-5 z-20 bg-bg-primary-light dark:bg-bg-tertiary-dark backdrop-blur-xs dark:backdrop-blur-md shadow-xs px-2 py-1 rounded-md">
                    <span className="text-[10px] leading-none sm:text-xs font-medium text-text-primary-light dark:text-text-primary-dark">
                      {t('tags.new')}
                    </span>
                  </div>
                )}
                {product.discount && product.discount > 0 && (
                  <div className="absolute top-5 left-5 z-20 bg-red-600 dark:bg-red-700 backdrop-blur-xs dark:backdrop-blur-md shadow-xs px-2 py-1 rounded-md">
                    <span className="text-[10px] leading-none sm:text-xs font-medium text-white dark:text-white">
                      -{product.discount}%
                    </span>
                  </div>
                )}
                <div className="relative overflow-hidden rounded-lg bg-bg-primary-light dark:bg-bg-secondary-dark shadow-[inset_0_0_8px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_0_12px_rgba(0,0,0,0.1)]">
                  <Button
                    isIconOnly
                    aria-label={
                      favorites[product.id] ? t('removeFromWishlist') : t('addToWishlist')
                    }
                    className="absolute top-2 right-2 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-bg-primary-light/80 dark:bg-bg-tertiary-dark/90 hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark backdrop-blur-xs shadow-xs p-0 min-w-0 w-7 h-7 sm:w-9 sm:h-9"
                    variant="flat"
                    onClick={(e) => toggleFavorite(e, product.id)}
                  >
                    <Heart
                      className={`h-4 w-4 sm:h-5 sm:w-5 text-text-primary-light dark:text-text-primary-dark transition-colors duration-200 group-hover:text-red-500 ${
                        favorites[product.id] ? 'fill-red-500 text-red-500' : ''
                      }`}
                    />
                  </Button>
                  <div className="relative aspect-square">
                    <Image
                      alt={product.name}
                      classNames={{
                        wrapper: 'aspect-square overflow-hidden',
                        img: 'w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-105 dark:opacity-90 dark:group-hover:opacity-100',
                      }}
                      src={product.images?.[0]}
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-y-2">
                  <h3 className="text-[11px] sm:text-sm font-semibold tracking-wide text-text-secondary-light dark:text-text-secondary-dark">
                    {product.brandName || 'Brand'}
                  </h3>
                  <div className="flex flex-col gap-y-1">
                    <p className="text-[11px] sm:text-sm font-normal text-text-primary-light dark:text-text-primary-dark line-clamp-2 leading-relaxed">
                      {product.name}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p
                        className={`text-[11px] sm:text-sm font-medium ${product.discount ? 'text-red-600 dark:text-red-400' : 'text-text-primary-light dark:text-text-primary-dark'}`}
                      >
                        ¥{product.price.toLocaleString()}
                      </p>
                      {product.originalPrice && product.discount && (
                        <p className="text-[10px] sm:text-xs line-through text-text-tertiary-light dark:text-text-tertiary-dark">
                          ¥{product.originalPrice.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
}

function NextArrow(props: ArrowProps) {
  const { onClick } = props;

  return (
    <button
      aria-label="下一个"
      className="absolute -right-2 top-[calc(50%-2.5rem)] z-20 bg-bg-primary-light dark:bg-bg-primary-dark hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark rounded-full p-2 shadow-md flex items-center justify-center w-8 h-8"
      onClick={onClick}
    >
      <svg
        className="text-text-primary-light dark:text-text-primary-dark"
        fill="none"
        height="20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  );
}

function PrevArrow(props: ArrowProps) {
  const { onClick } = props;

  return (
    <button
      aria-label="上一个"
      className="absolute -left-2 top-[calc(50%-2.5rem)] z-20 bg-bg-primary-light dark:bg-bg-primary-dark hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark rounded-full p-2 shadow-md flex items-center justify-center w-8 h-8"
      onClick={onClick}
    >
      <svg
        className="text-text-primary-light dark:text-text-primary-dark"
        fill="none"
        height="20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
  );
}
