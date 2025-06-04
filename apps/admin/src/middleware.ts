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

  // 只在关键步骤打印日志，避免日志过多
  if (process.env.NODE_ENV === "production" && Math.random() < 0.1) {
    console.log(
      `[MIDDLEWARE] Processing: ${pathname}, Auth: ${!!request.auth?.user}`,
    );
  }

  // 检查 /api/auth 路径, 如果匹配则直接返回，不进行后续处理
  if (pathname.startsWith("/api/auth")) {
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

  // 处理根路径访问
  if (pathname === "/" || pathname === "") {
    const protocol = "http"; // 生产环境使用HTTP
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      request.nextUrl.host;

    return NextResponse.redirect(`${protocol}://${host}/en`);
  }

  // 定义公共页面（不需要认证的页面）
  const publicPathnameRegex = RegExp(
    `^/(en|cn)/(login|setup|verify-email|public)(/.*)?$`,
    "i",
  );
  const isPublicPage = publicPathnameRegex.test(pathname);

  // 如果是公共页面，直接应用国际化中间件，不进行认证检查
  if (isPublicPage) {
    return intlMiddleware(request);
  }

  // 检查用户是否已认证 - 只对非公共页面进行此检查
  if (!request.auth?.user) {
    // 提取语言代码
    const pathSegments = pathname.split("/").filter(Boolean);
    const locale =
      pathSegments[0] === "en" || pathSegments[0] === "cn"
        ? pathSegments[0]
        : "en";

    // 构建登录URL - 适配HTTP环境
    const protocol = "http"; // 生产环境使用HTTP
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      request.nextUrl.host;

    // 对于根路径，直接使用 "/"，避免不必要的编码
    const callbackUrl = pathname === "/" ? "/" : encodeURIComponent(pathname);
    const loginUrl = `${protocol}://${host}/${locale}/login?callbackUrl=${callbackUrl}`;

    return NextResponse.redirect(loginUrl);
  }

  return intlMiddleware(request);
});

export const config = {
  matcher: [
    // 排除所有 API 路由、Next.js 静态文件、图片和特定文件后缀
    // 主要匹配页面路由
    "/((?!api/|_next/static|_next/image|favicon.ico|images/|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
