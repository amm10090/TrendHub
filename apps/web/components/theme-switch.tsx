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
      color="default"
      startContent={<SunIcon className="h-4 w-4" />}
      endContent={<MoonIcon className="h-4 w-4" />}
      className={className}
      onValueChange={(isSelected) => setTheme(isSelected ? 'dark' : 'light')}
    />
  );
};
