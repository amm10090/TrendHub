#!/bin/bash

# Ensure DISPLAY is set for the application
export DISPLAY=:99

# Start the production server
exec pnpm run start:production