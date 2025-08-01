#!/bin/bash

# 部署脚本 - 包含完整的构建和启动流程
set -e  # 遇到错误立即退出

echo "🚀 开始部署 TrendHub Admin (带 xvfb 支持)..."

# 进入项目根目录
cd "$(dirname "$0")/.."

echo "📦 步骤 1/5: 数据库推送..."
turbo run db:push --filter=@trend-hub/admin

echo "🔨 步骤 2/5: 构建应用..."
turbo run build

echo "🛑 步骤 3/5: 停止现有 PM2 进程..."
pm2 stop trend-hub-admin || true
pm2 delete trend-hub-admin || true

echo "✨ 步骤 4/5: 启动应用..."
pm2 start ecosystem.xvfb.config.json --env production

echo "✅ 步骤 5/5: 显示状态..."
pm2 list
pm2 logs trend-hub-admin --lines 20

echo "🎉 部署完成！"
echo "📝 查看日志: pm2 logs trend-hub-admin"
echo "📊 查看状态: pm2 status"