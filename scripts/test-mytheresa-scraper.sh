#!/bin/bash

# 测试 Mytheresa 爬虫在 Admin 应用中的运行
set -e

echo "🧪 测试 Mytheresa 爬虫..."

# 检查 DISPLAY 环境变量
echo "📺 检查虚拟显示器环境..."
if [ -z "$DISPLAY" ]; then
    echo "⚠️  DISPLAY 未设置，尝试设置为 :99"
    export DISPLAY=:99
fi
echo "✅ DISPLAY = $DISPLAY"

# 检查 Xvfb 是否运行
echo "🔍 检查 Xvfb 进程..."
if pgrep -f "Xvfb :99" > /dev/null; then
    echo "✅ Xvfb 正在运行"
else
    echo "❌ Xvfb 未运行，请先执行: ./scripts/ensure-xvfb.sh"
    exit 1
fi

# 检查 Admin 应用是否运行
echo "🔍 检查 Admin 应用..."
if pm2 list | grep -q "trend-hub-admin.*online"; then
    echo "✅ Admin 应用正在运行"
else
    echo "❌ Admin 应用未运行，请先启动应用"
    exit 1
fi

# 获取 Admin 应用的端口（默认 3001）
ADMIN_PORT=${ADMIN_PORT:-3001}
ADMIN_URL="http://localhost:$ADMIN_PORT"

echo "🌐 Admin URL: $ADMIN_URL"

# 检查 Admin 应用健康状态
echo "🏥 检查应用健康状态..."
if curl -s -o /dev/null -w "%{http_code}" "$ADMIN_URL/api/health" | grep -q "200"; then
    echo "✅ Admin 应用健康"
else
    echo "❌ Admin 应用未响应"
    exit 1
fi

# 测试爬虫 API
echo "🚀 测试 Mytheresa 爬虫 API..."
TEST_URL="https://www.mytheresa.com/us/en/women/new-arrivals/current-week"

# 创建临时文件存储响应
RESPONSE_FILE="/tmp/mytheresa-test-response.json"

# 发送测试请求
echo "📤 发送爬虫请求..."
HTTP_CODE=$(curl -s -o "$RESPONSE_FILE" -w "%{http_code}" \
  -X POST "$ADMIN_URL/api/scraping/Mytheresa" \
  -H "Content-Type: application/json" \
  -d "{
    \"startUrl\": \"$TEST_URL\",
    \"maxProducts\": 5,
    \"maxRequests\": 10,
    \"defaultInventory\": 99
  }")

echo "📥 HTTP 响应码: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 爬虫 API 调用成功"
    
    # 显示响应摘要
    if command -v jq > /dev/null; then
        echo "📊 响应摘要:"
        jq -r '.message // "No message"' "$RESPONSE_FILE"
        
        # 检查是否有产品被处理
        PRODUCT_COUNT=$(jq -r '.results | length // 0' "$RESPONSE_FILE" 2>/dev/null || echo "0")
        echo "📦 处理的产品数: $PRODUCT_COUNT"
        
        if [ "$PRODUCT_COUNT" -gt 0 ]; then
            echo "✅ 成功抓取并处理产品！"
        else
            echo "⚠️  未抓取到产品，可能需要检查爬虫逻辑"
        fi
    else
        echo "📄 原始响应已保存到: $RESPONSE_FILE"
    fi
else
    echo "❌ 爬虫 API 调用失败"
    echo "📄 错误响应:"
    cat "$RESPONSE_FILE"
fi

# 清理临时文件
rm -f "$RESPONSE_FILE"

echo ""
echo "🔍 查看详细日志:"
echo "  PM2 日志: pm2 logs trend-hub-admin"
echo "  爬虫日志: find apps/admin/storage/scraper_storage_runs/Mytheresa -name 'debug.log' -mtime -1 -exec tail -n 20 {} +"

echo ""
echo "✅ 测试完成！"