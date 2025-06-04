import { createPlugin } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [createPlugin("./src/style/hero.ts")],
  // Tailwind CSS v4 特性开启
  future: {
    enableAtRulesInConfig: true,
    enableCustomMedia: true,
    enableCustomSelectors: true,
    enableCustomVariants: true,
    enableNesting: true,
    enableThemeFunctions: true,
    enableUniqueVariantUtilities: true,
  },
  // 源文件配置
  source: [
    // 所有的源文件
    "../../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
};
