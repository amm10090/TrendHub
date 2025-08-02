#!/bin/bash

# Script to start application with virtual display support
# Automatically detects if DISPLAY is needed and sets up Xvfb

set -e

echo "🚀 Starting application with display support..."

# Check if DISPLAY is already set
if [ -n "$DISPLAY" ]; then
    echo "✅ DISPLAY already set to $DISPLAY"
else
    # Check if we're in a headless environment
    if [ -z "$DISPLAY" ] && [ "$HOSTNAME" ] && [ ! -f /tmp/.X11-unix/X0 ]; then
        echo "📺 No DISPLAY detected, starting Xvfb..."
        
        # Start Xvfb in the background
        DISPLAY_NUM=99
        Xvfb :${DISPLAY_NUM} -screen 0 1920x1080x24 -ac -nolisten tcp +extension GLX +render -noreset &
        XVFB_PID=$!
        
        # Wait for Xvfb to start
        sleep 2
        
        # Export DISPLAY
        export DISPLAY=:${DISPLAY_NUM}
        echo "✅ Xvfb started on DISPLAY=$DISPLAY (PID: $XVFB_PID)"
        
        # Set up signal handlers to clean up Xvfb on exit
        trap "echo '🛑 Stopping Xvfb...'; kill -9 $XVFB_PID 2>/dev/null || true" EXIT INT TERM
    fi
fi

# Execute the command passed as arguments
echo "🎯 Executing command: $@"
exec "$@"