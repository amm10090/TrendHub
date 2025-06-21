'use client';

import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { isFeatureEnabled } from '@/lib/dev-config';
import { ProductDetail } from '@/types/product';

// 定义组件属性类型
interface TrackPageContentProps {
  locale: string;
}

// 客户端组件
export default function TrackPageContent({ locale }: TrackPageContentProps) {
  const t = useTranslations('track');
  const router = useRouter();
  const params = useParams();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  // 保证在服务器端和客户端都使用相同的语言环境
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    // 检查是否启用中转页面
    if (!isFeatureEnabled('enableTrackingPage')) {
      router.push(`/${locale}`);

      return;
    }

    const fetchProductAndRedirect = async () => {
      if (params && params.slug && Array.isArray(params.slug) && params.slug.length >= 2) {
        const [type, id] = params.slug;

        if (type === 'product' && id) {
          try {
            const response = await fetch(`/api/public/products/${id}`);

            if (!response.ok) {
              throw new Error('Product not found');
            }
            const foundProduct: ProductDetail = await response.json();

            setProduct(foundProduct);
            // 优先使用 adUrl，否则回退到商品详情页
            const url = foundProduct.adUrl || `/${locale}/product/${foundProduct.id}`;

            setTargetUrl(url);
            setLoading(false);
          } catch {
            // 找不到商品或API错误时重定向到首页
            router.push(`/${locale}`);
          }
        } else {
          router.push(`/${locale}`);
        }
      }
    };

    fetchProductAndRedirect();
  }, [params, router, locale, t]);

  useEffect(() => {
    if (!loading && targetUrl) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = targetUrl;

            return 0;
          }

          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, targetUrl]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900 dark:border-gray-100" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black p-4">
      <div className="text-center max-w-md w-full">
        <div className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">TRENDHUB</div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('now_taking_you_to')}</p>

        <div className="my-6 flex justify-center items-center">
          {product?.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              width={80}
              height={80}
              className="rounded-lg object-cover w-20 h-20 shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-500">
              {product?.brand?.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {product && (
          <>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              {product.brand.name}
            </h1>
            <p className="text-md text-gray-600 dark:text-gray-300 mt-1">{product.name}</p>
          </>
        )}

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 my-8">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${(5 - countdown) * 20}%` }}
          />
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('redirecting_in', { seconds: countdown })}
        </p>

        <div className="mt-8 text-xs text-gray-400 dark:text-gray-500">
          <p>{t('taking_too_long')}</p>
          <a
            href={targetUrl || '#'}
            className="underline hover:text-blue-500"
            onClick={(e) => {
              if (!targetUrl) e.preventDefault();
            }}
          >
            {t('click_here')}
          </a>
        </div>
      </div>
    </div>
  );
}
