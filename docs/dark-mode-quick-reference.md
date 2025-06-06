# 暗色模式快速参考

## 🚀 快速开始

### 1. 导入工具函数

```tsx
import { cardStyles, textStyles, buttonStyles } from "@/lib/utils";
import { useTheme } from "@/lib/hooks/use-theme";
```

### 2. 基本主题切换

```tsx
function ThemeToggle() {
  const { colorMode, setTheme } = useTheme();

  return (
    <button
      onClick={() =>
        setTheme({
          colorMode: colorMode === "dark" ? "light" : "dark",
        })
      }
      className={buttonStyles("ghost")}
    >
      {colorMode === "dark" ? "🌞" : "🌙"}
    </button>
  );
}
```

## 🎨 样式速查表

### 卡片样式

```tsx
// 基础卡片
<Card className={cardStyles('default')}>

// 高级卡片（带阴影）
<Card className={cardStyles('elevated')}>

// 交互式卡片（hover 效果）
<Card className={cardStyles('interactive')}>

// 玻璃效果卡片
<Card className={cardStyles('glass')}>
```

### 文本样式

```tsx
// 主标题
<h1 className={`text-2xl font-bold ${textStyles('primary')}`}>

// 副标题
<h2 className={`text-lg font-medium ${textStyles('secondary')}`}>

// 说明文字
<p className={`text-sm ${textStyles('tertiary')}`}>
```

### 按钮样式

```tsx
// 主要操作
<button className={`${buttonStyles('primary')} h-10 px-4 py-2`}>

// 次要操作
<button className={`${buttonStyles('secondary')} h-10 px-4 py-2`}>

// 文本按钮
<button className={`${buttonStyles('ghost')} h-10 px-4 py-2`}>

// 危险操作
<button className={`${buttonStyles('destructive')} h-10 px-4 py-2`}>
```

## 🎯 常用颜色类

### 背景色

```css
bg-background           /* 主背景 */
bg-background-secondary /* 次要背景 */
bg-card                 /* 卡片背景 */
bg-muted                /* 弱化背景 */
bg-surface-hover        /* 悬停背景 */
```

### 文字色

```css
text-foreground           /* 主文字 */
text-foreground-secondary /* 次要文字 */
text-muted-foreground     /* 弱化文字 */
text-primary              /* 主题色文字 */
text-destructive          /* 错误文字 */
```

### 边框色

```css
border-border           /* 标准边框 */
border-border-secondary /* 次要边框 */
border-input            /* 输入框边框 */
border-primary          /* 主题色边框 */
```

## 📐 间距和尺寸

### 圆角

```css
rounded-lg    /* 12px - 标准圆角 */
rounded-xl    /* 14px - 增强圆角 */
rounded-2xl   /* 18px - 大圆角 */
rounded-3xl   /* 22px - 超大圆角 */
```

### 阴影

```css
shadow-elevation-1   /* 轻微阴影 */
shadow-elevation-2   /* 标准阴影 */
shadow-elevation-3   /* 增强阴影 */
shadow-elevation-4   /* 强阴影 */

/* 暗色模式专用 */
dark:shadow-dark-elevation-1
dark:shadow-dark-elevation-2
dark:shadow-dark-elevation-3
dark:shadow-dark-elevation-4
```

### 过渡效果

```css
transition-all duration-300               /* 标准过渡 */
transition-colors duration-300            /* 颜色过渡 */
transition-all duration-300 ease-fluid    /* 流畅过渡 */
hover:-translate-y-1                      /* 悬停上移 */
```

## 🔧 常用组合

### 标准卡片

```tsx
<Card className="bg-card border border-border rounded-xl shadow-elevation-2 hover:shadow-elevation-3 transition-all duration-300">
  <CardHeader>
    <h3 className={`text-lg font-semibold ${textStyles('primary')}`}>标题</h3>
    <p className={`text-sm ${textStyles('secondary')}`}>描述</p>
  </CardHeader>
  <CardBody>
    <!-- 内容 -->
  </CardBody>
</Card>
```

### 交互式列表项

```tsx
<div className="p-4 bg-card hover:bg-surface-hover border border-border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-elevation-2">
  <div className={`font-medium ${textStyles("primary")}`}>项目名称</div>
  <div className={`text-sm ${textStyles("secondary")}`}>项目描述</div>
</div>
```

### 表单容器

```tsx
<div className="space-y-6 p-6 bg-card border border-border rounded-xl shadow-elevation-1">
  <h2 className={`text-xl font-bold ${textStyles('primary')}`}>表单标题</h2>
  <div className="space-y-4">
    <!-- 表单字段 -->
  </div>
  <div className="flex gap-3 pt-4">
    <button className={`${buttonStyles('primary')} flex-1`}>提交</button>
    <button className={`${buttonStyles('secondary')} flex-1`}>取消</button>
  </div>
</div>
```

### 状态指示器

```tsx
{
  /* 成功状态 */
}
<div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
  <p className="text-green-800 dark:text-green-200">操作成功</p>
</div>;

{
  /* 警告状态 */
}
<div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
  <p className="text-yellow-800 dark:text-yellow-200">请注意</p>
</div>;

{
  /* 错误状态 */
}
<div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
  <p className="text-red-800 dark:text-red-200">操作失败</p>
</div>;
```

## 🎪 动画效果

### 入场动画

```css
animate-fade-in     /* 淡入 */
animate-slide-in    /* 滑入 */
animate-scale-in    /* 缩放入场 */
animate-slide-up    /* 向上滑入 */
animate-slide-down  /* 向下滑入 */
```

### 交互动画

```css
hover:scale-105           /* 悬停放大 */
hover:-translate-y-1      /* 悬停上移 */
hover:rotate-1            /* 悬停旋转 */
active:scale-95           /* 点击缩小 */
```

## 🌈 主题色变体

### 主色调

```css
bg-blue-500 text-white      /* 蓝色主题 */
bg-green-500 text-white     /* 绿色主题 */
bg-purple-500 text-white    /* 紫色主题 */
bg-red-500 text-white       /* 红色主题 */
```

### 渐变背景

```css
bg-gradient-to-r from-blue-500 to-purple-600
bg-gradient-to-br from-green-400 to-blue-600
bg-gradient-to-tr from-yellow-400 to-red-500
```

## 📱 响应式设计

### 断点类

```css
sm:   /* >= 640px */
md:   /* >= 768px */
lg:   /* >= 1024px */
xl:   /* >= 1280px */
2xl:  /* >= 1536px */
```

### 响应式网格

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  <!-- 网格项目 -->
</div>
```

### 响应式文字

```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold">
  响应式标题
</h1>
```

## 🔍 调试技巧

### 边框调试

```css
border border-red-500    /* 临时红色边框查看布局 */
```

### 背景调试

```css
bg-red-100 dark:bg-red-900/20    /* 临时背景色 */
```

### 主题状态检查

```tsx
// 在组件中临时添加
<div className="fixed bottom-4 right-4 p-2 bg-background border rounded text-xs">
  Current theme: {colorMode}
</div>
```

## ⚠️ 注意事项

### 避免硬编码颜色

```tsx
// ❌ 不推荐
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">

// ✅ 推荐
<div className="bg-background text-foreground">
```

### 保持对比度

```tsx
// 确保文字与背景有足够对比度
<div className="bg-muted text-muted-foreground">  // ❌ 对比度可能不够
<div className="bg-muted text-foreground">        // ✅ 对比度充足
```

### 测试多种主题

```tsx
// 在开发时切换主题测试
const themes = ["light", "dark", "system"];
```

---

**提示**: 将此文档保存为书签，开发时快速查阅！
