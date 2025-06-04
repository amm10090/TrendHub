#!/bin/bash

# TrendHub HTTP环境启动脚本

echo "🌐 启动 TrendHub (HTTP 模式)..."

# 设置HTTP环境变量
export AUTH_TRUST_HOST=true
export NODE_ENV=production

# 停止现有进程
echo "📋 停止现有进程..."
pm2 delete all 2>/dev/null || true

# 确保logs目录存在
mkdir -p logs

# 启动应用
echo "🎯 启动应用 (HTTP模式)..."
pm2 start ecosystem.config.json --env production

# 保存PM2配置
pm2 save

# 显示状态
echo "📊 当前状态:"
pm2 status

echo "✅ HTTP模式启动完成!"
echo "📝 管理后台: http://82.25.95.136:3001"
echo "🌐 前端应用: http://82.25.95.136:3000"
echo ""
echo "🔍 故障排除："
echo "  - 查看日志: pm2 logs"
echo "  - 监控面板: pm2 monit"
echo "  - 重启应用: ./restart.sh" 