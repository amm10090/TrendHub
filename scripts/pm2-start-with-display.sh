#!/bin/bash

# PM2 启动脚本，确保正确设置 DISPLAY 环境变量
set -e

echo "🚀 使用虚拟显示器启动 PM2 进程..."

# 设置并导出 DISPLAY
export DISPLAY=:99
echo "📺 设置 DISPLAY=$DISPLAY"

# 确保 Xvfb 运行
if pgrep -f "Xvfb :99" > /dev/null; then
    echo "✅ Xvfb 已在运行"
else
    echo "🖥️  启动 Xvfb..."
    Xvfb :99 -screen 0 1920x1080x24 -ac -nolisten tcp -dpi 96 +extension GLX +render -noreset &
    sleep 2
fi

# 进入项目根目录
cd "$(dirname "$0")/.."

# 停止现有进程
echo "🛑 停止现有进程..."
pm2 stop all || true

# 使用环境变量启动
echo "✨ 启动 PM2 进程..."
# 方法1：直接在命令前设置环境变量
DISPLAY=:99 pm2 start ecosystem.config.json --env production

# 等待进程启动
sleep 3

# 验证环境变量
echo ""
echo "📊 验证环境变量设置..."
echo "Admin 应用环境:"
pm2 describe trend-hub-admin 2>/dev/null | grep -A1 "DISPLAY" || echo "未找到 DISPLAY 设置"

echo ""
echo "Web 应用状态:"
pm2 describe trend-hub-web 2>/dev/null | grep "status" || echo "Web 应用未运行"

echo ""
echo "✅ 启动完成！"
echo ""
echo "🔍 后续步骤："
echo "1. 运行 ./scripts/check-xvfb-status.sh 检查状态"
echo "2. 查看日志: pm2 logs"
echo "3. 测试爬虫: ./scripts/test-mytheresa-scraper.sh"