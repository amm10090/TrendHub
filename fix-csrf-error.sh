#!/bin/bash

echo "=== TrendHub CSRF 错误修复脚本 ==="
echo ""

# 检查是否存在环境变量文件
if [ ! -f ".env" ]; then
    echo "创建 .env 文件..."
    cp .env.docker.fixed .env
    echo "✓ .env 文件已创建"
else
    echo "✓ .env 文件已存在"
fi

# 确保关键环境变量设置正确
echo ""
echo "检查关键环境变量..."

# 检查 AUTH_TRUST_HOST
if ! grep -q "AUTH_TRUST_HOST=true" .env; then
    echo "添加 AUTH_TRUST_HOST=true..."
    echo "AUTH_TRUST_HOST=true" >> .env
fi

# 确保 NEXTAUTH_URL 使用 localhost
if grep -q "NEXTAUTH_URL=http://admin:3001" .env; then
    echo "修复 NEXTAUTH_URL..."
    sed -i 's|NEXTAUTH_URL=http://admin:3001|NEXTAUTH_URL=http://localhost:3001|g' .env
fi

if grep -q "NEXTAUTH_URL_INTERNAL=http://admin:3001" .env; then
    echo "修复 NEXTAUTH_URL_INTERNAL..."
    sed -i 's|NEXTAUTH_URL_INTERNAL=http://admin:3001|NEXTAUTH_URL_INTERNAL=http://localhost:3001|g' .env
fi

echo "✓ 环境变量检查完成"

# 停止现有容器
echo ""
echo "停止现有容器..."
docker-compose down

# 清理可能的缓存问题
echo ""
echo "清理 Docker 缓存..."
docker system prune -f

# 重新启动服务
echo ""
echo "重新启动服务..."
docker-compose up -d

# 等待服务启动
echo ""
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo ""
echo "检查服务状态..."
docker-compose ps

# 检查 admin 容器日志
echo ""
echo "检查 admin 容器日志（最后 20 行）..."
docker-compose logs --tail=20 admin

# 测试 CSRF 端点
echo ""
echo "测试 CSRF 端点..."
sleep 5

if curl -s -f http://82.25.95.136:3001/api/auth/csrf > /dev/null; then
    echo "✓ CSRF 端点可访问"
else
    echo "✗ CSRF 端点不可访问，请检查日志"
fi

# 测试登录页面
if curl -s -f http://82.25.95.136:3001/en/login > /dev/null; then
    echo "✓ 登录页面可访问"
else
    echo "✗ 登录页面不可访问"
fi

echo ""
echo "=== 修复完成 ==="
echo ""
echo "如果问题仍然存在，请："
echo "1. 检查容器日志：docker-compose logs admin"
echo "2. 确保防火墙允许端口 3001"
echo "3. 检查 Nginx 配置（如果使用）"
echo "4. 清除浏览器缓存和 Cookie"
echo ""
echo "访问地址：http://82.25.95.136:3001/en/login" 