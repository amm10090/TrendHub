import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { locales, defaultLocale } from './i18n/config';

// 创建中间件，处理国际化路由
const intlMiddleware = createMiddleware({
  // 定义支持的语言
  locales,
  // 设置默认语言
  defaultLocale,
  // 始终在URL中显示语言前缀
  localePrefix: 'always',
  // 启用语言检测
  localeDetection: true,
});

// 包装中间件，添加错误处理和调试信息
export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 跳过静态资源和API路由
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  try {
    // 调用next-intl中间件
    const response = await intlMiddleware(request);

    return response;
  } catch {
    // 发生错误时，重定向到默认语言的首页
    const url = new URL(`/${defaultLocale}`, request.url);

    return NextResponse.redirect(url);
  }
}

// 配置匹配的路由
export const config = {
  matcher: [
    // 匹配所有路由，除了以下路径
    '/((?!api|_next|.*\\.|favicon.ico).*)',
    // 匹配所有语言前缀的路由
    '/(zh|en)/:path*',
  ],
};
