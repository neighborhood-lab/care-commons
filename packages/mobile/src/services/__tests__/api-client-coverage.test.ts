import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient, ApiClientError, createApiClient, getApiClient } from '../api-client.js';

describe('ApiClient - Additional Coverage', () => {
  let client: ApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    client = new ApiClient({
      baseUrl: 'https://api.example.com',
      timeout: 5000,
    });
  });

  describe('Authentication Methods', () => {
    it('should set auth tokens', () => {
      client.setAuth('access-token', 'refresh-token');

      expect(client.isAuthenticated()).toBe(true);
    });

    it('should clear auth tokens', () => {
      client.setAuth('access-token');
      client.clearAuth();

      expect(client.isAuthenticated()).toBe(false);
    });

    it('should return false when not authenticated', () => {
      expect(client.isAuthenticated()).toBe(false);
    });

    it('should refresh authentication successfully', async () => {
      client.setAuth('old-token', 'refresh-token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        }),
      });

      const result = await client.refreshAuth();

      expect(result).toBe(true);
      expect(client.isAuthenticated()).toBe(true);
    });

    it('should return false when refresh fails', async () => {
      client.setAuth('old-token', 'refresh-token');

      (global.fetch as any).mockRejectedValueOnce(new Error('Refresh failed'));

      const result = await client.refreshAuth();

      expect(result).toBe(false);
      expect(client.isAuthenticated()).toBe(false);
    });

    it('should return false when no refresh token available', async () => {
      client.setAuth('access-token'); // No refresh token

      const result = await client.refreshAuth();

      expect(result).toBe(false);
    });
  });

  describe('HTTP Methods', () => {
    it('should make GET request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'test' }),
      });

      const response = await client.get('/test');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: 'test' });
    });

    it('should make POST request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ created: true }),
      });

      const response = await client.post('/test', { name: 'test' });

      expect(response.status).toBe(201);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        })
      );
    });

    it('should make PUT request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ updated: true }),
      });

      const response = await client.put('/test', { name: 'updated' });

      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });

    it('should make PATCH request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ patched: true }),
      });

      const response = await client.patch('/test', { field: 'value' });

      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });

    it('should make DELETE request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const response = await client.delete('/test');

      expect(response.status).toBe(204);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Request Options', () => {
    it('should include authorization header when authenticated', async () => {
      client.setAuth('test-token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      await client.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should not require auth when requireAuth is false', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      await client.get('/test', { requireAuth: false });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });

    it('should merge custom headers', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      await client.get('/test', {
        headers: { 'X-Custom-Header': 'value' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'value',
          }),
        })
      );
    });

    it('should respect custom signal', async () => {
      const controller = new AbortController();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      await client.get('/test', { signal: controller.signal });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: controller.signal,
        })
      );
    });
  });

  describe('Response Handling', () => {
    it('should parse JSON response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'success' }),
      });

      const response = await client.get('/test');

      expect(response.data).toEqual({ message: 'success' });
    });

    it('should parse text response when not JSON', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'plain text',
      });

      const response = await client.get('/test');

      expect(response.data).toBe('plain text');
    });

    it('should include response headers', async () => {
      const headers = new Headers({
        'content-type': 'application/json',
        'x-custom': 'value',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers,
        json: async () => ({}),
      });

      const response = await client.get('/test');

      expect(response.headers['content-type']).toBe('application/json');
      expect(response.headers['x-custom']).toBe('value');
    });
  });

  describe('Error Handling', () => {
    it('should throw ApiClientError for HTTP errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          message: 'Not found',
          code: 'NOT_FOUND',
        }),
      });

      try {
        await client.get('/test');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiClientError);
        expect((error as ApiClientError).message).toBe('Not found');
      }
    });

    it('should include error details in ApiClientError', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: { field: 'email' },
        }),
      });

      try {
        await client.get('/test');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiClientError);
        expect((error as ApiClientError).status).toBe(400);
        expect((error as ApiClientError).code).toBe('VALIDATION_ERROR');
        expect((error as ApiClientError).details).toEqual({ field: 'email' });
      }
    });

    it('should handle timeout errors', async () => {
      const abortError: any = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      (global.fetch as any).mockRejectedValueOnce(abortError);

      try {
        await client.get('/test');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiClientError);
        expect((error as ApiClientError).message).toContain('Request timeout');
      }
    });

    it('should handle network errors', async () => {
      const error = new ApiClientError('Network error', 0);
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(client.get('/test')).rejects.toThrow(ApiClientError);
    });

    it('should handle unknown errors', async () => {
      (global.fetch as any).mockRejectedValueOnce('unknown error type');

      await expect(client.get('/test')).rejects.toThrow('Unknown error');
    });
  });

  describe('Offline Support', () => {
    it('should execute request when online', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      const operation = () => client.get('/test');
      const result = await client.requestWithOfflineSupport(operation);

      expect(result).toBeDefined();
      expect(result?.data).toEqual({ success: true });
    });

    it('should return null and log warning when network error occurs', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const operation = () => client.get('/test');
      const result = await client.requestWithOfflineSupport(operation, {
        type: 'GET_VISITS',
        data: {},
      });

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should throw non-network errors', async () => {
      const error = new ApiClientError('Bad request', 400);
      (global.fetch as any).mockRejectedValueOnce(error);

      const operation = () => client.get('/test');

      await expect(
        client.requestWithOfflineSupport(operation)
      ).rejects.toThrow('Bad request');
    });
  });

  describe('Singleton Pattern', () => {
    it('should create and get singleton instance', () => {
      const instance = createApiClient({ baseUrl: 'https://test.com' });

      expect(instance).toBeInstanceOf(ApiClient);
      expect(getApiClient()).toBe(instance);
    });
  });
});
