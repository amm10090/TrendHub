FROM node:18-alpine AS base

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
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm turbo run build

# 生产阶段 - Admin 应用
FROM base AS admin-runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/apps/admin/next.config.js ./
COPY --from=builder /app/apps/admin/package.json ./
COPY --from=builder /app/apps/admin/.next ./.next
COPY --from=builder /app/apps/admin/public ./public
COPY --from=builder /app/apps/admin/node_modules ./node_modules
COPY --from=builder /app/node_modules ./node_modules

# 如果使用 Prisma
COPY --from=builder /app/apps/admin/prisma ./prisma

EXPOSE 3001
CMD ["pnpm", "start"]