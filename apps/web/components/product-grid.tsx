'use client';

import React from 'react';
import { Link } from '@heroui/link';
import { Button } from '@heroui/button';
import { HeartIcon } from './icons';
import { Image } from '@heroui/image';
import { Chip } from '@heroui/chip';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface Product {
    id: string;
    name: string;
    brand: string;
    price: number;
    image: string;
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

const NextArrow = (props: any) => {
    const { onClick } = props;
    return (
        <button
            onClick={onClick}
            className="absolute -right-2 top-[calc(50%-2.5rem)] z-20 bg-white hover:bg-[#F5F5F2] rounded-full p-2 shadow-md flex items-center justify-center w-8 h-8"
            aria-label="下一个"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
            </svg>
        </button>
    );
};

const PrevArrow = (props: any) => {
    const { onClick } = props;
    return (
        <button
            onClick={onClick}
            className="absolute -left-2 top-[calc(50%-2.5rem)] z-20 bg-white hover:bg-[#F5F5F2] rounded-full p-2 shadow-md flex items-center justify-center w-8 h-8"
            aria-label="上一个"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
            </svg>
        </button>
    );
};

export const ProductGrid: React.FC = () => {
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
                }
            },
            {
                breakpoint: 1280,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1,
                }
            },
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                    arrows: true,
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                    arrows: true,
                }
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
                }
            }
        ]
    };

    return (
        <div className="space-y-12">
            <div className="relative px-0 sm:px-2 md:px-4">
                <Slider {...settings} className="product-slider">
                    {products.map((product) => (
                        <div key={product.id} className="px-2 sm:px-3 md:px-4">
                            <div className="group relative">
                                <Chip
                                    variant="flat"
                                    classNames={{
                                        base: "absolute top-2 left-2 z-20 bg-white shadow-sm",
                                        content: "text-[9px] leading-none sm:text-xs font-medium px-1.5 py-0.5 sm:px-2 sm:py-1"
                                    }}
                                >
                                    <span className="hidden sm:inline">NEW ARRIVAL</span>
                                    <span className="inline sm:hidden">NEW</span>
                                </Chip>
                                <div className="relative">
                                    <Button
                                        isIconOnly
                                        variant="flat"
                                        className="absolute top-2 right-2 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white shadow-sm p-0 min-w-0 w-7 h-7 sm:w-9 sm:h-9"
                                        aria-label="收藏"
                                    >
                                        <HeartIcon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                                    </Button>
                                    <div className="aspect-square bg-[#F5F5F2] rounded-lg overflow-hidden w-full">
                                        <Image
                                            src={product.image}
                                            alt={product.name}
                                            classNames={{
                                                wrapper: "w-full h-full",
                                                img: "w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="mt-2 sm:mt-4 px-0.5">
                                    <h3 className="text-[11px] sm:text-sm text-[#666666]">{product.brand}</h3>
                                    <Link href={`/products/${product.id}`} className="block">
                                        <p className="mt-0.5 sm:mt-2 text-[11px] sm:text-sm font-medium text-[#1A1A1A]">{product.name}</p>
                                        <p className="mt-0.5 sm:mt-2 text-[11px] sm:text-sm text-[#1A1A1A]">¥{product.price.toLocaleString()}</p>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </Slider>
                <style jsx global>{`
                    .product-slider .slick-track {
                        display: flex !important;
                        margin-left: 0;
                        margin-right: 0;
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
                        background: white;
                        border-radius: 50%;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        transition: all 0.2s;
                    }
                    .product-slider .slick-prev:hover,
                    .product-slider .slick-next:hover {
                        background: #F5F5F2;
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
                `}</style>
            </div>
            <div className="flex justify-center">
                <Button
                    variant="flat"
                    className="bg-black text-white hover:bg-black/90 min-w-[120px] text-xs sm:text-sm"
                >
                    SEE ALL
                </Button>
            </div>
        </div>
    );
}; 