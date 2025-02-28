'use client';

import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <HeroUIProvider>
        <ToastProvider
          placement="top-right"
          maxVisibleToasts={3}
          toastProps={{
            timeout: 3000,
            variant: "flat",
            radius: "lg",
            shouldShowTimeoutProgess: true,
            classNames: {
              base: "dark:bg-bg-tertiary-dark dark:text-text-primary-dark",
              title: "dark:text-text-primary-dark font-medium",
              description: "dark:text-text-secondary-dark mt-1",
              closeButton: "dark:text-text-secondary-dark dark:hover:text-text-primary-dark"
            }
          }}
        />
        {children}
      </HeroUIProvider>
    </NextThemesProvider>
  );
}
