/**
 * Health Check Routes
 *
 * Provides health check endpoint for monitoring and development
 */

import { Router } from 'express';
import type { Database } from '@care-commons/core';
import { GeocodingService } from '@care-commons/core';

export function createHealthRouter(db: Database): Router {
  const router = Router();

  router.get('/health', async (_req, res) => {
    try {
      // Check database connection
      await db.query('SELECT 1');

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Health check for geocoding service
   * Tests the geocoding service with a known address
   */
  router.get('/health/geocoding', async (_req, res) => {
    const providerEnv = process.env.GEOCODING_PROVIDER;
    const provider = (providerEnv ?? 'mapbox') as 'google' | 'mapbox' | 'nominatim';
    const geocodingService = new GeocodingService(provider);

    // Test geocoding with a known address (White House)
    const testAddress = {
      type: 'HOME' as const,
      line1: '1600 Pennsylvania Avenue NW',
      city: 'Washington',
      state: 'DC',
      postalCode: '20500',
      country: 'US'
    };

    try {
      const result = await geocodingService.geocodeAddress(testAddress);

      if (result !== null) {
        res.json({
          status: 'healthy',
          provider,
          timestamp: new Date().toISOString(),
          test_result: {
            latitude: result.latitude,
            longitude: result.longitude,
            confidence: result.confidence,
            formattedAddress: result.formattedAddress
          }
        });
      } else {
        res.status(503).json({
          status: 'unhealthy',
          provider,
          timestamp: new Date().toISOString(),
          error: 'Geocoding test failed - no result returned'
        });
      }
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        provider,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
