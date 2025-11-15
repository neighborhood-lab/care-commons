import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsTouchDevice,
} from '../useMediaQuery';

describe('useMediaQuery', () => {
  let matchMediaMock: any;

  beforeEach(() => {
    // Mock window.matchMedia
    matchMediaMock = vi.fn();
    window.matchMedia = matchMediaMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return true when media query matches', () => {
    const listeners: Array<(event: MediaQueryListEvent) => void> = [];
    matchMediaMock.mockReturnValue({
      matches: true,
      media: '(max-width: 767px)',
      addEventListener: vi.fn((event, listener) => {
        listeners.push(listener);
      }),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));

    expect(result.current).toBe(true);
  });

  it('should return false when media query does not match', () => {
    matchMediaMock.mockReturnValue({
      matches: false,
      media: '(max-width: 767px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));

    expect(result.current).toBe(false);
  });

  it('should update when media query match changes', () => {
    const listeners: Array<(event: MediaQueryListEvent) => void> = [];
    const mediaQueryList = {
      matches: false,
      media: '(max-width: 767px)',
      addEventListener: vi.fn((event, listener) => {
        listeners.push(listener);
      }),
      removeEventListener: vi.fn(),
    };

    matchMediaMock.mockReturnValue(mediaQueryList);

    const { result, rerender } = renderHook(() => useMediaQuery('(max-width: 767px)'));

    expect(result.current).toBe(false);

    // Simulate media query change
    mediaQueryList.matches = true;
    listeners.forEach((listener) => {
      listener({ matches: true } as MediaQueryListEvent);
    });

    rerender();

    expect(result.current).toBe(true);
  });

  it('should cleanup event listener on unmount', () => {
    const removeEventListener = vi.fn();
    matchMediaMock.mockReturnValue({
      matches: false,
      media: '(max-width: 767px)',
      addEventListener: vi.fn(),
      removeEventListener,
    });

    const { unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'));

    unmount();

    expect(removeEventListener).toHaveBeenCalled();
  });

  it('should handle SSR environment gracefully', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));

    expect(result.current).toBe(false);

    global.window = originalWindow;
  });
});

describe('useIsMobile', () => {
  it('should detect mobile viewport', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(max-width: 767px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it('should not detect mobile on larger viewports', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '(max-width: 767px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });
});

describe('useIsTablet', () => {
  it('should detect tablet viewport', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(min-width: 768px) and (max-width: 1023px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useIsTablet());

    expect(result.current).toBe(true);
  });

  it('should not detect tablet on other viewports', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '(min-width: 768px) and (max-width: 1023px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useIsTablet());

    expect(result.current).toBe(false);
  });
});

describe('useIsDesktop', () => {
  it('should detect desktop viewport', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(min-width: 1024px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useIsDesktop());

    expect(result.current).toBe(true);
  });

  it('should not detect desktop on smaller viewports', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '(min-width: 1024px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useIsDesktop());

    expect(result.current).toBe(false);
  });
});

describe('useIsTouchDevice', () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  it('should detect touch device via ontouchstart', () => {
    Object.defineProperty(window, 'ontouchstart', {
      value: {},
      writable: true,
    });

    const { result } = renderHook(() => useIsTouchDevice());

    expect(result.current).toBe(true);

    delete (window as any).ontouchstart;
  });

  it('should detect touch device via maxTouchPoints', () => {
    Object.defineProperty(global, 'navigator', {
      value: { maxTouchPoints: 5 },
      writable: true,
    });

    const { result } = renderHook(() => useIsTouchDevice());

    expect(result.current).toBe(true);
  });

  it('should not detect touch on non-touch devices', () => {
    Object.defineProperty(global, 'navigator', {
      value: { maxTouchPoints: 0 },
      writable: true,
    });

    const { result } = renderHook(() => useIsTouchDevice());

    expect(result.current).toBe(false);
  });
});
