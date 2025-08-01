#!/bin/bash

# PM2 xvfb wrapper script
# This script ensures proper environment for PM2 with xvfb

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to the correct directory
cd "$ROOT_DIR/apps/admin"

# Execute with xvfb
exec "$SCRIPT_DIR/start-with-display.sh" pnpm run start:production