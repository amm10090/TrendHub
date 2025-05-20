# TrendHub 管理后台认证功能

## 项目概述

为 TrendHub 项目的管理后台实现认证功能，旨在保护管理后台的各类操作和数据，确保只有经过授权的管理员才能访问。核心认证功能包括用户登录、用户退出、会话管理以及路由保护。

## 目标用户

TrendHub 项目的管理员。他们需要一个安全、可靠的方式来访问和管理后台数据及各项配置。

## 技术选型

- **认证库**: Auth.js (NextAuth.js v5)
  - **理由**: 社区广泛使用，与 Next.js (尤其是 App Router) 深度集成，支持多种认证策略（OAuth, Credentials, Email等），有良好的数据库适配器生态（包括 Prisma）。
- **数据库适配器**: Prisma Adapter for Auth.js (`@auth/prisma-adapter`)
  - **理由**: 项目已使用 Prisma 和 PostgreSQL，此适配器能无缝集成。
- **前端框架**: Next.js (App Router, TypeScript) - 项目现有技术栈。
- **后端/API**: Next.js API Routes (TypeScript) - 项目现有技术栈，Auth.js 天然支持。
- **数据库**: PostgreSQL - 项目现有技术栈。
- **部署**: Vercel - 项目现有技术栈。
- **代码规范**: ESLint - 项目现有技术栈。
- **密码处理** (如果使用 Credentials Provider): 推荐使用如 `bcryptjs` 或 `argon2` 库进行密码哈希和验证。
  - **理由**: 安全存储用户密码至关重要。
- **表单处理与验证** (登录表单等): React Hook Form 配合 Zod。
  - **理由**: 提供强大的表单状态管理和声明式验证。项目已包含这些依赖。

## 页面/组件结构

| 名称                | 状态    | 备注                                  |
| :------------------ | :------ | :------------------------------------ |
| 登录页面            | ✅ 完成 | `app/[locale]/login/page.tsx`         |
| (受保护的)布局      | ✅ 完成 | `app/[locale]/(protected)/layout.tsx` |
| 用户菜单/头像组件   | ✅ 完成 | `components/navbar-actions.tsx`       |
| Auth.js 配置文件    | ✅ 完成 | `auth.ts`                             |
| API 路由 (Auth.js)  | ✅ 完成 | `app/api/auth/[...nextauth]/route.ts` |
| 中间件 (Middleware) | ✅ 完成 | `middleware.ts`                       |
| 认证上下文/Provider | ✅ 完成 | `components/providers.tsx`            |

## 核心数据模型 (基于 Auth.js)

1.  **`User` 模型**: (已在 `prisma/schema.prisma` 中添加 `passwordHash`)
2.  **`Account` 模型**
3.  **`Session` 模型**
4.  **`VerificationToken` 模型**

状态: ✅ 模型已添加到 `prisma/schema.prisma` 并已同步到数据库。

## 用户流程

1.  **未认证用户访问受保护页面**:

    - 用户尝试访问如 `/dashboard`。
    - 中间件 (`middleware.ts`) 拦截，检查会话，重定向到 `/login`。

2.  **用户登录**:

    - 用户在 `/login` 页面输入凭证或选择 OAuth。
    - 请求到 `/api/auth/signin`。
    - Auth.js 处理认证，成功后创建会话 (Cookie 和数据库 `Session`)，重定向到目标页或仪表盘。

3.  **已认证用户访问页面**:

    - 中间件或页面逻辑通过 `auth()` 检查会话，允许访问。

4.  **用户登出**:
    - 用户点击"退出登录"。
    - 请求到 `/api/auth/signout`。
    - Auth.js 清除会话，重定向到登录页。

## 开发进度与计划

1.  [x] **环境与依赖准备**
    - [x] 安装 `next-auth@beta`, `@auth/prisma-adapter`, `bcryptjs`
    - [x] 配置环境变量 (`AUTH_SECRET`, `DATABASE_URL`, `NEXTAUTH_URL`)
2.  [x] **Auth.js 核心配置**
    - [x] 创建 `auth.ts` 并配置 Credentials Provider 和 Prisma Adapter
    - [x] 创建 Auth.js API 路由 `app/api/auth/[...nextauth]/route.ts`
3.  [x] **数据库模型同步**
    - [x] 在 `prisma/schema.prisma` 添加 Auth.js 模型及 `User.passwordHash`
    - [x] 运行 `prisma db push` 同步数据库
4.  [x] **登录页面实现**
    - [x] 创建 `app/[locale]/login/page.tsx` 及登录表单
    - [x] 实现 `signIn` 调用
    - [x] 添加了翻译
5.  [x] **中间件配置 (路由保护)**
    - [x] 修改 `middleware.ts` 集成认证逻辑
6.  [x] **受保护的布局/路由组**
    - [x] 创建 `app/[locale]/(protected)/layout.tsx`
    - [x] 将原首页移动到 `(protected)/dashboard/page.tsx` 作为测试页面
7.  [x] **用户菜单/导航栏更新**
    - [x] 修改 `NavbarActions` 以根据会话状态显示用户头像/菜单或登录按钮
    - [x] 实现 `signOut` 逻辑
8.  [x] **认证上下文/Provider**
    - [x] 创建 `components/providers.tsx` 并添加 `SessionProvider`
9.  [x] **代码质量与改进**
    - [x] 修复 TypeScript 类型问题，避免使用 `any` 类型
    - [x] 移除不必要的 console 日志语句
    - [x] 添加更详细的类型声明
10. [x] **测试与完善**
    - [x] 全面测试登录、登出、路由保护
    - [x] 优化错误处理和用户体验
    - [x] 解决环境变量配置问题

## 代码质量规范

- **TypeScript**: 严格使用类型安全，避免 `any` 类型
- **ESLint**: 遵循项目的 ESLint 规则，包括:
  - 避免不必要的 console 语句
  - 正确的错误处理
  - 一致的代码风格
- **国际化**: 所有用户可见文本均使用 `next-intl` 翻译

## 环境变量配置

项目需要设置以下环境变量:

```
# 认证相关
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your_secret_key_here

# 数据库
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trendhub?schema=public"
```

## 需求变更记录

- 初始需求：用户登录、退出、会话管理、路由保护。管理员用户。 (2023-08-01)
- 明确暂时不需要基于角色的权限控制。 (2023-08-10)
- 增加国际化支持，使用 `next-intl` 实现多语言。 (2023-09-15)
- 修复代码质量问题，提高类型安全性。 (2023-10-05)
