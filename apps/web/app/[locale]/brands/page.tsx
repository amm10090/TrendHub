import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import BrandsClient from './brands-client';

export async function generateMetadata(props: { params: { locale: string } }): Promise<Metadata> {
  const params = await props.params;
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'brands' });

  return {
    title: t('seo.title'),
    description: t('seo.description'),
  };
}

export default function BrandsPage({ params: { locale } }: { params: { locale: string } }) {
  return <BrandsClient locale={locale} />;
}
