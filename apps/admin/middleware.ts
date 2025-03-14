import createMiddleware from "next-intl/middleware";

import { routing } from "./src/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // 匹配所有路径，除了以下模式
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
