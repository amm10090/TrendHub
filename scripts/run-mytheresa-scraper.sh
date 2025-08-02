#!/bin/bash

# Script to run Mytheresa scraper with virtual display support
set -e

echo "🛍️ Starting Mytheresa scraper with virtual display support..."

# Check if DISPLAY is set
if [ -z "$DISPLAY" ]; then
    echo "📺 No DISPLAY detected, setting up virtual display..."
    
    # Run ensure-xvfb.sh to start Xvfb if not already running
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    "$SCRIPT_DIR/ensure-xvfb.sh"
    
    export DISPLAY=:99
    echo "✅ DISPLAY set to :99"
else
    echo "✅ DISPLAY already set to $DISPLAY"
fi

# Navigate to project root
cd "$(dirname "$0")/.."

echo "🚀 Running Mytheresa scraper..."

# Run the scraper
# You can pass arguments like URLs or options
# Example: ./scripts/run-mytheresa-scraper.sh "https://www.mytheresa.com/us/en/women/new-arrivals/current-week"

# Default URL if no argument provided
if [ -z "$1" ]; then
    URL="https://www.mytheresa.com/us/en/women/new-arrivals/current-week"
else
    URL="$1"
fi

# Run the scraper using pnpm or npx
cd packages/scraper

# Using ts-node to run the TypeScript file directly
echo "🔍 Scraping URL: $URL"
npx ts-node --esm src/test/mytheresa-test.ts "$URL"

echo "✅ Scraping completed!"