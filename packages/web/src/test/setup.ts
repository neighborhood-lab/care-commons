import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@vitest/browser/matchers';
import '@testing-library/jest-dom/vitest';

// Mock Sentry modules to prevent loading native .node files during tests
vi.mock('@sentry/profiling-node', () => ({}));
vi.mock('@sentry-internal/node-cpu-profiler', () => ({}));

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
