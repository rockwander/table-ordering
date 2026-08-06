#!/bin/bash

# Script to generate 10-second looped notification sounds
# Requires: ffmpeg (install with: brew install ffmpeg)

set -e

echo "🔊 Generating 10-second looped notification sounds..."
echo ""

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ Error: ffmpeg is not installed"
    echo ""
    echo "Please install ffmpeg first:"
    echo "  brew install ffmpeg"
    echo ""
    exit 1
fi

# Input files
NEW_ORDER_INPUT="public/mixkit-casino-bells-reward-1981.wav"
WAITER_CALL_INPUT="public/mixkit-happy-bells-notification-937.wav"

# Output files (10-second looped versions)
NEW_ORDER_OUTPUT="public/new_order_10s.wav"
WAITER_CALL_OUTPUT="public/waiter_call_10s.wav"

# Android res directory
ANDROID_RES_DIR="android/app/src/main/res/raw"

echo "📁 Input files:"
echo "  - New Order: $NEW_ORDER_INPUT"
echo "  - Waiter Call: $WAITER_CALL_INPUT"
echo ""

# Get duration of each file
echo "⏱️ Analyzing sound file durations..."
NEW_ORDER_DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$NEW_ORDER_INPUT")
WAITER_CALL_DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$WAITER_CALL_INPUT")

echo "  - New Order duration: ${NEW_ORDER_DURATION}s"
echo "  - Waiter Call duration: ${WAITER_CALL_DURATION}s"
echo ""

# Calculate how many loops needed to get ~10 seconds
NEW_ORDER_LOOPS=$(awk "BEGIN {print int(10.0 / $NEW_ORDER_DURATION) + 1}")
WAITER_CALL_LOOPS=$(awk "BEGIN {print int(10.0 / $WAITER_CALL_DURATION) + 1}")

echo "🔄 Looping counts to reach 10 seconds:"
echo "  - New Order: $NEW_ORDER_LOOPS times"
echo "  - Waiter Call: $WAITER_CALL_LOOPS times"
echo ""

# Generate 10-second looped version of New Order sound
echo "🎵 Generating 10-second New Order sound..."
ffmpeg -y -stream_loop $NEW_ORDER_LOOPS -i "$NEW_ORDER_INPUT" -t 10 -c:a pcm_s16le "$NEW_ORDER_OUTPUT"
echo "  ✅ Created: $NEW_ORDER_OUTPUT"

# Generate 10-second looped version of Waiter Call sound
echo "🎵 Generating 10-second Waiter Call sound..."
ffmpeg -y -stream_loop $WAITER_CALL_LOOPS -i "$WAITER_CALL_INPUT" -t 10 -c:a pcm_s16le "$WAITER_CALL_OUTPUT"
echo "  ✅ Created: $WAITER_CALL_OUTPUT"

echo ""
echo "📱 Copying to Android res/raw directory..."

# Create Android res/raw directory if it doesn't exist
mkdir -p "$ANDROID_RES_DIR"

# Copy to Android with proper naming (no special characters, lowercase)
cp "$NEW_ORDER_OUTPUT" "$ANDROID_RES_DIR/new_order.wav"
cp "$WAITER_CALL_OUTPUT" "$ANDROID_RES_DIR/waiter_call.wav"

echo "  ✅ Copied to: $ANDROID_RES_DIR/new_order.wav"
echo "  ✅ Copied to: $ANDROID_RES_DIR/waiter_call.wav"

echo ""
echo "✅ SUCCESS! 10-second notification sounds generated and copied to Android."
echo ""
echo "📋 Next steps:"
echo "  1. Rebuild the Android APK to include the new sound files"
echo "  2. Test notifications to verify 10-second playback"
echo ""
echo "📁 Generated files:"
ls -lh "$NEW_ORDER_OUTPUT" "$WAITER_CALL_OUTPUT" "$ANDROID_RES_DIR/new_order.wav" "$ANDROID_RES_DIR/waiter_call.wav"
