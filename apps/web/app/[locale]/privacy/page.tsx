'use client';

import { Accordion, AccordionItem, Link } from '@heroui/react';
import { Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function PrivacyPage() {
  const t = useTranslations('privacy');

  const sections = [
    'introduction',
    'information_collection',
    'information_use',
    'information_sharing',
    'cookies',
    'security',
    'rights',
    'contact',
  ] as const;

  type Section = (typeof sections)[number];

  const getItems = (section: Section): string[] => {
    try {
      const items = t.raw(`sections.${section}.items`);

      if (items && typeof items === 'object' && !Array.isArray(items)) {
        return Object.values(items as Record<string, string>);
      }

      return [];
    } catch (error) {
      console.warn(`Failed to get items for section ${section}:`, error);

      return [];
    }
  };

  const renderContent = (section: Section) => (
    <div className="flex flex-col gap-y-4">
      <p>{t(`sections.${section}.content`)}</p>
      {section !== 'contact' && getItems(section).length > 0 && (
        <ul className="list-disc pl-6 flex flex-col gap-y-2">
          {getItems(section).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
      {section === 'contact' && (
        <div className=" items-center flex flex-row gap-x-2">
          <Mail className="w-4 h-4" />
          <Link
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            href={`mailto:${t('sections.contact.email')}`}
          >
            {t('sections.contact.email')}
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className="grow bg-bg-secondary-light dark:bg-bg-secondary-dark">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-8">
          {t('last_updated')}
        </p>

        <Accordion
          className="w-full"
          defaultExpandedKeys={['introduction']}
          itemClasses={{
            base: 'border-b border-divider dark:border-divider-dark',
            title: 'text-xl font-semibold',
            trigger: 'px-6 py-4',
            content: 'px-6 pb-6',
          }}
          selectionMode="multiple"
          variant="bordered"
        >
          {sections.map((section) => (
            <AccordionItem
              key={section}
              aria-label={t(`sections.${section}.title`)}
              title={t(`sections.${section}.title`)}
            >
              {renderContent(section)}
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
