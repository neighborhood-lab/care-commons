/**
 * Memoization utility for caching expensive function results
 *
 * Useful for:
 * - Distance calculations
 * - Complex transformations
 * - Data formatting operations
 */

/**
 * Memoize a function by caching its results
 *
 * @param fn Function to memoize
 * @param keyFn Optional custom key generation function
 * @returns Memoized version of the function
 *
 * @example
 * ```typescript
 * const calculateDistance = memoize(
 *   (lat1: number, lon1: number, lat2: number, lon2: number) => {
 *     // Expensive haversine calculation
 *     return haversineDistance(lat1, lon1, lat2, lon2);
 *   }
 * );
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn !== undefined ? keyFn(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      const cached = cache.get(key);
      if (cached !== undefined) {
        return cached;
      }
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Memoize with a maximum cache size (LRU-like behavior)
 *
 * @param fn Function to memoize
 * @param maxSize Maximum number of cached results
 * @param keyFn Optional custom key generation function
 * @returns Memoized version of the function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memoizeWithLimit<T extends (...args: any[]) => any>(
  fn: T,
  maxSize: number,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  const keys: string[] = [];

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn !== undefined ? keyFn(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      const cached = cache.get(key);
      if (cached !== undefined) {
        return cached;
      }
    }

    const result = fn(...args);

    // Add to cache
    cache.set(key, result);
    keys.push(key);

    // Remove oldest entry if cache is full
    if (keys.length > maxSize) {
      const oldestKey = keys.shift();
      if (oldestKey !== undefined) {
        cache.delete(oldestKey);
      }
    }

    return result;
  }) as T;
}

/**
 * Memoize with TTL (time-based expiration)
 *
 * @param fn Function to memoize
 * @param ttlMs Time to live in milliseconds
 * @param keyFn Optional custom key generation function
 * @returns Memoized version of the function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memoizeWithTTL<T extends (...args: any[]) => any>(
  fn: T,
  ttlMs: number,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, { value: ReturnType<T>; expiresAt: number }>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn !== undefined ? keyFn(...args) : JSON.stringify(args);
    const now = Date.now();

    const cached = cache.get(key);
    if (cached !== undefined && cached.expiresAt > now) {
      return cached.value;
    }

    const result = fn(...args);
    cache.set(key, {
      value: result,
      expiresAt: now + ttlMs
    });

    return result;
  }) as T;
}

/**
 * Clear the cache for a memoized function
 * Note: This only works if you keep a reference to the cache
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMemoizedFunction<T extends (...args: any[]) => any>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): {
  fn: T;
  clear: () => void;
  size: () => number;
} {
  const cache = new Map<string, ReturnType<T>>();

  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn !== undefined ? keyFn(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      const cached = cache.get(key);
      if (cached !== undefined) {
        return cached;
      }
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;

  return {
    fn: memoized,
    clear: (): void => cache.clear(),
    size: (): number => cache.size
  };
}

/**
 * Memoize async functions
 *
 * @param fn Async function to memoize
 * @param keyFn Optional custom key generation function
 * @returns Memoized version of the async function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, Promise<ReturnType<T>>>();

  return ((...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = keyFn !== undefined ? keyFn(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      const cached = cache.get(key);
      if (cached !== undefined) {
        return cached;
      }
    }

    const promise = fn(...args);
    cache.set(key, promise);

    // Remove from cache if promise rejects
    promise.catch(() => {
      cache.delete(key);
    });

    return promise;
  }) as T;
}
