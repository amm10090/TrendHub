'use client';
import { Button } from '@heroui/react';
import { Image } from '@heroui/react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

// 定义从 API 获取的数据结构 (与后端对应)
interface BannerData {
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  ctaText?: string;
  data?: {
    title?: string;
    description?: string;
    imageUrl?: string;
    linkUrl?: string;
    ctaText?: string;
  };
}

interface BannerProps {
  gender?: 'women' | 'men'; // Added gender prop
}

export const Banner: React.FC<BannerProps> = ({ gender }) => {
  const t = useTranslations('banner');
  const [bannerData, setBannerData] = useState<BannerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBannerData = async () => {
      setIsLoading(true);
      setError(null);
      let apiUrl = '/api/public/content-blocks?type=BANNER&single=true';

      if (gender) {
        // 使用分类slug查询，而不是拼接identifier
        apiUrl = `/api/public/content-blocks?categorySlug=${gender}&type=BANNER&single=true`;
      } else {
        // 默认使用women分类
        apiUrl = `/api/public/content-blocks?categorySlug=women&type=BANNER&single=true`;
      }

      try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error('Failed to fetch banner data');
        }
        const data = await response.json();

        // 添加调试输出

        setBannerData(data as BannerData); // Assuming API returns the banner object directly
      } catch {
        setBannerData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBannerData();
  }, [gender]); // Add gender to dependency array

  // 转换API响应中的数据
  // ContentBlock可能直接包含data字段或在data子对象中包含这些字段
  const apiData = {
    title: bannerData?.title || bannerData?.data?.title,
    description: bannerData?.description || bannerData?.data?.description,
    imageUrl: bannerData?.imageUrl || bannerData?.data?.imageUrl,
    linkUrl: bannerData?.linkUrl || bannerData?.data?.linkUrl,
    ctaText: bannerData?.ctaText || bannerData?.data?.ctaText,
  };

  // 调试输出转换后的数据

  // 优先使用从 API 获取的数据，如果失败或正在加载，则使用 t 函数的翻译或显示加载/错误状态
  const displayData = {
    title: apiData.title || t('title'),
    description: apiData.description || t('description'),
    imageUrl: apiData.imageUrl || '/images/banner-bg.jpg', // 后备图片
    linkUrl: apiData.linkUrl || '/women/brands/gucci', // 后备链接
    ctaText: apiData.ctaText || t('cta'), // 注意：这里改用'cta'而不是'ctaText'来匹配翻译文件
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 animate-pulse aspect-21/9 hidden sm:block" />
          <div className="relative rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 animate-pulse aspect-4/3 sm:hidden mt-4" />
        </div>
      </div>
    );
  }

  if (error) {
    return;
  }

  return (
    <div className="w-full">
      {/* PC端展示 */}
      <div className="hidden sm:block w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link className="block" href={displayData.linkUrl}>
            <div className="relative rounded-lg overflow-hidden cursor-pointer transition-transform duration-500 hover:scale-[1.02]">
              <div className="relative">
                <Image
                  alt={displayData.title}
                  classNames={{
                    wrapper: 'w-full',
                    img: 'w-full aspect-21/9 object-cover opacity-100 dark:opacity-90',
                  }}
                  loading="eager"
                  src={displayData.imageUrl}
                />
                <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <div className="text-text-primary-dark dark:text-text-primary-dark text-center">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-wider mb-4 sm:mb-6 drop-shadow-lg">
                    {displayData.title}
                  </h1>
                  <p className="text-base sm:text-lg font-light tracking-wide max-w-2xl mx-auto opacity-90 drop-shadow-md">
                    {displayData.description}
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
              alt={displayData.title}
              classNames={{
                wrapper: 'w-full',
                img: 'w-full aspect-4/3 object-cover',
              }}
              loading="eager"
              src={displayData.imageUrl}
            />
            <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <h1 className="text-2xl sm:text-3xl font-medium tracking-wider text-text-primary-dark dark:text-text-primary-dark text-center px-4 drop-shadow-lg">
                {displayData.title}
              </h1>
            </div>
          </div>
          <div className="mt-4">
            <Link className="block" href={displayData.linkUrl}>
              <Button
                className="w-full bg-bg-primary-light hover:bg-hover-bg-light dark:bg-bg-tertiary-dark dark:hover:bg-hover-bg-dark text-text-primary-light dark:text-text-primary-dark shadow-xs dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-md dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all duration-300"
                size="lg"
              >
                {displayData.ctaText}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
