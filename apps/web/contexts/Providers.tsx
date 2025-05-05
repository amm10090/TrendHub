'use client';

import { ThemeProvider } from 'next-themes';

import { ProductModalProvider } from './product-modal-context';

interface ProvidersProps {
  children: React.ReactNode;
  locale?: string;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ProductModalProvider>{children}</ProductModalProvider>
    </ThemeProvider>
  );
}
