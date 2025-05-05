'use client';

import { Divider, Image, Link as HeroLink } from '@heroui/react';
import * as React from 'react';
import { SocialIcon } from 'react-social-icons';
import { useLocale, useTranslations } from 'use-intl';

import { useSettings } from '@/contexts/SettingsContext';

import { NewsletterSubscribe } from './NewsletterSubscribe';

export const Footer: React.FC = () => {
  const t = useTranslations('footer');
  const locale = useLocale();
  const { settings } = useSettings();

  const footerLinks = {
    customerService: [
      { name: t('privacy.title'), href: '/privacy' },
      { name: t('disclaimer.title'), href: '/disclaimer' },
    ],
    aboutUs: [
      { name: t('aboutUs'), href: '/about' },
      { name: t('contact'), href: '/contact' },
    ],
    socialZh: [
      { name: 'iOS App', href: '#', qrCode: settings.socialIOSQRCode },
      { name: t('wechat'), href: '#', qrCode: settings.socialWechatQRCode },
      { name: t('huawei'), href: '#', qrCode: settings.socialHuaweiQRCode },
    ],
    socialEn: [
      { name: 'Facebook', href: settings.facebook },
      { name: 'Twitter', href: settings.twitter },
      { name: 'Instagram', href: settings.instagram },
      { name: 'Pinterest', href: settings.pinterest },
    ],
  };

  const socialLinksZh = footerLinks.socialZh.filter((link) => link.qrCode);
  const socialLinksEn = footerLinks.socialEn.filter((link) => link.href);

  const copyrightText =
    settings.siteCopyright || `${settings.siteName || 'TrendHub'}. ${t('copyright')}`;

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
            <ul className="flex flex-col gap-y-2">
              {footerLinks.customerService.map((link) => (
                <li key={link.name}>
                  <HeroLink
                    className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"
                    href={link.href}
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
            <ul className="flex flex-col gap-y-2">
              {footerLinks.aboutUs.map((link) => (
                <li key={link.name}>
                  <HeroLink
                    className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"
                    href={link.href}
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
                {socialLinksZh.map((platform) => (
                  <div key={platform.name} className="text-center">
                    {platform.qrCode && (
                      <div className="w-24 h-24 mx-auto mb-2 bg-bg-tertiary-light dark:bg-bg-tertiary-dark rounded-lg relative overflow-hidden">
                        <Image
                          alt={`${platform.name} QR Code`}
                          className="object-cover w-full h-full"
                          src={platform.qrCode}
                        />
                      </div>
                    )}
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {platform.name}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {socialLinksEn.map((platform) =>
                  platform.href && platform.href !== '#' ? (
                    <SocialIcon
                      key={platform.name || platform.href}
                      url={platform.href}
                      style={{ height: 25, width: 25 }}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-opacity hover:opacity-80"
                      fgColor="#ffffff"
                    />
                  ) : null
                )}
              </div>
            )}
          </div>
        </div>

        <Divider className="border-border-primary-light dark:border-border-primary-dark my-8" />

        <div className="text-center">
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            &copy; {new Date().getFullYear()} {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
};
