#!/bin/bash

# 强制重启 PM2 进程并确保 DISPLAY 环境变量生效
set -e

echo "🔧 强制重启 PM2 进程（带 DISPLAY 环境变量）..."

# 1. 设置环境变量
export DISPLAY=:99
echo "📝 设置 DISPLAY=$DISPLAY"

# 2. 检查 Xvfb
if pgrep -f "Xvfb :99" > /dev/null; then
    echo "✅ Xvfb 正在运行"
else
    echo "❌ Xvfb 未运行，请先运行: ./scripts/ensure-xvfb.sh"
    exit 1
fi

# 3. 完全停止并删除 PM2 进程
echo ""
echo "🛑 完全停止并删除现有 PM2 进程..."
pm2 stop all
pm2 delete all

# 4. 清理 PM2
echo "🧹 清理 PM2..."
pm2 kill
sleep 2

# 5. 重新启动 PM2
echo "🚀 重新启动 PM2..."
pm2 resurrect || true

# 6. 进入项目目录
cd "$(dirname "$0")/.."

# 7. 使用环境变量启动
echo ""
echo "✨ 启动应用（带 DISPLAY 环境变量）..."

# 方法A: 修改 ecosystem.config.json 然后启动
# 创建临时的 ecosystem 文件，强制添加 DISPLAY
cp ecosystem.config.json ecosystem.temp.json

# 使用 node 脚本修改配置
node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('ecosystem.temp.json', 'utf8'));
config.apps.forEach(app => {
  if (!app.env) app.env = {};
  if (!app.env_production) app.env_production = {};
  app.env.DISPLAY = ':99';
  app.env_production.DISPLAY = ':99';
});
fs.writeFileSync('ecosystem.temp.json', JSON.stringify(config, null, 2));
console.log('✅ 已更新临时配置文件');
"

# 使用临时配置启动
DISPLAY=:99 pm2 start ecosystem.temp.json --env production

# 删除临时文件
rm -f ecosystem.temp.json

# 8. 等待启动
echo "⏳ 等待进程启动..."
sleep 5

# 9. 验证
echo ""
echo "📊 验证 DISPLAY 设置..."
echo ""
echo "=== Admin 应用环境变量 ==="
pm2 env 0 | grep -E "(DISPLAY|PATH)" | head -5

echo ""
echo "=== 进程状态 ==="
pm2 list

echo ""
echo "✅ 完成！"
echo ""
echo "🔍 验证命令："
echo "1. 检查环境: pm2 env 0 | grep DISPLAY"
echo "2. 完整检查: ./scripts/check-xvfb-status.sh"
echo "3. 测试爬虫: ./scripts/test-mytheresa-scraper.sh"