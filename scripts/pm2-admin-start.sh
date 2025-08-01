#!/bin/bash

# PM2 启动脚本 - 确保在正确的目录和环境下运行

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# 切换到 admin 目录
cd "$ROOT_DIR/apps/admin"

# 启动应用
exec pnpm run start:xvfb