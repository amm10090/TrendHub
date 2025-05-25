 #!/bin/bash

echo "=== TrendHub Docker CSRF 修复脚本 ==="
echo ""

# 检查是否在正确的目录
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 错误：请在 TrendHub 根目录运行此脚本"
    exit 1
fi

# 检查容器状态
echo "1. 检查容器状态..."
if ! docker ps | grep -q "trendhub-admin-1"; then
    echo "❌ 错误：admin 容器未运行"
    exit 1
fi

echo "✅ 容器运行正常"

# 检查当前环境变量配置
echo "2. 检查环境变量配置..."
if [ -f ".env.docker" ]; then
    echo "✅ 找到 .env.docker 文件"
    
    # 检查关键配置
    if grep -q "AUTH_SECRET=" .env.docker; then
        echo "✅ AUTH_SECRET 已配置"
    else
        echo "❌ AUTH_SECRET 未配置"
    fi
    
    if grep -q "NEXTAUTH_PUBLIC_URL=" .env.docker; then
        echo "✅ NEXTAUTH_PUBLIC_URL 已配置"
    else
        echo "❌ NEXTAUTH_PUBLIC_URL 未配置"
    fi
else
    echo "❌ 未找到 .env.docker 文件"
    exit 1
fi

# 重启 admin 容器以应用新配置
echo "3. 重启 admin 容器..."
docker-compose restart admin

# 等待容器启动
echo "4. 等待容器启动..."
sleep 15

# 检查容器日志
echo "5. 检查容器启动日志..."
docker logs trendhub-admin-1 --tail=10

# 测试 CSRF 端点
echo "6. 测试 CSRF 端点..."
sleep 5

# 测试内部访问
if docker exec trendhub-admin-1 curl -s -f http://localhost:3001/api/auth/csrf > /dev/null; then
    echo "✅ 容器内部 CSRF 端点正常"
else
    echo "❌ 容器内部 CSRF 端点异常"
fi

# 测试外部访问
if curl -s -f http://localhost:3001/api/auth/csrf > /dev/null; then
    echo "✅ 外部 CSRF 端点正常"
else
    echo "❌ 外部 CSRF 端点异常"
fi

# 测试 providers 端点
if curl -s -f http://localhost:3001/api/auth/providers > /dev/null; then
    echo "✅ 认证提供商端点正常"
else
    echo "❌ 认证提供商端点异常"
fi

echo ""
echo "7. 显示当前配置信息..."
echo "容器名称: trendhub-admin-1"
echo "内部地址: http://admin:3001"
echo "外部地址: $(grep NEXTAUTH_PUBLIC_URL .env.docker | cut -d'=' -f2)"
echo "AUTH_TRUST_HOST: $(grep AUTH_TRUST_HOST .env.docker | cut -d'=' -f2)"

echo ""
echo "=== 修复完成 ==="
echo ""
echo "如果问题仍然存在，请尝试："
echo "1. 完全重建容器: docker-compose down && docker-compose up -d --force-recreate"
echo "2. 清理浏览器缓存和 Cookie"
echo "3. 检查防火墙设置"
echo ""
echo "查看实时日志："
echo "docker logs trendhub-admin-1 -f"