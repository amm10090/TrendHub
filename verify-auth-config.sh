#!/bin/bash

echo "=== TrendHub 认证配置验证 ==="
echo ""

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "❌ .env 文件不存在"
    echo "请运行: cp .env.docker.fixed .env"
    exit 1
fi

echo "✅ .env 文件存在"
echo ""

# 检查关键环境变量
echo "检查关键环境变量："

check_env_var() {
    local var_name=$1
    local var_value=$(grep "^${var_name}=" .env | cut -d'=' -f2- | tr -d '"')
    
    if [ -z "$var_value" ]; then
        echo "❌ $var_name: 未设置"
        return 1
    else
        echo "✅ $var_name: $var_value"
        return 0
    fi
}

# 检查必需的环境变量
check_env_var "AUTH_SECRET"
check_env_var "NEXTAUTH_SECRET"
check_env_var "NEXTAUTH_URL"
check_env_var "NEXTAUTH_URL_INTERNAL"
check_env_var "NEXTAUTH_PUBLIC_URL"
check_env_var "DATABASE_URL"

echo ""

# 检查 AUTH_TRUST_HOST
if grep -q "AUTH_TRUST_HOST=true" .env; then
    echo "✅ AUTH_TRUST_HOST: true"
else
    echo "❌ AUTH_TRUST_HOST: 未设置或不为 true"
fi

echo ""

# 验证 URL 配置
echo "验证 URL 配置："

nextauth_url=$(grep "^NEXTAUTH_URL=" .env | cut -d'=' -f2- | tr -d '"')
nextauth_internal=$(grep "^NEXTAUTH_URL_INTERNAL=" .env | cut -d'=' -f2- | tr -d '"')
nextauth_public=$(grep "^NEXTAUTH_PUBLIC_URL=" .env | cut -d'=' -f2- | tr -d '"')

if [[ "$nextauth_url" == "http://localhost:3001" ]]; then
    echo "✅ NEXTAUTH_URL 使用正确的容器内部地址"
else
    echo "❌ NEXTAUTH_URL 应该设置为 http://localhost:3001"
fi

if [[ "$nextauth_internal" == "http://localhost:3001" ]]; then
    echo "✅ NEXTAUTH_URL_INTERNAL 使用正确的容器内部地址"
else
    echo "❌ NEXTAUTH_URL_INTERNAL 应该设置为 http://localhost:3001"
fi

if [[ "$nextauth_public" == http://82.25.95.136:3001 ]]; then
    echo "✅ NEXTAUTH_PUBLIC_URL 使用正确的外部地址"
else
    echo "⚠️  NEXTAUTH_PUBLIC_URL: $nextauth_public (请确认这是正确的外部地址)"
fi

echo ""

# 检查容器状态
echo "检查容器状态："
if docker-compose ps | grep -q "admin.*Up"; then
    echo "✅ admin 容器正在运行"
else
    echo "❌ admin 容器未运行"
fi

if docker-compose ps | grep -q "postgres.*Up"; then
    echo "✅ postgres 容器正在运行"
else
    echo "❌ postgres 容器未运行"
fi

echo ""

# 测试端点可访问性
echo "测试端点可访问性："

test_endpoint() {
    local url=$1
    local name=$2
    
    if curl -s -f --max-time 5 "$url" > /dev/null 2>&1; then
        echo "✅ $name: 可访问"
    else
        echo "❌ $name: 不可访问"
    fi
}

test_endpoint "http://82.25.95.136:3001/api/auth/csrf" "CSRF 端点"
test_endpoint "http://82.25.95.136:3001/api/auth/providers" "Providers 端点"
test_endpoint "http://82.25.95.136:3001/en/login" "登录页面"

echo ""

# 检查最近的错误日志
echo "检查最近的错误日志："
if docker-compose logs admin 2>/dev/null | grep -i "error\|csrf\|missing" | tail -5 | grep -q .; then
    echo "❌ 发现错误日志："
    docker-compose logs admin 2>/dev/null | grep -i "error\|csrf\|missing" | tail -5
else
    echo "✅ 未发现明显错误"
fi

echo ""
echo "=== 验证完成 ==="
echo ""

# 提供修复建议
echo "修复建议："
echo "1. 如果发现配置错误，请运行: ./fix-csrf-error.sh"
echo "2. 如果容器未运行，请运行: docker-compose up -d"
echo "3. 如果端点不可访问，请检查防火墙设置"
echo "4. 清除浏览器缓存和 Cookie 后重试" 