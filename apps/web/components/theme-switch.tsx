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
    <div className={`relative ${className || ''}`}>
      <Switch
        aria-label="切换暗色/亮色模式"
        classNames={{
          base: 'transition-all duration-300 ease-in-out',
          wrapper: `h-7 w-14 rounded-full ${
            isDarkMode
              ? 'bg-primary-800 border border-primary-600'
              : 'bg-primary-100 border border-primary-200'
          } group-data-[selected=true]:!bg-none`,
          thumb: `h-5 w-5 rounded-full ${
            isDarkMode
              ? 'bg-primary-400 shadow-[0_0_8px_2px_rgba(0,128,255,0.5)] translate-x-[14px]'
              : 'bg-primary-500 shadow-[0_0_8px_2px_rgba(255,200,0,0.3)]'
          } transition-all duration-300 ease-in-out`,
          startContent:
            'text-yellow-400 absolute left-1.5 z-10 transition-all duration-300 ease-in-out',
          endContent:
            'text-black dark:text-blue-300 absolute right-1.5 z-10 transition-all duration-300 ease-in-out',
        }}
        color="primary"
        endContent={
          <div
            className={`transition-all duration-300 ease-in-out transform ${isDarkMode ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
          >
            <MoonIcon className="h-3.5 w-3.5" />
          </div>
        }
        isSelected={isDarkMode}
        size="sm"
        startContent={
          <div
            className={`transition-all duration-300 ease-in-out transform ${!isDarkMode ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
          >
            <SunIcon className="h-3.5 w-3.5" />
          </div>
        }
        onValueChange={(isSelected) => {
          if (mounted) {
            setTheme(isSelected ? 'dark' : 'light');
          }
        }}
      />
      <div
        className={`absolute inset-0 rounded-full transition-opacity duration-300 pointer-events-none ${
          isDarkMode
            ? 'bg-gradient-to-r from-primary-700/20 to-primary-500/20 opacity-70'
            : 'bg-gradient-to-r from-yellow-300/20 to-primary-300/20 opacity-50'
        }`}
      />
    </div>
  );
};
