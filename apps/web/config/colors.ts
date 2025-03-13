export const colors = {
  light: {
    background: {
      primary: '#FFFFFF',
      secondary: '#FAF9F6',
      tertiary: '#F5F5F2',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
      tertiary: '#999999',
    },
    border: {
      primary: '#E8E6E3',
      secondary: '#F0F0F0',
    },
    hover: {
      background: '#F5F5F2',
      text: '#1A1A1A',
    },
    // HeroUI 语义颜色
    primary: {
      '50': '#EDF5FF',
      '100': '#D0E4FF',
      '200': '#B3D4FF',
      '300': '#66AFFF',
      '400': '#3D9AFF',
      '500': '#0080FF',
      '600': '#0062C3',
      '700': '#004A94',
      '800': '#003166',
      '900': '#001833',
    },
    secondary: {
      '50': '#F4F0FF',
      '100': '#EBE3FF',
      '200': '#D9CCFF',
      '300': '#BEA6FF',
      '400': '#A683FF',
      '500': '#8B5CF6',
      '600': '#7C3AED',
      '700': '#6D28D9',
      '800': '#5B21B6',
      '900': '#4C1D95',
    },
    success: {
      '50': '#F0FDF4',
      '100': '#DCFCE7',
      '200': '#BBF7D0',
      '300': '#86EFAC',
      '400': '#4ADE80',
      '500': '#22C55E',
      '600': '#16A34A',
      '700': '#15803D',
      '800': '#166534',
      '900': '#14532D',
    },
    warning: {
      '50': '#FFFBEB',
      '100': '#FEF3C7',
      '200': '#FDE68A',
      '300': '#FCD34D',
      '400': '#FBBF24',
      '500': '#F59E0B',
      '600': '#D97706',
      '700': '#B45309',
      '800': '#92400E',
      '900': '#78350F',
    },
    danger: {
      '50': '#FEF2F2',
      '100': '#FEE2E2',
      '200': '#FECACA',
      '300': '#FCA5A5',
      '400': '#F87171',
      '500': '#EF4444',
      '600': '#DC2626',
      '700': '#B91C1C',
      '800': '#991B1B',
      '900': '#7F1D1D',
    },
    default: {
      '50': '#F9FAFB',
      '100': '#F3F4F6',
      '200': '#E5E7EB',
      '300': '#D1D5DB',
      '400': '#9CA3AF',
      '500': '#6B7280',
      '600': '#4B5563',
      '700': '#374151',
      '800': '#1F2937',
      '900': '#111827',
    },
  },
  dark: {
    background: {
      primary: '#0A0A0A', // 接近纯黑的背景色
      secondary: '#121212', // 稍浅的黑色，用于卡片和导航
      tertiary: '#1A1A1A', // 最浅的黑色，用于hover和强调
    },
    text: {
      primary: '#FFFFFF', // 纯白色文字
      secondary: '#B3B3B3', // 浅灰色
      tertiary: '#808080', // 中灰色
    },
    border: {
      primary: '#1A1A1A', // 深色边框
      secondary: '#262626', // 浅色边框
    },
    hover: {
      background: '#262626', // 悬停背景色
      text: '#FFFFFF', // 悬停文字色
    },
    // HeroUI 语义颜色 - 暗色模式
    primary: {
      '50': '#001833',
      '100': '#003166',
      '200': '#004A94',
      '300': '#0062C3',
      '400': '#0080FF',
      '500': '#3D9AFF',
      '600': '#66AFFF',
      '700': '#B3D4FF',
      '800': '#D0E4FF',
      '900': '#EDF5FF',
    },
    secondary: {
      '50': '#4C1D95',
      '100': '#5B21B6',
      '200': '#6D28D9',
      '300': '#7C3AED',
      '400': '#8B5CF6',
      '500': '#A683FF',
      '600': '#BEA6FF',
      '700': '#D9CCFF',
      '800': '#EBE3FF',
      '900': '#F4F0FF',
    },
    success: {
      '50': '#14532D',
      '100': '#166534',
      '200': '#15803D',
      '300': '#16A34A',
      '400': '#22C55E',
      '500': '#4ADE80',
      '600': '#86EFAC',
      '700': '#BBF7D0',
      '800': '#DCFCE7',
      '900': '#F0FDF4',
    },
    warning: {
      '50': '#78350F',
      '100': '#92400E',
      '200': '#B45309',
      '300': '#D97706',
      '400': '#F59E0B',
      '500': '#FBBF24',
      '600': '#FCD34D',
      '700': '#FDE68A',
      '800': '#FEF3C7',
      '900': '#FFFBEB',
    },
    danger: {
      '50': '#7F1D1D',
      '100': '#991B1B',
      '200': '#B91C1C',
      '300': '#DC2626',
      '400': '#EF4444',
      '500': '#F87171',
      '600': '#FCA5A5',
      '700': '#FECACA',
      '800': '#FEE2E2',
      '900': '#FEF2F2',
    },
    default: {
      '50': '#111827',
      '100': '#1F2937',
      '200': '#374151',
      '300': '#4B5563',
      '400': '#6B7280',
      '500': '#9CA3AF',
      '600': '#D1D5DB',
      '700': '#E5E7EB',
      '800': '#F3F4F6',
      '900': '#F9FAFB',
    },
  },
} as const;

// 导出类型
export type ColorScheme = typeof colors;
export type ColorMode = keyof ColorScheme;
export type ColorCategory = keyof ColorScheme['light'];
export type ColorVariant =
  | keyof ColorScheme['light']['background']
  | keyof ColorScheme['light']['text']
  | keyof ColorScheme['light']['border']
  | keyof ColorScheme['light']['hover']
  | keyof ColorScheme['light']['primary']
  | keyof ColorScheme['light']['secondary']
  | keyof ColorScheme['light']['success']
  | keyof ColorScheme['light']['warning']
  | keyof ColorScheme['light']['danger']
  | keyof ColorScheme['light']['default'];
