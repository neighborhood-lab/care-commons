# UI Visibility Tooling - Quick Start

This directory contains tooling that enables AI agents to "see" and understand the Care Commons user interface.

## What's Included

### 1. Screenshot Capture (`scripts/capture-ui-screenshots.ts`)
Captures full-page screenshots of all UI states across web, showcase, and mobile applications.

```bash
npm run ui:capture              # All UIs
npm run ui:capture:web          # Web only
npm run ui:capture:showcase     # Showcase only
npm run ui:capture:mobile       # Mobile only
```

**Output**: `ui-screenshots/` with organized screenshots by application and state.

### 2. UI State Report Generator (`scripts/generate-ui-state-report.ts`)
Generates comprehensive HTML reports with screenshots, DOM analysis, performance metrics, and accessibility information.

```bash
npm run ui:report               # Generate full report
```

**Output**: `ui-reports/YYYY-MM-DD/index.html` - Interactive HTML report with all UI states.

### 3. Visual Regression Testing (`e2e/utils/visual-regression.ts`)
Utilities for detecting unintended UI changes through screenshot comparison.

```typescript
import { comparePageSnapshot, UIStates } from '../utils/visual-regression.js';

test('login page remains consistent', async ({ page }) => {
  await page.goto('/login');
  await comparePageSnapshot(page, UIStates.LOGIN_PAGE);
});
```

**Usage**: Run tests with `npm run test:e2e`

## Quick Examples

### Capture All UI Screenshots

```bash
# Make sure dev servers are running
npm run dev:web      # Terminal 1
npm run dev:showcase # Terminal 2

# Capture screenshots
npm run ui:capture
```

Screenshots saved to `ui-screenshots/`:
```
ui-screenshots/
├── web/
│   ├── authentication/login-page.png
│   ├── dashboard/coordinator-dashboard.png
│   └── visits/visit-list.png
├── showcase/
│   └── showcase-home/landing-desktop.png
└── mobile/
    └── mobile-visits/mobile-visit-list.png
```

### Generate UI State Report

```bash
# Make sure web server is running
npm run dev:web

# Generate report
npm run ui:report

# Open report
open ui-reports/$(ls -t ui-reports | head -1)/index.html
```

### Run Visual Regression Tests

```bash
# Run all visual tests
npm run test:e2e -- visual-regression.spec.ts

# Update baselines (when UI changes are intentional)
npm run test:e2e -- visual-regression.spec.ts --update-snapshots

# View test report
npm run test:e2e:report
```

## When to Use Each Tool

### Screenshot Capture
**Use when**:
- Starting work on a new feature
- Documenting current UI state
- Comparing before/after changes
- Creating design documentation

**Example**: Before implementing a new dashboard widget, capture the current dashboard to understand existing patterns.

### UI State Report
**Use when**:
- Reviewing page structure and accessibility
- Analyzing performance metrics
- Understanding component hierarchy
- Planning UI refactoring

**Example**: Generate a report to review heading structure and landmark usage before implementing accessibility improvements.

### Visual Regression Tests
**Use when**:
- Detecting unintended UI changes
- Ensuring cross-browser consistency
- Verifying responsive design
- Preventing visual regressions in CI/CD

**Example**: Add visual tests for critical screens like login, dashboard, and visit management to catch regressions in pull requests.

## AI Agent Workflow

When making UX/design decisions:

1. **Understand Current State**
   ```bash
   npm run ui:capture
   npm run ui:report
   ```

2. **Review Screenshots and Structure**
   - Check heading hierarchy
   - Verify landmark usage
   - Assess button/link placement
   - Review form structure

3. **Make Informed Decisions**
   - Follow existing patterns
   - Maintain consistency
   - Ensure accessibility
   - Consider responsive design

4. **Implement Changes**
   - Write code based on insights
   - Follow established patterns

5. **Verify Changes**
   ```bash
   npm run ui:capture  # Compare new vs. old
   npm run test:e2e -- visual-regression.spec.ts --update-snapshots
   ```

## Directory Structure

```
.
├── scripts/
│   ├── capture-ui-screenshots.ts      # Screenshot capture tool
│   └── generate-ui-state-report.ts    # UI state report generator
├── e2e/
│   ├── utils/
│   │   └── visual-regression.ts       # Visual regression utilities
│   └── tests/
│       └── visual-regression.spec.ts  # Example visual tests
├── ui-screenshots/                     # Generated screenshots (gitignored)
│   ├── web/
│   ├── showcase/
│   └── mobile/
├── ui-reports/                         # Generated reports (gitignored)
│   └── YYYY-MM-DD/
│       ├── index.html
│       └── report.json
└── docs/
    └── UI_VISIBILITY_TOOLING.md       # Comprehensive documentation
```

## Troubleshooting

### "Cannot connect to localhost:3000"
**Solution**: Make sure the dev server is running:
```bash
npm run dev:web
```

### "Screenshots are blank"
**Solution**: Increase wait time in the script or ensure the page loads properly.

### "Visual tests always fail"
**Solution**: Update baselines if UI changes are intentional:
```bash
npm run test:e2e -- --update-snapshots
```

### "Report shows no elements"
**Solution**: Ensure you're authenticated if the page requires it, or seed test data.

## Configuration

### Custom URLs
```bash
# Use custom URLs for capture
WEB_URL=http://localhost:4000 npm run ui:capture
SHOWCASE_URL=http://localhost:5174 npm run ui:capture:showcase
```

### Add New Screenshots
Edit `scripts/capture-ui-screenshots.ts` and add to the appropriate array:

```typescript
const webUIStates: UIState[] = [
  // ... existing states
  {
    name: 'my-new-screen',
    description: 'Description of the screen',
    screenshots: [
      {
        name: 'my-screenshot',
        url: '/my-route',
        viewport: { width: 1920, height: 1080 },
        waitFor: 'networkidle',
      },
    ],
  },
];
```

### Add New Report Pages
Edit `scripts/generate-ui-state-report.ts`:

```typescript
const pages = [
  // ... existing pages
  { name: 'My Page', url: '/my-route' },
];
```

### Add Visual Regression Tests
Create tests in `e2e/tests/visual-regression.spec.ts`:

```typescript
test('my page should match baseline', async ({ page }) => {
  await page.goto('/my-route');
  await waitForUIStable(page);
  await comparePageSnapshot(page, 'my-page', {
    maxDiffPixelRatio: 0.01,
    fullPage: true,
  });
});
```

## Resources

- **Full Documentation**: `docs/UI_VISIBILITY_TOOLING.md`
- **Playwright Docs**: https://playwright.dev/docs/screenshots
- **E2E Testing Guide**: `e2e/README.md`

## Contributing

When adding new UI visibility features:

1. Update the appropriate script in `scripts/`
2. Add examples to `e2e/tests/visual-regression.spec.ts`
3. Update documentation in `docs/UI_VISIBILITY_TOOLING.md`
4. Test with `npm run ui:capture` and `npm run ui:report`

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
