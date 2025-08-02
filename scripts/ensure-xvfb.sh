#!/bin/bash

# Ensure Xvfb is running globally
# This script should be run once before starting the application

DISPLAY_NUM=99
XVFB_LOCKFILE="/tmp/.X${DISPLAY_NUM}-lock"

# Check if Xvfb is already running
if [ -f "$XVFB_LOCKFILE" ] && pgrep -f "Xvfb :${DISPLAY_NUM}" > /dev/null; then
    echo "Xvfb is already running on display :${DISPLAY_NUM}"
else
    echo "Starting Xvfb on display :${DISPLAY_NUM}..."
    # Kill any orphaned Xvfb processes
    pkill -f "Xvfb :${DISPLAY_NUM}" 2>/dev/null || true
    rm -f "$XVFB_LOCKFILE" 2>/dev/null || true
    
    # Start Xvfb with full permissions
    Xvfb :${DISPLAY_NUM} \
        -screen 0 1920x1080x24 \
        -ac \
        -nolisten tcp \
        -dpi 96 \
        +extension GLX \
        +render \
        -noreset &
    
    sleep 2
    
    # Verify it started
    if pgrep -f "Xvfb :${DISPLAY_NUM}" > /dev/null; then
        echo "Xvfb started successfully"
        # Disable access control
        DISPLAY=:${DISPLAY_NUM} xhost +local: 2>/dev/null || true
    else
        echo "Failed to start Xvfb"
        exit 1
    fi
fi

echo "DISPLAY=:${DISPLAY_NUM} is ready"