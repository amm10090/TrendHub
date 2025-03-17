# TrendHub 项目结构说明

## 根目录文件

- `.env` - 项目环境变量配置文件
- `.env.example` - 环境变量模板文件
- `.npmrc` - npm 配置文件，定义包管理器行为
- `.nvmrc` - Node.js 版本管理配置文件
- `package.json` - 项目依赖和脚本配置
- `pnpm-lock.yaml` - pnpm 依赖锁定文件
- `pnpm-workspace.yaml` - pnpm 工作空间配置文件

## packages 目录

包含可复用的内部包

- `ui/` - 共享 UI 组件库
  - `package.json` - UI 组件库的配置文件
  - `src/` - UI 组件源代码

## apps 目录

包含所有应用程序

### web 应用

- `.env` - web 应用环境变量
- `.envexample` - web 应用环境变量模板
- `.npmrc` - web 应用的 npm 配置
- `package.json` - web 应用依赖配置
- `services/` - 后端服务接口封装
- `public/` - 静态资源目录
  - `favicon.ico` - 网站图标
  - `vercel.svg` - Vercel logo
  - `images/` - 图片资源目录
- `pages/` - 页面组件目录
  - `_error.js` - 自定义错误页面
- `messages/` - 国际化文案配置
  - `en.json` - 英文文案
  - `zh.json` - 中文文案
- `lib/` - 通用工具库
- `i18n/` - 国际化配置
- `config/` - 应用配置
- `app/` - App Router 目录
  - `api/` - API 路由
  - `[locale]/` - 国际化路由
    - `privacy/` - 隐私政策页面
    - `disclaimer/` - 免责声明页面

### admin 应用

- `.npmrc` - admin 应用的 npm 配置
- `package.json` - admin 应用依赖配置
- `src/` - 源代码目录
  - `app/` - App 主目录
    - `globals.css` - 全局样式文件
