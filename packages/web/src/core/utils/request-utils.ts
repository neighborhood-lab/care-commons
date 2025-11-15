/**
 * Request utilities for throttling, debouncing, and retry logic
 * Prevents rate limiting issues by controlling request frequency
 */

/**
 * Sleep for a specified number of milliseconds
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate random jitter between 0 and maxJitter milliseconds
 */
const getJitter = (maxJitter: number): number => Math.random() * maxJitter;

/**
 * Exponential backoff retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelayMs?: number;
  /** Maximum jitter in milliseconds (default: 1000) */
  maxJitterMs?: number;
  /** HTTP status codes that should trigger a retry (default: [429, 500, 502, 503, 504]) */
  retryableStatuses?: number[];
  /** Callback when a retry is attempted */
  onRetry?: (attempt: number, delayMs: number, error: unknown) => void;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  maxJitterMs: 1000,
  retryableStatuses: [429, 500, 502, 503, 504],
  onRetry: () => {},
};

/**
 * Retry a function with exponential backoff and jitter
 *
 * @param fn Function to retry
 * @param config Retry configuration
 * @returns Result of the function
 *
 * @example
 * const data = await retryWithBackoff(
 *   () => apiClient.get('/api/visits'),
 *   { maxRetries: 3, initialDelayMs: 1000 }
 * );
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries,
    initialDelayMs,
    maxDelayMs,
    maxJitterMs,
    retryableStatuses,
    onRetry,
  } = { ...DEFAULT_RETRY_CONFIG, ...config };

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      // Check if this is the last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Check if the error is retryable
      const isRetryable = isRetryableError(error, retryableStatuses);
      if (!isRetryable) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const exponentialDelay = initialDelayMs * Math.pow(2, attempt);
      const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
      const jitter = getJitter(maxJitterMs);
      const totalDelay = cappedDelay + jitter;

      // Call retry callback
      onRetry(attempt + 1, totalDelay, error);

      // Wait before retrying
      await sleep(totalDelay);
    }
  }

  throw lastError;
}

/**
 * Check if an error is retryable based on HTTP status code
 */
function isRetryableError(error: unknown, retryableStatuses: number[]): boolean {
  // Check for API errors with status codes
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as { code?: string; status?: number };

    // Check numeric status
    if (typeof errorObj.status === 'number' && retryableStatuses.includes(errorObj.status)) {
      return true;
    }

    // Check string code (e.g., "429")
    if (typeof errorObj.code === 'string') {
      const statusCode = parseInt(errorObj.code, 10);
      if (!isNaN(statusCode) && retryableStatuses.includes(statusCode)) {
        return true;
      }
    }
  }

  // Check for network errors
  if (error instanceof Error) {
    const networkErrors = ['NETWORK_ERROR', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'];
    if (networkErrors.some(errCode => error.message.includes(errCode))) {
      return true;
    }
  }

  return false;
}

/**
 * Request deduplication cache
 * Prevents multiple identical requests from being made simultaneously
 */
class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<unknown>> = new Map();

  /**
   * Execute a request, or return the pending request if one is already in flight
   *
   * @param key Unique key for the request (e.g., "GET:/api/visits?start=2025-11-15")
   * @param fn Function that performs the request
   * @returns Result of the request
   */
  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Check if there's already a pending request for this key
    const pending = this.pendingRequests.get(key);
    if (pending !== undefined) {
      return pending as Promise<T>;
    }

    // Create new request
    const promise = fn()
      .finally(() => {
        // Remove from pending requests when complete
        this.pendingRequests.delete(key);
      });

    // Store in pending requests
    this.pendingRequests.set(key, promise);

    return promise;
  }

  /**
   * Clear all pending requests (useful for testing)
   */
  clear(): void {
    this.pendingRequests.clear();
  }
}

/**
 * Global request deduplicator instance
 */
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Throttle configuration
 */
export interface ThrottleConfig {
  /** Minimum time between requests in milliseconds (default: 500) */
  minIntervalMs?: number;
}

const DEFAULT_THROTTLE_CONFIG: Required<ThrottleConfig> = {
  minIntervalMs: 500,
};

/**
 * Request throttler
 * Ensures a minimum time interval between requests
 */
class RequestThrottler {
  private lastRequestTime: Map<string, number> = new Map();

  /**
   * Throttle a request by ensuring minimum time between requests
   *
   * @param key Unique key for the throttle (e.g., endpoint path)
   * @param fn Function to execute
   * @param config Throttle configuration
   * @returns Result of the function
   */
  async throttle<T>(
    key: string,
    fn: () => Promise<T>,
    config: ThrottleConfig = {}
  ): Promise<T> {
    const { minIntervalMs } = { ...DEFAULT_THROTTLE_CONFIG, ...config };

    const now = Date.now();
    const lastRequest = this.lastRequestTime.get(key) ?? 0;
    const timeSinceLastRequest = now - lastRequest;

    // If not enough time has passed, wait
    if (timeSinceLastRequest < minIntervalMs) {
      const waitTime = minIntervalMs - timeSinceLastRequest;
      await sleep(waitTime);
    }

    // Update last request time
    this.lastRequestTime.set(key, Date.now());

    // Execute function
    return fn();
  }

  /**
   * Clear throttle state (useful for testing)
   */
  clear(): void {
    this.lastRequestTime.clear();
  }
}

/**
 * Global request throttler instance
 */
export const requestThrottler = new RequestThrottler();
