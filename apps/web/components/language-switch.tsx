'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { locales } from '@/i18n/config';

export const LanguageSwitch: React.FC = () => {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const handleLocaleChange = (newLocale: string) => {
        const segments = pathname.split('/');
        segments[1] = newLocale;
        router.push(segments.join('/'));
    };

    return (
        <div className="flex items-center space-x-2">
            {locales.map((loc) => (
                <button
                    key={loc}
                    onClick={() => handleLocaleChange(loc)}
                    className={`px-2 py-1 rounded ${locale === loc ? 'bg-primary text-white' : 'bg-gray-200'
                        }`}
                >
                    {loc.toUpperCase()}
                </button>
            ))}
        </div>
    );
}; 