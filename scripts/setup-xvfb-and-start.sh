#!/bin/bash

# Complete xvfb setup and start script

echo "Setting up Xvfb environment..."

# Kill any existing Xvfb
pkill Xvfb || true
sleep 1

# Create a unique display number
DISPLAY_NUM=99
export DISPLAY=:${DISPLAY_NUM}

# Start Xvfb with proper authentication
echo "Starting Xvfb on display ${DISPLAY}..."
Xvfb ${DISPLAY} -screen 0 1920x1080x24 -ac -nolisten tcp -dpi 96 +extension GLX +render -noreset &
XVFB_PID=$!

# Wait for Xvfb to start
sleep 3

# Verify Xvfb is running
if ! kill -0 $XVFB_PID 2>/dev/null; then
    echo "Failed to start Xvfb"
    exit 1
fi

echo "Xvfb started successfully (PID: $XVFB_PID)"

# Set XAUTHORITY if needed
export XAUTHORITY=/tmp/.Xauthority
touch $XAUTHORITY

# Disable access control (for simplicity in server environment)
xhost +local: 2>/dev/null || true

echo "DISPLAY=${DISPLAY}"
echo "Starting application..."

# Change to admin directory and start
cd "$(dirname "$0")/../apps/admin"

# Pass environment to the app
DISPLAY=${DISPLAY} XAUTHORITY=${XAUTHORITY} exec pnpm run start:production