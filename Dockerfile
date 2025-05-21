FROM node:18-alpine AS base
ENV PATH /app/node_modules/.bin:$PATH
# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

# 设置工作目录
WORKDIR /app

# 安装依赖
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/scraper/package.json ./packages/scraper/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm turbo run build

# 生产阶段 - Admin 应用
FROM base AS admin-runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/apps/admin/next.config.js ./apps/admin/next.config.js
COPY --from=builder /app/apps/admin/package.json ./apps/admin/package.json
COPY --from=builder /app/apps/admin/.next ./apps/admin/.next
COPY --from=builder /app/apps/admin/public ./apps/admin/public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# 如果使用 Prisma
COPY --from=builder /app/apps/admin/prisma ./apps/admin/prisma

WORKDIR /app/apps/admin
EXPOSE 3001
CMD ["pnpm", "start", "--", "-p", "3001"]

# 生产阶段 - Web 应用
FROM base AS web-runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/apps/web/next.config.js ./apps/web/next.config.js
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start", "--", "-p", "3000"]