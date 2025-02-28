'use client';

import { useTranslations } from 'next-intl';
import React from 'react';

interface TrendingCardProps {
    title: string;
    description: string;
}

const TrendingCard: React.FC<TrendingCardProps> = ({ title, description }) => (
    <div className="relative aspect-[16/9] bg-bg-secondary-light dark:bg-bg-secondary-dark rounded-lg shadow-sm border border-border-primary-light dark:border-border-primary-dark overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-center">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                {title}
            </h3>
            <p className="text-sm sm:text-base text-text-secondary-light dark:text-text-secondary-dark line-clamp-2 sm:line-clamp-3">
                {description}
            </p>
        </div>
    </div>
);

export const TrendingSection: React.FC = () => {
    const t = useTranslations();

    return (
        <section className="w-full bg-bg-tertiary-light dark:bg-bg-tertiary-dark">
            <div className="container py-8 sm:py-12">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-text-primary-light dark:text-text-primary-dark">
                    {t('nav.trending')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                    <TrendingCard
                        title={t('banner.title')}
                        description={t('banner.description')}
                    />
                    <TrendingCard
                        title="Explore Gucci"
                        description="Spring/Summer 2024 Collection"
                    />
                </div>
            </div>
        </section>
    );
}; 