# TrendHub 组件设计规范

## 📋 概述

本文档定义了 TrendHub 前端组件的设计规范和开发标准，确保代码质量、用户体验和团队协作的一致性。

---

## 🎨 设计原则

### 1. StyleDeals 风格一致性

- 遵循 StyleDeals 的设计语言和视觉规范
- 保持颜色、间距、字体大小的一致性
- 优先考虑用户体验和可访问性

### 2. 响应式优先

- 移动端优先设计 (Mobile First)
- 确保在所有设备上的良好体验
- 使用 Tailwind CSS 响应式断点

### 3. 性能优化

- 组件懒加载和代码分割
- 图片优化和懒加载
- 减少不必要的重渲染

---

## 🎯 StyleDeals 设计规范

### 颜色方案

```css
/* 主要颜色 */
--primary-text: #333333; /* 主要文字颜色 */
--secondary-text: #666666; /* 次要文字颜色 */
--tertiary-text: #999999; /* 第三级文字颜色 */

/* 背景颜色 */
--background-white: #ffffff; /* 主背景 */
--background-gray: #fafafa; /* 页面背景 */
--background-light: #f8f9fa; /* 浅灰背景 */

/* 边框颜色 */
--border-light: #e5e5e5; /* 浅色边框 */
--border-gray: #ddd; /* 标准边框 */

/* 强调颜色 */
--accent-red: #ff4444; /* 折扣标签、错误 */
--accent-green: #22c55e; /* 成功状态 */
--accent-blue: #3b82f6; /* 链接、按钮 */
```

### 字体规范

```css
/* 字体大小 */
--text-xs: 0.75rem; /* 12px - 标签、辅助信息 */
--text-sm: 0.875rem; /* 14px - 正文、描述 */
--text-base: 1rem; /* 16px - 标准文字 */
--text-lg: 1.125rem; /* 18px - 小标题 */
--text-xl: 1.25rem; /* 20px - 标题 */
--text-2xl: 1.5rem; /* 24px - 大标题 */

/* 字体粗细 */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 间距规范

```css
/* 标准间距 (基于 4px 网格) */
--spacing-1: 0.25rem; /* 4px */
--spacing-2: 0.5rem; /* 8px */
--spacing-3: 0.75rem; /* 12px */
--spacing-4: 1rem; /* 16px */
--spacing-5: 1.25rem; /* 20px */
--spacing-6: 1.5rem; /* 24px */
--spacing-8: 2rem; /* 32px */
--spacing-12: 3rem; /* 48px */
```

### 圆角规范

```css
--radius-sm: 4px; /* 小圆角 - 标签、按钮 */
--radius-md: 6px; /* 中圆角 - 输入框 */
--radius-lg: 8px; /* 大圆角 - 卡片 */
--radius-xl: 12px; /* 超大圆角 - 特殊元素 */
```

---

## 🧩 组件架构规范

### 1. 文件命名约定

```
components/
├── common/              # 通用组件
│   ├── button.tsx
│   ├── modal.tsx
│   └── loading.tsx
├── deals/               # 优惠相关组件
│   ├── live-deals.tsx
│   ├── deal-card.tsx
│   └── coupon-modal.tsx
├── products/            # 产品相关组件
│   ├── product-grid.tsx
│   ├── product-card.tsx
│   └── product-modal.tsx
└── brands/              # 品牌相关组件
    ├── featured-brands.tsx
    └── brand-card.tsx
```

### 2. 组件结构模板

```typescript
'use client';

import { Button, Card } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useCallback } from 'react';
import * as React from 'react';

// Types
interface ComponentProps {
  className?: string;
  // 其他 props
}

interface ComponentData {
  // 数据类型定义
}

// Main Component
export const ComponentName: React.FC<ComponentProps> = ({
  className = '',
  ...otherProps
}) => {
  // Hooks
  const t = useTranslations('componentName');
  const [data, setData] = useState<ComponentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Event Handlers
  const handleAction = useCallback(async () => {
    // 处理逻辑
  }, []);

  // Effects
  useEffect(() => {
    // 初始化逻辑
  }, []);

  // Loading State
  if (isLoading) {
    return <ComponentSkeleton />;
  }

  // Error State
  if (error) {
    return <ErrorMessage error={error} />;
  }

  // Main Render
  return (
    <section className={`component-wrapper ${className}`}>
      {/* 组件内容 */}
    </section>
  );
};

// Loading Skeleton Component
const ComponentSkeleton: React.FC = () => (
  <div className="animate-pulse">
    {/* 骨架屏内容 */}
  </div>
);

// Error Component
const ErrorMessage: React.FC<{ error: string }> = ({ error }) => (
  <div className="text-center py-8">
    <p className="text-red-500">{error}</p>
  </div>
);
```

### 3. Props 接口设计

```typescript
// 基础 Props 接口
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  'data-testid'?: string;
}

// 扩展接口示例
interface DealCardProps extends BaseComponentProps {
  deal: Deal;
  onDealClick?: (deal: Deal) => void;
  showDiscount?: boolean;
  variant?: 'compact' | 'full';
}
```

---

## 📱 响应式设计规范

### 断点定义

```typescript
// Tailwind CSS 断点
const breakpoints = {
  sm: '640px', // 小型设备 (手机横屏)
  md: '768px', // 平板设备
  lg: '1024px', // 笔记本电脑
  xl: '1280px', // 桌面显示器
  '2xl': '1536px', // 大型显示器
};
```

### 网格布局规范

```css
/* 产品网格 - StyleDeals 标准 */
.products-grid {
  display: grid;
  gap: 1.25rem; /* 20px */
}

/* 响应式列数 */
@media (min-width: 640px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .products-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### 移动端优先设计

```typescript
// 组件设计示例
const ProductCard = () => (
  <Card className="
    w-full
    p-3 sm:p-4
    text-sm sm:text-base
    rounded-lg
    hover:shadow-lg
    transition-all duration-200
  ">
    <Image className="
      aspect-square
      w-full
      object-cover
      rounded-md
    " />

    <div className="mt-3 sm:mt-4">
      <h3 className="
        text-sm sm:text-base
        font-medium
        line-clamp-2
        mb-1 sm:mb-2
      ">
        Product Name
      </h3>
    </div>
  </Card>
);
```

---

## 🎪 交互设计规范

### 悬停效果

```css
/* 卡片悬停效果 - StyleDeals 标准 */
.card-hover {
  transition: all 0.2s ease;
  cursor: pointer;
}

.card-hover:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

/* 图片缩放效果 */
.image-hover {
  transition: transform 0.3s ease;
}

.card-hover:hover .image-hover {
  transform: scale(1.05);
}
```

### 按钮状态

```typescript
// 按钮变体定义
const buttonVariants = {
  primary: 'bg-gray-900 hover:bg-gray-800 text-white',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  ghost: 'hover:bg-gray-100 text-gray-700',
};

// 按钮尺寸
const buttonSizes = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};
```

### 加载状态

```typescript
// 骨架屏设计
const ProductCardSkeleton = () => (
  <Card className="p-4">
    <div className="aspect-square bg-gray-200 rounded-md animate-pulse mb-3" />
    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-2" />
    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
  </Card>
);
```

---

## 🔧 性能优化规范

### 1. 组件懒加载

```typescript
import { lazy, Suspense } from 'react';

// 懒加载重型组件
const ProductModal = lazy(() => import('./product-modal'));

// 使用 Suspense 包装
const ComponentWithModal = () => (
  <Suspense fallback={<ModalSkeleton />}>
    <ProductModal />
  </Suspense>
);
```

### 2. 图片优化

```typescript
import Image from 'next/image';

// 使用 Next.js Image 组件
const OptimizedImage = ({ src, alt, priority = false }) => (
  <Image
    src={src}
    alt={alt}
    width={280}
    height={280}
    className="object-cover"
    priority={priority} // 首屏图片设置 priority
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,..." // 低质量占位符
  />
);
```

### 3. 数据获取优化

```typescript
import { useQuery } from '@tanstack/react-query';

// 使用 React Query 进行数据缓存
const useDeals = (filters: DealsFilters) => {
  return useQuery({
    queryKey: ['deals', filters],
    queryFn: () => fetchDeals(filters),
    staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
    cacheTime: 10 * 60 * 1000, // 10分钟缓存时间
    refetchOnWindowFocus: false, // 窗口聚焦时不重新获取
  });
};
```

---

## 🧪 测试规范

### 1. 组件测试

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { DealCard } from '../deal-card';

describe('DealCard', () => {
  const mockDeal = {
    id: '1',
    title: 'Test Deal',
    merchant: { name: 'Test Store' },
    discount: 25,
  };

  test('should render deal information correctly', () => {
    render(<DealCard deal={mockDeal} />);

    expect(screen.getByText('Test Deal')).toBeInTheDocument();
    expect(screen.getByText('Test Store')).toBeInTheDocument();
    expect(screen.getByText('-25%')).toBeInTheDocument();
  });

  test('should handle click events', () => {
    const onDealClick = jest.fn();
    render(<DealCard deal={mockDeal} onDealClick={onDealClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onDealClick).toHaveBeenCalledWith(mockDeal);
  });
});
```

### 2. 可访问性测试

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<DealCard deal={mockDeal} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## 📊 国际化规范

### 1. 翻译键命名约定

```json
{
  "componentName": {
    "title": "标题",
    "subtitle": "副标题",
    "actions": {
      "save": "保存",
      "cancel": "取消"
    },
    "errors": {
      "loadFailed": "加载失败",
      "unknown": "未知错误"
    },
    "labels": {
      "required": "必填项",
      "optional": "可选"
    }
  }
}
```

### 2. 国际化组件使用

```typescript
import { useTranslations } from 'next-intl';

const MyComponent = () => {
  const t = useTranslations('componentName');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>

      {/* 带参数的翻译 */}
      <p>{t('greeting', { name: 'John' })}</p>

      {/* 复数形式 */}
      <p>{t('itemCount', { count: items.length })}</p>
    </div>
  );
};
```

---

## 🚀 部署和版本管理

### 1. 组件版本控制

```typescript
// 在组件文件中标记版本
/**
 * DealCard Component
 *
 * @version 1.2.0
 * @since 1.0.0
 * @author TrendHub Team
 * @description StyleDeals 风格的优惠卡片组件
 *
 * @changelog
 * - 1.2.0: 添加新的悬停效果
 * - 1.1.0: 支持多种尺寸变体
 * - 1.0.0: 初始版本
 */
export const DealCard = () => {
  // 组件实现
};
```

### 2. 组件导出规范

```typescript
// components/index.ts - 统一导出入口
export { DealCard } from './deals/deal-card';
export { ProductGrid } from './products/product-grid';
export { FeaturedBrands } from './brands/featured-brands';

// 类型导出
export type { DealCardProps } from './deals/deal-card';
export type { ProductGridProps } from './products/product-grid';
```

---

## 📚 文档规范

### 1. 组件文档模板

````typescript
/**
 * # DealCard 组件
 *
 * 用于显示优惠信息的卡片组件，遵循 StyleDeals 设计规范。
 *
 * ## 功能特性
 * - 显示优惠标题、描述和折扣信息
 * - 支持优惠券代码预览和复制
 * - 响应式设计，支持多种尺寸
 * - 集成点击追踪和分析
 *
 * ## 使用示例
 * ```tsx
 * <DealCard
 *   deal={dealData}
 *   onDealClick={handleDealClick}
 *   variant="compact"
 * />
 * ```
 *
 * ## Props
 * @param deal - 优惠数据对象
 * @param onDealClick - 点击回调函数
 * @param variant - 显示变体 ('compact' | 'full')
 * @param className - 自定义样式类名
 */
````

### 2. Storybook 集成

```typescript
// deal-card.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { DealCard } from './deal-card';

const meta: Meta<typeof DealCard> = {
  title: 'Components/Deals/DealCard',
  component: DealCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    deal: {
      id: '1',
      title: 'Summer Sale',
      merchant: { name: 'Fashion Store' },
      discount: 25,
    },
  },
};

export const WithCouponCode: Story = {
  args: {
    deal: {
      id: '2',
      title: 'Flash Sale',
      code: 'FLASH25',
      discount: 25,
    },
  },
};
```

---

## 🔍 代码质量规范

### 1. ESLint 配置

```json
{
  "extends": ["next/core-web-vitals", "@typescript-eslint/recommended"],
  "rules": {
    "react-hooks/exhaustive-deps": "error",
    "no-unused-vars": "error",
    "prefer-const": "error",
    "no-console": "warn"
  }
}
```

### 2. TypeScript 严格模式

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

## 🎯 最佳实践总结

### ✅ 推荐做法

1. **遵循 StyleDeals 设计规范**
2. **使用 TypeScript 进行类型安全**
3. **实现响应式设计**
4. **添加适当的加载和错误状态**
5. **使用语义化的 HTML 元素**
6. **编写单元测试和集成测试**
7. **添加国际化支持**
8. **优化性能和可访问性**

### ❌ 避免做法

1. **不要硬编码文本内容**
2. **避免内联样式**
3. **不要忽略错误处理**
4. **避免过深的组件嵌套**
5. **不要在 useEffect 中进行不必要的依赖**
6. **避免重复的样式代码**

---

**文档版本**: 1.0  
**最后更新**: 2024年12月26日  
**维护者**: TrendHub Frontend Team
