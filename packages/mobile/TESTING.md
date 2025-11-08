# Mobile App Testing Guide

This guide covers all aspects of testing the Care Commons mobile app, including unit tests, integration tests, and E2E tests with Maestro.

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Quick Start](#quick-start)
- [Unit & Integration Tests](#unit--integration-tests)
- [E2E Tests with Maestro](#e2e-tests-with-maestro)
- [Visual Regression Testing](#visual-regression-testing)
- [Performance Testing](#performance-testing)
- [CI/CD Integration](#cicd-integration)
- [Writing New Tests](#writing-new-tests)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Care Commons mobile app uses a comprehensive testing strategy:

- **Unit Tests**: Vitest for services, utilities, and business logic
- **Integration Tests**: Vitest for database queries and offline sync
- **E2E Tests**: Maestro for user workflows and UI automation
- **Visual Regression**: Maestro screenshots with comparison tools
- **Performance Tests**: Maestro with built-in metrics tracking

### Testing Coverage Goals

- Unit/Integration: 70% minimum coverage
- E2E: 5+ critical workflows
- Visual: All major screens
- Performance: <10 minutes test execution

## Testing Stack

### Unit & Integration Testing

- **Framework**: [Vitest](https://vitest.dev/)
- **Coverage**: v8 provider
- **Mocks**: Built-in mocking for React Native modules

### E2E Testing

- **Framework**: [Maestro](https://maestro.mobile.dev/)
- **Platforms**: iOS (Simulator) and Android (Emulator)
- **CI/CD**: GitHub Actions with macOS and Ubuntu runners

## Quick Start

### Running Unit Tests

```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Running E2E Tests

#### Prerequisites

1. **Install Maestro CLI**:
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   export PATH="$HOME/.maestro/bin:$PATH"
   ```

2. **Start iOS Simulator or Android Emulator**:
   ```bash
   # iOS
   npm run ios

   # Android
   npm run android
   ```

#### Run Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test flows
npm run test:e2e:login
npm run test:e2e:clock-in
npm run test:e2e:tasks
npm run test:e2e:documentation
npm run test:e2e:offline
npm run test:e2e:visual
npm run test:e2e:performance

# Run on specific platform
npm run test:e2e:ios
npm run test:e2e:android

# Generate JUnit report
npm run test:e2e:report
```

## Unit & Integration Tests

### Test Structure

Unit tests are located in:
- `src/__tests__/` - Integration tests
- `src/services/__tests__/` - Service tests

### Example Test

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { locationService } from '../location';

describe('LocationService', () => {
  it('should calculate distance correctly', () => {
    const distance = locationService.calculateDistance(
      30.2672, -97.7431, // Austin, TX
      30.2700, -97.7400  // Nearby point
    );

    expect(distance).toBeLessThan(500); // Within 500m
  });
});
```

### Running Specific Tests

```bash
# Run specific test file
npm run test -- location.test.ts

# Run tests matching pattern
npm run test -- --grep "GPS"
```

## E2E Tests with Maestro

### Test Flow Structure

E2E tests are located in `.maestro/flows/`:

- `00-comprehensive-suite.yaml` - Full test suite
- `01-login.yaml` - Login workflow
- `02-clock-in.yaml` - Clock-in with GPS verification
- `03-task-completion.yaml` - Task completion workflow
- `04-visit-documentation.yaml` - Visit documentation
- `05-offline-mode.yaml` - Offline functionality
- `06-visual-regression.yaml` - Screenshot capture
- `07-performance.yaml` - Performance benchmarks
- `helpers/login.yaml` - Reusable login helper

### Maestro Flow Basics

Maestro uses YAML files to define test flows. Here's a simple example:

```yaml
appId: com.carecommons.mobile
tags:
  - login
  - critical
---

# Launch app
- launchApp:
    clearState: true

# Assert UI element is visible
- assertVisible: "Care Commons"

# Tap on element
- tapOn: "Enter your email"

# Input text
- inputText: "test@example.com"

# Tap button
- tapOn: "Login"

# Wait for screen to load
- assertVisible:
    text: "Schedule"
    timeout: 10000

# Take screenshot
- takeScreenshot: login-success
```

### Key Maestro Commands

#### Navigation & Interaction

```yaml
# Tap on element by text or testID
- tapOn: "Button Text"
- tapOn:
    id: "button-test-id"

# Input text
- inputText: "Hello World"

# Scroll
- scroll

# Swipe
- swipe:
    direction: UP
    distance: 200
```

#### Assertions

```yaml
# Assert element is visible
- assertVisible: "Text"
- assertVisible:
    text: "Welcome|Hello"  # Regex
    timeout: 5000

# Assert element is not visible
- assertNotVisible: "Error"
```

#### Flow Control

```yaml
# Conditional execution
- runFlow:
    when:
      visible: "Dialog"
    commands:
      - tapOn: "OK"

# Wait
- wait: 2000  # milliseconds
- waitForAnimationToEnd
```

#### Screenshots

```yaml
# Take screenshot
- takeScreenshot: screenshot-name

# Screenshots are saved to .maestro/screenshots/
```

### Using testID Props

For more reliable tests, add `testID` props to React Native components:

```tsx
<TextInput
  testID="email-input"
  placeholder="Enter email"
/>

<Button
  testID="login-button"
  onPress={handleLogin}
>
  Login
</Button>
```

Then reference in Maestro:

```yaml
- tapOn:
    id: "email-input"
- tapOn:
    id: "login-button"
```

## Visual Regression Testing

### Running Visual Tests

```bash
# Capture baseline screenshots
npm run test:e2e:visual
```

Screenshots are saved to `.maestro/visual-regression/`.

### Comparing Screenshots

1. **First run**: Generates baseline screenshots
2. **Subsequent runs**: Generate new screenshots
3. **Compare**: Use image diff tools to detect changes

#### Recommended Tools

- **Percy**: Automated visual testing platform
- **Applitools**: AI-powered visual testing
- **BackstopJS**: Open-source visual regression
- **Pixelmatch**: Node.js library for image comparison

### Example: Using Pixelmatch

```bash
npm install --save-dev pixelmatch pngjs

# Create comparison script
node scripts/compare-screenshots.js
```

## Performance Testing

### Running Performance Tests

```bash
npm run test:e2e:performance
```

### Metrics Tracked

- **Cold start time**: App launch from stopped state
- **Warm start time**: App launch from background
- **Login duration**: Time to authenticate
- **GPS acquisition**: Time to acquire accurate location
- **Screen transitions**: Navigation performance
- **Database queries**: Offline data loading

### Success Criteria

- Cold start: < 5 seconds
- Warm start: < 3 seconds
- Login: < 10 seconds
- GPS acquisition: < 15 seconds
- Screen transitions: < 2 seconds each

### Advanced Performance Profiling

For detailed performance analysis, use native tools:

#### iOS (Xcode Instruments)

```bash
# Launch Instruments
instruments -t "Time Profiler" -D trace.trace -l 60000 \
  "path/to/app.app"
```

#### Android (Android Studio Profiler)

1. Open Android Studio
2. Run app on emulator/device
3. View > Tool Windows > Profiler
4. Select app process
5. Record performance metrics

## CI/CD Integration

### GitHub Actions Workflow

E2E tests run automatically on:

- Pull requests affecting mobile package
- Pushes to `production`, `preview`, `develop` branches
- Manual workflow dispatch

### Workflow Jobs

1. **test-ios**: Run tests on macOS with iOS Simulator
2. **test-android**: Run tests on Ubuntu with Android Emulator
3. **performance-test**: Run performance benchmarks

### Viewing Test Results

- **Artifacts**: Test reports and screenshots uploaded as artifacts
- **Test Report**: JUnit XML reports published to PR checks
- **Performance**: Metrics commented on PR

### Running Tests Locally (CI Simulation)

```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run unit tests
npm run test:coverage

# Build app
npm run build:ios
npm run build:android

# Run E2E tests
npm run test:e2e
```

## Writing New Tests

### Adding a New E2E Flow

1. **Create flow file**:
   ```bash
   touch .maestro/flows/08-my-new-flow.yaml
   ```

2. **Define the flow**:
   ```yaml
   appId: com.carecommons.mobile
   tags:
     - my-feature
   ---

   - runFlow: helpers/login.yaml

   - tapOn: "My Feature"
   - assertVisible: "Feature Screen"
   - takeScreenshot: my-feature-screen
   ```

3. **Add npm script** (optional):
   ```json
   {
     "scripts": {
       "test:e2e:my-feature": "maestro test .maestro/flows/08-my-new-flow.yaml"
     }
   }
   ```

4. **Update comprehensive suite**:
   Add to `00-comprehensive-suite.yaml`:
   ```yaml
   - runFlow: 08-my-new-flow.yaml
   ```

### Adding testID Props

When adding new screens or components:

```tsx
export function MyScreen() {
  return (
    <View>
      <TextInput
        testID="my-input"
        placeholder="Enter value"
      />
      <Button
        testID="submit-button"
        onPress={handleSubmit}
      >
        Submit
      </Button>
    </View>
  );
}
```

### Writing Unit Tests

1. **Create test file**:
   ```bash
   touch src/services/__tests__/my-service.test.ts
   ```

2. **Write tests**:
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { myService } from '../my-service';

   describe('MyService', () => {
     it('should perform action', () => {
       const result = myService.doSomething();
       expect(result).toBeDefined();
     });
   });
   ```

## Best Practices

### E2E Testing

1. **Use testID props**: More reliable than text matching
2. **Wait for animations**: Use `waitForAnimationToEnd`
3. **Handle conditionals**: Use `runFlow` with `when` conditions
4. **Take screenshots**: Capture evidence for debugging
5. **Keep flows focused**: One feature per flow file
6. **Use helpers**: Create reusable flows (e.g., login)
7. **Tag appropriately**: Use tags for organizing tests
8. **Set timeouts**: Don't rely on default timeouts

### Unit Testing

1. **Mock external dependencies**: Use Vitest mocking
2. **Test edge cases**: Include error conditions
3. **Keep tests isolated**: No shared state between tests
4. **Use descriptive names**: Clear test descriptions
5. **Follow AAA pattern**: Arrange, Act, Assert

### Performance Testing

1. **Test on real devices**: Simulators don't reflect real performance
2. **Consistent environment**: Same device, OS version, network
3. **Warm up**: Run tests multiple times, measure average
4. **Monitor trends**: Track performance over time

## Troubleshooting

### Common Issues

#### Maestro CLI Not Found

```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Add to PATH
export PATH="$HOME/.maestro/bin:$PATH"

# Verify installation
maestro --version
```

#### App Not Launching

```bash
# Rebuild app
npm run ios -- --clean
npm run android -- --clean

# Check simulator/emulator is running
xcrun simctl list devices booted  # iOS
adb devices                        # Android
```

#### Element Not Found

1. Check element text is exact match
2. Add `timeout` to `assertVisible`
3. Use `testID` instead of text
4. Verify element is actually rendered
5. Check for loading states

#### GPS/Location Issues

For testing GPS features in simulator:

```bash
# iOS Simulator - Set custom location
xcrun simctl location <device-id> set 30.2672 -97.7431

# Android Emulator - Use extended controls
# Click "..." > Location > Set coordinates
```

#### Offline Mode Testing

```bash
# iOS - Use Network Link Conditioner
# Settings > Developer > Network Link Conditioner

# Android - Use emulator controls
adb shell svc wifi disable
adb shell svc wifi enable
```

### Getting Help

- **Maestro Docs**: https://maestro.mobile.dev/
- **Vitest Docs**: https://vitest.dev/
- **GitHub Issues**: Report bugs in this repository
- **Team Chat**: Ask in #mobile-testing channel

## Test Coverage Reports

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html
```

### Coverage Goals

Current targets:
- Overall: 70%
- Services: 80%
- Critical paths (location, offline queue): 90%

### Excluding from Coverage

Update `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    coverage: {
      exclude: [
        'src/components/**/*.tsx', // UI components
        '**/*.d.ts',                // Type definitions
        '**/index.ts',              // Barrel exports
      ],
    },
  },
});
```

## Continuous Improvement

### Adding New Test Scenarios

As the app evolves:

1. Add E2E tests for new features
2. Update existing tests for UI changes
3. Add regression tests for fixed bugs
4. Expand performance benchmarks

### Monitoring Test Health

- Track test flakiness
- Review test execution time
- Update tests for deprecated APIs
- Refactor slow or brittle tests

---

**Questions?** Contact the mobile team or open an issue.
