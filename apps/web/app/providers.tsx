'use client';

import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode, useEffect, useState } from 'react';

import { ProductModalProvider } from '../contexts/product-modal-context';

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-full bg-bg-secondary-light dark:bg-bg-secondary-dark">
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
          <HeroUIProvider>
            <ProductModalProvider>
              {children}
            </ProductModalProvider>
          </HeroUIProvider>
        </NextThemesProvider>
      </div>
    );
  }

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <HeroUIProvider>
        <ProductModalProvider>
          {children}
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
        </ProductModalProvider>
      </HeroUIProvider>
    </NextThemesProvider>
  );
}
