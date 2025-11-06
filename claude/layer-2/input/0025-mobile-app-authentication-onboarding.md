# Task 0022: Mobile App Authentication and Onboarding Flow

**Priority**: 🟠 HIGH
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 6-8 hours

## Context

The mobile app foundation exists, but the authentication and onboarding flow needs to be completed for a production-ready caregiver experience. Caregivers need a smooth first-time setup with biometric authentication, offline support, and clear onboarding.

## Problem Statement

**Current State**:
- Basic authentication exists but incomplete
- No first-time user onboarding flow
- Biometric authentication not fully implemented
- No offline token management
- No tutorial/walkthrough for new caregivers

**Impact**:
- Poor first impression for caregivers
- Confusion about how to use the app
- Security concerns with token storage
- Can't use app offline after first login

## Task

### 1. Implement Secure Token Storage

**File**: `packages/mobile/src/services/auth.service.ts`

```typescript
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export class AuthService {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'user_data';

  // Store tokens securely (Keychain on iOS, Keystore on Android)
  static async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(this.TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(this.TOKEN_KEY);
  }

  static async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(this.REFRESH_TOKEN_KEY);
  }

  static async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(this.TOKEN_KEY);
    await SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(this.USER_KEY);
  }

  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }
}
```

### 2. Implement Biometric Authentication

**File**: `packages/mobile/src/services/biometric.service.ts`

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

export class BiometricService {
  // Check if device supports biometrics
  static async isAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }

  // Get available biometric types
  static async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  }

  // Authenticate with biometrics
  static async authenticate(reason: string): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false
    });

    return result.success;
  }

  // Enable biometric login for user
  static async enableBiometricLogin(): Promise<void> {
    const success = await this.authenticate('Enable biometric login');
    if (success) {
      await SecureStore.setItemAsync('biometric_enabled', 'true');
    }
  }

  // Check if biometric login is enabled
  static async isBiometricEnabled(): Promise<boolean> {
    const enabled = await SecureStore.getItemAsync('biometric_enabled');
    return enabled === 'true';
  }
}
```

### 3. Create Login Screen

**File**: `packages/mobile/src/screens/auth/LoginScreen.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../../services/auth.service';
import { BiometricService } from '../../services/biometric.service';
import { useAuth } from '../../hooks/useAuth';

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await BiometricService.isAvailable();
    const enabled = await BiometricService.isBiometricEnabled();

    if (available && enabled) {
      setBiometricAvailable(true);
      // Auto-trigger biometric login
      handleBiometricLogin();
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email, password });

      if (result.success) {
        // Ask if they want to enable biometric login
        const available = await BiometricService.isAvailable();
        if (available) {
          Alert.alert(
            'Enable Biometric Login',
            'Would you like to use Face ID/Touch ID for faster login?',
            [
              { text: 'Not Now', style: 'cancel' },
              {
                text: 'Enable',
                onPress: async () => {
                  await BiometricService.enableBiometricLogin();
                }
              }
            ]
          );
        }

        // Navigate to onboarding or home
        const isFirstLogin = await AsyncStorage.getItem('first_login');
        if (!isFirstLogin) {
          navigation.replace('Onboarding');
        } else {
          navigation.replace('Main');
        }
      }
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    const success = await BiometricService.authenticate('Login to Care Commons');

    if (success) {
      // Use stored refresh token to get new access token
      try {
        const refreshToken = await AuthService.getRefreshToken();
        const result = await login({ refreshToken });

        if (result.success) {
          navigation.replace('Main');
        }
      } catch (error) {
        // Fallback to email/password login
        Alert.alert('Biometric Login Failed', 'Please login with your credentials');
      }
    }
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-900">Welcome Back</Text>
        <Text className="text-gray-600 mt-2">Sign in to continue</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-4 mt-4"
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {loading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        {biometricAvailable && (
          <TouchableOpacity
            className="border-2 border-blue-600 rounded-lg py-4 mt-2 flex-row items-center justify-center"
            onPress={handleBiometricLogin}
          >
            <Ionicons name="finger-print" size={24} color="#2563eb" />
            <Text className="text-blue-600 font-semibold text-lg ml-2">
              Use Biometric Login
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity className="mt-6" onPress={() => navigation.navigate('ForgotPassword')}>
        <Text className="text-blue-600 text-center">Forgot password?</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 4. Create Onboarding Screens

**File**: `packages/mobile/src/screens/onboarding/OnboardingScreen.tsx`

```typescript
import React, { useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: '1',
    title: 'Welcome to Care Commons',
    description: 'Your all-in-one tool for managing client visits and care tasks',
    icon: 'home-outline',
    color: '#3b82f6'
  },
  {
    id: '2',
    title: 'Check In & Out with GPS',
    description: 'Automatically verify your location when starting and ending visits',
    icon: 'location-outline',
    color: '#10b981'
  },
  {
    id: '3',
    title: 'Complete Care Tasks',
    description: 'View and complete assigned tasks for each client visit',
    icon: 'checkbox-outline',
    color: '#f59e0b'
  },
  {
    id: '4',
    title: 'Works Offline',
    description: 'Continue working without internet. Data syncs automatically when online.',
    icon: 'cloud-offline-outline',
    color: '#8b5cf6'
  }
];

export const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem('first_login', 'true');
    navigation.replace('Main');
  };

  const renderSlide = ({ item }) => (
    <View style={{ width }} className="flex-1 items-center justify-center px-8">
      <View
        className="w-32 h-32 rounded-full items-center justify-center mb-8"
        style={{ backgroundColor: `${item.color}20` }}
      >
        <Ionicons name={item.icon} size={64} color={item.color} />
      </View>

      <Text className="text-2xl font-bold text-gray-900 text-center mb-4">
        {item.title}
      </Text>

      <Text className="text-base text-gray-600 text-center">
        {item.description}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {/* Pagination Dots */}
      <View className="flex-row justify-center mb-8">
        {ONBOARDING_SLIDES.map((_, index) => (
          <View
            key={index}
            className={`w-2 h-2 rounded-full mx-1 ${
              index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View className="flex-row justify-between px-8 pb-8">
        <TouchableOpacity onPress={handleSkip}>
          <Text className="text-gray-600 text-base">Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-blue-600 rounded-lg px-8 py-3"
          onPress={handleNext}
        >
          <Text className="text-white font-semibold">
            {currentIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

### 5. Implement Auto-Login with Refresh Tokens

**File**: `packages/mobile/src/hooks/useAuth.ts`

```typescript
import { useState, useEffect } from 'react';
import { AuthService } from '../services/auth.service';
import { apiClient } from '../services/api.service';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AuthService.getAccessToken();

      if (token) {
        // Verify token is still valid
        const response = await apiClient.get('/auth/me');
        setUser(response.data);
      }
    } catch (error) {
      // Token expired, try refresh
      await refreshAuth();
    } finally {
      setLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      const refreshToken = await AuthService.getRefreshToken();

      if (refreshToken) {
        const response = await apiClient.post('/auth/refresh', { refreshToken });
        await AuthService.storeTokens(response.data.accessToken, response.data.refreshToken);
        setUser(response.data.user);
      }
    } catch (error) {
      // Refresh failed, logout
      await logout();
    }
  };

  const login = async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    await AuthService.storeTokens(response.data.accessToken, response.data.refreshToken);
    setUser(response.data.user);
    return { success: true };
  };

  const logout = async () => {
    await AuthService.clearTokens();
    setUser(null);
  };

  return { user, loading, login, logout, refreshAuth };
};
```

### 6. Add Offline Token Management

Ensure tokens work offline by caching user data:

```typescript
// Store user data for offline access
static async storeUserData(user: User): Promise<void> {
  await SecureStore.setItemAsync(this.USER_KEY, JSON.stringify(user));
}

static async getUserData(): Promise<User | null> {
  const data = await SecureStore.getItemAsync(this.USER_KEY);
  return data ? JSON.parse(data) : null;
}

// When offline, use cached user data
const user = await AuthService.getUserData();
```

### 7. Add Permission Requests

**File**: `packages/mobile/src/screens/onboarding/PermissionsScreen.tsx`

Request necessary permissions during onboarding:

```typescript
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

const requestPermissions = async () => {
  // Location (required for GPS check-in)
  const location = await Location.requestForegroundPermissionsAsync();

  // Notifications (optional for visit reminders)
  const notifications = await Notifications.requestPermissionsAsync();

  return {
    location: location.granted,
    notifications: notifications.granted
  };
};
```

## Acceptance Criteria

- [ ] Secure token storage implemented (SecureStore)
- [ ] Biometric authentication working (Face ID/Touch ID)
- [ ] Login screen with email/password
- [ ] Biometric login option on login screen
- [ ] Onboarding flow with 4 slides
- [ ] Skip and finish onboarding
- [ ] Auto-login with refresh tokens
- [ ] Offline token management
- [ ] Permission requests (location, notifications)
- [ ] First-time user experience smooth
- [ ] Logout functionality
- [ ] Forgot password flow (link to web)
- [ ] Tests for authentication service
- [ ] Works on iOS and Android

## Testing Checklist

1. **New User Flow**:
   - Install app → Login → See onboarding → Grant permissions → Navigate to home
2. **Returning User Flow**:
   - Open app → Auto-login with biometric → Navigate to home
3. **Offline**:
   - Login while online → Go offline → Close app → Reopen → Still logged in
4. **Token Expiry**:
   - Wait for token to expire → Open app → Auto-refresh → Stay logged in
5. **Logout**:
   - Logout → Tokens cleared → Redirect to login

## Definition of Done

- ✅ Complete authentication flow working
- ✅ Biometric login functional
- ✅ Onboarding experience implemented
- ✅ Offline support for authentication
- ✅ Secure token storage
- ✅ Works on iOS and Android
- ✅ Smooth first-time user experience
- ✅ Tests passing

## Dependencies

**Blocks**: Task 0004 (Mobile visit workflow)
**Depends on**: Backend authentication APIs (already exist)

## Priority Justification

This is **HIGH** priority because:
1. First impression for caregivers
2. Required for all mobile features
3. Security foundation
4. Enables offline usage
5. Production readiness requirement

---

**Next Task**: 0023 - Timezone Handling
