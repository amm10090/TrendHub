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

  console.log(
    `[MIDDLEWARE] Processing: ${pathname}, User: ${request.auth?.user ? "authenticated" : "not authenticated"}`,
  );

  // 检查 /api/auth 路径, 如果匹配则直接返回，不进行后续处理
  if (pathname.startsWith("/api/auth")) {
    console.log("[MIDDLEWARE] Auth API route, bypassing further checks.");
    return; // Auth.js API 路由直接放行
  }

  // 检查 /api/setup 路径，直接放行
  if (pathname.startsWith("/api/setup")) {
    return;
  }

  // 静态资源和 Next.js 内部路径直接放行
  const isAssetOrNextInternal =
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$|\/_next\/|\/favicon\.ico$/i.test(
      pathname,
    );

  if (isAssetOrNextInternal) {
    return;
  }

  // 定义公共页面（不需要认证的页面）
  const publicPathnameRegex = RegExp(
    `^/(en|cn)/(login|setup|verify-email|public)(/.*)?$`,
    "i",
  );
  const isPublicPage = publicPathnameRegex.test(pathname);

  if (isPublicPage) {
    console.log(`[MIDDLEWARE] Public page: ${pathname}`);
    return intlMiddleware(request);
  }

  // 处理根路径访问
  if (pathname === "/" || pathname === "") {
    const protocol =
      request.headers.get("x-forwarded-proto") ||
      (request.nextUrl.protocol === "https:" ? "https" : "http");
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      request.nextUrl.host;

    const redirectUrl = `${protocol}://${host}/en`;
    console.log(`[MIDDLEWARE] Root path redirect to: ${redirectUrl}`);
    return NextResponse.redirect(redirectUrl);
  }

  // 检查用户是否已认证
  if (!request.auth?.user) {
    // 提取语言代码
    const pathSegments = pathname.split("/").filter(Boolean);
    const locale =
      pathSegments[0] === "en" || pathSegments[0] === "cn"
        ? pathSegments[0]
        : "en";

    // 构建登录URL
    const protocol =
      request.headers.get("x-forwarded-proto") ||
      (request.nextUrl.protocol === "https:" ? "https" : "http");
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      request.nextUrl.host;

    // 对于根路径，直接使用 "/"，避免不必要的编码
    const callbackUrl = pathname === "/" ? "/" : encodeURIComponent(pathname);
    const loginUrl = `${protocol}://${host}/${locale}/login?callbackUrl=${callbackUrl}`;

    console.log(
      `[MIDDLEWARE] User not authenticated, redirecting to: ${loginUrl}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  console.log("[MIDDLEWARE] User authenticated, applying intl middleware.");
  return intlMiddleware(request);
});

export const config = {
  matcher: [
    // 排除所有 API 路由、Next.js 静态文件、图片和特定文件后缀
    // 主要匹配页面路由
    "/((?!api/|_next/static|_next/image|favicon.ico|images/|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
