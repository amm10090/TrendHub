'use client';

import { Select, SelectItem } from '@heroui/react';
import { useLocale } from 'next-intl';
import React, { useCallback } from 'react';
import ReactCountryFlag from 'react-country-flag';

import { usePathname } from '@/i18n';

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
  const pathname = usePathname();

  // 使用简单的a标签进行语言切换，避免客户端导航问题
  const getLanguageUrl = useCallback(
    (newLocale: string) => {
      if (!pathname) return '#';

      // 从当前路径中提取非语言部分
      const pathSegments = pathname.split('/');

      pathSegments.shift(); // 移除第一个空字符串

      if (pathSegments.length > 0) {
        pathSegments[0] = newLocale; // 替换语言代码
      } else {
        pathSegments.push(newLocale); // 添加语言代码
      }

      return `/${pathSegments.join('/')}`;
    },
    [pathname]
  );

  const handleLocaleChange = useCallback(
    (newLocale: string) => {
      if (newLocale === locale) return;

      // 使用硬导航方式切换语言，避免客户端导航问题
      window.location.href = getLanguageUrl(newLocale);
    },
    [locale, getLanguageUrl]
  );

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
        disallowEmptySelection
      >
        {Object.entries(languageOptions).map(([key, { label, countryCode }]) => (
          <SelectItem
            key={key}
            className="text-small text-text-primary-light dark:text-text-primary-dark data-[hover=true]:bg-hover-bg-light dark:data-[hover=true]:bg-hover-bg-dark"
            textValue={label}
            onPress={() => {
              handleLocaleChange(key);
            }}
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

      {/* 添加备用链接，确保在组件失效时仍能切换语言 */}
      <div className="hidden">
        {Object.keys(languageOptions).map((lang) => (
          <a
            key={lang}
            href={getLanguageUrl(lang)}
            className="hidden"
            data-testid={`fallback-lang-${lang}`}
          >
            {lang}
          </a>
        ))}
      </div>
    </div>
  );
};
