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
  ctaText: string;
}

export function Banner() {
  const t = useTranslations('banner');
  const [bannerData, setBannerData] = useState<BannerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 修改 API 调用：从按 identifier 获取改为按 type 获取
        const response = await fetch('/api/public/content-blocks?type=BANNER');

        if (!response.ok) {
          throw new Error(`API 请求失败: ${response.status} ${response.statusText}`); // 保持 statusText
        }
        // API 按 type 查询会返回一个数组
        const blocks = await response.json();

        // 我们期望只有一个激活的 BANNER，所以取数组的第一个元素
        // 如果没有激活的 BANNER，blocks 会是空数组
        const block = Array.isArray(blocks) && blocks.length > 0 ? blocks[0] : null;

        if (block && block.data && typeof block.data === 'object') {
          if (
            typeof block.data.title === 'string' &&
            typeof block.data.description === 'string' &&
            typeof block.data.imageUrl === 'string' &&
            typeof block.data.linkUrl === 'string' &&
            typeof block.data.ctaText === 'string'
          ) {
            setBannerData(block.data as BannerData);
          } else {
            // 如果 data 结构不符合预期，也视为错误或数据不完整
            // throw new Error('从 API 获取的 Banner 数据格式不正确');
            setBannerData(null); // 明确设为 null，以便后续使用后备数据
          }
        } else {
          // 如果没有找到激活的 BANNER 或数据为空
          // throw new Error('未找到激活的 Banner 内容块或数据为空');
          setBannerData(null); // 明确设为 null
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : '加载数据时发生未知错误';

        setError(errorMessage);
        // 出错时可以使用 t 函数的静态文本作为后备
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // 空依赖数组确保只在挂载时运行一次

  // 优先使用从 API 获取的数据，如果失败或正在加载，则使用 t 函数的翻译或显示加载/错误状态
  const displayData = {
    title: bannerData?.title || t('title'),
    description: bannerData?.description || t('description'),
    imageUrl: bannerData?.imageUrl || '/images/banner-bg.jpg', // 后备图片
    linkUrl: bannerData?.linkUrl || '/women/brands/gucci', // 后备链接
    ctaText: bannerData?.ctaText || t('cta'),
  };

  // 可以添加加载和错误状态的 UI 反馈
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
}
