# Mobile App Quickstart Guide

## Prerequisites

1. **Node.js 22.x** installed (check with `node --version`)
2. **iOS Simulator** (macOS only) or **Android Studio** (all platforms)
3. **Xcode** (macOS, for iOS development)
4. **Android Studio** with Android SDK (for Android development)

## Initial Setup

```bash
# From monorepo root
cd packages/mobile

# Install dependencies
npm install

# Build required packages first
cd ../../
npm run build

# Return to mobile
cd packages/mobile
```

## Running the App

### Start Expo Dev Server

```bash
npm start
```

This opens Expo Dev Tools in your browser. From here you can:
- Press `i` to run on iOS Simulator (macOS only)
- Press `a` to run on Android Emulator
- Scan QR code with Expo Go app on your physical device

### iOS (macOS only)

```bash
npm run ios
```

First run will take ~5 minutes to build native code.

### Android

```bash
# Make sure Android emulator is running first
npm run android
```

First run will take ~10 minutes to build native code.

## Development Workflow

### File Structure

```
src/
├── shared/              # Reusable types from core
├── database/            # WatermelonDB offline storage
├── services/            # Platform services
│   ├── offline-queue.ts # Sync queue
│   ├── location.ts      # GPS & geofence
│   └── device-info.ts   # Device capabilities
├── features/            # Feature modules
│   └── visits/
│       ├── hooks/       # React hooks
│       ├── screens/     # UI screens
│       └── components/  # Feature components
└── navigation/          # React Navigation (TODO)
```

### Hot Reloading

Changes to TypeScript files automatically reload in the app. No need to restart the dev server.

### Debugging

#### React Native Debugger

```bash
# Install globally
npm install -g react-native-debugger

# Open debugger
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

Then shake device/simulator and select "Debug" from menu.

#### Expo Dev Tools

- View logs in terminal or browser
- Inspect element tree
- Network requests

### Common Issues

#### iOS Simulator Not Opening

```bash
# Open simulator manually
open -a Simulator

# Then run
npm run ios
```

#### Android Emulator Not Found

```bash
# List available emulators
$ANDROID_HOME/emulator/emulator -list-avds

# Start specific emulator
$ANDROID_HOME/emulator/emulator -avd Pixel_5_API_33
```

#### Metro Bundler Port Conflict

```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Restart
npm start
```

#### WatermelonDB Not Building

```bash
# Clean and rebuild
cd ios && pod install && cd ..
npm run ios -- --reset-cache
```

## Testing

### Unit Tests

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Running on Physical Device

#### iOS

1. Open `ios/YourApp.xcworkspace` in Xcode
2. Select your device from the device dropdown
3. Click Run (⌘R)
4. First time: Trust developer certificate on device

#### Android

1. Enable Developer Options on device
2. Enable USB Debugging
3. Connect device via USB
4. Run `adb devices` to verify connection
5. Run `npm run android`

## Building for Production

### Development Build (EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project
eas build:configure

# Build for iOS
npm run build:ios

# Build for Android
npm run build:android
```

### Local Build (Advanced)

#### iOS

```bash
# Requires macOS and Xcode
cd ios
pod install
cd ..
npx react-native run-ios --configuration Release
```

#### Android

```bash
cd android
./gradlew assembleRelease
cd ..
```

APK will be in `android/app/build/outputs/apk/release/`

## Database Management

### View Database

```bash
# iOS Simulator
open ~/Library/Developer/CoreSimulator/Devices/[DEVICE_ID]/data/Containers/Data/Application/[APP_ID]/Documents/

# Android Emulator
adb pull /data/data/com.carecommons.mobile/databases/watermelon.db
sqlite3 watermelon.db
```

### Reset Database

In app code:
```typescript
import { resetDatabase } from './database';
await resetDatabase(); // WARNING: Deletes all data!
```

## Environment Configuration

Create `.env` file (ignored by git):

```env
EXPO_PUBLIC_API_URL=https://api.carecommons.example
EXPO_PUBLIC_ENVIRONMENT=development
```

Access in code:
```typescript
import Constants from 'expo-constants';
const apiUrl = Constants.expoConfig?.extra?.apiUrl;
```

## Offline Development

The app works offline by default:

1. Clock in/out operations are queued locally
2. Sync happens automatically when online
3. Test offline by:
   - Airplane mode on device
   - Disconnect Mac from network
   - Use Charles Proxy to block requests

## State-Specific Testing

### Testing Texas EVV Rules

```typescript
import { getStateEVVRules } from './shared';

const txRules = getStateEVVRules('TX');
// geoFenceRadius: 100m
// clockInGracePeriodMinutes: 10
```

### Testing Florida EVV Rules

```typescript
const flRules = getStateEVVRules('FL');
// geoFenceRadius: 150m
// clockInGracePeriodMinutes: 15
```

## Performance Monitoring

### Check Bundle Size

```bash
npx react-native-bundle-visualizer
```

### Profile Performance

1. In app: Shake device → "Perf Monitor"
2. Watch FPS and JS thread performance

### Optimize Images

```bash
# Install image optimization tools
npm install -g sharp-cli

# Optimize images
sharp input.png -o output.png --webp
```

## Troubleshooting

### Clear Everything

```bash
# Clear Metro cache
npm start -- --reset-cache

# Clear iOS build
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# Clear Android build
cd android && ./gradlew clean && cd ..

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Check Logs

```bash
# iOS
xcrun simctl spawn booted log stream --predicate 'process == "YourApp"'

# Android
adb logcat *:S ReactNative:V ReactNativeJS:V
```

## Next Steps

1. **Implement authentication** - Add login screen and token management
2. **Set up navigation** - Configure React Navigation
3. **Add visit list** - Show caregiver's scheduled visits
4. **Implement push notifications** - Visit reminders
5. **Add photo capture** - Clock-in verification photos
6. **Client signatures** - Capture client attestation

## Resources

- **Expo Docs**: https://docs.expo.dev/
- **React Native**: https://reactnative.dev/
- **WatermelonDB**: https://nozbe.github.io/WatermelonDB/
- **EVV Compliance**: See `../../verticals/time-tracking-evv/README.md`

## Getting Help

- Check `README.md` for architecture details
- See `IMPLEMENTATION_SUMMARY.md` for technical notes
- Review tests in `src/**/__tests__/` for usage examples

---

**Ready to build!** Start with `npm start` and you'll have a running app in under 2 minutes.
