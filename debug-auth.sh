#!/bin/bash

echo "=== TrendHub 认证配置调试 ==="
echo ""

# 检查环境变量
echo "1. 检查关键环境变量:"
echo "AUTH_SECRET: ${AUTH_SECRET:+已设置}"
echo "NEXTAUTH_URL: ${NEXTAUTH_URL:-未设置}"
echo "NEXTAUTH_PUBLIC_URL: ${NEXTAUTH_PUBLIC_URL:-未设置}"
echo "DATABASE_URL: ${DATABASE_URL:+已设置}"
echo ""

# 检查 NextAuth 配置文件
echo "2. 检查配置文件:"
if [ -f "apps/admin/auth.ts" ]; then
    echo "✓ auth.ts 存在"
else
    echo "✗ auth.ts 不存在"
fi

if [ -f "apps/admin/src/app/api/auth/[...nextauth]/route.ts" ]; then
    echo "✓ API 路由存在"
else
    echo "✗ API 路由不存在"
fi

if [ -f "apps/admin/src/middleware.ts" ]; then
    echo "✓ 中间件存在"
else
    echo "✗ 中间件不存在"
fi
echo ""

# 检查端口和服务
echo "3. 检查服务状态:"
if curl -s http://localhost:3001/api/auth/csrf > /dev/null; then
    echo "✓ CSRF 端点可访问"
else
    echo "✗ CSRF 端点不可访问"
fi

if curl -s http://localhost:3001/api/auth/providers > /dev/null; then
    echo "✓ 提供商端点可访问"
else
    echo "✗ 提供商端点不可访问"
fi
echo ""

# 检查数据库连接
echo "4. 检查数据库连接:"
cd apps/admin
if npx prisma db push --accept-data-loss > /dev/null 2>&1; then
    echo "✓ 数据库连接正常"
else
    echo "✗ 数据库连接失败"
fi
cd ../..
echo ""

echo "=== 调试完成 ==="
echo ""
echo "如果发现问题，请检查："
echo "1. 环境变量是否正确设置"
echo "2. 数据库是否正在运行"
echo "3. NextAuth 配置是否正确"
echo "4. 端口 3001 是否被占用" 