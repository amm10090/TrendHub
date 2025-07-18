'use client';

import { Card, CardFooter, Image, Link, Spacer } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { useState, useEffect } from 'react';

export interface TrendingCardProps {
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
  itemIdentifier?: string | null;
  dataLabelText?: string;
  dataLabelLinkUrl?: string;
  dataItemTitleText?: string;
  dataItemTitleLinkUrl?: string;
}

const TrendingCard: React.FC<TrendingCardProps> = ({ ...props }) => {
  const {
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
    itemIdentifier,
  } = props;

  const t = useTranslations('trending');
  const router = useRouter();

  const cardSizes = customSize || {
    width: 'w-full',
    // 确保高度有合理的默认值，例如 aspect ratio
    height:
      size === 'large' || size === 'vertical'
        ? 'aspect-[680/930] h-auto'
        : size === 'horizontal'
          ? 'aspect-[930/680] h-auto'
          : size === 'small'
            ? 'aspect-square h-auto' // 给 small 一个默认的方形比例
            : 'aspect-[680/930] h-auto', // 默认normal
  };

  // 如果指定了 customSize，确保使用它
  const finalCardSizes = {
    width: customSize?.width || cardSizes.width,
    height: customSize?.height || cardSizes.height,
  };

  const isHorizontal = size === 'horizontal';
  const isSmallCard = size === 'small'; // 更新 small card 判断
  const isCenterText = textPosition === 'center';

  // 简化：直接使用 title 作为主标题，description 作为副标题/描述
  const displayTitle = title;
  const displaySubtitle = subtitle; // 保留 subtitle 用于兼容
  const titleHref = href;

  if (textPlacement === 'standalone') {
    return (
      <Card
        isHoverable={isHoverable}
        isPressable={isPressable}
        className={`${finalCardSizes.width} ${finalCardSizes.height} bg-transparent border-none shadow-none ${className}`}
        onPress={() => router.push(href)}
        data-item-identifier={itemIdentifier}
      >
        <div className="w-full h-full">
          <div className="relative w-full h-full overflow-hidden">
            <Image
              isZoomed
              removeWrapper
              alt={title}
              className="w-full h-full object-cover"
              src={imageUrl || '/images/placeholder.png'} // 添加后备图片
            />
            {labelText && (
              <div className="absolute top-4 left-0 right-0 text-center">
                <span className="text-xs uppercase tracking-wider text-white bg-gradient-to-r from-black/80 to-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 shadow-lg shadow-black/50">
                  {labelText}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (textPlacement === 'below-image' || textPlacement === 'above-image') {
    return (
      <Card
        isHoverable={isHoverable}
        isPressable={isPressable}
        className={`${finalCardSizes.width} ${finalCardSizes.height} bg-bg-secondary-light dark:bg-bg-secondary-dark border-border-primary-light dark:border-border-primary-dark flex flex-col ${className}`}
        onPress={() => router.push(href)}
        data-item-identifier={itemIdentifier}
      >
        <div
          className={`flex flex-col h-full ${textPlacement === 'above-image' ? 'flex-col-reverse' : 'flex-col'}`}
        >
          <div className="relative flex-grow overflow-hidden">
            <Image
              isZoomed
              removeWrapper
              alt={title}
              className="w-full h-full object-cover"
              src={imageUrl || '/images/placeholder.png'}
            />
            {topLabel && textPlacement !== 'above-image' && (
              <div className="absolute top-4 left-0 right-0 text-center">
                <span className="text-xs uppercase tracking-wider text-white bg-gradient-to-r from-black/80 to-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 shadow-lg shadow-black/50">
                  {topLabel}
                </span>
              </div>
            )}
          </div>
          <div
            className={`p-4 ${textPlacement === 'above-image' ? 'pb-2' : 'pt-4'} bg-white dark:bg-default-900 text-text-primary-light dark:text-text-primary-dark`}
          >
            <div className="text-center">
              <h3 className={`${size === 'large' ? 'text-2xl' : 'text-lg'} font-bold mb-1`}>
                {displayTitle}
              </h3>
              {displaySubtitle && (
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2">
                  {displaySubtitle}
                </p>
              )}
              {!hideDescription && description && (
                <>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2 line-clamp-3">
                    {description}
                  </p>
                  <Link
                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline inline-block mt-3"
                    href={titleHref}
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

  // 原有的覆盖式布局 (Overlay)
  return (
    <Card
      isHoverable={isHoverable}
      isPressable={isPressable}
      className={`${finalCardSizes.width} ${finalCardSizes.height} bg-bg-secondary-light dark:bg-bg-secondary-dark border-border-primary-light dark:border-border-primary-dark ${className} relative overflow-hidden`}
      onPress={() => router.push(href)}
      data-item-identifier={itemIdentifier}
    >
      <Image
        isZoomed
        removeWrapper
        alt={title}
        className="absolute top-0 left-0 z-0 w-full h-full object-cover"
        src={imageUrl || '/images/placeholder.png'}
      />
      {/* 高端渐变遮罩 - 更细腻的层次感 */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-85 group-hover:opacity-95 transition-all duration-500" />

      {/* 微妙的边框高光效果 */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />

      <div className="relative z-10 flex flex-col h-full p-6 sm:p-8 lg:p-10">
        {topLabel && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center w-auto max-w-[calc(100%-3rem)]">
            <span className="text-[9px] sm:text-[10px] lg:text-xs uppercase tracking-[0.25em] text-white bg-gradient-to-r from-black/80 to-black/70 backdrop-blur-md px-4 py-1.5 rounded-full whitespace-nowrap font-medium border border-white/30 shadow-lg shadow-black/50">
              {topLabel}
            </span>
          </div>
        )}

        {isCenterText ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white max-w-lg mx-auto">
              {/* 高端排版设计 */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-light tracking-tight leading-[1.1] mb-4 sm:mb-6">
                  <span className="block bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent">
                    {displayTitle}
                  </span>
                </h3>
                {displaySubtitle && (
                  <div className="relative">
                    <div className="w-12 h-[1px] bg-white/40 mx-auto mb-4" />
                    <p className="text-sm sm:text-base font-light opacity-90 tracking-wide leading-relaxed">
                      {displaySubtitle}
                    </p>
                  </div>
                )}
              </div>

              {!hideDescription && description && (
                <div className="mb-6 sm:mb-8">
                  <p className="text-xs sm:text-sm font-light opacity-80 tracking-wide leading-relaxed line-clamp-3 max-w-md mx-auto">
                    {description}
                  </p>
                </div>
              )}

              {/* 精致的CTA按钮 */}
              <Link
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-light uppercase tracking-[0.2em] text-white/90 hover:text-white border border-white/30 hover:border-white/60 px-6 sm:px-8 py-3 sm:py-4 rounded-none backdrop-blur-sm hover:backdrop-blur-md transition-all duration-300 hover:bg-white/10 group/btn"
                href={titleHref}
              >
                <span>{t('discover_more')}</span>
                <span className="text-[10px] transform group-hover/btn:translate-x-1 transition-transform duration-300">
                  →
                </span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className={`flex-grow ${isHorizontal ? 'basis-1/2' : 'basis-2/3 sm:basis-3/5'}`} />
            <CardFooter className="flex-shrink-0 flex flex-col items-start text-white w-full p-0">
              {isSmallCard ? (
                <div className="w-full text-center">
                  <h3 className="text-lg sm:text-xl font-light tracking-tight leading-tight mb-2">
                    <span className="block bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent">
                      {displayTitle}
                    </span>
                  </h3>
                  {displaySubtitle && (
                    <p className="text-xs sm:text-sm font-light opacity-85 tracking-wide">
                      {displaySubtitle}
                    </p>
                  )}
                </div>
              ) : (
                <div className="w-full text-center mb-4 sm:mb-6">
                  <h3
                    className={`${size === 'large' || size === 'horizontal' ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-xl sm:text-2xl lg:text-3xl'} font-light tracking-tight leading-[1.1] mb-3 sm:mb-4`}
                  >
                    <span className="block bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent">
                      {displayTitle}
                    </span>
                  </h3>

                  {displaySubtitle && (
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-[1px] bg-white/40 mb-3" />
                      <p className="text-sm sm:text-base font-light opacity-85 tracking-wide leading-relaxed max-w-sm">
                        {displaySubtitle}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!hideDescription && description && !isSmallCard && (
                <div className="w-full text-center mb-6 sm:mb-8">
                  <p className="text-xs sm:text-sm font-light opacity-75 tracking-wide leading-relaxed line-clamp-2 max-w-md mx-auto">
                    {description}
                  </p>
                </div>
              )}

              {/* 底部CTA按钮 - 更精致的设计 */}
              <div className="w-full text-center">
                <Link
                  className="inline-flex items-center gap-2 text-xs font-light uppercase tracking-[0.2em] text-white/80 hover:text-white border-b border-white/30 hover:border-white/60 pb-1 transition-all duration-300 group/btn"
                  href={titleHref}
                >
                  <span>{t('discover_more')}</span>
                  <span className="text-[10px] transform group-hover/btn:translate-x-1 transition-transform duration-300">
                    →
                  </span>
                </Link>
              </div>
            </CardFooter>
          </>
        )}
      </div>
    </Card>
  );
};

interface ContentItemDataFromAPI {
  title?: string;
  description?: string;
  imageUrl?: string;
  href?: string;
  size?: 'normal' | 'large' | 'vertical' | 'horizontal' | 'small';
  hideDescription?: boolean;
  customSize?: { width: string; height: string };
  subtitle?: string;
  textPosition?: 'bottom' | 'center';
  topLabel?: string;
  textPlacement?: 'below-image' | 'above-image' | 'overlay' | 'standalone';
  labelText?: string;
  labelLinkUrl?: string;
  itemTitleText?: string;
  itemTitleLinkUrl?: string;
  text?: string;
  linkUrl?: string;
  styleHint?: string;
  dataLabelText?: string;
  dataLabelLinkUrl?: string;
  dataItemTitleText?: string;
  dataItemTitleLinkUrl?: string;
}

interface ContentItemFromAPI {
  id: string;
  itemIdentifier?: string | null;
  slotKey?: string | null;
  type: string;
  name: string;
  data: ContentItemDataFromAPI;
  order: number;
  // isActive: boolean; // 公共API可能不返回isActive，或者总是true
}

interface TrendingSectionBlockData {
  title?: string; // Section 主标题
  shiningExamplesTitle?: string;
  shiningExamplesSubtitle?: string;
  shiningExamplesSeeAllText?: string;
  shiningExamplesSeeAllLink?: string;
}

interface TrendingSectionContentBlock {
  id: string;
  identifier: string;
  type: 'TRENDING_SECTION_CONTAINER';
  name: string;
  data: TrendingSectionBlockData; // 用于存储Section级别的元数据
  items: ContentItemFromAPI[]; // 存储所有卡片和文本链接
}

interface TrendingSectionProps {
  gender?: 'women' | 'men'; // Added gender prop
  // ... other existing props
}

export const TrendingSection: React.FC<TrendingSectionProps> = ({ gender }) => {
  const t = useTranslations('trending');
  const [contentBlock, setContentBlock] = useState<TrendingSectionContentBlock | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let apiUrl = '/api/public/content-blocks?type=TRENDING_SECTION_CONTAINER&single=true';

        if (gender) {
          apiUrl = `/api/public/content-blocks?categorySlug=${gender}&type=TRENDING_SECTION_CONTAINER&single=true`;
        } else {
          // 默认使用women分类
          apiUrl = `/api/public/content-blocks?categorySlug=women&type=TRENDING_SECTION_CONTAINER&single=true`;
        }

        const response = await fetch(apiUrl);

        if (!response.ok) {
          if (response.status === 404) {
            setContentBlock(null);
            setError(null);
          } else {
            throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
          }
        } else {
          const block = await response.json();

          if (block && block.data && Array.isArray(block.items)) {
            setContentBlock(block as TrendingSectionContentBlock);
          } else {
            setContentBlock(null);
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : '加载数据时发生未知错误';

        setError(errorMessage);
        setContentBlock(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [gender, t]);

  const getItemDataBySlotKey = (slotKeyValue: string): ContentItemDataFromAPI | null => {
    const item = contentBlock?.items.find((i) => i.slotKey === slotKeyValue);

    return item?.data || null;
  };

  const getItemsByType = (type: string): ContentItemFromAPI[] => {
    return (
      contentBlock?.items.filter((i) => i.type === type).sort((a, b) => a.order - b.order) || []
    );
  };

  // Section 级别数据
  const sectionData = contentBlock?.data;
  const sectionTitle = sectionData?.title || t('title');

  // 卡片和文本块数据
  const mainLeftCardData = getItemDataBySlotKey('trending_main_large_left');
  const topRightImageData = getItemDataBySlotKey('trending_slot_top_right_image');
  const bottomRightImageData = getItemDataBySlotKey('trending_slot_bottom_right_image');

  const nextTopLeftImageData = getItemDataBySlotKey('trending_slot_next_top_left_image');
  const nextBottomLeftImageData = getItemDataBySlotKey('trending_slot_next_bottom_left_image');
  const mainRightCardData = getItemDataBySlotKey('trending_main_large_right');

  // Shining Examples 数据
  const shiningExamplesTitle = sectionData?.shiningExamplesTitle || t('shining_examples.title');
  const shiningExamplesSubtitle =
    sectionData?.shiningExamplesSubtitle || t('shining_examples.subtitle');
  const shiningExamplesSeeAllText =
    sectionData?.shiningExamplesSeeAllText || t('shining_examples.see_all');
  const shiningExamplesSeeAllLink =
    sectionData?.shiningExamplesSeeAllLink || '/product/list?tag=shining';

  const shiningCards = getItemsByType('SHINING_CARD').map((item) => ({
    ...item.data,
    itemIdentifier: item.itemIdentifier,
    title: item.data.title || 'Shining Item',
    imageUrl: item.data.imageUrl || '/images/placeholder.png',
    href: item.data.href || '#',
    size: item.data.size || 'small',
    hideDescription: item.data.hideDescription !== undefined ? item.data.hideDescription : true,
    textPlacement: item.data.textPlacement || 'overlay',
    subtitle: item.data.subtitle,
  })) as TrendingCardProps[];

  if (isLoading) {
    return (
      <section className="w-full bg-bg-tertiary-light dark:bg-bg-tertiary-dark py-12 sm:py-16">
        <div className="container px-4 sm:px-6 mx-auto">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-8 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="lg:row-span-2 h-[600px] sm:h-[750px] md:h-[850px] lg:h-[930px] bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse" />
            <div className="grid grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] h-[600px] sm:h-[750px] md:h-[850px] lg:h-[930px] gap-y-4">
              <div className="bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse" />
              <div className="h-[100px] sm:h-[130px] bg-gray-200 dark:bg-gray-600 rounded-xl animate-pulse flex flex-col justify-center items-center p-4">
                <div className="h-4 bg-gray-400 dark:bg-gray-500 rounded w-3/4 mb-2" />
                <div className="h-6 bg-gray-400 dark:bg-gray-500 rounded w-1/2" />
              </div>
              <div className="bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse" />
            </div>
          </div>
          <div className="text-center my-12">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mx-auto mb-3 animate-pulse" />
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mx-auto mb-6 animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full bg-bg-tertiary-light dark:bg-bg-tertiary-dark py-12 sm:py-16">
        <div className="container px-4 sm:px-6 mx-auto text-center">
          <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-4">
            获取内容失败
          </h2>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">{error}</p>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">
            请稍后重试或联系管理员。
          </p>
        </div>
      </section>
    );
  }

  // 如果 contentBlock 为 null 但没有 error 且不 loading (理论上不应该发生，除非 API 返回空但 200 OK)
  if (!contentBlock) {
    return (
      <section className="w-full bg-bg-tertiary-light dark:bg-bg-tertiary-dark py-12 sm:py-16">
        <div className="container px-4 sm:px-6 mx-auto text-center">
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            没有可显示的趋势内容。
          </p>
        </div>
      </section>
    );
  }

  const defaultCardProps: Partial<TrendingCardProps> = {
    imageUrl: '/images/placeholder.png',
    href: '#',
    title: '标题加载中',
  };

  // Helper function to create props for TrendingCard, ensuring required fields
  const createCardProps = (
    itemData: ContentItemDataFromAPI | null,
    slotKeyForIdentifier: string | null,
    defaults: Partial<TrendingCardProps>,
    customProps: Partial<TrendingCardProps> = {}
  ): TrendingCardProps | null => {
    if (!itemData) return null;
    // Ensure required fields have fallbacks
    const title = itemData.title || defaults.title || 'Default Title';
    const imageUrl = itemData.imageUrl || defaults.imageUrl || '/images/placeholder.png';
    const href = itemData.href || defaults.href || '#';

    return {
      ...defaults, // Apply defaults first
      ...itemData, // Spread item data
      title, // Override with guaranteed title
      imageUrl, // Override with guaranteed imageUrl
      href, // Override with guaranteed href
      dataLabelText: itemData.dataLabelText || itemData.labelText,
      dataLabelLinkUrl: itemData.dataLabelLinkUrl || itemData.labelLinkUrl,
      dataItemTitleText: itemData.dataItemTitleText || itemData.itemTitleText,
      dataItemTitleLinkUrl: itemData.dataItemTitleLinkUrl || itemData.itemTitleLinkUrl,
      itemIdentifier: slotKeyForIdentifier, // Pass slotKey as itemIdentifier to Card for data attribute or key
      ...customProps, // Apply specific custom props last
    };
  };

  const mainLeftProps = createCardProps(
    mainLeftCardData,
    'trending_main_large_left',
    defaultCardProps,
    {
      customSize: { width: 'w-full', height: 'h-full' },
    }
  );
  const mainRightProps = createCardProps(
    mainRightCardData,
    'trending_main_large_right',
    defaultCardProps,
    {
      customSize: { width: 'w-full', height: 'h-full' },
    }
  );

  // For image-only slots that don't use TrendingCard component directly
  // but still need itemIdentifier for data attributes if any were used (currently not, but good practice)
  const topRightImageItem = contentBlock?.items.find(
    (i) => i.slotKey === 'trending_slot_top_right_image'
  );
  const bottomRightImageItem = contentBlock?.items.find(
    (i) => i.slotKey === 'trending_slot_bottom_right_image'
  );
  const nextTopLeftImageItem = contentBlock?.items.find(
    (i) => i.slotKey === 'trending_slot_next_top_left_image'
  );
  const nextBottomLeftImageItem = contentBlock?.items.find(
    (i) => i.slotKey === 'trending_slot_next_bottom_left_image'
  );

  return (
    <section className="w-full bg-bg-tertiary-light dark:bg-bg-tertiary-dark py-12 sm:py-16">
      <div className="container px-4 sm:px-6 mx-auto">
        <div className="flex flex-col items-start">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
            {sectionTitle}
          </h2>
          <Spacer y={8} />

          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mainLeftProps && (
              <div className="lg:row-span-2 h-[600px] sm:h-[750px] md:h-[850px] lg:h-[930px]">
                <TrendingCard {...mainLeftProps} />
              </div>
            )}

            <div className="grid grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] h-[600px] sm:h-[750px] md:h-[850px] lg:h-[930px] gap-y-4">
              {topRightImageData && (
                <div
                  className="w-full h-full relative overflow-hidden rounded-xl"
                  data-item-identifier={
                    topRightImageItem?.itemIdentifier || topRightImageItem?.slotKey
                  }
                >
                  <Link href={topRightImageData.href || '#'} className="w-full h-full block">
                    <Image
                      removeWrapper
                      isZoomed
                      alt={topRightImageData.title || 'Trending Image'}
                      className="w-full h-full object-cover"
                      src={topRightImageData.imageUrl || '/images/placeholder.png'}
                    />
                  </Link>
                </div>
              )}
              <div className="flex flex-col justify-center items-center text-center py-4 min-h-[100px] sm:min-h-[130px] max-h-[100px] sm:max-h-[130px] overflow-hidden">
                {topRightImageData?.title && (
                  <div className="mb-1 sm:mb-2 flex-shrink-0">
                    <Link
                      href={topRightImageData.href || '#'}
                      className="text-xs sm:text-sm uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-semibold line-clamp-1"
                    >
                      {topRightImageData.title}
                    </Link>
                  </div>
                )}
                {bottomRightImageData?.title && (
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight line-clamp-2 flex-grow flex items-center">
                    <Link
                      href={bottomRightImageData.href || '#'}
                      className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-center w-full"
                    >
                      {bottomRightImageData.title}
                    </Link>
                  </h3>
                )}
              </div>
              {bottomRightImageData && (
                <div
                  className="w-full h-full relative overflow-hidden rounded-xl"
                  data-item-identifier={
                    bottomRightImageItem?.itemIdentifier || bottomRightImageItem?.slotKey
                  }
                >
                  <Link href={bottomRightImageData.href || '#'} className="w-full h-full block">
                    <Image
                      removeWrapper
                      isZoomed
                      alt={bottomRightImageData.title || 'Trending Image'}
                      className="w-full h-full object-cover"
                      src={bottomRightImageData.imageUrl || '/images/placeholder.png'}
                    />
                  </Link>
                </div>
              )}
            </div>
          </div>

          <Spacer y={8} />

          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] h-[600px] sm:h-[750px] md:h-[850px] lg:h-[930px] gap-y-4 lg:order-last">
              {nextTopLeftImageData && (
                <div
                  className="w-full h-full relative overflow-hidden rounded-xl"
                  data-item-identifier={
                    nextTopLeftImageItem?.itemIdentifier || nextTopLeftImageItem?.slotKey
                  }
                >
                  <Link href={nextTopLeftImageData.href || '#'} className="w-full h-full block">
                    <Image
                      removeWrapper
                      isZoomed
                      alt={nextTopLeftImageData.title || 'Trending Image'}
                      className="w-full h-full object-cover"
                      src={nextTopLeftImageData.imageUrl || '/images/placeholder.png'}
                    />
                  </Link>
                </div>
              )}
              <div className="flex flex-col justify-center items-center text-center py-4 min-h-[100px] sm:min-h-[130px] max-h-[100px] sm:max-h-[130px] overflow-hidden">
                {nextTopLeftImageData?.title && (
                  <div className="mb-1 sm:mb-2 flex-shrink-0">
                    <Link
                      href={nextTopLeftImageData.href || '#'}
                      className="text-xs sm:text-sm uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-semibold line-clamp-1"
                    >
                      {nextTopLeftImageData.title}
                    </Link>
                  </div>
                )}
                {nextBottomLeftImageData?.title && (
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight line-clamp-2 flex-grow flex items-center">
                    <Link
                      href={nextBottomLeftImageData.href || '#'}
                      className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-center w-full"
                    >
                      {nextBottomLeftImageData.title}
                    </Link>
                  </h3>
                )}
              </div>
              {nextBottomLeftImageData && (
                <div
                  className="w-full h-full relative overflow-hidden rounded-xl"
                  data-item-identifier={
                    nextBottomLeftImageItem?.itemIdentifier || nextBottomLeftImageItem?.slotKey
                  }
                >
                  <Link href={nextBottomLeftImageData.href || '#'} className="w-full h-full block">
                    <Image
                      removeWrapper
                      isZoomed
                      alt={nextBottomLeftImageData.title || 'Trending Image'}
                      className="w-full h-full object-cover"
                      src={nextBottomLeftImageData.imageUrl || '/images/placeholder.png'}
                    />
                  </Link>
                </div>
              )}
            </div>

            {mainRightProps && (
              <div className="lg:row-span-2 h-[600px] sm:h-[750px] md:h-[850px] lg:h-[930px] lg:order-first">
                <TrendingCard {...mainRightProps} />
              </div>
            )}
          </div>

          <div className="w-full mt-16 sm:mt-20">
            <div className="text-center mb-8 sm:mb-10">
              {shiningExamplesTitle && (
                <h3 className="text-sm font-medium tracking-widest text-text-secondary-light dark:text-text-secondary-dark uppercase">
                  {shiningExamplesTitle}
                </h3>
              )}
              {shiningExamplesSubtitle && (
                <h2 className="text-3xl sm:text-4xl font-bold text-text-primary-light dark:text-text-primary-dark mt-2">
                  {shiningExamplesSubtitle}
                </h2>
              )}
            </div>
            {shiningCards.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {shiningCards.map((itemProps, index) => (
                  <TrendingCard key={itemProps.itemIdentifier || index} {...itemProps} />
                ))}
              </div>
            ) : (
              <div className="text-center text-text-secondary-light dark:text-text-secondary-dark">
                {t('shining_examples.no_items')}
              </div>
            )}
            {shiningExamplesSeeAllText && shiningExamplesSeeAllLink && (
              <div className="text-center mt-8 sm:mt-10">
                <Link
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors rounded-md shadow-sm"
                  href={shiningExamplesSeeAllLink}
                >
                  {shiningExamplesSeeAllText}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
