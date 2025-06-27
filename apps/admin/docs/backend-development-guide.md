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
9. [配置管理](#配置管理)
10. [部署指南](#部署指南)
11. [开发最佳实践](#开发最佳实践)
12. [常见问题](#常见问题)

---

## 🎯 应用概述

### 应用定位

TrendHub 管理后台是一个基于 Next.js 的全栈应用，为电商平台提供完整的内容管理系统，支持产品管理、品牌管理、内容发布、爬虫任务管理等核心功能。

### 核心特性

- **🛡️ 多重认证系统**: 支持邮箱/密码、OAuth (Google/GitHub)、邮件验证登录
- **🌐 国际化支持**: 内置中英文双语支持，基于 next-intl
- **📊 数据爬虫系统**: 集成多平台电商数据爬取，支持 Mytheresa、Farfetch 等
- **💰 广告变现**: 集成 Sovrn API 商品链接货币化
- **🎨 内容管理**: 灵活的内容区块系统，支持多种布局和组件
- **📈 统计分析**: 丰富的数据统计和分析功能
- **🔧 系统设置**: 完整的系统配置和初始化功能

### 端口配置

- **开发环境**: http://localhost:3001
- **生产环境**: 根据环境变量配置

---

## 🏗️ 技术架构

### 前端技术栈

```typescript
// 核心框架
Next.js 15.3.3        // React 全栈框架，支持 App Router
React 19.1.0          // UI 组件库
TypeScript 5.8.3      // 静态类型检查

// UI 组件库
HeroUI 2.7.10         // 主要 UI 组件库
Radix UI              // 底层原子组件
shadcn/ui             // 组件样式系统
TailwindCSS 4.1.8     // CSS 框架

// 富文本编辑
TipTap 2.14.0         // 富文本编辑器
```

### 后端技术栈

```typescript
// 数据库 & ORM
PostgreSQL            // 主数据库
Prisma 6.9.0         // ORM 工具

// 认证系统
Auth.js 5.0.0-beta.28 // 认证框架
bcryptjs 3.0.2       // 密码加密

// 文件存储
AWS SDK 3.804.0      // S3/R2 文件存储
Cloudflare R2        // 图片存储服务

// 数据抓取
@repo/scraper        // 自定义爬虫包
Crawlee + Playwright // 网页抓取框架
```

### 开发工具

```typescript
// 代码质量
ESLint 9.26.0        // 代码检查
Prettier 3.5.3      // 代码格式化
TypeScript ESLint    // TS 规则检查

// 进程管理
PM2                  // 生产环境进程管理
```

---

## 📁 项目结构

### 目录架构

```
apps/admin/
├── prisma/                  # 数据库相关
│   ├── schema.prisma       # 数据库模式定义
│   └── seed.ts            # 种子数据
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── [locale]/      # 国际化路由
│   │   ├── api/           # API 路由
│   │   └── layout.tsx     # 根布局
│   ├── components/        # React 组件
│   │   ├── auth/          # 认证相关组件
│   │   ├── content-blocks/ # 内容区块组件
│   │   ├── products/      # 产品管理组件
│   │   └── ui/            # 通用 UI 组件
│   ├── hooks/             # 自定义 React Hooks
│   ├── lib/               # 核心库和工具
│   │   ├── db/            # 数据库连接
│   │   ├── services/      # 业务逻辑服务
│   │   └── utils.ts       # 工具函数
│   ├── i18n/              # 国际化配置
│   └── middleware.ts      # Next.js 中间件
├── auth.ts                # Auth.js 配置
├── next.config.js         # Next.js 配置
└── package.json           # 依赖管理
```

### 关键文件说明

#### 📋 配置文件

- `auth.ts`: Auth.js 认证配置，支持多种登录方式
- `next.config.js`: Next.js 配置，包含国际化、Turbopack 等
- `middleware.ts`: 路由中间件，处理认证和国际化
- `tailwind.config.js`: TailwindCSS 样式配置

#### 🔍 核心业务文件

- `src/lib/db/index.ts`: Prisma 数据库连接单例
- `src/lib/services/`: 各种业务逻辑服务类
- `src/app/api/`: RESTful API 端点实现

---

## 💾 数据库设计

### 数据模型架构

```mermaid
erDiagram
    User ||--o{ Session : has
    User ||--o{ Account : has

    Brand ||--o{ Product : contains
    Category ||--o{ Product : contains
    Category ||--o{ Category : parent-child

    ScraperTaskDefinition ||--o{ ScraperTaskExecution : runs
    ScraperTaskExecution ||--o{ ScraperTaskLog : generates

    ContentBlock ||--o{ ContentItem : contains
    Category ||--o{ ContentBlock : targets
```

### 核心数据模型

#### 👤 用户认证模型

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  passwordHash  String?   // 密码哈希
  accounts      Account[] // OAuth 账户
  sessions      Session[] // 用户会话
}
```

#### 🏷️ 商品管理模型

```prisma
model Product {
  id           String   @id @default(cuid())
  name         String   // 商品名称
  price        Decimal  // 当前价格
  originalPrice Decimal? // 原价
  discount     Decimal? // 折扣
  sku          String?  // 库存单位
  status       String   // 商品状态
  images       String[] // 图片列表
  colors       String[] // 颜色选项
  sizes        String[] // 尺码选项

  // 关联关系
  brandId    String
  categoryId String
  brand      Brand    @relation(fields: [brandId], references: [id])
  category   Category @relation(fields: [categoryId], references: [id])

  // 索引优化
  @@index([brandId])
  @@index([categoryId])
  @@index([status])
}
```

#### 🏢 品牌管理模型

```prisma
model Brand {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique
  description String?
  logo        String?
  website     String?
  isActive    Boolean   @default(true)
  popularity  Boolean   @default(false)
  products    Product[]

  @@index([isActive])
  @@index([popularity])
}
```

#### 📁 分类管理模型

```prisma
model Category {
  id           String      @id @default(cuid())
  name         String
  slug         String      @unique
  level        Int         // 分类层级
  parentId     String?
  isActive     Boolean     @default(true)
  showInNavbar Boolean     @default(false)

  // 自关联关系
  parent   Category?  @relation("SubCategories", fields: [parentId], references: [id])
  children Category[] @relation("SubCategories")
  products Product[]

  @@index([parentId])
  @@index([level])
  @@index([isActive])
}
```

#### 🕷️ 爬虫系统模型

```prisma
model ScraperTaskDefinition {
  id               String                 @id @default(cuid())
  name             String                 @unique
  targetSite       String                 // 目标站点
  startUrls        String[]               // 起始URL
  cronExpression   String?                // 定时表达式
  isEnabled        Boolean                @default(true)
  maxRequests      Int?                   // 最大请求数
  maxProducts      Int?                   // 最大商品数
  executions       ScraperTaskExecution[] // 执行记录
}

model ScraperTaskExecution {
  id               String             @id @default(cuid())
  status           ScraperTaskStatus  @default(IDLE)
  startedAt        DateTime?
  completedAt      DateTime?
  metrics          Json?              // 执行指标
  errorMessage     String?
  logs             ScraperTaskLog[]   // 日志记录
}
```

#### 📝 内容管理模型

```prisma
model ContentBlock {
  id                      String           @id @default(cuid())
  identifier              String           @unique
  name                    String
  type                    ContentBlockType
  isActive                Boolean          @default(true)
  data                    Json?            // 区块配置
  targetPrimaryCategoryId String?
  items                   ContentItem[]    // 内容项
}

model ContentItem {
  id             String          @id @default(cuid())
  parentId       String
  type           ContentItemType
  name           String
  data           Json            // 项目数据
  order          Int             @default(0)
  isActive       Boolean         @default(true)
  slotKey        String?         // 插槽键名
  parentBlock    ContentBlock    @relation(fields: [parentId], references: [id])
}
```

### 数据库索引策略

```sql
-- 产品查询优化
CREATE INDEX idx_product_brand_category ON Product(brandId, categoryId);
CREATE INDEX idx_product_status_active ON Product(status) WHERE isDeleted = false;
CREATE INDEX idx_product_price_range ON Product(price);

-- 分类树查询优化
CREATE INDEX idx_category_parent_level ON Category(parentId, level);
CREATE INDEX idx_category_active_navbar ON Category(isActive, showInNavbar);

-- 爬虫任务优化
CREATE INDEX idx_scraper_execution_status ON ScraperTaskExecution(status, startedAt);
CREATE INDEX idx_scraper_logs_execution ON ScraperTaskLog(executionId, timestamp);
```

---

## 🚀 API架构

### API路由结构

```
/api/
├── auth/                    # 认证相关 API
│   └── [...nextauth]/       # Auth.js 处理器
├── public/                  # 公共 API (无需认证)
│   ├── products/           # 产品查询
│   ├── brands/             # 品牌信息
│   ├── categories/         # 分类数据
│   ├── search/             # 搜索服务
│   └── content-blocks/     # 内容区块
├── admin/                   # 管理员 API (需认证)
│   ├── content-blocks/     # 内容管理
│   ├── scraper-tasks/      # 爬虫管理
│   └── stats/              # 统计数据
├── {resource}/              # 资源管理 API
│   ├── products/           # 产品 CRUD
│   ├── brands/             # 品牌 CRUD
│   └── categories/         # 分类 CRUD
├── internal/                # 内部 API
├── settings/                # 系统设置
├── upload/                  # 文件上传
└── setup/                   # 系统初始化
```

### API设计原则

#### 🔒 认证保护

```typescript
// 中间件认证检查
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 跳过公共API和认证路由
  if (pathname.startsWith("/api/public") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // 检查用户认证状态
  const isAuthenticated = isUserAuthenticated(request);
  if (!isAuthenticated) {
    return redirectToLogin(request);
  }

  return NextResponse.next();
}
```

#### 📊 统一响应格式

```typescript
// 成功响应
interface SuccessResponse<T> {
  data: T;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

// 错误响应
interface ErrorResponse {
  error: string;
  details?: unknown;
}
```

#### ✅ 数据验证

```typescript
// 使用 Zod 进行输入验证
import { z } from "zod";

const ProductCreateSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  price: z.number().positive("Price must be positive"),
  brandId: z.string().cuid("Invalid brand ID"),
  categoryId: z.string().cuid("Invalid category ID"),
  sku: z.string().optional(),
});

// API 路由中应用验证
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = ProductCreateSchema.parse(body);

    // 处理验证后的数据
    const product = await productService.createProduct(validatedData);

    return NextResponse.json({ data: product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    // 其他错误处理
  }
}
```

### 关键API端点

#### 📱 产品管理API

```typescript
// GET /api/products - 获取产品列表
interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  minPrice?: number;
  maxPrice?: number;
}

// POST /api/products - 创建产品
interface CreateProductData {
  name: string;
  price: number;
  brandId: string;
  categoryId: string;
  sku?: string;
  description?: string;
  images?: string[];
  colors?: string[];
  sizes?: string[];
}

// PUT /api/products/[id] - 更新产品
// DELETE /api/products/[id] - 删除产品
```

#### 🏷️ 品牌管理API

```typescript
// GET /api/brands - 获取品牌列表
interface BrandQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  popularity?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// POST /api/brands - 创建品牌
interface CreateBrandData {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive?: boolean;
  popularity?: boolean;
}
```

#### 🕷️ 爬虫管理API

```typescript
// GET /api/admin/scraper-tasks/definitions - 获取任务定义
// POST /api/admin/scraper-tasks/definitions - 创建任务定义
// POST /api/admin/scraper-tasks/definitions/[id]/run - 执行任务
// GET /api/admin/scraper-tasks/executions - 获取执行记录
// POST /api/admin/scraper-tasks/executions/[id]/cancel - 取消任务
```

---

## 🔐 认证系统

### Auth.js 配置架构

```typescript
// auth.ts - 认证配置
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    // 邮箱密码认证
    Credentials({
      async authorize(credentials) {
        // 预设管理员验证
        if (email === presetAdminEmail && password === presetAdminPassword) {
          return { id: "preset-admin-id", name: "预设管理员", email };
        }

        // 数据库用户验证
        const user = await db.user.findUnique({ where: { email } });
        if (user && (await bcrypt.compare(password, user.passwordHash))) {
          return { id: user.id, name: user.name, email: user.email };
        }

        return null;
      },
    }),

    // OAuth 提供商（可选）
    ...(process.env.GOOGLE_CLIENT_ID ? [Google()] : []),
    ...(process.env.GITHUB_CLIENT_ID ? [GitHub()] : []),
    ...(process.env.AUTH_RESEND_KEY ? [Resend()] : []),
  ],

  // 自定义页面
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-email",
  },

  // 回调配置
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
```

### 中间件认证

```typescript
// middleware.ts - 路由保护
function isUserAuthenticated(request: NextRequest): boolean {
  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  return !!sessionToken;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公共路径放行
  const publicPaths = ["/en/login", "/cn/login", "/en/setup", "/cn/setup"];
  if (publicPaths.includes(pathname)) {
    return intlMiddleware(request);
  }

  // 认证检查
  if (!isUserAuthenticated(request)) {
    const locale = extractLocale(pathname);
    return NextResponse.redirect(`/${locale}/login`);
  }

  return intlMiddleware(request);
}
```

### 服务端认证工具

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

```typescript
// 基础服务类模板
abstract class BaseService<T, CreateData, UpdateData> {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = db;
  }

  abstract getAll(params: QueryParams): Promise<PaginatedResponse<T>>;
  abstract getById(id: string): Promise<T | null>;
  abstract create(data: CreateData): Promise<T>;
  abstract update(id: string, data: UpdateData): Promise<T>;
  abstract delete(id: string): Promise<T>;
}
```

### 核心服务类

#### 📦 ProductService

```typescript
// lib/services/product.service.ts
class ProductService {
  // 类型转换辅助方法
  private convertPrismaToProduct(prismaProduct: any): Product {
    return {
      ...prismaProduct,
      price: parseFloat(prismaProduct.price.toString()),
      originalPrice: prismaProduct.originalPrice
        ? parseFloat(prismaProduct.originalPrice.toString())
        : null,
      discount: prismaProduct.discount
        ? parseFloat(prismaProduct.discount.toString())
        : null,
    };
  }

  // 获取产品列表（支持复杂查询）
  async getProducts(
    params: ProductQueryParams,
  ): Promise<PaginatedResponse<Product>> {
    const where: Prisma.ProductWhereInput = {
      isDeleted: false,
      ...(params.search && {
        OR: [
          { name: { contains: params.search, mode: "insensitive" } },
          { sku: { contains: params.search, mode: "insensitive" } },
          { brand: { name: { contains: params.search, mode: "insensitive" } } },
        ],
      }),
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.brandId && { brandId: params.brandId }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { brand: true, category: true },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { [params.sortBy]: params.sortOrder },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: products.map(this.convertPrismaToProduct),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  // 创建产品（含业务验证）
  async createProduct(data: CreateProductData): Promise<Product> {
    // 业务逻辑验证
    if (!data.name?.trim()) throw new Error("Product name is required");
    if (!data.brandId) throw new Error("Brand is required");
    if (!data.categoryId) throw new Error("Category is required");

    // 验证品牌和分类存在性
    const [brand, category] = await Promise.all([
      this.prisma.brand.findUnique({ where: { id: data.brandId } }),
      this.prisma.category.findUnique({ where: { id: data.categoryId } }),
    ]);

    if (!brand) throw new Error(`Brand ID '${data.brandId}' not found`);
    if (!category)
      throw new Error(`Category ID '${data.categoryId}' not found`);

    // SKU 唯一性检查
    if (data.sku) {
      const existingSku = await this.prisma.product.findFirst({
        where: { sku: data.sku },
      });
      if (existingSku) throw new Error(`SKU '${data.sku}' already exists`);
    }

    // 创建产品
    const product = await this.prisma.product.create({
      data: {
        ...data,
        price: new Decimal(data.price),
        brand: { connect: { id: data.brandId } },
        category: { connect: { id: data.categoryId } },
      },
      include: { brand: true, category: true },
    });

    return this.convertPrismaToProduct(product);
  }
}

export const productService = new ProductService();
```

#### 🏷️ BrandService

```typescript
// lib/services/brand.service.ts
class BrandService {
  // 获取品牌列表（支持搜索和筛选）
  async getBrands(params: BrandQueryParams): Promise<PaginatedResponse<Brand>> {
    const where: Prisma.BrandWhereInput = {
      ...(params.search && {
        OR: [
          { name: { contains: params.search, mode: "insensitive" } },
          { description: { contains: params.search, mode: "insensitive" } },
        ],
      }),
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.popularity !== undefined && { popularity: params.popularity }),
    };

    const [brands, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { [params.sortBy]: params.sortOrder },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          website: true,
          isActive: true,
          popularity: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { products: true } },
        },
      }),
      this.prisma.brand.count({ where }),
    ]);

    return {
      items: brands.map((brand) => ({
        ...brand,
        productCount: brand._count.products,
      })),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  // 创建品牌（含唯一性验证）
  async createBrand(data: CreateBrandData): Promise<Brand> {
    // 验证必填字段
    if (!data.name?.trim()) throw new Error("Brand name is required");
    if (!data.slug?.trim()) throw new Error("Brand slug is required");

    // 检查名称和 slug 唯一性
    const [existingName, existingSlug] = await Promise.all([
      this.prisma.brand.findUnique({ where: { name: data.name } }),
      this.prisma.brand.findUnique({ where: { slug: data.slug } }),
    ]);

    if (existingName)
      throw new Error(`Brand name '${data.name}' already exists`);
    if (existingSlug)
      throw new Error(`Brand slug '${data.slug}' already exists`);

    return this.prisma.brand.create({
      data: {
        ...data,
        isActive: data.isActive ?? true,
        popularity: data.popularity ?? false,
      },
    });
  }

  // 批量操作
  async updateBrandsStatus(ids: string[], isActive: boolean): Promise<number> {
    const result = await this.prisma.brand.updateMany({
      where: { id: { in: ids } },
      data: { isActive },
    });
    return result.count;
  }
}

export const brandService = new BrandService();
```

#### 📁 CategoryService

```typescript
// lib/services/category.service.ts
class CategoryService {
  // 获取分类树结构
  async getCategoryTree(): Promise<CategoryTreeNode[]> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });

    const buildTree = (
      items: typeof categories,
      parentId: string | null = null,
      level: number = 1,
    ): CategoryTreeNode[] => {
      return items
        .filter((item) => item.parentId === parentId && item.level === level)
        .map((item) => ({
          ...item,
          children: buildTree(items, item.id, level + 1),
        }));
    };

    return buildTree(categories);
  }

  // 创建分类（含层级验证）
  async createCategory(data: CreateCategoryData): Promise<Category> {
    // 父分类验证
    if (data.parentId) {
      const parentCategory = await this.getCategory(data.parentId);
      if (!parentCategory) throw new Error("Parent category not found");
      if (parentCategory.level >= data.level) {
        throw new Error("Child category level must be greater than parent");
      }
    } else if (data.level !== 1) {
      throw new Error("Top-level category must have level 1");
    }

    return this.prisma.category.create({
      data: {
        ...data,
        isActive: data.isActive ?? true,
        parentId: data.level === 1 ? null : data.parentId,
      },
    });
  }

  // 删除分类（含依赖检查）
  async deleteCategory(id: string): Promise<Category> {
    // 检查子分类
    const hasChildren = await this.prisma.category.findFirst({
      where: { parentId: id },
    });
    if (hasChildren) throw new Error("Cannot delete category with children");

    // 检查关联产品
    const hasProducts = await this.prisma.product.findFirst({
      where: { categoryId: id },
    });
    if (hasProducts) throw new Error("Cannot delete category with products");

    return this.prisma.category.delete({ where: { id } });
  }
}

export const categoryService = new CategoryService();
```

#### 🤖 TaskExecutor（爬虫任务执行器）

```typescript
// lib/services/task-executor.ts
class TaskExecutor {
  private static instance: TaskExecutor;

  public static getInstance(): TaskExecutor {
    if (!TaskExecutor.instance) {
      TaskExecutor.instance = new TaskExecutor();
    }
    return TaskExecutor.instance;
  }

  // 执行爬虫任务
  async executeTask(executionId: string): Promise<void> {
    const execution = await db.scraperTaskExecution.update({
      where: { id: executionId },
      data: { status: ScraperTaskStatus.RUNNING, startedAt: new Date() },
      include: { taskDefinition: true },
    });

    try {
      const { taskDefinition } = execution;
      const scraperOptions: ScraperOptions = {
        maxRequests: taskDefinition.maxRequests ?? undefined,
        maxProducts: taskDefinition.maxProducts ?? undefined,
      };

      // 根据目标站点选择爬虫
      const scraperMap = {
        Mytheresa: mytheresaScraper,
        Farfetch: farfetchScraper,
        Italist: italistScraper,
      };

      const scraperFn = scraperMap[taskDefinition.targetSite];
      if (!scraperFn) {
        throw new Error(`Unsupported site: ${taskDefinition.targetSite}`);
      }

      // 执行爬取
      const products = await scraperFn(
        taskDefinition.startUrls,
        scraperOptions,
        executionId,
      );

      // 保存产品数据
      const saveResults = await this.saveScrapedProducts(
        executionId,
        products,
        taskDefinition.targetSite,
        taskDefinition.defaultInventory,
      );

      // 更新执行状态
      await db.scraperTaskExecution.update({
        where: { id: executionId },
        data: {
          status: ScraperTaskStatus.COMPLETED,
          completedAt: new Date(),
          metrics: {
            productsFound: products.length,
            productsSaved: saveResults.savedCount,
            errors: saveResults.errorCount,
          },
        },
      });
    } catch (error) {
      await db.scraperTaskExecution.update({
        where: { id: executionId },
        data: {
          status: ScraperTaskStatus.FAILED,
          completedAt: new Date(),
          errorMessage: error.message,
        },
      });
    }
  }

  // 保存爬取的产品数据
  private async saveScrapedProducts(
    executionId: string,
    products: ScrapedProduct[],
    sourceSite: string,
    defaultInventory: number,
  ): Promise<{ savedCount: number; errorCount: number }> {
    let savedCount = 0;
    let errorCount = 0;

    for (const productData of products) {
      try {
        // 获取或创建品牌
        const brandId = await this.getOrCreateBrandId(productData.brand);

        // 获取或创建分类
        const categoryId = await this.getOrCreateCategoryId(
          productData.breadcrumbs,
          productData.brand,
        );

        // 创建产品数据
        await db.product.upsert({
          where: { url_source: { url: productData.url, source: sourceSite } },
          create: {
            name: productData.name,
            url: productData.url,
            source: sourceSite,
            price: new Decimal(productData.currentPrice.amount),
            images: productData.images,
            brand: { connect: { id: brandId } },
            category: { connect: { id: categoryId } },
            inventory: defaultInventory,
            status: "Available",
          },
          update: {
            name: productData.name,
            price: new Decimal(productData.currentPrice.amount),
            images: productData.images,
          },
        });

        savedCount++;
      } catch (error) {
        errorCount++;
        await this.log(
          executionId,
          "ERROR",
          `Failed to save product: ${error.message}`,
        );
      }
    }

    return { savedCount, errorCount };
  }
}

export const taskExecutor = TaskExecutor.getInstance();
```

### 💰 SovrnService（广告变现）

```typescript
// lib/services/sovrn.service.ts
interface SovrnUrlParams {
  url: string;
  cuid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export async function monetizeUrl(
  params: SovrnUrlParams,
): Promise<MonetizedUrlResult> {
  try {
    // 从数据库获取API Key
    const apiKey = await getSovrnApiKey();
    if (!apiKey) {
      throw new Error("SOVRN API Key not configured");
    }

    // 构建货币化URL
    const queryParams = new URLSearchParams({
      key: apiKey,
      u: params.url,
    });

    // 添加可选参数
    if (params.cuid) queryParams.append("cuid", params.cuid);
    if (params.utm_source) queryParams.append("utm_source", params.utm_source);

    const monetizedUrl = `https://redirect.viglink.com?${queryParams.toString()}`;

    return { success: true, monetizedUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 批量处理URL货币化
export async function monetizeUrlsBatch(
  urls: string[],
  defaultParams?: Omit<SovrnUrlParams, "url">,
): Promise<Map<string, MonetizedUrlResult>> {
  const results = new Map();
  const batchSize = 10;

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const promises = batch.map((url) =>
      monetizeUrl({ ...defaultParams, url }).then((result) => ({
        url,
        result,
      })),
    );

    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ url, result }) => results.set(url, result));

    // 避免 rate limiting
    if (i + batchSize < urls.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
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
// components/content-blocks/ContentBlockForm.tsx
interface ContentBlockFormData {
  name: string;
  identifier: string;
  type: ContentBlockType;
  description?: string;
  targetPrimaryCategoryId?: string;
  isActive: boolean;
  data?: Record<string, any>;
  items: ContentItemFormData[];
}

// 内容区块表单组件
export function ContentBlockForm({ initialData }: { initialData?: ContentBlock }) {
  const [formData, setFormData] = useState<ContentBlockFormData>({
    name: initialData?.name || "",
    identifier: initialData?.identifier || "",
    type: initialData?.type || ContentBlockType.BANNER,
    isActive: initialData?.isActive ?? true,
    items: initialData?.items || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (initialData) {
        await updateContentBlock(initialData.id, formData);
      } else {
        await createContentBlock(formData);
      }

      toast.success("Content block saved successfully");
      router.push("/content-management");
    } catch (error) {
      toast.error("Failed to save content block");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基础信息字段 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Block Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>

        <div>
          <Label htmlFor="identifier">Identifier</Label>
          <Input
            id="identifier"
            value={formData.identifier}
            onChange={(e) => setFormData({...formData, identifier: e.target.value})}
            required
          />
        </div>
      </div>

      {/* 内容项管理 */}
      <ContentItemsManager
        items={formData.items}
        onItemsChange={(items) => setFormData({...formData, items})}
        blockType={formData.type}
      />

      <Button type="submit">Save Content Block</Button>
    </form>
  );
}
```

### 🕷️ 爬虫管理系统

#### 爬虫任务定义

```typescript
// components/scraper-management/scraper-task-definition-form.tsx
interface ScraperTaskDefinitionFormData {
  name: string;
  description?: string;
  targetSite: ECommerceSite;
  startUrls: string[];
  cronExpression?: string;
  isEnabled: boolean;
  maxRequests?: number;
  maxLoadClicks?: number;
  maxProducts?: number;
  defaultInventory: number;
  isDebugModeEnabled: boolean;
}

export function ScraperTaskDefinitionForm() {
  const [formData, setFormData] = useState<ScraperTaskDefinitionFormData>({
    name: "",
    targetSite: "Mytheresa",
    startUrls: [""],
    isEnabled: true,
    defaultInventory: 99,
    isDebugModeEnabled: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createScraperTaskDefinition(formData);
      toast.success("Scraper task created successfully");
    } catch (error) {
      toast.error("Failed to create scraper task");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基础配置 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Task Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>

        <div>
          <Label htmlFor="targetSite">Target Site</Label>
          <Select
            value={formData.targetSite}
            onValueChange={(value: ECommerceSite) =>
              setFormData({...formData, targetSite: value})
            }
          >
            <SelectItem value="Mytheresa">Mytheresa</SelectItem>
            <SelectItem value="Farfetch">Farfetch</SelectItem>
            <SelectItem value="Italist">Italist</SelectItem>
          </Select>
        </div>
      </div>

      {/* URL 配置 */}
      <div>
        <Label>Start URLs</Label>
        <UrlListManager
          urls={formData.startUrls}
          onUrlsChange={(urls) => setFormData({...formData, startUrls: urls})}
        />
      </div>

      {/* 高级配置 */}
      <Collapsible>
        <CollapsibleTrigger>Advanced Settings</CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="maxRequests">Max Requests</Label>
              <Input
                id="maxRequests"
                type="number"
                value={formData.maxRequests || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  maxRequests: e.target.value ? parseInt(e.target.value) : undefined
                })}
              />
            </div>

            <div>
              <Label htmlFor="maxProducts">Max Products</Label>
              <Input
                id="maxProducts"
                type="number"
                value={formData.maxProducts || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  maxProducts: e.target.value ? parseInt(e.target.value) : undefined
                })}
              />
            </div>

            <div>
              <Label htmlFor="defaultInventory">Default Inventory</Label>
              <Input
                id="defaultInventory"
                type="number"
                value={formData.defaultInventory}
                onChange={(e) => setFormData({
                  ...formData,
                  defaultInventory: parseInt(e.target.value) || 99
                })}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDebugModeEnabled"
              checked={formData.isDebugModeEnabled}
              onCheckedChange={(checked) =>
                setFormData({...formData, isDebugModeEnabled: !!checked})
              }
            />
            <Label htmlFor="isDebugModeEnabled">Enable Debug Mode</Label>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Button type="submit">Create Task</Button>
    </form>
  );
}
```

#### 任务执行监控

```typescript
// components/scraper-management/scraper-task-executions-tab.tsx
export function ScraperTaskExecutionsTab() {
  const [executions, setExecutions] = useState<ScraperTaskExecution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExecutions();

    // 设置自动刷新
    const interval = setInterval(fetchExecutions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchExecutions = async () => {
    try {
      const response = await fetch("/api/admin/scraper-tasks/executions");
      const data = await response.json();
      setExecutions(data.data);
    } catch (error) {
      console.error("Failed to fetch executions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelExecution = async (executionId: string) => {
    try {
      await fetch(`/api/admin/scraper-tasks/executions/${executionId}/cancel`, {
        method: "POST",
      });

      toast.success("Execution cancelled");
      fetchExecutions();
    } catch (error) {
      toast.error("Failed to cancel execution");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Task Executions</h3>
        <Button onClick={fetchExecutions} variant="outline" size="sm">
          <RefreshIcon className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Metrics</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {executions.map((execution) => (
            <TableRow key={execution.id}>
              <TableCell>{execution.taskDefinition.name}</TableCell>
              <TableCell>
                <StatusBadge status={execution.status} />
              </TableCell>
              <TableCell>
                {execution.startedAt
                  ? formatDateTime(execution.startedAt)
                  : "Not started"
                }
              </TableCell>
              <TableCell>
                {execution.startedAt && execution.completedAt
                  ? formatDuration(execution.startedAt, execution.completedAt)
                  : execution.startedAt
                  ? formatDuration(execution.startedAt, new Date())
                  : "-"
                }
              </TableCell>
              <TableCell>
                <ExecutionMetrics metrics={execution.metrics} />
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => router.push(`/scraper-management/logs/${execution.id}`)}
                    variant="outline"
                    size="sm"
                  >
                    View Logs
                  </Button>

                  {execution.status === "RUNNING" && (
                    <Button
                      onClick={() => handleCancelExecution(execution.id)}
                      variant="destructive"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### 📊 统计分析系统

#### 数据统计API

```typescript
// app/api/admin/stats/products-per-brand/route.ts
export async function GET() {
  try {
    const stats = await db.brand.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        products: { _count: "desc" },
      },
      take: 10,
    });

    const chartData = stats.map((brand) => ({
      name: brand.name,
      count: brand._count.products,
    }));

    return NextResponse.json({ data: chartData });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch brand statistics" },
      { status: 500 },
    );
  }
}

// app/api/admin/stats/products-per-category/route.ts
export async function GET() {
  try {
    const stats = await db.category.findMany({
      where: { level: 1 }, // 只统计一级分类
      select: {
        id: true,
        name: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        products: { _count: "desc" },
      },
    });

    const chartData = stats.map((category) => ({
      name: category.name,
      count: category._count.products,
    }));

    return NextResponse.json({ data: chartData });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch category statistics" },
      { status: 500 },
    );
  }
}
```

#### 仪表板分析组件

```typescript
// components/dashboard-analytics.tsx
export function DashboardAnalytics() {
  const [brandStats, setBrandStats] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats/products-per-brand").then(r => r.json()),
      fetch("/api/admin/stats/products-per-category").then(r => r.json()),
    ]).then(([brandData, categoryData]) => {
      setBrandStats(brandData.data);
      setCategoryStats(categoryData.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <AnalyticsSkeleton />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 品牌产品统计 */}
      <Card>
        <CardHeader>
          <CardTitle>Products per Brand</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={brandStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 分类产品统计 */}
      <Card>
        <CardHeader>
          <CardTitle>Products per Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {categoryStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## ⚙️ 配置管理

### 环境变量配置

```bash
# .env.local - 本地开发环境配置

# === 数据库配置 ===
DATABASE_URL="postgresql://username:password@localhost:5432/trendhub_db"

# === 认证配置 ===
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-super-secret-key-here"

# 预设管理员账户（开发/演示用）
PRESET_ADMIN_EMAIL="admin@example.com"
PRESET_ADMIN_PASSWORD="admin123"

# === OAuth 认证提供商（可选）===
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-client-secret"

# === 邮件服务（可选）===
AUTH_RESEND_KEY="re_your-resend-api-key"
EMAIL_FROM="noreply@yourdomain.com"

# === 文件存储配置 ===
# Cloudflare R2 配置
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="trendhub-images"
R2_PUBLIC_URL="https://images.yourdomain.com"

# AWS S3 配置（备选）
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
S3_BUCKET_NAME="trendhub-s3-bucket"

# === 广告变现配置 ===
SOVRN_API_KEY="your-sovrn-api-key"

# === 爬虫配置 ===
CRAWLEE_STORAGE_DIR="./storage"
CRAWLEE_PURGE_ON_START="true"

# === 开发配置 ===
NODE_ENV="development"
NEXT_PUBLIC_ALLOWED_DEV_ORIGINS='["192.168.1.100", "10.0.0.5"]'
```

### 生产环境配置

```bash
# .env.production - 生产环境配置

# === 基础配置 ===
NODE_ENV="production"
NEXTAUTH_URL="https://admin.yourdomain.com"
NEXTAUTH_SECRET="production-super-secret-key"

# === 数据库配置 ===
DATABASE_URL="postgresql://prod_user:prod_password@db.yourdomain.com:5432/trendhub_prod"

# === 安全配置 ===
# 生产环境不建议使用预设管理员
# PRESET_ADMIN_EMAIL=""
# PRESET_ADMIN_PASSWORD=""

# === 文件存储配置 ===
R2_ACCOUNT_ID="prod-cloudflare-account-id"
R2_ACCESS_KEY_ID="prod-r2-access-key"
R2_SECRET_ACCESS_KEY="prod-r2-secret-key"
R2_BUCKET_NAME="trendhub-prod-images"
R2_PUBLIC_URL="https://cdn.yourdomain.com"

# === 监控和日志 ===
CRAWLEE_STORAGE_DIR="/app/storage"
CRAWLEE_PURGE_ON_START="false"
```

### 系统设置数据库配置

```typescript
// 系统设置存储在数据库中，支持动态修改
interface SiteSetting {
  id: string;
  key: string; // 配置键名
  value: string; // 配置值
  category: string; // 配置分类
  updatedAt: Date;
  createdAt: Date;
}

// 常用系统设置
const commonSettings = [
  // 基础设置
  { key: "siteName", value: "TrendHub Admin", category: "general" },
  {
    key: "siteDescription",
    value: "E-commerce Management Platform",
    category: "general",
  },
  { key: "defaultLanguage", value: "en", category: "general" },

  // API设置
  { key: "sovrnApiKey", value: "", category: "monetization" },
  { key: "defaultProductInventory", value: "99", category: "products" },

  // 爬虫设置
  { key: "scraperMaxRequests", value: "1000", category: "scraper" },
  { key: "scraperDefaultInterval", value: "24", category: "scraper" },

  // 文件存储设置
  { key: "maxImageSize", value: "5242880", category: "files" }, // 5MB
  { key: "allowedImageTypes", value: "jpeg,png,gif,webp", category: "files" },
];
```

### 配置服务类

```typescript
// lib/services/settings-service.ts
class SettingsService {
  async getSetting(key: string): Promise<string | null> {
    const setting = await db.siteSetting.findUnique({
      where: { key },
    });
    return setting?.value || null;
  }

  async setSetting(
    key: string,
    value: string,
    category: string = "general",
  ): Promise<void> {
    await db.siteSetting.upsert({
      where: { key },
      create: { key, value, category },
      update: { value },
    });
  }

  async getSettingsByCategory(category: string): Promise<SiteSetting[]> {
    return db.siteSetting.findMany({
      where: { category },
      orderBy: { key: "asc" },
    });
  }

  async getAllSettings(): Promise<Record<string, string>> {
    const settings = await db.siteSetting.findMany();
    return settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }
}

export const settingsService = new SettingsService();
```

---

## 🚀 部署指南

### 开发环境部署

#### 1. 环境准备

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入实际配置

# 设置数据库
pnpm db:push
pnpm db:seed
```

#### 2. 启动开发服务器

```bash
# 启动后端应用（端口 3001）
pnpm dev

# 或启动所有应用
pnpm dev:all
```

### 生产环境部署

#### 1. 使用 PM2 部署

```bash
# 构建应用
pnpm build

# PM2 生产部署
pnpm pm2:start:prod

# 查看状态
pnpm pm2:status

# 查看日志
pnpm pm2:logs
```

#### 2. Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# 安装依赖
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g pnpm && pnpm build

# 运行时镜像
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

```yaml
# docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: trendhub_db
      POSTGRES_USER: trendhub_user
      POSTGRES_PASSWORD: trendhub_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  admin:
    build: .
    environment:
      DATABASE_URL: postgresql://trendhub_user:trendhub_password@postgres:5432/trendhub_db
      NEXTAUTH_URL: http://localhost:3001
      NEXTAUTH_SECRET: your-production-secret
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    volumes:
      - storage_data:/app/storage

volumes:
  postgres_data:
  storage_data:
```

#### 3. 云服务部署

**Vercel 部署**

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel

# 配置环境变量
vercel env add DATABASE_URL
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
```

**Railway 部署**

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录并部署
railway login
railway init
railway up
```

### 数据库迁移

```bash
# 生产环境数据库迁移
npx prisma migrate deploy

# 生产环境种子数据（谨慎使用）
npx prisma db seed
```

### 监控和日志

```bash
# PM2 监控
pm2 monit

# 应用日志
pm2 logs trend-hub-admin

# 系统资源监控
pm2 status
```

---

## 🛠️ 开发最佳实践

### 代码规范

#### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
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
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

#### ESLint 配置

```javascript
// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/prefer-const": "error",
      "prefer-const": "off",
      "no-unused-vars": "off",
    },
  },
];

export default eslintConfig;
```

### 数据库最佳实践

#### 1. 查询优化

```typescript
// 避免 N+1 查询问题
const products = await db.product.findMany({
  include: {
    brand: true,
    category: true,
  },
});

// 使用索引优化查询
const activeProducts = await db.product.findMany({
  where: {
    isDeleted: false, // 利用索引
    status: "Available", // 利用索引
  },
  orderBy: {
    createdAt: "desc",
  },
});

// 使用分页避免大量数据加载
const paginatedProducts = await db.product.findMany({
  skip: (page - 1) * limit,
  take: limit,
  where: conditions,
});
```

#### 2. 事务处理

```typescript
// 使用事务确保数据一致性
await db.$transaction(async (tx) => {
  // 创建品牌
  const brand = await tx.brand.create({
    data: brandData,
  });

  // 创建关联产品
  await tx.product.create({
    data: {
      ...productData,
      brandId: brand.id,
    },
  });
});
```

#### 3. 数据验证

```typescript
// 服务层验证
class ProductService {
  async createProduct(data: CreateProductData): Promise<Product> {
    // 输入验证
    if (!data.name?.trim()) {
      throw new Error("Product name is required");
    }

    // 业务规则验证
    if (data.price <= 0) {
      throw new Error("Price must be positive");
    }

    // 外键约束验证
    const brand = await this.prisma.brand.findUnique({
      where: { id: data.brandId },
    });
    if (!brand) {
      throw new Error("Invalid brand ID");
    }

    // 执行创建
    return this.prisma.product.create({ data });
  }
}
```

### API 设计最佳实践

#### 1. 错误处理

```typescript
// 统一错误处理
export async function GET(request: Request) {
  try {
    const data = await someService.getData();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("API Error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: "Resource not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
```

#### 2. 输入验证

```typescript
// 使用 Zod 进行严格的输入验证
const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  brandId: z.string().cuid(),
  categoryId: z.string().cuid(),
  sku: z.string().optional(),
  description: z.string().max(1000).optional(),
  images: z.array(z.string().url()).optional(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = CreateProductSchema.parse(body);

    const product = await productService.createProduct(validatedData);
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 },
      );
    }
    throw error;
  }
}
```

#### 3. 响应格式标准化

```typescript
// 统一响应格式接口
interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

// 响应工具函数
export function successResponse<T>(
  data: T,
  pagination?: ApiResponse<T>["pagination"],
): Response {
  return NextResponse.json({ data, pagination });
}

export function errorResponse(
  error: string,
  code: string = "ERROR",
  status: number = 400,
): Response {
  return NextResponse.json({ error, code }, { status });
}
```

### 性能优化

#### 1. 数据库查询优化

```typescript
// 使用 select 减少数据传输
const products = await db.product.findMany({
  select: {
    id: true,
    name: true,
    price: true,
    images: true,
    brand: {
      select: {
        id: true,
        name: true,
      },
    },
  },
});

// 使用游标分页处理大数据集
const products = await db.product.findMany({
  take: 20,
  skip: 1, // 跳过游标
  cursor: {
    id: lastProductId,
  },
  orderBy: {
    id: "asc",
  },
});
```

#### 2. 图片处理优化

```typescript
// 图片上传前压缩和验证
export async function uploadImage(file: File): Promise<string> {
  // 文件大小验证
  if (file.size > 5 * 1024 * 1024) {
    // 5MB
    throw new Error("File size too large");
  }

  // 文件类型验证
  if (!isValidImageType(file.type)) {
    throw new Error("Invalid file type");
  }

  // 图片压缩（如果需要）
  const compressedBuffer = await compressImage(
    Buffer.from(await file.arrayBuffer()),
    { quality: 80, maxWidth: 1200 },
  );

  // 上传到云存储
  return uploadImageToR2(compressedBuffer, file.name, file.type);
}
```

#### 3. 缓存策略

```typescript
// 简单内存缓存
class CacheService {
  private cache = new Map<string, { data: any; expiry: number }>();

  set(key: string, data: any, ttl: number = 300000): void {
    // 默认5分钟
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached || Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }
}

const cache = new CacheService();

// 在服务中使用缓存
export async function getPopularBrands(): Promise<Brand[]> {
  const cacheKey = "popular-brands";
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const brands = await db.brand.findMany({
    where: { popularity: true },
    orderBy: { name: "asc" },
  });

  cache.set(cacheKey, brands, 600000); // 缓存10分钟
  return brands;
}
```

### 安全最佳实践

#### 1. 输入sanitization

```typescript
import DOMPurify from "isomorphic-dompurify";

// 清理 HTML 内容
export function sanitizeHtml(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li"],
    ALLOWED_ATTR: [],
  });
}

// API 中使用
export async function POST(request: Request) {
  const { content } = await request.json();
  const sanitizedContent = sanitizeHtml(content);

  // 使用清理后的内容
  await db.page.create({
    data: {
      content: sanitizedContent,
    },
  });
}
```

#### 2. 权限验证

```typescript
// 权限检查中间件
export async function requireAuth(request: Request): Promise<User | null> {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Authentication required");
  }

  return session.user;
}

// 在 API 路由中使用
export async function POST(request: Request) {
  const user = await requireAuth(request);

  // 继续处理已认证的请求
  const data = await request.json();
  // ...
}
```

#### 3. 环境变量安全

```typescript
// 环境变量验证
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
});

// 应用启动时验证
try {
  envSchema.parse(process.env);
} catch (error) {
  console.error("Invalid environment variables:", error);
  process.exit(1);
}
```

---

## ❓ 常见问题

### 🔧 开发环境问题

#### Q1: Prisma 连接数据库失败

```bash
# 问题：PrismaClientInitializationError: Can't reach database server
# 解决方案：
1. 检查数据库是否运行
sudo service postgresql start  # Linux
brew services start postgresql  # macOS

2. 验证数据库连接字符串
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

3. 测试数据库连接
pnpm db:test
```

#### Q2: Auth.js 认证问题

```bash
# 问题：NextAuth session 获取失败
# 解决方案：
1. 检查环境变量
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-key"

2. 清理浏览器cookies
清除 localhost:3001 的所有cookies

3. 重启开发服务器
pnpm dev
```

#### Q3: 图片上传失败

```bash
# 问题：R2 配置错误或文件大小超限
# 解决方案：
1. 验证R2配置
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"

2. 检查文件大小限制（默认5MB）
# 在 imageService.ts 中修改限制

3. 确认bucket权限设置正确
```

### 🚀 部署相关问题

#### Q4: PM2 部署失败

```bash
# 问题：PM2 进程启动失败
# 解决方案：
1. 检查构建是否成功
pnpm build

2. 验证生产环境变量
cat .env.production

3. 查看PM2日志
pm2 logs trend-hub-admin

4. 重新启动应用
pm2 restart trend-hub-admin
```

#### Q5: 数据库迁移问题

```bash
# 问题：生产环境数据库迁移失败
# 解决方案：
1. 备份生产数据库
pg_dump -h host -U user -d database > backup.sql

2. 使用migrate deploy而不是db push
npx prisma migrate deploy

3. 检查迁移状态
npx prisma migrate status
```

### 🔒 认证和权限问题

#### Q6: OAuth 登录失败

```bash
# 问题：Google/GitHub OAuth 重定向错误
# 解决方案：
1. 检查OAuth配置
GOOGLE_CLIENT_ID="correct-client-id"
GOOGLE_CLIENT_SECRET="correct-client-secret"

2. 验证重定向URI设置
在OAuth提供商控制台添加：
http://localhost:3001/api/auth/callback/google

3. 确认域名匹配
生产环境需要使用正确的域名
```

### 🕷️ 爬虫相关问题

#### Q7: 爬虫任务执行失败

```bash
# 问题：爬虫任务状态一直显示RUNNING
# 解决方案：
1. 检查存储目录权限
chmod 755 ./storage

2. 查看任务日志
在管理面板中查看执行日志

3. 手动取消任务
使用管理面板的取消功能

4. 检查目标网站是否可访问
curl -I https://www.mytheresa.com
```

#### Q8: 产品数据导入错误

```bash
# 问题：爬取的产品数据格式不匹配
# 解决方案：
1. 检查品牌和分类是否存在
确保目标品牌和分类已在系统中创建

2. 验证价格数据格式
确保价格为有效数字

3. 检查必填字段
name, price, brandId, categoryId都不能为空
```

### 📊 性能相关问题

#### Q9: 数据库查询慢

```bash
# 问题：产品列表加载缓慢
# 解决方案：
1. 添加数据库索引
CREATE INDEX idx_product_brand_category ON Product(brandId, categoryId);

2. 优化查询条件
使用select只获取需要的字段

3. 实现分页
确保使用skip和take限制查询结果
```

#### Q10: 内存使用过高

```bash
# 问题：Node.js进程内存使用过高
# 解决方案：
1. 检查内存泄漏
使用Node.js内存分析工具

2. 优化数据库连接
确保正确关闭数据库连接

3. 调整PM2配置
max_memory_restart: '1G'
```

### 🔧 故障排除工具

#### 日志分析

```bash
# 查看应用日志
pm2 logs trend-hub-admin --lines 100

# 查看系统资源使用
pm2 monit

# 数据库连接测试
npx prisma studio
```

#### 健康检查

```bash
# API健康检查
curl http://localhost:3001/api/setup/status

# 数据库健康检查
curl http://localhost:3001/api/setup/test-db
```

#### 性能监控

```bash
# 查看进程状态
pm2 status

# 查看内存使用
ps aux | grep node

# 查看端口占用
lsof -i :3001
```

---

## 📚 技术参考

### 官方文档链接

- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [Auth.js 文档](https://authjs.dev)
- [HeroUI 文档](https://heroui.com)
- [TailwindCSS 文档](https://tailwindcss.com/docs)

### 相关技术博客

- [Next.js App Router 最佳实践](https://nextjs.org/docs/app/building-your-application)
- [Prisma 性能优化指南](https://www.prisma.io/docs/guides/performance-and-optimization)
- [TypeScript 最佳实践](https://typescript-eslint.io/docs/)

---

## 📝 版本历史

### v1.1.0 (当前版本)

- ✅ 完善的认证系统 (Auth.js v5)
- ✅ 多平台电商数据爬取
- ✅ 内容管理系统
- ✅ 产品和品牌管理
- ✅ 图片上传和存储
- ✅ 国际化支持
- ✅ 统计分析功能

### 计划功能 (v1.2.0)

- 🔄 实时数据同步
- 🔄 高级搜索和筛选
- 🔄 批量导入/导出
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

---

## 📧 支持和联系

如有技术问题或功能建议，请通过以下方式联系：

- 📧 Email: support@trendhub.com
- 💬 GitHub Issues: [项目Issues页面]
- 📖 文档: [在线文档地址]

---

_📅 最后更新: 2025年1月_
_📋 文档版本: v1.1.0_
_👨‍💻 维护者: TrendHub开发团队_
