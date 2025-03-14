import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

// 导出路由配置中定义的语言列表和默认语言
export const { locales, defaultLocale } = routing;

// 创建国际化导航函数
export const { Link, redirect, useRouter, usePathname } =
  createNavigation(routing);

// 类型定义
export type Locale = (typeof locales)[number];

export default routing;
