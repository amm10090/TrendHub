# TrendHub Docker 部署指南

## NextAuth.js 容器环境配置问题解决方案

### 问题描述

在Docker容器环境中部署TrendHub时，NextAuth.js的URL配置会遇到以下问题：

1. **网络访问问题**：容器内部无法访问外部IP地址
2. **重定向问题**：登录后重定向到错误的URL
3. **会话共享问题**：不同域名下的会话无法正确共享

### 解决方案

#### 1. 环境变量配置

在您的 `.env` 文件中设置以下环境变量：

```bash
# NextAuth.js 配置
AUTH_SECRET="your-secret-key-here"
NEXTAUTH_SECRET="your-secret-key-here"

# Docker部署配置
NEXTAUTH_URL="http://admin:3001"                    # 容器内部通信地址
NEXTAUTH_URL_INTERNAL="http://admin:3001"           # 容器内部通信地址
NEXTAUTH_PUBLIC_URL="http://82.25.95.136:3001"     # 外部访问地址（替换为您的服务器IP）

# API配置
NEXT_PUBLIC_API_URL="http://82.25.95.136:3001/api" # 外部API地址

# 数据库配置
DATABASE_URL="postgresql://user:password@postgres:5432/trendhub"

# 预设管理员账户
PRESET_ADMIN_EMAIL="admin@example.com"
PRESET_ADMIN_PASSWORD="your-secure-password"

# 其他必要配置
NODE_ENV="production"
POSTGRES_USER="trendhub"
POSTGRES_PASSWORD="your-db-password"
POSTGRES_DB="trendhub"
```

#### 2. 关键配置说明

- **NEXTAUTH_URL**: 设置为容器名称 `http://admin:3001`，用于容器内部通信
- **NEXTAUTH_URL_INTERNAL**: 与 NEXTAUTH_URL 相同，确保内部通信正常
- **NEXTAUTH_PUBLIC_URL**: 设置为外部可访问的IP地址，用于重定向和会话管理
- **NEXT_PUBLIC_API_URL**: 前端应用访问API的地址

#### 3. Docker Compose 配置

确保 `docker-compose.yml` 中的admin服务配置如下：

```yaml
admin:
  image: amm0512/trendhub-admin:latest
  restart: always
  environment:
    - DATABASE_URL=${DATABASE_URL}
    - NEXTAUTH_URL=http://admin:3001 # 固定为容器名称
    - NEXTAUTH_URL_INTERNAL=http://admin:3001 # 固定为容器名称
    - NEXTAUTH_PUBLIC_URL=${NEXTAUTH_PUBLIC_URL} # 从环境变量读取外部地址
    - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    - AUTH_SECRET=${AUTH_SECRET}
    - NODE_ENV=${NODE_ENV}
    # ... 其他环境变量
  ports:
    - "3001:3001"
  depends_on:
    - postgres
```

#### 4. 部署步骤

1. **更新环境变量**：

   ```bash
   # 编辑 .env 文件
   nano .env

   # 设置您的服务器IP地址
   NEXTAUTH_PUBLIC_URL="http://YOUR_SERVER_IP:3001"
   NEXT_PUBLIC_API_URL="http://YOUR_SERVER_IP:3001/api"
   ```

2. **重新构建和启动容器**：

   ```bash
   # 停止现有容器
   docker-compose down

   # 拉取最新镜像
   docker-compose pull

   # 启动服务
   docker-compose up -d
   ```

3. **验证部署**：

   ```bash
   # 检查容器状态
   docker-compose ps

   # 查看日志
   docker-compose logs admin
   ```

#### 5. 故障排除

##### 问题1：Internal Server Error

**原因**：容器内部无法访问外部IP地址
**解决**：确保 `NEXTAUTH_URL` 设置为 `http://admin:3001`

##### 问题2：登录后重定向到localhost

**原因**：`NEXTAUTH_PUBLIC_URL` 未正确设置
**解决**：设置 `NEXTAUTH_PUBLIC_URL` 为外部可访问的IP地址

##### 问题3：重定向到容器内部地址 (admin:3001)

**现象**：访问 `http://82.25.95.136:3001` 被重定向到 `http://admin:3001/en/login`
**原因**：中间件使用了错误的基础URL进行重定向
**解决**：

1. 确保 `.env` 文件中设置了 `NEXTAUTH_PUBLIC_URL=http://82.25.95.136:3001`
2. 重新启动容器：`docker-compose down && docker-compose up -d`
3. 清除浏览器缓存和Cookie

##### 问题4：会话无法保持

**原因**：Cookie域名设置问题
**解决**：确保所有URL配置一致，使用相同的域名或IP

#### 6. 安全建议

1. **使用HTTPS**：在生产环境中配置SSL证书
2. **强密码**：为数据库和管理员账户设置强密码
3. **防火墙**：配置适当的防火墙规则
4. **定期更新**：保持Docker镜像和依赖项更新

#### 7. 监控和日志

```bash
# 实时查看日志
docker-compose logs -f admin

# 检查容器健康状态
docker-compose ps

# 进入容器调试
docker-compose exec admin sh
```

### 配置验证清单

- [ ] `NEXTAUTH_URL` 设置为 `http://admin:3001`
- [ ] `NEXTAUTH_PUBLIC_URL` 设置为外部IP地址
- [ ] `DATABASE_URL` 指向postgres容器
- [ ] `AUTH_SECRET` 和 `NEXTAUTH_SECRET` 已设置
- [ ] 容器可以正常启动
- [ ] 可以访问登录页面
- [ ] 登录后重定向正常
- [ ] 会话状态保持正常

按照以上配置，您的TrendHub应用应该能够在Docker环境中正常运行，解决NextAuth.js的URL配置问题。
