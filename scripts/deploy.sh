#!/bin/bash

# TrendHub 生产环境部署脚本

echo "🚀 开始部署 TrendHub..."

# 1. 停止现有的PM2进程
echo "📋 停止现有进程..."
pm2 delete all 2>/dev/null || true

# 2. 安装依赖
echo "📦 安装依赖..."
pnpm install

# 3. 构建项目
echo "🔨 构建项目..."
pnpm run build

# 4. 确保logs目录存在
echo "📁 创建日志目录..."
mkdir -p logs

# 5. 启动应用
echo "🎯 启动应用..."
pm2 start ecosystem.config.json --env production

# 6. 保存PM2配置
echo "💾 保存PM2配置..."
pm2 save

# 7. 显示状态
echo "📊 当前状态:"
pm2 status

echo "✅ 部署完成!"
echo "📝 管理后台: http://82.25.95.136:3001"
echo "🌐 前端应用: http://82.25.95.136:3000"
echo "📋 查看日志: pm2 logs"
echo "�� 监控面板: pm2 monit" 