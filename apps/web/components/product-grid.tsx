'use client';

import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Image } from '@heroui/image';
import { Heart } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import { useTranslations } from 'use-intl';

import { useProductModal } from '../contexts/product-modal-context';

import { ProductDetail } from './product-detail/product-modal';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  description: string;
  availableQuantity: number;
  isFavorite?: boolean;
  discount?: number;
  originalPrice?: number;
  isNew?: boolean;
  details: string[];
  images: string[];
  sizes: string[];
  colors: { name: string; value: string; }[];
  material: string;
  careInstructions: string[];
  sku: string;
  relatedProducts: Product[];
}

interface ArrowProps {
  onClick?: () => void;
  className?: string;
}

const products: Product[] = [
  {
    id: '1',
    name: '经典风衣',
    brand: 'Burberry',
    price: 19800,
    image: '/images/products/coat.jpg',
    description: '经典格纹风衣，采用优质棉质面料，搭配标志性格纹内衬。',
    availableQuantity: 5,
    isNew: true,
    details: [],
    images: ['/images/products/coat.jpg'],
    sizes: ['S', 'M', 'L'],
    colors: [
      { name: '驼色', value: '#D2B48C' },
      { name: '黑色', value: '#000000' },
    ],
    material: '100% 棉',
    careInstructions: ['专业干洗', '不可漂白', '中温熨烫'],
    sku: 'BUR001',
    relatedProducts: [],
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
    details: [],
    images: ['/images/products/bag.jpg'],
    sizes: ['均码'],
    colors: [
      { name: '黑色', value: '#000000' },
      { name: '白色', value: '#FFFFFF' },
    ],
    material: '100% 小牛皮',
    careInstructions: ['避免雨水', '存放时使用防尘袋', '定期护理'],
    sku: 'GUC001',
    relatedProducts: [],
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
    details: [],
    images: ['/images/products/shoes.jpg'],
    sizes: ['35', '36', '37', '38', '39'],
    colors: [
      { name: '银色', value: '#C0C0C0' },
      { name: '金色', value: '#FFD700' },
    ],
    material: '100% 小羊皮',
    careInstructions: ['避免雨水', '使用专业清洁剂', '存放时使用鞋撑'],
    sku: 'JMC001',
    relatedProducts: [],
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
    details: [],
    images: ['/images/products/earrings.jpg'],
    sizes: ['均码'],
    colors: [
      { name: '金色', value: '#FFD700' },
    ],
    material: '镀金黄铜、人造珍珠',
    careInstructions: ['避免接触水和化妆品', '存放时使用首饰盒'],
    sku: 'ALE001',
    relatedProducts: [],
  },
];

const NextArrow: React.FC<ArrowProps> = ({ onClick }) => {
  return (
    <button
      aria-label="下一个"
      className="absolute -right-2 top-[calc(50%-2.5rem)] z-20 bg-bg-primary-light dark:bg-bg-primary-dark hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark rounded-full p-2 shadow-md flex items-center justify-center w-8 h-8"
      onClick={onClick}
    >
      <svg
        fill="none"
        height="20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="20"
        className="text-text-primary-light dark:text-text-primary-dark"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  );
};

const PrevArrow: React.FC<ArrowProps> = ({ onClick }) => {
  return (
    <button
      aria-label="上一个"
      className="absolute -left-2 top-[calc(50%-2.5rem)] z-20 bg-bg-primary-light dark:bg-bg-primary-dark hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark rounded-full p-2 shadow-md flex items-center justify-center w-8 h-8"
      onClick={onClick}
    >
      <svg
        fill="none"
        height="20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="20"
        className="text-text-primary-light dark:text-text-primary-dark"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
  );
};

export const ProductGrid: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const t = useTranslations();
  const { openProductModal } = useProductModal();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleProductClick = (product: Product) => {
    if (!mounted) return;
    openProductModal(product as unknown as ProductDetail);
  };

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1536,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          arrows: true,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          arrows: true,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          arrows: true,
          infinite: true,
          centerMode: false,
          centerPadding: '0',
        },
      },
    ],
  };

  if (!mounted) {
    return (
      <section className="w-full bg-bg-secondary-light dark:bg-bg-primary-dark">
        <div className="container py-8 sm:py-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-text-primary-light dark:text-text-primary-dark">
            {t('nav.newArrivals')}
          </h2>
          <div className="animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-bg-secondary-light dark:bg-bg-primary-dark">
      <div className="container py-8 sm:py-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-text-primary-light dark:text-text-primary-dark">
          {t('nav.newArrivals')}
        </h2>
        <div className="space-y-12">
          <div className="relative px-0 sm:px-2 md:px-4">
            <Slider {...settings} className="product-slider">
              {products.map((product) => (
                <div key={product.id} className="px-2 sm:px-3 md:px-4">
                  <div
                    className="group relative p-3 sm:p-4 bg-bg-primary-light dark:bg-bg-secondary-dark rounded-xl shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-border-primary-light dark:border-border-primary-dark transition-all duration-300 hover:shadow-md dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] cursor-pointer"
                    onClick={() => handleProductClick(product)}
                  >
                    <Chip
                      classNames={{
                        base: 'absolute top-5 left-5 z-20 bg-bg-primary-light dark:bg-bg-tertiary-dark backdrop-blur-sm dark:backdrop-blur-md shadow-sm',
                        content:
                          'text-[9px] leading-none sm:text-xs font-medium px-1.5 py-0.5 sm:px-2 sm:py-1 text-text-primary-light dark:text-text-primary-dark',
                      }}
                      variant="flat"
                    >
                      <span className="hidden sm:inline">NEW ARRIVAL</span>
                      <span className="inline sm:hidden">NEW</span>
                    </Chip>
                    <div className="relative overflow-hidden rounded-lg bg-bg-primary-light dark:bg-bg-secondary-dark shadow-[inset_0_0_8px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_0_12px_rgba(0,0,0,0.1)]">
                      <Button
                        isIconOnly
                        aria-label="收藏"
                        className="absolute top-2 right-2 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-bg-primary-light/80 dark:bg-bg-tertiary-dark/90 hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark backdrop-blur-sm shadow-sm p-0 min-w-0 w-7 h-7 sm:w-9 sm:h-9"
                        variant="flat"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: 处理收藏功能
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
                          src={product.image}
                        />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <h3 className="text-[11px] sm:text-sm font-semibold tracking-wide text-text-secondary-light dark:text-text-secondary-dark">
                        {product.brand}
                      </h3>
                      <div className="block space-y-1">
                        <p className="text-[11px] sm:text-sm font-normal text-text-primary-light dark:text-text-primary-dark line-clamp-2 leading-relaxed">
                          {product.name}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p className={`text-[11px] sm:text-sm font-medium ${product.discount ? 'text-red-600 dark:text-red-400' : 'text-text-primary-light dark:text-text-primary-dark'}`}>
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
            <style global jsx>{`
              .product-slider .slick-track {
                display: flex !important;
                margin-left: 0;
                margin-right: 0;
                gap: 16px;
              }
              .product-slider .slick-slide {
                height: inherit !important;
              }
              .product-slider .slick-slide > div {
                height: 100%;
              }
              .product-slider .slick-prev,
              .product-slider .slick-next {
                width: 32px;
                height: 32px;
                z-index: 20;
                background: var(--bg-primary-light);
                color: var(--text-primary-light);
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                backdrop-filter: blur(8px);
                transition: all 0.2s;
              }
              .product-slider .slick-prev:hover,
              .product-slider .slick-next:hover {
                background: var(--hover-bg-light);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              }
              .product-slider .slick-prev {
                left: 4px;
              }
              .product-slider .slick-next {
                right: 4px;
              }
              @media (min-width: 1024px) {
                .product-slider .slick-prev {
                  left: -16px;
                }
                .product-slider .slick-next {
                  right: -16px;
                }
              }
              @media (max-width: 640px) {
                .product-slider {
                  margin: 0 -4px;
                }
                .product-slider .slick-slide {
                  padding: 0 4px;
                }
                .product-slider .slick-prev {
                  left: -8px;
                }
                .product-slider .slick-next {
                  right: -8px;
                }
              }
              @media (prefers-color-scheme: dark) {
                .product-slider .slick-prev,
                .product-slider .slick-next {
                  background: var(--bg-tertiary-dark);
                  color: var(--text-primary-dark);
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
                .product-slider .slick-prev:hover,
                .product-slider .slick-next:hover {
                  background: var(--hover-bg-dark);
                  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
                }
              }
            `}</style>
          </div>
          <div className="flex justify-center">
            <Button
              className="bg-bg-tertiary-dark hover:bg-hover-bg-dark text-text-primary-dark min-w-[120px] text-xs sm:text-sm font-medium tracking-wide shadow-sm hover:shadow-md transition-all duration-300"
              variant="flat"
            >
              SEE ALL
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

