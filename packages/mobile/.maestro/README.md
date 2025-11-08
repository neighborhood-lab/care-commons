# Maestro E2E Tests

This directory contains end-to-end test flows for the Care Commons mobile app using [Maestro](https://maestro.mobile.dev/).

## Directory Structure

```
.maestro/
├── config.yaml                          # Global configuration
├── flows/                               # Test flows
│   ├── 00-comprehensive-suite.yaml      # Full test suite
│   ├── 01-login.yaml                    # Login tests
│   ├── 02-clock-in.yaml                 # Clock-in with GPS
│   ├── 03-task-completion.yaml          # Task completion
│   ├── 04-visit-documentation.yaml      # Documentation
│   ├── 05-offline-mode.yaml             # Offline sync
│   ├── 06-visual-regression.yaml        # Screenshot capture
│   ├── 07-performance.yaml              # Performance tests
│   └── helpers/
│       └── login.yaml                   # Reusable login flow
├── screenshots/                         # Test screenshots (generated)
├── visual-regression/                   # Visual test screenshots (generated)
└── README.md                            # This file
```

## Quick Start

### Prerequisites

1. **Install Maestro CLI**:
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   export PATH="$HOME/.maestro/bin:$PATH"
   ```

2. **Start simulator/emulator**:
   ```bash
   # iOS
   npm run ios

   # Android
   npm run android
   ```

### Running Tests

```bash
# Run all tests
maestro test .maestro/flows/00-comprehensive-suite.yaml

# Run specific test
maestro test .maestro/flows/01-login.yaml

# Run with JUnit report
maestro test .maestro/flows/00-comprehensive-suite.yaml \
  --format junit \
  --output test-results/maestro-report.xml

# Run on specific platform
maestro test --platform ios .maestro/flows/00-comprehensive-suite.yaml
maestro test --platform android .maestro/flows/00-comprehensive-suite.yaml
```

## Test Flows Overview

### 01-login.yaml
**Critical workflow testing**

Tests:
- Successful login with email/password
- Login with invalid credentials
- Empty field validation
- Biometric prompt handling
- Onboarding flow

Success Criteria:
- Login completes within 10 seconds
- Error messages display correctly
- Navigation to home screen works

### 02-clock-in.yaml
**EVV compliance testing**

Tests:
- GPS location acquisition
- Geofence verification
- Pre-flight checks (GPS accuracy, battery, mock location)
- Photo capture (optional)
- Clock-in submission
- Offline queue handling

Success Criteria:
- GPS acquired within 15 seconds
- Geofence validation works
- Offline queuing functional
- All pre-flight checks execute

### 03-task-completion.yaml
**ADL/IADL task management**

Tests:
- Task list display
- Task selection and modal opening
- Adding completion notes
- Photo documentation
- Marking tasks complete
- Skipping tasks
- Progress tracking

Success Criteria:
- All task categories display
- Required tasks enforce notes
- Progress updates correctly

### 04-visit-documentation.yaml
**Visit documentation and check-out**

Tests:
- Visit details display
- Adding visit notes
- Signature capture
- Visit check-out
- GPS verification at check-out

Success Criteria:
- Documentation saves correctly
- Check-out completes successfully

### 05-offline-mode.yaml
**Offline resilience testing**

Tests:
- Offline mode activation
- Actions while offline (clock-in, tasks)
- Offline queue visibility
- Connectivity restoration
- Automatic sync

Success Criteria:
- Actions queue when offline
- Sync completes when online
- No data loss

### 06-visual-regression.yaml
**UI consistency testing**

Captures screenshots of:
- Login screen
- Home/schedule screen
- Visits list
- Visit details
- Clock-in screen
- Tasks screen
- Profile screen
- Visit history
- Dark mode (if supported)

Success Criteria:
- All screenshots capture successfully
- Visual diffs detect UI changes

### 07-performance.yaml
**Performance benchmarking**

Measures:
- Cold start time (< 5s target)
- Warm start time (< 3s target)
- Login duration (< 10s target)
- GPS acquisition (< 15s target)
- Screen transitions (< 2s each)
- Database queries

Success Criteria:
- All metrics meet targets
- No performance regressions

## Configuration

### Environment Variables

Set in `config.yaml`:

```yaml
env:
  TEST_EMAIL: "caregiver@test.carecommons.org"
  TEST_PASSWORD: "TestPassword123!"
  CLIENT_NAME: "Dorothy Chen"
  DEFAULT_TIMEOUT: 30000
  GPS_ACQUISITION_TIMEOUT: 15000
```

Override in specific flows:

```yaml
env:
  MY_VAR: "custom-value"
```

### Tags

Organize tests with tags:

```yaml
tags:
  - login
  - critical
  - smoke
```

Run tests by tag:

```bash
maestro test --include-tags critical .maestro/flows/
```

## Writing Tests

### Basic Flow Structure

```yaml
appId: com.carecommons.mobile
tags:
  - my-feature
---

# Test steps
- launchApp:
    clearState: true

- assertVisible: "Text"
- tapOn: "Button"
- inputText: "Input value"
- takeScreenshot: screenshot-name
```

### Best Practices

1. **Use testID props** for reliable element selection:
   ```yaml
   - tapOn:
       id: "login-button"
   ```

2. **Add timeouts** for async operations:
   ```yaml
   - assertVisible:
       text: "Loading complete"
       timeout: 10000
   ```

3. **Handle conditionals** for optional UI:
   ```yaml
   - runFlow:
       when:
         visible: "Dialog"
       commands:
         - tapOn: "OK"
   ```

4. **Wait for animations**:
   ```yaml
   - waitForAnimationToEnd
   ```

5. **Take screenshots** for debugging:
   ```yaml
   - takeScreenshot: step-name
   ```

6. **Use reusable flows**:
   ```yaml
   - runFlow: helpers/login.yaml
   ```

### Common Patterns

#### Login Flow
```yaml
- runFlow: helpers/login.yaml
```

#### Navigate to Screen
```yaml
- tapOn: "Tab Name"
- waitForAnimationToEnd
- assertVisible: "Screen Title"
```

#### Fill Form
```yaml
- tapOn: "Input field"
- inputText: "${ENV_VAR}"
- tapOn: "Submit"
```

#### Handle Alerts
```yaml
- assertVisible: "Alert Message"
- tapOn: "OK"
```

## Debugging Tests

### Run in Debug Mode

```bash
maestro test --debug .maestro/flows/01-login.yaml
```

### View Logs

```bash
maestro test --verbose .maestro/flows/01-login.yaml
```

### Screenshot on Failure

Screenshots are automatically captured on test failures.

### Interactive Mode

```bash
maestro studio
```

Opens interactive recorder to create/debug flows.

## CI/CD Integration

Tests run automatically in GitHub Actions:

- **iOS**: macOS-14 runner with iOS Simulator
- **Android**: Ubuntu runner with Android Emulator

Workflow file: `.github/workflows/mobile-e2e.yml`

### Triggers

- Pull requests affecting mobile code
- Pushes to main branches
- Manual dispatch

### Artifacts

- Test reports (JUnit XML)
- Screenshots
- Visual regression images

## Troubleshooting

### Maestro Not Found

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
export PATH="$HOME/.maestro/bin:$PATH"
```

### App Not Building

```bash
npm run ios -- --clean
npm run android -- --clean
```

### Element Not Found

1. Add timeout: `timeout: 10000`
2. Use testID: `id: "element-id"`
3. Check element is rendered
4. Verify text is exact match

### Flaky Tests

1. Add `waitForAnimationToEnd`
2. Increase timeouts
3. Handle conditional UI
4. Check for loading states

### GPS Issues in Simulator

```bash
# iOS - Set location
xcrun simctl location <device-id> set 30.2672 -97.7431

# Android - Use extended controls
# Click "..." > Location > Set coordinates
```

## Resources

- [Maestro Documentation](https://maestro.mobile.dev/)
- [Main Testing Guide](../TESTING.md)
- [Maestro Examples](https://github.com/mobile-dev-inc/maestro/tree/main/examples)
- [Maestro CLI Reference](https://maestro.mobile.dev/cli/overview)

## Support

For questions or issues:
- Open a GitHub issue
- Contact the mobile team
- Check the troubleshooting guide

---

**Happy Testing!** 🧪
