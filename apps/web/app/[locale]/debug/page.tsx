'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface ClientInfo {
  userAgent: string;
  language: string;
  languages: readonly string[];
  url: string;
  pathname: string;
  search: string;
  hash: string;
  host: string;
  protocol: string;
  referrer: string;
  screenWidth: number;
  screenHeight: number;
  innerWidth: number;
  innerHeight: number;
  devicePixelRatio: number;
}

export default function DebugPage() {
  const locale = useLocale();
  const t = useTranslations('common');
  const [clientInfo, setClientInfo] = useState<Partial<ClientInfo>>({});

  useEffect(() => {
    // 收集客户端环境信息
    setClientInfo({
      userAgent: window.navigator.userAgent,
      language: window.navigator.language,
      languages: window.navigator.languages,
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      host: window.location.host,
      protocol: window.location.protocol,
      referrer: document.referrer,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    });
  }, []);

  // 测试语言切换功能
  const handleLanguageChange = (newLocale: string) => {
    try {
      window.location.href = `/${newLocale}/debug`;
    } catch (error) {
      console.error('Error changing locale:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">TrendHub 调试页面</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">国际化信息</h2>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <p>
            <strong>当前语言:</strong> {locale}
          </p>
          <p>
            <strong>翻译测试:</strong> {t('hello', { name: 'TrendHub' })}
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">语言切换测试</h2>
        <div className="flex gap-4">
          <button
            onClick={() => handleLanguageChange('zh')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            切换到中文
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Switch to English
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">导航测试</h2>
        <div className="flex flex-wrap gap-4">
          <a
            href="/"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            首页 (客户端导航)
          </a>
          <a
            href="/women"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            女装 (客户端导航)
          </a>
          <a
            href="/men"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            男装 (客户端导航)
          </a>
          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            首页 (硬导航)
          </button>
          <button
            onClick={() => {
              window.location.href = '/women';
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            女装 (硬导航)
          </button>
          <button
            onClick={() => {
              window.location.href = '/men';
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            男装 (硬导航)
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">客户端环境信息</h2>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-96">
          {JSON.stringify(clientInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
}
