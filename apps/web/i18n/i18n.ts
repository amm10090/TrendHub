import { headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

import { defaultLocale } from './config';

export default getRequestConfig(async () => {
  const headersList = await headers();
  const locale = headersList.get('x-next-intl-locale') || defaultLocale;

  return {
    locale, // 添加locale属性
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Asia/Shanghai',
  };
});
