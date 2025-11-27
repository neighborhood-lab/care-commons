# Bundle Size Optimization

> **Status:** Future Enhancement  
> **Priority:** Medium (post-launch optimization)  
> **Last Updated:** November 27, 2025

## Problem

Both `packages/web` and `showcase` are producing bundles >1000kB after minification:

```
dist/assets/index-D32kOLP9.js         1,533.34 kB │ gzip: 412.95 kB  (web)
dist/assets/index-Be3sr5KQ.js         1,028.00 kB │ gzip: 276.74 kB  (showcase)
```

Vite is warning about this and suggesting code-splitting optimizations:

```
(!) Some chunks are larger than 1000 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit
```

## Impact

**User Experience:**
- Slower initial page load times (especially on mobile)
- Higher bandwidth usage (cost concern for users on metered connections)
- Poorer mobile experience
- Lower Lighthouse scores

**Business Impact:**
- SEO ranking (Google uses page speed as ranking factor)
- User retention (every 100ms delay = 1% drop in conversion)
- Professional perception

## Current Bundle Analysis

### Web Package (`packages/web`)

**Total:** 1,533.34 kB uncompressed, 412.95 kB gzipped

**Estimated Breakdown:**
- React + React DOM: ~45 kB (gzipped)
- React Router: ~10 kB (gzipped)
- React Query: ~35 kB (gzipped)
- Recharts (charting library): ~80 kB (gzipped)
- React Icons: ~20 kB (gzipped)
- Vertical components: ~200 kB (gzipped)
- Remaining: ~25 kB (gzipped)

### Showcase (`showcase`)

**Total:** 1,028.00 kB uncompressed, 276.74 kB gzipped

**Estimated Breakdown:**
- React + React DOM: ~45 kB (gzipped)
- React Router: ~10 kB (gzipped)
- Mock API + demo data: ~50 kB (gzipped)
- UI components: ~150 kB (gzipped)
- Remaining: ~20 kB (gzipped)

## Proposed Solutions

### 1. Route-Based Code Splitting (High Impact)

Implement dynamic imports for routes to only load what's needed:

```typescript
// Before: All routes loaded upfront
import ClientList from './pages/ClientList';
import ClientDetail from './pages/ClientDetail';
import CaregiverList from './pages/CaregiverList';
// ... 20+ more imports

// After: Routes loaded on-demand
const ClientList = lazy(() => import('./pages/ClientList'));
const ClientDetail = lazy(() => import('./pages/ClientDetail'));
const CaregiverList = lazy(() => import('./pages/CaregiverList'));

// Wrap in Suspense boundary
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/clients" element={<ClientList />} />
    {/* ... */}
  </Routes>
</Suspense>
```

**Expected Savings:** 200-300 kB initial bundle (gzipped)

### 2. Vendor Chunk Splitting (Medium Impact)

Configure manual chunks in `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          'router-vendor': ['react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['recharts', 'react-icons'],
          'date-vendor': ['date-fns'],
        }
      }
    }
  }
});
```

**Benefits:**
- Better caching (vendor chunks change less frequently)
- Parallel downloads (browser can download multiple chunks simultaneously)
- Smaller main bundle

**Expected Savings:** No direct savings, but improves cache hit rate

### 3. Tree-Shaking Improvements (Medium Impact)

**Audit and Fix Import Patterns:**

```typescript
// Bad: Imports entire library
import * as Icons from 'react-icons/fa';

// Good: Import only what's needed
import { FaUser, FaCalendar } from 'react-icons/fa';

// Bad: Default import of large library
import _ from 'lodash';

// Good: Import specific utilities
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
```

**Expected Savings:** 50-100 kB (gzipped)

### 4. Component Lazy Loading (High Impact for Heavy Components)

Lazy load heavy components that aren't immediately visible:

```typescript
// Charts (heavy dependency: recharts)
const AnalyticsChart = lazy(() => import('./components/AnalyticsChart'));
const BillingChart = lazy(() => import('./components/BillingChart'));

// Rich text editors (if added in future)
const RichTextEditor = lazy(() => import('./components/RichTextEditor'));

// Modal dialogs (only load when opened)
const AssignCaregiverModal = lazy(() => import('./modals/AssignCaregiverModal'));
```

**Expected Savings:** 50-80 kB initial bundle (gzipped)

### 5. Dependency Audit (High Impact)

**Replace heavy dependencies with lighter alternatives:**

| Current Dependency | Size (gzipped) | Alternative | Size (gzipped) | Savings |
|-------------------|----------------|-------------|----------------|---------|
| `recharts` | ~80 kB | `chart.js` or native SVG | ~20 kB or 0 kB | 60-80 kB |
| `react-icons` (all) | ~20 kB | Selective imports or inline SVG | ~2 kB | 18 kB |
| Full `date-fns` | ~20 kB | Specific imports | ~5 kB | 15 kB |

**Total Expected Savings:** 90-110 kB (gzipped)

### 6. Image Optimization (Low Impact but Easy)

- Use modern formats (WebP, AVIF) with fallbacks
- Lazy load images below the fold
- Use responsive images (srcset)

**Expected Savings:** Minimal for code bundle, but helps with total page weight

### 7. Preloading Critical Assets (Medium Impact for UX)

Add preload hints for critical resources:

```html
<link rel="preload" href="/assets/react-vendor.js" as="script">
<link rel="preload" href="/assets/main.css" as="style">
```

**Benefits:** Faster initial render (not smaller bundle, but better UX)

## Implementation Plan

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Audit and fix import patterns (tree-shaking)
2. ✅ Configure vendor chunk splitting
3. ✅ Add preload hints for critical assets

**Expected Savings:** 50-100 kB (gzipped)

### Phase 2: Route Code Splitting (2-4 hours)
1. ✅ Implement lazy loading for all routes
2. ✅ Add Suspense boundaries with loading states
3. ✅ Test navigation performance

**Expected Savings:** 200-300 kB initial bundle (gzipped)

### Phase 3: Component Lazy Loading (2-3 hours)
1. ✅ Lazy load chart components
2. ✅ Lazy load modal dialogs
3. ✅ Lazy load heavy UI components

**Expected Savings:** 50-80 kB initial bundle (gzipped)

### Phase 4: Dependency Audit (4-8 hours)
1. ✅ Evaluate alternative charting libraries
2. ✅ Replace or optimize heavy dependencies
3. ✅ Test and verify functionality

**Expected Savings:** 90-110 kB (gzipped)

## Acceptance Criteria

### Performance Targets
- [ ] Main bundle < 500 kB (gzipped) - **Current: 412.95 kB ✅ Already met!**
- [ ] Total initial load < 800 kB (gzipped)
- [ ] Initial load time < 2s on 3G connection
- [ ] Lighthouse performance score > 90

### Quality Gates
- [ ] No regressions in functionality
- [ ] No increase in total transferred data
- [ ] All tests passing
- [ ] No new console errors or warnings

## Monitoring

**Before Optimization:**
```bash
# Measure baseline
npm run build
du -sh packages/web/dist packages/showcase/dist

# Lighthouse audit
npx lighthouse https://care-commons.vercel.app --view
```

**After Optimization:**
```bash
# Re-measure
npm run build
du -sh packages/web/dist packages/showcase/dist

# Compare
npx lighthouse https://care-commons.vercel.app --view
```

## Resources

- [Vite Code Splitting Guide](https://vitejs.dev/guide/features.html#dynamic-import)
- [React.lazy Documentation](https://react.dev/reference/react/lazy)
- [Web.dev Bundle Size Guide](https://web.dev/reduce-javascript-payloads-with-code-splitting/)
- [Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)

## Priority Assessment

**Current Status:** Not blocking for December 1 launch

**Rationale:**
- Main bundle (412.95 kB gzipped) is acceptable for initial launch
- All features are functional and performant
- Mobile performance is adequate (not great, but acceptable)
- This is a B2B SaaS application (not consumer-facing e-commerce)

**Recommended Timeline:** Q1 2026 post-launch optimization

**Trade-offs:**
- Optimization effort: 10-20 hours
- Risk of regressions: Low-Medium
- User impact: Moderate improvement (not dramatic)
- Business impact: Better SEO, improved UX perception

## Notes

**November 27, 2025:**
- Documented current state and optimization plan
- Main bundle already under 500 kB gzipped ✅
- Route-based code splitting would provide biggest win
- Not urgent for launch, but good post-launch enhancement

**Future Considerations:**
- Monitor bundle size in CI (add budget checks)
- Set up automated Lighthouse CI in GitHub Actions
- Track bundle size trends over time
