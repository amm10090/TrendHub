# 使用官方推荐的 LTS slim 镜像以减小体积
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# 启用 pnpm
RUN corepack enable

# 1. Fetch 阶段：仅依赖 lockfile，最大化缓存利用
FROM base AS fetcher
WORKDIR /app
COPY pnpm-lock.yaml ./
# 如果有 pnpm-workspace.yaml 也复制过来
COPY pnpm-workspace.yaml ./
# 使用 BuildKit 缓存挂载来缓存 pnpm store
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch --frozen-lockfile

# 2. Deps 阶段：安装所有依赖（包括 devDependencies，因为构建可能需要它们）
FROM base AS deps
WORKDIR /app
COPY --from=fetcher /app/pnpm-lock.yaml ./
COPY --from=fetcher /app/pnpm-workspace.yaml ./
# 复制所有 package.json 文件
COPY package.json ./
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/scraper/package.json ./packages/scraper/package.json
COPY packages/ui/package.json ./packages/ui/package.json
# 安装依赖，利用 fetcher 阶段的缓存
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile --prefer-offline

# 3. Builder 阶段：构建所有应用和包
FROM base AS builder
WORKDIR /app
# 从 deps 阶段复制已安装的依赖和相关的 package 文件
COPY --from=deps /app /app
# 复制所有源代码 (确保 .dockerignore 已配置好)
COPY . .
# 运行构建命令，turbo 会处理各个包的构建脚本
RUN pnpm turbo run build

# 4. 生产阶段 - Admin 应用
# 使用 pnpm deploy 将 admin 应用及其生产依赖部署到 /prod/admin
FROM base AS admin-deploy-intermediate # 更名以避免与 builder 阶段的 COPY --from=builder 冲突
WORKDIR /app
COPY --from=builder /app /app # 复制整个构建好的 monorepo
RUN pnpm deploy --filter=@trend-hub/admin --prod /prod/admin

FROM node:20-alpine AS admin-runner
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY --from=admin-deploy-intermediate /prod/admin /app
# 确保 Prisma Client 在生产中可用
# 如果 apps/admin/package.json 包含 prisma 作为依赖，pnpm deploy 应该处理了
# 如果 prisma generate 在 deploy 后还需要，或者 schema 不在 deploy 输出中：
# COPY --from=builder /app/apps/admin/prisma ./prisma # 确保 schema.prisma 在这里
# RUN pnpm exec prisma generate
EXPOSE 3001
# 假设 admin 应用的 package.json 的 "scripts": { "start": "next start -p 3001" }
CMD ["pnpm", "start"]


# 5. 生产阶段 - Web 应用
# 使用 pnpm deploy 将 web 应用及其生产依赖部署到 /prod/web
FROM base AS web-deploy-intermediate # 更名
WORKDIR /app
COPY --from=builder /app /app # 复制整个构建好的 monorepo
RUN pnpm deploy --filter=front-end --prod /prod/web

FROM node:20-alpine AS web-runner
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY --from=web-deploy-intermediate /prod/web /app
EXPOSE 3000
# 假设 web 应用的 package.json 的 "scripts": { "start": "next start -p 3000" }
CMD ["pnpm", "start"]