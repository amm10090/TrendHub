'use client';

import { Button } from '@heroui/react';
import {
  IconChevronDown,
  IconChevronUp,
  IconShieldCheck,
  IconTruck,
  IconWallet,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import React from 'react';

interface GuaranteeItemData {
  iconKey: string;
  title: string;
  description: string;
}

interface IntroductionSectionData {
  title: string;
  descriptionParagraph: string;
  featuresLeft: string[];
  featuresRight: string[];
  bottomText: string;
}

interface IntroductionContentBlock {
  data: IntroductionSectionData;
  items: { data: GuaranteeItemData }[];
}

const iconMap: { [key: string]: React.ReactNode } = {
  'shield-check': <IconShieldCheck className="w-6 h-6" />,
  truck: <IconTruck className="w-6 h-6" />,
  wallet: <IconWallet className="w-6 h-6" />,
  default: <IconShieldCheck className="w-6 h-6" />,
};

const getIcon = (key: string): React.ReactNode => {
  return iconMap[key] || iconMap['default'];
};

interface IntroductionSectionProps {
  gender?: 'women' | 'men';
}

export const IntroductionSection: React.FC<IntroductionSectionProps> = ({ gender }) => {
  const t = useTranslations('introduction');
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentData, setContentData] = useState<IntroductionContentBlock | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let apiUrl = '/api/public/content-blocks?type=INTRODUCTION_SECTION&single=true';

        if (gender) {
          apiUrl = `/api/public/content-blocks?categorySlug=${gender}&type=INTRODUCTION_SECTION&single=true`;
        } else {
          // 默认使用women分类
          apiUrl = `/api/public/content-blocks?categorySlug=women&type=INTRODUCTION_SECTION&single=true`;
        }

        const response = await fetch(apiUrl);

        if (!response.ok) {
          if (response.status === 404) {
            setContentData(null); // 未找到特定内容块，不视为错误，允许前端优雅处理
            // setError(null); // 确保之前的错误被清除
          } else {
            throw new Error(`API 请求失败: ${response.statusText}`);
          }
        } else {
          const data = await response.json();

          setContentData(data as IntroductionContentBlock);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : '加载数据时发生未知错误';

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [gender]);

  // 辅助函数，确保 features 总是数组
  const getFeaturesArray = (featureString: unknown, fallbackKey: string): string[] => {
    // 检查从 API 获取的数据是否为非空字符串
    if (typeof featureString === 'string' && featureString.trim()) {
      // 按换行符分割，去除空行和首尾空格
      return featureString
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // 如果 API 数据不是有效字符串，则使用后备翻译
    const fallbackString = t(fallbackKey);

    if (typeof fallbackString === 'string') {
      // 对后备翻译字符串执行相同处理
      return fallbackString
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // 如果连后备翻译都不是字符串，返回空数组

    return [];
  };

  const fallbackGuarantees = [
    {
      iconKey: 'shield-check',
      title: t('guarantees.authentic.title'),
      description: t('guarantees.authentic.description'),
    },
    {
      iconKey: 'truck',
      title: t('guarantees.shipping.title'),
      description: t('guarantees.shipping.description'),
    },
    {
      iconKey: 'wallet',
      title: t('guarantees.payment.title'),
      description: t('guarantees.payment.description'),
    },
  ];

  const displayData = {
    title: contentData?.data.title || t('title'),
    descriptionParagraph: contentData?.data.descriptionParagraph || t('description'),
    // 使用辅助函数确保得到数组
    featuresLeft: getFeaturesArray(contentData?.data.featuresLeft, 'features.left'),
    featuresRight: getFeaturesArray(contentData?.data.featuresRight, 'features.right'),
    bottomText: contentData?.data.bottomText || t('bottom_text'),
    // 改进 guaranteeItems 的处理，确保在 contentData?.items 是数组时才 map
    guaranteeItems: Array.isArray(contentData?.items)
      ? contentData.items.map((item) => item.data)
      : fallbackGuarantees,
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 h-60 flex justify-center items-center">
        <p>加载中...</p>
      </div>
    );
  }

  if (error) {
    return;
  }

  return (
    <section className="w-full bg-white dark:bg-black">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-light mb-6 pt-16 text-text-primary-light dark:text-text-primary-dark">
              {displayData.title}
            </h1>
            <div className="relative">
              <div
                className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px]' : 'max-h-[80px]'} overflow-hidden`}
              >
                <div className="text-center max-w-3xl mx-auto">
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-8 leading-relaxed">
                    {displayData.descriptionParagraph}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-left mb-12">
                    <div className="flex flex-col gap-y-3">
                      {displayData.featuresLeft.map((item, index) => (
                        <p
                          key={`left-${index}`}
                          className="text-sm text-text-secondary-light dark:text-text-secondary-dark"
                        >
                          • {item}
                        </p>
                      ))}
                    </div>
                    <div className="flex flex-col gap-y-3">
                      {displayData.featuresRight.map((item, index) => (
                        <p
                          key={`right-${index}`}
                          className="text-sm text-text-secondary-light dark:text-text-secondary-dark"
                        >
                          • {item}
                        </p>
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-8 italic">
                    {displayData.bottomText}
                  </p>
                </div>
              </div>

              {!isExpanded && (
                <>
                  <div className="absolute bottom-0 left-0 right-0 h-[120px] pointer-events-none bg-linear-to-b from-transparent via-white to-white dark:via-transparent dark:to-black" />
                  <div className="absolute -bottom-16 left-0 right-0 h-16 bg-white dark:bg-black" />
                </>
              )}
            </div>

            <Button
              className="mb-16 relative z-10"
              variant="light"
              onPress={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <IconChevronUp className="w-5 h-5" />
              ) : (
                <IconChevronDown className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 border-t border-neutral-200 dark:border-neutral-800">
          {displayData.guaranteeItems.map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center py-8">
              <div className="mb-3 text-text-primary-light dark:text-text-primary-dark">
                {getIcon(item.iconKey)}
              </div>
              <h3 className="text-xs uppercase tracking-wider mb-2 font-medium text-text-primary-light dark:text-text-primary-dark">
                {item.title}
              </h3>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark max-w-[200px]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
