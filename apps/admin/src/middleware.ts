import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import { auth } from "@/../auth"; // 直接导入 auth 函数
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

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
  const { pathname } = request.nextUrl;

  // 只在特定条件下记录日志，减少噪音
  const shouldLog =
    process.env.NODE_ENV === "development" ||
    (process.env.NODE_ENV === "production" &&
      pathname.includes("/login") &&
      Math.random() < 0.1);

  if (shouldLog) {
    console.log(
      `[MIDDLEWARE] Processing: ${pathname}, Auth: ${!!request.auth?.user}`,
    );
  }

  // Auth.js API 路径直接放行
  if (pathname.startsWith("/api/auth")) {
    return;
  }

  // 设置和公共API直接放行
  if (pathname.startsWith("/api/setup") || pathname.startsWith("/api/public")) {
    return;
  }

  // 静态资源和 Next.js 内部路径直接放行
  if (
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$|\/_next\/|\/favicon\.ico$/i.test(
      pathname,
    )
  ) {
    return;
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

  // 如果是公共页面，应用国际化中间件后直接返回
  if (isPublicPage) {
    return intlMiddleware(request);
  }

  // 检查用户认证状态
  const isAuthenticated = !!request.auth?.user;

  if (!isAuthenticated) {
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
      console.log(
        `[MIDDLEWARE] Redirecting unauthenticated user to: ${loginUrl}`,
      );
    }

    return NextResponse.redirect(loginUrl);
  }

  // 用户已认证，应用国际化中间件
  return intlMiddleware(request);
});

export const config = {
  matcher: [
    // 排除 API 路由、静态文件等，主要匹配页面路由
    "/((?!api/|_next/static|_next/image|favicon.ico|images/|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
