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

### 5.5 Docker 容器化部署详细指南

#### 1. Docker 容器化概述

Docker 容器化为 TrendHub 项目提供了一致的运行环境、简化的部署流程和更好的资源隔离。本节详细介绍如何使用 Docker 部署整个 Monorepo 项目。

#### 2. 前置要求

- 安装 Docker Engine (20.10+)
- 安装 Docker Compose (2.0+)
- 熟悉基本的 Docker 命令和概念

##### Docker Engine 安装

###### Linux (以 Ubuntu 为例)

1.  **更新包索引并安装依赖**:
    ```bash
    sudo apt-get update
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    ```
2.  **添加 Docker 的官方 GPG 密钥**:
    ```bash
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    ```
3.  **设置 Docker APT 仓库**:
    ```bash
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    ```
4.  **安装 Docker Engine**:
    ```bash
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    ```
5.  **验证安装**:
    ```bash
    sudo docker run hello-world
    ```
6.  **(可选) 将用户添加到 `docker` 组以无 `sudo` 运行 Docker**:
    ```bash
    sudo usermod -aG docker $USER
    # 注销并重新登录以使更改生效
    ```

###### Windows

1.  访问 [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/) 官方文档。
2.  下载安装程序并按照屏幕上的说明进行操作。
3.  确保启用了 WSL 2 (Windows Subsystem for Linux 2)，这是 Docker Desktop 在 Windows 上运行所必需的。

###### macOS

1.  访问 [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/) 官方文档。
2.  根据您的 Mac 芯片（Intel 或 Apple Silicon）下载相应的安装程序。
3.  打开 `.dmg` 文件并将 Docker 图标拖到 Applications 文件夹中。

##### Docker Compose 安装

- 对于 **Linux** 用户，如果您通过 `docker-compose-plugin` 包安装了 Docker Engine，则 Docker Compose V2 已经包含在内，可以通过 `docker compose` (注意没有连字符) 命令使用。
- 对于 **Windows 和 macOS** 用户，Docker Desktop 自带 Docker Compose V2，同样通过 `docker compose` 命令使用。
- 如果需要独立安装 Docker Compose (例如旧版 Docker Engine 或特定需求)，请参考 [Docker Compose 官方安装指南](https://docs.docker.com/compose/install/)。

**官方文档**:
强烈建议查阅 Docker 官方文档以获取最新和最详细的安装说明：

- Docker Engine: [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)
- Docker Desktop (Windows, Mac): [https://docs.docker.com/desktop/](https://docs.docker.com/desktop/)
- Docker Compose: [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/)

---

- 安装 Docker Engine (20.10+)
- 安装 Docker Compose (2.0+)

#### 3. Docker 配置文件创建

##### 3.1 编写 Dockerfile

在项目根目录创建 `Dockerfile`:

```dockerfile
# 基础镜像
FROM node:18-alpine AS base

# 全局依赖
RUN apk add --no-cache libc6-compat python3 make g++
RUN npm install -g pnpm@10.10.0
WORKDIR /app

# 依赖阶段
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/scraper/package.json ./packages/scraper/package.json

# 安装所有依赖
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建所有应用
RUN pnpm turbo run build

# Admin应用生产阶段
FROM base AS admin
ENV NODE_ENV production
WORKDIR /app

# 复制必要文件
COPY --from=builder /app/apps/admin/package.json ./apps/admin/package.json
COPY --from=builder /app/apps/admin/next.config.js ./apps/admin/next.config.js
COPY --from=builder /app/apps/admin/.next ./apps/admin/.next
COPY --from=builder /app/apps/admin/public ./apps/admin/public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 数据库初始化文件
COPY --from=builder /app/apps/admin/prisma ./apps/admin/prisma

WORKDIR /app/apps/admin
EXPOSE 3001
CMD ["pnpm", "start", "--", "-p", "3001"]

# Web应用生产阶段
FROM base AS web
ENV NODE_ENV production
WORKDIR /app

COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/next.config.js ./apps/web/next.config.js
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start", "--", "-p", "3000"]
```

##### 3.2 创建 Docker Compose 配置文件

在项目根目录创建 `docker-compose.yml`:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:14-alpine
    container_name: trendhub-db
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-trendhub}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-trendhubpassword}
      POSTGRES_DB: ${POSTGRES_DB:-trendhub_db}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U trendhub"]
      interval: 10s
      timeout: 5s
      retries: 5

  admin:
    build:
      context: .
      dockerfile: Dockerfile
      target: admin
    container_name: trendhub-admin
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://trendhub:trendhubpassword@postgres:5432/trendhub_db
      - NEXTAUTH_URL=${NEXTAUTH_URL:-http://localhost:3001}
      - NEXTAUTH_URL_INTERNAL=http://localhost:3001
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-your-nextauth-secret}

  web:
    build:
      context: .
      dockerfile: Dockerfile
      target: web
    container_name: trendhub-web
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3001/api}

  nginx:
    image: nginx:alpine
    container_name: trendhub-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - admin
      - web

volumes:
  postgres_data:
```

##### 3.3 配置 Nginx 反向代理

创建 `nginx` 目录和 `nginx/default.conf`:

```bash
mkdir -p nginx
```

编辑 `nginx/default.conf`:

```nginx
# 前台配置
server {
    listen 80;
    server_name trendhub.com www.trendhub.com;

    location / {
        proxy_pass http://web:3000;
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

# 后台配置
server {
    listen 80;
    server_name admin.trendhub.com;

    location / {
        proxy_pass http://admin:3001;
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
```

##### 3.4 创建环境变量配置文件

在项目根目录创建 `.env.docker` 文件:

```
# 数据库设置
POSTGRES_USER=trendhub
POSTGRES_PASSWORD=trendhubpassword
POSTGRES_DB=trendhub_db
DATABASE_URL=postgresql://trendhub:trendhubpassword@postgres:5432/trendhub_db

# NextAuth配置
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_URL_INTERNAL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this

# API URL (供前台访问后台API)
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# 其他必要的环境变量
# ...添加您项目所需的其他环境变量
```

#### 4. 构建和运行容器

##### 4.1 构建镜像

```bash
# 使用环境变量文件
docker compose --env-file .env.docker build
```

##### 4.2 启动所有服务

```bash
docker compose --env-file .env.docker up -d
```

##### 4.3 初始化数据库

```bash
# 进入admin容器
docker exec -it trendhub-admin sh

# 运行Prisma迁移
cd /app/apps/admin
npx prisma migrate deploy

# 可选：运行数据填充脚本
npx prisma db seed
```

##### 4.4 服务管理命令

```bash
# 查看所有运行中的容器
docker compose ps

# 查看容器日志
docker compose logs -f admin  # 查看admin应用日志
docker compose logs -f web    # 查看web应用日志
docker compose logs -f postgres  # 查看数据库日志

# 停止所有服务
docker compose down

# 停止并删除卷（慎用，会删除数据库数据）
docker compose down -v
```

#### 5. 容器化部署最佳实践

##### 5.1 镜像优化

- 使用多阶段构建减小镜像大小
- 只安装生产依赖 (`pnpm install --frozen-lockfile --prod`)
- 使用 `.dockerignore` 排除不必要的文件

##### 5.2 安全考虑

创建 `.dockerignore` 文件:

```
node_modules
.git
.env
.env.*
!.env.example
*.md
.next
build
dist
.turbo
```

##### 5.3 CI/CD集成

对接 GitHub Actions 自动构建和部署 Docker 镜像的示例配置 (创建 `.github/workflows/docker.yml`):

```yaml
name: Docker Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: |
            your-registry/trendhub-admin:latest
            your-registry/trendhub-admin:${{ github.sha }}
          target: admin
```

##### 5.4 生产环境部署考虑

- 使用 Docker Swarm 或 Kubernetes 进行容器编排
- 设置健康检查确保服务可用性
- 实施自动备份策略
- 配置监控和告警系统

#### 6. 常见问题解决 (Docker)

##### 6.1 构建时问题

- **依赖安装失败**: 确保 pnpm 版本正确且所有依赖可访问
- **构建内存不足**: 增加 Docker 内存限制或优化构建过程

##### 6.2 运行时问题

- **容器间通信失败**: 检查网络配置和服务名称解析
- **数据库连接错误**: 验证连接字符串和数据库凭据
- **应用启动错误**: 检查环境变量和日志信息

##### 6.3 性能优化

- 配置容器资源限制 (CPU, 内存)
- 使用 Docker 卷进行数据持久化
- 利用 Docker 的内置缓存机制

##### 6.4 Docker部署常见问题详细解决方案

###### 6.4.1 容器启动错误：缺失 `.next` 目录

**问题描述**:  
容器启动时报错 `Could not find a production build in the '.next' directory`，表明最终镜像内没有包含 Next.js 的构建产物。

**解决方案**:  
在 Dockerfile 中确保 `.next` 目录被正确复制到最终镜像中：

```dockerfile
# admin-deploy-intermediate 阶段后添加
RUN cp -r apps/admin/.next /prod/admin/.next

# web-deploy-intermediate 阶段后添加
RUN cp -r apps/web/.next /prod/web/.next
```

###### 6.4.2 使用远程镜像替代本地构建

**操作步骤**:

1. **推送镜像到 Docker Hub**:

   ```bash
   docker tag trendhub-admin:latest amm0512/trendhub-admin:latest
   docker tag trendhub-web:latest amm0512/trendhub-web:latest
   docker push amm0512/trendhub-admin:latest
   docker push amm0512/trendhub-web:latest
   ```

2. **修改 docker-compose.yml 使用远程镜像**:

   ```yaml
   admin:
     image: amm0512/trendhub-admin:latest
     restart: always
     # 其他配置不变...

   web:
     image: amm0512/trendhub-web:latest
     container_name: trendhub-web
     # 其他配置不变...
   ```

3. **拉取并启动远程镜像**:
   ```bash
   docker compose pull
   docker compose --env-file .env.docker up -d
   ```

###### 6.4.3 磁盘空间不足问题

**问题描述**:  
构建过程中出现 `ENOSPC: no space left on device` 错误。

**解决方案**:

- 清理 Docker 资源：
  ```bash
  docker system prune -a --volumes -f
  ```
- 清理临时文件：
  ```bash
  rm -rf /tmp/*
  rm -rf ~/.cache/*
  ```
- 确保构建环境有足够的磁盘空间（推荐至少 10GB 可用空间）。

###### 6.4.4 环境清理与重置

**完全清理 Docker 环境**:

```bash
# 停止并删除所有容器
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)

# 删除所有镜像
docker rmi -f $(docker images -aq)

# 清理所有未使用的资源（慎用）
docker system prune -a --volumes -f
```

#### 7. 部署到云服务 (Docker)

##### 7.1 AWS ECS/Fargate

```bash
# 安装和配置AWS CLI
aws configure

# 创建ECR仓库
aws ecr create-repository --repository-name trendhub-admin
aws ecr create-repository --repository-name trendhub-web

# 登录ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <your-aws-account-id>.dkr.ecr.<region>.amazonaws.com

# 构建并推送镜像
docker build --target admin -t <your-aws-account-id>.dkr.ecr.<region>.amazonaws.com/trendhub-admin:latest .
docker push <your-aws-account-id>.dkr.ecr.<region>.amazonaws.com/trendhub-admin:latest
```

##### 7.2 Google Cloud Run

```bash
# 安装和配置gcloud CLI
gcloud auth login

# 构建并推送镜像到Google Container Registry
gcloud builds submit --tag gcr.io/<project-id>/trendhub-admin --target admin .

# 部署到Cloud Run
gcloud run deploy trendhub-admin --image gcr.io/<project-id>/trendhub-admin --platform managed
```

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
    pnpm turbo run build
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

## 8. CI/CD 与自动化部署

持续集成和持续部署(CI/CD)可以大幅简化TrendHub项目的部署流程，提高开发效率和降低人为错误。

### 8.1 使用 GitHub Actions 自动构建与推送镜像

GitHub Actions 可以在代码推送到仓库后自动构建并推送 Docker 镜像到 Docker Hub。

#### 创建工作流配置文件

创建 `.github/workflows/docker-build.yml` 文件：

```yaml
name: Docker Build and Push

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push admin image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          target: admin-runner
          push: true
          tags: amm0512/trendhub-admin:latest

      - name: Build and push web image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          target: web-runner
          push: true
          tags: amm0512/trendhub-web:latest
```

#### 设置 GitHub Secrets

在 GitHub 仓库中添加以下密钥：

1. `DOCKERHUB_USERNAME`: Docker Hub 用户名
2. `DOCKERHUB_TOKEN`: Docker Hub 访问令牌 (不要使用账户密码)

### 8.2 服务器自动部署

#### 创建自动更新脚本

在服务器上创建自动更新脚本 `update-trendhub.sh`：

```bash
#!/bin/bash

# 记录开始时间
echo "=== 开始更新 TrendHub 应用 $(date) ==="

# 切换到项目目录
cd /root/TrendHub

# 拉取最新镜像
echo "正在拉取最新镜像..."
docker compose pull

# 重启服务
echo "正在重启服务..."
docker compose --env-file .env.docker up -d

# 清理未使用的镜像
echo "正在清理未使用的镜像..."
docker image prune -f

# 记录结束时间
echo "=== TrendHub 应用更新完成 $(date) ==="
```

赋予执行权限：

```bash
chmod +x update-trendhub.sh
```

#### 设置定时更新 (可选)

使用 crontab 设置定时任务，例如每天凌晨2点自动更新：

```bash
crontab -e
```

添加以下内容：

```
0 2 * * * /root/update-trendhub.sh >> /var/log/trendhub-update.log 2>&1
```

### 8.3 使用 Webhook 触发自动部署

可以结合 GitHub Actions 和服务器 Webhook，实现代码推送后自动部署。

#### 安装简易 Webhook 服务器

```bash
npm install -g webhook-server
```

#### 创建 Webhook 配置

```json
{
  "webhooks": [
    {
      "id": "deploy-trendhub",
      "execute-command": "/root/update-trendhub.sh",
      "command-working-directory": "/root"
    }
  ]
}
```

#### 运行 Webhook 服务器

```bash
webhook-server -c webhook-config.json -p 9000
```

#### 在 GitHub Actions 中添加部署步骤

在 `.github/workflows/docker-build.yml` 文件末尾添加：

```yaml
- name: Trigger deployment webhook
  if: success()
  run: |
    curl -X POST http://your-server-ip:9000/hooks/deploy-trendhub
```

通过以上配置，每当代码推送到 main 分支时，GitHub Actions 将自动构建并推送新镜像，然后触发服务器的部署脚本，完成完整的自动化部署流程。

---

本部署指南提供了从基础部署到高级自动化的全面解决方案。根据项目规模和团队需求，选择适合的部署策略，并确保定期审查和优化部署流程。
