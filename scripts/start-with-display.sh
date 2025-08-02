#!/bin/bash

# 在根目录的启动脚本，确保 DISPLAY 环境变量
export DISPLAY=:99
echo "Setting DISPLAY=$DISPLAY"

# 检查参数，如果没有提供，使用默认的 ecosystem.config.json
CONFIG_FILE=${1:-ecosystem.config.json}

# 启动 PM2
exec pm2 start "$CONFIG_FILE" --env production