# TrendHub 组件使用指南与最佳实践

## 目录

- [概述](#概述)
- [组件分类](#组件分类)
- [组件设计原则](#组件设计原则)
- [常用组件使用指南](#常用组件使用指南)
- [Props设计规范](#props设计规范)
- [状态管理最佳实践](#状态管理最佳实践)
- [样式和主题](#样式和主题)
- [国际化处理](#国际化处理)
- [性能优化](#性能优化)
- [可访问性指南](#可访问性指南)
- [测试策略](#测试策略)
- [开发规范](#开发规范)

## 概述

TrendHub 使用基于 **React 19** 和 **Next.js 15** 的现代化组件架构，结合 **HeroUI** 组件库和 **Tailwind CSS** 构建可复用、可维护的 UI 组件系统。

### 核心理念

- **组件化**: 每个 UI 元素都应该是独立、可复用的组件
- **类型安全**: 使用 TypeScript 确保类型安全和开发体验
- **响应式设计**: 所有组件支持多设备适配
- **可访问性**: 遵循 WCAG 2.1 标准
- **性能优先**: 优化渲染性能和用户体验

## 组件分类

### 1. 页面组件 (Page Components)

**位置**: `app/[locale]/*/page.tsx`
**特点**: 服务端组件，负责页面级别的数据获取和布局

```typescript
// app/[locale]/brands/page.tsx
interface BrandsPageProps {
  params: { locale: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function BrandsPage({ params, searchParams }: BrandsPageProps) {
  const { locale } = params;

  // 服务端数据获取
  const brandsData = await getBrandsData(searchParams);

  return (
    <div className="container mx-auto px-4 py-8">
      <BrandsClient
        locale={locale}
        initialData={brandsData}
        searchParams={searchParams}
      />
    </div>
  );
}
```

**使用规范**:

- 仅用于数据获取和页面结构
- 不包含客户端交互逻辑
- 必须支持 `locale` 参数
- 使用 `generateMetadata` 设置页面元数据

### 2. 布局组件 (Layout Components)

**位置**: `app/*/layout.tsx`
**特点**: 定义页面结构和全局状态

```typescript
// app/[locale]/layout.tsx
interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const messages = await getMessages();
  const settings = await getSettings();

  return (
    <html lang={params.locale}>
      <body>
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          <SettingsProvider initialSettings={settings}>
            <Providers>
              <MainNavbar />
              <main className="min-h-screen">{children}</main>
              <Footer />
            </Providers>
          </SettingsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 3. 业务组件 (Business Components)

**位置**: `components/`
**特点**: 包含业务逻辑的客户端组件

#### 产品相关组件

**ProductCard** - 产品卡片组件

```typescript
interface ProductCardProps {
  product: ProductBasic;
  locale: string;
  className?: string;
  onClick?: (product: ProductBasic) => void;
}

export function ProductCard({ product, locale, className, onClick }: ProductCardProps) {
  const t = useTranslations('products');
  const [isFavorite, setIsFavorite] = useState(false);
  const { openProductModal } = useProductModal();

  // 组件逻辑
}
```

**使用示例**:

```tsx
<ProductCard
  product={productData}
  locale="zh"
  className="hover:shadow-lg"
  onClick={handleProductClick}
/>
```

**ProductGridRefined** - 产品网格组件

```typescript
interface ProductGridRefinedProps {
  gender: 'women' | 'men';
  initialProducts?: ProductBasic[];
  className?: string;
}

export const ProductGridRefined: React.FC<ProductGridRefinedProps> = ({
  gender,
  initialProducts = [],
  className,
}) => {
  // 状态管理
  const [products, setProducts] = useState(initialProducts);
  const [activeStore, setActiveStore] = useState<StoreFilter>('all');
  const [isLoading, setIsLoading] = useState(false);

  // API 调用和数据处理
  // 筛选逻辑
  // UI 渲染
};
```

#### 导航组件

**MainNavbar** - 主导航栏

```typescript
export const MainNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'women' | 'men'>('women');
  const [dynamicNavItems, setDynamicNavItems] = useState<MenuItem[]>([]);

  // 动态获取导航数据
  // 响应式菜单处理
  // 搜索功能
};
```

### 4. UI 组件 (UI Components)

**位置**: `components/ui/`
**特点**: 纯 UI 组件，无业务逻辑

#### ThemeSwitch - 主题切换器

```typescript
interface ThemeSwitchProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className, size = 'sm' }) => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 主题切换逻辑
};
```

#### LanguageSwitch - 语言切换器

```typescript
interface LanguageSwitchProps {
  isSearchOpen?: boolean;
  placement?: 'top' | 'bottom';
}

export const LanguageSwitch: React.FC<LanguageSwitchProps> = ({
  isSearchOpen = false,
  placement = 'bottom',
}) => {
  const locale = useLocale();
  const router = useRouter();

  // 语言切换逻辑
};
```

## 组件设计原则

### 1. 单一职责原则

每个组件只负责一个功能：

```typescript
// ❌ 违反单一职责
const ProductPageComponent = () => {
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  // 产品数据获取
  // 用户认证
  // 购物车管理
  // SEO 设置
  // UI 渲染

  return <div>{/* 复杂的 UI */}</div>;
};

// ✅ 符合单一职责
const ProductList = ({ products, onProductClick }) => {
  // 只负责产品列表渲染
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onClick={onProductClick}
        />
      ))}
    </div>
  );
};
```

### 2. 组件组合原则

通过组合构建复杂功能：

```typescript
// 产品页面组合
export default function ProductPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <ProductBreadcrumbs productId={params.id} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProductImages productId={params.id} />
        <ProductInfo productId={params.id} />
      </div>
      <ProductDetails productId={params.id} />
      <RelatedProducts productId={params.id} />
    </div>
  );
}
```

### 3. Props 接口设计

明确的 Props 接口和类型定义：

```typescript
// 基础 Props 接口
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

// 扩展接口
interface ProductCardProps extends BaseComponentProps {
  product: ProductBasic;
  locale: string;
  variant?: 'default' | 'compact' | 'featured';
  showFavorite?: boolean;
  onClick?: (product: ProductBasic) => void;
  onFavoriteToggle?: (productId: string, isFavorite: boolean) => void;
}
```

### 4. 状态管理分层

```typescript
// 局部状态 - useState
const [isLoading, setIsLoading] = useState(false);

// 共享状态 - Context
const { settings } = useSettings();
const { openProductModal } = useProductModal();

// 缓存状态 - React Query (如果使用)
const { data: products, isLoading } = useQuery({
  queryKey: ['products', gender],
  queryFn: () => fetchProducts(gender),
});
```

## 常用组件使用指南

### ProductCard 组件

**基本用法**:

```tsx
import { ProductCard } from '@/components/product-card';

<ProductCard product={productData} locale="zh" />;
```

**高级用法**:

```tsx
<ProductCard
  product={productData}
  locale="zh"
  className="custom-shadow"
  showFavorite={true}
  onClick={handleProductClick}
  onFavoriteToggle={handleFavoriteToggle}
/>
```

**Props 详解**:

- `product`: 必需，产品基本信息
- `locale`: 必需，当前语言环境
- `className`: 可选，自定义样式类
- `showFavorite`: 可选，是否显示收藏按钮
- `onClick`: 可选，点击回调函数
- `onFavoriteToggle`: 可选，收藏状态切换回调

### MainNavbar 组件

**基本用法**:

```tsx
import { MainNavbar } from '@/components/navbar';

// 在布局中使用
<MainNavbar />;
```

**自定义配置**:

```tsx
// 通过 Context 或 Props 传递配置
<NavigationProvider
  config={{
    showSearch: true,
    showCart: true,
    maxMobileMenuHeight: '80vh',
  }}
>
  <MainNavbar />
</NavigationProvider>
```

### ThemeSwitch 组件

**基本用法**:

```tsx
import { ThemeSwitch } from '@/components/theme-switch';

<ThemeSwitch />;
```

**自定义样式**:

```tsx
<ThemeSwitch className="ml-4" size="md" />
```

### Toast 系统

**使用方法**:

```tsx
import { toast } from '@/components/ui/toast';

// 成功提示
toast.success('操作成功！');

// 错误提示
toast.error('操作失败，请重试');

// 警告提示
toast.warning('请注意相关风险');

// 信息提示
toast.info('这是一条信息');

// 自定义 toast
toast({
  title: '自定义标题',
  description: '自定义描述信息',
  variant: 'success',
  duration: 5000,
});
```

## Props 设计规范

### 1. 命名约定

```typescript
interface ComponentProps {
  // 基础属性
  children?: React.ReactNode;
  className?: string;
  'data-testid'?: string;

  // 功能属性 - 使用描述性名称
  isLoading?: boolean; // ✅ 布尔值使用 is/has/can 前缀
  showHeader?: boolean; // ✅ 布尔值使用 show/hide 前缀
  variant?: 'primary' | 'secondary'; // ✅ 枚举类型

  // 回调函数 - 使用 on 前缀
  onClick?: (event: MouseEvent) => void;
  onValueChange?: (value: string) => void;
  onError?: (error: Error) => void;

  // 数据属性 - 使用描述性名称
  user?: User;
  products?: Product[];
  initialData?: any;
}
```

### 2. 可选属性和默认值

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

// 使用默认参数
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  ...rest
}) => {
  // 组件实现
};
```

### 3. 复杂对象类型

```typescript
// 定义复杂类型
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface ProductFilter {
  category?: string;
  brand?: string;
  priceRange?: [number, number];
  inStock?: boolean;
}

interface ProductListProps {
  user?: User;
  filters?: ProductFilter;
  onFilterChange?: (filters: ProductFilter) => void;
}
```

## 状态管理最佳实践

### 1. 状态提升原则

```typescript
// ❌ 状态分散在各个组件中
const ProductCard = () => {
  const [isFavorite, setIsFavorite] = useState(false);
  // ...
};

const ProductList = () => {
  const [favorites, setFavorites] = useState([]);
  // ...
};

// ✅ 状态提升到共同父组件
const ProductsPage = () => {
  const [favorites, setFavorites] = useState<string[]>([]);

  const handleFavoriteToggle = (productId: string) => {
    setFavorites(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <ProductList
      favorites={favorites}
      onFavoriteToggle={handleFavoriteToggle}
    />
  );
};
```

### 2. Context 使用模式

```typescript
// Context 定义
interface ProductModalContextType {
  isOpen: boolean;
  selectedProduct: ProductDetail | null;
  openModal: (product: ProductDetail) => void;
  closeModal: () => void;
}

// Provider 组件
export function ProductModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);

  const openModal = useCallback((product: ProductDetail) => {
    setSelectedProduct(product);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setSelectedProduct(null);
  }, []);

  const value = useMemo(() => ({
    isOpen,
    selectedProduct,
    openModal,
    closeModal
  }), [isOpen, selectedProduct, openModal, closeModal]);

  return (
    <ProductModalContext.Provider value={value}>
      {children}
      {isOpen && selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={closeModal}
        />
      )}
    </ProductModalContext.Provider>
  );
}

// Hook 使用
export const useProductModal = () => {
  const context = useContext(ProductModalContext);
  if (!context) {
    throw new Error('useProductModal must be used within ProductModalProvider');
  }
  return context;
};
```

### 3. 自定义 Hooks

```typescript
// 数据获取 Hook
export const useProducts = (filters: ProductFilter) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await productService.getProducts(filters);
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  return { products, isLoading, error };
};

// 本地存储 Hook
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
};
```

## 样式和主题

### 1. Tailwind CSS 使用规范

```typescript
// 使用 cn 工具函数组合样式
import { cn } from '@/lib/utils';

const Button = ({ variant, size, className, ...props }) => {
  return (
    <button
      className={cn(
        // 基础样式
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        // 变体样式
        {
          'bg-primary-500 text-white hover:bg-primary-600': variant === 'primary',
          'bg-secondary-500 text-white hover:bg-secondary-600': variant === 'secondary',
          'border border-input bg-background hover:bg-accent': variant === 'outline',
        },
        // 尺寸样式
        {
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4 text-base': size === 'md',
          'h-12 px-6 text-lg': size === 'lg',
        },
        // 自定义样式
        className
      )}
      {...props}
    />
  );
};
```

### 2. 主题变量使用

```typescript
// 使用CSS变量进行主题适配
const ThemeAwareComponent = () => {
  return (
    <div className="bg-bg-primary-light dark:bg-bg-primary-dark text-text-primary-light dark:text-text-primary-dark">
      <h1 className="text-2xl font-bold mb-4">标题</h1>
      <p className="text-text-secondary-light dark:text-text-secondary-dark">
        描述文本
      </p>
    </div>
  );
};
```

### 3. 响应式设计

```typescript
const ResponsiveGrid = ({ children }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
};

// 响应式字体大小
const ResponsiveText = ({ children }) => {
  return (
    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
      {children}
    </h1>
  );
};
```

### 4. 动画和过渡

```typescript
const AnimatedCard = ({ children, isVisible }) => {
  return (
    <div
      className={cn(
        'transform transition-all duration-300 ease-in-out',
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0'
      )}
    >
      {children}
    </div>
  );
};

// 悬停效果
const HoverCard = ({ children }) => {
  return (
    <div className="group cursor-pointer transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
      {children}
    </div>
  );
};
```

## 国际化处理

### 1. 翻译文本使用

```typescript
import { useTranslations } from 'next-intl';

const ProductCard = ({ product }) => {
  const t = useTranslations('products');

  return (
    <div>
      <h3>{product.name}</h3>
      <p>{t('price')}: ¥{product.price}</p>
      <button>{t('addToCart')}</button>
      {product.isNew && (
        <span className="badge">{t('labels.new')}</span>
      )}
    </div>
  );
};
```

### 2. 翻译文件结构

```json
// messages/zh.json
{
  "products": {
    "price": "价格",
    "addToCart": "添加到购物车",
    "labels": {
      "new": "新品",
      "sale": "特价",
      "outOfStock": "缺货"
    },
    "errors": {
      "loadFailed": "加载商品失败"
    }
  }
}

// messages/en.json
{
  "products": {
    "price": "Price",
    "addToCart": "Add to Cart",
    "labels": {
      "new": "New",
      "sale": "Sale",
      "outOfStock": "Out of Stock"
    },
    "errors": {
      "loadFailed": "Failed to load products"
    }
  }
}
```

### 3. 动态路由和链接

```typescript
import { Link } from '@heroui/react';
import { useLocale } from 'next-intl';

const ProductLink = ({ product }) => {
  const locale = useLocale();

  return (
    <Link href={`/${locale}/product/${product.id}`}>
      {product.name}
    </Link>
  );
};
```

## 性能优化

### 1. 组件懒加载

```typescript
import { lazy, Suspense } from 'react';

// 懒加载组件
const ProductModal = lazy(() => import('./product-modal'));
const ProductDetail = lazy(() => import('./product-detail'));

// 使用 Suspense 包装
const ProductPage = () => {
  return (
    <div>
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetail productId="123" />
      </Suspense>

      <Suspense fallback={<div>Loading modal...</div>}>
        <ProductModal />
      </Suspense>
    </div>
  );
};
```

### 2. 内存优化

```typescript
// 使用 useCallback 优化函数引用
const ProductList = ({ products, onProductClick }) => {
  const handleProductClick = useCallback((product) => {
    onProductClick?.(product);
  }, [onProductClick]);

  return (
    <div>
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onClick={handleProductClick}
        />
      ))}
    </div>
  );
};

// 使用 useMemo 优化计算
const ProductGrid = ({ products, filters }) => {
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (filters.category && product.category !== filters.category) return false;
      if (filters.brand && product.brand !== filters.brand) return false;
      return true;
    });
  }, [products, filters]);

  return (
    <div className="grid">
      {filteredProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
```

### 3. 图片优化

```typescript
import Image from 'next/image';

const ProductImage = ({ product, priority = false }) => {
  return (
    <div className="relative aspect-square">
      <Image
        src={product.image}
        alt={product.name}
        fill
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/..."
      />
    </div>
  );
};
```

### 4. 虚拟滚动（大数据量）

```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualProductList = ({ products }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ProductCard product={products[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={products.length}
      itemSize={200}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

## 可访问性指南

### 1. 语义化 HTML

```typescript
const ProductCard = ({ product }) => {
  return (
    <article
      className="product-card"
      role="button"
      tabIndex={0}
      aria-label={`查看产品: ${product.name}`}
    >
      <header>
        <h3>{product.name}</h3>
      </header>

      <section aria-label="产品图片">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
        />
      </section>

      <footer>
        <span aria-label="价格">¥{product.price}</span>
        <button
          aria-label="添加到购物车"
          onClick={handleAddToCart}
        >
          添加到购物车
        </button>
      </footer>
    </article>
  );
};
```

### 2. 键盘导航

```typescript
const NavigationItem = ({ item, children }) => {
  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleClick();
        break;
      case 'Escape':
        handleClose();
        break;
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      aria-expanded={isExpanded}
      aria-haspopup={hasSubmenu}
    >
      {children}
    </div>
  );
};
```

### 3. ARIA 属性

```typescript
const SearchBox = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div role="search">
      <label htmlFor="search-input" className="sr-only">
        搜索产品
      </label>
      <input
        id="search-input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-describedby="search-help"
        aria-expanded={results.length > 0}
        aria-autocomplete="list"
        aria-busy={isLoading}
      />
      <div id="search-help" className="sr-only">
        输入关键词搜索产品
      </div>

      {results.length > 0 && (
        <ul
          role="listbox"
          aria-label="搜索结果"
          className="search-results"
        >
          {results.map((result, index) => (
            <li
              key={result.id}
              role="option"
              aria-selected={index === selectedIndex}
            >
              {result.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

### 4. 焦点管理

```typescript
const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }

    // Trap focus within modal
    if (event.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      ref={modalRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <div className="modal-content">
        {children}
      </div>
    </div>
  );
};
```

## 测试策略

### 1. 单元测试

```typescript
// ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';

const mockProduct = {
  id: '1',
  name: 'Test Product',
  price: '99.99',
  image: '/test-image.jpg',
  brand: 'Test Brand'
};

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} locale="zh" />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('¥99.99')).toBeInTheDocument();
    expect(screen.getByAltText('Test Product')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(
      <ProductCard
        product={mockProduct}
        locale="zh"
        onClick={handleClick}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith(mockProduct);
  });

  it('toggles favorite state', () => {
    const handleFavoriteToggle = jest.fn();
    render(
      <ProductCard
        product={mockProduct}
        locale="zh"
        onFavoriteToggle={handleFavoriteToggle}
      />
    );

    const favoriteButton = screen.getByLabelText(/添加到收藏/);
    fireEvent.click(favoriteButton);

    expect(handleFavoriteToggle).toHaveBeenCalledWith('1', true);
  });
});
```

### 2. 集成测试

```typescript
// ProductPage.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { ProductPage } from './ProductPage';
import * as productService from '@/services/product.service';

jest.mock('@/services/product.service');

describe('ProductPage Integration', () => {
  it('loads and displays products', async () => {
    const mockProducts = [
      { id: '1', name: 'Product 1', price: '99.99' },
      { id: '2', name: 'Product 2', price: '149.99' }
    ];

    (productService.getProducts as jest.Mock).mockResolvedValue(mockProducts);

    render(<ProductPage gender="women" />);

    expect(screen.getByText('加载中...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
  });
});
```

### 3. E2E 测试

```typescript
// e2e/product-flow.spec.ts
import { test, expect } from '@playwright/test';

test('user can browse and view product details', async ({ page }) => {
  await page.goto('/zh/women');

  // 等待产品网格加载
  await page.waitForSelector('[data-testid="product-grid"]');

  // 点击第一个产品
  await page.click('[data-testid="product-card"]:first-child');

  // 验证模态框打开
  await expect(page.locator('[data-testid="product-modal"]')).toBeVisible();

  // 验证产品信息显示
  await expect(page.locator('[data-testid="product-title"]')).toBeVisible();
  await expect(page.locator('[data-testid="product-price"]')).toBeVisible();

  // 关闭模态框
  await page.click('[data-testid="modal-close"]');
  await expect(page.locator('[data-testid="product-modal"]')).not.toBeVisible();
});
```

### 4. 可访问性测试

```typescript
// accessibility.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ProductCard } from './ProductCard';

expect.extend(toHaveNoViolations);

describe('ProductCard Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(
      <ProductCard product={mockProduct} locale="zh" />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## 开发规范

### 1. 文件命名约定

```
components/
├── product-card.tsx          # kebab-case 用于文件名
├── ProductCard.tsx           # PascalCase 也可接受
├── product-detail/           # 复杂组件使用文件夹
│   ├── index.tsx
│   ├── product-images.tsx
│   ├── product-info.tsx
│   └── types.ts
└── ui/                       # UI 组件分组
    ├── button.tsx
    ├── input.tsx
    └── toast.tsx
```

### 2. 组件导出规范

```typescript
// 具名导出 - 推荐
export const ProductCard: React.FC<ProductCardProps> = ({ ... }) => {
  // ...
};

// 默认导出 - 用于页面组件
export default function ProductPage({ params }: ProductPageProps) {
  // ...
}

// 组合导出
export { ProductCard } from './product-card';
export { ProductGrid } from './product-grid';
export type { ProductCardProps } from './product-card';
```

### 3. TypeScript 规范

```typescript
// 严格类型定义
interface StrictProductProps {
  product: ProductBasic;               // 必需属性
  locale: 'zh' | 'en';                // 严格枚举
  className?: string;                  // 可选属性
  'data-testid'?: string;             // 测试属性
}

// 泛型组件
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export const List = <T,>({ items, renderItem, keyExtractor }: ListProps<T>) => {
  return (
    <div>
      {items.map(item => (
        <div key={keyExtractor(item)}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
};
```

### 4. 错误处理

```typescript
// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}

// 组件内错误处理
const ProductCard = ({ productId }) => {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await productService.getProduct(productId);
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) return <ProductCardSkeleton />;
  if (error) return <ErrorMessage message={error} />;
  if (!product) return <EmptyState message="Product not found" />;

  return <ProductCardContent product={product} />;
};
```

### 5. 性能监控

```typescript
// 性能测量组件
const PerformanceWrapper = ({ name, children }) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      console.log(`${name} render time: ${endTime - startTime}ms`);
    };
  });

  return children;
};

// 组件渲染计数
const useRenderCount = (componentName: string) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });

  return renderCount.current;
};
```

## 总结

这份组件使用指南涵盖了 TrendHub 前端应用中组件开发的各个方面。通过遵循这些最佳实践，可以确保：

- **一致性**: 所有组件遵循相同的设计模式和编码规范
- **可维护性**: 清晰的组件结构和类型定义便于维护
- **可重用性**: 组件设计支持在不同场景下复用
- **性能**: 优化的渲染和状态管理策略
- **可访问性**: 符合 Web 标准的可访问性实现
- **测试友好**: 便于进行单元测试和集成测试

在开发新组件时，请参考本指南中的模式和示例，确保代码质量和用户体验。
