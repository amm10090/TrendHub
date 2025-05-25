 #!/bin/bash

echo "=== NextAuth 环境变量修复脚本 ==="
echo ""

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "❌ 错误：未找到 .env 文件"
    exit 1
fi

# 备份原始 .env 文件
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ 已备份 .env 文件"

# 读取当前环境变量
source .env

# 获取服务器 IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "YOUR_SERVER_IP")

echo "🔧 检查和修复环境变量..."

# 检查 AUTH_SECRET
if [ -z "$AUTH_SECRET" ]; then
    echo "⚠️  AUTH_SECRET 未设置，正在生成..."
    NEW_AUTH_SECRET=$(openssl rand -hex 32)
    echo "AUTH_SECRET=\"$NEW_AUTH_SECRET\"" >> .env
    echo "✅ 已生成 AUTH_SECRET"
else
    echo "✅ AUTH_SECRET 已设置"
fi

# 检查 NEXTAUTH_SECRET
if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "⚠️  NEXTAUTH_SECRET 未设置，使用 AUTH_SECRET..."
    if [ -n "$AUTH_SECRET" ]; then
        echo "NEXTAUTH_SECRET=\"$AUTH_SECRET\"" >> .env
    else
        # 重新读取可能新生成的 AUTH_SECRET
        source .env
        echo "NEXTAUTH_SECRET=\"$AUTH_SECRET\"" >> .env
    fi
    echo "✅ 已设置 NEXTAUTH_SECRET"
else
    echo "✅ NEXTAUTH_SECRET 已设置"
fi

# 检查 NEXTAUTH_PUBLIC_URL
if [ -z "$NEXTAUTH_PUBLIC_URL" ]; then
    echo "⚠️  NEXTAUTH_PUBLIC_URL 未设置，使用服务器 IP..."
    echo "NEXTAUTH_PUBLIC_URL=\"http://$SERVER_IP:3001\"" >> .env
    echo "✅ 已设置 NEXTAUTH_PUBLIC_URL 为 http://$SERVER_IP:3001"
else
    echo "✅ NEXTAUTH_PUBLIC_URL 已设置为: $NEXTAUTH_PUBLIC_URL"
fi

# 检查 AUTH_TRUST_HOST
if ! grep -q "AUTH_TRUST_HOST" .env; then
    echo "⚠️  AUTH_TRUST_HOST 未设置..."
    echo "AUTH_TRUST_HOST=true" >> .env
    echo "✅ 已设置 AUTH_TRUST_HOST=true"
else
    echo "✅ AUTH_TRUST_HOST 已设置"
fi

# 检查 NODE_ENV
if [ -z "$NODE_ENV" ]; then
    echo "⚠️  NODE_ENV 未设置..."
    echo "NODE_ENV=production" >> .env
    echo "✅ 已设置 NODE_ENV=production"
else
    echo "✅ NODE_ENV 已设置为: $NODE_ENV"
fi

# 检查 NEXT_PUBLIC_API_URL
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    echo "⚠️  NEXT_PUBLIC_API_URL 未设置..."
    echo "NEXT_PUBLIC_API_URL=\"http://$SERVER_IP:3001/api\"" >> .env
    echo "✅ 已设置 NEXT_PUBLIC_API_URL"
else
    echo "✅ NEXT_PUBLIC_API_URL 已设置"
fi

echo ""
echo "=== 环境变量修复完成 ==="
echo ""
echo "当前关键配置："
echo "- 服务器 IP: $SERVER_IP"
echo "- NEXTAUTH_PUBLIC_URL: $(grep NEXTAUTH_PUBLIC_URL .env | cut -d'=' -f2 | tr -d '"')"
echo "- AUTH_TRUST_HOST: $(grep AUTH_TRUST_HOST .env | cut -d'=' -f2)"
echo "- NODE_ENV: $(grep NODE_ENV .env | cut -d'=' -f2)"
echo ""
echo "下一步："
echo "1. 运行: docker-compose down"
echo "2. 运行: docker-compose up -d --force-recreate"
echo "3. 等待服务启动后测试登录"
echo ""
echo "如果需要自定义域名，请手动编辑 .env 文件中的 NEXTAUTH_PUBLIC_URL"