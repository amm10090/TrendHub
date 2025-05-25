#!/bin/bash

echo "=== TrendHub NextAuth 调试脚本 ==="
echo ""

# 检查环境变量
echo "1. 检查环境变量配置："
echo "NEXTAUTH_PUBLIC_URL: ${NEXTAUTH_PUBLIC_URL:-未设置}"
echo "NEXTAUTH_URL: ${NEXTAUTH_URL:-未设置}"
echo "NODE_ENV: ${NODE_ENV:-未设置}"
echo ""

# 检查容器状态
echo "2. 检查容器状态："
docker-compose ps
echo ""

# 检查admin容器的环境变量
echo "3. 检查admin容器内的环境变量："
docker-compose exec admin printenv | grep -E "(NEXTAUTH|NODE_ENV)" | sort
echo ""

# 检查容器日志
echo "4. 最近的容器日志："
docker-compose logs --tail=20 admin
echo ""

# 测试内部连接
echo "5. 测试容器内部连接："
docker-compose exec admin curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/session || echo "内部连接失败"
echo ""

# 提供修复建议
echo "=== 修复建议 ==="
echo "如果看到重定向到 admin:3001，请确保："
echo "1. .env 文件中设置了正确的 NEXTAUTH_PUBLIC_URL"
echo "2. 重新启动容器: docker-compose down && docker-compose up -d"
echo "3. 清除浏览器缓存和Cookie"
echo ""
echo "正确的 .env 配置示例："
echo "NEXTAUTH_PUBLIC_URL=http://82.25.95.136:3001"
echo "NEXTAUTH_URL=http://admin:3001"
echo "NODE_ENV=production" 