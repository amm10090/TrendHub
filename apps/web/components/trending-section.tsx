'use client';

import { Card, CardBody, CardFooter, Image, Link, Spacer } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as React from 'react';

interface TrendingCardProps {
  title: string;
  description?: string;
  imageUrl: string;
  href: string;
  size?: 'normal' | 'large' | 'vertical' | 'horizontal' | 'small';
  className?: string;
  hideDescription?: boolean;
}

const TrendingCard: React.FC<TrendingCardProps> = ({
  title,
  description,
  imageUrl,
  href,
  size = 'normal',
  className = '',
  hideDescription = false,
}) => {
  const t = useTranslations('trending');
  const router = useRouter();

  const imageHeights = {
    small: 'h-[240px]',
    normal: 'h-[300px]',
    large: 'h-[400px]',
    vertical: 'h-[500px]',
    horizontal: 'h-[280px]',
  };

  const isHorizontal = size === 'horizontal';

  return (
    <Card
      isHoverable
      isPressable
      className={`w-full bg-bg-secondary-light dark:bg-bg-secondary-dark border-border-primary-light dark:border-border-primary-dark ${className}`}
      onPress={() => router.push(href)}
    >
      <div className={`${isHorizontal ? 'lg:flex' : ''}`}>
        <CardBody className={`p-0 overflow-hidden ${isHorizontal ? 'lg:w-2/3' : 'w-full'}`}>
          <Image
            isZoomed
            removeWrapper
            alt={title}
            className={`w-full object-cover ${imageHeights[size]}`}
            src={imageUrl}
          />
        </CardBody>
        <CardFooter
          className={`flex flex-col items-start p-6 ${isHorizontal ? 'lg:w-1/3 lg:justify-center' : ''}`}
        >
          <h3
            className={`${size === 'large' || size === 'horizontal' ? 'text-2xl' : 'text-lg sm:text-xl'} font-bold text-text-primary-light dark:text-text-primary-dark text-center w-full`}
          >
            {title}
          </h3>
          {!hideDescription && description && (
            <>
              <Spacer y={2} />
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {description}
              </p>
              <Spacer y={4} />
              <Link
                className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark hover:opacity-70"
                href={href}
              >
                {t('discover_more')}
              </Link>
            </>
          )}
        </CardFooter>
      </div>
    </Card>
  );
};

export const TrendingSection: React.FC = () => {
  const t = useTranslations('trending');
  const bannerT = useTranslations('banner');

  const trendingItems = [
    {
      title: bannerT('title'),
      description: bannerT('description'),
      imageUrl: '/images/trending/gucci-new-season.jpg',
      href: '/product/list?brand=gucci&gender=women',
      size: 'large' as const,
      className: 'lg:col-span-2 lg:row-span-2',
    },
    {
      title: t('items.valentino.title'),
      description: t('items.valentino.description'),
      imageUrl: '/images/trending/valentino-accessories.jpg',
      href: '/product/list?brand=valentino&category=accessories&gender=women',
      size: 'normal' as const,
      className: 'lg:col-span-1',
    },
    {
      title: t('items.prada.title') || '普拉达新款包袋',
      description:
        t('items.prada.description') || '探索Prada标志性的Re-Edition系列，重新演绎经典设计',
      imageUrl: '/images/trending/prada-bags.jpg',
      href: '/product/list?brand=prada&category=bags&gender=women',
      size: 'vertical' as const,
      className: 'lg:col-span-1 lg:row-span-2',
    },
    {
      title: t('items.gucci.title') || 'Gucci男士系列',
      description:
        t('items.gucci.description') || '探索Gucci最新男士时装系列，融合传统工艺与现代设计',
      imageUrl: '/images/trending/gucci-men.jpg',
      href: '/product/list?brand=gucci&gender=men&category=clothing',
      size: 'normal' as const,
      className: 'lg:col-span-1',
    },
    {
      title: t('items.new.title') || '全新上架',
      description: t('items.new.description') || '浏览最新入驻品牌与单品，走在时尚前沿',
      imageUrl: '/images/trending/new-arrivals.jpg',
      href: '/product/list?gender=women&sale=true',
      size: 'horizontal' as const,
      className: 'lg:col-span-2',
    },
  ];

  const shiningItems = [
    {
      title: t('shining_brands.valentino'),
      imageUrl: '/images/shining/valentino-bag.jpg',
      href: '/product/list?brand=valentino&category=bags',
      size: 'small' as const,
    },
    {
      title: t('shining_brands.balmain'),
      imageUrl: '/images/shining/balmain-jacket.jpg',
      href: '/product/list?brand=balmain&category=clothing',
      size: 'small' as const,
    },
    {
      title: t('shining_brands.alessandra'),
      imageUrl: '/images/shining/alessandra-earrings.jpg',
      href: '/product/list?brand=alessandra-rich&category=jewelry',
      size: 'small' as const,
    },
    {
      title: t('shining_brands.jacquemus'),
      imageUrl: '/images/shining/jacquemus-shoes.jpg',
      href: '/product/list?brand=jacquemus&category=shoes',
      size: 'small' as const,
    },
  ];

  return (
    <section className="w-full bg-bg-tertiary-light dark:bg-bg-tertiary-dark py-12 sm:py-16">
      <div className="container px-4 sm:px-6 mx-auto">
        <div className="flex flex-col items-start">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
            {t('title')}
          </h2>
          <Spacer y={8} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-auto gap-6 w-full">
            {trendingItems.map((item, index) => (
              <TrendingCard key={index} {...item} />
            ))}
          </div>

          <div className="w-full mt-20">
            <div className="text-center mb-8">
              <h3 className="text-sm font-medium tracking-widest text-text-secondary-light dark:text-text-secondary-dark uppercase">
                {t('shining_examples.title')}
              </h3>
              <h2 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mt-2">
                {t('shining_examples.subtitle')}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {shiningItems.map((item, index) => (
                <TrendingCard key={index} {...item} hideDescription={true} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                className="inline-flex items-center justify-center px-6 py-2 text-sm font-medium bg-black text-white hover:bg-gray-800 transition-colors"
                href="/product/list?tag=shining"
              >
                {t('shining_examples.see_all')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
