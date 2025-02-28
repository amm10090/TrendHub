'use client';

import { Divider, Image, Link as HeroLink } from '@heroui/react';
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import React from 'react';
import { useLocale, useTranslations } from 'use-intl';

import { NewsletterSubscribe } from './NewsletterSubscribe';

export const Footer: React.FC = () => {
  const t = useTranslations('footer');
  const locale = useLocale();

  const footerLinks = {
    customerService: [
      { name: t('customerService'), href: '/contact' },
      { name: t('giftCards'), href: '/gift-cards' },
      { name: t('privacy.title'), href: '/privacy' },
      { name: t('shipping'), href: '/shipping' },
      { name: t('returns'), href: '/returns' },
    ],
    aboutUs: [
      { name: t('aboutUs'), href: '/about' },
      { name: t('contact'), href: '/contact' },
      { name: t('followUs'), href: '/social' },
    ],
    socialZh: [
      { name: 'iOS App', href: '#', qrCode: '/images/qr-ios.png' },
      { name: t('wechat'), href: '#', qrCode: '/images/qr-wechat.png' },
      { name: t('huawei'), href: '#', qrCode: '/images/qr-huawei.png' },
    ],
    socialEn: [
      { name: 'LinkedIn', href: '#', icon: Linkedin },
      { name: 'Facebook', href: '#', icon: Facebook },
      { name: 'Twitter', href: '#', icon: Twitter },
      { name: 'Instagram', href: '#', icon: Instagram },
      { name: 'YouTube', href: '#', icon: Youtube },
    ],
  };

  return (
    <footer className="bg-bg-secondary-light dark:bg-bg-secondary-dark">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <NewsletterSubscribe />
        </div>

        <Divider className="border-border-primary-light dark:border-border-primary-dark my-8" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark uppercase tracking-wider mb-4">
              {t('company.title')}
            </h3>
            <ul className="space-y-2">
              {footerLinks.customerService.map((link) => (
                <li key={link.name}>
                  <HeroLink
                    href={link.href}
                    className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"
                  >
                    {link.name}
                  </HeroLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark uppercase tracking-wider mb-4">
              {t('help.title')}
            </h3>
            <ul className="space-y-2">
              {footerLinks.aboutUs.map((link) => (
                <li key={link.name}>
                  <HeroLink
                    href={link.href}
                    className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"
                  >
                    {link.name}
                  </HeroLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark uppercase tracking-wider mb-4">
              {t('legal.title')}
            </h3>
            {locale === 'zh' ? (
              <div className="grid grid-cols-3 gap-4">
                {footerLinks.socialZh.map((platform) => (
                  <div key={platform.name} className="text-center">
                    <div className="w-24 h-24 mx-auto mb-2 bg-bg-tertiary-light dark:bg-bg-tertiary-dark rounded-lg relative overflow-hidden">
                      <Image
                        alt={`${platform.name} QR Code`}
                        className="object-cover w-full h-full"
                        src={platform.qrCode}
                      />
                    </div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{platform.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4">
                  {footerLinks.socialEn.map((platform) => (
                    <HeroLink
                      key={platform.name}
                      href={platform.href}
                      className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
                    >
                      <platform.icon className="w-5 h-5" />
                    </HeroLink>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Divider className="border-border-primary-light dark:border-border-primary-dark my-8" />

        <div className="text-center">
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            &copy; {new Date().getFullYear()} TrendHub. {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

