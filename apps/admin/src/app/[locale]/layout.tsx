import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

import { Providers } from "@/components/providers";
import { routing } from "@/i18n/routing";
import { inter, roboto, poppins, openSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "TrendHub Admin",
  description: "TrendHub Admin Dashboard",
  icons: {
    icon: "/favicon.ico",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // 确保传入的 locale 有效
  const param = await params;
  const locale = param.locale;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // 启用静态渲染
  await setRequestLocale(locale);

  // 获取翻译消息
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen font-sans antialiased bg-background text-foreground",
          inter.variable,
          roboto.variable,
          poppins.variable,
          openSans.variable,
        )}
      >
        <Providers>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
