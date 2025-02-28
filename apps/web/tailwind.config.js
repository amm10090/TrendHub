import { heroui } from '@heroui/theme';
import { colors } from './config/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    '..//../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: '1rem',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        // 背景色
        'bg-primary': {
          light: colors.light.background.primary,
          dark: colors.dark.background.primary,
        },
        'bg-secondary': {
          light: colors.light.background.secondary,
          dark: colors.dark.background.secondary,
        },
        'bg-tertiary': {
          light: colors.light.background.tertiary,
          dark: colors.dark.background.tertiary,
        },
        // 文字颜色
        'text-primary': {
          light: colors.light.text.primary,
          dark: colors.dark.text.primary,
        },
        'text-secondary': {
          light: colors.light.text.secondary,
          dark: colors.dark.text.secondary,
        },
        'text-tertiary': {
          light: colors.light.text.tertiary,
          dark: colors.dark.text.tertiary,
        },
        // 边框颜色
        'border-primary': {
          light: colors.light.border.primary,
          dark: colors.dark.border.primary,
        },
        'border-secondary': {
          light: colors.light.border.secondary,
          dark: colors.dark.border.secondary,
        },
        // 悬停颜色
        'hover-bg': {
          light: colors.light.hover.background,
          dark: colors.dark.hover.background,
        },
        'hover-text': {
          light: colors.light.hover.text,
          dark: colors.dark.hover.text,
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [heroui()],
};
