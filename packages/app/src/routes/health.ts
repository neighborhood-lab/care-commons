/**
 * Health Check Routes
 *
 * Provides comprehensive health check endpoint for monitoring and development
 */

import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { Database } from '@folkcare/core';
import { GeocodingService } from '@folkcare/core';
import { testUpstashConnection, getUpstashClient } from '../config/upstash.js';
import { getRedisClient } from '../middleware/rate-limit.js';

const execAsync = promisify(exec);

/**
 * Get disk space information
 * Returns disk usage for the root filesystem
 */
async function getDiskSpace(): Promise<{ used: number; available: number; total: number; percentUsed: number }> {
  try {
    // Use df command to get disk space (works on Linux/macOS)
    const { stdout } = await execAsync('df -k / | tail -1');
    const parts = stdout.trim().split(/\s+/);

    // df output: Filesystem 1K-blocks Used Available Use% Mounted
    // Validate we have enough parts
    if (parts.length < 5) {
      return { used: 0, available: 0, total: 0, percentUsed: 0 };
    }

    const total = parseInt(parts[1] ?? '0') * 1024; // Convert KB to bytes
    const used = parseInt(parts[2] ?? '0') * 1024;
    const available = parseInt(parts[3] ?? '0') * 1024;
    const percentUsed = parseInt(parts[4] ?? '0');

    return { used, available, total, percentUsed };
  } catch (error) {
    // Fallback if df command fails (e.g., on Windows)
    return { used: 0, available: 0, total: 0, percentUsed: 0 };
  }
}

/**
 * Get memory usage information
 * Returns Node.js process memory usage and system memory
 */
function getMemoryUsage() {
  const mem = process.memoryUsage();
  const totalMemory = require('os').totalmem();
  const freeMemory = require('os').freemem();
  const usedMemory = totalMemory - freeMemory;

  return {
    process: {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      rss: mem.rss, // Resident Set Size
    },
    system: {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      percentUsed: Math.round((usedMemory / totalMemory) * 100),
    },
  };
}

export function createHealthRouter(db: Database): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    try {
      // Check database connection
      const dbStart = Date.now();
      await db.query('SELECT 1');
      const dbLatency = Date.now() - dbStart;

      // Check Redis connections
      const upstashClient = getUpstashClient();
      const rateLimitClient = getRedisClient();
      const redisStatus = {
        upstash: (upstashClient !== null) ? 'configured' : 'not-configured',
        rateLimit: (rateLimitClient !== null) ? 'connected' : 'in-memory-fallback',
      };

      // Test Upstash connection if available
      if (upstashClient !== null) {
        const upstashHealthy = await testUpstashConnection();
        redisStatus.upstash = upstashHealthy ? 'healthy' : 'unhealthy';
      }

      // Get resource usage
      const memory = getMemoryUsage();
      const disk = await getDiskSpace();

      // Determine overall status
      const isHealthy =
        dbLatency < 1000 && // Database responds within 1s
        memory.system.percentUsed < 95 && // System memory < 95%
        disk.percentUsed < 90; // Disk usage < 90%

      res.json({
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        checks: {
          database: {
            status: dbLatency < 1000 ? 'ok' : 'slow',
            latency: dbLatency,
          },
          redis: {
            status: redisStatus.upstash === 'healthy' || redisStatus.upstash === 'not-configured' ? 'ok' : 'unhealthy',
            upstash: redisStatus.upstash,
            rateLimit: redisStatus.rateLimit,
          },
          api: {
            status: 'ok',
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
          },
          memory: {
            status: memory.system.percentUsed < 90 ? 'ok' : 'high',
            system: {
              used: memory.system.used,
              free: memory.system.free,
              total: memory.system.total,
              percentUsed: memory.system.percentUsed,
            },
            process: {
              heapUsed: memory.process.heapUsed,
              heapTotal: memory.process.heapTotal,
              rss: memory.process.rss,
            },
          },
          disk: {
            status: disk.percentUsed < 85 ? 'ok' : disk.percentUsed < 95 ? 'warning' : 'critical',
            used: disk.used,
            available: disk.available,
            total: disk.total,
            percentUsed: disk.percentUsed,
          },
        },
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
      });
    }
  });

  /**
   * Health check for geocoding service
   * Tests the geocoding service with a known address
   */
  router.get('/geocoding', async (_req, res) => {
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
