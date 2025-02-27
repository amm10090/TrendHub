import React from 'react';
import { Button } from '@heroui/button';
import { Image } from '@heroui/image';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export const Banner: React.FC = () => {
    const t = useTranslations('banner');

    return (
        <div className="w-full">
            {/* PC端展示 */}
            <div className="hidden sm:block w-full">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href="/women/brands/gucci" className="block">
                        <div className="relative rounded-lg overflow-hidden cursor-pointer transition-transform duration-500 hover:scale-[1.02]">
                            <div className="relative">
                                <Image
                                    src="/images/banner-bg.jpg"
                                    alt="Banner background"
                                    classNames={{
                                        wrapper: "w-full",
                                        img: "w-full aspect-[21/9] object-cover",
                                    }}
                                    loading="eager"
                                />
                                <div className="absolute inset-0 bg-black/10" />
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                <div className="text-white text-center">
                                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-wider mb-4 sm:mb-6">{t('title')}</h1>
                                    <p className="text-base sm:text-lg font-light tracking-wide max-w-2xl mx-auto opacity-90">{t('description')}</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* 移动端展示 */}
            <div className="sm:hidden w-full">
                <div className="container">
                    <div className="relative rounded-lg overflow-hidden">
                        <Image
                            src="/images/banner-bg.jpg"
                            alt="Banner background"
                            classNames={{
                                wrapper: "w-full",
                                img: "w-full aspect-[4/3] object-cover",
                            }}
                            loading="eager"
                        />
                        <div className="absolute inset-0 bg-black/10" />
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <h1 className="text-2xl sm:text-3xl font-medium tracking-wider text-white text-center px-4">{t('title')}</h1>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Link href="/women/brands/gucci" className="block">
                            <Button
                                size="lg"
                                className="w-full bg-black text-white hover:bg-black/90"
                            >
                                {t('cta')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}; 