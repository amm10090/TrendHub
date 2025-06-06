import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并Tailwind CSS类名
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * 增强的卡片样式工具函数
 * 提供一致的卡片外观，支持不同的变体和状态
 */
export function cardStyles(
  variant: "default" | "elevated" | "interactive" | "glass" = "default",
) {
  const baseStyles =
    "bg-card border border-border rounded-xl transition-all duration-300";

  const variants = {
    default: "shadow-elevation-1 dark:shadow-dark-elevation-1",
    elevated:
      "shadow-elevation-2 hover:shadow-elevation-3 dark:shadow-dark-elevation-2 dark:hover:shadow-dark-elevation-3",
    interactive:
      "hover:bg-surface-hover hover:shadow-elevation-3 hover:-translate-y-1 cursor-pointer group dark:shadow-dark-elevation-2 dark:hover:shadow-dark-elevation-4",
    glass: "backdrop-blur-sm bg-card/80 shadow-glass border-border/50",
  };

  return cn(baseStyles, variants[variant]);
}

/**
 * 文本颜色工具函数
 * 提供一致的文本颜色层次
 */
export function textStyles(
  level: "primary" | "secondary" | "tertiary" = "primary",
) {
  const styles = {
    primary: "text-foreground",
    secondary: "text-foreground-secondary",
    tertiary: "text-foreground-tertiary",
  };

  return styles[level];
}

/**
 * 按钮样式工具函数
 * 提供一致的按钮外观和状态
 */
export function buttonStyles(
  variant: "primary" | "secondary" | "ghost" | "destructive" = "primary",
) {
  const baseStyles =
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md transform hover:-translate-y-0.5",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md",
  };

  return cn(baseStyles, variants[variant]);
}

/**
 * 表格样式工具函数
 * 提供一致的表格外观和暗色模式支持
 */
export function tableStyles(
  variant: "default" | "striped" | "bordered" = "default",
) {
  const baseStyles =
    "w-full bg-card border border-border rounded-lg overflow-hidden";

  const variants = {
    default: "",
    striped: "[&_tbody_tr:nth-child(even)]:bg-muted/50",
    bordered:
      "[&_td]:border-r [&_td]:border-border [&_td:last-child]:border-r-0",
  };

  return cn(baseStyles, variants[variant]);
}

/**
 * 表格行样式工具函数
 */
export function tableRowStyles(
  variant: "default" | "hover" | "selected" = "default",
) {
  const baseStyles = "border-b border-border transition-colors duration-200";

  const variants = {
    default: "",
    hover: "hover:bg-muted/50 cursor-pointer",
    selected: "bg-accent/50 hover:bg-accent/70",
  };

  return cn(baseStyles, variants[variant]);
}

/**
 * 表格头样式工具函数
 */
export function tableHeaderStyles() {
  return "bg-muted/30 text-muted-foreground font-medium text-sm border-b border-border";
}

/**
 * 状态徽章样式工具函数
 */
export function badgeStyles(
  variant: "success" | "warning" | "error" | "info" | "neutral" = "neutral",
) {
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200";

  const variants = {
    success:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    warning:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    neutral: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300",
  };

  return cn(baseStyles, variants[variant]);
}

/**
 * 输入框容器样式工具函数
 */
export function inputContainerStyles() {
  return "space-y-1.5";
}

/**
 * 标签样式工具函数
 */
export function labelStyles() {
  return "text-sm font-medium text-foreground";
}

/**
 * 筛选器面板样式工具函数
 */
export function filterPanelStyles() {
  return cn(cardStyles("default"), "p-4 mb-4 space-y-4");
}

/**
 * 工具栏样式工具函数
 */
export function toolbarStyles() {
  return "flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg mb-4";
}

/**
 * 空状态样式工具函数
 */
export function emptyStateStyles() {
  return "flex flex-col items-center justify-center py-12 px-4 text-center bg-muted/20 rounded-lg border border-dashed border-border";
}

/**
 * 加载状态样式工具函数
 */
export function loadingStyles() {
  return "flex items-center justify-center py-8";
}

/**
 * 图片占位符样式工具函数
 */
export function imagePlaceholderStyles(size: "sm" | "md" | "lg" = "md") {
  const baseStyles =
    "bg-muted flex items-center justify-center rounded overflow-hidden border border-border";

  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  return cn(baseStyles, sizes[size]);
}

/**
 * 展开/收起按钮样式工具函数
 */
export function expandButtonStyles() {
  return "flex items-center justify-center w-7 h-7 rounded hover:bg-muted transition-colors duration-200";
}

/**
 * 价格显示样式工具函数
 */
export function priceStyles(
  variant: "current" | "original" | "discount" = "current",
) {
  const variants = {
    current: "font-medium text-foreground",
    original: "text-sm text-muted-foreground line-through",
    discount:
      "text-xs px-1.5 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded",
  };

  return variants[variant];
}

/**
 * 库存状态指示器样式工具函数
 */
export function stockIndicatorStyles(
  status: "in-stock" | "low-stock" | "out-of-stock",
) {
  const variants = {
    "in-stock": "w-2 h-2 rounded-full bg-green-500",
    "low-stock": "w-2 h-2 rounded-full bg-yellow-500",
    "out-of-stock": "w-2 h-2 rounded-full bg-red-500",
  };

  return variants[status];
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * 生成随机ID
 */
export function generateId(length = 8): string {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
}
