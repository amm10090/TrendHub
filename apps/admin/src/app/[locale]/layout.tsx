import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "TrendHub Admin System",
  description: "TrendHub Backend Management System",
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
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="h-full">{children}</div>
    </NextIntlClientProvider>
  );
}
