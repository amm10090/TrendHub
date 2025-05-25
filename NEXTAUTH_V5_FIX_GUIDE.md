# NextAuth.js 5.0 修复指南

## 问题概述

你的 AuthJS 配置存在以下主要问题：

1. **NextAuth 5.0 beta 版本配置不兼容**
2. **CSRF 令牌错误**
3. **回调函数语法错误**
4. **环境变量配置不完整**

## 已修复的问题

### 1. 更新了 `auth.ts` 配置

**主要修复：**

- 修复了 `Credentials` 提供商的配置语法
- 简化了回调函数的实现
- 移除了不兼容的配置选项
- 修复了事件处理器的类型错误

### 2. 环境变量配置

**添加了必要的环境变量：**

```bash
# 在 .env 文件中添加
AUTH_TRUST_HOST=true
```

### 3. API 路由优化

**确保 API 路由正确导出：**

```typescript
// apps/admin/src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/../auth";
export const { GET, POST } = handlers;
```

## 关键修复点

### 1. Credentials Provider 配置

**之前（错误）：**

```typescript
Credentials({
  async authorize(credentials) {
    // 复杂的类型检查
    if (typeof credentials !== "object" || credentials === null) {
      return null;
    }
    // ...
  },
});
```

**现在（正确）：**

```typescript
Credentials({
  name: "credentials",
  credentials: {
    email: { label: "邮箱", type: "email" },
    password: { label: "密码", type: "password" },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials?.password) {
      return null;
    }
    // ...
  },
});
```

### 2. 回调函数简化

**之前（复杂）：**

```typescript
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id;
    }
    return token;
  },
  async session({ session, token }) {
    if (session.user && token.id) {
      session.user.id = token.id as string;
    }
    return session;
  },
  async redirect({ url, baseUrl }) {
    // 复杂的重定向逻辑
  }
}
```

**现在（简化）：**

```typescript
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id;
    }
    return token;
  },
  async session({ session, token }) {
    if (session.user && token.id) {
      session.user.id = token.id as string;
    }
    return session;
  },
  async redirect({ url, baseUrl }) {
    const publicUrl = process.env.NEXTAUTH_PUBLIC_URL;

    if (url.startsWith("/")) {
      return `${publicUrl || baseUrl}${url}`;
    }

    if (publicUrl && url.startsWith(publicUrl)) {
      return url;
    }

    return publicUrl || baseUrl;
  },
}
```

### 3. 事件处理器修复

**之前（类型错误）：**

```typescript
events: {
  async signOut(message) {
    console.log("用户登出:", message.token?.email || message.session?.user?.email);
  }
}
```

**现在（类型安全）：**

```typescript
events: {
  async signIn(message) {
    console.log("用户登录:", message.user.email);
  },
  async signOut() {
    console.log("用户已登出");
  },
}
```

## 测试步骤

1. **重启开发服务器：**

```bash
cd apps/admin
npm run dev
```

2. **测试 CSRF 端点：**

```bash
curl http://localhost:3001/api/auth/csrf
```

3. **测试提供商端点：**

```bash
curl http://localhost:3001/api/auth/providers
```

4. **运行调试脚本：**

```bash
chmod +x debug-auth.sh
./debug-auth.sh
```

## 常见问题解决

### 1. CSRF 错误

- 确保 `AUTH_SECRET` 环境变量已设置
- 确保 `AUTH_TRUST_HOST=true` 已添加到环境变量

### 2. 重定向问题

- 检查 `NEXTAUTH_PUBLIC_URL` 是否正确设置
- 确保中间件配置正确

### 3. 数据库连接问题

- 运行 `npx prisma db push` 确保数据库同步
- 检查 `DATABASE_URL` 环境变量

## 下一步

1. 测试登录功能
2. 检查会话管理
3. 验证重定向逻辑
4. 测试登出功能

如果仍有问题，请检查浏览器控制台和服务器日志获取更多信息。
