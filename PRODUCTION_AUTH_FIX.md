# 生产环境 Auth.js ClientFetchError 修复指南

## 问题描述

在生产环境中遇到 `ClientFetchError: There was a problem with the server configuration` 错误。

## 快速修复步骤

### 1. 检查必需的环境变量

确保以下环境变量已正确设置：

```bash
# 必需配置
AUTH_SECRET="your-super-secret-key-here-at-least-32-characters"
AUTH_URL="https://your-domain.com:3001"
AUTH_TRUST_HOST=true
DATABASE_URL="postgresql://username:password@host:port/database"
NODE_ENV=production

# 向后兼容
NEXTAUTH_SECRET="your-super-secret-key-here-at-least-32-characters"
NEXTAUTH_URL="https://your-domain.com:3001"
NEXTAUTH_TRUST_HOST=true

# 预设管理员（确保能登录）
PRESET_ADMIN_EMAIL="admin@your-domain.com"
PRESET_ADMIN_PASSWORD="your-secure-password"
```

### 2. Docker 环境额外配置

```bash
# Docker 内部通信
NEXTAUTH_URL_INTERNAL="http://admin:3001"
# 外部访问
NEXTAUTH_PUBLIC_URL="https://your-domain.com:3001"
```

### 3. 生成安全密钥

```bash
# 生成 AUTH_SECRET
openssl rand -base64 32
```

## 主要修复内容

1. **条件性提供商加载** - 只在环境变量存在时加载 OAuth 提供商
2. **改进错误处理** - 添加详细日志和错误捕获
3. **生产环境优化** - 关闭调试模式，启用安全 Cookie
4. **URL 配置修复** - 正确处理重定向和 URL 验证

## 验证修复

1. 检查环境变量：

```bash
docker exec -it container-name env | grep AUTH
```

2. 查看日志：

```bash
docker logs -f container-name
```

3. 测试登录：
   使用预设管理员账户登录测试

## 常见问题

- **AUTH_SECRET 未设置**：使用 `openssl rand -base64 32` 生成
- **域名不匹配**：确保 AUTH_URL 与实际访问域名一致
- **数据库连接失败**：检查 DATABASE_URL 和网络连接

修复完成后重启应用即可解决 ClientFetchError 问题。
