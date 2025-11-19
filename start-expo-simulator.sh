#!/bin/bash

# Start Expo on iOS Simulator
# Usage: ./start-expo-simulator.sh

echo "==================================="
echo "Care Commons Mobile - iOS Simulator"
echo "==================================="
echo ""

# Check if simulator is running
SIMULATOR_UUID="3C8225BB-049F-4630-B83A-9828B7D80CB1"
SIMULATOR_NAME="iPhone 15 Pro"

echo "1. Checking simulator status..."
if xcrun simctl list devices booted | grep -q "$SIMULATOR_UUID"; then
    echo "   ✓ $SIMULATOR_NAME is already booted"
else
    echo "   ⟳ Booting $SIMULATOR_NAME..."
    xcrun simctl boot "$SIMULATOR_UUID" 2>/dev/null || echo "   Already booted"
    open -a Simulator
    sleep 3
fi

echo ""
echo "2. Starting Expo development server..."
cd "$(dirname "$0")/packages/mobile"

echo ""
echo "3. Metro bundler starting..."
echo "   Press 'r' to reload"
echo "   Press 'j' to open debugger"
echo ""

npx expo start
