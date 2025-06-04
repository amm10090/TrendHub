import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// 手动检查认证状态，避免使用Auth.js的包装器
function isUserAuthenticated(request: NextRequest): boolean {
  try {
    // 检查Next-Auth会话cookie
    const sessionToken =
      request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value ||
      request.cookies.get("authjs.session-token")?.value;

    return !!sessionToken;
  } catch {
    return false;
  }
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 生产环境大幅减少日志记录
  const isProduction = process.env.NODE_ENV === "production";
  const shouldLog = !isProduction; // 只在开发环境记录日志

  if (shouldLog) {
    console.log(`[MIDDLEWARE] Processing: ${pathname}`);
  }

  // 完全跳过所有Auth.js相关路径
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // 设置和公共API直接放行
  if (pathname.startsWith("/api/setup") || pathname.startsWith("/api/public")) {
    return NextResponse.next();
  }

  // 静态资源和 Next.js 内部路径直接放行
  if (
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$|\/_next\/|\/favicon\.ico$/i.test(
      pathname,
    )
  ) {
    return NextResponse.next();
  }

  // 处理根路径重定向
  if (pathname === "/" || pathname === "") {
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      request.nextUrl.host;
    return NextResponse.redirect(`${protocol}://${host}/en`);
  }

  // 定义公共页面路径（无需认证）
  const publicPaths = [
    "/en/login",
    "/cn/login",
    "/en/setup",
    "/cn/setup",
    "/en/verify-email",
    "/cn/verify-email",
  ];

  const isPublicPage =
    publicPaths.includes(pathname) ||
    pathname.startsWith("/en/public") ||
    pathname.startsWith("/cn/public");

  // 如果是公共页面，直接应用国际化中间件
  if (isPublicPage) {
    if (shouldLog) {
      console.log(
        `[MIDDLEWARE] Public page, applying intl middleware: ${pathname}`,
      );
    }
    return intlMiddleware(request);
  }

  // 手动检查用户认证状态
  const isAuthenticated = isUserAuthenticated(request);

  if (shouldLog) {
    console.log(`[MIDDLEWARE] Auth status for ${pathname}: ${isAuthenticated}`);
  }

  if (!isAuthenticated) {
    // 防止重定向循环：如果已经在任何公共页面，不要重定向
    if (publicPaths.some((path) => pathname.startsWith(path))) {
      return intlMiddleware(request);
    }

    // 提取语言代码
    const pathSegments = pathname.split("/").filter(Boolean);
    const locale =
      pathSegments[0] === "en" || pathSegments[0] === "cn"
        ? pathSegments[0]
        : "en";

    // 构建登录重定向URL
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      request.nextUrl.host;

    const callbackUrl = pathname === "/" ? "/" : encodeURIComponent(pathname);
    const loginUrl = `${protocol}://${host}/${locale}/login?callbackUrl=${callbackUrl}`;

    if (shouldLog) {
      console.log(`[MIDDLEWARE] Redirecting to login: ${loginUrl}`);
    }

    return NextResponse.redirect(loginUrl);
  }

  // 用户已认证，应用国际化中间件
  if (shouldLog) {
    console.log(
      `[MIDDLEWARE] User authenticated, applying intl middleware: ${pathname}`,
    );
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // 排除 API 路由、静态文件等，主要匹配页面路由
    "/((?!api/|_next/static|_next/image|favicon.ico|images/|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
