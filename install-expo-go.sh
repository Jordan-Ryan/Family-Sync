#!/bin/bash

echo "Installing Expo Go on iPad Pro simulator..."

# Get the iPad Pro simulator ID
IPAD_ID=$(xcrun simctl list devices | grep "iPad Pro 13-inch (M4)" | grep "Booted" | grep -o '[A-F0-9-]\{36\}')

if [ -z "$IPAD_ID" ]; then
    echo "iPad Pro 13-inch simulator not found or not booted"
    echo "Available simulators:"
    xcrun simctl list devices | grep "iPad Pro"
    exit 1
fi

echo "Found iPad Pro simulator: $IPAD_ID"

# Download Expo Go from App Store
echo "Opening App Store on iPad simulator..."
xcrun simctl openurl $IPAD_ID "https://apps.apple.com/app/expo-go/id982107779"

echo "Please install Expo Go from the App Store that just opened on your iPad simulator"
echo "Once installed, you can scan the QR code from your Expo server"
echo ""
echo "Or manually enter this URL in Expo Go:"
echo "exp://192.168.1.101:8081"
