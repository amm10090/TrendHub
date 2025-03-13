'use client';

import { Card, CardFooter, Image, Link, Spacer } from '@heroui/react';
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
  customSize?: {
    width: string;
    height: string;
  };
  subtitle?: string;
  textPosition?: 'bottom' | 'center';
  topLabel?: string;
  textPlacement?: 'below-image' | 'above-image' | 'overlay' | 'standalone';
  labelText?: string;
  isHoverable?: boolean;
  isPressable?: boolean;
}

const TrendingCard: React.FC<TrendingCardProps> = ({
  title,
  description,
  imageUrl,
  href,
  size = 'normal',
  className = '',
  hideDescription = false,
  customSize,
  subtitle,
  textPosition = 'bottom',
  topLabel,
  textPlacement = 'overlay',
  labelText,
  isHoverable = true,
  isPressable = true,
}) => {
  const t = useTranslations('trending');
  const router = useRouter();

  // 使用自定义尺寸或默认尺寸
  const cardSizes = customSize || {
    width: 'w-full',
    height: 'aspect-[680/930] h-auto',
  };

  const isHorizontal = size === 'horizontal';
  const isSmallCard = size === 'normal' && customSize?.height.includes('350');
  const isCenterText = textPosition === 'center';

  // 独立文本容器布局（mytheresa风格）
  if (textPlacement === 'standalone') {
    return (
      <Card
        isHoverable={isHoverable}
        isPressable={isPressable}
        className={`${cardSizes.width} ${cardSizes.height} bg-transparent border-none shadow-none ${className}`}
        onPress={() => router.push(href)}
      >
        <div className="w-full h-full">
          {/* 图片容器 */}
          <div className="relative w-full h-full overflow-hidden">
            <Image
              isZoomed
              removeWrapper
              alt={title}
              className="w-full h-full object-cover"
              src={imageUrl}
            />

            {/* 顶部标签 - 使用labelText */}
            {labelText && (
              <div className="absolute top-4 left-0 right-0 text-center">
                <span className="text-xs uppercase tracking-wider text-white bg-black/50 px-3 py-1 rounded-full">
                  {labelText}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // 文本在图片下方或上方的布局
  if (textPlacement === 'below-image' || textPlacement === 'above-image') {
    return (
      <Card
        isHoverable={isHoverable}
        isPressable={isPressable}
        className={`${cardSizes.width} ${cardSizes.height} bg-bg-secondary-light dark:bg-bg-secondary-dark border-border-primary-light dark:border-border-primary-dark flex flex-col ${className}`}
        onPress={() => router.push(href)}
      >
        <div
          className={`flex flex-col h-full ${textPlacement === 'above-image' ? 'flex-col-reverse' : 'flex-col'}`}
        >
          {/* 图片区域 */}
          <div className="relative flex-grow overflow-hidden">
            <Image
              isZoomed
              removeWrapper
              alt={title}
              className="w-full h-full object-cover"
              src={imageUrl}
            />

            {/* 顶部标签 */}
            {topLabel && textPlacement !== 'above-image' && (
              <div className="absolute top-4 left-0 right-0 text-center">
                <span className="text-xs uppercase tracking-wider text-white bg-black/50 px-3 py-1 rounded-full">
                  {topLabel}
                </span>
              </div>
            )}
          </div>

          {/* 文本区域 */}
          <div
            className={`p-4 ${textPlacement === 'above-image' ? 'pb-2' : 'pt-4'} bg-white dark:bg-default-900 text-text-primary-light dark:text-text-primary-dark`}
          >
            <div className="text-center">
              <h3 className={`${size === 'large' ? 'text-2xl' : 'text-lg'} font-bold mb-1`}>
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2">
                  {subtitle}
                </p>
              )}
              {!hideDescription && description && (
                <>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
                    {description}
                  </p>
                  <Link
                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline inline-block mt-3"
                    href={href}
                  >
                    {t('discover_more')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // 原有的覆盖式布局
  return (
    <Card
      isHoverable={isHoverable}
      isPressable={isPressable}
      className={`${cardSizes.width} ${cardSizes.height} bg-bg-secondary-light dark:bg-bg-secondary-dark border-border-primary-light dark:border-border-primary-dark ${className}`}
      onPress={() => router.push(href)}
    >
      {/* 使用绝对定位让图片作为完整的封面 */}
      <Image
        isZoomed
        removeWrapper
        alt={title}
        className="absolute top-0 left-0 z-0 w-full h-full object-cover"
        src={imageUrl}
      />

      {/* 内容区域，使用相对定位浮在图片上方 */}
      <div className="relative z-10 flex flex-col h-full">
        {/* 顶部标签 */}
        {topLabel && (
          <div className="absolute top-4 left-0 right-0 text-center">
            <span className="text-xs uppercase tracking-wider text-white bg-black/50 px-3 py-1 rounded-full">
              {topLabel}
            </span>
          </div>
        )}

        {isCenterText ? (
          // 居中文本布局
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center text-white bg-black/40 p-6 rounded-sm backdrop-blur-sm">
              <h3 className="text-xl md:text-2xl font-bold mb-2">{title}</h3>
              {subtitle && <p className="text-sm opacity-90 mb-4">{subtitle}</p>}
              <Link
                className="text-sm font-medium hover:opacity-70 inline-block mt-2 border-b border-white/50 pb-1"
                href={href}
              >
                {t('discover_more')}
              </Link>
            </div>
          </div>
        ) : (
          // 底部文本布局
          <>
            {/* 空白区域占据上部分空间 */}
            <div className={`flex-grow ${isHorizontal ? 'basis-1/2' : 'basis-2/3'}`} />

            {/* 底部内容区域，添加渐变背景增强可读性 */}
            <CardFooter
              className={`flex-shrink-0 flex flex-col items-start p-6 bg-gradient-to-t from-black/70 to-transparent text-white`}
            >
              {isSmallCard ? (
                <>
                  {/* 小卡片的标题样式 */}
                  <div className="w-full">
                    <h3 className="text-xl font-bold text-center mb-1">{title}</h3>
                    {subtitle && <p className="text-sm text-center opacity-90 mb-2">{subtitle}</p>}
                  </div>
                </>
              ) : (
                <>
                  {/* 大卡片的标题样式 */}
                  <h3
                    className={`${size === 'large' || size === 'horizontal' ? 'text-2xl' : 'text-lg sm:text-xl'} font-bold text-center w-full`}
                  >
                    {title}
                  </h3>
                </>
              )}

              {!hideDescription && description && (
                <>
                  <Spacer y={2} />
                  <p className="text-sm opacity-90">{description}</p>
                  <Spacer y={4} />
                  <Link className="text-sm font-medium hover:opacity-70" href={href}>
                    {t('discover_more')}
                  </Link>
                </>
              )}
            </CardFooter>
          </>
        )}
      </div>
    </Card>
  );
};

export const TrendingSection: React.FC = () => {
  const t = useTranslations('trending');
  const bannerT = useTranslations('banner');

  const trendingItems = [
    {
      title: bannerT('title') || 'Gucci New Season',
      description:
        bannerT('description') ||
        'Explore Gucci Spring/Summer 2024 Collection, experience the perfect blend of Italian luxury and modern fashion',
      imageUrl: '/images/trending/new-season-1.webp',
      href: '/product/list?brand=gucci&gender=women',
      size: 'large' as const,
      customSize: {
        width: 'w-full lg:w-[680px]',
        height: 'h-auto aspect-[680/930] lg:h-[930px]',
      },
    },
    {
      title: t('items.valentino.title') || '华伦天奴',
      description: t('items.valentino.description') || '探索奢华配饰的最新系列',
      imageUrl: '/images/trending/new-arrivals.webp',
      href: '/product/list?brand=valentino&category=accessories&gender=women',
      size: 'normal' as const,
      customSize: {
        width: 'w-full lg:w-[680px]',
        height: 'h-auto aspect-[680/400] lg:h-[400px]',
      },
      textPlacement: 'standalone' as const,
    },
    {
      title: t('items.prada.title') || '普拉达新款包袋',
      description:
        t('items.prada.description') || '探索Prada标志性的Re-Edition系列，重新演绎经典设计',
      imageUrl: '/images/trending/prada-bags.webp',
      href: '/product/list?brand=prada&category=bags&gender=women',
      size: 'normal' as const,
      customSize: {
        width: 'w-full lg:w-[680px]',
        height: 'h-auto aspect-[680/400] lg:h-[400px]',
      },
      textPlacement: 'standalone' as const,
    },
    {
      title: t('items.summer.title') || 'Summer Essentials',
      description:
        t('items.summer.description') || 'Get ready for the season with our curated selection',
      imageUrl: '/images/trending/summer-essentials.webp',
      href: '/product/list?category=clothing&season=summer',
      size: 'normal' as const,
      customSize: {
        width: 'w-full',
        height: 'h-[400px]',
      },
      textPlacement: 'standalone' as const,
    },
    {
      title: t('items.shoes.title') || 'New in Shoes',
      description: t('items.shoes.description') || 'Step into the season with our latest arrivals',
      imageUrl: '/images/trending/shoes-collection.webp',
      href: '/product/list?category=shoes&tag=new',
      size: 'normal' as const,
      customSize: {
        width: 'w-full',
        height: 'h-[400px]',
      },
      textPlacement: 'standalone' as const,
    },
    {
      title: t('items.spring.title') || 'Spring Collection 2024',
      description:
        t('items.spring.description') ||
        'Explore our curated selection of spring essentials. Fresh colors and lightweight fabrics for the new season.',
      imageUrl: '/images/trending/spring-collection.webp',
      href: '/product/list?season=spring&year=2024',
      size: 'large' as const,
      customSize: {
        width: 'w-full lg:w-[680px]',
        height: 'h-auto aspect-[680/930] lg:h-[930px]',
      },
    },
  ];

  const shiningItems = [
    {
      title: t('shining_brands.valentino'),
      imageUrl: '/images/shining/new-arrivals.webp',
      href: '/product/list?brand=valentino&category=bags',
      size: 'small' as const,
    },
    {
      title: t('shining_brands.balmain'),
      imageUrl: '/images/shining/balmain-jacket.webp',
      href: '/product/list?brand=balmain&category=clothing',
      size: 'small' as const,
    },
    {
      title: t('shining_brands.alessandra'),
      imageUrl: '/images/shining/alessandra-earrings.webp',
      href: '/product/list?brand=alessandra-rich&category=jewelry',
      size: 'small' as const,
    },
    {
      title: t('shining_brands.jacquemus'),
      imageUrl: '/images/shining/jacquemus-shoes.webp',
      href: '/product/list?brand=jacquemus&category=shoes',
      size: 'small' as const,
    },
  ];

  // 获取belts相关文本
  const beltsTitle = t('items.belts.title') || 'Accentuate your looks with logo belts';
  const beltsLabel = t('items.belts.label') || 'COME FULL CIRCLE';

  return (
    <section className="w-full bg-bg-tertiary-light dark:bg-bg-tertiary-dark py-12 sm:py-16">
      <div className="container px-4 sm:px-6 mx-auto">
        <div className="flex flex-col items-start">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
            {t('title')}
          </h2>
          <Spacer y={8} />

          {/* 特殊布局：第一个大卡片和右侧三个容器 */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧大卡片 */}
            <div className="lg:row-span-2 h-[930px]">
              <TrendingCard {...trendingItems[0]} />
            </div>

            {/* 右侧布局 - mytheresa风格 */}
            <div className="grid grid-rows-[400px_130px_400px] h-[930px]">
              {/* 上方图片容器 - 使用Image组件 */}
              <div className="w-full h-[400px] relative overflow-hidden">
                <Link href={trendingItems[1].href} className="w-full h-full block">
                  <Image
                    removeWrapper
                    alt={trendingItems[1].title}
                    className="w-full h-full object-cover"
                    src={trendingItems[1].imageUrl}
                  />
                </Link>
              </div>

              {/* 中间文本父容器 - 无背景色 */}
              <div className="flex flex-col justify-center">
                {/* 小号艺术字体文本 (18px) */}
                <div className="text-center mb-3">
                  <span className="text-sm uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                    <Link
                      href={trendingItems[1].href}
                      className="hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {beltsLabel}
                    </Link>
                  </span>
                </div>

                {/* 大号艺术字体文本 (38px) */}
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark">
                    <Link
                      href={trendingItems[2].href}
                      className="hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {beltsTitle}
                    </Link>
                  </h2>
                </div>
              </div>

              {/* 下方图片容器 - 使用Image组件 */}
              <div className="w-full h-[400px] relative overflow-hidden">
                <Link href={trendingItems[2].href} className="w-full h-full block">
                  <Image
                    removeWrapper
                    alt={trendingItems[2].title}
                    className="w-full h-full object-cover"
                    src={trendingItems[2].imageUrl}
                  />
                </Link>
              </div>
            </div>
          </div>

          <Spacer y={8} />

          {/* 第二组三个卡片布局 */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧两个卡片布局 */}
            <div className="grid grid-rows-[400px_130px_400px] h-[930px]">
              {/* 上方图片容器 */}
              <div className="w-full h-[400px] relative overflow-hidden">
                <Link href={trendingItems[3].href} className="w-full h-full block">
                  <Image
                    removeWrapper
                    alt={trendingItems[3].title}
                    className="w-full h-full object-cover"
                    src={trendingItems[3].imageUrl}
                  />
                </Link>
              </div>

              {/* 中间文本父容器 */}
              <div className="flex flex-col justify-center">
                {/* 小号艺术字体文本 */}
                <div className="text-center mb-3">
                  <span className="text-sm uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                    <Link
                      href={trendingItems[3].href}
                      className="hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {beltsLabel}
                    </Link>
                  </span>
                </div>

                {/* 大号艺术字体文本 */}
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark">
                    <Link
                      href={trendingItems[4].href}
                      className="hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {beltsTitle}
                    </Link>
                  </h2>
                </div>
              </div>

              {/* 下方图片容器 */}
              <div className="w-full h-[400px] relative overflow-hidden">
                <Link href={trendingItems[4].href} className="w-full h-full block">
                  <Image
                    removeWrapper
                    alt={trendingItems[4].title}
                    className="w-full h-full object-cover"
                    src={trendingItems[4].imageUrl}
                  />
                </Link>
              </div>
            </div>

            {/* 右侧长方形卡片 */}
            <div className="lg:row-span-2 h-[930px]">
              <TrendingCard
                {...trendingItems[5]}
                customSize={{
                  width: 'w-full lg:w-[680px]',
                  height: 'h-auto aspect-[680/930] lg:h-[930px]',
                }}
              />
            </div>
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
