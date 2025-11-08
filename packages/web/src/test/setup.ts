import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@vitest/browser/matchers';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Sentry modules to prevent .node file loading
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  addBreadcrumb: vi.fn(),
  configureScope: vi.fn(),
  withScope: vi.fn(),
  getCurrentHub: vi.fn(() => ({
    getClient: vi.fn(),
    getScope: vi.fn(),
  })),
}));

vi.mock('@sentry/tracing', () => ({
  Integrations: {
    BrowserTracing: vi.fn(),
  },
}));

vi.mock('@sentry-internal/node-cpu-profiler', () => ({}));
vi.mock('@sentry/profiling-node', () => ({}));
vi.mock('@sentry/node-core', () => ({}));
vi.mock('@sentry-internal/tracing', () => ({}));
vi.mock('sentry_cpu_profiler', () => ({}));
