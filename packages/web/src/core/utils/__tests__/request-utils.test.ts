import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  retryWithBackoff,
  requestDeduplicator,
  requestThrottler,
} from '../request-utils';

describe('request-utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    requestDeduplicator.clear();
    requestThrottler.clear();
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on 429 error with exponential backoff', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ status: 429, message: 'Too many requests' })
        .mockRejectedValueOnce({ status: 429, message: 'Too many requests' })
        .mockResolvedValue('success');

      const onRetry = vi.fn();

      const promise = retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxJitterMs: 0, // Disable jitter for predictable tests
        onRetry,
      });

      // Fast-forward through retries
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledTimes(2);

      // Check exponential backoff delays
      expect(onRetry).toHaveBeenNthCalledWith(
        1,
        1,
        1000, // 1000 * 2^0 = 1000
        expect.anything()
      );
      expect(onRetry).toHaveBeenNthCalledWith(
        2,
        2,
        2000, // 1000 * 2^1 = 2000
        expect.anything()
      );
    });

    it('should retry on 500 error', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ status: 500, message: 'Internal server error' })
        .mockResolvedValue('success');

      const promise = retryWithBackoff(fn, { maxRetries: 3 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on network error', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('NETWORK_ERROR'))
        .mockResolvedValue('success');

      const promise = retryWithBackoff(fn, { maxRetries: 3 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 404 error', async () => {
      const fn = vi.fn().mockRejectedValue({ status: 404, message: 'Not found' });

      await expect(retryWithBackoff(fn, { maxRetries: 3 })).rejects.toEqual({
        status: 404,
        message: 'Not found',
      });

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries exceeded', async () => {
      const fn = vi.fn().mockRejectedValue({ status: 429, message: 'Too many requests' });

      const promise = retryWithBackoff(fn, { maxRetries: 2 });

      // Catch the error immediately to avoid unhandled rejection
      const resultPromise = promise.catch((error) => error);

      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result).toEqual({
        status: 429,
        message: 'Too many requests',
      });

      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should respect max delay', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ status: 429 })
        .mockRejectedValueOnce({ status: 429 })
        .mockRejectedValueOnce({ status: 429 })
        .mockResolvedValue('success');

      const onRetry = vi.fn();

      const promise = retryWithBackoff(fn, {
        maxRetries: 5,
        initialDelayMs: 1000,
        maxDelayMs: 3000,
        maxJitterMs: 0,
        onRetry,
      });

      await vi.runAllTimersAsync();
      await promise;

      // 1000 * 2^0 = 1000
      // 1000 * 2^1 = 2000
      // 1000 * 2^2 = 4000 -> capped to 3000
      expect(onRetry).toHaveBeenNthCalledWith(3, 3, 3000, expect.anything());
    });

    it('should handle code as string', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ code: '429', message: 'Too many requests' })
        .mockResolvedValue('success');

      const promise = retryWithBackoff(fn, { maxRetries: 3 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('requestDeduplicator', () => {
    it('should deduplicate concurrent identical requests', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const promise1 = requestDeduplicator.deduplicate('key1', fn);
      const promise2 = requestDeduplicator.deduplicate('key1', fn);
      const promise3 = requestDeduplicator.deduplicate('key1', fn);

      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

      expect(result1).toBe('success');
      expect(result2).toBe('success');
      expect(result3).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1); // Only called once!
    });

    it('should allow different keys to execute separately', async () => {
      const fn1 = vi.fn().mockResolvedValue('success1');
      const fn2 = vi.fn().mockResolvedValue('success2');

      const [result1, result2] = await Promise.all([
        requestDeduplicator.deduplicate('key1', fn1),
        requestDeduplicator.deduplicate('key2', fn2),
      ]);

      expect(result1).toBe('success1');
      expect(result2).toBe('success2');
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it('should allow sequential requests with same key', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result1 = await requestDeduplicator.deduplicate('key1', fn);
      const result2 = await requestDeduplicator.deduplicate('key1', fn);

      expect(result1).toBe('success');
      expect(result2).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2); // Called twice since not concurrent
    });

    it('should handle errors and allow retry', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValue('success');

      await expect(requestDeduplicator.deduplicate('key1', fn)).rejects.toThrow('Failed');

      const result = await requestDeduplicator.deduplicate('key1', fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('requestThrottler', () => {
    it('should allow first request immediately', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const promise = requestThrottler.throttle('endpoint1', fn, { minIntervalMs: 500 });

      // Should not need to wait
      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throttle rapid successive requests', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      // First request - immediate
      const promise1 = requestThrottler.throttle('endpoint1', fn, { minIntervalMs: 500 });
      await promise1;

      expect(fn).toHaveBeenCalledTimes(1);

      // Second request - should wait 500ms
      const promise2 = requestThrottler.throttle('endpoint1', fn, { minIntervalMs: 500 });

      // Fast-forward 499ms - should still be waiting
      vi.advanceTimersByTime(499);
      expect(fn).toHaveBeenCalledTimes(1);

      // Fast-forward 1ms more (total 500ms) - should execute
      await vi.advanceTimersByTimeAsync(1);
      await promise2;

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should allow requests after interval has passed', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      await requestThrottler.throttle('endpoint1', fn, { minIntervalMs: 500 });
      expect(fn).toHaveBeenCalledTimes(1);

      // Wait 500ms
      vi.advanceTimersByTime(500);

      await requestThrottler.throttle('endpoint1', fn, { minIntervalMs: 500 });
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throttle different endpoints independently', async () => {
      const fn1 = vi.fn().mockResolvedValue('success1');
      const fn2 = vi.fn().mockResolvedValue('success2');

      await requestThrottler.throttle('endpoint1', fn1, { minIntervalMs: 500 });
      await requestThrottler.throttle('endpoint2', fn2, { minIntervalMs: 500 });

      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });
  });

  describe('integration', () => {
    it('should combine throttling, deduplication, and retry', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ status: 429 })
        .mockResolvedValue('success');

      const executeRequest = async (): Promise<string> => {
        return requestThrottler.throttle(
          'endpoint1',
          async () => {
            return retryWithBackoff(fn, {
              maxRetries: 3,
              initialDelayMs: 100,
              maxJitterMs: 0,
            });
          },
          { minIntervalMs: 200 }
        );
      };

      // Execute 3 identical requests concurrently
      const promise1 = requestDeduplicator.deduplicate('key1', executeRequest);
      const promise2 = requestDeduplicator.deduplicate('key1', executeRequest);
      const promise3 = requestDeduplicator.deduplicate('key1', executeRequest);

      // Fast-forward through all timers
      await vi.runAllTimersAsync();

      const results = await Promise.all([promise1, promise2, promise3]);

      // All should succeed
      expect(results).toEqual(['success', 'success', 'success']);

      // Function should be called twice (initial fail + retry)
      // But only once due to deduplication
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
