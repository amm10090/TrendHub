import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

// 创建中间件，处理国际化路由
export default createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'always'
});

// 配置匹配的路由
export const config = {
    matcher: ['/((?!api|_next|.*\\..*).*)']
}; 