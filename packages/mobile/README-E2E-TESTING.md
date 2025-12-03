# Mobile E2E Testing with Detox

## Overview

This directory contains end-to-end (E2E) tests for the Folk mobile application using [Detox](https://wix.github.io/Detox/).

**Status**: MVP Implementation Complete  
**Coverage**: Authentication, Visit Check-In/Out (EVV Compliance)  
**Platforms**: iOS (Android support pending)

## Quick Start

### Prerequisites

1. **macOS** with Xcode installed (for iOS testing)
2. **Node.js 22.x** (already configured in project)
3. **iOS Simulator** (via Xcode)
4. **Detox CLI** (installed as dev dependency)

### Installation

Detox and dependencies are already installed. If you need to reinstall:

```bash
npm install --save-dev detox jest ts-jest @types/jest
```

### Running Tests

**Step 1: Build the app for testing**

```bash
# Build iOS app for simulator
npx detox build --configuration ios.sim.debug
```

**Step 2: Run E2E tests**

```bash
# Run all E2E tests
npx detox test --configuration ios.sim.debug

# Run specific test file
npx detox test --configuration ios.sim.debug e2e/tests/01-authentication.e2e.ts

# Run with verbose output
npx detox test --configuration ios.sim.debug --loglevel verbose
```

**Step 3: Debug failing tests**

```bash
# Run tests in debug mode (slower, more detailed logs)
npx detox test --configuration ios.sim.debug --loglevel trace

# Take screenshots on test failure
npx detox test --configuration ios.sim.debug --take-screenshots failing
```

## TypeScript Configuration

The E2E tests use a **separate TypeScript configuration** from the main mobile app:

### Why Separate Configurations?

1. **Different Test Frameworks**: The main app uses Vitest, while E2E tests use Jest + Detox
2. **Detox Global Types**: Detox v20+ provides its own global types (`by`, `element`, `waitFor`, `device`) that conflict with the app's type definitions
3. **Different Module Systems**: E2E tests may need different module resolution settings

### Configuration Files

| File | Purpose |
|------|---------|
| `packages/mobile/tsconfig.json` | Main app config (excludes `e2e/` directory) |
| `packages/mobile/e2e/tsconfig.json` | E2E test config with Jest/Detox types |
| `packages/mobile/e2e/jest.config.js` | Jest config for Detox test runner |

### Type Checking E2E Tests

```bash
# Type check main app only (default)
cd packages/mobile
npm run typecheck

# Type check E2E tests separately
cd packages/mobile/e2e
npx tsc --noEmit
```

### Note on @types/detox

As of Detox v20+, the package provides its own TypeScript types. The separate `@types/detox` package is **no longer needed** and was removed to avoid duplicate/conflicting type definitions.

## Test Structure

```
e2e/
├── tsconfig.json                         # E2E-specific TypeScript config (separate from app)
├── jest.config.js                        # Jest configuration for Detox
├── tests/
│   ├── 01-authentication.e2e.ts         # Login, logout, session management
│   ├── 03-visit-check-in-out.e2e.ts     # EVV compliance (CRITICAL)
│   └── (additional tests to be added)
├── fixtures/
│   ├── caregivers.json                   # Test caregiver data
│   ├── clients.json                      # Test client data
│   ├── visits.json                       # Test visit schedules
│   └── tasks.json                        # Test care tasks
├── helpers/
│   ├── location-mock.ts                  # GPS location mocking
│   ├── network-mock.ts                   # Network condition simulation
│   └── assertions.ts                     # Custom EVV/geofence assertions
└── setup/
    ├── test-environment.ts               # Test data seeding and utilities
    ├── global-setup.ts                   # Global test setup
    └── global-teardown.ts                # Global test teardown
```

## Current Implementation Status

### ✅ Completed

- **Detox Configuration**: `.detoxrc.js` configured for iOS and Android
- **Jest Integration**: `jest.config.js` with TypeScript support
- **Test Fixtures**: Realistic caregiver, client, visit, and task data
- **Helper Utilities**: Location mocking, network mocking, custom assertions
- **Test Environment**: Setup and teardown utilities
- **Authentication Tests**: Login, logout, error handling (01-authentication.e2e.ts)
- **EVV Compliance Tests**: Check-in/out flow for Texas and Florida (03-visit-check-in-out.e2e.ts)

### 🚧 Pending (Requires App Changes)

Before tests can run successfully, the mobile app UI components need `testID` props added:

#### Login Screen (`packages/mobile/src/screens/auth/LoginScreen.tsx`)

```tsx
<View testID="login-screen">
  <TextInput testID="email-input" ... />
  <TextInput testID="password-input" ... />
  <Button testID="login-button" ... />
  <Text testID="error-message">...</Text>
  <Text testID="email-error">...</Text>
  <Text testID="password-error">...</Text>
</View>
```

#### Schedule Screen (`packages/mobile/src/screens/schedule/ScheduleScreen.tsx`)

```tsx
<View testID="schedule-screen">
  <FlatList testID="visit-list">
    <TouchableOpacity testID={`visit-item-${index}`}>...</TouchableOpacity>
  </FlatList>
</View>
```

#### Visit Detail Screen (`packages/mobile/src/screens/visits/VisitDetailScreen.tsx`)

```tsx
<View testID="visit-detail-screen">
  <Button testID="check-in-button" ... />
  <Button testID="check-out-button" ... />
  <Text testID="check-in-time">...</Text>
  <Text testID="location-verified-badge">...</Text>
  <Text testID="geofence-error">...</Text>
  <Text testID="gps-accuracy-warning">...</Text>
  <Text testID="visit-completed-indicator">...</Text>
</View>
```

#### Profile Screen (`packages/mobile/src/screens/profile/ProfileScreen.tsx`)

```tsx
<View testID="profile-screen">
  <Button testID="logout-button" ... />
  <Button testID="confirm-logout" ... />
</View>
```

#### Bottom Navigation

```tsx
<Tab testID="schedule-tab" ... />
<Tab testID="profile-tab" ... />
```

### 📋 Test Coverage

| Test Suite | Status | Coverage |
|------------|--------|----------|
| Authentication | ✅ Complete | Login, logout, validation errors |
| EVV Check-In/Out (TX) | ✅ Complete | Happy path, geofence validation, GPS accuracy |
| EVV Check-In/Out (FL) | ✅ Complete | Happy path, geofence validation (150m) |
| Offline Workflow | ❌ Pending | Offline check-in, sync queue, conflict resolution |
| Visit Documentation | ❌ Pending | Notes, tasks, photo upload |
| Schedule Management | ❌ Pending | View schedule, refresh, filters |
| Biometric Auth | ❌ Pending | Face ID / Touch ID re-authentication |

## State-Specific EVV Testing

### Texas (HHSC Regulations)

- **Geofence**: 100m + GPS accuracy
- **Aggregator**: HHAeXchange
- **Test Location**: Austin, TX (30.2672, -97.7431)

**Test Scenarios**:
- ✅ Check-in at client address (0m distance)
- ✅ Check-in within geofence (90m, within 100m limit)
- ✅ Check-in rejected outside geofence (200m, exceeds 100m limit)
- ✅ Check-in with poor GPS accuracy (100m accuracy, still within 100m + 100m = 200m total)

### Florida (AHCA Regulations)

- **Geofence**: 150m + GPS accuracy
- **Aggregator**: Multi-aggregator (HHAeXchange, Netsmart)
- **Test Location**: Miami, FL (25.7617, -80.1918)

**Test Scenarios**:
- ✅ Check-in at client address (0m distance)
- ✅ Check-in within geofence (140m, within 150m limit)
- ✅ Check-in rejected outside geofence (300m, exceeds 150m limit)

## EVV Compliance Validation

All tests validate the **six required EVV elements** per 21st Century Cures Act Section 12006:

1. **Service Type**: Type of care provided (personal care, companion care, etc.)
2. **Individual Receiving Service**: Client identification
3. **Individual Providing Service**: Caregiver identification
4. **Date of Service**: Service date
5. **Location of Service**: GPS coordinates (latitude/longitude)
6. **Time In/Out**: Check-in and check-out timestamps

## Troubleshooting

### Issue: Tests fail with "Cannot find element by.id('...')"

**Cause**: UI components don't have `testID` props  
**Solution**: Add `testID` props to components as documented above

### Issue: Detox build fails

**Cause**: Expo app not prebuilt for native  
**Solution**: Run `npx expo prebuild --platform ios` first

### Issue: Simulator doesn't launch

**Cause**: Simulator not installed or incorrect device name  
**Solution**: 
1. Open Xcode → Preferences → Components → Install iOS simulators
2. Update `.detoxrc.js` device name to match installed simulators
3. List simulators: `xcrun simctl list devices available`

### Issue: GPS location mocking not working

**Cause**: Simulator location services disabled  
**Solution**: Features → Location → Custom Location (set in simulator menu)

### Issue: Network mocking doesn't work

**Cause**: Detox doesn't have built-in network mocking  
**Solution**: Use app-level mocks or external proxy (Charles, mitmproxy)

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/mobile-e2e.yml`:

```yaml
name: Mobile E2E Tests

on:
  pull_request:
    paths:
      - 'packages/mobile/**'
  push:
    branches:
      - develop

jobs:
  e2e-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22.x'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build iOS app for testing
        run: |
          cd packages/mobile
          npx detox build --configuration ios.sim.debug
      
      - name: Run Detox tests
        run: |
          cd packages/mobile
          npx detox test --configuration ios.sim.debug --cleanup
      
      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: detox-artifacts
          path: packages/mobile/artifacts/
```

## Future Enhancements

### Short-Term (Next Sprint)

1. **Add testID props to all screens** (prerequisite for running tests)
2. **Implement offline workflow tests** (critical for field caregivers)
3. **Add visit documentation tests** (notes, tasks, signatures)
4. **Set up CI/CD pipeline** (run tests on every PR)

### Medium-Term

1. **Android support** (configure Detox for Android emulator)
2. **Performance testing** (measure app startup, navigation speed)
3. **Accessibility testing** (VoiceOver, TalkBack integration)
4. **Visual regression testing** (screenshot comparisons)

### Long-Term

1. **Multi-language testing** (Spanish, etc.)
2. **Biometric authentication tests** (Face ID, Touch ID)
3. **Load testing** (simulate hundreds of visits)
4. **Advanced offline scenarios** (sync conflicts, data corruption)

## Resources

- **Detox Documentation**: https://wix.github.io/Detox/
- **Detox with Expo**: https://docs.expo.dev/guides/detox/
- **21st Century Cures Act EVV**: https://www.medicaid.gov/medicaid/home-community-based-services/guidance/electronic-visit-verification-evv/index.html
- **Texas EVV Rules**: https://hhs.texas.gov/services/health/electronic-visit-verification-evv
- **Florida EVV Rules**: https://ahca.myflorida.com/content/download/9876/file/EVV_Provider_Guide.pdf

## Support

For questions or issues with E2E testing:

1. Check this README and troubleshooting section
2. Review Detox documentation
3. Check existing GitHub issues
4. Create new issue with:
   - Test output (use `--loglevel verbose`)
   - Screenshots of failure
   - Steps to reproduce

---

**Last Updated**: 2025-11-25  
**Maintainer**: Folk Development Team
