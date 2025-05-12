'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

// Define a type for the public brand data
interface PublicBrand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  popularity: boolean; //虽然我们只获取热门的，但API会返回这个字段
}

interface NavbarBrandsProps {
  locale: string;
  onItemClick: (href: string) => void;
}

export function NavbarBrands({ locale, onItemClick }: NavbarBrandsProps) {
  const t = useTranslations('nav');
  const [popularBrands, setPopularBrands] = useState<PublicBrand[]>([]); // Updated type
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Added error state

  // 字母表导航项
  const alphabet = [
    ...Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((letter) => ({
      letter,
      href: `/${locale}/brands?letter=${letter.toLowerCase()}`,
    })),
    {
      letter: '0-9',
      href: `/${locale}/brands?letter=0-9`,
    },
  ];

  // 获取热门品牌
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setIsLoading(true);
        setError(null); // Reset error before new fetch
        // const brands = await getPopularBrands(14); // 获取14个热门品牌 - Removed old service call

        const response = await fetch(`/api/public/brands?popularity=true&limit=14`);

        if (!response.ok) {
          // Try to parse error from API, or use a default
          let errorMessage = t('errors.fetchBrandsError'); // Default error

          try {
            const errorData = await response.json();

            if (errorData && errorData.error) {
              errorMessage = errorData.error;
            }
          } catch {
            // Parsing errorData failed, use default message
          }
          throw new Error(errorMessage);
        }
        const data = await response.json();

        setPopularBrands(data.items || []); // API returns { items: Brand[] }
      } catch (err) {
        // Updated error handling
        setError(err instanceof Error ? err.message : t('errors.unknownError'));
        setPopularBrands([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
  }, [locale, t]); // Removed category from dependency array

  // 将品牌分为两列显示
  const firstRowBrands = popularBrands.slice(0, Math.ceil(popularBrands.length / 2)); // 更均匀地分配
  const secondRowBrands = popularBrands.slice(Math.ceil(popularBrands.length / 2)); // 更均匀地分配

  // 处理品牌点击
  const handleBrandClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    onItemClick(href);
  };

  // 处理字母导航点击
  const handleAlphabetClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    onItemClick(href);
  };

  return (
    <div className="w-full">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-16">
          <div className="w-3/4 pr-8 border-r border-border-primary-light dark:border-border-primary-dark">
            <div className="mb-6">
              <h3 className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                {t('popular_brands')}
              </h3>
            </div>

            {isLoading ? (
              // 加载中状态
              <div className="grid grid-cols-2 gap-x-16 gap-y-3">
                <div className="flex flex-col gap-y-3">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className="h-6 w-24 animate-pulse bg-bg-tertiary-light dark:bg-bg-tertiary-dark rounded"
                    />
                  ))}
                </div>
                <div className="flex flex-col gap-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-6 w-24 animate-pulse bg-bg-tertiary-light dark:bg-bg-tertiary-dark rounded"
                    />
                  ))}
                </div>
              </div>
            ) : error ? ( // Added error display
              <div className="text-red-500 text-center py-4">{error}</div>
            ) : popularBrands.length === 0 ? ( // Handle no brands found
              <div className="text-center py-4 text-text-secondary-light dark:text-text-secondary-dark">
                {t('noPopularBrands')}
              </div>
            ) : (
              // 品牌列表
              <div className="grid grid-cols-2 gap-x-16 gap-y-3">
                <div className="flex flex-col gap-y-3">
                  {firstRowBrands.map((brand) => (
                    <Link
                      key={brand.id}
                      className="block text-text-primary-light dark:text-text-primary-dark hover:opacity-70 transition-all duration-200 text-sm hover:shadow-md hover:translate-y-[-2px] p-2 rounded-sm whitespace-nowrap"
                      href={`/${locale}/brands/${brand.slug}`}
                      onClick={(e) => handleBrandClick(e, `/${locale}/brands/${brand.slug}`)}
                    >
                      {brand.name}
                    </Link>
                  ))}
                </div>
                <div className="flex flex-col gap-y-3">
                  {secondRowBrands.map((brand) => (
                    <Link
                      key={brand.id}
                      className="block text-text-primary-light dark:text-text-primary-dark hover:opacity-70 transition-all duration-200 text-sm hover:shadow-md hover:translate-y-[-2px] p-2 rounded-sm whitespace-nowrap"
                      href={`/${locale}/brands/${brand.slug}`}
                      onClick={(e) => handleBrandClick(e, `/${locale}/brands/${brand.slug}`)}
                    >
                      {brand.name}
                    </Link>
                  ))}
                  <Link
                    className="block text-text-primary-light dark:text-text-primary-dark hover:opacity-70 transition-all duration-200 text-sm font-medium hover:shadow-md hover:translate-y-[-2px] p-2 rounded-sm whitespace-nowrap underline underline-offset-4"
                    href={`/${locale}/brands`}
                    onClick={(e) => handleBrandClick(e, `/${locale}/brands`)}
                  >
                    {t('view_all_brands')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="w-1/4">
            <div className="mb-6">
              <h3 className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                {t('brands_a_z')}
              </h3>
            </div>
            <div className="grid grid-cols-9 gap-1 p-4">
              {alphabet.map((item) => (
                <Link
                  key={item.href}
                  className="flex items-center justify-center w-8 h-8 text-text-primary-light dark:text-text-primary-dark hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark transition-colors text-sm"
                  href={item.href}
                  onClick={(e) => handleAlphabetClick(e, item.href)}
                >
                  {item.letter}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
