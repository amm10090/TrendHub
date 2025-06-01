FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@10.10.0

FROM base AS fetcher
WORKDIR /app
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch --frozen-lockfile

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
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile --prefer-offline

FROM base AS builder
WORKDIR /app
COPY --from=deps /app /app

# 复制核心文件和配置
COPY .github ./.github
COPY .gitignore ./
COPY .npmrc ./
COPY turbo.json ./
COPY eslint.config.js ./
COPY LICENSE ./

# Admin 应用文件
COPY apps/admin/prisma ./apps/admin/prisma
COPY apps/admin/src ./apps/admin/src
COPY apps/admin/public ./apps/admin/public
COPY apps/admin/next.config.js ./apps/admin/
COPY apps/admin/postcss.config.js ./apps/admin/
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
COPY packages/ui/tsconfig.json ./packages/ui/

# 确保数据库环境变量可用
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# 生成Prisma客户端并构建应用
RUN cd apps/admin && npx prisma generate && \
    cd /app && \
    pnpm turbo run build

FROM base AS admin-deploy-intermediate
WORKDIR /app
COPY --from=builder /app /app
RUN pnpm deploy --filter=@trend-hub/admin --prod /prod/admin --legacy
RUN cp -r apps/admin/.next /prod/admin/.next
# 确保复制Prisma生成的文件
RUN cp -r apps/admin/prisma /prod/admin/prisma 2>/dev/null || true
RUN cp -r apps/admin/node_modules/.prisma /prod/admin/node_modules/.prisma 2>/dev/null || true
RUN cp -r apps/admin/node_modules/@prisma /prod/admin/node_modules/@prisma 2>/dev/null || true

FROM node:20-alpine AS admin-runner
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@10.10.0
WORKDIR /app
COPY --from=admin-deploy-intermediate /prod/admin /app

# 在运行时重新生成Prisma客户端（如果需要）
RUN if [ -f prisma/schema.prisma ]; then npx prisma generate; fi

EXPOSE 3001
CMD ["pnpm", "start"]

FROM base AS web-deploy-intermediate
WORKDIR /app
COPY --from=builder /app /app
RUN pnpm deploy --filter=front-end --prod /prod/web --legacy
RUN cp -r apps/web/.next /prod/web/.next

FROM node:20-alpine AS web-runner
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@10.10.0
WORKDIR /app
COPY --from=web-deploy-intermediate /prod/web /app
EXPOSE 3000
CMD ["pnpm", "start"]