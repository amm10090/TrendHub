# 生产环境 Auth.js ClientFetchError 修复指南

## 问题描述

在生产环境中遇到 `ClientFetchError: There was a problem with the server configuration` 错误，这通常是由于环境变量配置不正确或 Auth.js 5.0 配置问题导致的。

## 解决方案

### 1. 环境变量配置

确保在生产环境中设置以下关键环境变量：

```bash
# 必需的基础配置
AUTH_SECRET="your-super-secret-key-here-at-least-32-characters"
AUTH_URL="https://your-domain.com:3001"  # 生产环境的实际域名
AUTH_TRUST_HOST=true

# 向后兼容配置
NEXTAUTH_SECRET="your-super-secret-key-here-at-least-32-characters"  # 与 AUTH_SECRET 相同
NEXTAUTH_URL="https://your-domain.com:3001"  # 与 AUTH_URL 相同
NEXTAUTH_TRUST_HOST=true

# 数据库配置
DATABASE_URL="postgresql://username:password@host:port/database"

# 生产环境配置
NODE_ENV=production
```

### 2. Docker 环境特殊配置

如果使用 Docker 部署，需要额外配置：

```bash
# Docker 内部通信地址
NEXTAUTH_URL_INTERNAL="http://admin:3001"

# 外部访问地址
NEXTAUTH_PUBLIC_URL="https://your-domain.com:3001"
```

### 3. OAuth 提供商配置（可选）

只有在需要使用第三方登录时才配置：

```bash
# Google OAuth（可选）
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth（可选）
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Resend 邮件服务（可选）
AUTH_RESEND_KEY="your-resend-api-key"
EMAIL_FROM="noreply@your-domain.com"
```

### 4. 预设管理员账户

为了确保能够登录，设置预设管理员：

```bash
PRESET_ADMIN_EMAIL="admin@your-domain.com"
PRESET_ADMIN_PASSWORD="your-secure-admin-password"
```

## 关键修复点

### 1. 条件性提供商加载

修改后的 `auth.ts` 现在只在环境变量存在时才加载对应的认证提供商，避免了因缺少环境变量导致的错误。

### 2. 改进的错误处理

- 添加了详细的错误日志
- 在生产环境中关闭调试模式
- 改进了重定向错误处理

### 3. 安全配置

- 在生产环境中启用安全 Cookie
- 正确配置 `trustHost` 选项
- 添加了 URL 验证

## 部署检查清单

在部署到生产环境前，请确认：

- [ ] `AUTH_SECRET` 已设置且足够复杂（至少32字符）
- [ ] `AUTH_URL` 指向正确的生产域名
- [ ] `DATABASE_URL` 连接正确
- [ ] `NODE_ENV=production` 已设置
- [ ] `AUTH_TRUST_HOST=true` 已设置
- [ ] 预设管理员账户已配置
- [ ] 数据库迁移已完成
- [ ] 防火墙允许必要的端口访问

## 故障排除

### 1. 检查环境变量

```bash
# 在容器内检查环境变量
docker exec -it your-container-name env | grep AUTH
```

### 2. 查看应用日志

```bash
# 查看容器日志
docker logs your-container-name

# 查看实时日志
docker logs -f your-container-name
```

### 3. 测试数据库连接

确保应用能够连接到数据库，检查 `DATABASE_URL` 是否正确。

### 4. 验证域名解析

确保 `AUTH_URL` 中的域名能够正确解析到您的服务器。

## 常见错误及解决方法

### 错误：`AUTH_SECRET` 未设置

```bash
# 生成一个安全的密钥
openssl rand -base64 32
```

### 错误：域名不匹配

确保 `AUTH_URL` 与实际访问的域名完全一致，包括协议（http/https）和端口。

### 错误：数据库连接失败

检查数据库是否运行，网络是否可达，凭据是否正确。

## 联系支持

如果问题仍然存在，请提供：

1. 完整的错误日志
2. 环境变量配置（隐藏敏感信息）
3. 部署方式（Docker、PM2、Vercel等）
4. 网络架构（是否使用代理、负载均衡器等）
