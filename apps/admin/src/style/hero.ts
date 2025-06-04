/**
 * HeroUI 主题配置文件
 * 该文件被 @plugin 指令导入到 globals.css 中
 */

import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      colors: {
        // 主色调
        "primary-50": "var(--primary-50)",
        "primary-100": "var(--primary-100)",
        "primary-200": "var(--primary-200)",
        "primary-300": "var(--primary-300)",
        "primary-400": "var(--primary-400)",
        "primary-500": "var(--primary-500)",
        "primary-600": "var(--primary-600)",
        "primary-700": "var(--primary-700)",
        "primary-800": "var(--primary-800)",
        "primary-900": "var(--primary-900)",
        "primary-foreground": "var(--primary-foreground)",

        // 次色调
        "secondary-50": "var(--secondary-50)",
        "secondary-100": "var(--secondary-100)",
        "secondary-200": "var(--secondary-200)",
        "secondary-300": "var(--secondary-300)",
        "secondary-400": "var(--secondary-400)",
        "secondary-500": "var(--secondary-500)",
        "secondary-600": "var(--secondary-600)",
        "secondary-700": "var(--secondary-700)",
        "secondary-800": "var(--secondary-800)",
        "secondary-900": "var(--secondary-900)",
        "secondary-foreground": "var(--secondary-foreground)",

        // 成功色调
        "success-50": "var(--success-50)",
        "success-100": "var(--success-100)",
        "success-200": "var(--success-200)",
        "success-300": "var(--success-300)",
        "success-400": "var(--success-400)",
        "success-500": "var(--success-500)",
        "success-600": "var(--success-600)",
        "success-700": "var(--success-700)",
        "success-800": "var(--success-800)",
        "success-900": "var(--success-900)",
        "success-foreground": "var(--success-foreground)",

        // 警告色调
        "warning-50": "var(--warning-50)",
        "warning-100": "var(--warning-100)",
        "warning-200": "var(--warning-200)",
        "warning-300": "var(--warning-300)",
        "warning-400": "var(--warning-400)",
        "warning-500": "var(--warning-500)",
        "warning-600": "var(--warning-600)",
        "warning-700": "var(--warning-700)",
        "warning-800": "var(--warning-800)",
        "warning-900": "var(--warning-900)",
        "warning-foreground": "var(--warning-foreground)",

        // 危险色调
        "danger-50": "var(--danger-50)",
        "danger-100": "var(--danger-100)",
        "danger-200": "var(--danger-200)",
        "danger-300": "var(--danger-300)",
        "danger-400": "var(--danger-400)",
        "danger-500": "var(--danger-500)",
        "danger-600": "var(--danger-600)",
        "danger-700": "var(--danger-700)",
        "danger-800": "var(--danger-800)",
        "danger-900": "var(--danger-900)",
        "danger-foreground": "var(--danger-foreground)",

        // 默认色调
        "default-50": "var(--default-50)",
        "default-100": "var(--default-100)",
        "default-200": "var(--default-200)",
        "default-300": "var(--default-300)",
        "default-400": "var(--default-400)",
        "default-500": "var(--default-500)",
        "default-600": "var(--default-600)",
        "default-700": "var(--default-700)",
        "default-800": "var(--default-800)",
        "default-900": "var(--default-900)",
        "default-foreground": "var(--default-foreground)",
      },
    },
  },
  variants: {
    extend: {
      // 为暗色模式定义自定义变体
      dark: "&:is(.dark *)",
    },
  },
  // 自定义工具类
  utilities: {
    ".container": {
      width: "100%",
      "margin-inline": "auto",
      "padding-inline": "1rem",
      "@screen sm": {
        "max-width": "640px",
      },
      "@screen md": {
        "max-width": "768px",
      },
      "@screen lg": {
        "max-width": "1024px",
      },
      "@screen xl": {
        "max-width": "1280px",
      },
      "@screen 2xl": {
        "max-width": "1536px",
      },
    },
  },
} as Config;
