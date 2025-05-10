'use client';

import { Image, Spinner, Progress, Button } from '@heroui/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'use-intl';

import { isFeatureEnabled } from '@/lib/dev-config';
import { products } from '@/lib/mock-data';
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
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [targetDomain, setTargetDomain] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);

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

    // 处理路由参数
    if (params && params.slug && Array.isArray(params.slug) && params.slug.length >= 2) {
      const [type, id] = params.slug;

      if (type === 'product' && id) {
        // 在真实环境中，这里应该调用API获取商品信息
        // 现在使用模拟数据
        const foundProduct = products.find((p) => p.id === id);

        if (foundProduct) {
          setProduct(foundProduct);
          // 使用商品的广告联盟链接作为目标URL
          const url = foundProduct.adUrl || `https://example.com/product/${id}`;

          setTargetUrl(url);

          try {
            // 提取目标域名
            const domain = new URL(url).hostname;

            setTargetDomain(domain.replace('www.', ''));
          } catch {
            // 生产环境中应该使用适当的日志系统记录错误
            // 如需分析错误根本原因，请记录错误信息
            setTargetDomain('未知域名');
          }

          setLoading(false);
        } else {
          // 找不到商品时重定向到首页
          router.push(`/${locale}`);
        }
      }
    }
  }, [params, router, locale]);

  useEffect(() => {
    if (!loading && targetUrl) {
      // 初始化倒计时和进度条
      let secondsLeft = 5;

      // 立即更新一次进度条
      setTimeLeft(secondsLeft);
      setProgress(((5 - secondsLeft) / 5) * 100);

      // 创建计时器，每100毫秒更新一次进度条
      const intervalTimer = setInterval(() => {
        // 更新进度条
        const elapsed = 5 - secondsLeft;
        const newProgress = (elapsed / 5) * 100 + (1 / 5) * (100 / 10);

        setProgress(Math.min(newProgress, 100));
      }, 100);

      // 创建倒计时计时器
      const countdownTimer = setInterval(() => {
        secondsLeft -= 1;
        setTimeLeft(secondsLeft);

        if (secondsLeft <= 0) {
          clearInterval(intervalTimer);
          clearInterval(countdownTimer);
          window.location.href = targetUrl;
        }
      }, 1000);

      return () => {
        clearInterval(intervalTimer);
        clearInterval(countdownTimer);
      };
    }
  }, [loading, targetUrl]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black">
        <Spinner variant="spinner" size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950 px-4">
      <div className="w-full max-w-md mx-auto text-center">
        {/* TrendHub Logo */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tighter text-gray-900 dark:text-white">
            TRENDHUB
          </h1>
        </div>

        {/* 目标网站信息 */}
        <div className="mb-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{t('now_taking_you_to')}</p>

          {/* 目标网站Logo/名称 */}
          <div className="flex flex-col items-center justify-center">
            {product && (
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 overflow-hidden">
                <span className="text-xl font-bold">{targetDomain.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white uppercase">
              {targetDomain}
            </h2>
          </div>
        </div>

        {/* 进度条和倒计时 */}
        <div className="mb-8 w-full">
          <Progress
            aria-label={t('redirecting')}
            classNames={{
              base: 'max-w-md mx-auto',
              track: 'drop-shadow-md border border-default',
              indicator: 'bg-linear-to-r from-primary to-primary-400',
            }}
            color="primary"
            isStriped={true}
            radius="full"
            showValueLabel={false}
            size="md"
            value={progress}
          />
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
            {t('redirecting_in', { seconds: timeLeft })}
          </p>
        </div>

        {/* 手动跳转链接 */}
        <div>
          <p className="text-gray-500 dark:text-gray-500 text-sm mb-2">{t('taking_too_long')}</p>
          <Button
            className="text-primary hover:text-primary-dark font-medium text-sm"
            size="sm"
            variant="light"
            onPress={() => (window.location.href = targetUrl)}
          >
            {t('click_here')}
          </Button>
        </div>

        {/* 商品信息 - 小号悬浮于底部 */}
        {product && (
          <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-white dark:bg-gray-900 shadow-lg rounded-lg p-3 max-w-xs border border-gray-100 dark:border-gray-800">
            <div className="w-12 h-12 rounded-sm overflow-hidden shrink-0">
              <Image
                alt={product.name}
                className="w-full h-full object-cover"
                height={48}
                src={product.images?.[0] || '/images/products/placeholder.jpg'}
                width={48}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white text-xs truncate">
                {product.brand.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                ¥{product.price.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
