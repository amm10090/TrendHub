#!/bin/bash

# TrendHub 快速重启脚本

echo "🔄 重启 TrendHub 应用..."

# 重启PM2应用
pm2 restart ecosystem.config.json

# 显示状态
echo "📊 当前状态:"
pm2 status

# 显示日志
echo "📋 最新日志:"
pm2 logs --lines 10 