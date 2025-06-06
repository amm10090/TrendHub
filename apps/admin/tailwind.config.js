import { heroui } from "@heroui/react";
import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // 应用源码
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // HeroUI 主题文件 - 确保指向根目录的 node_modules
    "../../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // 使用 Tailwind V4 兼容的 CSS 变量格式
        background: "var(--color-background)",
        "background-secondary": "var(--color-background-secondary)",
        "background-tertiary": "var(--color-background-tertiary)",
        foreground: "var(--color-foreground)",
        "foreground-secondary": "var(--color-foreground-secondary)",
        "foreground-tertiary": "var(--color-foreground-tertiary)",

        card: "var(--color-card)",
        "card-secondary": "var(--color-card-secondary)",
        "card-foreground": "var(--color-card-foreground)",

        popover: "var(--color-popover)",
        "popover-foreground": "var(--color-popover-foreground)",

        primary: "var(--color-primary)",
        "primary-foreground": "var(--color-primary-foreground)",

        secondary: "var(--color-secondary)",
        "secondary-foreground": "var(--color-secondary-foreground)",

        muted: "var(--color-muted)",
        "muted-foreground": "var(--color-muted-foreground)",

        accent: "var(--color-accent)",
        "accent-foreground": "var(--color-accent-foreground)",

        destructive: "var(--color-destructive)",
        "destructive-foreground": "var(--color-destructive-foreground)",

        border: "var(--color-border)",
        "border-secondary": "var(--color-border-secondary)",
        input: "var(--color-input)",
        ring: "var(--color-ring)",

        surface: "var(--color-surface)",
        "surface-hover": "var(--color-surface-hover)",
        "surface-pressed": "var(--color-surface-pressed)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 2px)",
        "2xl": "calc(var(--radius) + 6px)",
        "3xl": "calc(var(--radius) + 10px)",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(4px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-4px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 5px var(--color-primary)" },
          "50%": {
            boxShadow:
              "0 0 20px var(--color-primary), 0 0 30px var(--color-primary)",
          },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "slide-up": "slide-up 0.2s ease-out",
        "slide-down": "slide-down 0.2s ease-out",
        glow: "glow 2s ease-in-out infinite alternate",
        "fade-in-delay": "fade-in 0.5s ease-out 0.2s both",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "card-hover":
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "dark-card":
          "0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.2)",
        "dark-card-hover":
          "0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.3)",
        "elevation-1": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "elevation-2":
          "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "elevation-3":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "elevation-4":
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "elevation-5":
          "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "elevation-6": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        // 暗色模式特定阴影
        "dark-elevation-1": "0 1px 2px 0 rgb(0 0 0 / 0.3)",
        "dark-elevation-2":
          "0 4px 8px -2px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.3)",
        "dark-elevation-3":
          "0 8px 16px -4px rgb(0 0 0 / 0.6), 0 4px 8px -4px rgb(0 0 0 / 0.4)",
        "dark-elevation-4":
          "0 20px 35px -5px rgb(0 0 0 / 0.6), 0 8px 15px -6px rgb(0 0 0 / 0.4)",
        "dark-elevation-5":
          "0 30px 60px -12px rgb(0 0 0 / 0.8), 0 18px 36px -18px rgb(0 0 0 / 0.6)",
      },
      transitionTimingFunction: {
        fluid: "cubic-bezier(0.4, 0, 0.2, 1)",
        snappy: "cubic-bezier(0.2, 0, 0, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.6, 1)",
        bouncy: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    heroui({
      addCommonColors: true,
      defaultTheme: "light",
      defaultExtendTheme: "light",
      themes: {
        light: {
          colors: {
            background: "var(--color-background)",
            foreground: "var(--color-foreground)",
            primary: {
              DEFAULT: "var(--color-primary)",
              foreground: "var(--color-primary-foreground)",
            },
            secondary: {
              DEFAULT: "var(--color-secondary)",
              foreground: "var(--color-secondary-foreground)",
            },
            default: {
              50: "var(--color-default-50)",
              100: "var(--color-default-100)",
              200: "var(--color-default-200)",
              300: "var(--color-default-300)",
              400: "var(--color-default-400)",
              500: "var(--color-default-500)",
              600: "var(--color-default-600)",
              700: "var(--color-default-700)",
              800: "var(--color-default-800)",
              900: "var(--color-default-900)",
            },
          },
        },
        dark: {
          colors: {
            background: "var(--color-background)",
            foreground: "var(--color-foreground)",
            primary: {
              DEFAULT: "var(--color-primary)",
              foreground: "var(--color-primary-foreground)",
            },
            secondary: {
              DEFAULT: "var(--color-secondary)",
              foreground: "var(--color-secondary-foreground)",
            },
            default: {
              50: "var(--color-default-50)",
              100: "var(--color-default-100)",
              200: "var(--color-default-200)",
              300: "var(--color-default-300)",
              400: "var(--color-default-400)",
              500: "var(--color-default-500)",
              600: "var(--color-default-600)",
              700: "var(--color-default-700)",
              800: "var(--color-default-800)",
              900: "var(--color-default-900)",
            },
          },
        },
      },
    }),
  ],
};
