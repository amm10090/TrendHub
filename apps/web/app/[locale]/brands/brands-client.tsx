'use client';

import { Breadcrumbs, BreadcrumbItem, Button } from '@heroui/react';
import { ChevronUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

import { Brand, getBrandsByAlphabet } from '@/services/brand.service';

interface BrandsClientProps {
  locale: string;
}

export default function BrandsClient({ locale }: BrandsClientProps) {
  const t = useTranslations('brands');
  const searchParams = useSearchParams();
  const [brandsByLetter, setBrandsByLetter] = useState<Record<string, Brand[]>>({});
  const [sortedLetters, setSortedLetters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [showTopButton, setShowTopButton] = useState<boolean>(false);

  // 处理 URL 参数
  useEffect(() => {
    if (!searchParams) return;
    const letterParam = searchParams.get('letter');

    if (letterParam) {
      setSelectedLetter(letterParam.toUpperCase());
    } else {
      setSelectedLetter(null);
    }
  }, [searchParams]);

  // 获取品牌数据
  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoading(true);
      try {
        const brands = await getBrandsByAlphabet();

        setBrandsByLetter(brands);

        // 按字母排序
        const letters = Object.keys(brands).sort((a, b) => {
          if (a === '0-9') return 1;
          if (b === '0-9') return -1;

          return a.localeCompare(b);
        });

        setSortedLetters(letters);
      } catch {
        setBrandsByLetter({});
        setSortedLetters([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
  }, []);

  // 处理返回顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowTopButton(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 过滤品牌列表
  const filteredLetters = selectedLetter
    ? sortedLetters.filter((letter) => letter === selectedLetter)
    : sortedLetters;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 面包屑导航 */}
      <Breadcrumbs className="mb-8 text-sm">
        <BreadcrumbItem href={`/${locale}`}>{t('breadcrumb.home')}</BreadcrumbItem>
        <BreadcrumbItem href={`/${locale}/brands`}>{t('breadcrumb.brands')}</BreadcrumbItem>
        {selectedLetter && (
          <BreadcrumbItem href={`/${locale}/brands?letter=${selectedLetter.toLowerCase()}`}>
            {selectedLetter}
          </BreadcrumbItem>
        )}
      </Breadcrumbs>

      <h1 className="text-3xl font-bold mb-8 text-center">
        {selectedLetter ? `${t('title')} - ${selectedLetter}` : t('title')}
      </h1>

      {/* 字母快速导航 */}
      <div className="flex flex-wrap justify-center gap-2 mb-12 sticky top-0 bg-bg-secondary-light dark:bg-bg-secondary-dark py-4 z-10">
        {sortedLetters.map((letter) => (
          <Link
            key={letter}
            href={`/${locale}/brands?letter=${letter.toLowerCase()}`}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
              selectedLetter === letter
                ? 'bg-text-primary-light dark:bg-text-primary-dark text-bg-secondary-light dark:text-bg-secondary-dark'
                : 'bg-bg-tertiary-light dark:bg-bg-tertiary-dark hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark'
            }`}
          >
            {letter}
          </Link>
        ))}
        {selectedLetter && (
          <Link
            href={`/${locale}/brands`}
            className="px-4 py-2 flex items-center justify-center rounded-full bg-bg-tertiary-light dark:bg-bg-tertiary-dark hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark transition-colors ml-4"
          >
            {t('clearFilter')}
          </Link>
        )}
      </div>

      {/* 品牌列表，按字母分组 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-text-primary-light dark:border-text-primary-dark" />
        </div>
      ) : (
        <div className="space-y-16">
          {filteredLetters.map((letter) => (
            <section key={letter} id={letter} className="scroll-mt-20">
              <h2 className="text-2xl font-bold mb-6 border-b pb-2">{letter}</h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {brandsByLetter[letter]?.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/${locale}/brands/${brand.slug}`}
                    className="group flex flex-col items-center justify-center text-center hover:shadow-md rounded-lg p-4 transition-all hover:-translate-y-1"
                  >
                    <div className="w-20 h-20 bg-bg-tertiary-light dark:bg-bg-tertiary-dark rounded-full p-2 flex items-center justify-center mb-4">
                      {brand.logo ? (
                        <Image
                          src={brand.logo}
                          alt={brand.name}
                          width={64}
                          height={64}
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <span className="text-2xl font-bold">{brand.name.charAt(0)}</span>
                      )}
                    </div>
                    <span className="font-medium group-hover:underline">{brand.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* 如果没有品牌数据 */}
      {!isLoading && filteredLetters.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark">
            {t('noBrands')}
          </p>
          {selectedLetter && (
            <Link
              href={`/${locale}/brands`}
              className="mt-4 inline-block px-4 py-2 bg-bg-tertiary-light dark:bg-bg-tertiary-dark hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark rounded-md transition-colors"
            >
              {t('viewAllBrands')}
            </Link>
          )}
        </div>
      )}

      {/* 返回顶部按钮 */}
      {showTopButton && (
        <Button
          className="fixed bottom-6 right-6 p-3 rounded-full bg-bg-primary-light dark:bg-bg-primary-dark shadow-md hover:shadow-lg transition-shadow z-50"
          onPress={scrollToTop}
          aria-label={t('backToTop')}
          isIconOnly
          variant="flat"
        >
          <ChevronUp className="h-6 w-6 text-text-primary-light dark:text-text-primary-dark" />
        </Button>
      )}
    </div>
  );
}
