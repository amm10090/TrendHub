import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // 支持的语言列表
  locales: ["en", "cn"],

  // 默认语言
  defaultLocale: "cn",
});
