# TrendHub 认证配置指南

TrendHub 支持多种认证方式，包括账号密码登录、OAuth 第三方登录以及邮箱验证登录。本文档将指导您如何配置这些认证方式所需的环境变量。

## 基础认证配置

为确保认证系统正常工作，您需要在 `.env` 文件中设置以下基础配置：

```
# 基础认证配置
AUTH_SECRET=your-auth-secret  # 用于加密 JWT 的密钥，必须设置且足够复杂
NEXTAUTH_URL=http://localhost:3000  # 应用的基础 URL（开发环境）
```

## OAuth 提供商配置

### Google 认证

要启用 Google 登录，您需要在 [Google Cloud Console](https://console.cloud.google.com/) 创建项目并配置 OAuth 凭据，然后在 `.env` 文件中添加：

```
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

配置步骤：

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目或选择现有项目
3. 导航至 "API 和服务" > "凭据"
4. 点击 "创建凭据" > "OAuth 客户端 ID"
5. 应用类型选择 "Web 应用"
6. 添加授权重定向 URI：`http://localhost:3000/api/auth/callback/google` (开发环境) 和生产环境 URL
7. 创建并复制生成的客户端 ID 和客户端密钥

### GitHub 认证

要启用 GitHub 登录，您需要在 GitHub 创建 OAuth 应用并配置以下环境变量：

```
# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

配置步骤：

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 "New OAuth App"
3. 填写应用信息
4. Authorization callback URL 设置为：`http://localhost:3000/api/auth/callback/github` (开发环境) 和生产环境 URL
5. 注册应用并复制生成的客户端 ID 和客户端密钥

## 邮箱验证登录配置

要启用邮箱验证登录，您需要配置 SMTP 服务器信息：

```
# Email Provider
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email-username
EMAIL_SERVER_PASSWORD=your-email-password
EMAIL_FROM=noreply@example.com
```

您可以使用以下服务：

- [SendGrid](https://sendgrid.com/)
- [Mailgun](https://www.mailgun.com/)
- [Amazon SES](https://aws.amazon.com/ses/)
- 或者任何支持 SMTP 的邮件服务

## 生产环境配置

在生产环境中，确保设置以下额外的配置：

```
NODE_ENV=production
NEXTAUTH_URL=https://your-production-domain.com
```

并确保为生产环境更新所有 OAuth 提供商的回调 URL。

## 故障排除

如果认证系统出现问题，请检查：

1. 环境变量是否正确设置
2. OAuth 提供商的回调 URL 是否正确配置
3. 查看服务器日志中的错误信息
4. 确保数据库连接正常，认证相关表已正确创建

如需进一步帮助，请联系系统管理员或查阅 [NextAuth.js 文档](https://next-auth.js.org/)。
