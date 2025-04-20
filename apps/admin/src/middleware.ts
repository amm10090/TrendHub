import createMiddleware from "next-intl/middleware";

import { locales, defaultLocale } from "./i18n";

// 创建next-intl中间件
const intlMiddleware = createMiddleware({
  // 支持的语言列表
  locales,

  // 默认语言
  defaultLocale,

  // 启用自动语言检测
  localeDetection: true,
});

// 使用next-intl中间件
export default intlMiddleware;

// 配置匹配路径
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
