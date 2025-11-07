import { test, expect } from '../fixtures/auth.fixture.js';
import { TestDatabase } from '../setup/test-database.js';

/**
 * Performance Tests
 *
 * Tests system performance under various conditions:
 * 1. Page Load Times
 * 2. Large Dataset Rendering
 * 3. Concurrent User Load
 */
test.describe('Performance Tests', () => {
  test.beforeAll(async () => {
    await TestDatabase.setup();
  });

  test.afterAll(async () => {
    await TestDatabase.teardown();
  });

  test.beforeEach(async () => {
    await TestDatabase.cleanup();
  });

  test('Page Load Times: visit list should load within 3 seconds', async ({
    authenticatedPage,
  }) => {
    const startTime = Date.now();

    await authenticatedPage.goto('/visits');
    await authenticatedPage.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Assert page loads within 3 seconds
    expect(loadTime).toBeLessThan(3000);

    // Verify page is interactive
    const visitList = authenticatedPage.locator('[data-testid="visit-list"]');
    await expect(visitList).toBeVisible();
  });

  test('Page Load Times: measure Largest Contentful Paint (LCP)', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits');
    await authenticatedPage.waitForLoadState('networkidle');

    // Measure LCP using Performance API
    const lcp = await authenticatedPage.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          resolve(lastEntry.renderTime || lastEntry.loadTime);
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // Timeout after 5 seconds
        setTimeout(() => resolve(0), 5000);
      });
    });

    // LCP should be under 2.5 seconds for good performance
    expect(lcp).toBeLessThan(2500);
  });

  test('Page Load Times: measure First Contentful Paint (FCP)', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits');

    const fcp = await authenticatedPage.evaluate(() => {
      const perfEntries = performance.getEntriesByType('paint');
      const fcpEntry = perfEntries.find((entry) => entry.name === 'first-contentful-paint');
      return fcpEntry ? fcpEntry.startTime : 0;
    });

    // FCP should be under 1.8 seconds for good performance
    expect(fcp).toBeGreaterThan(0);
    expect(fcp).toBeLessThan(1800);
  });

  test('Page Load Times: measure Cumulative Layout Shift (CLS)', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits');
    await authenticatedPage.waitForLoadState('networkidle');

    // Wait a bit for any late layout shifts
    await authenticatedPage.waitForTimeout(2000);

    const cls = await authenticatedPage.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ((entry as any).hadRecentInput) continue;
            clsValue += (entry as any).value;
          }
        });

        observer.observe({ entryTypes: ['layout-shift'] });

        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 2000);
      });
    });

    // CLS should be under 0.1 for good performance
    expect(cls).toBeLessThan(0.1);
  });

  test('Page Load Times: measure Time to Interactive (TTI)', async ({
    authenticatedPage,
  }) => {
    const startTime = Date.now();

    await authenticatedPage.goto('/visits');

    // Wait for page to be fully interactive
    await authenticatedPage.waitForLoadState('networkidle');

    // Try to interact with page
    const button = authenticatedPage.getByRole('button').first();
    await button.waitFor({ state: 'visible' });

    const tti = Date.now() - startTime;

    // TTI should be under 3.8 seconds for good performance
    expect(tti).toBeLessThan(3800);
  });

  test('Large Dataset Rendering: load page with 100+ visits', async ({
    authenticatedPage,
  }) => {
    // Seed database with 100+ visits
    await TestDatabase.seed('large-visit-dataset');

    const startTime = Date.now();

    await authenticatedPage.goto('/visits');
    await authenticatedPage.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should still load within reasonable time
    expect(loadTime).toBeLessThan(5000);

    // Verify pagination or virtualization working
    const visitItems = authenticatedPage.locator('[data-testid="visit-card"]');
    const visibleCount = await visitItems.count();

    // Should not render all 100+ at once (pagination/virtualization)
    expect(visibleCount).toBeLessThanOrEqual(50);

    // Verify page numbers or "load more" button exists
    const pagination = authenticatedPage.locator('[data-testid="pagination"]');
    const loadMore = authenticatedPage.locator('[data-testid="load-more"]');

    const hasPagination = await pagination.isVisible({ timeout: 1000 }).catch(() => false);
    const hasLoadMore = await loadMore.isVisible({ timeout: 1000 }).catch(() => false);

    expect(hasPagination || hasLoadMore).toBe(true);
  });

  test('Large Dataset Rendering: scrolling should be smooth with virtualization', async ({
    authenticatedPage,
  }) => {
    await TestDatabase.seed('large-visit-dataset');

    await authenticatedPage.goto('/visits');
    await authenticatedPage.waitForLoadState('networkidle');

    // Measure scroll performance
    const scrollPerformance = await authenticatedPage.evaluate(() => {
      return new Promise<{ avgFrameTime: number; droppedFrames: number }>((resolve) => {
        const frameTimes: number[] = [];
        let lastTime = performance.now();
        let droppedFrames = 0;

        const measureFrame = () => {
          const currentTime = performance.now();
          const frameTime = currentTime - lastTime;
          frameTimes.push(frameTime);

          // Frame dropped if > 16.67ms (60fps threshold)
          if (frameTime > 16.67) {
            droppedFrames++;
          }

          lastTime = currentTime;

          if (frameTimes.length < 60) {
            requestAnimationFrame(measureFrame);
          } else {
            const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
            resolve({ avgFrameTime, droppedFrames });
          }
        };

        // Scroll to trigger rendering
        window.scrollTo({ top: 1000, behavior: 'smooth' });

        requestAnimationFrame(measureFrame);
      });
    });

    // Average frame time should be close to 16.67ms (60fps)
    expect(scrollPerformance.avgFrameTime).toBeLessThan(20);

    // Should have minimal dropped frames
    expect(scrollPerformance.droppedFrames).toBeLessThan(10);
  });

  test('Large Dataset Rendering: verify no browser freeze', async ({
    authenticatedPage,
  }) => {
    await TestDatabase.seed('large-visit-dataset');

    await authenticatedPage.goto('/visits');
    await authenticatedPage.waitForLoadState('networkidle');

    // Try to interact during/after load
    const searchInput = authenticatedPage.getByPlaceholder(/search/i);
    const searchExists = await searchInput.isVisible({ timeout: 2000 }).catch(() => false);

    if (searchExists) {
      // Type should be responsive
      const startTime = Date.now();
      await searchInput.fill('test');
      const typeTime = Date.now() - startTime;

      // Typing should be responsive (< 100ms)
      expect(typeTime).toBeLessThan(100);
    }

    // Button clicks should be responsive
    const filterBtn = authenticatedPage.getByRole('button').first();
    if (await filterBtn.isVisible()) {
      const startTime = Date.now();
      await filterBtn.click();
      const clickTime = Date.now() - startTime;

      expect(clickTime).toBeLessThan(100);
    }
  });

  test('API Performance: visit creation should complete within 1 second', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits/schedule');

    // Fill form
    await authenticatedPage.getByLabel('Client').fill('John Doe');
    await authenticatedPage.getByLabel('Caregiver').fill('Jane Caregiver');
    await authenticatedPage.getByLabel('Service Type').selectOption('PERSONAL_CARE');
    await authenticatedPage.getByLabel('Date').fill('2025-01-20');
    await authenticatedPage.getByLabel('Time').fill('10:00');
    await authenticatedPage.getByLabel('Duration').fill('2');

    // Measure API call time
    const startTime = Date.now();

    await authenticatedPage.getByRole('button', { name: 'Schedule Visit' }).click();

    // Wait for success indication
    await authenticatedPage.waitForURL(/\/visits/, { timeout: 5000 });

    const apiTime = Date.now() - startTime;

    // API call should complete within 1 second
    expect(apiTime).toBeLessThan(1000);
  });

  test('API Performance: batch operations should be efficient', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits');

    // Select multiple visits for batch operation
    const checkboxes = authenticatedPage.locator('[data-testid="visit-checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 0) {
      // Select first 5 visits
      for (let i = 0; i < Math.min(5, checkboxCount); i++) {
        await checkboxes.nth(i).check();
      }

      // Perform batch action (e.g., bulk update status)
      const bulkActionBtn = authenticatedPage.getByRole('button', { name: /bulk|batch/i });
      const bulkExists = await bulkActionBtn.isVisible({ timeout: 2000 }).catch(() => false);

      if (bulkExists) {
        const startTime = Date.now();
        await bulkActionBtn.click();

        // Wait for batch operation to complete
        const successToast = authenticatedPage.locator('[role="alert"][data-type="success"]');
        await successToast.waitFor({ state: 'visible', timeout: 5000 });

        const batchTime = Date.now() - startTime;

        // Batch operation should complete within 2 seconds
        expect(batchTime).toBeLessThan(2000);
      }
    }
  });

  test('Memory Usage: should not have memory leaks during navigation', async ({
    authenticatedPage,
  }) => {
    const initialMemory = await authenticatedPage.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Navigate through multiple pages
    const pages = ['/visits', '/clients', '/caregivers', '/dashboard', '/visits'];

    for (const pagePath of pages) {
      await authenticatedPage.goto(pagePath);
      await authenticatedPage.waitForLoadState('networkidle');
      await authenticatedPage.waitForTimeout(500);
    }

    // Force garbage collection if available
    await authenticatedPage.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    const finalMemory = await authenticatedPage.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    if (initialMemory > 0 && finalMemory > 0) {
      // Memory should not increase dramatically (< 50% increase)
      const memoryIncrease = (finalMemory - initialMemory) / initialMemory;
      expect(memoryIncrease).toBeLessThan(0.5);
    }
  });

  test('Bundle Size: verify JavaScript bundle is optimized', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/visits');

    const bundleSize = await authenticatedPage.evaluate(() => {
      return new Promise<number>((resolve) => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        let totalSize = 0;

        for (const resource of resources) {
          if (resource.name.endsWith('.js') || resource.name.includes('chunk')) {
            totalSize += resource.transferSize || 0;
          }
        }

        resolve(totalSize);
      });
    });

    // Total JS bundle should be reasonable (< 1MB for initial load)
    expect(bundleSize).toBeLessThan(1024 * 1024); // 1MB
  });

  test('Database Query Performance: complex queries should complete quickly', async ({
    authenticatedPage,
  }) => {
    await TestDatabase.seed('large-visit-dataset');

    // Navigate to reports page with complex queries
    const startTime = Date.now();

    await authenticatedPage.goto('/reports/weekly-summary');
    await authenticatedPage.getByLabel('Week Of').fill('2025-01-20');
    await authenticatedPage.getByRole('button', { name: 'Generate' }).click();

    // Wait for report to load
    await authenticatedPage.waitForSelector('[data-testid="report-table"]', { timeout: 5000 });

    const queryTime = Date.now() - startTime;

    // Complex report queries should complete within 3 seconds
    expect(queryTime).toBeLessThan(3000);
  });

  test('Concurrent Load: system handles multiple simultaneous users', async ({
    context,
    coordinatorUser,
  }) => {
    // Simulate 10 concurrent users
    const userCount = 10;
    const promises: Promise<any>[] = [];

    for (let i = 0; i < userCount; i++) {
      const userSession = async () => {
        const page = await context.newPage();

        await page.goto('/');
        await page.evaluate(
          (token) => {
            localStorage.setItem('authToken', token as string);
          },
          coordinatorUser.token
        );

        const startTime = Date.now();
        await page.goto('/visits');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        await page.close();

        return loadTime;
      };

      promises.push(userSession());
    }

    // Wait for all users to complete
    const loadTimes = await Promise.all(promises);

    // Verify all requests succeeded
    expect(loadTimes.length).toBe(userCount);

    // Verify average load time is acceptable
    const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
    expect(avgLoadTime).toBeLessThan(5000);

    // Verify no user had excessive load time
    const maxLoadTime = Math.max(...loadTimes);
    expect(maxLoadTime).toBeLessThan(10000);
  });

  test('Image Loading: optimize image loading with lazy loading', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/clients');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check if images use lazy loading
    const images = authenticatedPage.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      const firstImage = images.first();
      const loading = await firstImage.getAttribute('loading');

      // Images below fold should use lazy loading
      expect(loading).toBe('lazy');
    }

    // Verify images don't block initial page load
    const domContentLoaded = await authenticatedPage.evaluate(() => {
      return performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
    });

    expect(domContentLoaded).toBeLessThan(2000);
  });
});
