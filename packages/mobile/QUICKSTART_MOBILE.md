# Mobile App Quick Start Guide

Get the Folk mobile app running in 5 minutes.

## Prerequisites

- ✅ Node.js 22.x (check: `node -v`)
- ✅ iOS Simulator (macOS with Xcode) or Android Emulator
- ✅ Git repository cloned

## 1. Install Dependencies (2 minutes)

```bash
cd packages/mobile
npm install
```

This installs:
- Expo SDK 54
- React Native 0.82
- React Navigation 7
- WatermelonDB
- All mobile dependencies

## 2. Build Shared Components (1 minute)

```bash
cd ../shared-components
npm run build
cd ../mobile
```

This compiles the platform-agnostic UI components.

## 3. Verify Installation (30 seconds)

```bash
./verify-installation.sh
```

Should show all green checkmarks ✅

## 4. Start Development Server (30 seconds)

```bash
npm run dev
```

This starts Expo dev server at http://localhost:8081

## 5. Run on Simulator (1 minute)

### iOS (macOS only)
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Web (for quick testing)
```bash
npm run web
```

## 🎉 Success!

You should see:
- Login screen with biometric option
- Email/password inputs
- "Folk" branding

## What You Can Do Now

### 1. Test Login Flow
The login screen is fully functional with:
- Email/password validation
- Biometric authentication (if available)
- Loading states
- Error handling

**Note:** Backend API connection needed for actual authentication.

### 2. Explore Today's Visits (Mock Data)
After login implementation, the Today's Visits screen shows:
- Visit list with status badges
- Clock-in buttons
- Pull-to-refresh
- Offline indicators

### 3. Test Offline Mode
The app is designed to work offline:
- Location service captures GPS
- Offline queue stores operations
- Syncs when connection restored

## Common Issues & Fixes

### "Cannot find module 'expo-local-authentication'"
**Fix:** Run `npm install` in packages/mobile

### "Module resolution failed"
**Fix:** 
```bash
cd ../shared-components
npm run build
cd ../mobile
```

### iOS build fails
**Fix:** 
```bash
cd ios
pod install
cd ..
npm run ios
```

### Android build fails
**Fix:** Ensure Android SDK is installed and ANDROID_HOME is set

### "Port 8081 already in use"
**Fix:** 
```bash
lsof -ti:8081 | xargs kill -9
npm run dev
```

## Directory Structure

```
packages/mobile/
├── src/
│   ├── navigation/
│   │   └── RootNavigator.tsx      # Navigation structure
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx    # Login with biometric
│   │   └── visits/
│   │       └── TodayVisitsScreen.tsx  # Visit list
│   ├── services/
│   │   ├── api-client.ts          # HTTP client
│   │   ├── auth.ts                # Authentication
│   │   ├── location.ts            # GPS service
│   │   └── offline-queue.ts       # Sync queue
│   └── database/
│       ├── schema.ts              # WatermelonDB schema
│       └── models/                # Data models
├── App.tsx                        # App entry point
├── app.json                       # Expo configuration
└── package.json                   # Dependencies
```

## Architecture Overview

### Data Flow
```
Screen → Hook → Service → API/Database → Response
```

### Offline-First
```
Action → Local Storage (WatermelonDB) → UI Update → Background Sync
```

### Authentication
```
Login → Secure Storage → API Token → Biometric Setup (optional)
```

## Key Files to Understand

### 1. Navigation (src/navigation/RootNavigator.tsx)
Defines app navigation structure:
- Auth flow (not authenticated)
- Main tabs (authenticated)
- Modal screens

### 2. API Client (src/services/api-client.ts)
Handles all HTTP requests:
- Token management
- Offline detection
- Error handling
- Type-safe responses

### 3. Auth Service (src/services/auth.ts)
Manages authentication:
- Login/logout
- Token storage (encrypted)
- Biometric setup
- Session restoration

### 4. Location Service (src/services/location.ts)
GPS and geofencing:
- High-accuracy GPS
- Mock detection
- State-specific rules
- Background tracking

## Development Workflow

### 1. Make Changes
Edit files in `src/` directory

### 2. Hot Reload
Changes appear instantly in simulator (Expo Fast Refresh)

### 3. Test
```bash
npm run lint        # Check code style
npm run typecheck   # Check types
npm test           # Run tests (when added)
```

### 4. Commit
```bash
git add .
git commit -m "feat(mobile): your change"
```

Pre-commit hooks automatically run checks.

## Next Development Tasks

### High Priority
1. **Connect API Client** (1 hour)
   - Update `src/services/api-client.ts` with backend URL
   - Test authentication flow
   - Wire up Today's Visits screen

2. **Implement Clock-In Screen** (2-3 hours)
   - GPS verification UI
   - Geofence visualization
   - Photo capture
   - Offline queueing

3. **Add Tests** (2-3 hours)
   - Service tests
   - Component tests
   - E2E critical flows

### Medium Priority
4. **Task Management** (2-3 hours)
   - Task list screen
   - Task completion
   - Notes capture

5. **Profile & Settings** (1-2 hours)
   - User info display
   - Biometric toggle
   - App preferences

### Lower Priority
6. **Push Notifications** (1-2 hours)
   - Visit reminders
   - Sync status
   - System alerts

7. **Dark Mode** (1-2 hours)
   - Theme provider
   - Color schemes
   - Persistence

## Performance Tips

### Keep Bundle Small
- Use React.lazy for code splitting
- Optimize images (WebP format)
- Remove unused dependencies

### Optimize Renders
- Use React.memo for expensive components
- Avoid inline functions in render
- Use FlatList for long lists

### Battery Efficiency
- Minimize background location updates
- Batch network requests
- Use geofencing for location monitoring

## Debugging

### Expo Dev Tools
Press `m` in terminal to open menu with:
- Reload app
- Debug JS remotely
- Toggle performance monitor
- Toggle element inspector

### React Native Debugger
Better alternative to Chrome DevTools:
```bash
brew install react-native-debugger
```

### Logs
```bash
# iOS logs
npm run ios -- --verbose

# Android logs
npm run android -- --verbose
```

## Building for Production

### Development Build (EAS)
```bash
eas build --profile development --platform ios
```

### Production Build
```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

### Submit to App Stores
```bash
eas submit --platform ios
eas submit --platform android
```

## Resources

### Documentation
- **Architecture:** See `MOBILE_FOUNDATION_SUMMARY.md`
- **Next Steps:** See `NEXT_STEPS.md`
- **Completion Report:** See `MOBILE_IMPLEMENTATION_COMPLETE.md`

### External Docs
- **Expo:** https://docs.expo.dev
- **React Native:** https://reactnative.dev
- **React Navigation:** https://reactnavigation.org
- **WatermelonDB:** https://nozbe.github.io/WatermelonDB

### Community
- **GitHub:** https://github.com/neighborhood-lab/folkcare
- **Issues:** Report bugs via GitHub Issues
- **Discussions:** GitHub Discussions

## Success Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Shared components built
- [ ] Verification script passed
- [ ] App runs on simulator
- [ ] Login screen displays
- [ ] Hot reload working
- [ ] Can navigate between screens
- [ ] No console errors

## 🎯 You're Ready!

Start building features for caregivers. The foundation is solid:
- ✅ Offline-first architecture
- ✅ Type-safe throughout
- ✅ Production-ready patterns
- ✅ EVV compliance built-in
- ✅ Maximum code reuse

**Happy coding!** 🚀

---

**Questions?** Check the comprehensive docs or open a GitHub Discussion.
