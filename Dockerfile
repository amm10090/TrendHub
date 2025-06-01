FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@10.10.0

FROM base AS fetcher
WORKDIR /app
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
RUN pnpm fetch --frozen-lockfile && \
    # 清理缓存以减少层大小
    pnpm store prune

# 2. Deps 阶段：安装所有依赖（包括 devDependencies，因为构建可能需要它们）
FROM base AS deps
WORKDIR /app
COPY --from=fetcher /app/pnpm-lock.yaml ./
COPY --from=fetcher /app/pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/scraper/package.json ./packages/scraper/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN pnpm install --frozen-lockfile --prefer-offline && \
    # 清理不必要的文件
    find . -name "*.log" -delete && \
    find . -name "*.tmp" -delete && \
    rm -rf /tmp/* && \
    pnpm store prune

FROM base AS builder
WORKDIR /app
COPY --from=deps /app /app
# 修改为更精确的复制方式，避免复制node_modules
COPY .github ./.github
COPY .gitignore ./
COPY .npmrc ./
COPY .nvmrc ./

# Admin 应用文件
COPY apps/admin/prisma ./apps/admin/prisma
COPY apps/admin/src ./apps/admin/src
COPY apps/admin/public ./apps/admin/public
COPY apps/admin/next.config.js ./apps/admin/
COPY apps/admin/postcss.config.js ./apps/admin/
COPY apps/admin/tailwind.config.js ./apps/admin/
COPY apps/admin/tsconfig.json ./apps/admin/
COPY apps/admin/auth.ts ./apps/admin/
COPY apps/admin/components.json ./apps/admin/
COPY apps/admin/eslint.config.mjs ./apps/admin/
COPY apps/admin/next-env.d.ts ./apps/admin/
COPY apps/admin/.npmrc ./apps/admin/

# Web 应用文件
COPY apps/web/app ./apps/web/app
COPY apps/web/components ./apps/web/components
COPY apps/web/config ./apps/web/config
COPY apps/web/contexts ./apps/web/contexts
COPY apps/web/i18n ./apps/web/i18n
COPY apps/web/lib ./apps/web/lib
COPY apps/web/messages ./apps/web/messages
COPY apps/web/pages ./apps/web/pages
COPY apps/web/public ./apps/web/public
COPY apps/web/styles ./apps/web/styles
COPY apps/web/types ./apps/web/types
COPY apps/web/services ./apps/web/services
COPY apps/web/next.config.js ./apps/web/
COPY apps/web/postcss.config.js ./apps/web/
COPY apps/web/tailwind.config.js ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/middleware.ts ./apps/web/
COPY apps/web/next-env.d.ts ./apps/web/
COPY apps/web/eslint.config.mjs ./apps/web/
COPY apps/web/.npmrc ./apps/web/
COPY apps/web/.prettierrc ./apps/web/

# Packages 文件
COPY packages/types/src ./packages/types/src
COPY packages/types/tsconfig.json ./packages/types/
COPY packages/scraper/src ./packages/scraper/src
COPY packages/scraper/tsconfig.json ./packages/scraper/
COPY packages/ui/src ./packages/ui/src

# 根目录文件
COPY turbo.json eslint.config.js LICENSE ./

# 确保数据库环境变量可用
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# 生成Prisma客户端并构建应用
RUN cd apps/admin && npx prisma generate && \
    cd /app && \
    pnpm turbo run build && \
    # 清理构建缓存和临时文件
    rm -rf .turbo/cache && \
    rm -rf node_modules/.cache && \
    find . -name "*.log" -delete && \
    find . -name "*.tmp" -delete && \
    rm -rf /tmp/*

FROM base AS admin-runner
WORKDIR /app
COPY --from=builder /app/apps/admin/.next ./apps/admin/.next
COPY --from=builder /app/apps/admin/package.json ./apps/admin/package.json
COPY --from=builder /app/apps/admin/prisma ./apps/admin/prisma
COPY --from=builder /app/apps/admin/public ./apps/admin/public
COPY --from=builder /app/apps/admin/next.config.js ./apps/admin/next.config.js
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# 复制必要的 packages
COPY --from=builder /app/packages ./packages

# 安装生产依赖
RUN pnpm install --frozen-lockfile --prod && \
    # 生成 Prisma 客户端
    cd apps/admin && npx prisma generate && \
    # 清理不必要的文件
    find . -name "*.log" -delete && \
    find . -name "*.tmp" -delete && \
    rm -rf /tmp/* && \
    pnpm store prune

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@10.10.0 && \
    # 清理 npm 缓存
    npm cache clean --force

WORKDIR /app/apps/admin
EXPOSE 3001
CMD ["pnpm", "start"]

FROM base AS web-runner
WORKDIR /app
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/next.config.js ./apps/web/next.config.js
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# 复制必要的 packages
COPY --from=builder /app/packages ./packages

# 安装生产依赖
RUN pnpm install --frozen-lockfile --prod && \
    # 清理不必要的文件
    find . -name "*.log" -delete && \
    find . -name "*.tmp" -delete && \
    rm -rf /tmp/* && \
    pnpm store prune

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@10.10.0 && \
    # 清理 npm 缓存
    npm cache clean --force

WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]