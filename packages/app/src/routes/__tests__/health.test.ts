/**
 * Health Check Routes Tests
 *
 * Tests for health check endpoints including geocoding service health
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHealthRouter } from '../health.js';
import type { Database } from '@care-commons/core';
import type { Request, Response } from 'express';

describe('Health Routes', () => {
  let mockDb: Database;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock database
    mockDb = {
      query: vi.fn(),
    } as unknown as Database;

    // Mock request
    mockRequest = {};

    // Mock response
    jsonMock = vi.fn();
    statusMock = vi.fn(() => ({ json: jsonMock }));
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return healthy status when database is connected', async () => {
      const router = createHealthRouter(mockDb);
      const healthHandler = router.stack[0]?.route?.stack[0]?.handle;

      if (!healthHandler) {
        throw new Error('Health handler not found');
      }

      await healthHandler(
        mockRequest as Request,
        mockResponse as Response,
        vi.fn()
      );

      expect(mockDb.query).toHaveBeenCalledWith('SELECT 1');
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          database: 'connected',
        })
      );
    });

    it('should return unhealthy status when database connection fails', async () => {
      const dbError = new Error('Connection failed');
      mockDb.query = vi.fn().mockRejectedValue(dbError);

      const router = createHealthRouter(mockDb);
      const healthHandler = router.stack[0]?.route?.stack[0]?.handle;

      if (!healthHandler) {
        throw new Error('Health handler not found');
      }

      await healthHandler(
        mockRequest as Request,
        mockResponse as Response,
        vi.fn()
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          database: 'disconnected',
          error: 'Connection failed',
        })
      );
    });
  });

  describe('GET /health/geocoding', () => {
    let originalFetch: typeof global.fetch;
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalFetch = global.fetch;
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      global.fetch = originalFetch;
      process.env = originalEnv;
    });

    it('should return healthy status when geocoding service works', async () => {
      // Mock successful Mapbox response
      const mockFetchResponse = {
        json: vi.fn().mockResolvedValue({
          features: [
            {
              center: [-77.036530, 38.897675], // White House coordinates
              place_name: '1600 Pennsylvania Avenue NW, Washington, DC 20500, United States',
              relevance: 0.95,
            },
          ],
        }),
      };

      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse);

      const router = createHealthRouter(mockDb);
      const geocodingHandler = router.stack[1]?.route?.stack[0]?.handle;

      if (!geocodingHandler) {
        throw new Error('Geocoding health handler not found');
      }

      await geocodingHandler(
        mockRequest as Request,
        mockResponse as Response,
        vi.fn()
      );

      expect(global.fetch).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          provider: 'mapbox',
          test_result: expect.objectContaining({
            latitude: 38.897675,
            longitude: -77.036530,
            confidence: 'high',
          }),
        })
      );
    });

    it('should use configured provider from environment', async () => {
      process.env.GEOCODING_PROVIDER = 'google';

      const mockFetchResponse = {
        json: vi.fn().mockResolvedValue({
          status: 'OK',
          results: [
            {
              geometry: {
                location: { lat: 38.897675, lng: -77.036530 },
                location_type: 'ROOFTOP',
              },
              formatted_address: '1600 Pennsylvania Avenue NW, Washington, DC 20500, USA',
            },
          ],
        }),
      };

      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse);

      const router = createHealthRouter(mockDb);
      const geocodingHandler = router.stack[1]?.route?.stack[0]?.handle;

      if (!geocodingHandler) {
        throw new Error('Geocoding health handler not found');
      }

      await geocodingHandler(
        mockRequest as Request,
        mockResponse as Response,
        vi.fn()
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          provider: 'google',
        })
      );
    });

    it('should return unhealthy status when geocoding returns no results', async () => {
      const mockFetchResponse = {
        json: vi.fn().mockResolvedValue({
          features: [], // No results
        }),
      };

      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse);

      const router = createHealthRouter(mockDb);
      const geocodingHandler = router.stack[1]?.route?.stack[0]?.handle;

      if (!geocodingHandler) {
        throw new Error('Geocoding health handler not found');
      }

      await geocodingHandler(
        mockRequest as Request,
        mockResponse as Response,
        vi.fn()
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          error: 'Geocoding test failed - no result returned',
        })
      );
    });

    it('should return unhealthy status when geocoding API fails', async () => {
      const fetchError = new Error('Network error');
      global.fetch = vi.fn().mockRejectedValue(fetchError);

      const router = createHealthRouter(mockDb);
      const geocodingHandler = router.stack[1]?.route?.stack[0]?.handle;

      if (!geocodingHandler) {
        throw new Error('Geocoding health handler not found');
      }

      await geocodingHandler(
        mockRequest as Request,
        mockResponse as Response,
        vi.fn()
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      // Note: The geocoding service catches errors and returns null,
      // so the health endpoint reports "no result returned" rather than the underlying error
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          error: 'Geocoding test failed - no result returned',
        })
      );
    });

    it('should handle invalid JSON response gracefully', async () => {
      const mockFetchResponse = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      };

      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse);

      const router = createHealthRouter(mockDb);
      const geocodingHandler = router.stack[1]?.route?.stack[0]?.handle;

      if (!geocodingHandler) {
        throw new Error('Geocoding health handler not found');
      }

      await geocodingHandler(
        mockRequest as Request,
        mockResponse as Response,
        vi.fn()
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      // Note: The geocoding service catches JSON parsing errors and returns null,
      // so the health endpoint reports "no result returned"
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          error: 'Geocoding test failed - no result returned',
        })
      );
    });

    it('should handle medium confidence results', async () => {
      const mockFetchResponse = {
        json: vi.fn().mockResolvedValue({
          features: [
            {
              center: [-77.036530, 38.897675],
              place_name: '1600 Pennsylvania Avenue NW, Washington, DC',
              relevance: 0.65, // Medium confidence
            },
          ],
        }),
      };

      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse);

      const router = createHealthRouter(mockDb);
      const geocodingHandler = router.stack[1]?.route?.stack[0]?.handle;

      if (!geocodingHandler) {
        throw new Error('Geocoding health handler not found');
      }

      await geocodingHandler(
        mockRequest as Request,
        mockResponse as Response,
        vi.fn()
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          test_result: expect.objectContaining({
            confidence: 'medium',
          }),
        })
      );
    });

    it('should handle low confidence results', async () => {
      const mockFetchResponse = {
        json: vi.fn().mockResolvedValue({
          features: [
            {
              center: [-77.036530, 38.897675],
              place_name: '1600 Pennsylvania Avenue NW',
              relevance: 0.3, // Low confidence
            },
          ],
        }),
      };

      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse);

      const router = createHealthRouter(mockDb);
      const geocodingHandler = router.stack[1]?.route?.stack[0]?.handle;

      if (!geocodingHandler) {
        throw new Error('Geocoding health handler not found');
      }

      await geocodingHandler(
        mockRequest as Request,
        mockResponse as Response,
        vi.fn()
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          test_result: expect.objectContaining({
            confidence: 'low',
          }),
        })
      );
    });
  });
});
