'use client';

import { Switch } from '@heroui/react';
import { useTheme } from 'next-themes';
import { FC } from 'react';

import { SunIcon, MoonIcon } from '@/components/icons';

export interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const { theme, setTheme } = useTheme();

  return (
    <Switch
      defaultSelected={theme === 'dark'}
      size="sm"
      classNames={{
        base: className,
        wrapper: 'bg-bg-tertiary-light dark:bg-bg-tertiary-dark',
        thumb: 'bg-text-primary-light dark:bg-text-primary-dark',
        startContent: 'text-text-primary-light dark:text-text-primary-dark',
        endContent: 'text-text-primary-light dark:text-text-primary-dark',
      }}
      startContent={<SunIcon className="h-4 w-4" />}
      endContent={<MoonIcon className="h-4 w-4" />}
      onValueChange={(isSelected) => setTheme(isSelected ? 'dark' : 'light')}
    />
  );
};
