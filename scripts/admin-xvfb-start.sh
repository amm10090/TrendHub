#!/bin/bash

# Admin startup script with xvfb support
# Ensures DISPLAY is always set for Playwright

# Start Xvfb in background if not already running
if ! pgrep -x "Xvfb" > /dev/null; then
    echo "Starting Xvfb..."
    Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX &
    sleep 2
fi

# Export DISPLAY
export DISPLAY=:99
echo "DISPLAY set to: $DISPLAY"

# Start the application
cd "$(dirname "$0")/../apps/admin"
exec pnpm run start:production