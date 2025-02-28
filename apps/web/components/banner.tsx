'use client';

import { Button } from '@heroui/react';
import { Image } from '@heroui/react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import React from 'react';

export const Banner: React.FC = () => {
  const t = useTranslations('banner');

  return (
    <div className="w-full">
      {/* PC端展示 */}
      <div className="hidden sm:block w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link className="block" href="/women/brands/gucci">
            <div className="relative rounded-lg overflow-hidden cursor-pointer transition-transform duration-500 hover:scale-[1.02]">
              <div className="relative">
                <Image
                  alt="Banner background"
                  classNames={{
                    wrapper: 'w-full',
                    img: 'w-full aspect-[21/9] object-cover opacity-100 dark:opacity-90',
                  }}
                  loading="eager"
                  src="/images/banner-bg.jpg"
                />
                <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <div className="text-text-primary-dark dark:text-text-primary-dark text-center">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-wider mb-4 sm:mb-6 drop-shadow-lg">
                    {t('title')}
                  </h1>
                  <p className="text-base sm:text-lg font-light tracking-wide max-w-2xl mx-auto opacity-90 drop-shadow-md">
                    {t('description')}
                  </p>
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
              alt="Banner background"
              classNames={{
                wrapper: 'w-full',
                img: 'w-full aspect-[4/3] object-cover',
              }}
              loading="eager"
              src="/images/banner-bg.jpg"
            />
            <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <h1 className="text-2xl sm:text-3xl font-medium tracking-wider text-text-primary-dark dark:text-text-primary-dark text-center px-4 drop-shadow-lg">
                {t('title')}
              </h1>
            </div>
          </div>
          <div className="mt-4">
            <Link className="block" href="/women/brands/gucci">
              <Button
                className="w-full bg-bg-primary-dark hover:bg-hover-bg-dark dark:bg-bg-primary-light dark:hover:bg-hover-bg-light text-text-primary-dark dark:text-text-primary-light"
                size="lg"
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
