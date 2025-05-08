'use client';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Image } from '@heroui/image';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import * as React from 'react';
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
  colors: { name: string; value: string }[];
  material: string;
  careInstructions: string[];
  sku: string;
  relatedProducts: Product[];
}

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
    colors: [{ name: '金色', value: '#FFD700' }],
    material: '镀金黄铜、人造珍珠',
    careInstructions: ['避免接触水和化妆品', '存放时使用首饰盒'],
    sku: 'ALE001',
    relatedProducts: [],
  },
];

interface ProductGridHeroData {
  title: string;
  seeAllText: string;
  seeAllLink: string;
}

export function ProductGrid() {
  const [mounted, setMounted] = useState(false);
  const t = useTranslations();
  const { openProductModal } = useProductModal();
  const [heroData, setHeroData] = useState<ProductGridHeroData | null>(null);
  const [isLoadingHero, setIsLoadingHero] = useState(true);
  const [errorHero, setErrorHero] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const fetchHeroData = async () => {
      setIsLoadingHero(true);
      setErrorHero(null);
      try {
        const response = await fetch('/api/public/content-blocks?type=PRODUCT_GRID_HERO');

        if (!response.ok) {
          throw new Error(`API 请求失败: ${response.statusText}`);
        }
        const blocks = await response.json();
        const block = Array.isArray(blocks) && blocks.length > 0 ? blocks[0] : null;

        if (
          block &&
          block.data &&
          typeof block.data.title === 'string' &&
          typeof block.data.seeAllText === 'string' &&
          typeof block.data.seeAllLink === 'string'
        ) {
          setHeroData(block.data as ProductGridHeroData);
        } else {
          setHeroData(null);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : '加载数据时发生未知错误';

        setErrorHero(errorMessage);
      } finally {
        setIsLoadingHero(false);
      }
    };

    fetchHeroData();
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
    nextArrow: <SlickNextArrow />,
    prevArrow: <SlickPrevArrow />,
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

  const displayTitle = heroData?.title || t('nav.newArrivals');
  const displaySeeAllText = heroData?.seeAllText || 'SEE ALL';
  const displaySeeAllLink = heroData?.seeAllLink || '/product/list?tag=new';

  if (!mounted || isLoadingHero) {
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

  if (errorHero) {
    return;
  }

  return (
    <section className="w-full bg-bg-secondary-light dark:bg-bg-primary-dark">
      <div className="container py-8 sm:py-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-text-primary-light dark:text-text-primary-dark">
          {displayTitle}
        </h2>
        <div className="flex flex-col gap-y-12">
          <div className="relative px-0 sm:px-2 md:px-4">
            <Slider {...settings} className="product-slider">
              {products.map((product) => (
                <div key={product.id} className="px-2 sm:px-3 md:px-4">
                  <div
                    aria-label={`查看${product.brand} ${product.name}详情`}
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
                    <Chip
                      classNames={{
                        base: 'absolute top-5 left-5 z-20 bg-bg-primary-light dark:bg-bg-tertiary-dark backdrop-blur-xs dark:backdrop-blur-md shadow-xs',
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
                          src={product.image}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-y-2">
                      <h3 className="text-[11px] sm:text-sm font-semibold tracking-wide text-text-secondary-light dark:text-text-secondary-dark">
                        {product.brand}
                      </h3>
                      <div className=" flex flex-col gap-y-1">
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
        </div>
      </div>
    </section>
  );
}
