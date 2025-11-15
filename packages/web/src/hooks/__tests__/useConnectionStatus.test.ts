/**
 * Tests for useConnectionStatus hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
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
});
