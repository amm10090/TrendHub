'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function LocaleNotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-secondary-light dark:bg-bg-secondary-dark p-4">
      <h1 className="text-4xl md:text-6xl font-bold mb-4 text-text-primary-light dark:text-text-primary-dark">
        404
      </h1>
      <h2 className="text-xl md:text-2xl mb-6 text-text-primary-light dark:text-text-primary-dark">
        {t('title')}
      </h2>
      <p className="text-center mb-8 text-text-secondary-light dark:text-text-secondary-dark max-w-md">
        {t('description')}
      </p>
      <Link
        className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-md transition-colors"
        href="/"
      >
        {t('backHome')}
      </Link>
    </div>
  );
}
