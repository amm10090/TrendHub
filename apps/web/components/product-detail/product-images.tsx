'use client';

import { Image } from '@heroui/react';
import { useState } from 'react';
import Slider from 'react-slick';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface ProductImagesProps {
    images: string[];
    productName: string;
}

/**
 * 商品图片轮播组件
 * 用于展示商品的多张图片
 */
export function ProductImages({ images, productName }: ProductImagesProps) {
    const [mainIndex, setMainIndex] = useState(0);

    // 主图轮播设置
    const mainSettings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        fade: true,
        beforeChange: (_: number, next: number) => setMainIndex(next),
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
        responsive: [
            {
                breakpoint: 640,
                settings: {
                    arrows: false,
                    dots: true,
                },
            },
        ],
    };

    // 缩略图设置
    const thumbSettings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: images.length > 3 ? 3 : images.length,
        slidesToScroll: 1,
        arrows: false,
        focusOnSelect: true,
        centerMode: images.length > 3,
        centerPadding: '0',
        vertical: true,
        verticalSwiping: true,
        swipeToSlide: true,
        responsive: [
            {
                breakpoint: 768,
                settings: {
                    vertical: false,
                    verticalSwiping: false,
                    slidesToShow: images.length > 4 ? 4 : images.length,
                    swipeToSlide: true,
                },
            },
            {
                breakpoint: 640,
                settings: {
                    vertical: false,
                    verticalSwiping: false,
                    slidesToShow: images.length > 4 ? 4 : images.length,
                    swipeToSlide: true,
                },
            },
        ],
    };

    // 如果没有图片，返回空
    if (images.length === 0) {
        return null;
    }

    // 如果只有一张图片，直接显示
    if (images.length === 1) {
        return (
            <div className="relative">
                <Image
                    src={images[0]}
                    alt={productName}
                    classNames={{
                        wrapper: 'w-full aspect-[3/4]',
                        img: 'w-full h-full object-cover object-center rounded-lg',
                    }}
                />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* 桌面版缩略图 - 左侧垂直排列 */}
            <div className="hidden md:block md:col-span-2 h-[500px] overflow-hidden">
                <Slider {...thumbSettings} className="h-full thumbnails-slider">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className={`p-1 cursor-pointer h-24 ${mainIndex === index
                                ? 'border-2 border-border-primary-light dark:border-border-secondary-dark'
                                : 'border border-border-primary-light dark:border-border-primary-dark'
                                } rounded-md transition-all duration-200`}
                            onClick={() => setMainIndex(index)}
                        >
                            <Image
                                src={image}
                                alt={`${productName} - 缩略图 ${index + 1}`}
                                classNames={{
                                    wrapper: 'w-full h-full',
                                    img: 'w-full h-full object-cover object-center rounded-sm',
                                }}
                            />
                        </div>
                    ))}
                </Slider>
            </div>

            {/* 主图区域 */}
            <div className="col-span-1 md:col-span-10">
                <div className="relative">
                    <Slider {...mainSettings} className="product-main-slider">
                        {images.map((image, index) => (
                            <div key={index} className="outline-none">
                                <div className="relative overflow-hidden rounded-lg bg-bg-primary-light dark:bg-bg-secondary-dark shadow-[inset_0_0_8px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_0_12px_rgba(0,0,0,0.1)]">
                                    <div className="relative aspect-[3/4]">
                                        <Image
                                            src={image}
                                            alt={`${productName} - 图片 ${index + 1}`}
                                            classNames={{
                                                wrapper: 'w-full h-full',
                                                img: 'w-full h-full object-cover object-center',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Slider>
                </div>
            </div>

            {/* 移动版缩略图 - 底部水平排列 */}
            <div className="md:hidden col-span-1 mt-2">
                <div className="flex justify-center gap-2 overflow-x-auto py-2 no-scrollbar">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className={`shrink-0 w-16 h-16 cursor-pointer ${mainIndex === index
                                ? 'border-2 border-border-primary-light dark:border-border-secondary-dark'
                                : 'border border-border-primary-light dark:border-border-primary-dark'
                                } rounded-md overflow-hidden transition-all duration-200`}
                            onClick={() => setMainIndex(index)}
                        >
                            <Image
                                src={image}
                                alt={`${productName} - 缩略图 ${index + 1}`}
                                classNames={{
                                    wrapper: 'w-full h-full',
                                    img: 'w-full h-full object-cover object-center',
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// 箭头组件Props接口
interface ArrowProps {
    onClick?: () => void;
}

// 导航箭头组件
function NextArrow(props: ArrowProps) {
    const { onClick } = props;
    return (
        <button
            aria-label="下一张"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-bg-primary-light/80 dark:bg-bg-tertiary-dark/90 hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark rounded-full p-2 shadow-md flex items-center justify-center w-8 h-8 md:w-10 md:h-10 transition-all duration-300 backdrop-blur-sm"
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
}

function PrevArrow(props: ArrowProps) {
    const { onClick } = props;
    return (
        <button
            aria-label="上一张"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-bg-primary-light/80 dark:bg-bg-tertiary-dark/90 hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark rounded-full p-2 shadow-md flex items-center justify-center w-8 h-8 md:w-10 md:h-10 transition-all duration-300 backdrop-blur-sm"
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
} 