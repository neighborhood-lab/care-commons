import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsTouchDevice,
} from '../useMediaQuery';

describe('useMediaQuery', () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let mockAddEventListener: ReturnType<typeof vi.fn>;
  let mockRemoveEventListener: ReturnType<typeof vi.fn>;
  let changeHandler: ((event: MediaQueryListEvent) => void) | null = null;

  beforeEach(() => {
    mockAddEventListener = vi.fn((event: string, handler: (event: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        changeHandler = handler;
      }
    });
    mockRemoveEventListener = vi.fn();

    mockMatchMedia = vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
  });

  afterEach(() => {
    changeHandler = null;
  });

  describe('useMediaQuery hook', () => {
    it('should return false by default', () => {
      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      expect(result.current).toBe(false);
    });

    it('should return true when query matches', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(min-width: 768px)',
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      });

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      expect(result.current).toBe(true);
    });

    it('should call matchMedia with the correct query', () => {
      renderHook(() => useMediaQuery('(max-width: 1024px)'));
      expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 1024px)');
    });

    it('should add event listener on mount', () => {
      renderHook(() => useMediaQuery('(min-width: 768px)'));
      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should remove event listener on unmount', () => {
      const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      unmount();
      expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should update when media query changes', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        media: '(min-width: 768px)',
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      });

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      expect(result.current).toBe(false);

      // Simulate media query change
      act(() => {
        if (changeHandler) {
          changeHandler({ matches: true } as MediaQueryListEvent);
        }
      });

      expect(result.current).toBe(true);
    });

    it('should re-subscribe when query changes', () => {
      const { rerender } = renderHook(
        ({ query }) => useMediaQuery(query),
        { initialProps: { query: '(min-width: 768px)' } }
      );

      expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 768px)');

      rerender({ query: '(min-width: 1024px)' });

      expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
      expect(mockRemoveEventListener).toHaveBeenCalled();
    });
  });

  describe('useIsMobile', () => {
    it('should use correct media query for mobile', () => {
      renderHook(() => useIsMobile());
      expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');
    });

    it('should return true when screen is mobile-sized', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(max-width: 767px)',
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });
  });

  describe('useIsTablet', () => {
    it('should use correct media query for tablet', () => {
      renderHook(() => useIsTablet());
      expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 768px) and (max-width: 1023px)');
    });

    it('should return true when screen is tablet-sized', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(min-width: 768px) and (max-width: 1023px)',
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      });

      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(true);
    });
  });

  describe('useIsDesktop', () => {
    it('should use correct media query for desktop', () => {
      renderHook(() => useIsDesktop());
      expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
    });

    it('should return true when screen is desktop-sized', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(min-width: 1024px)',
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      });

      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(true);
    });
  });

  describe('useIsTouchDevice', () => {
    it('should return false when not a touch device', () => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (window as unknown as Record<string, unknown>).ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });

      const { result } = renderHook(() => useIsTouchDevice());
      expect(result.current).toBe(false);
    });

    it('should return true when ontouchstart is available', () => {
      Object.defineProperty(window, 'ontouchstart', { value: () => {}, configurable: true });

      const { result } = renderHook(() => useIsTouchDevice());
      expect(result.current).toBe(true);

      // Cleanup
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (window as unknown as Record<string, unknown>).ontouchstart;
    });

    it('should return true when maxTouchPoints > 0', () => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (window as unknown as Record<string, unknown>).ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 1, configurable: true });

      const { result } = renderHook(() => useIsTouchDevice());
      expect(result.current).toBe(true);
    });
  });
});
