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
    },
    dark: {
        background: {
            primary: '#0A0A0A',    // 接近纯黑的背景色
            secondary: '#121212',   // 稍浅的黑色，用于卡片和导航
            tertiary: '#1A1A1A',   // 最浅的黑色，用于hover和强调
        },
        text: {
            primary: '#FFFFFF',    // 纯白色文字
            secondary: '#B3B3B3',  // 浅灰色
            tertiary: '#808080',   // 中灰色
        },
        border: {
            primary: '#1A1A1A',    // 深色边框
            secondary: '#262626',   // 浅色边框
        },
        hover: {
            background: '#262626',  // 悬停背景色
            text: '#FFFFFF',        // 悬停文字色
        },
    },
} as const;

// 导出类型
export type ColorScheme = typeof colors;
export type ColorMode = keyof ColorScheme;
export type ColorCategory = keyof ColorScheme['light'];
export type ColorVariant = keyof ColorScheme['light']['background'] | keyof ColorScheme['light']['text'] | keyof ColorScheme['light']['border'] | keyof ColorScheme['light']['hover']; 