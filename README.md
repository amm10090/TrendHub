# TrendHub 项目结构说明文档

TrendHub 是一个使用 Turborepo 管理的现代化全栈应用程序，采用 monorepo 架构设计。本文档详细说明了项目的文件结构及其用途。

## 根目录文件

- `.env` - 项目环境变量配置文件，包含全局环境变量
- `.env.example` - 环境变量示例文件，用于指导开发者如何配置自己的环境变量
- `.npmrc` - npm 配置文件，定义包管理器行为和设置
- `.nvmrc` - Node.js 版本管理文件，指定项目使用的 Node.js 版本
- `package.json` - 项目根配置文件，定义全局依赖和工作区脚本
- `pnpm-lock.yaml` - pnpm 锁定文件，确保依赖版本一致性
- `pnpm-workspace.yaml` - 定义 monorepo 工作区配置
- `turbo.json` - Turborepo 配置文件，定义构建管道和缓存策略
- `tsconfig.json` - TypeScript 基础配置文件，被其他包继承
- `eslint.config.js` - ESLint 配置文件，定义代码风格和质量规则
- `LICENSE` - 项目许可证文件
- `README.md` - 项目主要说明文档

## 目录结构

### `/apps` - 应用程序目录

包含所有独立部署的应用程序。

#### `/apps/web` - 前端网站应用

用户端主要应用程序，基于 Next.js 构建。

- `/app` - Next.js App Router 应用目录
  - `/api` - API 路由目录
  - `/[locale]` - 国际化路由目录
    - `/privacy` - 隐私政策页面
    - `/disclaimer` - 免责声明页面
- `/components` - 应用特定组件
- `/contexts` - React 上下文提供者
- `/config` - 应用配置文件
- `/i18n` - 国际化配置
- `/lib` - 应用特定工具库
- `/messages` - 国际化翻译文件
  - `en.json` - 英文翻译
  - `zh.json` - 中文翻译
- `/pages` - Next.js Pages Router（兼容模式）
- `/public` - 静态资源目录
  - `/images` - 图片资源
  - `favicon.ico` - 网站图标
  - `vercel.svg` - Vercel 标志
- `/services` - API 服务和数据获取逻辑
- `/styles` - 全局样式文件
- `/types` - 应用特定类型定义
- `middleware.ts` - Next.js 中间件，处理请求拦截
- `next.config.js` - Next.js 配置文件
- `tailwind.config.js` - Tailwind CSS 配置
- `postcss.config.js` - PostCSS 配置
- `.env` - 应用特定环境变量
- `.envexample` - 应用环境变量示例

#### `/apps/admin` - 管理后台应用

管理员控制面板，基于 Next.js 构建。

- `/src` - 源代码目录
  - `/app` - Next.js App Router 应用目录
    - `globals.css` - 全局样式
- `next.config.js` - Next.js 配置文件
- `tailwind.config.js` - Tailwind CSS 配置
- `postcss.config.js` - PostCSS 配置
- `tsconfig.json` - TypeScript 配置
- `.npmrc` - npm 配置文件

### `/packages` - 共享包目录

包含可在多个应用间共享的代码包。

#### `/packages/ui` - UI 组件库

可重用的 UI 组件库，可被所有应用使用。

- `/src` - 源代码目录，包含所有 UI 组件
- `/dist` - 构建输出目录
- `package.json` - 包配置和依赖

#### `/packages/types` - 类型定义包

共享的 TypeScript 类型定义。

- `/src` - 源代码目录，包含所有类型定义
- `package.json` - 包配置和依赖

#### `/packages/utils` - 工具函数包

共享的实用工具函数。

- `/src` - 源代码目录，包含所有工具函数
- `/dist` - 构建输出目录
- `package.json` - 包配置和依赖

### 其他目录

- `/.vercel` - Vercel 部署配置和缓存
- `/.git` - Git 版本控制目录
- `/.vscode` - VS Code 编辑器配置
- `/.turbo` - Turborepo 缓存目录
- `/.husky` - Git hooks 配置
- `/.cursor` - Cursor 编辑器配置
- `/node_modules` - 项目依赖安装目录

## 构建与开发

项目使用 Turborepo 进行构建优化和管理。主要命令可在根目录 `package.json` 中找到。

## 技术栈

- **前端框架**: Next.js-^15.2.2, React
- **样式**: Tailwind CSS-3.4.17, HerouiUI
- **状态管理**: Zustand, React Query
- **国际化**: i18next, react-i18next
- **构建工具**: Turborepo, pnpm
- **语言**: TypeScript
