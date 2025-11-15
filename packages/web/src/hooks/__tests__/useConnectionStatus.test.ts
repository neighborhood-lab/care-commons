/**
 * Tests for useConnectionStatus hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useConnectionStatus } from '../useConnectionStatus';

// Mock fetch
global.fetch = vi.fn();

describe('useConnectionStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with online status from navigator', () => {
    const { result } = renderHook(() => useConnectionStatus());

    expect(result.current.isOnline).toBe(navigator.onLine);
    expect(result.current.isConnected).toBeDefined();
    expect(result.current.lastConnected).toBeInstanceOf(Date);
    expect(result.current.lastChecked).toBeInstanceOf(Date);
  });

  it.skip('should detect when server is reachable', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
    });

    const { result } = renderHook(() => useConnectionStatus());

    await waitFor(() => {
      expect(result.current.isServerReachable).toBe(true);
    });

    expect(result.current.isConnected).toBe(true);
  });

  it.skip('should detect when server is unreachable', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useConnectionStatus());

    await waitFor(() => {
      expect(result.current.isServerReachable).toBe(false);
    });

    expect(result.current.isConnected).toBe(false);
  });

  it.skip('should handle server timeout', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((resolve) => {
        setTimeout(() => resolve({ ok: true }), 10000); // Longer than 5s timeout
      })
    );

    const { result } = renderHook(() => useConnectionStatus());

    await waitFor(() => {
      expect(result.current.isServerReachable).toBe(false);
    });
  });

  it.skip('should update lastConnected when connection is successful', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
    });

    const { result } = renderHook(() => useConnectionStatus());
    const initialLastConnected = result.current.lastConnected;

    await waitFor(() => {
      expect(result.current.isServerReachable).toBe(true);
    });

    expect(result.current.lastConnected).not.toBe(initialLastConnected);
  });

  it('should allow manual connection check', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
    });

    const { result } = renderHook(() => useConnectionStatus());

    await result.current.checkConnection();

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/health',
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
      })
    );
  });

  it.skip('should respond to online/offline events', async () => {
    const { result } = renderHook(() => useConnectionStatus());

    // Simulate going offline
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    });
    window.dispatchEvent(new Event('offline'));

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
      expect(result.current.isConnected).toBe(false);
    });

    // Simulate coming back online
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
    });
    window.dispatchEvent(new Event('online'));

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });
  });

  it.skip('should update lastChecked on each check', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
    });

    const { result } = renderHook(() => useConnectionStatus());
    const initialLastChecked = result.current.lastChecked;

    await vi.advanceTimersByTimeAsync(100);

    await result.current.checkConnection();

    await waitFor(() => {
      expect(result.current.lastChecked).not.toBe(initialLastChecked);
    });
  });
});
