#!/bin/bash

# 修复已运行的 PM2 进程的 DISPLAY 环境变量
echo "🔧 修复 PM2 进程的 DISPLAY 环境变量..."

# 设置 DISPLAY 环境变量
export DISPLAY=:99

echo "📝 设置 DISPLAY=$DISPLAY"

# 检查 Xvfb 是否运行
if pgrep -f "Xvfb :99" > /dev/null; then
    echo "✅ Xvfb 正在运行"
else
    echo "⚠️  Xvfb 未运行，启动 Xvfb..."
    ./scripts/ensure-xvfb.sh
fi

# 方法1：重启 PM2 进程并更新环境变量
echo ""
echo "🔄 重启 PM2 进程并更新环境变量..."

# 先停止进程
pm2 stop trend-hub-admin

# 使用环境变量重新启动
DISPLAY=:99 pm2 restart trend-hub-admin --update-env

# 如果上面的命令失败，尝试删除并重新启动
if [ $? -ne 0 ]; then
    echo "⚠️  重启失败，尝试删除并重新启动..."
    pm2 delete trend-hub-admin
    
    # 重新启动整个 ecosystem
    cd "$(dirname "$0")/.."
    DISPLAY=:99 pm2 start ecosystem.config.json --env production --update-env
fi

echo ""
echo "✅ 完成！检查状态..."
sleep 2

# 验证修复结果
echo ""
echo "📊 验证结果:"
pm2 describe trend-hub-admin | grep -E "(DISPLAY|status)"

echo ""
echo "💡 提示："
echo "  - 查看日志: pm2 logs trend-hub-admin"
echo "  - 检查状态: ./scripts/check-xvfb-status.sh"
echo "  - 测试爬虫: ./scripts/test-mytheresa-scraper.sh"