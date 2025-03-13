'use client';

import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@heroui/react';
import { ChevronDown } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import * as React from 'react';
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
    if (!pathname) {
      return;
    }
    const segments = pathname.split('/');

    segments[1] = value;
    router.push(segments.join('/'));
  };

  const currentOption = languageOptions[locale as keyof typeof languageOptions];

  if (!currentOption) {
    return null;
  }

  return (
    <div
      className="transition-all duration-300 ease-in-out"
      style={{
        opacity: isSearchOpen ? 0 : 1,
        visibility: isSearchOpen ? 'hidden' : 'visible',
        transform: isSearchOpen ? 'translateX(-20px)' : 'translateX(0)',
      }}
    >
      <Dropdown>
        <DropdownTrigger>
          <Button
            aria-label={currentOption.ariaLabel}
            className="min-h-8 h-8 bg-transparent text-text-primary-light dark:text-text-primary-dark hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark rounded-lg px-3 py-0.5 min-w-[140px] transition-all duration-200 border border-transparent hover:border-border-primary-light dark:hover:border-border-primary-dark"
            endContent={
              <ChevronDown className="h-3.5 w-3.5 text-text-secondary-light dark:text-text-secondary-dark transition-transform duration-200 group-data-[open=true]:rotate-180" />
            }
            size="sm"
            variant="flat"
          >
            <div className="flex items-center gap-2">
              <ReactCountryFlag
                svg
                countryCode={currentOption.countryCode}
                style={{
                  width: '1.2em',
                  height: '1.2em',
                  borderRadius: '2px',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                }}
                title={currentOption.countryCode}
              />
              <span className="text-small font-medium text-text-primary-light dark:text-text-primary-dark">
                {currentOption.label}
              </span>
            </div>
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="选择语言"
          className="min-w-[140px] bg-bg-secondary-light dark:bg-bg-secondary-dark text-text-primary-light dark:text-text-primary-dark border border-border-primary-light dark:border-border-primary-dark rounded-lg shadow-lg"
          onAction={(key) => handleLocaleChange(key as string)}
          classNames={{
            base: 'p-1',
          }}
        >
          {Object.entries(languageOptions).map(([key, { label, countryCode }]) => (
            <DropdownItem
              key={key}
              className={`text-small font-medium py-2 px-3 rounded-md transition-colors duration-150 ${
                locale === key
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-text-primary-light dark:text-text-primary-dark hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark'
              }`}
              startContent={
                <ReactCountryFlag
                  svg
                  countryCode={countryCode}
                  style={{
                    width: '1.2em',
                    height: '1.2em',
                    borderRadius: '2px',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                  }}
                  title={countryCode}
                />
              }
            >
              {label}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};
