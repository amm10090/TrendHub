'use client';

import { Select, SelectItem } from '@heroui/react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import React from 'react';
import ReactCountryFlag from 'react-country-flag';

const languageOptions = {
  zh: {
    label: '中文',
    code: 'CN',
    countryCode: 'CN',
    ariaLabel: '选择语言',
  },
  en: {
    label: 'English',
    code: 'US',
    countryCode: 'US',
    ariaLabel: 'Select Language',
  },
};

interface LanguageSwitchProps {
  isSearchOpen?: boolean;
}

export const LanguageSwitch: React.FC<LanguageSwitchProps> = ({ isSearchOpen = false }) => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (value: string) => {
    if (!pathname) return;

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
        aria-label={currentOption?.ariaLabel}
        classNames={{
          trigger:
            'min-h-8 h-8 bg-transparent text-text-primary-light dark:text-text-primary-dark data-[hover=true]:bg-hover-bg-light dark:data-[hover=true]:bg-hover-bg-dark rounded-lg px-2 py-0.5',
          value: 'text-small text-text-primary-light dark:text-text-primary-dark font-medium',
          base: 'min-w-[140px]',
          listbox:
            'min-w-[140px] bg-bg-secondary-light dark:bg-bg-secondary-dark text-text-primary-light dark:text-text-primary-dark border border-border-primary-light dark:border-border-primary-dark',
          listboxWrapper: 'rounded-lg',
          innerWrapper: 'gap-1',
        }}
        renderValue={(items) => {
          const item = items[0];
          const option = languageOptions[item?.key as keyof typeof languageOptions];

          return (
            <div className="flex items-center gap-2">
              <ReactCountryFlag
                svg
                countryCode={option?.countryCode || ''}
                style={{
                  width: '1.2em',
                  height: '1.2em',
                }}
                title={option?.countryCode}
              />
              <span className="text-small text-text-primary-light dark:text-text-primary-dark">
                {option?.label}
              </span>
            </div>
          );
        }}
        selectedKeys={[locale]}
        size="sm"
        variant="flat"
        onSelectionChange={(keys) => {
          const value = Array.from(keys)[0] as string;

          handleLocaleChange(value);
        }}
      >
        {Object.entries(languageOptions).map(([key, { label, countryCode }]) => (
          <SelectItem
            key={key}
            className="text-small text-text-primary-light dark:text-text-primary-dark data-[hover=true]:bg-hover-bg-light dark:data-[hover=true]:bg-hover-bg-dark"
            textValue={label}
          >
            <div className="flex items-center gap-2">
              <ReactCountryFlag
                svg
                countryCode={countryCode}
                style={{
                  width: '1.2em',
                  height: '1.2em',
                }}
                title={countryCode}
              />
              <span className="text-text-primary-light dark:text-text-primary-dark">{label}</span>
            </div>
          </SelectItem>
        ))}
      </Select>
    </div>
  );
};
