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
  // console.log(`[MIDDLEWARE] Pathname: ${request.nextUrl.pathname}`);

  const { pathname } = request.nextUrl;

  // 检查 /api/auth 路径, 如果匹配则直接返回，不进行后续处理
  if (pathname.startsWith("/api/auth")) {
    // console.log("[MIDDLEWARE] Auth API route, bypassing further checks.");
    return; // Auth.js API 路由直接放行
  }

  return (async () => {
    let systemInitialized = false;

    try {
      const statusApiUrl = new URL("/api/setup/status", request.url);
      const statusResponse = await fetch(statusApiUrl.toString());

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();

        systemInitialized = statusData.initialized === true;
      } else {
        // 如果状态接口调用失败（例如数据库未连接），保守地认为未初始化
        systemInitialized = false;
      }
    } catch {
      systemInitialized = false;
    }

    // console.log(`[MIDDLEWARE] System Initialized (from API): ${systemInitialized}`);

    const setupPageRegex = RegExp(`^(/(${locales.join("|")}))?/setup$`, "i");
    // 允许 /api/setup/initialize 和 /api/setup/status
    const setupApiRegex = RegExp(`^/api/setup/(initialize|status)$`, "i");
    const isAssetOrNextInternal =
      /\.(svg|png|jpg|jpeg|gif|webp)$|\/_next\//i.test(pathname);

    if (
      !systemInitialized &&
      !setupPageRegex.test(pathname) &&
      !setupApiRegex.test(pathname) &&
      !isAssetOrNextInternal
    ) {
      let localeForRedirect: Locale = defaultLocale;
      const pathnameSegments = pathname.split("/");

      if (
        pathnameSegments.length > 1 &&
        locales.includes(pathnameSegments[1] as Locale)
      ) {
        localeForRedirect = pathnameSegments[1] as Locale;
      }
      const setupUrl = new URL(`/${localeForRedirect}/setup`, request.url);

      // console.log(`[MIDDLEWARE] Redirecting to setup: ${setupUrl.toString()}`);
      return NextResponse.redirect(setupUrl);
    }

    // 如果系统已初始化，或者当前是 setup 页面/API，则继续后续的认证和 intl 中间件逻辑

    const publicPathnameRegex = RegExp(
      `^(/(${locales.join("|")}))?/(login|public)|/favicon.ico$|/_next/static/|/_next/image/|/images/|/placeholder.svg$|/placeholder-logo.png$|/placeholder-user.jpg$|/placeholder.jpg$`,
      "i",
    );
    const isPublicPage =
      publicPathnameRegex.test(pathname) ||
      setupPageRegex.test(pathname) ||
      setupApiRegex.test(pathname);

    if (isPublicPage) {
      // console.log(`[MIDDLEWARE] Public page or setup related: ${pathname}`);
      return intlMiddleware(request);
    }

    if (!request.auth?.user) {
      let localeForRedirect: Locale = defaultLocale;
      const pathnameSegments = pathname.split("/");

      if (
        pathnameSegments.length > 1 &&
        locales.includes(pathnameSegments[1] as Locale)
      ) {
        localeForRedirect = pathnameSegments[1] as Locale;
      }

      const callbackUrl = encodeURIComponent(pathname);
      const loginUrl = new URL(`/${localeForRedirect}/login`, request.url);

      loginUrl.searchParams.set("callbackUrl", callbackUrl);

      // console.log(`[MIDDLEWARE] User not authenticated, redirecting to login: ${loginUrl.toString()}`);
      return NextResponse.redirect(loginUrl);
    }

    // console.log("[MIDDLEWARE] User authenticated, applying intl middleware.");
    return intlMiddleware(request);
  })();
});

export const config = {
  matcher: [
    // 排除所有 API 路由、Next.js 静态文件、图片和特定文件后缀
    // 主要匹配页面路由
    "/((?!api/|_next/static|_next/image|favicon.ico|images/|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
