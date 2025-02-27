import React, { Suspense } from 'react';
import "@/styles/globals.css";
import { Providers } from '../providers';
import { locales } from '@/i18n/config';
import { notFound } from 'next/navigation';
import { Link } from "@heroui/react";
import clsx from "clsx";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";
import { NextIntlClientProvider } from 'next-intl';
import { Footer } from "@/components/footer";

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

async function fetchMessages(locale: string) {
    const messages = await import(`../../messages/${locale}.json`).then((module) => module.default).catch(() => null);
    if (!messages) notFound();
    return messages;
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode, params: { locale: string } }) {
    const paramsData = await Promise.resolve(params);
    const locale = paramsData.locale;
    const messages = await fetchMessages(locale);

    if (!locales.includes(locale as any)) {
        notFound();
    }

    return (
        <html lang={locale} suppressHydrationWarning className="h-full">
            <head />
            <body className={clsx(
                "h-full bg-[#FAF9F6] font-sans antialiased",
                fontSans.variable
            )}>
                <Suspense fallback={<div className="flex items-center justify-center h-screen">加载中…</div>}>
                    <NextIntlClientProvider locale={locale} messages={messages}>
                        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
                            <div className="flex flex-col h-full">
                                <Navbar />
                                <main className="flex-1 flex flex-col">
                                    {children}
                                </main>
                                <Footer />
                            </div>
                        </Providers>
                    </NextIntlClientProvider>
                </Suspense>
            </body>
        </html>
    );
}
