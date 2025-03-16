import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { locales, defaultLocale } from "./i18n";

// 解析Accept-Language头部，获取用户首选语言
function getPreferredLocale(request: NextRequest): string {
  // 获取Accept-Language头部
  const acceptLanguage = request.headers.get("accept-language") || "";

  // 使用正则表达式匹配所有可能的中文语言代码
  const zhRegex = /^zh|zh-CN|zh-TW|zh-HK|zh-SG|zh-MO/i;

  // 解析Accept-Language头部，获取语言列表及其权重
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [language, weight = "q=1.0"] = lang.trim().split(";");
      const q = parseFloat(weight.replace("q=", ""));

      return { language, q };
    })
    .sort((a, b) => b.q - a.q); // 按权重降序排序

  // 检查首选语言是否为中文
  const prefersChinese =
    languages.length > 0 && zhRegex.test(languages[0].language);

  // 如果首选中文，返回cn，否则返回en
  return prefersChinese ? "cn" : "en";
}

// 创建next-intl中间件
const intlMiddleware = createMiddleware({
  // 支持的语言列表
  locales,

  // 默认语言
  defaultLocale,

  // 禁用自动语言检测，我们将自己处理
  localeDetection: false,
});

// 自定义中间件
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 如果是根路径，检测用户的语言偏好并重定向
  if (pathname === "/") {
    const preferredLocale = getPreferredLocale(request);

    // 创建重定向URL
    const url = new URL(`/${preferredLocale}`, request.url);

    return NextResponse.redirect(url);
  }

  // 如果已经在某个语言路径下，检查是否与用户的语言偏好一致
  const pathLocale = locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (pathLocale) {
    const preferredLocale = getPreferredLocale(request);

    // 如果路径语言与首选语言不一致，重定向到首选语言路径
    if (pathLocale !== preferredLocale) {
      // 提取路径中的非语言部分
      const pathWithoutLocale = pathname.replace(`/${pathLocale}`, "") || "/";

      // 创建重定向URL
      const url = new URL(
        `/${preferredLocale}${pathWithoutLocale}`,
        request.url,
      );

      return NextResponse.redirect(url);
    }
  }

  // 对于其他情况，使用next-intl中间件处理
  return intlMiddleware(request);
}

// 配置匹配路径
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
