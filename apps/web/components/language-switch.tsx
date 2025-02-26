'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { locales } from '@/i18n/config';
import { Select, SelectItem } from "@heroui/select";
import ReactCountryFlag from "react-country-flag";

const languageOptions = {
    zh: {
        label: '中文',
        code: 'CN',
        countryCode: 'CN',
        ariaLabel: '选择语言'
    },
    en: {
        label: 'English',
        code: 'US',
        countryCode: 'US',
        ariaLabel: 'Select Language'
    }
};

interface LanguageSwitchProps {
    isSearchOpen?: boolean;
}

export const LanguageSwitch: React.FC<LanguageSwitchProps> = ({
    isSearchOpen = false
}) => {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const handleLocaleChange = (value: string) => {
        const segments = pathname.split('/');
        segments[1] = value;
        router.push(segments.join('/'));
    };

    const currentOption = languageOptions[locale as keyof typeof languageOptions];

    return (
        <div
            className="transition-all duration-300 ease-in-out"
            style={{
                opacity: isSearchOpen ? 0 : 1,
                visibility: isSearchOpen ? 'hidden' : 'visible',
                transform: isSearchOpen ? 'translateX(-20px)' : 'translateX(0)',
            }}
        >
            <Select
                selectedKeys={[locale]}
                onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    handleLocaleChange(value);
                }}
                size="sm"
                variant="flat"
                aria-label={currentOption?.ariaLabel}
                classNames={{
                    trigger: "min-h-8 h-8 bg-transparent text-[#1A1A1A] data-[hover=true]:bg-[#F5F5F2] rounded-lg px-2 py-0.5",
                    value: "text-small text-[#1A1A1A] font-medium",
                    base: "min-w-[140px]",
                    listbox: "min-w-[140px] bg-[#FAF9F6] text-[#1A1A1A] border border-[#E8E6E3]",
                    listboxWrapper: "rounded-lg",
                    innerWrapper: "gap-1",
                }}
                renderValue={(items) => {
                    const item = items[0];
                    const option = languageOptions[item?.key as keyof typeof languageOptions];
                    return (
                        <div className="flex items-center gap-2">
                            <ReactCountryFlag
                                countryCode={option?.countryCode || ''}
                                svg
                                style={{
                                    width: '1.2em',
                                    height: '1.2em',
                                }}
                                title={option?.countryCode}
                            />
                            <span className="text-small text-[#1A1A1A]">{option?.label}</span>
                        </div>
                    );
                }}
            >
                {Object.entries(languageOptions).map(([key, { label, countryCode }]) => (
                    <SelectItem
                        key={key}
                        textValue={label}
                        className="text-small text-[#1A1A1A] data-[hover=true]:bg-[#F5F5F2]"
                    >
                        <div className="flex items-center gap-2">
                            <ReactCountryFlag
                                countryCode={countryCode}
                                svg
                                style={{
                                    width: '1.2em',
                                    height: '1.2em',
                                }}
                                title={countryCode}
                            />
                            <span className="text-[#1A1A1A]">{label}</span>
                        </div>
                    </SelectItem>
                ))}
            </Select>
        </div>
    );
}; 