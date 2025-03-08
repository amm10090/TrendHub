'use client';

import { Switch } from '@heroui/react';
import { useTheme } from 'next-themes';
import { FC, useEffect, useState } from 'react';

import { SunIcon, MoonIcon } from '@/components/icons';

export interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Switch
        classNames={{
          base: className,
          wrapper: 'bg-bg-tertiary-light dark:bg-bg-tertiary-dark',
          thumb: 'bg-text-primary-light dark:bg-text-primary-dark',
          startContent: 'text-text-primary-light dark:text-text-primary-dark',
          endContent: 'text-text-primary-light dark:text-text-primary-dark',
        }}
        endContent={<MoonIcon className="h-4 w-4" />}
        size="sm"
        startContent={<SunIcon className="h-4 w-4" />}
      />
    );
  }

  return (
    <Switch
      classNames={{
        base: className,
        wrapper: 'bg-bg-tertiary-light dark:bg-bg-tertiary-dark',
        thumb: 'bg-text-primary-light dark:bg-text-primary-dark',
        startContent: 'text-text-primary-light dark:text-text-primary-dark',
        endContent: 'text-text-primary-light dark:text-text-primary-dark',
      }}
      endContent={<MoonIcon className="h-4 w-4" />}
      isSelected={theme === 'dark'}
      size="sm"
      startContent={<SunIcon className="h-4 w-4" />}
      onValueChange={(isSelected) => setTheme(isSelected ? 'dark' : 'light')}
    />
  );
};
