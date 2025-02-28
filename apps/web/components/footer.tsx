'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { useTranslations } from 'use-intl';

const footerLinks = {
  customerService: [
    { name: '联系我们', href: '/contact' },
    { name: '礼品卡购物福利', href: '/gift-cards' },
    { name: '付款方式', href: '/payment' },
    { name: '配送说明', href: '/shipping' },
    { name: '退货与换货', href: '/returns' },
  ],
  aboutUs: [
    { name: '可持续性', href: '/sustainability' },
    { name: '媒体资讯', href: '/press' },
    { name: '工作机会', href: '/careers' },
    { name: '投资者关系', href: '/investors' },
    { name: '联盟计划', href: '/affiliates' },
  ],
  social: [
    { name: 'iOS App', href: '#', qrCode: '/images/qr-ios.png' },
    { name: '华为 App', href: '#', qrCode: '/images/qr-huawei.png' },
    { name: '微信小程序', href: '#', qrCode: '/images/qr-wechat.png' },
  ],
};

export const Footer: React.FC = () => {
  const t = useTranslations('footer');

  return (
    <footer className="bg-bg-secondary-light dark:bg-bg-secondary-dark border-t border-border-primary-light dark:border-border-primary-dark">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark uppercase tracking-wider mb-4">
              {t('company.title')}
            </h3>
            <ul className="space-y-2">
              {footerLinks.customerService.map((link) => (
                <li key={link.name}>
                  <Link
                    className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
                    href={link.href}
                  >
                    {link.name}
                  </Link>
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
                  <Link
                    className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
                    href={link.href}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark uppercase tracking-wider mb-4">
              {t('legal.title')}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {footerLinks.social.map((platform) => (
                <div key={platform.name} className="text-center">
                  <div className="w-24 h-24 mx-auto mb-2 bg-bg-tertiary-light dark:bg-bg-tertiary-dark rounded-lg relative">
                    <Image
                      alt={`${platform.name} QR Code`}
                      className="object-cover rounded-lg"
                      fill
                      sizes="96px"
                      src={platform.qrCode}
                    />
                  </div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{platform.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border-primary-light dark:border-border-primary-dark">
          <p className="text-sm text-center text-text-secondary-light dark:text-text-secondary-dark">
            &copy; {new Date().getFullYear()} TrendHub. {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};
