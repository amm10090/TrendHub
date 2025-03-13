'use client';

import { Button } from '@heroui/react';
import { Skeleton } from '@heroui/skeleton';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function AboutUs() {
  const t = useTranslations('about');
  const [activeTab, setActiveTab] = useState('about');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation */}
      <div className="border-b border-border-primary-light dark:border-border-primary-dark">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="flex min-w-[280px] sm:min-w-[360px] md:min-w-[480px]">
              <Button
                className={`flex-1 py-6 text-base transition-colors relative
                                    ${
                                      activeTab === 'about'
                                        ? 'text-text-primary-light dark:text-text-primary-dark font-medium'
                                        : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
                                    }
                                    after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5
                                    after:transition-colors
                                    ${
                                      activeTab === 'about'
                                        ? 'after:bg-brand-primary-light dark:after:bg-brand-primary-dark'
                                        : 'after:bg-transparent hover:after:bg-border-primary-light dark:hover:after:bg-border-primary-dark'
                                    }
                                `}
                radius="none"
                variant="light"
                onPress={() => setActiveTab('about')}
              >
                {t('nav.about')}
              </Button>
              <Button
                className={`flex-1 py-6 text-base transition-colors relative
                                    ${
                                      activeTab === 'sustainability'
                                        ? 'text-text-primary-light dark:text-text-primary-dark font-medium'
                                        : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
                                    }
                                    after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5
                                    after:transition-colors
                                    ${
                                      activeTab === 'sustainability'
                                        ? 'after:bg-brand-primary-light dark:after:bg-brand-primary-dark'
                                        : 'after:bg-transparent hover:after:bg-border-primary-light dark:hover:after:bg-border-primary-dark'
                                    }
                                `}
                radius="none"
                variant="light"
                onPress={() => setActiveTab('sustainability')}
              >
                {t('nav.sustainability')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {activeTab === 'about' && (
          <>
            {/* Title Section */}
            <section className="py-12 md:py-16 bg-bg-primary-light dark:bg-bg-primary-dark text-center">
              <div className="container mx-auto px-4">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-text-primary-light dark:text-text-primary-dark mb-6">
                  {t('hero.title')}
                </h1>
                <p className="text-lg md:text-xl text-text-secondary-light dark:text-text-secondary-dark max-w-3xl mx-auto">
                  {t('hero.description')}
                </p>
              </div>
            </section>

            {/* Image Grid Section */}
            <section className="py-8">
              <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="relative aspect-[4/5] max-h-[480px]">
                      <Skeleton className="w-full h-full rounded-lg" />
                    </div>
                    <div className="relative aspect-[4/5] max-h-[480px]">
                      <Skeleton className="w-full h-full rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-bg-secondary-light dark:bg-bg-secondary-dark">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  <div>
                    <div className="text-4xl font-light text-text-primary-light dark:text-text-primary-dark mb-2">
                      200+
                    </div>
                    <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {t('stats.brands')}
                    </div>
                  </div>
                  <div>
                    <div className="text-4xl font-light text-text-primary-light dark:text-text-primary-dark mb-2">
                      130+
                    </div>
                    <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {t('stats.countries')}
                    </div>
                  </div>
                  <div>
                    <div className="text-4xl font-light text-text-primary-light dark:text-text-primary-dark mb-2">
                      87
                    </div>
                    <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {t('stats.team')}
                    </div>
                  </div>
                  <div>
                    <div className="text-4xl font-light text-text-primary-light dark:text-text-primary-dark mb-2">
                      900
                    </div>
                    <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {t('stats.newArrivals')}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Services Section */}
            <section className="py-16">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                        <path
                          d="M12 6V12L16 14"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium mb-2">{t('services.support.title')}</h3>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">
                      {t('services.support.description')}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                        <path
                          d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium mb-2">{t('services.shipping.title')}</h3>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">
                      {t('services.shipping.description')}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                        <path
                          d="M9 12L11 14L15 10"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium mb-2">{t('services.guarantee.title')}</h3>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">
                      {t('services.guarantee.description')}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Image Section */}
            <section className="py-8">
              <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                  <div className="relative aspect-[21/9] max-h-[540px]">
                    <Skeleton className="w-full h-full rounded-lg" />
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'sustainability' && (
          <>
            {/* Title Section */}
            <section className="py-12 md:py-16 bg-bg-primary-light dark:bg-bg-primary-dark">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-text-primary-light dark:text-text-primary-dark mb-6">
                    {t('sustainability.title')}
                  </h1>
                  <p className="text-lg md:text-xl text-text-secondary-light dark:text-text-secondary-dark">
                    {t('sustainability.description')}
                  </p>
                </div>
              </div>
            </section>

            {/* Four Pillars */}
            <section className="py-16">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                  {/* Planet */}
                  <div className="bg-bg-secondary-light dark:bg-bg-secondary-dark p-8 rounded-lg">
                    <div className="w-16 h-16 mb-6 flex items-center justify-center bg-bg-tertiary-light dark:bg-bg-tertiary-dark rounded-full">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-light mb-4 text-text-primary-light dark:text-text-primary-dark">
                      {t('sustainability.pillars.planet.title')}
                    </h3>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">
                      {t('sustainability.pillars.planet.description')}
                    </p>
                  </div>

                  {/* Talent */}
                  <div className="bg-bg-secondary-light dark:bg-bg-secondary-dark p-8 rounded-lg">
                    <div className="w-16 h-16 mb-6 flex items-center justify-center bg-bg-tertiary-light dark:bg-bg-tertiary-dark rounded-full">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                        <path
                          d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-light mb-4 text-text-primary-light dark:text-text-primary-dark">
                      {t('sustainability.pillars.talent.title')}
                    </h3>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">
                      {t('sustainability.pillars.talent.description')}
                    </p>
                  </div>

                  {/* Product */}
                  <div className="bg-bg-secondary-light dark:bg-bg-secondary-dark p-8 rounded-lg">
                    <div className="w-16 h-16 mb-6 flex items-center justify-center bg-bg-tertiary-light dark:bg-bg-tertiary-dark rounded-full">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M20.59 13.41L13.42 20.58C13.2343 20.766 13.0137 20.9135 12.7709 21.0141C12.5281 21.1148 12.2678 21.1666 12.005 21.1666C11.7422 21.1666 11.4819 21.1148 11.2391 21.0141C10.9963 20.9135 10.7757 20.766 10.59 20.58L2 12V2H12L20.59 10.59C20.9625 10.9647 21.1716 11.4716 21.1716 12C21.1716 12.5284 20.9625 13.0353 20.59 13.41Z"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                        <path
                          d="M7 7H7.01"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-light mb-4 text-text-primary-light dark:text-text-primary-dark">
                      {t('sustainability.pillars.product.title')}
                    </h3>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">
                      {t('sustainability.pillars.product.description')}
                    </p>
                  </div>

                  {/* Policy */}
                  <div className="bg-bg-secondary-light dark:bg-bg-secondary-dark p-8 rounded-lg">
                    <div className="w-16 h-16 mb-6 flex items-center justify-center bg-bg-tertiary-light dark:bg-bg-tertiary-dark rounded-full">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                        <path
                          d="M14 2V8H20"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                        <path
                          d="M16 13H8"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                        <path
                          d="M16 17H8"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                        <path
                          d="M10 9H9H8"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-light mb-4 text-text-primary-light dark:text-text-primary-dark">
                      {t('sustainability.pillars.policy.title')}
                    </h3>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">
                      {t('sustainability.pillars.policy.description')}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Vision Statement */}
            <section className="py-16 bg-bg-secondary-light dark:bg-bg-secondary-dark">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center">
                  <p className="text-lg md:text-xl text-text-secondary-light dark:text-text-secondary-dark italic">
                    {t('sustainability.vision.quote')}
                  </p>
                  <div className="mt-8 text-text-primary-light dark:text-text-primary-dark">
                    <p className="font-medium">{t('sustainability.vision.signature')}</p>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {t('sustainability.vision.date')}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Reports Section */}
            <section className="py-16">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-2xl md:text-3xl font-light text-text-primary-light dark:text-text-primary-dark mb-8 text-center">
                    {t('sustainability.reports.title')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="relative aspect-[3/4]">
                      <Skeleton className="w-full h-full rounded-lg" />
                    </div>
                    <div className="relative aspect-[3/4]">
                      <Skeleton className="w-full h-full rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* 其他标签页的内容可以在这里添加 */}
      </div>
    </div>
  );
}
