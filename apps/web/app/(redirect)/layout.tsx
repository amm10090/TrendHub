import '@/styles/globals.css';

import { fontSans } from '@/config/fonts';

// 使用 Next.js 15.2.2 推荐的布局组件类型定义
export default function RedirectLayout({
  children,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any;
}) {
  return (
    <html suppressHydrationWarning>
      <head />
      <body
        className={`bg-bg-primary-light dark:bg-bg-primary-dark font-sans antialiased ${fontSans.variable}`}
      >
        {/* 
          不在布局组件中设置NextIntlClientProvider
          这样客户端组件可以使用自己的locale参数
        */}
        {children}
      </body>
    </html>
  );
}
