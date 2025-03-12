import { headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

import { locales, defaultLocale } from './config';

export default getRequestConfig(async () => {
  const headersList = await headers();
  const headerLocale = headersList.get('x-next-intl-locale');

  // 确保使用有效的语言
  let locale = headerLocale || defaultLocale;

  if (!locales.includes(locale as (typeof locales)[number])) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Asia/Shanghai',
  };
});
