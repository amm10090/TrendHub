import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // 支持的语言列表
  locales: ["en", "cn"],

  // 默认语言
  defaultLocale: "en",

  // 在生产环境中始终显示语言前缀，避免重定向冲突
  localePrefix: "always",

  // 禁用自动语言检测，避免与Auth.js冲突
  localeDetection: false,
});
