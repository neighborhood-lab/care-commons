# How to View the Mobile App

The Care Commons mobile app is a React Native + Expo application. There are several issues preventing it from running in web mode that need to be resolved.

## Current Status ⚠️

The mobile app has dependency and configuration issues:
- ✅ Dependencies installed
- ⚠️ Web support requires additional setup
- ✅ Native builds should work (iOS/Android simulators)

## Recommended Viewing Methods

### Option 1: View Screenshots/Documentation (Immediate)

The mobile app documentation includes detailed information about implemented features:

```bash
cat packages/mobile/README.md
cat packages/mobile/MOBILE_FOUNDATION_SUMMARY.md
cat packages/mobile/QUICKSTART_MOBILE.md
```

**Features Documented:**
- Login screen with biometric auth
- Today's Visits screen
- Offline-first architecture
- EVV compliance features
- GPS/location services

### Option 2: Use Expo Go on Physical Device (Recommended - 5 min)

This is the **easiest and fastest** way to see the actual mobile app:

```bash
cd packages/mobile

# Start Expo dev server
npm run start
```

Then:
1. **Install Expo Go** on your phone:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. **Scan QR code** shown in terminal with:
   - iOS: Camera app
   - Android: Expo Go app

3. **App loads on device** - you can test:
   - Login UI
   - Navigation
   - Biometric auth (if device supports)
   - Offline features
   - Real GPS (unlike simulators)

**Pros:**
- ✅ No Xcode/Android Studio required
- ✅ Works on real device with real sensors
- ✅ Fast reload on code changes
- ✅ Test GPS and biometric features

**Cons:**
- ⚠️ Requires physical device
- ⚠️ Device and computer must be on same network

### Option 3: iOS Simulator (macOS Only - 10 min)

```bash
cd packages/mobile

# Install iOS dependencies
npm install

# Run on iOS simulator (requires Xcode)
npm run ios
```

**Pros:**
- ✅ Full native experience
- ✅ Can test iOS-specific features

**Cons:**
- ⚠️ Requires macOS and Xcode
- ⚠️ First build takes 5-10 minutes
- ⚠️ No real GPS or biometric hardware

### Option 4: Android Emulator (15 min)

```bash
cd packages/mobile

# Install Android dependencies
npm install

# Run on Android emulator (requires Android Studio)
npm run android
```

**Pros:**
- ✅ Full native experience
- ✅ Works on any OS

**Cons:**
- ⚠️ Requires Android Studio and SDK
- ⚠️ Emulator setup is complex
- ⚠️ First build takes 10-15 minutes

## Issues Preventing Web View

### Problem 1: Missing Dependencies
The mobile package needs additional dependencies for web support:
```
✅ react-native-web (now installed)
⚠️ react-native-worklets (needs proper setup)
⚠️ expo-localization version mismatch
```

### Problem 2: Monorepo Hoisting
Expo plugins are looking for dependencies in wrong location:
```
expo-location plugin expects: node_modules/expo/config-plugins
Actual location: packages/mobile/node_modules/expo/config-plugins
```

### Problem 3: Bundle Compilation Errors
Metro bundler failing with:
```
Cannot find module 'react-native-worklets/plugin'
MIME type 'application/json' is not executable
```

## Fixing Web Support (TODO)

To enable web viewing, the following needs to be done:

### 1. Fix Dependency Resolution
```bash
cd packages/mobile

# Add missing worklets dependency
npx expo install react-native-reanimated react-native-worklets

# Fix version mismatches
npx expo install --fix
```

### 2. Configure for Web
Update `app.json` to conditionally load native plugins:
```json
{
  "expo": {
    "plugins": [
      // Only load these for native builds, not web
    ]
  }
}
```

### 3. Update Metro Config
Create `metro.config.js` to handle monorepo structure:
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add workspace packages
config.watchFolders = [
  path.resolve(__dirname, '../..'),
];

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../../node_modules'),
];

module.exports = config;
```

### 4. Alternative: Create Web-Only Entry Point
Create a separate `web-index.tsx` that doesn't import native-only modules:
```typescript
// packages/mobile/web-index.tsx
import { registerRootComponent } from 'expo';
import App from './App.web'; // Web-specific app without native deps

registerRootComponent(App);
```

## Alternative: View Web Application

If you want to see the UI/UX immediately, the **web application** already works and shares 70% of the code with mobile:

```bash
# From root directory
npm run dev:web
```

Open http://localhost:3001

The web app includes:
- ✅ All verticals (clients, caregivers, visits, etc.)
- ✅ Dashboard views
- ✅ Care plans
- ✅ EVV tracking interface
- ✅ Analytics
- ✅ Family portal

**Mobile-specific features not in web:**
- Offline-first (WatermelonDB)
- GPS/geofencing
- Biometric auth
- Background location tracking
- Camera integration

## Recommended Next Steps

1. **Immediate viewing**: Use **Expo Go on phone** (Option 2) - fastest way to see the app
2. **For development**: Use **iOS Simulator** (Option 3) or **Android Emulator** (Option 4)
3. **For web preview**: Fix the issues above to enable web support
4. **Alternative**: View the web app which shares most UI/UX

## Getting Help

If you need to view the mobile app urgently:
1. Try Expo Go on your phone (5 minutes)
2. If that doesn't work, view the web app instead
3. For production mobile viewing, native simulators are required

The mobile app infrastructure is complete, but the web preview requires additional configuration due to the monorepo structure and native dependencies.

---

**TL;DR**: Use Expo Go on your phone for the fastest way to see the mobile app. Run `cd packages/mobile && npm run start` and scan the QR code with Expo Go app.
