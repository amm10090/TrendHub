#!/bin/bash

# 部署 Admin 应用（支持非无头模式爬虫）
set -e

echo "🚀 开始部署 TrendHub Admin (支持非无头模式爬虫)..."

# 进入项目根目录
cd "$(dirname "$0")/.."

echo "🖥️  步骤 1/7: 确保 Xvfb 运行..."
./scripts/ensure-xvfb.sh

echo "📦 步骤 2/7: 安装依赖..."
pnpm install --frozen-lockfile

echo "🗄️  步骤 3/7: 数据库迁移..."
turbo run db:push --filter=@trend-hub/admin

echo "🔨 步骤 4/7: 构建应用..."
turbo run build --filter=@trend-hub/admin

echo "🛑 步骤 5/7: 停止现有进程..."
pm2 stop trend-hub-admin || true
pm2 delete trend-hub-admin || true

echo "✨ 步骤 6/7: 启动应用..."
# 确保 DISPLAY 环境变量设置
export DISPLAY=:99

# 使用带有 DISPLAY 的配置启动
cd apps/admin
pm2 start ecosystem.config.json --env production

cd ../..

echo "✅ 步骤 7/7: 验证部署..."
sleep 5
pm2 list
pm2 logs trend-hub-admin --lines 20

echo "🎉 部署完成！"
echo ""
echo "📝 有用的命令："
echo "  查看日志: pm2 logs trend-hub-admin"
echo "  监控状态: pm2 monit"
echo "  重启应用: pm2 restart trend-hub-admin"
echo "  查看爬虫日志: tail -f apps/admin/storage/scraper_storage_runs/Mytheresa/*/debug.log"
echo ""
echo "🔍 验证 Xvfb:"
echo "  DISPLAY 环境变量: $DISPLAY"
echo "  Xvfb 进程: $(pgrep -f "Xvfb :99" || echo "未运行")"