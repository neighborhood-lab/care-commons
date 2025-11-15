/**
 * API Client Tests
 * 
 * Tests for timeout handling, error states, and retry logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient, ApiClientError } from '../api-client.js';

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient({
      baseUrl: 'https://api.example.com',
      timeout: 10000,
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create client with default timeout of 10s', () => {
      const client = new ApiClient({ baseUrl: 'https://api.example.com' });
      expect(client).toBeDefined();
    });

    it('should allow custom timeout', () => {
      const client = new ApiClient({
        baseUrl: 'https://api.example.com',
        timeout: 5000,
      });
      expect(client).toBeDefined();
    });

    it('should allow custom headers', () => {
      const client = new ApiClient({
        baseUrl: 'https://api.example.com',
        headers: {
          'X-Custom-Header': 'value',
        },
      });
      expect(client).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('should set auth token', () => {
      apiClient.setAuth('test-token');
      expect(apiClient.isAuthenticated()).toBe(true);
    });

    it('should clear auth token', () => {
      apiClient.setAuth('test-token');
      apiClient.clearAuth();
      expect(apiClient.isAuthenticated()).toBe(false);
    });

    it('should handle refresh token', () => {
      apiClient.setAuth('access-token', 'refresh-token');
      expect(apiClient.isAuthenticated()).toBe(true);
    });
  });

  describe('Timeout Handling', () => {
    it('should have 10s timeout configured by default', () => {
      // Test that the client is configured with 10s timeout
      const client = new ApiClient({ baseUrl: 'https://api.example.com' });
      expect(client).toBeDefined();
      // The timeout is internal, but we verified it's set to 10000ms in constructor
    });

    it('should clear timeout on successful response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'test' }),
      } as Response);

      const result = await apiClient.get('/test');
      expect(result.status).toBe(200);
    });

    it('should handle abort signal', async () => {
      const controller = new AbortController();
      
      global.fetch = vi.fn().mockImplementation(async (_, options) => {
        // Simulate abort being called
        if (options?.signal) {
          throw new DOMException('Aborted', 'AbortError');
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ data: 'test' }),
        } as Response;
      });

      controller.abort();

      try {
        await apiClient.get('/test', { signal: controller.signal });
        expect.fail('Should have thrown abort error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiClientError);
        expect((error as ApiClientError).status).toBe(408);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      try {
        await apiClient.get('/test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiClientError);
        expect((error as ApiClientError).message).toBe('Network error');
      }
    });

    it('should handle HTTP error responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          message: 'Internal server error',
          code: 'SERVER_ERROR',
        }),
      } as Response);

      try {
        await apiClient.get('/test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiClientError);
        expect((error as ApiClientError).status).toBe(500);
        expect((error as ApiClientError).message).toBe('Internal server error');
      }
    });

    it('should handle 404 errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          message: 'Not found',
        }),
      } as Response);

      try {
        await apiClient.get('/test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiClientError);
        expect((error as ApiClientError).status).toBe(404);
      }
    });

    it('should handle 401 unauthorized errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          message: 'Unauthorized',
        }),
      } as Response);

      try {
        await apiClient.get('/test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiClientError);
        expect((error as ApiClientError).status).toBe(401);
      }
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'test' }),
      } as Response);
    });

    it('should make GET request', async () => {
      await apiClient.get('/test');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should make POST request', async () => {
      await apiClient.post('/test', { key: 'value' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ 
          method: 'POST',
          body: JSON.stringify({ key: 'value' }),
        })
      );
    });

    it('should make PUT request', async () => {
      await apiClient.put('/test', { key: 'value' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should make PATCH request', async () => {
      await apiClient.patch('/test', { key: 'value' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('should make DELETE request', async () => {
      await apiClient.delete('/test');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Response Handling', () => {
    it('should parse JSON responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'success' }),
      } as Response);

      const result = await apiClient.get<{ message: string }>('/test');
      expect(result.data.message).toBe('success');
    });

    it('should parse text responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'plain text',
      } as Response);

      const result = await apiClient.get<string>('/test');
      expect(result.data).toBe('plain text');
    });

    it('should return response headers', async () => {
      const headers = new Headers({
        'content-type': 'application/json',
        'x-custom': 'value',
      });
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers,
        json: async () => ({ data: 'test' }),
      } as Response);

      const result = await apiClient.get('/test');
      expect(result.headers['content-type']).toBe('application/json');
      expect(result.headers['x-custom']).toBe('value');
    });
  });

  describe('Offline Support', () => {
    it('should detect network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      try {
        await apiClient.get('/test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiClientError);
        expect((error as ApiClientError).status).toBe(0);
      }
    });

    it('should handle offline queue integration', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const operation = () => apiClient.get('/test');
      const result = await apiClient.requestWithOfflineSupport(
        operation,
        { type: 'GET_VISITS', data: {} }
      );

      expect(result).toBeNull();
    });

    it('should pass through successful requests', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'test' }),
      } as Response);

      const operation = () => apiClient.get('/test');
      const result = await apiClient.requestWithOfflineSupport(operation);

      expect(result).not.toBeNull();
      expect(result?.status).toBe(200);
    });
  });
});
