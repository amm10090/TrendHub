# API 集成指南

## 📋 概述

本文档详细说明 TrendHub 前端组件与后端 API 的集成方案，包括数据模型设计、API 端点规范和前端适配方案。

---

## 🗄️ 数据模型设计

### 1. Deals (优惠/优惠券) 模型

```typescript
// Prisma Schema
model Deal {
  id           String   @id @default(cuid())
  title        String
  description  String?

  // 商家信息
  merchantId   String
  merchant     Merchant @relation(fields: [merchantId], references: [id])

  // 优惠信息
  discount     Int?     // 折扣百分比 (如: 25 表示 25% off)
  code         String?  // 优惠券代码 (可选，有些优惠无需代码)
  savings      String?  // 节省金额显示 (如: "Save $30+")

  // 链接和追踪
  affiliateUrl String   // 联盟链接

  // 评级和统计
  rating       Float    @default(0) // 1-5星评级
  clicks       Int      @default(0) // 点击统计

  // 状态和时间
  expires      DateTime
  isExpired    Boolean  @default(false)
  featured     Boolean  @default(false)
  isActive     Boolean  @default(true)

  // 分类信息
  categoryId   String
  category     Category @relation(fields: [categoryId], references: [id])
  categorySlug String   // 用于筛选 (fashion, footwear, jewelry 等)

  // 时间戳
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("deals")
}
```

### 2. Merchants (商家) 模型

```typescript
// Prisma Schema
model Merchant {
  id           String @id @default(cuid())
  name         String // 商家名称 (如: "Mytheresa")
  slug         String @unique // URL友好标识 (如: "mytheresa")

  // 显示信息
  logo         String? // Logo URL
  category     String  // 商家分类 (FASHION, FOOTWEAR, JEWELRY 等)
  categoryColor String @default("#EF4444") // 分类标签颜色

  // 链接信息
  website      String? // 官方网站
  affiliateUrl String? // 联盟链接基础URL

  // 状态
  isActive     Boolean @default(true)
  featured     Boolean @default(false)

  // 关联
  deals        Deal[]
  products     Product[] // 如果产品也需要关联商家

  // 时间戳
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("merchants")
}
```

### 3. 扩展现有 Product 模型

```typescript
// 扩展现有 Product 模型
model Product {
  // ... 现有字段 ...

  // 新增商家相关字段
  merchantId   String?
  merchant     Merchant? @relation(fields: [merchantId], references: [id])
  retailer     String?   // 商家标识符 (mytheresa, farfetch 等)

  // 新增优惠相关字段
  dealId       String?   // 如果产品关联特定优惠
  deal         Deal?     @relation(fields: [dealId], references: [id])
}
```

---

## 🔌 API 端点规范

### 1. Deals API

#### GET /api/public/deals

**获取优惠列表**

```typescript
// 查询参数
interface DealsQuery {
  category?: 'all' | 'fashion' | 'footwear' | 'jewelry' | 'electronics' | 'beauty' | 'sports';
  retailer?: 'all' | 'mytheresa' | 'farfetch' | 'yoox' | 'ssense' | 'netaporter' | 'italist';
  sort?: 'newest' | 'popular' | 'discount' | 'expires';
  limit?: number; // 默认 12
  page?: number; // 默认 1
  featured?: boolean; // 只获取精选优惠
}

// 响应数据结构
interface DealsResponse {
  success: boolean;
  data: {
    deals: Deal[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// Deal 数据结构
interface Deal {
  id: string;
  title: string;
  description: string;
  merchant: {
    name: string;
    slug: string;
    logo: string | null;
    category: string;
    categoryColor: string;
  };
  discount: number | null;
  code: string | null;
  savings: string;
  affiliateUrl: string;
  rating: number;
  clicks: number;
  expires: string; // ISO 8601
  isExpired: boolean;
  featured: boolean;
  categorySlug: string;
}
```

#### POST /api/deals/[id]/click

**记录优惠点击统计**

```typescript
// 请求体
interface ClickTrackingRequest {
  userId?: string; // 可选，用于用户行为分析
  source: 'modal' | 'card' | 'button'; // 点击来源
}

// 响应
interface ClickTrackingResponse {
  success: boolean;
  message: string;
}
```

### 2. Merchants API

#### GET /api/public/merchants

**获取商家列表**

```typescript
// 查询参数
interface MerchantsQuery {
  category?: string;
  featured?: boolean;
  limit?: number;
}

// 响应数据结构
interface MerchantsResponse {
  success: boolean;
  data: Merchant[];
}

interface Merchant {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  category: string;
  categoryColor: string;
  isActive: boolean;
  featured: boolean;
  dealsCount?: number; // 动态计算的优惠数量
}
```

### 3. 扩展现有 Products API

#### GET /api/public/products

**扩展产品查询支持商家筛选**

```typescript
// 新增查询参数
interface ProductsQuery {
  // ... 现有参数 ...
  retailer?: string; // 按商家筛选
  onSale?: boolean; // 只显示有优惠的产品
}

// 扩展产品数据结构
interface Product {
  // ... 现有字段 ...
  retailer?: string;
  merchant?: {
    name: string;
    slug: string;
    logo: string | null;
  };
  deal?: {
    id: string;
    code: string | null;
    discount: number;
    expires: string;
  };
}
```

---

## 🔄 前端组件适配方案

### 1. LiveDealsRefined 组件适配

#### 数据获取逻辑更新

```typescript
// hooks/useDeals.ts
export function useDeals(filters: DealsFilters) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>();

  const fetchDeals = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        category: filters.category,
        retailer: filters.retailer,
        sort: filters.sort,
        limit: filters.limit.toString(),
        page: filters.page.toString(),
      });

      const response = await fetch(`/api/public/deals?${params}`);
      const result = await response.json();

      if (result.success) {
        setDeals(result.data.deals);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error);
      // 回退到 mock 数据
      setDeals(mockDeals);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  return { deals, isLoading, pagination, refetch: fetchDeals };
}
```

#### 点击统计集成

```typescript
// utils/analytics.ts
export async function trackDealClick(dealId: string, source: string) {
  try {
    await fetch(`/api/deals/${dealId}/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    // 静默失败，不影响用户体验
    console.error('Failed to track click:', error);
  }
}

// 在组件中使用
const handleDealClick = useCallback(
  async (deal: Deal) => {
    // 立即打开链接
    window.open(deal.affiliateUrl, '_blank');

    // 异步记录统计
    trackDealClick(deal.id, 'card');

    // 复制优惠码
    if (deal.code) {
      await handleCopyCode(deal.code);
    }
  },
  [handleCopyCode]
);
```

### 2. ProductGridRefined 组件适配

#### 商家筛选集成

```typescript
// 更新产品获取逻辑
const fetchProducts = useCallback(async () => {
  try {
    const params = new URLSearchParams({
      limit: '24',
      retailer: activeStore === 'all' ? '' : activeStore,
      gender: gender || 'women',
      onSale: 'true', // 只显示有优惠的产品
    });

    const response = await fetch(`/api/public/products?${params}`);
    const result = await response.json();

    if (result.success) {
      setProductsToDisplay(result.data);
    }
  } catch (error) {
    // 回退到 mock 数据
    setProductsToDisplay(mockProducts);
  }
}, [activeStore, gender]);
```

### 3. FeaturedBrands 组件适配

#### 品牌数据和统计集成

```typescript
// 更新品牌获取逻辑
const fetchBrands = useCallback(async () => {
  try {
    const response = await fetch('/api/public/merchants?featured=true');
    const result = await response.json();

    if (result.success) {
      // 为每个品牌获取优惠统计
      const brandsWithDeals = await Promise.all(
        result.data.map(async (merchant: Merchant) => {
          const dealsResponse = await fetch(`/api/public/deals?retailer=${merchant.slug}&limit=1`);
          const dealsResult = await dealsResponse.json();

          return {
            ...merchant,
            dealsCount: dealsResult.data?.pagination?.total || 0,
            discount: `Up to ${Math.floor(Math.random() * 40) + 10}%`, // 或从 API 获取最大折扣
          };
        })
      );

      setBrands(brandsWithDeals);
    }
  } catch (error) {
    // 回退到 mock 数据
    setBrands(mockBrands);
  }
}, []);
```

---

## 🛠️ Admin 后台开发任务

### 1. Deals 管理页面

#### /admin/deals 列表页面

```typescript
// 功能需求
- [ ] 分页显示所有优惠
- [ ] 按商家、分类、状态筛选
- [ ] 搜索功能 (按标题、优惠码)
- [ ] 批量操作 (激活/停用/删除)
- [ ] 点击统计显示
- [ ] 过期状态自动更新
```

#### /admin/deals/new 新增页面

```typescript
// 表单字段
interface DealForm {
  title: string;
  description: string;
  merchantId: string; // 下拉选择
  discount: number;
  code: string;
  savings: string;
  affiliateUrl: string;
  expires: Date;
  categoryId: string;
  featured: boolean;
}
```

### 2. Merchants 管理页面

#### /admin/merchants 列表页面

```typescript
// 功能需求
- [ ] 商家列表显示
- [ ] Logo 预览
- [ ] 优惠数量统计
- [ ] 状态管理
- [ ] Logo 上传功能
```

---

## 📊 数据迁移计划

### 1. 初始数据准备

```sql
-- 插入默认商家数据
INSERT INTO merchants (name, slug, category, categoryColor) VALUES
('Mytheresa', 'mytheresa', 'FASHION', '#EF4444'),
('Farfetch', 'farfetch', 'FASHION', '#EF4444'),
('YOOX', 'yoox', 'FASHION', '#EF4444'),
('SSENSE', 'ssense', 'FASHION', '#EF4444'),
('Net-A-Porter', 'netaporter', 'FASHION', '#EF4444'),
('Italist', 'italist', 'FASHION', '#EF4444');
```

### 2. 现有产品数据更新

```typescript
// 迁移脚本：为现有产品分配商家
const assignMerchantsToProducts = async () => {
  const products = await prisma.product.findMany();
  const merchants = await prisma.merchant.findMany();

  for (const product of products) {
    // 根据某种逻辑分配商家 (可能基于品牌或随机)
    const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];

    await prisma.product.update({
      where: { id: product.id },
      data: {
        merchantId: randomMerchant.id,
        retailer: randomMerchant.slug,
      },
    });
  }
};
```

---

## ⚡ 性能优化建议

### 1. 数据缓存策略

```typescript
// 使用 React Query 进行数据缓存
import { useQuery } from '@tanstack/react-query';

const useDeals = (filters: DealsFilters) => {
  return useQuery({
    queryKey: ['deals', filters],
    queryFn: () => fetchDeals(filters),
    staleTime: 5 * 60 * 1000, // 5分钟
    cacheTime: 10 * 60 * 1000, // 10分钟
  });
};
```

### 2. 图片优化

```typescript
// 使用 Next.js Image 组件
import Image from 'next/image';

<Image
  src={deal.merchant.logo}
  alt={deal.merchant.name}
  width={40}
  height={40}
  className="object-contain"
  priority={index < 4} // 前4个图片优先加载
/>
```

---

## 🚀 部署注意事项

### 1. 环境变量配置

```env
# API 相关
API_BASE_URL=https://api.trendhub.com
AFFILIATE_TRACKING_ID=trendhub_001

# 分析和追踪
GOOGLE_ANALYTICS_ID=GA_TRACKING_ID
AFFILIATE_COMMISSION_RATE=0.05
```

### 2. 数据库迁移

```bash
# 应用新的数据库结构
npx prisma migrate deploy

# 运行种子数据
npx prisma db seed
```

---

## 📋 测试计划

### 1. API 端点测试

```typescript
// 使用 Jest 和 Supertest
describe('Deals API', () => {
  test('GET /api/public/deals should return deals list', async () => {
    const response = await request(app).get('/api/public/deals').expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.deals)).toBe(true);
  });

  test('POST /api/deals/[id]/click should track clicks', async () => {
    const dealId = 'test-deal-id';
    const response = await request(app)
      .post(`/api/deals/${dealId}/click`)
      .send({ source: 'card' })
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

### 2. 前端组件测试

```typescript
// 使用 React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { LiveDealsRefined } from '../live-deals-refined';

describe('LiveDealsRefined', () => {
  test('should display deals and handle click tracking', async () => {
    render(<LiveDealsRefined />);

    const dealCard = await screen.findByText('Test Deal');
    fireEvent.click(dealCard);

    // 验证点击追踪调用
    expect(mockTrackDealClick).toHaveBeenCalledWith('deal-id', 'card');
  });
});
```

---

## 📞 支持和维护

### 1. 错误监控

```typescript
// 集成 Sentry 进行错误追踪
import * as Sentry from '@sentry/nextjs';

Sentry.captureException(error, {
  tags: {
    component: 'LiveDealsRefined',
    action: 'fetchDeals',
  },
});
```

### 2. 性能监控

```typescript
// 使用 Web Vitals 监控
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // 发送性能指标到分析服务
  gtag('event', metric.name, {
    value: Math.round(metric.value),
    event_label: metric.id,
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

---

**最后更新**: 2024年12月26日  
**文档版本**: 1.0  
**维护者**: TrendHub Frontend Team
