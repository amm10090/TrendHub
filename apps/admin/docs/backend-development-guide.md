# TrendHub 后端应用开发文档

> 📚 TrendHub 管理后台应用 (`apps/admin`) 完整开发指南
>
> 🏗️ **技术栈**: Next.js 15 + TypeScript + Prisma + PostgreSQL + Auth.js v5

---

## 📖 目录

1. [应用概述](#应用概述)
2. [技术架构](#技术架构)
3. [项目结构](#项目结构)
4. [数据库设计](#数据库设计)
5. [API架构](#api架构)
6. [认证系统](#认证系统)
7. [服务层架构](#服务层架构)
8. [核心功能模块](#核心功能模块)
9. [FMTC折扣管理系统](#fmtc折扣管理系统)
10. [配置管理](#配置管理)
11. [部署指南](#部署指南)
12. [开发最佳实践](#开发最佳实践)
13. [常见问题](#常见问题)

---

## 🎯 应用概述

### 应用定位

TrendHub 管理后台是一个基于 Next.js 的全栈应用，为电商平台提供完整的内容管理系统，支持产品管理、品牌管理、内容发布、爬虫任务管理、FMTC折扣管理等核心功能。

### 核心特性

- **🛡️ 多重认证系统**: 支持邮箱/密码、OAuth (Google/GitHub)、邮件验证登录
- **🌐 国际化支持**: 内置中英文双语支持，基于 next-intl
- **📊 数据爬虫系统**: 集成多平台电商数据爬取，支持 Mytheresa、Farfetch 等
- **💰 广告变现**: 集成 Sovrn API 商品链接货币化
- **🎨 内容管理**: 灵活的内容区块系统，支持多种布局和组件
- **🎫 FMTC折扣管理**: 完整的折扣券管理系统，支持智能解析、品牌匹配、自动过期处理
- **📈 统计分析**: 丰富的数据统计和分析功能
- **🔧 系统设置**: 完整的系统配置和初始化功能

### 端口配置

- **开发环境**: http://localhost:3001
- **生产环境**: 根据环境变量配置

---

## 🏗️ 技术架构

### 核心技术栈

#### 前端框架

- **Next.js 15**: 使用 App Router，支持 React Server Components
- **TypeScript**: 全面的类型支持和检查
- **TailwindCSS**: 实用优先的CSS框架
- **Radix UI + shadcn/ui**: 高质量的组件库

#### 后端技术

- **Prisma ORM**: 类型安全的数据库操作
- **PostgreSQL**: 主数据库
- **Auth.js v5**: 认证解决方案
- **Server Actions**: Next.js 服务端操作

#### 开发工具

- **ESLint + Prettier**: 代码质量控制
- **Husky**: Git hooks 管理
- **Turborepo**: Monorepo 工具

### 架构设计原则

1. **类型安全**: 端到端的 TypeScript 支持
2. **模块化**: 功能模块独立，易于维护
3. **可扩展性**: 支持水平和垂直扩展
4. **性能优化**: 使用 React Server Components 和缓存策略
5. **错误处理**: 完整的错误边界和日志记录

---

## 📁 项目结构

```
apps/admin/
├── docs/                          # 📚 项目文档
│   └── backend-development-guide.md
├── prisma/                        # 🗄️ 数据库配置
│   ├── schema.prisma              # 数据库模式定义
│   ├── seed.ts                    # 种子数据
│   └── migrations/                # 数据库迁移文件
├── public/                        # 📦 静态资源
├── src/                          # 📂 源代码目录
│   ├── app/                      # 🚀 Next.js App Router
│   │   ├── [locale]/             # 🌐 国际化路由
│   │   │   ├── (protected)/      # 🔒 受保护的路由
│   │   │   │   ├── page.tsx      # 仪表板首页
│   │   │   │   ├── brands/       # 品牌管理
│   │   │   │   ├── products/     # 产品管理
│   │   │   │   ├── content-management/ # 内容管理
│   │   │   │   ├── discounts/    # 🎫 FMTC折扣管理
│   │   │   │   ├── scraper-management/ # 爬虫管理
│   │   │   │   └── settings/     # 系统设置
│   │   │   ├── login/            # 登录页面
│   │   │   └── layout.tsx        # 布局组件
│   │   ├── api/                  # 🔗 API 路由
│   │   │   ├── auth/             # 认证相关API
│   │   │   ├── brands/           # 品牌管理API
│   │   │   ├── products/         # 产品管理API
│   │   │   ├── discounts/        # 🎫 折扣管理API
│   │   │   │   ├── route.ts      # 折扣CRUD操作
│   │   │   │   ├── import/       # 折扣导入API
│   │   │   │   ├── stats/        # 折扣统计API
│   │   │   │   ├── scheduler/    # 调度器管理API
│   │   │   │   ├── expiry/       # 过期处理API
│   │   │   │   ├── brand-matching/ # 品牌匹配API
│   │   │   │   └── notifications/ # 通知管理API
│   │   │   ├── content-blocks/   # 内容区块API
│   │   │   ├── scraper-tasks/    # 爬虫任务API
│   │   │   └── health/           # 健康检查API
│   │   └── globals.css           # 全局样式
│   ├── components/               # 🎨 React 组件
│   │   ├── ui/                   # 基础UI组件
│   │   ├── discounts/            # 🎫 折扣管理组件
│   │   │   ├── DiscountDataTable.tsx
│   │   │   ├── DiscountImportForm.tsx
│   │   │   ├── DiscountStats.tsx
│   │   │   ├── DiscountFilters.tsx
│   │   │   ├── BrandMatchingPanel.tsx
│   │   │   ├── NotificationPanel.tsx
│   │   │   └── SchedulerStatusCard.tsx
│   │   ├── custom-navbar.tsx     # 导航栏组件
│   │   └── ...                   # 其他功能组件
│   ├── lib/                      # 📚 工具库和服务
│   │   ├── services/             # 🔧 业务服务层
│   │   │   ├── fmtc-parser.service.ts      # FMTC数据解析服务
│   │   │   ├── brand-matching.service.ts   # 品牌匹配服务
│   │   │   ├── discount-expiration.service.ts # 过期处理服务
│   │   │   ├── discount-scheduler.service.ts  # 调度器服务
│   │   │   └── discount-notification.service.ts # 通知服务
│   │   ├── utils.ts              # 通用工具函数
│   │   ├── prisma.ts             # Prisma 客户端
│   │   └── validations.ts        # 数据验证模式
│   ├── hooks/                    # ⚡ React Hooks
│   └── messages/                 # 🌐 国际化消息
│       ├── en.json               # 英文消息
│       └── cn.json               # 中文消息
├── .env.example                  # 环境变量示例
├── .env.local                    # 本地环境变量
├── package.json                  # 项目配置
├── next.config.js                # Next.js 配置
├── tailwind.config.js            # TailwindCSS 配置
└── tsconfig.json                 # TypeScript 配置
```

---

## 🗄️ 数据库设计

### 核心数据模型

#### 用户管理

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

#### 产品管理

```prisma
model Product {
  id           String   @id @default(cuid())
  name         String
  slug         String   @unique
  description  String?
  price        Float
  originalPrice Float?
  imageUrl     String?
  brand        Brand    @relation(fields: [brandId], references: [id])
  brandId      String
  category     Category @relation(fields: [categoryId], references: [id])
  categoryId   String
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

#### FMTC折扣管理数据模型

```prisma
model Discount {
  id            String      @id @default(cuid())
  merchantName  String      # FMTC商家名称
  title         String      # 折扣标题
  code          String?     # 折扣码
  type          DiscountType # 折扣类型
  value         Float?      # 折扣值
  dealStatus    String?     # 交易状态
  startDate     DateTime?   # 开始时间
  endDate       DateTime?   # 结束时间
  rating        Float?      # 评分
  isActive      Boolean     @default(true)
  isExpired     Boolean     @default(false)
  useCount      Int         @default(0)
  source        String      @default("FMTC")
  brand         Brand?      @relation(fields: [brandId], references: [id])
  brandId       String?
  rawData       Json?       # 原始FMTC数据
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([merchantName])
  @@index([isActive, isExpired])
  @@index([endDate])
}

model DiscountImport {
  id             String       @id @default(cuid())
  fileName       String?      # 导入文件名
  rawContent     String       # 原始内容
  parsedData     Json         # 解析后数据
  status         ImportStatus # 导入状态
  totalRecords   Int          # 总记录数
  successCount   Int          @default(0)
  errorCount     Int          @default(0)
  skippedCount   Int          @default(0)
  errors         Json?        # 错误信息
  importType     ImportType   # 导入类型
  processingTime Int?         # 处理时间(毫秒)
  createdAt      DateTime     @default(now())
  completedAt    DateTime?
}

model BrandMapping {
  id           String   @id @default(cuid())
  merchantName String   @unique # FMTC商家名称
  brand        Brand?   @relation(fields: [brandId], references: [id])
  brandId      String?
  isConfirmed  Boolean  @default(false)
  confidence   Float?   # 匹配置信度
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum DiscountType {
  PERCENTAGE     # 百分比折扣
  FIXED_AMOUNT   # 固定金额折扣
  FREE_SHIPPING  # 免费送货
  BUY_X_GET_Y    # 买X送Y
  OTHER          # 其他类型
}

enum ImportStatus {
  PROCESSING  # 处理中
  COMPLETED   # 已完成
  FAILED      # 失败
  PARTIAL     # 部分成功
}

enum ImportType {
  PASTE       # 粘贴导入
  FILE_UPLOAD # 文件上传
  API         # API导入
}
```

### 数据库关系图

```
User ──┐
       ├── Account
       └── Session

Brand ──┬── Product
        ├── Discount
        └── BrandMapping

Category ──── Product

Discount ──── Brand (可选)
DiscountImport (独立表)
BrandMapping ──── Brand (可选)
```

---

## 🔗 API架构

### REST API 设计原则

1. **RESTful URL 设计**: 使用标准的HTTP方法和状态码
2. **统一响应格式**: 所有API返回统一的JSON格式
3. **错误处理**: 详细的错误信息和状态码
4. **参数验证**: 严格的输入验证和类型检查
5. **分页支持**: 大数据集的分页处理

### 统一响应格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats?: Record<string, number>;
}
```

### FMTC折扣管理API

#### 折扣CRUD操作

```typescript
// GET /api/discounts - 获取折扣列表
// 支持的查询参数:
interface DiscountQuery {
  page?: number; // 页码 (默认: 1)
  limit?: number; // 每页数量 (默认: 20)
  search?: string; // 搜索关键词
  brandId?: string; // 品牌筛选
  status?: "all" | "active" | "expired" | "inactive";
  type?: DiscountType; // 折扣类型
  merchantName?: string; // 商家名称
  sortBy?: "createdAt" | "endDate" | "title";
  sortOrder?: "asc" | "desc";
}

// POST /api/discounts - 创建折扣
interface CreateDiscountRequest {
  merchantName: string;
  title: string;
  code?: string;
  type: DiscountType;
  value?: number;
  dealStatus?: string;
  startDate?: string;
  endDate?: string;
  rating?: number;
  brandId?: string;
  source?: string;
}

// PUT /api/discounts - 批量操作
interface BatchUpdateRequest {
  ids: string[];
  action: "activate" | "deactivate" | "delete";
  data?: Record<string, unknown>;
}
```

#### 折扣导入API

```typescript
// POST /api/discounts/import - 批量导入折扣
interface ImportRequest {
  discounts: FMTCDiscountData[];
  source: string;
  importType: ImportType;
  rawContent?: string;
  fileName?: string;
}

interface FMTCDiscountData {
  merchantName: string;
  title: string;
  code?: string;
  type: DiscountType;
  value?: number;
  dealStatus?: string;
  startDate?: Date;
  endDate?: Date;
  rating?: number;
  description?: string;
}
```

#### 品牌匹配API

```typescript
// GET /api/discounts/brand-matching/mappings - 获取品牌映射
// POST /api/discounts/brand-matching/mappings - 创建品牌映射
// PUT /api/discounts/brand-matching/mappings - 更新品牌映射
// DELETE /api/discounts/brand-matching/mappings - 删除品牌映射

// GET /api/discounts/brand-matching/unmatched - 获取未匹配商家
// POST /api/discounts/brand-matching/batch - 批量品牌匹配
```

#### 统计分析API

```typescript
// GET /api/discounts/stats?timeRange=30d - 获取折扣统计
interface DiscountStats {
  overview: {
    total: number;
    active: number;
    expired: number;
    inactive: number;
    unmatched: number;
  };
  trend: Array<{
    date: string;
    created: number;
    expired: number;
  }>;
  upcomingExpiry: Array<{
    id: string;
    merchantName: string;
    title: string;
    endDate: string;
    brand?: { name: string; logo?: string };
  }>;
  rating: {
    average: number;
    count: number;
  };
}
```

#### 调度器管理API

```typescript
// GET /api/discounts/scheduler - 获取调度器状态
// POST /api/discounts/scheduler - 调度器操作 (start/stop/restart/trigger)

interface SchedulerStatus {
  status: {
    isActive: boolean;
    currentlyRunning: boolean;
    lastRun?: string;
    nextRun?: string;
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    config: {
      enabled: boolean;
      intervalMinutes: number;
    };
  };
  health: {
    status: "healthy" | "warning" | "error";
    details: string;
  };
  stats: {
    totalExpired: number;
    expiringSoon: number;
    cleanupCandidates: number;
  };
}
```

#### 通知管理API

```typescript
// GET /api/discounts/notifications - 获取通知配置和历史
// POST /api/discounts/notifications - 测试通知/立即检查
// PUT /api/discounts/notifications - 更新通知配置

interface NotificationConfig {
  enabled: boolean;
  thresholds: {
    critical: number;
    warning: number;
  };
  checkInterval: number;
  recipients: string[];
  channels: Array<"email" | "webhook" | "dashboard">;
}
```

---

## 🛡️ 认证系统

### Auth.js v5 集成

#### 认证配置

```typescript
// auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM,
    }),
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        // 预设管理员验证逻辑
        if (
          credentials.email === process.env.PRESET_ADMIN_EMAIL &&
          credentials.password === process.env.PRESET_ADMIN_PASSWORD
        ) {
          return {
            id: "admin",
            name: "Administrator",
            email: process.env.PRESET_ADMIN_EMAIL,
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized: async ({ auth }) => {
      return !!auth;
    },
  },
});
```

#### 路由保护中间件

```typescript
// middleware.ts
import { auth } from "@/auth";
import createIntlMiddleware from "next-intl/middleware";

const intlMiddleware = createIntlMiddleware({
  locales: ["en", "cn"],
  defaultLocale: "en",
  localePrefix: "always",
});

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // 公开路径
  const publicPaths = ["/login", "/api/auth", "/setup"];
  const isPublicPath = publicPaths.some((path) => pathname.includes(path));

  if (!isPublicPath && !isLoggedIn) {
    const locale = pathname.split("/")[1] || "en";
    return Response.redirect(new URL(`/${locale}/login`, req.url));
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
```

#### CSRF 令牌处理

```typescript
// lib/auth-utils.ts
export const getCsrfTokenServerSide = async (): Promise<string | undefined> => {
  const NextAuthBaseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL;

  const allCookies = await cookies();
  const cookieHeader = allCookies
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const csrfResponse = await fetch(`${NextAuthBaseUrl}/api/auth/csrf`, {
    headers: { Cookie: cookieHeader },
  });

  const csrfData = await csrfResponse.json();
  return csrfData.csrfToken;
};
```

### 环境变量配置

```bash
# .env.local
# 基础认证配置
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key

# 预设管理员（开发/演示用）
PRESET_ADMIN_EMAIL=admin@example.com
PRESET_ADMIN_PASSWORD=admin123

# OAuth 提供商（可选）
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# 邮件认证（可选）
AUTH_RESEND_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com
```

---

## ⚙️ 服务层架构

### 服务类设计模式

TrendHub 采用服务层架构模式，将业务逻辑封装在独立的服务类中，提高代码的可维护性和可测试性。

#### 基础服务接口

```typescript
// lib/services/base.service.ts
export abstract class BaseService {
  protected abstract serviceName: string;

  protected logInfo(message: string, data?: any) {
    console.log(`[${this.serviceName}] ${message}`, data || "");
  }

  protected logError(message: string, error?: any) {
    console.error(`[${this.serviceName}] ${message}`, error);
  }

  protected handleError(error: unknown, context: string): never {
    this.logError(`Error in ${context}`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unknown error in ${context}`);
  }
}
```

### FMTC核心服务

#### FMTC数据解析服务

```typescript
// lib/services/fmtc-parser.service.ts
export class FMTCParserService extends BaseService {
  protected serviceName = "FMTCParser";

  async parsePastedContent(content: string): Promise<{
    data: FMTCDiscountData[];
    stats: ParseStats;
  }> {
    // 智能检测数据格式并解析
    const format = this.detectFormat(content);

    switch (format) {
      case "TSV":
        return this.parseTSVFormat(content);
      case "TEXT":
        return this.parseTextFormat(content);
      default:
        throw new Error("Unsupported format");
    }
  }

  private detectFormat(content: string): "TSV" | "TEXT" | "UNKNOWN" {
    // 格式检测逻辑
    const lines = content.trim().split("\n");
    if (lines.length === 0) return "UNKNOWN";

    const firstLine = lines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;

    // 如果有多个制表符，可能是TSV格式
    if (tabCount >= 3) {
      return "TSV";
    }

    return "TEXT";
  }

  private async parseTSVFormat(content: string): Promise<{
    data: FMTCDiscountData[];
    stats: ParseStats;
  }> {
    // TSV格式解析逻辑
    // 处理表头、数据行、日期格式等
  }

  private parseDiscountType(typeStr: string): DiscountType {
    // 智能识别折扣类型
    const normalized = typeStr.toLowerCase().trim();

    if (normalized.includes("%") || normalized.includes("percent")) {
      return DiscountType.PERCENTAGE;
    }
    if (normalized.includes("$") || normalized.includes("off")) {
      return DiscountType.FIXED_AMOUNT;
    }
    if (normalized.includes("shipping") || normalized.includes("delivery")) {
      return DiscountType.FREE_SHIPPING;
    }
    if (normalized.includes("buy") && normalized.includes("get")) {
      return DiscountType.BUY_X_GET_Y;
    }

    return DiscountType.OTHER;
  }
}
```

#### 品牌匹配服务

```typescript
// lib/services/brand-matching.service.ts
export class BrandMatchingService extends BaseService {
  protected serviceName = "BrandMatching";
  private cache = new Map<string, BrandMatchResult>();

  async matchBrand(merchantName: string): Promise<BrandMatchResult> {
    // 缓存检查
    if (this.cache.has(merchantName)) {
      return this.cache.get(merchantName)!;
    }

    // 查找现有映射
    const existingMapping = await db.brandMapping.findUnique({
      where: { merchantName },
      include: { brand: true },
    });

    if (existingMapping) {
      const result: BrandMatchResult = {
        brandId: existingMapping.brandId,
        confidence: existingMapping.confidence || 0,
        isConfirmed: existingMapping.isConfirmed,
        matchType: "EXISTING_MAPPING",
      };
      this.cache.set(merchantName, result);
      return result;
    }

    // 模糊匹配
    const fuzzyMatch = await this.performFuzzyMatch(merchantName);
    this.cache.set(merchantName, fuzzyMatch);

    return fuzzyMatch;
  }

  private async performFuzzyMatch(
    merchantName: string,
  ): Promise<BrandMatchResult> {
    // 获取所有品牌
    const brands = await db.brand.findMany({
      select: { id: true, name: true },
    });

    let bestMatch: BrandMatchResult = {
      brandId: null,
      confidence: 0,
      isConfirmed: false,
      matchType: "NO_MATCH",
    };

    // 使用Levenshtein距离算法进行模糊匹配
    for (const brand of brands) {
      const distance = this.calculateLevenshteinDistance(
        this.normalizeBrandName(merchantName),
        this.normalizeBrandName(brand.name),
      );

      const maxLength = Math.max(merchantName.length, brand.name.length);
      const confidence = 1 - distance / maxLength;

      if (confidence > bestMatch.confidence && confidence >= 0.6) {
        bestMatch = {
          brandId: brand.id,
          confidence,
          isConfirmed: false,
          matchType: "FUZZY_MATCH",
          reason: this.getMatchReason(merchantName, brand.name, confidence),
        };
      }
    }

    return bestMatch;
  }

  private calculateLevenshteinDistance(str1: string, str2: string): number {
    // Levenshtein距离算法实现
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + cost, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  async batchMatchBrands(
    merchantNames: string[],
  ): Promise<Map<string, BrandMatchResult>> {
    const results = new Map<string, BrandMatchResult>();

    // 并行处理多个品牌匹配
    const matchPromises = merchantNames.map(async (merchantName) => {
      const result = await this.matchBrand(merchantName);
      return { merchantName, result };
    });

    const matches = await Promise.all(matchPromises);

    matches.forEach(({ merchantName, result }) => {
      results.set(merchantName, result);
    });

    return results;
  }
}
```

#### 过期处理服务

```typescript
// lib/services/discount-expiration.service.ts
export class DiscountExpirationService extends BaseService {
  protected serviceName = "DiscountExpiration";

  async processExpiredDiscounts(): Promise<ExpirationResult[]> {
    const config = this.loadConfig();
    const results: ExpirationResult[] = [];

    try {
      // 检查并标记过期折扣
      const checkResult = await this.checkAndMarkExpired();
      results.push(checkResult);

      // 清理过期数据（如果启用）
      if (config.cleanup.enabled) {
        const cleanupResult = await this.cleanupExpiredDiscounts();
        results.push(cleanupResult);
      }

      // 发送通知
      if (config.notifications.enabled) {
        await this.sendExpirationNotifications(results);
      }

      return results;
    } catch (error) {
      this.handleError(error, "processExpiredDiscounts");
    }
  }

  async checkAndMarkExpired(): Promise<ExpirationResult> {
    const now = new Date();

    // 查找所有应该过期但尚未标记为过期的折扣
    const expiredDiscounts = await db.discount.findMany({
      where: {
        isExpired: false,
        endDate: {
          lt: now,
        },
      },
      include: {
        brand: {
          select: { name: true },
        },
      },
    });

    if (expiredDiscounts.length === 0) {
      return {
        type: "EXPIRATION_CHECK",
        success: true,
        processed: 0,
        message: "No discounts to expire",
      };
    }

    // 批量更新过期状态
    const updateResult = await db.discount.updateMany({
      where: {
        id: {
          in: expiredDiscounts.map((d) => d.id),
        },
      },
      data: {
        isExpired: true,
        isActive: false,
        updatedAt: now,
      },
    });

    this.logInfo(`Marked ${updateResult.count} discounts as expired`);

    return {
      type: "EXPIRATION_CHECK",
      success: true,
      processed: updateResult.count,
      message: `Successfully marked ${updateResult.count} discounts as expired`,
      details: expiredDiscounts.map((d) => ({
        id: d.id,
        title: d.title,
        merchantName: d.merchantName,
        endDate: d.endDate,
      })),
    };
  }

  private async cleanupExpiredDiscounts(): Promise<ExpirationResult> {
    const config = this.loadConfig();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.cleanup.retentionDays);

    // 查找需要清理的折扣
    const toDelete = await db.discount.findMany({
      where: {
        isExpired: true,
        updatedAt: {
          lt: cutoffDate,
        },
      },
      select: { id: true, title: true, merchantName: true },
    });

    if (toDelete.length === 0) {
      return {
        type: "CLEANUP",
        success: true,
        processed: 0,
        message: "No expired discounts to cleanup",
      };
    }

    // 执行删除
    const deleteResult = await db.discount.deleteMany({
      where: {
        id: {
          in: toDelete.map((d) => d.id),
        },
      },
    });

    this.logInfo(`Cleaned up ${deleteResult.count} expired discounts`);

    return {
      type: "CLEANUP",
      success: true,
      processed: deleteResult.count,
      message: `Successfully cleaned up ${deleteResult.count} expired discounts`,
      details: toDelete,
    };
  }
}
```

#### 调度器服务

```typescript
// lib/services/discount-scheduler.service.ts
export class DiscountSchedulerService extends BaseService {
  protected serviceName = "DiscountScheduler";
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private config: SchedulerConfig;
  private stats: SchedulerStats;

  constructor() {
    super();
    this.config = this.loadConfig();
    this.stats = this.initializeStats();
  }

  start(): boolean {
    if (this.isRunning) {
      this.logInfo("Scheduler already running");
      return false;
    }

    if (!this.config.enabled) {
      this.logInfo("Scheduler is disabled");
      return false;
    }

    this.logInfo(
      `Starting scheduler with ${this.config.intervalMinutes} minute interval`,
    );

    this.intervalId = setInterval(
      () => this.executeScheduledTask(),
      this.config.intervalMinutes * 60 * 1000,
    );

    this.isRunning = true;
    this.stats.lastStarted = new Date();

    return true;
  }

  stop(): boolean {
    if (!this.isRunning) {
      this.logInfo("Scheduler not running");
      return false;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    this.logInfo("Scheduler stopped");

    return true;
  }

  restart(): boolean {
    this.stop();
    return this.start();
  }

  async executeManually(): Promise<ExecutionResult> {
    this.logInfo("Manual execution triggered");
    return this.executeScheduledTask();
  }

  private async executeScheduledTask(): Promise<ExecutionResult> {
    if (this.stats.currentlyRunning) {
      this.logInfo("Task already running, skipping this execution");
      return {
        success: false,
        duration: 0,
        processed: 0,
        error: "Task already running",
      };
    }

    const startTime = Date.now();
    this.stats.currentlyRunning = true;
    this.stats.totalRuns++;

    try {
      this.logInfo("Starting scheduled discount expiration check");

      // 执行过期处理
      const expirationService = new DiscountExpirationService();
      const results = await expirationService.processExpiredDiscounts();

      const duration = Date.now() - startTime;
      const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);

      // 更新统计信息
      this.stats.successfulRuns++;
      this.stats.lastRun = new Date();
      this.stats.lastDuration = duration;
      this.stats.currentlyRunning = false;

      this.logInfo(
        `Scheduled task completed in ${duration}ms, processed ${totalProcessed} items`,
      );

      return {
        success: true,
        duration,
        processed: totalProcessed,
        details: results,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      this.stats.failedRuns++;
      this.stats.lastError =
        error instanceof Error ? error.message : "Unknown error";
      this.stats.lastRun = new Date();
      this.stats.currentlyRunning = false;

      this.logError("Scheduled task failed", error);

      return {
        success: false,
        duration,
        processed: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  getStatus(): SchedulerStatus {
    const nextRun =
      this.isRunning && this.stats.lastRun
        ? new Date(
            this.stats.lastRun.getTime() +
              this.config.intervalMinutes * 60 * 1000,
          )
        : null;

    return {
      isActive: this.isRunning,
      currentlyRunning: this.stats.currentlyRunning,
      config: this.config,
      stats: this.stats,
      nextRun,
    };
  }

  healthCheck(): HealthStatus {
    const now = new Date();
    const status = this.getStatus();

    // 检查是否应该运行但没有运行
    if (this.config.enabled && !this.isRunning) {
      return {
        status: "error",
        details: "Scheduler should be running but is stopped",
      };
    }

    // 检查最近是否有运行
    if (this.stats.lastRun) {
      const timeSinceLastRun = now.getTime() - this.stats.lastRun.getTime();
      const expectedInterval = this.config.intervalMinutes * 60 * 1000;

      // 如果超过预期间隔的1.5倍还没运行，可能有问题
      if (timeSinceLastRun > expectedInterval * 1.5) {
        return {
          status: "warning",
          details: `Last run was ${Math.round(timeSinceLastRun / 1000 / 60)} minutes ago`,
        };
      }
    }

    // 检查失败率
    const totalRuns = this.stats.totalRuns;
    if (totalRuns > 0) {
      const failureRate = this.stats.failedRuns / totalRuns;
      if (failureRate > 0.5) {
        return {
          status: "warning",
          details: `High failure rate: ${(failureRate * 100).toFixed(1)}%`,
        };
      }
    }

    return {
      status: "healthy",
      details: "Scheduler operating normally",
    };
  }
}
```

---

## 🎨 核心功能模块

### 📝 内容管理系统

#### 内容区块架构

```typescript
// 内容区块类型定义
enum ContentBlockType {
  BANNER = "BANNER", // 横幅广告
  INTRODUCTION_SECTION = "INTRODUCTION_SECTION", // 介绍区块
  PRODUCT_GRID_HERO = "PRODUCT_GRID_HERO", // 产品网格英雄区
  TRENDING_SECTION_CONTAINER = "TRENDING_SECTION_CONTAINER", // 趋势区块容器
  PRODUCT_GRID_CONFIGURABLE = "PRODUCT_GRID_CONFIGURABLE", // 可配置产品网格
}

enum ContentItemType {
  TRENDING_CARD_LARGE = "TRENDING_CARD_LARGE", // 大型趋势卡片
  TRENDING_CARD_NORMAL = "TRENDING_CARD_NORMAL", // 普通趋势卡片
  SHINING_CARD = "SHINING_CARD", // 闪亮卡片
  PRODUCT_REFERENCE = "PRODUCT_REFERENCE", // 产品引用
  TEXT_LINK_BLOCK = "TEXT_LINK_BLOCK", // 文本链接块
}
```

#### 内容区块管理服务

```typescript
// lib/services/content-block.service.ts
export class ContentBlockService extends BaseService {
  async createContentBlock(
    data: CreateContentBlockData,
  ): Promise<ContentBlock> {
    return db.contentBlock.create({
      data: {
        ...data,
        contentItems: {
          create: data.contentItems || [],
        },
      },
      include: {
        contentItems: true,
      },
    });
  }

  async updateContentBlock(
    id: string,
    data: UpdateContentBlockData,
  ): Promise<ContentBlock> {
    return db.contentBlock.update({
      where: { id },
      data: {
        ...data,
        contentItems: data.contentItems
          ? {
              deleteMany: {},
              create: data.contentItems,
            }
          : undefined,
      },
      include: {
        contentItems: true,
      },
    });
  }
}
```

---

## 🎫 FMTC折扣管理系统

### 系统概述

FMTC（FanMom Technology Co.）折扣管理系统是TrendHub的核心功能之一，用于管理来自FMTC平台的折扣券数据。系统支持智能数据解析、自动品牌匹配、过期处理自动化以及数据阈值监控。

### 开发状态

#### ✅ 已完成功能 (v1.0.0)

1. **数据库设计** - 完整的Prisma数据模型

   - `Discount` 模型：折扣主表
   - `DiscountImport` 模型：导入记录追踪
   - `BrandMapping` 模型：品牌映射关系
   - 相关枚举和索引优化

2. **数据解析引擎** - 智能FMTC内容解析

   - 支持TSV表格格式和纯文本格式
   - 自动检测数据格式
   - 多种日期格式解析
   - 智能折扣类型识别

3. **导入管理系统** - 完整的数据导入流程

   - 支持粘贴文本和文件上传
   - 实时数据预览和验证
   - 批量导入处理
   - 重复数据检测

4. **品牌匹配系统** - 自动化品牌关联

   - Levenshtein距离算法模糊匹配
   - 批量品牌匹配处理
   - 手动映射管理
   - 匹配置信度评分

5. **过期处理自动化** - 智能过期管理

   - 自动检测和标记过期折扣
   - 可配置的清理规则
   - 过期数据保留策略
   - 详细的处理日志

6. **调度器系统** - 任务自动化调度

   - 可配置的定时任务
   - 手动触发执行
   - 健康状态监控
   - 执行统计和错误处理

7. **数据阈值通知** - 智能监控和预警

   - 可配置的阈值设置
   - 多渠道通知支持（邮件、Webhook、仪表板）
   - 实时警告生成
   - 通知历史记录

8. **管理界面** - 完整的Web管理界面

   - 响应式数据表格
   - 高级筛选和搜索
   - 批量操作支持
   - 统计图表和分析
   - 实时状态监控

9. **API接口** - RESTful API完整实现
   - CRUD操作接口
   - 批量导入API
   - 统计分析API
   - 调度器管理API
   - 通知管理API

#### 🔄 待优化功能 (v1.1.0)

1. **性能优化**

   - 大数据集分页优化
   - 数据库查询优化
   - 缓存策略实现

2. **高级功能**

   - 折扣使用情况跟踪
   - 更多统计分析维度
   - 数据导出功能

3. **监控增强**
   - 更详细的性能监控
   - 用户操作审计日志
   - 系统健康检查

### 核心文件结构

```
src/
├── app/
│   ├── [locale]/discounts/                  # 折扣管理页面
│   │   ├── page.tsx                        # 主管理界面
│   │   ├── import/                         # 导入页面
│   │   └── settings/                       # 设置页面
│   └── api/discounts/                      # 折扣管理API
│       ├── route.ts                        # 基础CRUD操作
│       ├── import/route.ts                 # 导入处理API
│       ├── stats/route.ts                  # 统计分析API
│       ├── scheduler/route.ts              # 调度器管理API
│       ├── expiry/route.ts                 # 过期处理API
│       ├── brand-matching/route.ts         # 品牌匹配API
│       └── notifications/route.ts          # 通知管理API
├── components/discounts/                   # React组件
│   ├── DiscountDataTable.tsx              # 数据表格组件
│   ├── DiscountImportForm.tsx             # 导入表单组件
│   ├── DiscountStats.tsx                  # 统计组件
│   ├── DiscountFilters.tsx                # 筛选组件
│   ├── BrandMatchingPanel.tsx             # 品牌匹配管理
│   ├── NotificationPanel.tsx              # 通知设置组件
│   ├── SchedulerStatusCard.tsx            # 调度器状态卡片
│   ├── DiscountPreviewTable.tsx           # 数据预览表格
│   └── FileUploader.tsx                   # 文件上传组件
└── lib/services/                          # 核心服务层
    ├── fmtc-parser.service.ts             # FMTC数据解析服务
    ├── brand-matching.service.ts          # 品牌匹配服务
    ├── discount-expiration.service.ts     # 过期处理服务
    ├── discount-scheduler.service.ts      # 调度器服务
    ├── discount-notification.service.ts   # 通知服务
    └── scheduler-init.ts                   # 调度器初始化
```

### 关键函数和API

#### 核心服务函数

**FMTCParserService (`lib/services/fmtc-parser.service.ts`)**

```typescript
// 主要解析函数
async parsePastedContent(content: string): Promise<{
  data: FMTCDiscountData[];
  stats: ParseStats;
}>

// 格式检测
private detectFormat(content: string): 'TSV' | 'TEXT' | 'UNKNOWN'

// TSV格式解析
private async parseTSVFormat(content: string): Promise<ParseResult>

// 文本格式解析
private parseTextFormat(content: string): Promise<ParseResult>

// 智能类型识别
private parseDiscountType(typeStr: string): DiscountType

// 日期解析支持多种格式
private parseDate(dateStr: string): Date | null
```

**BrandMatchingService (`lib/services/brand-matching.service.ts`)**

```typescript
// 单个品牌匹配
async matchBrand(merchantName: string): Promise<BrandMatchResult>

// 批量品牌匹配
async batchMatchBrands(merchantNames: string[]): Promise<Map<string, BrandMatchResult>>

// 模糊匹配算法
private async performFuzzyMatch(merchantName: string): Promise<BrandMatchResult>

// Levenshtein距离计算
private calculateLevenshteinDistance(str1: string, str2: string): number

// 品牌名称标准化
private normalizeBrandName(name: string): string
```

**DiscountExpirationService (`lib/services/discount-expiration.service.ts`)**

```typescript
// 主要过期处理函数
async processExpiredDiscounts(): Promise<ExpirationResult[]>

// 检查并标记过期
async checkAndMarkExpired(): Promise<ExpirationResult>

// 清理过期数据
private async cleanupExpiredDiscounts(): Promise<ExpirationResult>

// 发送过期通知
private async sendExpirationNotifications(results: ExpirationResult[]): Promise<void>

// 获取即将过期的折扣
async getExpiringSoon(days: number = 7): Promise<DiscountExpiringSoon[]>
```

**DiscountSchedulerService (`lib/services/discount-scheduler.service.ts`)**

```typescript
// 调度器控制
start(): boolean
stop(): boolean
restart(): boolean

// 手动执行
async executeManually(): Promise<ExecutionResult>

// 状态管理
getStatus(): SchedulerStatus
healthCheck(): HealthStatus

// 私有执行函数
private async executeScheduledTask(): Promise<ExecutionResult>
```

**DiscountNotificationService (`lib/services/discount-notification.service.ts`)**

```typescript
// 阈值检查主函数
async checkThresholds(): Promise<ThresholdAlert[]>

// 获取折扣指标
private async getDiscountMetrics(): Promise<DiscountMetrics>

// 处理警告
private async processAlerts(alerts: ThresholdAlert[]): Promise<void>

// 多渠道通知
private async sendEmailNotifications(alerts: ThresholdAlert[]): Promise<void>
private async sendWebhookNotifications(alerts: ThresholdAlert[]): Promise<void>
private async updateDashboardAlerts(alerts: ThresholdAlert[]): Promise<void>

// 配置管理
async updateConfig(newConfig: Partial<NotificationConfig>): Promise<void>
getConfig(): NotificationConfig
```

#### API端点

**基础CRUD操作 (`/api/discounts`)**

```typescript
// GET - 获取折扣列表（支持高级筛选）
// 查询参数: page, limit, search, brandId, status, type, merchantName, sortBy, sortOrder

// POST - 创建新折扣
interface CreateDiscountRequest {
  merchantName: string;
  title: string;
  code?: string;
  type: DiscountType;
  value?: number;
  // ...其他字段
}

// PUT - 批量操作
interface BatchUpdateRequest {
  ids: string[];
  action: "activate" | "deactivate" | "delete";
  data?: Record<string, unknown>;
}
```

**导入处理 (`/api/discounts/import`)**

```typescript
// POST - 批量导入折扣
interface ImportRequest {
  discounts: FMTCDiscountData[];
  source: string;
  importType: ImportType;
  rawContent?: string;
  fileName?: string;
}

// 响应包含导入统计和错误详情
interface ImportResponse {
  success: boolean;
  data: {
    importId: string;
    stats: ImportStats;
    errors: string[];
  };
}
```

**统计分析 (`/api/discounts/stats`)**

```typescript
// GET - 获取详细统计数据
// 查询参数: timeRange (7d, 30d, 90d)

interface StatsResponse {
  overview: OverviewStats; // 总览统计
  trend: TrendData[]; // 趋势数据
  upcomingExpiry: ExpiryData[]; // 即将过期
  rating: RatingStats; // 评分统计
}
```

**调度器管理 (`/api/discounts/scheduler`)**

```typescript
// GET - 获取调度器状态
interface SchedulerStatusResponse {
  status: SchedulerStatus;
  health: HealthStatus;
  stats: SchedulerStats;
}

// POST - 调度器操作
interface SchedulerActionRequest {
  action: "start" | "stop" | "restart" | "trigger";
}
```

**品牌匹配 (`/api/discounts/brand-matching`)**

```typescript
// GET /mappings - 获取品牌映射列表
// POST /mappings - 创建品牌映射
// PUT /mappings - 更新品牌映射
// DELETE /mappings - 删除品牌映射

// GET /unmatched - 获取未匹配商家
// POST /batch - 批量品牌匹配
```

**通知管理 (`/api/discounts/notifications`)**

```typescript
// GET - 获取通知配置和历史
// POST - 测试通知/立即检查阈值
// PUT - 更新通知配置

interface NotificationConfigRequest {
  enabled: boolean;
  thresholds: { critical: number; warning: number };
  checkInterval: number;
  recipients: string[];
  channels: Array<"email" | "webhook" | "dashboard">;
}
```

### 环境变量配置

```bash
# FMTC折扣系统配置
DISCOUNT_SCHEDULER_ENABLED=true
DISCOUNT_SCHEDULER_INTERVAL_MINUTES=60
DISCOUNT_EXPIRATION_ENABLED=true
DISCOUNT_CLEANUP_ENABLED=true
DISCOUNT_CLEANUP_RETENTION_DAYS=30

# 通知系统配置
DISCOUNT_NOTIFICATIONS_ENABLED=true
DISCOUNT_THRESHOLD_CRITICAL=100
DISCOUNT_THRESHOLD_WARNING=500
DISCOUNT_CHECK_INTERVAL=60
NOTIFICATION_RECIPIENTS=admin@example.com,manager@example.com
NOTIFICATION_CHANNELS=dashboard,email,webhook

# Webhook通知URL
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

### 使用示例

#### 导入FMTC数据

```typescript
// 1. 解析粘贴的数据
const parser = new FMTCParserService();
const parseResult = await parser.parsePastedContent(pastedContent);

// 2. 品牌匹配
const brandMatcher = new BrandMatchingService();
const merchantNames = [...new Set(parseResult.data.map((d) => d.merchantName))];
const brandMatches = await brandMatcher.batchMatchBrands(merchantNames);

// 3. 导入数据库
const response = await fetch("/api/discounts/import", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    discounts: parseResult.data,
    source: "FMTC",
    importType: "PASTE",
    rawContent: pastedContent,
  }),
});
```

#### 配置自动化调度

```typescript
// 启动调度器
const scheduler = new DiscountSchedulerService();
scheduler.start();

// 手动触发执行
const result = await scheduler.executeManually();

// 检查健康状态
const health = scheduler.healthCheck();
```

#### 监控数据阈值

```typescript
// 检查阈值并发送通知
const notificationService = new DiscountNotificationService();
const alerts = await notificationService.checkThresholds();

// 配置通知设置
await notificationService.updateConfig({
  enabled: true,
  thresholds: { critical: 50, warning: 200 },
  channels: ["email", "webhook"],
});
```

### 性能优化

1. **数据库优化**

   - 为常用查询字段添加索引
   - 使用数据库级别的分页
   - 批量操作减少数据库连接

2. **缓存策略**

   - 品牌匹配结果缓存
   - 统计数据缓存
   - API响应缓存

3. **异步处理**
   - 大批量导入使用后台任务
   - 通知发送异步处理
   - 文件上传流式处理

---

## ⚙️ 配置管理

### 环境变量配置

#### 数据库配置

```bash
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/trendhub_db"

# Prisma配置
DIRECT_URL="postgresql://username:password@localhost:5432/trendhub_db"
```

#### 认证配置

```bash
# NextAuth配置
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key
AUTH_URL=http://localhost:3001

# 预设管理员
PRESET_ADMIN_EMAIL=admin@example.com
PRESET_ADMIN_PASSWORD=admin123

# OAuth提供商
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# 邮件认证
AUTH_RESEND_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com
```

#### 文件存储配置

```bash
# Cloudflare R2配置
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

#### Sovrn API配置

```bash
# 商品链接货币化
SOVRN_API_KEY=your-sovrn-api-key
```

#### FMTC系统配置

```bash
# 调度器配置
DISCOUNT_SCHEDULER_ENABLED=true
DISCOUNT_SCHEDULER_INTERVAL_MINUTES=60

# 过期处理配置
DISCOUNT_EXPIRATION_ENABLED=true
DISCOUNT_CLEANUP_ENABLED=true
DISCOUNT_CLEANUP_RETENTION_DAYS=30

# 通知配置
DISCOUNT_NOTIFICATIONS_ENABLED=true
DISCOUNT_THRESHOLD_CRITICAL=100
DISCOUNT_THRESHOLD_WARNING=500
NOTIFICATION_RECIPIENTS=admin@example.com
NOTIFICATION_CHANNELS=dashboard,email,webhook
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

### 应用配置

#### Next.js 配置

```javascript
// next.config.js
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3001"],
    },
  },
  images: {
    domains: ["example.com", "another-domain.com"],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default withNextIntl(nextConfig);
```

#### TypeScript 配置

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 🚀 部署指南

### 开发环境部署

#### 环境准备

```bash
# 1. 克隆项目
git clone <repository-url>
cd TrendHub

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp apps/admin/.env.example apps/admin/.env.local
# 编辑 .env.local 文件配置必要的环境变量

# 4. 数据库设置
cd apps/admin
pnpm db:push
pnpm db:seed

# 5. 启动开发服务器
pnpm dev
```

#### 数据库初始化

```bash
# 推送数据库模式
pnpm db:push

# 运行种子数据
pnpm db:seed

# 查看数据库（可选）
pnpm db:studio
```

### 生产环境部署

#### Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g pnpm && pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3001
ENV PORT 3001

CMD ["node", "server.js"]
```

#### PM2 部署

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "trendhub-admin",
      script: "pnpm",
      args: "start",
      cwd: "./apps/admin",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
```

#### 部署脚本

```bash
#!/bin/bash
# deploy.sh

echo "🚀 开始部署 TrendHub Admin..."

# 更新代码
git pull origin main

# 安装依赖
pnpm install

# 构建应用
pnpm build

# 数据库迁移
cd apps/admin
pnpm db:push

# 重启应用
pm2 restart trendhub-admin

echo "✅ 部署完成!"
```

---

## 💡 开发最佳实践

### 代码规范

#### TypeScript 使用

1. **严格类型检查**: 启用 strict mode，避免使用 `any`
2. **接口定义**: 为所有API请求/响应定义接口
3. **泛型使用**: 在适当的地方使用泛型提高代码复用性
4. **类型守卫**: 使用类型守卫确保运行时类型安全

```typescript
// 好的实践
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function isValidDiscountType(value: string): value is DiscountType {
  return Object.values(DiscountType).includes(value as DiscountType);
}

// 避免
function processData(data: any): any {
  return data;
}
```

#### 错误处理

1. **统一错误处理**: 使用一致的错误处理模式
2. **详细错误信息**: 提供有用的错误消息和状态码
3. **错误边界**: 在React组件中使用错误边界
4. **日志记录**: 记录详细的错误日志用于调试

```typescript
// 好的实践
try {
  const result = await someAsyncOperation();
  return { success: true, data: result };
} catch (error) {
  console.error("Operation failed:", error);
  return {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error",
  };
}
```

#### 性能优化

1. **React Server Components**: 优先使用服务端组件
2. **数据获取优化**: 使用 Suspense 和流式渲染
3. **图片优化**: 使用 Next.js Image 组件
4. **代码分割**: 适当使用动态导入

```typescript
// 服务端组件示例
export default async function DiscountsPage() {
  const discounts = await getDiscounts();

  return (
    <Suspense fallback={<DiscountsSkeleton />}>
      <DiscountsTable discounts={discounts} />
    </Suspense>
  );
}
```

### 数据库最佳实践

#### Prisma 使用

1. **查询优化**: 使用 include 和 select 优化数据获取
2. **事务处理**: 对相关操作使用数据库事务
3. **索引优化**: 为常用查询字段添加索引
4. **批量操作**: 使用 createMany、updateMany 等批量操作

```typescript
// 优化的查询
const discounts = await db.discount.findMany({
  select: {
    id: true,
    title: true,
    merchantName: true,
    brand: {
      select: { name: true, logo: true },
    },
  },
  where: { isActive: true },
  orderBy: { createdAt: "desc" },
  take: 20,
});
```

#### 数据验证

1. **输入验证**: 使用 Zod 进行严格的数据验证
2. **业务规则**: 在服务层实施业务逻辑验证
3. **数据完整性**: 使用数据库约束确保数据一致性

```typescript
// Zod 验证模式
const CreateDiscountSchema = z.object({
  merchantName: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  type: z.nativeEnum(DiscountType),
  value: z.number().positive().optional(),
  endDate: z.date().optional(),
});
```

### 安全最佳实践

1. **输入清理**: 清理和验证所有用户输入
2. **SQL 注入防护**: 使用 Prisma 的参数化查询
3. **XSS 防护**: 适当转义输出内容
4. **CSRF 防护**: 使用 Auth.js 内置的 CSRF 保护
5. **环境变量**: 敏感信息存储在环境变量中

---

## ❓ 常见问题

### 安装和配置

**Q: 如何解决 Prisma 连接数据库失败？**

A: 检查以下几点：

1. 确认 `DATABASE_URL` 环境变量格式正确
2. 确认数据库服务正在运行
3. 检查网络连接和防火墙设置
4. 验证数据库用户权限

```bash
# 测试数据库连接
pnpm db:studio
# 或
npx prisma db pull
```

**Q: NextAuth 认证失败怎么办？**

A: 常见解决方案：

1. 检查 `NEXTAUTH_URL` 和 `NEXTAUTH_SECRET` 配置
2. 确认 OAuth 提供商配置正确
3. 检查回调 URL 设置
4. 验证环境变量是否正确加载

### 开发问题

**Q: 如何调试 Server Actions？**

A:

1. 使用 `console.log` 在服务端输出调试信息
2. 检查网络面板中的请求和响应
3. 使用 Next.js 的错误边界捕获错误
4. 在开发环境中启用详细错误信息

**Q: 组件重新渲染过于频繁？**

A: 优化建议：

1. 使用 `useCallback` 和 `useMemo` 优化函数和值
2. 将状态提升到合适的层级
3. 使用 `React.memo` 包装纯组件
4. 检查依赖数组是否正确

### 部署问题

**Q: 生产环境构建失败？**

A: 检查步骤：

1. 确认所有环境变量在生产环境中已设置
2. 检查 TypeScript 类型错误
3. 验证 ESLint 规则通过
4. 确认数据库可访问

**Q: FMTC系统相关问题**

**Q: FMTC数据解析失败？**

A: troubleshooting步骤：

1. 检查数据格式是否符合支持的格式（TSV或文本）
2. 验证日期格式是否正确
3. 检查特殊字符是否正确处理
4. 查看解析错误日志

**Q: 品牌匹配准确率低？**

A: 优化建议：

1. 调整Levenshtein距离阈值
2. 手动创建品牌映射关系
3. 优化品牌名称标准化逻辑
4. 增加更多匹配规则

**Q: 调度器不执行或执行失败？**

A: 检查项目：

1. 确认环境变量 `DISCOUNT_SCHEDULER_ENABLED=true`
2. 检查调度器服务是否正确启动
3. 查看调度器健康检查状态
4. 检查数据库连接是否正常

**Q: 通知系统不发送通知？**

A: 解决方案：

1. 验证通知配置是否正确
2. 检查Webhook URL是否有效
3. 确认邮件服务配置正确
4. 查看通知服务日志

---

## 📊 项目状态

### 开发进度

#### 已完成功能 (v1.0.0)

- ✅ 完善的认证系统 (Auth.js v5)
- ✅ 多平台电商数据爬取
- ✅ 内容管理系统
- ✅ 产品和品牌管理
- ✅ 图片上传和存储
- ✅ 国际化支持
- ✅ 统计分析功能
- ✅ **FMTC折扣管理系统** (完整实现)
  - ✅ 智能数据解析引擎
  - ✅ 自动化品牌匹配
  - ✅ 过期处理自动化
  - ✅ 数据阈值监控
  - ✅ 完整管理界面
  - ✅ RESTful API接口

#### 计划功能 (v1.1.0)

- 🔄 FMTC系统性能优化
- 🔄 高级统计分析和报表
- 🔄 更多通知渠道支持
- 🔄 实时数据同步
- 🔄 高级搜索和筛选
- 🔄 批量导入/导出增强
- 🔄 API速率限制
- 🔄 更多OAuth提供商支持

---

## 🤝 贡献指南

### 开发流程

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/new-feature`)
3. 提交更改 (`git commit -am 'Add new feature'`)
4. 推送到分支 (`git push origin feature/new-feature`)
5. 创建 Pull Request

### 代码风格

- 遵循项目的 ESLint 和 Prettier 配置
- 使用 TypeScript 进行类型检查
- 编写清晰的注释和文档
- 遵循现有的命名约定
- FMTC相关功能请确保包含完整的测试用例

### 提交规范

```
feat: 添加新功能
fix: 修复bug
docs: 文档更新
style: 代码格式化
refactor: 代码重构
test: 测试相关
chore: 构建流程或辅助工具的变动
fmtc: FMTC系统相关更新
```

---

## 📧 支持和联系

如有技术问题或功能建议，请通过以下方式联系：

- 📧 Email: support@trendhub.com
- 💬 GitHub Issues: [项目Issues页面]
- 📖 文档: [在线文档地址]

---

## 🗺️ FMTC系统发展路线图

### 当前状态评估 (2025年1月)

#### ✅ 已完全实现的核心功能

1. **智能数据导入系统** ✅

   - 支持FMTC格式的TSV和文本粘贴导入
   - 智能格式检测和数据解析
   - 实时数据预览和验证
   - 重复数据检测和跳过机制

2. **自动化品牌匹配** ✅

   - Levenshtein距离算法模糊匹配
   - 手动品牌映射管理
   - 批量品牌匹配处理
   - 匹配置信度评分系统

3. **过期管理自动化** ✅

   - 自动检测和标记过期折扣
   - 可配置的过期数据清理规则
   - 定时调度器执行过期检查
   - 详细的处理日志记录

4. **数据阈值监控** ✅

   - 可配置的数据量阈值设置
   - 多渠道通知支持 (邮件、Webhook、仪表板)
   - 实时警告生成系统
   - 通知历史记录追踪

5. **完整管理界面** ✅
   - 响应式数据表格显示
   - 高级筛选和搜索功能
   - 批量操作支持
   - 统计图表和数据分析

### 短期优化计划 (v1.1.x - 2025年Q1)

#### 🔧 性能和用户体验优化

1. **导入体验增强**

   - 增加更多FMTC数据格式支持 (Excel, CSV)
   - 实现拖拽上传功能
   - 添加导入进度实时显示
   - 优化大批量数据导入性能

2. **品牌匹配智能化提升**

   - 增加品牌别名识别功能
   - 支持多语言品牌名称匹配
   - 机器学习辅助匹配建议
   - 批量确认匹配结果

3. **监控和通知系统增强**
   - 自定义通知模板
   - 更细粒度的阈值配置
   - 添加Slack和Discord集成
   - 数据趋势分析和预测

#### 📊 数据分析和报表功能

1. **高级统计分析**

   - 折扣使用率统计
   - 品牌表现分析报表
   - 季节性趋势分析
   - 竞争对手折扣对比

2. **自动化报表生成**
   - 每日/每周数据摘要邮件
   - 月度折扣效果分析报告
   - 数据质量评估报告
   - 系统健康状况报告

### 中期发展计划 (v1.2.x - 2025年Q2)

#### 🤖 智能化和自动化升级

1. **AI辅助数据处理**

   - 智能识别折扣类型和价值
   - 自动生成折扣描述优化
   - 异常数据自动标记
   - 智能重复检测算法

2. **高级工作流自动化**

   - 条件触发的自动化规则
   - 多级审批流程支持
   - 自动化测试和验证
   - 错误恢复机制

3. **API集成增强**
   - 支持更多联盟平台API
   - 实时数据同步功能
   - Webhook事件系统
   - 第三方工具集成接口

#### 🔍 高级功能开发

1. **折扣有效性验证**

   - 自动测试折扣码有效性
   - 链接可用性检查
   - 价格变动监控
   - 竞争对手价格对比

2. **高级筛选和搜索**
   - 全文搜索引擎集成
   - 复杂条件组合查询
   - 保存搜索配置
   - 搜索结果导出功能

### 长期愿景规划 (v2.0+ - 2025年Q3及以后)

#### 🌐 平台化和生态系统

1. **多数据源集成平台**

   - 支持多个折扣数据提供商
   - 统一的数据格式标准
   - 数据源优先级管理
   - 跨平台数据去重

2. **开放API和插件系统**

   - 完整的RESTful API
   - GraphQL查询支持
   - 插件开发框架
   - 第三方开发者文档

3. **高级分析和商业智能**
   - 实时数据大屏显示
   - 预测性分析模型
   - 个性化推荐算法
   - ROI和转化率分析

#### 🏗️ 技术架构升级

1. **微服务架构重构**

   - 服务解耦和独立部署
   - 容器化和云原生支持
   - 高可用和灾备方案
   - 自动扩缩容机制

2. **数据处理能力提升**
   - 大数据处理框架集成
   - 实时流数据处理
   - 分布式缓存系统
   - 数据湖架构支持

### 实施优先级和时间线

#### 🚀 立即执行 (当前-2025年2月)

- [x] 核心功能已完成，系统生产就绪
- [ ] 性能优化和用户体验改进
- [ ] 添加更多数据格式支持
- [ ] 增强错误处理和日志记录

#### ⏳ 短期目标 (2025年2月-4月)

- [ ] 高级统计分析功能开发
- [ ] AI辅助数据处理原型
- [ ] 移动端响应式优化
- [ ] 多语言国际化完善

#### 📈 中期目标 (2025年4月-8月)

- [ ] 智能化功能全面升级
- [ ] 第三方API集成扩展
- [ ] 高级工作流自动化
- [ ] 商业智能分析平台

#### 🔮 长期目标 (2025年8月及以后)

- [ ] 微服务架构重构
- [ ] 多租户SaaS平台化
- [ ] 全球化部署方案
- [ ] 开放生态系统建设

### 关键成功指标 (KPIs)

#### 📊 系统性能指标

- 数据导入处理速度: < 1000条/分钟
- 品牌匹配准确率: > 90%
- 系统可用性: > 99.9%
- 平均响应时间: < 200ms

#### 💼 业务价值指标

- 有效折扣数据量: > 10,000条
- 数据更新频率: 日更新
- 用户操作效率提升: > 50%
- 人工处理时间减少: > 80%

#### 🎯 用户体验指标

- 导入成功率: > 95%
- 界面响应速度: < 2秒
- 用户满意度评分: > 4.5/5.0
- 系统学习成本: < 1小时

---

_📅 最后更新: 2025年1月_  
_📋 文档版本: v1.1.0_  
_👨‍💻 维护者: TrendHub开发团队_  
_🎫 FMTC系统状态: 生产就绪 (v1.0.0) - 路线图已更新_
