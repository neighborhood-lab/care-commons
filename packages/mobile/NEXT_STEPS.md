# Mobile App - Next Steps

## Immediate Setup (5-10 minutes)

### 1. Install Dependencies
```bash
cd packages/mobile
npm install
```

This will install the new dependency:
- `expo-local-authentication` - Biometric authentication support

### 2. Verify Build
```bash
npm run typecheck  # Should pass (dependencies installed)
npm run lint       # Should pass (already validated)
```

## Quick Start (After Setup)

### Run on Simulator
```bash
# iOS
npm run ios

# Android  
npm run android

# Web (for testing)
npm run web
```

### Development Mode
```bash
npm run dev  # Start Expo dev server
```

## Integration Tasks

### Task 1: Connect API Client to Backend (30 mins)

Update API base URL in mobile app:

```typescript
// packages/mobile/src/config/api.ts (create this file)
export const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 30000,
};
```

Then in App.tsx:
```typescript
import { createApiClient } from './services/api-client';
import { API_CONFIG } from './config/api';

const apiClient = createApiClient(API_CONFIG);
```

### Task 2: Wire Up Authentication State (1 hour)

Create auth context/provider:

```typescript
// packages/mobile/src/context/AuthContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import { createAuthService } from '../services/auth';

export const AuthContext = createContext(/* ... */);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Restore session on app start
    const authService = createAuthService();
    authService.restoreSession().then(setUser).finally(() => setIsLoading(false));
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

Update App.tsx to use AuthProvider:
```typescript
import { AuthProvider } from './context/AuthContext';
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
```

### Task 3: Update RootNavigator (15 mins)

Connect RootNavigator to auth state:

```typescript
// In RootNavigator.tsx
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function RootNavigator() {
  const { user, isLoading } = useContext(AuthContext);
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <NavigationContainer>
      <RootStack.Navigator>
        {!user ? (
          <RootStack.Screen name="Auth" component={LoginScreen} />
        ) : (
          {/* ... authenticated screens */}
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
```

### Task 4: Enhance Clock-In Screen (2-3 hours)

Build GPS verification UI with live feedback:

```typescript
// packages/mobile/src/screens/visits/ClockInScreen.tsx
import { locationService } from '../../services/location';

export function ClockInScreen({ route }) {
  const { visitId } = route.params;
  const [location, setLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [isWithinGeofence, setIsWithinGeofence] = useState(false);
  
  useEffect(() => {
    // Request location permissions
    // Get current location
    // Verify geofence
    // Show live feedback
  }, []);
  
  return (
    <View>
      {/* GPS Status Indicator */}
      {/* Geofence Visualization */}
      {/* Pre-flight Checks */}
      {/* Clock In Button */}
    </View>
  );
}
```

Components needed:
- GPS accuracy indicator (color-coded)
- Geofence distance meter
- Permission status alerts
- Loading states
- Error handling

### Task 5: Load Real Visit Data (1-2 hours)

Replace mock data in TodayVisitsScreen with real API calls:

```typescript
// Use TanStack Query for data fetching
import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '../../services/api-client';

export function TodayVisitsScreen() {
  const { data: visits, isLoading, refetch } = useQuery({
    queryKey: ['visits', 'today'],
    queryFn: async () => {
      const apiClient = getApiClient();
      const response = await apiClient.get('/visits', {
        params: { date: new Date().toISOString() }
      });
      return response.data.visits;
    },
  });
  
  // ... rest of component
}
```

### Task 6: Integrate Offline Queue (1 hour)

Connect offline queue to API client:

```typescript
// In api-client.ts, enhance requestWithOfflineSupport
import { offlineQueueService } from './offline-queue';

async requestWithOfflineSupport<T>(/* ... */) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 0) {
      // Queue for offline sync
      await offlineQueueService.enqueue(
        queueData.type,
        queueData.data,
        queueData.priority
      );
      return null;
    }
    throw error;
  }
}
```

## Testing Checklist

### Before Production

- [ ] Test on real iOS device (not just simulator)
- [ ] Test on real Android device (not just emulator)
- [ ] Test offline scenarios:
  - [ ] Clock-in without network
  - [ ] View visits offline
  - [ ] Sync after reconnecting
- [ ] Test biometric authentication:
  - [ ] Face ID (iOS)
  - [ ] Touch ID (iOS)
  - [ ] Fingerprint (Android)
- [ ] Test GPS accuracy:
  - [ ] Indoor (low accuracy)
  - [ ] Outdoor (high accuracy)
  - [ ] Mock location detection
- [ ] Test state-specific rules:
  - [ ] Texas geofence (100m + accuracy)
  - [ ] Florida geofence (150m + accuracy)
- [ ] Test permission flows:
  - [ ] Location denied → prompt
  - [ ] Biometric not enrolled → fallback
- [ ] Load testing:
  - [ ] 50+ visits in list
  - [ ] Large offline queue (100+ operations)
  - [ ] Poor network conditions

## Environment Configuration

### Create .env file

```bash
# packages/mobile/.env.local
EXPO_PUBLIC_API_URL=https://api.carecommons.org
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### Expo Configuration

Update `app.json` with proper app identifiers:

```json
{
  "expo": {
    "name": "Care Commons",
    "slug": "care-commons",
    "ios": {
      "bundleIdentifier": "org.carecommons.mobile",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "We need your location to verify you're at the client's address for EVV compliance.",
        "NSLocationAlwaysUsageDescription": "We track your location during visits for EVV compliance and client safety.",
        "NSFaceIDUsageDescription": "Use Face ID to quickly and securely log in to Care Commons."
      }
    },
    "android": {
      "package": "org.carecommons.mobile",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "USE_BIOMETRIC"
      ]
    }
  }
}
```

## Deployment

### Build for TestFlight (iOS)

```bash
eas build --platform ios
eas submit --platform ios
```

### Build for Play Store (Android)

```bash
eas build --platform android
eas submit --platform android
```

### Over-the-Air Updates

```bash
eas update --branch production --message "Bug fixes and improvements"
```

## Performance Optimization

### Bundle Size
- Use Hermes JavaScript engine (already configured)
- Enable code splitting for large screens
- Optimize images (use WebP format)

### Battery Usage
- Minimize background location updates
- Use geofencing for location monitoring
- Batch network requests

### Memory Management
- Implement FlatList for large visit lists
- Clean up subscriptions in useEffect
- Avoid memory leaks in WatermelonDB queries

## Monitoring & Analytics

### Crash Reporting
Integrate Sentry:
```bash
npm install @sentry/react-native
npx @sentry/wizard -i reactNative -p ios android
```

### Analytics (Optional)
Consider Expo Analytics or Segment for:
- Screen views
- User actions (clock-in, clock-out)
- Offline queue metrics
- GPS accuracy stats

## Support & Resources

### Expo Documentation
- https://docs.expo.dev/
- https://docs.expo.dev/develop/development-builds/introduction/

### React Navigation
- https://reactnavigation.org/docs/getting-started

### WatermelonDB
- https://nozbe.github.io/WatermelonDB/

### EVV Compliance
- See `verticals/time-tracking-evv/README.md`
- State-specific configs in `verticals/time-tracking-evv/src/config/`

## Troubleshooting

### "Module not found: expo-local-authentication"
Run `npm install` in packages/mobile

### "Network request failed" during development
- Check API_URL in .env
- Ensure backend is running
- For iOS simulator: use `localhost`
- For Android emulator: use `10.0.2.2` instead of `localhost`

### GPS not working in simulator
- iOS: Simulator → Features → Location → Custom Location
- Android: Emulator → ... → Location → Set custom location

### Build fails with "duplicate resources"
- Clean: `npx expo start -c`
- Clear node_modules: `rm -rf node_modules && npm install`

---

**Questions?** Check the comprehensive docs:
- `MOBILE_FOUNDATION_SUMMARY.md` - Architecture and implementation details
- `IMPLEMENTATION_SUMMARY.md` - Original mobile foundation docs
- `README.md` - Package overview

**Ready to ship!** 🚀
