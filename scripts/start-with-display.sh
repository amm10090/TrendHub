#!/bin/bash

# Script to start the application with or without virtual display
# This script detects if DISPLAY is set and uses xvfb-run if needed

echo "Checking display environment..."

# Check if DISPLAY environment variable is set
if [ -z "$DISPLAY" ]; then
    echo "No DISPLAY found, starting with xvfb-run..."
    
    # Check if xvfb-run is available
    if command -v xvfb-run >/dev/null 2>&1; then
        echo "Using xvfb-run to create virtual display"
        # Start with virtual display
        # -a: auto-select display number
        # -s: server arguments
        # -e: error file
        export DISPLAY=:99
        exec xvfb-run -a -e /tmp/xvfb-error.log -s "-screen 0 1920x1080x24 -nolisten tcp -dpi 96 -ac +extension GLX" "$@"
    else
        echo "WARNING: xvfb-run not found, starting without display"
        echo "This may cause issues with headed browser mode"
        exec "$@"
    fi
else
    echo "DISPLAY found: $DISPLAY"
    echo "Starting application normally..."
    exec "$@"
fi