import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import { auth } from "@/../auth"; // 直接导入 auth 函数
import { locales, defaultLocale, Locale } from "@/i18n";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localeDetection: true,
  // localePrefix: undefined, // 假设 next-intl 根据路由策略自动处理前缀
});

// 定义认证会话类型
interface AuthSession {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export default auth((req) => {
  // 类型断言，因为 auth 回调中 req 会被增强
  const request = req as NextRequest & { auth: AuthSession };
  console.log(`[MIDDLEWARE] Pathname: ${request.nextUrl.pathname}`);

  const { pathname } = request.nextUrl;

  // 检查是否是公共路径 (不需要认证)
  const publicPathnameRegex = RegExp(
    `^(/(${locales.join("|")}))?/(login|public)|/api/auth|/favicon.ico$|/_next/static/|/_next/image/|/images/|/placeholder.svg$|/placeholder-logo.png$|/placeholder-user.jpg$|/placeholder.jpg$`,
    "i",
  );
  const isPublicPage = publicPathnameRegex.test(pathname);

  if (isPublicPage) {
    if (pathname.includes("/login")) {
      return intlMiddleware(request);
    }
    if (pathname.startsWith("/api/auth")) {
      return; // Auth.js API 路由直接放行, 不经过 next-intl
    }

    return intlMiddleware(request); // 其他公共路径由 intl 处理
  }

  // 对于所有其他路径，执行认证检查
  if (!request.auth?.user) {
    let localeForRedirect: Locale = defaultLocale;
    const pathnameSegments = pathname.split("/");

    if (
      pathnameSegments.length > 1 &&
      locales.includes(pathnameSegments[1] as Locale)
    ) {
      localeForRedirect = pathnameSegments[1] as Locale;
    }

    // 构建正确的相对路径，确保路径格式正确
    const callbackUrl = encodeURIComponent(pathname);

    // 使用 NextResponse 构建 URL 而不是直接构造字符串
    const url = new URL(`/${localeForRedirect}/login`, request.url);

    url.searchParams.set("callbackUrl", callbackUrl);

    return NextResponse.redirect(url);
  }

  // 用户已认证，执行 next-intl 中间件
  return intlMiddleware(request);
});

export const config = {
  matcher: [
    // 排除所有 API 路由、Next.js 静态文件、图片和特定文件后缀
    // 主要匹配页面路由
    "/((?!api/|_next/static|_next/image|favicon.ico|images/|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
