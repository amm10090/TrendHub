import { NextIntlClientProvider } from 'next-intl';

import TrackPageContent from './components/TrackPageContent';

interface PageProps {
    params: Promise<{ locale: string; slug: string[] }>;
}

// 服务器组件
export default async function TrackPage({ params }: PageProps) {
    const { locale } = await params;

    // 预先获取消息
    const messages = (await import(`@/messages/${locale}.json`)).default;

    return (
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Shanghai">
            <TrackPageContent locale={locale} />
        </NextIntlClientProvider>
    );
}

// 生成静态参数
export async function generateStaticParams() {
    return [
        { locale: 'en', slug: ['product', '1'] },
        { locale: 'zh', slug: ['product', '1'] },
        { locale: 'en', slug: ['product', '2'] },
        { locale: 'zh', slug: ['product', '2'] },
        { locale: 'en', slug: ['product', '3'] },
        { locale: 'zh', slug: ['product', '3'] },
        { locale: 'en', slug: ['product', '4'] },
        { locale: 'zh', slug: ['product', '4'] },
    ];
} 