# TrendHub 项目部署指南

本文档提供了将 TrendHub 项目部署到不同环境的详细步骤和建议。

## 1. 简介

TrendHub 是一个基于 Next.js 和 Turborepo 构建的 Monorepo 项目，包含多个独立的应用程序（例如 `apps/web` 前台和 `apps/admin` 后台）。本文档将涵盖推荐的 Vercel 部署方式以及部署到传统服务器或其他云平台的方法。

## 2. 准备工作

在开始部署之前，请确保满足以下条件：

- **Git 仓库**: 您的项目代码已提交到 Git 仓库 (例如 GitHub, GitLab, Bitbucket)。
- **Node.js**: 推荐使用项目 `.nvmrc` 文件中指定的 Node.js 版本。如果未指定，请使用最新的 LTS 版本。
- **pnpm**: 项目使用 pnpm作为包管理器。请确保已全局安装 pnpm。如果未安装，可以通过 `npm install -g pnpm` 安装。
- **环境变量文件**: 项目根目录和各应用目录下应存在 `.env.example` 文件，列出了所需的全部环境变量。请根据此模板创建实际的 `.env` 文件 (用于本地开发) 或在部署平台配置相应的环境变量。

## 3. 环境变量

环境变量对于 TrendHub 项目的正确运行至关重要。它们用于配置数据库连接、外部服务 API 密钥、应用行为等。

**关键环境变量示例 (请根据您项目的 `.env.example` 文件进行核对和补充)：**

- `DATABASE_URL`: PostgreSQL 数据库的连接字符串 (供 Prisma 使用)。
  - 格式示例: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare R2 存储的账户 ID。
- `R2_ACCESS_KEY_ID`: Cloudflare R2 存储的访问密钥 ID。
- `R2_SECRET_ACCESS_KEY`: Cloudflare R2 存储的秘密访问密钥。
- `R2_BUCKET_NAME`: Cloudflare R2 存储桶的名称。
- `R2_PUBLIC_URL`: Cloudflare R2 存储桶的公开访问 URL。
- `NEXT_PUBLIC_APP_URL`: 应用的公开 URL (例如，用于邮件中的链接)。
- `ADMIN_EMAIL_USER`: (如果使用邮件服务) 邮件发送服务的用户名。
- `ADMIN_EMAIL_PASS`: (如果使用邮件服务) 邮件发送服务的密码。
- `JWT_SECRET_KEY`: 用于签发和验证 JSON Web Tokens 的密钥。
- ... (其他特定于应用或集成的服务的环境变量)

**查找所有环境变量**:
请仔细检查项目根目录及 `apps/web` 和 `apps/admin` 目录下的 `.env.example` 文件，以获取所有必需的环境变量及其用途的完整列表。

## 4. 部署到 Vercel (推荐)

Vercel 是 Next.js 项目的首选部署平台，提供无缝的集成和优化。

### 4.1. 前提条件

- 一个 Vercel 账户。
- 您的项目已推送到 Git 仓库。

### 4.2. 部署步骤

1.  **登录 Vercel**: 访问 [vercel.com](https://vercel.com/) 并登录。
2.  **导入项目**:
    - 在 Vercel 仪表盘中，点击 "Add New..." -> "Project"。
    - 选择您的 Git 提供商并授权 Vercel 访问您的仓库。
    - 选择您的 TrendHub 项目仓库。
3.  **配置项目**:
    - **Monorepo**: Vercel 通常能自动检测到 Turborepo。
      - **部署特定应用**: 您需要为 `apps/web` 和 `apps/admin` 分别创建 Vercel 项目。
        - 在 "Configure Project" 阶段，设置 "Root Directory" 为对应应用的路径 (例如 `apps/web` 或 `apps/admin`)。
      - **或者 (高级)**: 如果 Vercel 支持更高级的 Monorepo 配置，您可以探索单个 Vercel 项目部署多个应用的可能性，但这通常更复杂。推荐为每个独立部署的应用创建单独的 Vercel 项目。
    - **构建和输出设置**:
      - **Framework Preset**: 应自动识别为 "Next.js"。
      - **Build Command**: Vercel 通常会根据根目录的 `package.json` 和 Turborepo 配置自动填充。如果为特定应用（如 `apps/admin`）单独创建 Vercel 项目并设置了其根目录为 `apps/admin`，则构建命令可能默认为 `pnpm build` (在 `apps/admin/package.json` 中定义) 或 `next build`。如果 Vercel 从 Monorepo 根目录构建，它可能会使用类似 `turbo run build --filter=@trend-hub/admin` (假设应用名为 `@trend-hub/admin`) 的命令。您可能需要根据实际情况调整此命令，例如 `pnpm --filter=@trend-hub/admin build`。
      - **Output Directory**: 对于 Next.js，这通常是 `.next` 目录，Vercel 会自动处理。
      - **Install Command**: 确保设置为 `pnpm install` 或您在 Vercel 项目设置中配置的 pnpm 相关命令。
    - **环境变量**:
      - 导航到项目设置中的 "Environment Variables" 部分。
      - 添加所有在第 3 节中列出和在您的 `.env.example` 文件中找到的必要环境变量。**这是部署成功的关键步骤。**
4.  **触发部署**: 保存配置后，Vercel 将自动从您的 Git 仓库拉取最新代码，执行构建命令，并部署您的应用。
5.  **监控和域名**: 部署完成后，Vercel 会提供一个预览 URL。您可以在 Vercel 仪表盘中监控部署状态、查看日志，并配置自定义域名。

## 5. 部署到传统服务器或其他云平台

如果您选择不使用 Vercel，可以将 TrendHub 项目部署到传统 VPS、Docker 容器或其他云提供商（如 AWS EC2, Google Cloud Run 等）。

### 5.1. 构建应用

1.  **克隆仓库**: 在您的构建服务器或本地环境中克隆最新的代码：
    ```bash
    git clone <your-repo-url>
    cd trend-hub
    ```
2.  **安装依赖**:
    ```bash
    pnpm install --frozen-lockfile
    ```
3.  **执行构建**: - 构建所有应用:
    `bash
      pnpm turbo run build
      ` - 或分别构建特定应用 (例如 `apps/web` 和 `apps/admin`):
    `bash
pnpm --filter=front-end build
pnpm --filter=@trend-hub/admin build
`
    构建完成后，每个应用 (例如 `apps/web/.next`, `apps/admin/.next`) 的目录下会生成 `.next` 文件夹，其中包含生产环境的构建产物。

### 5.2. 配置服务器环境

1.  **安装 Node.js 和 pnpm**: 确保服务器上安装了与项目兼容的 Node.js 版本和 pnpm。
2.  **拷贝构建产物**:
    - 将整个项目（包含 `node_modules` 和各个应用的 `.next` 目录）拷贝到服务器。
    - 或者，更推荐的做法是，只拷贝构建应用所需的最小文件集：
      - 对于 `apps/web`: `apps/web/.next`, `apps/web/public`, `apps/web/package.json`, `pnpm-lock.yaml` (可能需要根目录的 `pnpm-workspace.yaml` 和相关的 `package.json` 文件以正确解析依赖路径)。
      - 对于 `apps/admin`: `apps/admin/.next`, `apps/admin/public`, `apps/admin/package.json`, `pnpm-lock.yaml`。
      - 以及项目根目录的 `node_modules` (或者在服务器上仅针对生产依赖重新运行 `pnpm install --prod`)。
3.  **设置环境变量**: 在服务器上以安全的方式设置所有必要的环境变量。可以通过以下方式：
    - 操作系统的环境变量 (例如，在 `~/.bashrc`, `~/.profile` 中设置，或通过 `/etc/environment`)。
    - 使用 `.env` 文件 (确保此文件不在版本控制中，并且应用配置为加载它 - Next.js 默认会加载)。
    - 通过云平台的配置服务。

### 5.2.1. Playwright 和浏览器依赖 (针对爬虫)

如果您的部署包含并需要运行 `packages/scraper` 中的爬虫功能，则需要确保 Playwright 及其相关的浏览器依赖已在服务器上正确安装。该爬虫包使用 Playwright 来控制浏览器进行数据抓取。

**1. 安装浏览器二进制文件及依赖：**

在项目根目录成功执行 `pnpm install` (安装了 Playwright 库) 之后，您需要为 Playwright 安装相应的浏览器。推荐的方法是使用 Playwright CLI 来安装 Chromium (示例中主要使用的浏览器) 及其操作系统依赖。

从项目根目录运行以下命令：

```bash
pnpm --filter=@repo/scraper exec playwright install --with-deps chromium
```

或者，您可以先进入爬虫包目录：

```bash
cd packages/scraper
pnpm exec playwright install --with-deps chromium
cd ../.. # 返回项目根目录
```

`--with-deps` 标志会尝试自动安装运行 Chromium 所需的操作系统库 (主要针对 Linux 环境)。

**2. 浏览器执行路径：**

爬虫脚本 (例如 `packages/scraper/src/sites/mytheresa.ts`) 可能通过以下方式指定浏览器执行路径：

- 环境变量 `CHROME_EXECUTABLE_PATH`。
- 一个默认的硬编码路径 (例如，代码中可能包含类似 `/root/.cache/ms-playwright/chromium-1123/chrome-linux/chrome` 的路径)。

如果使用上述 `playwright install` 命令，Playwright 通常能让您的脚本自动找到已安装的浏览器。但是，如果遇到问题或有特定的浏览器版本/路径需求，请确保：

- 如果设置了 `CHROME_EXECUTABLE_PATH` 环境变量，它指向了正确的 Chromium 可执行文件路径。
- 如果依赖硬编码路径，确保浏览器确实位于该路径。

**3. 手动安装系统依赖 (备用方案)：**

在大多数情况下，`playwright install --with-deps chromium` 应该足够。但如果仍然遇到与系统库相关的错误，您可能需要根据服务器的操作系统手动安装一些常见的依赖项。例如，在基于 Debian/Ubuntu 的系统上，可能需要的库包括 `libnss3`, `libatk1.0-0`, `libatk-bridge2.0-0`, `libcups2`, `libdrm2`, `libgbm1`, `libasound2`, `libpangocairo-1.0-0`, `libxshmfence1` 等。
在尝试手动安装前，请务必先检查 Playwright 的官方文档以获取最新的依赖列表和特定于您的操作系统的说明。

### 5.2.2. 数据库配置与初始化 (使用 Prisma)

正确的数据库配置和初始化对于 TrendHub 后台 (`apps/admin`) 的运行至关重要。

**1. 安装与基本配置 PostgreSQL：**

这部分提供了在基于 Debian/Ubuntu 的 Linux 服务器上安装和基本配置 PostgreSQL 的通用指南。对于其他操作系统或特定版本，请参考官方 PostgreSQL 文档。

- **更新软件包列表并安装 PostgreSQL：**

  ```bash
  sudo apt update
  sudo apt install postgresql postgresql-contrib
  ```

  安装完成后，PostgreSQL 服务通常会自动启动。

- **验证 PostgreSQL 服务状态 (可选)：**

  ```bash
  sudo systemctl status postgresql
  ```

- **访问 PostgreSQL Shell (`psql`)：**
  PostgreSQL 会创建一个名为 `postgres` 的默认 Linux 系统用户，该用户也是 PostgreSQL 的超级用户。

  ```bash
  sudo -i -u postgres  # 切换到 postgres 系统用户
  psql                 # 打开 psql 交互式终端
  ```

- **创建数据库用户：**
  在 `psql` 终端中，为您的 TrendHub 应用创建一个专用的数据库用户。**请务必将 `'your_strong_password'` 替换为一个强密码。**

  ```sql
  CREATE USER trendhub_user WITH PASSWORD 'xP!RfxewB1qltR7k';
  ```

- **创建数据库：**
  创建一个新的数据库，并指定其所有者为上一步创建的 `trendhub_user`。

  ```sql
  CREATE DATABASE trendhub_db OWNER trendhub_user;
  ```

- **(可选) 授予权限：**
  通常，将数据库的 `OWNER` 设置为应用用户已经足够。如果需要更明确的权限授予，可以执行：

  ```sql
  GRANT ALL PRIVILEGES ON DATABASE trendhub_db TO trendhub_user;
  ```

- **退出 `psql` 和 `postgres` 用户：**
  在 `psql` 中输入 `\q` (或 `exit`)，然后按 Enter。
  在 `postgres`用户的 shell 中输入 `exit`，然后按 Enter 返回到您之前的用户。

- **配置远程连接 (按需并谨慎操作)：**
  默认情况下，PostgreSQL 可能只允许来自本地主机的连接。如果您的应用程序和数据库在不同的服务器上，您需要配置 PostgreSQL 以允许远程连接。这通常涉及编辑两个文件：

  1.  `postgresql.conf`: 修改 `listen_addresses` 指令。例如，设置为 `listen_addresses = '*'` 以监听所有 IP 地址 (请谨慎使用，并结合防火墙规则)。
  2.  `pg_hba.conf`: 添加或修改条目以允许您的应用服务器 IP 地址通过指定的方法（例如 `md5` 或 `scram-sha-256` 进行密码验证）连接到数据库和用户。

  **安全警告：** 将数据库端口直接暴露到公共互联网存在重大安全风险。强烈建议将数据库服务器与应用服务器置于同一私有网络中，并使用防火墙严格限制对 PostgreSQL 端口 (默认为 5432) 的访问。如果必须进行远程连接，请确保使用 SSL/TLS 加密连接，并配置非常强的密码和严格的防火墙规则。

  修改这些配置文件后，通常需要重启 PostgreSQL 服务才能使更改生效：`sudo systemctl restart postgresql`。

**2. 设置 `DATABASE_URL` 环境变量：**

Prisma 通过 `DATABASE_URL` 环境变量连接到您的数据库。其标准格式如下：

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

请将 `USER`, `PASSWORD`, `HOST`, `PORT`, 和 `DATABASE` 替换为您的实际 PostgreSQL凭据和数据库名称。

您可以在以下位置设置此环境变量：- **项目根目录的 `.env` 文件**: (例如 `TrendHub/.env`) Next.js (`apps/admin`) 会自动加载此文件。这是推荐的方式之一。- **应用目录的 `.env` 文件**: (例如 `apps/admin/.env`) - **PM2 `ecosystem.config.js` 文件**: 如果您使用此文件管理应用，可以在其中为 `@trend-hub/admin` 应用指定 `env`。- **操作系统级别**: 例如，在 `~/.bashrc` 或 `/etc/environment` 中。PM2 进程通常会继承这些变量。

**重要**: 请勿将包含敏感数据库凭据的 `.env` 文件直接提交到版本控制系统 (Git)。应使用项目中的 `.env.example` 文件作为模板，并在服务器上创建实际的 `.env` 文件，确保该文件被 `.gitignore` 排除。

**3. 初始化数据库 Schema / 应用迁移：**

根据您的部署场景选择合适的 Prisma 命令。这些命令通常应在项目根目录执行，并通过 `--filter` 指向 `apps/admin` 包（其中包含 Prisma schema）。

- **首次部署 (数据库为空或首次创建表结构)：**
  使用 `prisma db push` 命令。它会使您的数据库模式与 `apps/admin/prisma/schema.prisma` 文件同步。

  ```bash
  pnpm --filter=@trend-hub/admin exec prisma db push
  ```

  _注意：`db push` 非常适合快速原型制作和初始 schema 设置。对于生产环境中的后续 schema 演变，迁移是更安全、更可控的方法。_

- **后续部署 (应用已创建的迁移)：**
  如果您在开发过程中对 `schema.prisma` 进行了更改，并使用 `pnpm --filter=@trend-hub/admin exec prisma migrate dev --name your-migration-name` 创建了迁移文件，那么在部署时，您需要应用这些待处理的迁移：
  ```bash
  pnpm --filter=@trend-hub/admin exec prisma migrate deploy
  ```
  此命令会执行所有尚未在数据库中应用的迁移。

**4. 数据填充 (Seeding - 可选)：**

如果您的项目包含用于填充初始数据（例如，默认设置、管理员账户、基础分类等）的 seed 脚本 (通常位于 `apps/admin/prisma/seed.ts`)，您可以在数据库 schema 设置或迁移完成后运行它。

您的 `apps/admin/package.json` 文件中包含一个 `db:seed` 脚本。您可以通过以下命令运行它：

```bash
pnpm --filter=@trend-hub/admin run db:seed
```

**警告**: 在生产环境中执行数据填充脚本时要格外小心。确保脚本是幂等的（即多次运行结果相同且无副作用），或者它有逻辑来防止重复创建或覆盖现有重要数据。

### 5.3. 运行应用

1.  **启动命令**:

        - 启动 `apps/web` (假设其 `package.json` 中的 `name` 是 `front-end`):
          ```bash
          pnpm --filter=front-end start
          ```
        - 启动 `apps/admin` (假设其 `package.json` 中的 `name` 是 `@trend-hub/admin`):
          `bash

    pnpm --filter=@trend-hub/admin start
    `      Next.js 应用默认在`3000`端口运行。如果同时运行多个应用，您需要在启动命令中指定不同端口，例如:`pnpm --filter=front-end start -- -p 3001`。

2.  **进程管理器 (推荐)**: 使用进程管理器如 PM2 来确保您的 Next.js 应用在后台持续运行、自动重启并在服务器重启后恢复。

    - 安装 PM2: `npm install -g pm2`
    - 使用 PM2 启动应用 (示例):

      ```bash
      # 启动 web 应用
      pm2 start pnpm --name "front-end" -- run "start:web" -- --port 3000 # 假设 package.json 中有 start:web 脚本
      # 或者直接
      # pm2 start pnpm --name "front-end" --filter=front-end start -- --port 3000

      # 启动 admin 应用
      pm2 start pnpm --name "@trend-hub/admin" -- run "start:admin" -- --port 3001 # 假设 package.json 中有 start:admin 脚本
      # pm2 start pnpm --name "@trend-hub/admin" --filter=@trend-hub/admin start -- --port 3001
      ```

    - 确保 PM2 配置为在系统启动时自动启动: `pm2 startup`

### 5.4. 反向代理 (可选但推荐)

为了安全性和易管理性，建议在您的 Next.js 应用前设置一个反向代理，如 Nginx 或 Apache。

- **功能**:
  - 处理 SSL/TLS (HTTPS)。
  - 将域名映射到您的应用端口。
  - 缓存静态资源。
  - 实现负载均衡 (如果部署多个实例)。
  - 设置自定义头信息、安全策略等。
- **Nginx 配置示例 (简化版)**:

  ```nginx
  server {
      listen 80;
      server_name yourdomain.com; # 替换为您的域名

      # 可选：重定向 HTTP 到 HTTPS
      # return 301 https://$host$request_uri;

      location / {
          proxy_pass http://localhost:3001; # 假设 web 应用运行在 3001 端口
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }

  # 如果部署了 admin 应用，可以为其创建另一个 server 块或 location 块
  # server {
  #     listen 80;
  #     server_name admin.yourdomain.com; # 替换为您的 admin 域名
  #     location / {
  #         proxy_pass http://localhost:3002; # 假设 admin 应用运行在 3002 端口
  #         # ... 其他 proxy 设置同上
  #     }
  # }
  ```

  您还需要使用 Certbot 等工具配置 SSL 证书以启用 HTTPS。

### 5.5. Docker化部署 (可选)

将应用容器化可以提供更好的一致性和可移植性。

1.  **创建 `Dockerfile`**: 为每个需要部署的应用 (例如 `apps/web`, `apps/admin`) 创建一个 `Dockerfile`。

    **`apps/admin/Dockerfile` 示例**:

    ```dockerfile
    # 1. 选择 Node.js 基础镜像 (与项目兼容的版本)
    FROM node:18-alpine AS base

    # 设置工作目录
    WORKDIR /app

    # 安装 pnpm
    RUN npm install -g pnpm

    # --- 依赖安装阶段 ---
    FROM base AS deps
    WORKDIR /app

    # 拷贝 Monorepo 结构的关键文件
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc* ./
    COPY apps/admin/package.json ./apps/admin/
    # 如果有其他共享的 package.json (如 packages/ui), 也需要拷贝
    # COPY packages/types/package.json ./packages/types/
    # COPY packages/ui/package.json ./packages/ui/

    # 安装所有依赖 (或仅生产依赖，根据需要调整)
    # 使用 --filter 来只安装特定应用及其依赖，可以减小镜像体积
    RUN pnpm install --frozen-lockfile --filter=@trend-hub/admin... # '...' 包含其依赖

    # --- 构建阶段 ---
    FROM base AS builder
    WORKDIR /app

    # 拷贝依赖安装阶段的 node_modules
    COPY --from=deps /app/node_modules ./node_modules
    # 拷贝整个 Monorepo 的源代码或构建应用所需的部分
    COPY . .

    # 构建特定应用
    RUN pnpm --filter=@trend-hub/admin build

    # --- 生产镜像 ---
    FROM base AS runner
    WORKDIR /app

    # 从构建器阶段拷贝构建产物和必要的 node_modules
    # 只拷贝生产所需的依赖
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/apps/admin/.next ./apps/admin/.next
    COPY --from=builder /app/apps/admin/public ./apps/admin/public
    COPY --from=builder /app/apps/admin/package.json ./apps/admin/package.json
    COPY --from=builder /app/package.json ./ # 根 package.json 可能包含启动脚本
    COPY --from=builder /app/pnpm-lock.yaml ./ # 确保版本一致性

    # 暴露端口
    EXPOSE 3000

    # 设置环境变量 (可以在 docker run 时覆盖)
    # ENV NODE_ENV=production
    # ENV PORT=3000

    # 启动命令 (确保 package.json 中有对应的脚本)
    # CMD ["pnpm", "--filter=@trend-hub/admin", "start"]
    CMD ["pnpm", "run", "start:admin"] # 假设 apps/admin/package.json 或根 package.json 中有 start:admin 脚本

    ```

    **注意**: 上述 `Dockerfile` 是一个通用指南，您需要根据您的 Monorepo 结构和依赖关系进行精确调整，特别是 `COPY` 指令和 `pnpm install` 的 `--filter` 参数。目标是构建一个包含运行特定应用所需的最少文件的镜像。

2.  **构建 Docker 镜像**:
    ```bash
    docker build -t trendhub-admin:latest -f apps/admin/Dockerfile .
    # 为 apps/web 创建类似的 Dockerfile 并构建镜像
    # docker build -t trendhub-web:latest -f apps/web/Dockerfile .
    ```
3.  **运行 Docker 容器**:

    ```bash
    docker run -d -p 3001:3000 \
      --name trendhub-admin-container \
      -e DATABASE_URL="your_db_connection_string" \
      -e R2_ACCESS_KEY_ID="your_key_id" \
      # ... 其他环境变量 ...
      trendhub-admin:latest

    # docker run -d -p 3002:3000 \
    #   --name trendhub-web-container \
    #   # ... 环境变量 ...
    #   trendhub-web:latest
    ```

    可以使用 Docker Compose 来简化多容器应用的定义和管理。

## 6. 常见问题与故障排查

- **环境变量未正确加载**:
  - 仔细检查在部署平台或服务器上是否已设置所有必需的环境变量。
  - 确认变量名称与应用代码中引用的名称完全一致 (区分大小写)。
  - 对于 Vercel，检查项目设置中的 Environment Variables 部分。
  - 对于服务器部署，检查 `.env` 文件或系统环境变量的加载方式。
- **构建失败**:
  - 查看构建日志以获取详细错误信息。
  - 确保 Node.js 和 pnpm 版本与项目要求兼容。
  - 检查 `package.json` 和 `pnpm-lock.yaml` 是否存在冲突或损坏。
  - 确保所有依赖项都已正确安装。
- **应用启动失败或运行时错误**:
  - 查看应用运行日志 (例如 PM2 日志 `pm2 logs trendhub-web` 或 Docker 容器日志 `docker logs trendhub-admin-container`)。
  - 确认数据库和外部服务 (如 Cloudflare R2) 是否可访问且配置正确。
  - 检查端口是否被占用。
- **静态资源 (CSS, JS, 图片) 加载失败 (404)**:
  - 确认 Next.js 构建是否成功生成了这些资源。
  - 检查反向代理配置 (如果使用)，确保其正确代理静态资源请求。
  - 对于 Vercel，这通常会自动处理。
- **CORS 错误**:
  - 如果前端应用从不同域请求 API，确保后端 API (可能是 `apps/admin` 或外部服务) 配置了正确的 CORS 头。检查 `next.config.js` 中的 `headers` 或 `rewrites` 配置。

---

本文档提供了多种部署 TrendHub 项目的方案。请根据您的具体需求、资源和技术栈偏好选择最合适的方法。始终优先考虑安全性和可维护性。

## 7. 更新已部署的应用

当您对代码进行了更改并希望将其部署到已运行的服务器时，请遵循以下步骤：

1.  **SSH 连接到服务器并导航到项目目录**：

    ```bash
    ssh your_user@your_server_ip
    cd /path/to/your/TrendHub # 替换为您的实际项目路径
    ```

2.  **(可选) 启用维护模式**：
    如果更新重大或可能导致短暂中断，建议通知用户。

3.  **从 Git 拉取最新代码**：
    假设您的部署分支是 `main`：

    ```bash
    git pull origin main
    ```

4.  **安装/更新依赖项**：
    使用 `--frozen-lockfile` 来确保依赖项与 `pnpm-lock.yaml` 文件一致，这对于生产环境至关重要。

    ```bash
    pnpm install --frozen-lockfile
    ```

5.  **运行数据库迁移 (如果需要)**：
    如果您的更新包含数据库模式更改（例如，新的 Prisma 迁移），请运行迁移命令。**在执行此操作之前备份数据库是一个好习惯。**

    ```bash
    # 示例命令，具体取决于您的项目设置
    pnpm --filter=@trend-hub/admin exec prisma migrate deploy
    ```

6.  **重新构建应用程序**：
    使用 Turborepo 构建所有相关的应用程序包。

    ```bash
    pnpm build
    # 或者更具体地：
    # pnpm --filter=front-end build
    # pnpm --filter=@trend-hub/admin build
    ```

7.  **重启应用程序 (使用 PM2)**：
    使用 `restart` 命令来应用更改。PM2 将尝试平滑重启。

    ```bash
    pm2 restart front-end
    pm2 restart @trend-hub/admin
    # 或者，如果您想一次性重启所有由 PM2 管理的应用：
    # pm2 restart all
    ```

    您可以使用 `pm2 list` 来检查状态，并使用 `pm2 logs <app_name>` 来查看日志。

8.  **(可选) 清除缓存**：
    根据您的应用架构，您可能需要清除任何相关的缓存（例如，CDN 缓存、应用内缓存）。

9.  **验证部署**：
    彻底测试您的应用程序，以确保所有更改都已正确应用并且一切正常运行。

10. **(可选) 禁用维护模式**。

---

本文档提供了多种部署 TrendHub 项目的方案以及更新指南。请根据您的具体需求、资源和技术栈偏好选择最合适的方法。始终优先考虑安全性和可维护性。
