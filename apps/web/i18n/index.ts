import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { getRequestConfig } from 'next-intl/server';

import { locales } from './config';

export const { Link, redirect, usePathname, useRouter } = createSharedPathnamesNavigation({
  locales,
});

export { useTranslations, useLocale } from 'next-intl';

export default getRequestConfig(async ({ locale }) => {
  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: 'Asia/Shanghai',
    now: new Date(),
  };
});
