import React, { Suspense } from 'react';
import "@/styles/globals.css";
import { Providers } from '../providers';
import { locales } from '@/i18n/config';
import { notFound } from 'next/navigation';
import { Link } from "@heroui/link";
import clsx from "clsx";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";
import { NextIntlClientProvider } from 'next-intl';

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

async function fetchMessages(locale: string) {
    const messages = await import(`../../messages/${locale}.json`).then((module) => module.default).catch(() => null);
    if (!messages) notFound();
    return messages;
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode, params: { locale: string } }) {
    // 使用await处理params
    const paramsData = await Promise.resolve(params);
    const locale = paramsData.locale;
    const messages = await fetchMessages(locale);

    if (!locales.includes(locale as any)) {
        notFound();
    }

    return (
        <html lang={locale} suppressHydrationWarning>
            <head />
            <body className={clsx("min-h-screen bg-[#FAF9F6] font-sans antialiased", fontSans.variable)}>
                <Suspense fallback={<div>加载中…</div>}>
                    <NextIntlClientProvider locale={locale} messages={messages}>
                        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
                            <div className="relative flex flex-col h-screen">
                                <Navbar />
                                <main className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">
                                    {children}
                                </main>
                                <footer className="w-full flex items-center justify-center py-3">
                                    <Link
                                        isExternal
                                        className="flex items-center gap-1 text-[#666666]"
                                        href="https://heroui.com?utm_source=next-app-template"
                                        title="heroui.com homepage"
                                    >
                                        <span className="text-[#666666]">Powered by</span>
                                        <p className="text-[#1A1A1A]">HeroUI</p>
                                    </Link>
                                </footer>
                            </div>
                        </Providers>
                    </NextIntlClientProvider>
                </Suspense>
            </body>
        </html>
    );
}
