'use client';
import { Button, Chip, Image } from '@heroui/react';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import * as React from 'react';
import Slider from 'react-slick';

import type {
  Product as ProductTypeFromAppTypes,
  ProductDetail as ProductModalDetailType,
} from '@/types/product';

import { useProductModal } from '../contexts/product-modal-context';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface SlickArrowProps {
  onClick?: () => void;
  className?: string;
}

const SlickNextArrow: React.FC<SlickArrowProps> = (props) => {
  return (
    <button
      aria-label="下一个"
      className="absolute -right-2 top-[calc(50%-2.5rem)] z-20 bg-bg-primary-light dark:bg-bg-primary-dark hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark rounded-full p-2 shadow-md flex items-center justify-center w-8 h-8"
      onClick={props.onClick}
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
};

const SlickPrevArrow: React.FC<SlickArrowProps> = (props) => {
  return (
    <button
      aria-label="上一个"
      className="absolute -left-2 top-[calc(50%-2.5rem)] z-20 bg-bg-primary-light dark:bg-bg-primary-dark hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark rounded-full p-2 shadow-md flex items-center justify-center w-8 h-8"
      onClick={props.onClick}
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
};

// 内容块数据结构
interface ProductGridBlockData {
  title?: string;
  subtitle?: string;
  seeAllText?: string;
  seeAllLink?: string;
  productLimit?: number;
  productGender?: 'women' | 'men';
  productTag?: string;
  productCategory?: string;
  productBrand?: string;
  showNewArrivalChip?: boolean;
  showPriceDiscount?: boolean;
}

interface ProductGridContentBlock {
  id: string;
  identifier: string;
  type: 'PRODUCT_GRID_CONFIGURABLE';
  name: string;
  data: ProductGridBlockData;
  items: {
    id: string;
    itemIdentifier?: string | null;
    type: string;
    name: string;
    data: unknown;
    order: number;
  }[];
}

interface ProductGridProps {
  gender?: 'women' | 'men';
}

export const ProductGrid: React.FC<ProductGridProps> = ({ gender }) => {
  const [mounted, setMounted] = useState(false);
  const t = useTranslations();
  const { openProductModal } = useProductModal();
  const [productsToDisplay, setProductsToDisplay] = useState<ProductTypeFromAppTypes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentBlock, setContentBlock] = useState<ProductGridContentBlock | null>(null);
  const params = useParams();
  const locale = (params?.locale as string) || 'zh';

  useEffect(() => {
    setMounted(true);

    const fetchContentBlock = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. 先请求内容块配置
        let contentBlockApiUrl =
          '/api/public/content-blocks?type=PRODUCT_GRID_CONFIGURABLE&single=true';

        if (gender) {
          contentBlockApiUrl = `/api/public/content-blocks?categorySlug=${gender}&type=PRODUCT_GRID_CONFIGURABLE&single=true`;
        } else {
          // 默认使用women分类
          contentBlockApiUrl = `/api/public/content-blocks?categorySlug=women&type=PRODUCT_GRID_CONFIGURABLE&single=true`;
        }

        const contentBlockResponse = await fetch(contentBlockApiUrl);

        let blockData: ProductGridContentBlock | null = null;

        if (contentBlockResponse.ok) {
          blockData = await contentBlockResponse.json();
          setContentBlock(blockData);
        } else if (contentBlockResponse.status !== 404) {
          console.warn('Failed to fetch content block configuration:', contentBlockResponse.status);
        }

        // 2. 根据内容块配置构建产品API请求
        let productApiUrl = '/api/public/products';
        const params = new URLSearchParams();

        if (blockData?.data) {
          // 使用内容块配置
          if (blockData.data.productLimit) {
            params.append('limit', blockData.data.productLimit.toString());
          } else {
            params.append('limit', '12'); // 默认值
          }

          if (blockData.data.productGender || gender) {
            params.append('gender', blockData.data.productGender || gender || 'women');
          } else {
            params.append('gender', 'women'); // 默认值
          }

          if (blockData.data.productTag) {
            params.append('tag', blockData.data.productTag);
          }

          if (blockData.data.productCategory) {
            params.append('category', blockData.data.productCategory);
          }

          if (blockData.data.productBrand) {
            params.append('brand', blockData.data.productBrand);
          }
        } else {
          // 回退到默认配置
          params.append('limit', '12');
          if (gender) {
            params.append('gender', gender);
          } else {
            params.append('gender', 'women');
          }
        }

        productApiUrl += '?' + params.toString();

        // 3. 请求产品数据
        const productResponse = await fetch(productApiUrl);

        if (!productResponse.ok) {
          throw new Error(t('productGrid.errors.fetchProductsError'));
        }

        const result = await productResponse.json();

        setProductsToDisplay(result.data || []);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : t('productGrid.errors.unknown');

        setError(errorMessage);
        setProductsToDisplay([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentBlock();
  }, [t, gender]);

  const handleProductClick = (product: ProductTypeFromAppTypes) => {
    if (!mounted) return;

    // 1. 在新标签页打开中转页面
    window.open(`/${locale}/track-redirect/product/${product.id}`, '_blank');

    // 2. 在当前页面打开模态框
    const productDetailForModal: ProductModalDetailType = {
      id: product.id,
      name: product.name,
      images: product.images || [],
      description: product.description || t('productGrid.defaultDescription'),
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      isNew: product.isNew,
      isFavorite: product.isFavorite,
      currency: product.currency,
      gender: product.gender,
      categories: product.categories,
      sku: product.sku || t('productGrid.defaultSku'),
      status: product.status,
      videos: product.videos || [],
      brandName: product.brandName,
      brandSlug: product.brandSlug,
      brandId: product.brandId,
      brandLogo: product.brandLogo,
      categoryName: product.categoryName,
      categorySlug: product.categorySlug,
      categoryId: product.categoryId,
      inventory: product.inventory,
      availableQuantity: product.inventory || 10,
      careInstructions: product.careInstructions || [t('productGrid.defaultCareInstructions')],
      relatedProducts: product.relatedProducts || [],
      material: product.material,
      details: product.details,
      sizes: product.sizes,
      colors: product.colors,
      specifications: product.specifications,
      adUrl: product.adUrl,
      brand: {
        id: product.brandId || 'unknown-brand',
        name: product.brandName || t('productGrid.unknownBrand'),
        slug: product.brandSlug || 'unknown-brand',
        logo: product.brandLogo,
      },
      category: {
        id: product.categoryId || 'unknown-category',
        name: product.categoryName || t('productGrid.unknownCategory'),
        slug: product.categorySlug || 'unknown-category',
      },
    };

    openProductModal(productDetailForModal);
  };

  const settings = {
    dots: false,
    infinite: productsToDisplay.length > 4,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    nextArrow: <SlickNextArrow />,
    prevArrow: <SlickPrevArrow />,
    responsive: [
      {
        breakpoint: 1536,
        settings: {
          slidesToShow: Math.min(4, productsToDisplay.length),
          infinite: productsToDisplay.length > 4,
        },
      },
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: Math.min(3, productsToDisplay.length),
          infinite: productsToDisplay.length > 3,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(2, productsToDisplay.length),
          infinite: productsToDisplay.length > 2,
          arrows: true,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: Math.min(2, productsToDisplay.length),
          infinite: productsToDisplay.length > 2,
          arrows: true,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: Math.min(2, productsToDisplay.length),
          infinite: productsToDisplay.length > 2,
          arrows: true,
          centerMode: false,
          centerPadding: '0',
        },
      },
    ],
  };

  // 从内容块获取显示配置，如果没有则使用默认值
  const displayTitle =
    contentBlock?.data?.title ||
    (gender
      ? t(`productGrid.title_${gender}`, { defaultValue: t('productGrid.defaultTitle') })
      : t('productGrid.defaultTitle'));

  const displaySeeAllText = contentBlock?.data?.seeAllText || t('productGrid.seeAllDefaultText');

  const displaySeeAllLink =
    contentBlock?.data?.seeAllLink ||
    (gender ? `/product/list?gender=${gender}` : '/product/list?tag=new');

  if (!mounted || (isLoading && !productsToDisplay.length)) {
    return (
      <section className="w-full bg-bg-secondary-light dark:bg-bg-primary-dark">
        <div className="container py-8 sm:py-12">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6 sm:mb-8 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full bg-bg-secondary-light dark:bg-bg-primary-dark">
        <div className="container py-8 sm:py-12 text-center">
          <p className="text-red-500">
            {t('productGrid.errors.loadFailed')}: {error}
          </p>
        </div>
      </section>
    );
  }

  if (productsToDisplay.length === 0 && !isLoading) {
    return (
      <section className="w-full bg-bg-secondary-light dark:bg-bg-primary-dark">
        <div className="container py-8 sm:py-12 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-text-primary-light dark:text-text-primary-dark">
            {displayTitle}
          </h2>
          <p>{t('productGrid.noProducts')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-bg-secondary-light dark:bg-bg-primary-dark">
      <div className="container py-8 sm:py-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-text-primary-light dark:text-text-primary-dark">
          {displayTitle}
        </h2>
        {contentBlock?.data?.subtitle && (
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6 text-center">
            {contentBlock.data.subtitle}
          </p>
        )}
        <div className="flex flex-col gap-y-12">
          <div className="relative px-0 sm:px-2 md:px-4">
            {productsToDisplay.length > 0 && (
              <Slider {...settings} className="product-slider">
                {productsToDisplay.map((product) => (
                  <div key={product.id} className="px-2 sm:px-3 md:px-4">
                    <div
                      aria-label={t('productGrid.viewProductDetails', {
                        brandName: product.brandName || t('productGrid.unknownBrand'),
                        productName: product.name,
                      })}
                      className="group relative p-3 sm:p-4 bg-bg-primary-light dark:bg-bg-secondary-dark rounded-xl shadow-xs dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-border-primary-light dark:border-border-primary-dark transition-all duration-300 hover:shadow-md dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleProductClick(product)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleProductClick(product);
                        }
                      }}
                    >
                      {product.isNew && contentBlock?.data?.showNewArrivalChip !== false && (
                        <Chip
                          classNames={{
                            base: 'absolute top-5 left-5 z-20 bg-bg-primary-light dark:bg-bg-tertiary-dark backdrop-blur-xs dark:backdrop-blur-md shadow-xs',
                            content:
                              'text-[9px] leading-none sm:text-xs font-medium px-1.5 py-0.5 sm:px-2 sm:py-1 text-text-primary-light dark:text-text-primary-dark',
                          }}
                          variant="flat"
                        >
                          <span className="hidden sm:inline">
                            {t('productGrid.newArrivalChip')}
                          </span>
                          <span className="inline sm:hidden">{t('productGrid.newChip')}</span>
                        </Chip>
                      )}
                      <div className="relative overflow-hidden rounded-lg bg-bg-primary-light dark:bg-bg-secondary-dark shadow-[inset_0_0_8px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_0_12px_rgba(0,0,0,0.1)]">
                        <Button
                          isIconOnly
                          aria-label={t('productGrid.addToWishlist')}
                          className="absolute top-2 right-2 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-bg-primary-light/80 dark:bg-bg-tertiary-dark/90 hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark backdrop-blur-xs shadow-xs p-0 min-w-0 w-7 h-7 sm:w-9 sm:h-9"
                          variant="flat"
                          onPress={() => {
                            return false;
                          }}
                        >
                          <Heart className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-text-primary-light dark:text-text-primary-dark" />
                        </Button>
                        <div className="relative aspect-square">
                          <Image
                            alt={product.name}
                            classNames={{
                              wrapper: 'aspect-square overflow-hidden',
                              img: 'w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-105 dark:opacity-90 dark:group-hover:opacity-100',
                            }}
                            src={
                              product.images && product.images.length > 0
                                ? product.images[0]
                                : '/images/placeholder.jpg'
                            }
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex flex-col gap-y-2">
                        <h3 className="text-[11px] sm:text-sm font-semibold tracking-wide text-text-secondary-light dark:text-text-secondary-dark">
                          {product.brandName || t('productGrid.unknownBrand')}
                        </h3>
                        <div className=" flex flex-col gap-y-1">
                          <p className="text-[11px] sm:text-sm font-normal text-text-primary-light dark:text-text-primary-dark line-clamp-2 leading-relaxed">
                            {product.name}
                          </p>
                          <div className="flex items-baseline gap-2">
                            <p
                              className={`text-[11px] sm:text-sm font-medium ${product.discount && contentBlock?.data?.showPriceDiscount !== false ? 'text-red-600 dark:text-red-400' : 'text-text-primary-light dark:text-text-primary-dark'}`}
                            >
                              ¥{product.price.toLocaleString()}
                            </p>
                            {product.originalPrice &&
                              contentBlock?.data?.showPriceDiscount !== false && (
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
            )}
          </div>
          {productsToDisplay.length > 0 && (
            <div className="flex justify-center">
              <Button
                as={Link}
                href={displaySeeAllLink}
                className="bg-bg-tertiary-dark hover:bg-hover-bg-dark text-text-primary-dark min-w-[120px] text-xs sm:text-sm font-medium tracking-wide shadow-xs hover:shadow-md transition-all duration-300"
                variant="flat"
              >
                {displaySeeAllText}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
