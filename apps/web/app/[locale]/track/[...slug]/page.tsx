'use client';

import { Image } from '@heroui/react';
import { useEffect } from 'react';
import { useTranslations } from 'use-intl';

export default function TrackPage() {
    const t = useTranslations('track');

    useEffect(() => {
        // 这里添加跳转逻辑，目前用 setTimeout 模拟
        const timer = setTimeout(() => {
            // TODO: 替换为实际的推广链接
            window.location.href = 'https://www.farfetch.com';
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-bg-primary-light dark:bg-bg-primary-dark flex flex-col items-center justify-center">
            <div className="w-full max-w-lg mx-auto px-4">
                <div className="flex justify-center mb-8">
                    <Image
                        alt="TrendHub Logo"
                        src="/images/logo.png"
                        classNames={{
                            wrapper: 'w-32 h-32',
                            img: 'object-contain'
                        }}
                    />
                </div>
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                        {t('redirecting')}
                    </h1>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">
                        {t('please_wait')}
                    </p>
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-text-primary-light dark:border-text-primary-dark" />
                    </div>
                </div>
            </div>
        </div>
    );
} 