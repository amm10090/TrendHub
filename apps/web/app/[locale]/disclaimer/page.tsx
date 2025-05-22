'use client';

import { Card, CardBody, CardHeader, Divider, Link, Skeleton } from '@heroui/react';
import { Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

export default function DisclaimerPage() {
  const t = useTranslations('disclaimer');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 模拟内容加载
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const sections = [
    'general',
    'pricing',
    'thirdparty',
    'liability',
    'intellectual',
    'modifications',
    'contact',
  ] as const;

  type Section = (typeof sections)[number];

  const getItems = (section: Section): string[] => {
    try {
      const items = t.raw(`sections.${section}.items`);

      if (items && typeof items === 'object') {
        return Object.values(items as Record<string, string>);
      }

      return [];
    } catch {
      return [];
    }
  };

  const renderContent = (section: Section) => (
    <div className="flex flex-col gap-y-4">
      <p className="text-text-primary-light dark:text-text-primary-dark">
        {t(`sections.${section}.content`)}
      </p>
      {section !== 'contact' && getItems(section).length > 0 && (
        <ul className="list-disc pl-6 flex flex-col gap-y-2 text-text-primary-light dark:text-text-primary-dark">
          {getItems(section).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
      {section === 'contact' && (
        <div className="items-center flex flex-row gap-x-2">
          <Mail className="w-4 h-4 text-text-primary-light dark:text-text-primary-dark" />
          <Link
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            href={`mailto:${t.raw('sections.contact.email')}`}
          >
            {t.raw('sections.contact.email')}
          </Link>
        </div>
      )}
    </div>
  );

  const renderSkeleton = () => (
    <div className="flex flex-col gap-y-6">
      <Skeleton className="h-8 w-3/4 rounded-lg" />
      <Skeleton className="h-4 w-full rounded-lg" />
      <Skeleton className="h-4 w-full rounded-lg" />
      <Skeleton className="h-4 w-5/6 rounded-lg" />
      <div className="flex flex-col gap-y-2">
        <Skeleton className="h-3 w-full rounded-lg" />
        <Skeleton className="h-3 w-full rounded-lg" />
        <Skeleton className="h-3 w-4/5 rounded-lg" />
      </div>
    </div>
  );

  return (
    <div className="grow bg-bg-secondary-light dark:bg-bg-secondary-dark">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4 text-text-primary-light dark:text-text-primary-dark">
          {t('title')}
        </h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-8">
          {t('last_updated')}
        </p>

        <div className="flex flex-col gap-y-6">
          {sections.map((section) => (
            <Card
              key={section}
              className="w-full border-border-primary-light dark:border-border-primary-dark bg-bg-tertiary-light dark:bg-bg-tertiary-dark"
              shadow="sm"
            >
              <CardHeader className="px-6 py-4">
                <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
                  {t(`sections.${section}.title`)}
                </h2>
              </CardHeader>
              <Divider className="opacity-50" />
              <CardBody className="px-6 py-4">
                {isLoaded ? renderContent(section) : renderSkeleton()}
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
