'use client';

import { Switch } from '@heroui/react';
import { useTheme } from 'next-themes';
import { FC, useEffect, useState } from 'react';

import { SunIcon, MoonIcon } from '@/components/icons';

export interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 使用 resolvedTheme 来确保获取正确的主题状态（包括系统主题）
  const isDarkMode = mounted ? resolvedTheme === 'dark' : false;

  return (
    <Switch
      aria-label="切换暗色/亮色模式"
      classNames={{
        base: className,
        wrapper: 'bg-default-200 group-data-[selected=true]:!bg-primary-500',
        thumb: 'bg-white',
        startContent: 'text-default-500 dark:text-default-300',
        endContent: 'text-default-500 dark:text-default-300',
      }}
      color="primary"
      endContent={<MoonIcon className="h-4 w-4" />}
      isSelected={isDarkMode}
      size="sm"
      startContent={<SunIcon className="h-4 w-4" />}
      onValueChange={(isSelected) => {
        if (mounted) {
          setTheme(isSelected ? 'dark' : 'light');
        }
      }}
    />
  );
};
