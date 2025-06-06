import React from "react";

import { cn } from "@/lib/utils";

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "ghost";
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  children: React.ReactNode;
}

interface EnhancedCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface EnhancedCardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface EnhancedCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const cardVariants = {
  default: [
    "bg-card",
    "border-border",
    "shadow-elevation-2",
    "dark:shadow-dark-card",
  ],
  elevated: [
    "bg-card",
    "border-border",
    "shadow-elevation-4",
    "dark:shadow-dark-card-hover",
  ],
  outlined: ["bg-transparent", "border-2", "border-border", "shadow-none"],
  ghost: ["bg-transparent", "border-0", "shadow-none"],
};

const sizeVariants = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      interactive = false,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          // 基础样式
          "rounded-lg border transition-all duration-300 ease-fluid",

          // 变体样式
          cardVariants[variant],

          // 尺寸样式
          sizeVariants[size],

          // 交互样式
          interactive && [
            "cursor-pointer",
            "hover:bg-surface-hover",
            "hover:shadow-elevation-3",
            "hover:-translate-y-1",
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-ring",
            "focus-visible:ring-offset-2",
            "active:translate-y-0",
            "active:shadow-elevation-2",
            "dark:hover:shadow-dark-card-hover",
          ],

          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

const EnhancedCardHeader = React.forwardRef<
  HTMLDivElement,
  EnhancedCardHeaderProps
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 pb-4", className)}
      {...props}
    >
      {children}
    </div>
  );
});

const EnhancedCardBody = React.forwardRef<
  HTMLDivElement,
  EnhancedCardBodyProps
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("text-foreground", className)} {...props}>
      {children}
    </div>
  );
});

const EnhancedCardFooter = React.forwardRef<
  HTMLDivElement,
  EnhancedCardFooterProps
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center pt-4 border-t border-border", className)}
      {...props}
    >
      {children}
    </div>
  );
});

EnhancedCard.displayName = "EnhancedCard";
EnhancedCardHeader.displayName = "EnhancedCardHeader";
EnhancedCardBody.displayName = "EnhancedCardBody";
EnhancedCardFooter.displayName = "EnhancedCardFooter";

export {
  EnhancedCard,
  EnhancedCardHeader,
  EnhancedCardBody,
  EnhancedCardFooter,
};

// 使用示例组件
export function CardShowcase() {
  return (
    <div className="grid gap-6 p-6 bg-background-secondary min-h-screen">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">增强的卡片组件</h2>
        <p className="text-foreground-secondary">
          展示不同变体和主题支持的卡片组件
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 默认卡片 */}
        <EnhancedCard>
          <EnhancedCardHeader>
            <h3 className="text-lg font-semibold text-foreground">默认卡片</h3>
            <p className="text-sm text-foreground-secondary">
              基础样式的卡片组件
            </p>
          </EnhancedCardHeader>
          <EnhancedCardBody>
            <p className="text-foreground-secondary">
              这是一个使用默认样式的卡片，具有标准的阴影和边框。
            </p>
          </EnhancedCardBody>
        </EnhancedCard>

        {/* 高架卡片 */}
        <EnhancedCard variant="elevated">
          <EnhancedCardHeader>
            <h3 className="text-lg font-semibold text-foreground">高架卡片</h3>
            <p className="text-sm text-foreground-secondary">
              具有更强阴影效果
            </p>
          </EnhancedCardHeader>
          <EnhancedCardBody>
            <p className="text-foreground-secondary">
              这个卡片使用了更强的阴影效果，看起来像是悬浮在页面上。
            </p>
          </EnhancedCardBody>
        </EnhancedCard>

        {/* 交互式卡片 */}
        <EnhancedCard interactive>
          <EnhancedCardHeader>
            <h3 className="text-lg font-semibold text-foreground">
              交互式卡片
            </h3>
            <p className="text-sm text-foreground-secondary">
              支持悬停和点击效果
            </p>
          </EnhancedCardHeader>
          <EnhancedCardBody>
            <p className="text-foreground-secondary">
              悬停时会有平滑的动画效果，包括阴影变化和轻微的位移。
            </p>
          </EnhancedCardBody>
          <EnhancedCardFooter>
            <div className="flex justify-between w-full">
              <span className="text-sm text-foreground-tertiary">
                点击查看更多
              </span>
              <span className="text-sm text-primary">→</span>
            </div>
          </EnhancedCardFooter>
        </EnhancedCard>

        {/* 描边卡片 */}
        <EnhancedCard variant="outlined" size="lg">
          <EnhancedCardHeader>
            <h3 className="text-lg font-semibold text-foreground">描边卡片</h3>
            <p className="text-sm text-foreground-secondary">
              仅有边框的简洁样式
            </p>
          </EnhancedCardHeader>
          <EnhancedCardBody>
            <p className="text-foreground-secondary">
              这种样式适合需要简洁外观的场景，没有背景色和阴影。
            </p>
          </EnhancedCardBody>
        </EnhancedCard>

        {/* 幽灵卡片 */}
        <EnhancedCard variant="ghost" interactive>
          <EnhancedCardHeader>
            <h3 className="text-lg font-semibold text-foreground">幽灵卡片</h3>
            <p className="text-sm text-foreground-secondary">
              透明背景的极简样式
            </p>
          </EnhancedCardHeader>
          <EnhancedCardBody>
            <p className="text-foreground-secondary">
              完全透明的背景，适合内容驱动的设计。
            </p>
          </EnhancedCardBody>
        </EnhancedCard>

        {/* 小尺寸卡片 */}
        <EnhancedCard size="sm" interactive>
          <EnhancedCardHeader>
            <h3 className="text-base font-semibold text-foreground">小卡片</h3>
          </EnhancedCardHeader>
          <EnhancedCardBody>
            <p className="text-sm text-foreground-secondary">
              紧凑的布局适合展示简要信息。
            </p>
          </EnhancedCardBody>
        </EnhancedCard>
      </div>
    </div>
  );
}
