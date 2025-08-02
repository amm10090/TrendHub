#!/bin/bash

# 在生产环境启动 Web 和 Admin 应用（支持虚拟显示器）
set -e

echo "🚀 启动 TrendHub 生产环境（Web + Admin）..."

# 进入项目根目录
cd "$(dirname "$0")/.."

# 确保 Xvfb 在服务器环境中运行
if [ -z "$DISPLAY" ] && [ "$HOSTNAME" ] && [ ! -f /tmp/.X11-unix/X0 ]; then
    echo "🖥️  检测到服务器环境，确保 Xvfb 运行..."
    ./scripts/ensure-xvfb.sh
    export DISPLAY=:99
else
    echo "✅ 显示环境已配置: DISPLAY=$DISPLAY"
fi

# 执行标准的生产启动流程
echo "📦 步骤 1/3: 数据库推送..."
turbo run db:push --filter=@trend-hub/admin

echo "🔨 步骤 2/3: 构建应用..."
turbo run build

echo "✨ 步骤 3/3: 启动 PM2 进程..."
pm2 start ecosystem.config.json --env production

echo "✅ 启动完成！"
echo ""
echo "📊 查看状态："
pm2 list

echo ""
echo "🔍 有用的命令："
echo "  查看日志: pm2 logs"
echo "  监控: pm2 monit"
echo "  重启: pm2 restart all"
echo "  停止: pm2 stop all"