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
import { useState } from 'react';

export const IntroductionSection: React.FC = () => {
  const t = useTranslations('introduction');
  const [isExpanded, setIsExpanded] = useState(false);

  const guaranteeItems = [
    {
      icon: <IconShieldCheck className="w-6 h-6" />,
      title: t('guarantees.authentic.title'),
      description: t('guarantees.authentic.description'),
    },
    {
      icon: <IconTruck className="w-6 h-6" />,
      title: t('guarantees.shipping.title'),
      description: t('guarantees.shipping.description'),
    },
    {
      icon: <IconWallet className="w-6 h-6" />,
      title: t('guarantees.payment.title'),
      description: t('guarantees.payment.description'),
    },
  ];

  return (
    <section className="w-full bg-white dark:bg-black">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Text Content with Gradient */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            {/* Title and Description */}
            <h1 className="text-2xl sm:text-3xl font-light mb-6 pt-16 text-text-primary-light dark:text-text-primary-dark">
              {t('title')}
            </h1>
            <div className="relative">
              <div
                className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px]' : 'max-h-[80px]'} overflow-hidden`}
              >
                <div className="text-center max-w-3xl mx-auto">
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-8 leading-relaxed">
                    {t('description')}
                  </p>

                  {/* Features List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-left mb-12">
                    <div className="space-y-3">
                      {t('features.left')
                        .split('\\n')
                        .map((item, index) => (
                          <p
                            key={index}
                            className="text-sm text-text-secondary-light dark:text-text-secondary-dark"
                          >
                            • {item}
                          </p>
                        ))}
                    </div>
                    <div className="space-y-3">
                      {t('features.right')
                        .split('\\n')
                        .map((item, index) => (
                          <p
                            key={index}
                            className="text-sm text-text-secondary-light dark:text-text-secondary-dark"
                          >
                            • {item}
                          </p>
                        ))}
                    </div>
                  </div>

                  {/* Bottom Text */}
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-8 italic">
                    {t('bottom_text')}
                  </p>
                </div>
              </div>

              {/* Gradient Overlay - Refined version */}
              {!isExpanded && (
                <>
                  <div className="absolute bottom-0 left-0 right-0 h-[120px] pointer-events-none bg-gradient-to-b from-transparent via-white to-white dark:via-transparent dark:to-black" />
                  <div className="absolute -bottom-16 left-0 right-0 h-16 bg-white dark:bg-black" />
                </>
              )}
            </div>

            {/* Expand/Collapse Button */}
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

        {/* Service Guarantees - Outside of Gradient */}
        <div className="grid grid-cols-3 gap-6 border-t border-neutral-200 dark:border-neutral-800">
          {guaranteeItems.map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center py-8">
              <div className="mb-3 text-text-primary-light dark:text-text-primary-dark">
                {item.icon}
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
