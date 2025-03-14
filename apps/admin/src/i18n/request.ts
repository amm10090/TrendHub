import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // 获取当前请求的语言
  const requested = await requestLocale;
  // 确保我们使用有效的语言，如果无效则使用默认语言
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    // 必须返回locale
    locale,
    // 加载对应语言的翻译文件
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
