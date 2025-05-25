#!/bin/bash

echo "=== TrendHub CSRF 修复测试 ==="
echo "测试时间: $(date)"
echo ""

# 测试 CSRF 端点
echo "1. 测试 CSRF 端点..."
CSRF_RESPONSE=$(curl -s http://82.25.95.136:3001/api/auth/csrf)
if echo "$CSRF_RESPONSE" | jq -e '.csrfToken' > /dev/null 2>&1; then
    echo "✅ CSRF 端点正常工作"
    CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | jq -r '.csrfToken')
    echo "   CSRF Token: ${CSRF_TOKEN:0:20}..."
else
    echo "❌ CSRF 端点失败"
    echo "   响应: $CSRF_RESPONSE"
fi

echo ""

# 测试 providers 端点
echo "2. 测试 providers 端点..."
PROVIDERS_RESPONSE=$(curl -s http://82.25.95.136:3001/api/auth/providers)
if echo "$PROVIDERS_RESPONSE" | jq -e '.credentials' > /dev/null 2>&1; then
    echo "✅ Providers 端点正常工作"
else
    echo "❌ Providers 端点失败"
    echo "   响应: $PROVIDERS_RESPONSE"
fi

echo ""

# 测试登录页面
echo "3. 测试登录页面..."
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://82.25.95.136:3001/cn/login)
if [ "$LOGIN_STATUS" = "200" ]; then
    echo "✅ 登录页面可访问 (HTTP $LOGIN_STATUS)"
else
    echo "❌ 登录页面访问失败 (HTTP $LOGIN_STATUS)"
fi

echo ""

# 测试健康检查
echo "4. 测试健康检查..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://82.25.95.136:3001/health)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ 健康检查正常 (HTTP $HEALTH_STATUS)"
else
    echo "❌ 健康检查失败 (HTTP $HEALTH_STATUS)"
fi

echo ""

# 测试模拟登录请求（不会真正登录，只是测试端点）
echo "5. 测试登录端点结构..."
LOGIN_ENDPOINT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://82.25.95.136:3001/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=$CSRF_TOKEN&email=test@example.com&password=test")

if [ "$LOGIN_ENDPOINT_STATUS" = "401" ] || [ "$LOGIN_ENDPOINT_STATUS" = "302" ]; then
    echo "✅ 登录端点响应正常 (HTTP $LOGIN_ENDPOINT_STATUS - 预期的认证失败或重定向)"
else
    echo "⚠️  登录端点响应异常 (HTTP $LOGIN_ENDPOINT_STATUS)"
fi

echo ""
echo "=== 测试完成 ==="
echo ""
echo "📋 修复总结:"
echo "   - 添加了客户端 CSRF token 获取"
echo "   - 创建了服务器端 CSRF token 工具函数"
echo "   - 修改了登录表单使用原生表单提交"
echo "   - 添加了 CSRF token 相关错误处理"
echo ""
echo "🔧 如果登录仍然失败，请检查:"
echo "   1. 环境变量 AUTH_SECRET 是否正确设置"
echo "   2. NEXTAUTH_URL 是否指向正确的地址"
echo "   3. 容器间网络通信是否正常"
echo "   4. 浏览器控制台是否有 JavaScript 错误" 