# TrendHub 暗色模式开发指南

## 📖 概述

本文档详细介绍了 TrendHub Admin 面板的暗色模式实现方案，包括架构设计、使用方法、最佳实践和维护指南。

## 🏗️ 架构概览

### 技术栈

- **Tailwind CSS V4**: 现代化的 CSS 框架，支持原生暗色模式
- **Next.js 15**: React 框架，支持 SSR 和客户端主题切换
- **HeroUI**: 现代化 UI 组件库，与 Tailwind 深度集成
- **CSS 变量**: 动态主题颜色管理
- **OKLCH 颜色空间**: 更好的颜色感知和一致性

### 核心文件结构

```
apps/admin/src/
├── style/
│   └── globals.css              # 主题颜色定义和全局样式
├── lib/
│   ├── providers/
│   │   └── theme-provider.tsx   # 主题上下文提供者
│   ├── hooks/
│   │   └── use-theme.ts         # 主题 Hook
│   └── utils.ts                 # 样式工具函数
└── tailwind.config.js           # Tailwind 配置
```

## 🎨 颜色系统

### 颜色架构

我们采用三层颜色架构：

1. **原子颜色**: 基础颜色调色板（red, blue, green 等）
2. **语义颜色**: 功能性颜色变量（primary, secondary, background 等）
3. **组件颜色**: 特定组件的颜色映射

### 主要颜色变量

#### 背景颜色

```css
/* 亮色模式 */
--color-background: oklch(1 0 0); /* 纯白 */
--color-background-secondary: oklch(0.98 0 0); /* 浅灰 */
--color-background-tertiary: oklch(0.96 0 0); /* 更浅灰 */

/* 暗色模式 */
--color-background: oklch(0.08 0 0); /* 深黑 */
--color-background-secondary: oklch(0.09 0 0); /* 稍亮黑 */
--color-background-tertiary: oklch(0.11 0 0); /* 更亮黑 */
```

#### 前景颜色

```css
/* 亮色模式 */
--color-foreground: oklch(0.145 0 0); /* 深灰文字 */
--color-foreground-secondary: oklch(0.556 0 0); /* 中灰文字 */
--color-foreground-tertiary: oklch(0.708 0 0); /* 浅灰文字 */

/* 暗色模式 */
--color-foreground: oklch(0.98 0 0); /* 近白文字 */
--color-foreground-secondary: oklch(0.85 0 0); /* 亮灰文字 */
--color-foreground-tertiary: oklch(0.7 0 0); /* 中灰文字 */
```

#### 卡片颜色

```css
/* 亮色模式 */
--color-card: oklch(1 0 0); /* 纯白卡片 */
--color-card-secondary: oklch(0.98 0 0); /* 浅灰卡片 */

/* 暗色模式 */
--color-card: oklch(0.12 0 0); /* 深灰卡片 */
--color-card-secondary: oklch(0.15 0 0); /* 稍亮卡片 */
```

### 为什么选择 OKLCH？

- **更好的色彩感知**: 基于人眼视觉感知的颜色空间
- **一致的亮度**: 相同 L 值的颜色在视觉上亮度一致
- **更好的色彩渐变**: 平滑的颜色过渡效果
- **未来兼容性**: Web 标准推荐的现代颜色格式

## 🔧 主题系统

### ThemeProvider 组件

```tsx
// 基本用法
function App() {
  return (
    <ThemeProvider>
      <YourApplication />
    </ThemeProvider>
  );
}
```

#### 主题设置

```tsx
interface ThemeSettings {
  colorMode: "light" | "dark" | "system"; // 颜色模式
  primaryColor: "blue" | "green" | "purple"; // 主题色
  contentWidth: "boxed" | "fluid"; // 内容宽度
  navigationStyle: "sidebar" | "topbar"; // 导航样式
  fontSize: "sm" | "base" | "lg"; // 字体大小
  fontFamily: "inter" | "roboto"; // 字体族
  reducedMotion: boolean; // 减少动画
  denseMode: boolean; // 紧凑模式
}
```

### useTheme Hook

```tsx
import { useTheme } from "@/lib/hooks/use-theme";

function MyComponent() {
  const { colorMode, setTheme, isLoading } = useTheme();

  const toggleDarkMode = () => {
    setTheme({
      colorMode: colorMode === "dark" ? "light" : "dark",
    });
  };

  return (
    <button onClick={toggleDarkMode}>
      切换到 {colorMode === "dark" ? "亮色" : "暗色"} 模式
    </button>
  );
}
```

## 🎯 样式工具函数

### cardStyles() - 卡片样式

```tsx
import { cardStyles } from '@/lib/utils';

// 基础卡片
<Card className={cardStyles('default')}>

// 高级卡片（带阴影）
<Card className={cardStyles('elevated')}>

// 交互式卡片（hover 效果）
<Card className={cardStyles('interactive')}>

// 玻璃效果卡片
<Card className={cardStyles('glass')}>
```

#### 变体说明

- **default**: 基础样式，轻微阴影
- **elevated**: 增强阴影，适合重要内容
- **interactive**: 悬停效果，适合可点击元素
- **glass**: 玻璃拟态效果，适合覆盖层

### textStyles() - 文本样式

```tsx
import { textStyles } from '@/lib/utils';

// 主要文本
<h1 className={textStyles('primary')}>标题</h1>

// 次要文本
<p className={textStyles('secondary')}>描述</p>

// 三级文本
<span className={textStyles('tertiary')}>标签</span>
```

### buttonStyles() - 按钮样式

```tsx
import { buttonStyles } from '@/lib/utils';

// 主要按钮
<button className={buttonStyles('primary')}>确认</button>

// 次要按钮
<button className={buttonStyles('secondary')}>取消</button>

// 幽灵按钮
<button className={buttonStyles('ghost')}>链接</button>

// 危险按钮
<button className={buttonStyles('destructive')}>删除</button>
```

## 🎨 Tailwind 配置详解

### 扩展的颜色系统

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      // 语义化颜色映射
      background: "var(--color-background)",
      foreground: "var(--color-foreground)",
      card: "var(--color-card)",
      // ... 更多颜色
    },

    // 增强的圆角系统
    borderRadius: {
      lg: "var(--radius)",              // 12px
      xl: "calc(var(--radius) + 2px)",  // 14px
      "2xl": "calc(var(--radius) + 6px)", // 18px
      "3xl": "calc(var(--radius) + 10px)", // 22px
    },

    // 阴影层次系统
    boxShadow: {
      "elevation-1": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      "elevation-2": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      // 暗色模式专用阴影
      "dark-elevation-1": "0 1px 2px 0 rgb(0 0 0 / 0.3)",
      "dark-elevation-2": "0 4px 8px -2px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.3)",
    }
  }
}
```

### 动画系统

```js
keyframes: {
  "fade-in": {
    "0%": { opacity: "0" },
    "100%": { opacity: "1" },
  },
  "slide-in": {
    "0%": { transform: "translateY(20px)", opacity: "0" },
    "100%": { transform: "translateY(0)", opacity: "1" },
  },
  "glow": {
    "0%, 100%": { boxShadow: "0 0 5px var(--color-primary)" },
    "50%": { boxShadow: "0 0 20px var(--color-primary)" },
  },
}
```

## 📱 响应式设计

### 断点使用

```tsx
// 移动优先的响应式设计
<div className="
  grid gap-4
  grid-cols-1      // 移动端：1列
  md:grid-cols-2   // 平板：2列
  lg:grid-cols-4   // 桌面：4列
">
```

### 暗色模式响应式

```tsx
// 基于主题的响应式样式
<div className="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-gray-100
  border-gray-200 dark:border-gray-700
">
```

## 🔨 开发最佳实践

### 1. 优先使用语义化颜色

❌ **不推荐**:

```tsx
<div className="bg-gray-900 text-white dark:bg-gray-100 dark:text-black">
```

✅ **推荐**:

```tsx
<div className="bg-background text-foreground">
```

### 2. 使用工具函数保持一致性

❌ **不推荐**:

```tsx
<Card className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
```

✅ **推荐**:

```tsx
<Card className={cardStyles('elevated')}>
```

### 3. 合理使用过渡效果

```tsx
// 标准过渡
<div className="transition-colors duration-300">

// 复杂过渡
<div className="transition-all duration-300 ease-fluid">

// 减少动画支持
<div className="transition-colors duration-300 motion-reduce:transition-none">
```

### 4. 颜色对比度检查

确保文本与背景的对比度符合 WCAG 标准：

- **AA 级**: 4.5:1 (正常文本)
- **AAA 级**: 7:1 (更高标准)

```tsx
// 好的对比度示例
<div className="bg-background text-foreground">       // 高对比度
<div className="bg-muted text-muted-foreground">      // 中等对比度
```

### 5. 测试多种主题

```tsx
// 确保组件在所有主题下都正常工作
const themes = ["light", "dark", "system"];
themes.forEach((theme) => {
  // 测试组件渲染
});
```

## 🧪 测试指南

### 视觉测试检查清单

- [ ] 亮色模式下所有元素可见且对比度足够
- [ ] 暗色模式下所有元素可见且对比度足够
- [ ] 主题切换过渡平滑
- [ ] 卡片与背景有明显层次感
- [ ] hover 状态反馈明显
- [ ] 焦点状态清晰可见
- [ ] 在不同设备尺寸下表现一致

### 自动化测试

```tsx
// 主题切换测试
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/lib/providers/theme-provider";

test("theme switching works correctly", () => {
  render(
    <ThemeProvider>
      <YourComponent />
    </ThemeProvider>,
  );

  // 测试主题切换逻辑
});
```

### 可访问性测试

```bash
# 使用 axe-core 进行可访问性测试
npm install --save-dev @axe-core/react
```

## 🐛 故障排除

### 常见问题

#### 1. 颜色变量未生效

**问题**: CSS 变量没有正确应用
**解决方案**:

```tsx
// 检查 ThemeProvider 是否正确包装应用
<ThemeProvider>
  <App />
</ThemeProvider>;

// 确保 globals.css 已导入
import "@/style/globals.css";
```

#### 2. 主题切换不平滑

**问题**: 主题切换时出现闪烁
**解决方案**:

```css
/* 确保过渡效果正确设置 */
* {
  transition-property: color, background-color, border-color, box-shadow;
  transition-duration: 0.3s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### 3. HeroUI 组件样式冲突

**问题**: HeroUI 组件在暗色模式下样式异常
**解决方案**:

```tsx
// 检查 HeroUI 主题配置
import { heroui } from "@heroui/react";

export default {
  plugins: [
    heroui({
      themes: {
        dark: {
          colors: {
            background: "var(--color-background)",
            foreground: "var(--color-foreground)",
          },
        },
      },
    }),
  ],
};
```

#### 4. 服务端渲染闪烁

**问题**: SSR 时主题检测不正确
**解决方案**:

```tsx
// 使用 suppressHydrationWarning 处理主题相关的 hydration 不匹配
<body suppressHydrationWarning={true}>
```

### 调试工具

#### 1. 主题状态调试

```tsx
function ThemeDebugger() {
  const theme = useTheme();

  if (process.env.NODE_ENV === "development") {
    return (
      <div className="fixed bottom-4 right-4 p-4 bg-background border rounded-lg">
        <pre>{JSON.stringify(theme, null, 2)}</pre>
      </div>
    );
  }

  return null;
}
```

#### 2. 颜色变量检查

```js
// 在浏览器控制台中检查 CSS 变量
const checkCSSVariables = () => {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);

  const variables = [
    "--color-background",
    "--color-foreground",
    "--color-card",
    "--color-primary",
  ];

  variables.forEach((variable) => {
    console.log(`${variable}: ${computedStyle.getPropertyValue(variable)}`);
  });
};

checkCSSVariables();
```

## 🚀 性能优化

### 1. CSS 变量优化

```css
/* 使用 CSS 变量而不是内联样式 */
:root {
  --theme-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-aware {
  transition: var(--theme-transition);
}
```

### 2. 减少重新渲染

```tsx
// 使用 useMemo 优化主题值
const themeValue = useMemo(
  () => ({
    ...theme,
    setTheme: handleSetTheme,
    isLoading,
  }),
  [theme, isLoading, handleSetTheme],
);
```

### 3. 懒加载主题组件

```tsx
// 动态导入大型主题组件
const ThemeCustomizer = lazy(() => import("./ThemeCustomizer"));
```

## 📈 未来扩展

### 1. 计划中的功能

- [ ] 自定义主题颜色选择器
- [ ] 更多预设主题（高对比度、护眼模式等）
- [ ] 主题动画效果自定义
- [ ] 更精细的颜色调节选项

### 2. 技术升级路径

- **Tailwind CSS V5**: 关注新版本的暗色模式改进
- **CSS Color Level 4**: 更多现代颜色功能
- **Container Queries**: 更灵活的响应式设计

### 3. 扩展建议

#### 添加新主题变体

```tsx
// 在 ThemeProvider 中添加新的颜色模式
type ColorMode = "light" | "dark" | "system" | "auto" | "high-contrast";
```

#### 组件级主题重写

```tsx
// 允许组件级别的主题自定义
interface ComponentTheme {
  background?: string;
  foreground?: string;
  border?: string;
}

function ThemedComponent({ theme }: { theme?: ComponentTheme }) {
  const style = {
    "--local-bg": theme?.background,
    "--local-fg": theme?.foreground,
  } as CSSProperties;

  return (
    <div style={style} className="bg-[var(--local-bg,var(--color-background))]">
      // 内容
    </div>
  );
}
```

## 📚 参考资源

### 官方文档

- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Next.js Theming](https://nextjs.org/docs/app/building-your-application/styling)
- [HeroUI Theming](https://heroui.com/docs/customization/theme)

### 颜色工具

- [OKLCH Color Picker](https://oklch.com/)
- [Contrast Ratio Checker](https://webaim.org/resources/contrastchecker/)
- [Coolors.co](https://coolors.co/) - 调色板生成器

### 设计系统参考

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Dark Theme](https://material.io/design/color/dark-theme.html)
- [Tailwind UI](https://tailwindui.com/) - 官方组件库

## 🤝 贡献指南

### 提交新主题

1. 在 `globals.css` 中定义新的颜色变量
2. 更新 `ThemeSettings` 接口
3. 添加相应的测试用例
4. 更新本文档

### 报告问题

请在 GitHub Issues 中报告主题相关问题，并包含：

- 浏览器版本
- 设备信息
- 复现步骤
- 期望行为 vs 实际行为

---

**最后更新**: 2024年12月
**维护者**: TrendHub 开发团队
**版本**: v1.0.0
