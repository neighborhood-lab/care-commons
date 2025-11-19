# Mobile Simulator Setup - Complete ✓

## Summary

Successfully installed and configured iPhone 15 Pro simulator running iOS 17.2 for Care Commons mobile app development.

## What Was Installed

### 1. iPhone Simulator
- **Device**: iPhone 15 Pro
- **iOS Version**: 17.2
- **UUID**: `3C8225BB-049F-4630-B83A-9828B7D80CB1`
- **Status**: ✓ Booted and ready

### 2. Development Tools
- **Expo**: v54.0.16 (already installed)
- **Expo Go**: v54.0.6 (installed in simulator)
- **CocoaPods**: v1.16.2 (installed via Homebrew)
- **Metro Bundler**: Running on port 8081

### 3. Code Fixes Applied
- Fixed ESM import paths in mobile package (removed `.js` extensions)
- Metro bundler requires no extensions or `.ts` extensions for local imports
- Updated 10+ files to use proper import syntax for React Native

## How to Use

### Quick Start (Recommended)

```bash
# From project root
./start-expo-simulator.sh
```

This script will:
1. Boot the iPhone 15 Pro simulator
2. Navigate to the mobile package
3. Start Metro bundler
4. Open Expo Go in the simulator

### Manual Start

```bash
# 1. Boot simulator (if not running)
xcrun simctl boot 3C8225BB-049F-4630-B83A-9828B7D80CB1
open -a Simulator

# 2. Start Expo from mobile package
cd packages/mobile
npx expo start

# 3. In the Expo terminal, press 'i' to open iOS simulator
# Or scan QR code with Expo Go app
```

### Development Workflow

Once Expo is running:
- **Press `r`**: Reload the app
- **Press `m`**: Toggle menu
- **Press `j`**: Open JavaScript debugger
- **Press `i`**: Open on iOS simulator
- **Press `a`**: Open on Android emulator

## Simulator Management

### List all simulators
```bash
xcrun simctl list devices
```

### Boot a simulator
```bash
xcrun simctl boot <UUID>
```

### Shutdown a simulator
```bash
xcrun simctl shutdown <UUID>
```

### Take a screenshot
```bash
xcrun simctl io <UUID> screenshot ~/Desktop/screenshot.png
```

### Record video
```bash
xcrun simctl io <UUID> recordVideo ~/Desktop/video.mov
# Press Ctrl+C to stop recording
```

## Troubleshooting

### Port 8081 already in use
```bash
# Kill existing Metro bundler
lsof -ti:8081 | xargs kill -9

# Or use a different port
npx expo start --port 8082
```

### Expo Go not loading
```bash
# 1. Clear Metro cache
npx expo start --clear

# 2. Open URL manually in simulator
xcrun simctl openurl <UUID> "exp://localhost:8081"
```

### Simulator won't boot
```bash
# Erase simulator and start fresh
xcrun simctl erase <UUID>
xcrun simctl boot <UUID>
```

### Build errors (if using expo run:ios)
```bash
# Clean native build artifacts
cd packages/mobile
rm -rf ios android .expo
npx expo prebuild --clean
```

## Known Issues & Solutions

### 1. React Native Reanimated requires New Architecture
- **Status**: Configured correctly
- **Solution**: Keep `newArchEnabled: true` in `app.json`
- **Note**: For Expo Go, this is handled automatically

### 2. Module Resolution Errors
- **Symptom**: `Cannot resolve ./src/utils/sentry.js`
- **Solution**: Use no extension or `.ts` extension for local imports
- **Fixed**: All imports updated to Metro bundler format

### 3. Package Version Warnings
```
The following packages should be updated:
  react-native@0.82.1 - expected: 0.81.5
  react@19.2.0 - expected: 19.1.0
  ... (others)
```
- **Status**: Non-blocking warnings
- **Impact**: App works, but some features may need specific versions
- **Action**: Can upgrade later if issues arise

## Next Steps

1. **Test the mobile app**: The simulator is ready for development
2. **Install on physical device**: Use Expo Go app from App Store
3. **Build native app**: Use `expo build:ios` when ready for TestFlight
4. **Configure environment**: Set up API endpoints and environment variables

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [iOS Simulator Guide](https://developer.apple.com/documentation/xcode/running-your-app-in-simulator-or-on-a-device)
- [Metro Bundler](https://metrobundler.dev/)

## Simulator Information

```
Device: iPhone 15 Pro
iOS: 17.2
UUID: 3C8225BB-049F-4630-B83A-9828B7D80CB1
Screen: 1179 x 2556 pixels
Status: ✓ Ready for development
```

---

**Setup completed**: $(date)
**Xcode version**: 15.1 (Build 15C65)
**Node version**: 22.x
**Expo version**: 54.0.16
