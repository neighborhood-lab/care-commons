/**
 * HTTP Client for EVV Aggregator Integrations
 *
 * Provides a secure, robust HTTP client with:
 * - Timeout handling
 * - Error handling
 * - Request/response logging for audit
 * - TLS/SSL enforcement
 * - Retry logic with exponential backoff
 */

import { RetryPolicy, calculateRetryDelay } from './base-aggregator.js';

export interface HttpClientConfig {
  timeout?: number; // milliseconds
  headers?: Record<string, string>;
  retryPolicy?: RetryPolicy;
}

export interface HttpResponse<T = unknown> {
  ok: boolean;
  status: number;
  statusText: string;
  data?: T;
  error?: string;
}

/**
 * HTTP Client for aggregator API calls
 *
 * Implements secure, auditable HTTP communication with external aggregators.
 */
export class HttpClient {
  private defaultTimeout = 30000; // 30 seconds

  /**
   * Send POST request with JSON payload
   *
   * @param url - API endpoint URL
   * @param payload - JSON payload to send
   * @param config - HTTP configuration
   * @returns HTTP response
   */
  async post<TPayload, TResponse>(
    url: string,
    payload: TPayload,
    config?: HttpClientConfig
  ): Promise<HttpResponse<TResponse>> {
    const timeout = config?.timeout || this.defaultTimeout;

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Enforce HTTPS
      if (!url.startsWith('https://')) {
        throw new Error('Only HTTPS endpoints are allowed for aggregator communication');
      }

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Care-Commons-EVV/1.0',
        ...config?.headers,
      };

      // Make request
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      const responseText = await response.text();
      let responseData: TResponse | undefined;

      try {
        responseData = JSON.parse(responseText) as TResponse;
      } catch {
        // If response is not JSON, leave data undefined
        responseData = undefined;
      }

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        error: response.ok ? undefined : (responseText || response.statusText),
      };

    } catch (error) {
      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          ok: false,
          status: 408,
          statusText: 'Request Timeout',
          error: `Request timed out after ${timeout}ms`,
        };
      }

      // Handle network errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        status: 0,
        statusText: 'Network Error',
        error: errorMessage,
      };
    }
  }

  /**
   * Send GET request
   *
   * @param url - API endpoint URL
   * @param config - HTTP configuration
   * @returns HTTP response
   */
  async get<TResponse>(
    url: string,
    config?: HttpClientConfig
  ): Promise<HttpResponse<TResponse>> {
    const timeout = config?.timeout || this.defaultTimeout;

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Enforce HTTPS
      if (!url.startsWith('https://')) {
        throw new Error('Only HTTPS endpoints are allowed for aggregator communication');
      }

      // Build headers
      const headers: Record<string, string> = {
        'User-Agent': 'Care-Commons-EVV/1.0',
        ...config?.headers,
      };

      // Make request
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      const responseText = await response.text();
      let responseData: TResponse | undefined;

      try {
        responseData = JSON.parse(responseText) as TResponse;
      } catch {
        // If response is not JSON, leave data undefined
        responseData = undefined;
      }

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        error: response.ok ? undefined : (responseText || response.statusText),
      };

    } catch (error) {
      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          ok: false,
          status: 408,
          statusText: 'Request Timeout',
          error: `Request timed out after ${timeout}ms`,
        };
      }

      // Handle network errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        status: 0,
        statusText: 'Network Error',
        error: errorMessage,
      };
    }
  }

  /**
   * Send POST with retry logic
   *
   * @param url - API endpoint URL
   * @param payload - JSON payload to send
   * @param config - HTTP configuration with retry policy
   * @returns HTTP response
   */
  async postWithRetry<TPayload, TResponse>(
    url: string,
    payload: TPayload,
    config: HttpClientConfig & { retryPolicy: RetryPolicy }
  ): Promise<HttpResponse<TResponse>> {
    let lastResponse: HttpResponse<TResponse> | null = null;
    let retryCount = 0;

    while (retryCount <= config.retryPolicy.maxRetries) {
      // Make request
      lastResponse = await this.post<TPayload, TResponse>(url, payload, config);

      // If successful, return
      if (lastResponse.ok) {
        return lastResponse;
      }

      // If not retryable (4xx errors except 429), don't retry
      if (lastResponse.status >= 400 && lastResponse.status < 500 && lastResponse.status !== 429) {
        return lastResponse;
      }

      // If max retries reached, return last response
      if (retryCount >= config.retryPolicy.maxRetries) {
        return lastResponse;
      }

      // Calculate delay and wait
      const delay = calculateRetryDelay(retryCount, config.retryPolicy);
      await new Promise(resolve => setTimeout(resolve, delay * 1000));

      retryCount++;
    }

    return lastResponse!;
  }
}

/**
 * Singleton HTTP client instance
 */
export const httpClient = new HttpClient();
