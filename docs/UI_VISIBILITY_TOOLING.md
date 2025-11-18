# UI Visibility Tooling for AI Agents

## Overview

This document describes the UI visibility tooling that enables AI agents to "see" and understand the user interface of Care Commons applications. These tools generate screenshots, visual regression tests, and comprehensive UI state reports to support better UX and design decisions.

## Purpose

AI agents need visibility into the UI to:

1. **Make informed UX decisions** - Understand current UI patterns and layouts
2. **Detect visual regressions** - Identify unintended UI changes
3. **Assess accessibility** - Review heading hierarchy, landmarks, and semantic structure
4. **Optimize user flows** - Analyze button placement, form structure, and navigation
5. **Ensure consistency** - Verify design system adherence across screens

## Tools

### 1. UI Screenshot Capture (`ui:capture`)

**Purpose**: Capture full-page screenshots of all major UI states across web, showcase, and mobile applications.

**Usage**:

```bash
# Capture all UIs (web, showcase, mobile)
npm run ui:capture

# Capture specific UIs
npm run ui:capture:web       # Web application only
npm run ui:capture:showcase  # Showcase only
npm run ui:capture:mobile    # Mobile views only

# Custom URLs
WEB_URL=http://localhost:4000 npm run ui:capture
SHOWCASE_URL=http://localhost:5173 npm run ui:capture:showcase
```

**Output**:

```
ui-screenshots/
├── README.md              # Documentation
├── metadata.json          # Capture metadata
├── web/                   # Web application screenshots
│   ├── authentication/
│   │   ├── login-page.png
│   │   └── login-page-mobile.png
│   ├── dashboard/
│   │   ├── coordinator-dashboard.png
│   │   └── coordinator-dashboard-tablet.png
│   ├── visits/
│   │   ├── visit-list.png
│   │   ├── schedule-visit.png
│   │   └── visit-calendar.png
│   ├── clients/
│   ├── caregivers/
│   └── care-plans/
├── showcase/              # Showcase screenshots
│   ├── showcase-home/
│   └── showcase-features/
└── mobile/               # Mobile screenshots
    ├── mobile-visits/
    └── mobile-evv/
```

**Features**:

- ✅ Multiple viewport sizes (desktop, tablet, mobile)
- ✅ Full-page screenshots with animations disabled
- ✅ Automatic navigation and interaction
- ✅ Metadata tracking (timestamp, URLs, captured states)
- ✅ Error handling and graceful failures

**Configuration**:

Screenshots are configured in `scripts/capture-ui-screenshots.ts`. Key configurations:

```typescript
// Web application states
const webUIStates: UIState[] = [
  {
    name: 'authentication',
    description: 'Login and authentication flows',
    screenshots: [
      {
        name: 'login-page',
        url: '/login',
        viewport: { width: 1920, height: 1080 },
        waitFor: 'networkidle',
      },
      // ... more screenshots
    ],
  },
  // ... more states
];
```

**Adding New Screenshots**:

1. Edit `scripts/capture-ui-screenshots.ts`
2. Add new UI state to appropriate array (`webUIStates`, `showcaseUIStates`, `mobileUIStates`)
3. Define screenshot configuration:
   ```typescript
   {
     name: 'my-new-screen',
     url: '/my-route',
     viewport: { width: 1920, height: 1080 },
     waitFor: 'networkidle', // or number in ms
     actions: async (page) => {
       // Optional: custom interactions
       await page.click('[data-testid="my-button"]');
     },
   }
   ```
4. Run `npm run ui:capture`

---

### 2. UI State Report Generator (`ui:report`)

**Purpose**: Generate comprehensive HTML reports with screenshots, DOM analysis, performance metrics, and accessibility information.

**Usage**:

```bash
# Generate full UI state report
npm run ui:report

# Custom base URL
WEB_URL=http://localhost:4000 npm run ui:report
```

**Output**:

```
ui-reports/
└── 2025-11-17/              # Date-stamped directory
    ├── index.html           # Interactive HTML report
    ├── report.json          # Machine-readable JSON report
    ├── Login.png
    ├── Dashboard.png
    ├── Visits-List.png
    └── ...
```

**Report Contents**:

For each UI state, the report includes:

1. **Screenshot**: Full-page capture
2. **Metadata**: URL, viewport, timestamp
3. **Performance Metrics**:
   - Load time
   - DOM node count
   - Resource count
4. **Page Structure**:
   - Headings hierarchy (H1-H6)
   - Landmarks (nav, main, aside, etc.)
   - Forms
   - Buttons
   - Links
   - Form inputs
5. **Key UI Elements**: Interactive and important elements with:
   - Tag name
   - ARIA role
   - Test ID
   - Text content
   - CSS classes

**Example HTML Report**:

![Example report showing screenshot, metrics, and structure analysis]

**Viewing Reports**:

```bash
# Open latest report
open ui-reports/$(ls -t ui-reports | head -1)/index.html

# macOS
open ui-reports/2025-11-17/index.html

# Linux
xdg-open ui-reports/2025-11-17/index.html

# Windows
start ui-reports/2025-11-17/index.html
```

**Adding New Pages to Report**:

Edit `scripts/generate-ui-state-report.ts`:

```typescript
const pages = [
  { name: 'Login', url: '/login' },
  { name: 'Dashboard', url: '/dashboard' },
  // Add new pages here:
  { name: 'My New Page', url: '/my-route' },
];
```

---

### 3. Visual Regression Testing

**Purpose**: Detect unintended UI changes by comparing screenshots against baseline images.

**Usage**:

```typescript
import { 
  comparePageSnapshot, 
  compareElementSnapshot,
  UIStates,
  Viewports,
} from '../utils/visual-regression.js';

test('visit list remains visually consistent', async ({ page }) => {
  await page.goto('/visits');
  
  // Compare full page against baseline
  await comparePageSnapshot(page, UIStates.VISIT_LIST, {
    maxDiffPixelRatio: 0.01, // 1% difference allowed
    fullPage: true,
  });
});

test('login form is visually correct', async ({ page }) => {
  await page.goto('/login');
  
  const loginForm = page.locator('[data-testid="login-form"]');
  
  // Compare specific element
  await compareElementSnapshot(loginForm, 'login-form', {
    maxDiffPixelRatio: 0.005, // 0.5% difference
  });
});

test('responsive dashboard across viewports', async ({ page }) => {
  for (const [name, viewport] of Object.entries(Viewports)) {
    await page.setViewportSize(viewport);
    await page.goto('/dashboard');
    
    await comparePageSnapshot(
      page,
      `dashboard-${name.toLowerCase()}`,
      { fullPage: true }
    );
  }
});
```

**Utilities**:

```typescript
// Pre-defined UI states
UIStates.LOGIN_PAGE
UIStates.COORDINATOR_DASHBOARD
UIStates.VISIT_LIST
UIStates.CLIENT_PROFILE
UIStates.EVV_CLOCK_IN
// ... and more

// Viewport presets
Viewports.DESKTOP         // 1920x1080
Viewports.LAPTOP          // 1366x768
Viewports.TABLET          // 768x1024 (iPad)
Viewports.MOBILE_IPHONE   // 375x667 (iPhone SE)
Viewports.MOBILE_ANDROID  // 360x640

// Helper functions
await waitForUIStable(page);              // Wait for network idle + animations
const masks = getCommonMasks(page);       // Mask dynamic content
await configurePageForScreenshot(page);   // Disable animations, scrollbars
```

**Generating Baselines**:

```typescript
import { captureBaseline } from '../utils/visual-regression.js';

test('generate baseline for new screen', async ({ page }) => {
  await page.goto('/my-new-screen');
  await captureBaseline(page, 'my-new-screen', true);
});
```

**Baseline Management**:

```bash
# Update baselines (when intentional changes are made)
npm run test:e2e -- --update-snapshots

# Update specific test
npm run test:e2e -- --update-snapshots -g "visit list"

# View visual diff report
npm run test:e2e:report
```

---

## Workflows

### AI Agent UI Review Workflow

When making UX decisions, AI agents should:

1. **Capture current state**:
   ```bash
   npm run ui:capture
   ```

2. **Generate report** for detailed analysis:
   ```bash
   npm run ui:report
   open ui-reports/$(ls -t ui-reports | head -1)/index.html
   ```

3. **Review screenshots** and structure:
   - Check heading hierarchy
   - Verify landmark usage
   - Assess button/link placement
   - Review form structure
   - Evaluate visual hierarchy

4. **Make informed decisions** based on:
   - Current UI patterns
   - Consistency with existing screens
   - Accessibility best practices
   - Responsive design considerations

5. **Implement changes** with confidence

6. **Verify with visual regression**:
   ```typescript
   test('my changes maintain visual consistency', async ({ page }) => {
     await comparePageSnapshot(page, 'my-updated-screen');
   });
   ```

### Before Implementing New Features

1. **Capture existing UI**:
   ```bash
   npm run ui:capture
   ```

2. **Review related screens** for patterns to follow

3. **Check accessibility structure** in the report

4. **Implement feature** following established patterns

5. **Capture updated UI**:
   ```bash
   npm run ui:capture
   ```

6. **Compare** old vs. new screenshots

7. **Update baselines** if intentional:
   ```bash
   npm run test:e2e -- --update-snapshots
   ```

### Detecting Regressions

1. **Run visual tests** in CI/CD:
   ```yaml
   # .github/workflows/ci.yml
   - name: Visual Regression Tests
     run: npm run test:e2e
   ```

2. **Review failures** in test report:
   ```bash
   npm run test:e2e:report
   ```

3. **Investigate diffs** in visual comparison

4. **Fix unintended changes** or **update baselines** if intentional

---

## Best Practices

### Screenshot Capture

✅ **Do**:
- Capture at multiple viewport sizes
- Wait for network idle before screenshot
- Disable animations for consistency
- Include key user flows
- Update screenshots regularly

❌ **Don't**:
- Capture during loading states
- Include time-dependent content without masking
- Forget to seed test data first
- Screenshot error states without context

### Visual Regression

✅ **Do**:
- Set appropriate diff thresholds (0.5-1% for strict, 1-2% for lenient)
- Mask dynamic content (timestamps, avatars, live data)
- Test across multiple viewports
- Update baselines intentionally
- Document why baselines changed

❌ **Don't**:
- Set thresholds too high (defeats purpose)
- Compare against stale baselines
- Ignore failing tests
- Skip CI visual tests
- Update baselines without review

### UI State Reports

✅ **Do**:
- Generate before major changes
- Review heading hierarchy
- Check landmark structure
- Verify accessible names
- Compare performance metrics

❌ **Don't**:
- Ignore accessibility findings
- Skip semantic HTML review
- Overlook heading jumps
- Dismiss performance issues

---

## Troubleshooting

### Screenshots are blank

**Cause**: Page didn't load before screenshot

**Fix**:
```typescript
waitFor: 'networkidle',  // or longer timeout
// or
waitFor: 5000,  // milliseconds
```

### Visual tests always fail

**Cause**: Dynamic content changing between runs

**Fix**:
```typescript
const masks = getCommonMasks(page);
await comparePageSnapshot(page, 'my-page', { mask: masks });
```

### Report generation times out

**Cause**: Page taking too long to load

**Fix**:
```typescript
// Increase timeout in script
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
```

### Can't find UI elements in report

**Cause**: Elements are dynamically rendered or behind authentication

**Fix**:
1. Ensure proper test data seeding
2. Add authentication to script
3. Wait for elements to appear:
   ```typescript
   await page.waitForSelector('[data-testid="my-element"]');
   ```

---

## Integration with CI/CD

### GitHub Actions

Add to `.github/workflows/ci.yml`:

```yaml
jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run visual regression tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-test-results
          path: |
            playwright-report/
            test-results/
          retention-days: 7
```

---

## Architecture

### Screenshot Capture Architecture

```
┌─────────────────────────────────────────────────────┐
│  capture-ui-screenshots.ts                          │
│  ┌───────────────────────────────────────────────┐  │
│  │ 1. Launch Playwright browser                  │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ 2. For each UI state:                         │  │
│  │    - Set viewport size                        │  │
│  │    - Navigate to URL                          │  │
│  │    - Wait for stable state                    │  │
│  │    - Execute custom actions (optional)        │  │
│  │    - Capture full-page screenshot             │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ 3. Generate metadata.json                     │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ 4. Generate README.md                         │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↓
            ui-screenshots/
            ├── web/
            ├── showcase/
            └── mobile/
```

### UI State Report Architecture

```
┌─────────────────────────────────────────────────────┐
│  generate-ui-state-report.ts                        │
│  ┌───────────────────────────────────────────────┐  │
│  │ 1. Launch Playwright browser                  │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ 2. For each page:                             │  │
│  │    - Navigate to URL                          │  │
│  │    - Analyze DOM structure                    │  │
│  │    - Extract performance metrics              │  │
│  │    - Extract key UI elements                  │  │
│  │    - Capture screenshot                       │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ 3. Generate HTML report                       │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ 4. Generate JSON report                       │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↓
            ui-reports/YYYY-MM-DD/
            ├── index.html
            ├── report.json
            └── screenshots/
```

### Visual Regression Architecture

```
┌─────────────────────────────────────────────────────┐
│  Playwright Test                                    │
│  ┌───────────────────────────────────────────────┐  │
│  │ 1. Navigate to page                           │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ 2. Configure for screenshot:                  │  │
│  │    - Disable animations                       │  │
│  │    - Hide scrollbars                          │  │
│  │    - Mask dynamic content                     │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ 3. Compare against baseline:                  │  │
│  │    - Take screenshot                          │  │
│  │    - Pixel-by-pixel comparison                │  │
│  │    - Generate diff image if different         │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↓
            ✅ Pass: No visual changes
            ❌ Fail: Visual differences detected
                    ↓
            playwright-report/
            └── visual-diff-XXXXX.png
```

---

## Future Enhancements

### Planned

- [ ] **Accessibility auditing** with axe-core integration
- [ ] **Component library screenshots** for design system
- [ ] **Mobile app screenshots** via Detox/Appium
- [ ] **Multi-state comparisons** (before/after in single view)
- [ ] **Annotated screenshots** with UI element labels
- [ ] **Video capture** of user flows
- [ ] **Lighthouse integration** for performance/accessibility scores

### Ideas

- AI-powered UI analysis (detect inconsistencies, suggest improvements)
- Automated design token extraction
- Cross-browser visual comparison
- Historical trend tracking (performance over time)

---

## Resources

- [Playwright Screenshot Testing](https://playwright.dev/docs/screenshots)
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Responsive Design Best Practices](https://web.dev/responsive-web-design-basics/)

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
