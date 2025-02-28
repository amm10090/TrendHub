import clsx from 'clsx';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import React, { Suspense } from 'react';

import { Providers } from '../providers';

import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { fontSans } from '@/config/fonts';
import { locales, Locale } from '@/i18n/config';

import '@/styles/globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

async function fetchMessages(locale: string) {
  const messages = await import(`../../messages/${locale}.json`)
    .then((module) => module.default)
    .catch(() => null);

  if (!messages) notFound();

  return messages;
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const resolvedParams = await params;
  const { locale } = resolvedParams;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await fetchMessages(locale as Locale);

  return (
    <html suppressHydrationWarning className="h-full" lang={locale}>
      <head />
      <body className={clsx('h-full bg-bg-secondary-light dark:bg-bg-secondary-dark font-sans antialiased', fontSans.variable)}>
        <Suspense
          fallback={<div className="flex items-center justify-center h-screen">加载中…</div>}
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Providers>
              <div className="flex flex-col h-full">
                <Navbar />
                <main className="flex-1 flex flex-col">{children}</main>
                <Footer />
              </div>
            </Providers>
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
