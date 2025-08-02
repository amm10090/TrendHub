#!/bin/bash

# 检查虚拟显示器状态的脚本
echo "🔍 检查虚拟显示器状态..."
echo "================================"

# 1. 检查 DISPLAY 环境变量
echo "📺 DISPLAY 环境变量:"
if [ -n "$DISPLAY" ]; then
    echo "   ✅ DISPLAY = $DISPLAY"
else
    echo "   ❌ DISPLAY 未设置"
fi
echo ""

# 2. 检查 Xvfb 进程
echo "🖥️  Xvfb 进程状态:"
XVFB_PID=$(pgrep -f "Xvfb :99")
if [ -n "$XVFB_PID" ]; then
    echo "   ✅ Xvfb 正在运行 (PID: $XVFB_PID)"
    ps aux | grep -E "Xvfb :99" | grep -v grep
else
    echo "   ❌ Xvfb 未运行"
fi
echo ""

# 3. 检查 X11 锁文件
echo "🔒 X11 锁文件:"
if [ -f "/tmp/.X99-lock" ]; then
    echo "   ✅ 锁文件存在: /tmp/.X99-lock"
else
    echo "   ❌ 锁文件不存在"
fi
echo ""

# 4. 检查 PM2 进程的环境变量
echo "📋 PM2 进程环境:"
if command -v pm2 > /dev/null; then
    # 获取 trend-hub-admin 进程信息
    PM2_INFO=$(pm2 describe trend-hub-admin 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "   Admin 应用状态:"
        # 提取 DISPLAY 环境变量
        ADMIN_DISPLAY=$(echo "$PM2_INFO" | grep -A1 "DISPLAY" | tail -1 | awk '{print $3}')
        if [ -n "$ADMIN_DISPLAY" ]; then
            echo "   ✅ Admin DISPLAY = $ADMIN_DISPLAY"
        else
            echo "   ❌ Admin 未设置 DISPLAY"
        fi
        
        # 检查进程状态
        STATUS=$(pm2 list | grep "trend-hub-admin" | awk '{print $10}')
        echo "   状态: $STATUS"
    else
        echo "   ⚠️  trend-hub-admin 未在 PM2 中运行"
    fi
else
    echo "   ⚠️  PM2 未安装"
fi
echo ""

# 5. 检查最近的爬虫日志
echo "📝 最近的爬虫日志:"
SCRAPER_LOGS=$(find apps/admin/storage/scraper_storage_runs/Mytheresa -name "debug.log" -mtime -1 2>/dev/null | head -5)
if [ -n "$SCRAPER_LOGS" ]; then
    echo "   最近的日志文件:"
    echo "$SCRAPER_LOGS" | while read log; do
        echo "   - $log"
        # 检查日志中是否有 headless 模式信息
        if grep -q "使用有头模式运行" "$log" 2>/dev/null; then
            echo "     ✅ 检测到有头模式运行"
        elif grep -q "使用无头模式运行" "$log" 2>/dev/null; then
            echo "     ⚠️  检测到无头模式运行"
        fi
    done
else
    echo "   ⚠️  未找到最近的爬虫日志"
fi
echo ""

# 6. 测试虚拟显示器连接
echo "🧪 测试虚拟显示器:"
if [ -n "$DISPLAY" ]; then
    # 尝试使用 xdpyinfo 获取显示器信息
    if command -v xdpyinfo > /dev/null; then
        if DISPLAY=$DISPLAY xdpyinfo > /dev/null 2>&1; then
            echo "   ✅ 可以连接到显示器 $DISPLAY"
        else
            echo "   ❌ 无法连接到显示器 $DISPLAY"
        fi
    else
        # 尝试使用 xset
        if command -v xset > /dev/null; then
            if DISPLAY=$DISPLAY xset q > /dev/null 2>&1; then
                echo "   ✅ 可以连接到显示器 $DISPLAY"
            else
                echo "   ❌ 无法连接到显示器 $DISPLAY"
            fi
        else
            echo "   ⚠️  无法测试（缺少 xdpyinfo 或 xset）"
        fi
    fi
else
    echo "   ⚠️  DISPLAY 未设置，无法测试"
fi
echo ""

# 7. 总结
echo "📊 总结:"
if [ -n "$XVFB_PID" ] && [ -n "$DISPLAY" ]; then
    echo "   ✅ 虚拟显示器环境已正确配置"
    echo "   - Xvfb 正在运行"
    echo "   - DISPLAY 已设置为 $DISPLAY"
    
    # 检查 Admin 是否使用了虚拟显示器
    if [ -n "$ADMIN_DISPLAY" ] && [ "$ADMIN_DISPLAY" = ":99" ]; then
        echo "   - Admin 应用正在使用虚拟显示器"
    else
        echo "   - ⚠️  Admin 应用可能未配置虚拟显示器"
    fi
else
    echo "   ❌ 虚拟显示器环境未正确配置"
    [ -z "$XVFB_PID" ] && echo "   - Xvfb 未运行"
    [ -z "$DISPLAY" ] && echo "   - DISPLAY 未设置"
    echo ""
    echo "   建议运行: ./scripts/ensure-xvfb.sh"
fi