# TrendHub 认证环境变量配置指南

本文档提供了设置 TrendHub 应用程序认证系统所需的环境变量配置说明。

## 基础认证配置

在项目根目录的 `.env.local` 文件中添加以下基本配置：

```
# Next Auth 基本配置
AUTH_SECRET=your-auth-secret-key-here   # 随机密钥，用于加密会话和令牌
NEXTAUTH_URL=http://localhost:3000      # 开发环境URL，生产环境应该是实际域名
```

## OAuth 提供商配置

### Google 登录

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目或选择现有项目
3. 导航至 "API 和服务" > "凭据"
4. 点击 "创建凭据" > "OAuth 客户端 ID"
5. 应用类型选择 "Web 应用"
6. 添加授权重定向 URI：`http://localhost:3000/api/auth/callback/google` (开发环境)
7. 创建并复制生成的客户端 ID 和密钥

将获取的凭据添加到 `.env.local` 文件：

```
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### GitHub 登录

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 "New OAuth App"
3. 填写应用信息
4. 授权回调 URL 设置为：`http://localhost:3000/api/auth/callback/github` (开发环境)
5. 注册应用并复制生成的客户端 ID 和密钥

将获取的凭据添加到 `.env.local` 文件：

```
# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## 邮箱登录配置 (Magic Links)

为了启用无密码的邮箱链接登录，我们使用 Resend 作为邮件提供商。

1. 访问 [Resend](https://resend.com/) 并创建账户
2. 获取 API 密钥
3. 验证发送邮件的域名

将获取的信息添加到 `.env.local` 文件：

```
# Resend Email Provider
AUTH_RESEND_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com  # 必须是已验证的域名
```

## 生产环境配置

在生产环境中，使用以下配置：

```
NODE_ENV=production
NEXTAUTH_URL=https://your-production-domain.com
```

确保更新所有 OAuth 提供商的回调 URL 为生产环境 URL，格式为：

- Google: `https://your-production-domain.com/api/auth/callback/google`
- GitHub: `https://your-production-domain.com/api/auth/callback/github`

## 故障排除

常见问题及解决方法：

1. **登录失败**：确保环境变量正确设置，特别是 `AUTH_SECRET` 和 `NEXTAUTH_URL`。
2. **OAuth 登录错误**：检查客户端 ID 和密钥是否正确，回调 URL 是否正确配置。
3. **邮箱链接登录失败**：确保 Resend API 密钥有效，发件邮箱域名已验证。
4. **中间件错误**：注意 Next.js Edge Runtime 的限制，避免使用不兼容的 Node.js 模块。

如需更多帮助，请参考 [Auth.js 文档](https://authjs.dev/)。
