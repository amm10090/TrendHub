'use client';

import { Link } from '@heroui/react';
import { Button } from '@heroui/react';
import { Image } from '@heroui/react';
import { Chip } from '@heroui/react';
import React from 'react';
import Slider from 'react-slick';
import { useTranslations } from 'use-intl';

import { HeartIcon } from './icons';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
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
  },
  {
    id: '2',
    name: 'GG Marmont 链条包',
    brand: 'Gucci',
    price: 21500,
    image: '/images/products/bag.jpg',
  },
  {
    id: '3',
    name: '高跟凉鞋',
    brand: 'Jimmy Choo',
    price: 7980,
    image: '/images/products/shoes.jpg',
  },
  {
    id: '4',
    name: '金色贝壳耳环',
    brand: 'Alessandra Rich',
    price: 2980,
    image: '/images/products/earrings.jpg',
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
  const t = useTranslations();
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
                  <div className="group relative p-3 sm:p-4 bg-bg-primary-light dark:bg-bg-secondary-dark rounded-xl shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-border-primary-light dark:border-border-primary-dark transition-all duration-300 hover:shadow-md dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
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
                      >
                        <HeartIcon className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-text-primary-light dark:text-text-primary-dark" />
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
                      <h3 className="text-[11px] sm:text-sm font-semibold tracking-wide text-text-secondary-light dark:text-text-secondary-dark">{product.brand}</h3>
                      <Link className="block space-y-1" href={`/products/${product.id}`}>
                        <p className="text-[11px] sm:text-sm font-normal text-text-primary-light dark:text-text-primary-dark line-clamp-2 leading-relaxed">
                          {product.name}
                        </p>
                        <p className="text-[11px] sm:text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                          ¥{product.price.toLocaleString()}
                        </p>
                      </Link>
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
