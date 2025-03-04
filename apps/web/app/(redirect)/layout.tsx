import '@/styles/globals.css';
import React from 'react';

import { fontSans } from '@/config/fonts';

export default async function RedirectLayout({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <html suppressHydrationWarning>
            <head />
            <body className={`bg-bg-primary-light dark:bg-bg-primary-dark font-sans antialiased ${fontSans.variable}`}>
                {/* 
                  不在布局组件中设置NextIntlClientProvider
                  这样客户端组件可以使用自己的locale参数
                */}
                {children}
            </body>
        </html>
    );
} 