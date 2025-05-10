import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import BrandsClient from './brands-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const awaitedParams = await params;
  const locale = awaitedParams.locale;
  const t = await getTranslations({ locale, namespace: 'brands' });

  return {
    title: t('seo.title'),
    description: t('seo.description'),
  };
}

export default async function BrandsPage({ params }: { params: Promise<{ locale: string }> }) {
  const awaitedParams = await params;
  const locale = awaitedParams.locale;

  return <BrandsClient locale={locale} />;
}
