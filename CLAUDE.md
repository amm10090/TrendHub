# CLAUDE.md

这个文件为Claude Code (claude.ai/code) 在此代码库中工作提供指导。

## 项目架构

TrendHub是一个基于Monorepo架构的全栈项目，使用TypeScript + Next.js技术栈，pnpm workspace和Turborepo进行项目管理。

### 应用结构

- `apps/admin/` - 管理后台应用 (端口3001) - Next.js 19 + Prisma + Auth.js
- `apps/web/` - 用户前端应用 (端口3000) - Next.js 19 + HeroUI
- `packages/ui/` - 共享UI组件库 (包含IconSelector组件)
- `packages/scraper/` - 数据抓取包 (Crawlee + Playwright)
- `packages/types/` - 类型定义包

### 数据库

- PostgreSQL + Prisma ORM
- 主要模型: Category, Brand, Product, ContentBlock, Page, User, ScraperTask

## 常用命令

### 开发

```bash
pnpm dev                    # 启动所有应用
pnpm dev:web               # 仅启动前端应用 (端口3000)
pnpm dev:admin             # 仅启动管理后台 (端口3001)
```

### 构建和部署

```bash
pnpm build                 # 构建所有应用
pnpm start                 # 启动生产模式
pnpm pm2:start:prod        # PM2生产部署
```

### 数据库操作

```bash
cd apps/admin
pnpm db:push              # 推送Prisma schema到数据库
pnpm db:seed              # 运行种子数据
```

### 代码质量

```bash
pnpm lint                 # ESLint检查
pnpm format               # Prettier格式化
```

### 测试

```bash
pnpm test                 # 运行测试 (如果有)
```

## 技术栈要点

### Admin应用 (`@trend-hub/admin`)

- Next.js 19 App Router + Server Actions
- Auth.js v5认证
- HeroUI + Radix UI + shadcn/ui组件
- TipTap富文本编辑器
- Prisma ORM数据库操作
- 国际化支持 (next-intl)

### Web应用 (`front-end`)

- Next.js 19 + Turbopack
- HeroUI组件库+shadui组件库
- 国际化路由
- 响应式设计

### 共享包特性

- `@repo/ui`: 包含可视化IconSelector组件 (基于Tabler Icons)
- `@repo/scraper`: Crawlee网页数据抓取
- `@repo/types`: TypeScript类型定义

## 开发注意事项

1. 使用pnpm作为包管理器
2. 遵循现有的TypeScript和ESLint配置
3. Admin应用需要配置数据库连接和认证
4. 代码和注释使用英文，按照项目现有代码风格
5. IconSelector组件在packages/ui中，已集成到Admin的ContentBlockForm
6. 使用Turbo运行并行构建和开发任务

## API结构

### Admin API (`/api/*`)

- `/api/admin/` - 管理员接口
- `/api/auth/` - 认证接口
- `/api/public/` - 公开接口
- `/api/products/`, `/api/brands/`, `/api/categories/` - 核心资源管理

### 认证

基于Auth.js v5，支持会话管理和角色权限控制。

## 文件上传

支持AWS S3/Cloudflare R2文件存储。
