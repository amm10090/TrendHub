import { createNavigation } from 'next-intl/navigation';
import { getRequestConfig } from 'next-intl/server';

import { locales, defaultLocale } from './config';

// 使用新的createNavigation API，简化配置
export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  defaultLocale,
});

export { useTranslations, useLocale } from 'next-intl';

export default getRequestConfig(async ({ requestLocale }) => {
  try {
    // 获取请求的语言，并确保它是有效的
    let locale = await requestLocale;

    // 确保使用有效的语言
    if (!locale || !locales.includes(locale as (typeof locales)[number])) {
      locale = defaultLocale;
    }

    const messages = (await import(`../messages/${locale}.json`)).default;

    return {
      locale,
      messages,
      timeZone: 'Asia/Shanghai',
      now: new Date(),
    };
  } catch {
    const defaultMessages = (await import(`../messages/${defaultLocale}.json`)).default;

    return {
      locale: defaultLocale,
      messages: defaultMessages,
      timeZone: 'Asia/Shanghai',
      now: new Date(),
    };
  }
});
