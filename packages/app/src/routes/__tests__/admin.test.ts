import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import adminRoutes from '../admin.js';
import { initCacheService, getCacheService } from '@care-commons/core/service/cache.service';

describe('Admin Routes', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    app.use('/admin', adminRoutes);
    
    // Initialize cache service
    await initCacheService();
  });

  afterEach(async () => {
    const cache = getCacheService();
    await cache.clearAll();
    await cache.close();
  });

  describe('GET /admin/cache/stats', () => {
    it('should return memory cache statistics', async () => {
      const cache = getCacheService();
      await cache.set('test-key-1', 'value1');
      await cache.set('test-key-2', 'value2');

      const response = await request(app)
        .get('/admin/cache/stats')
        .expect(200);

      expect(response.body).toHaveProperty('type', 'memory');
      expect(response.body).toHaveProperty('size');
      expect(response.body.size).toBeGreaterThanOrEqual(2);
    });

    it('should handle errors gracefully', async () => {
      // Force an error by breaking the cache service
      const cache = getCacheService();
      const originalGetStats = cache.getStats.bind(cache);
      vi.spyOn(cache, 'getStats').mockRejectedValueOnce(new Error('Test error'));

      const response = await request(app)
        .get('/admin/cache/stats')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to get cache stats');

      // Restore
      cache.getStats = originalGetStats;
    });
  });

  describe('POST /admin/cache/clear', () => {
    beforeEach(async () => {
      const cache = getCacheService();
      await cache.set('user:1:profile', { name: 'Alice' });
      await cache.set('user:2:profile', { name: 'Bob' });
      await cache.set('post:1', { title: 'Test Post' });
    });

    it('should clear cache by pattern', async () => {
      const response = await request(app)
        .post('/admin/cache/clear')
        .send({ pattern: 'user:*' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('user:*');

      const cache = getCacheService();
      expect(await cache.get('user:1:profile')).toBeNull();
      expect(await cache.get('user:2:profile')).toBeNull();
      expect(await cache.get('post:1')).toEqual({ title: 'Test Post' });
    });

    it('should clear all cache when no pattern provided', async () => {
      const response = await request(app)
        .post('/admin/cache/clear')
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Cleared all cache');

      const cache = getCacheService();
      expect(await cache.get('user:1:profile')).toBeNull();
      expect(await cache.get('user:2:profile')).toBeNull();
      expect(await cache.get('post:1')).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const cache = getCacheService();
      const originalDelPattern = cache.delPattern.bind(cache);
      vi.spyOn(cache, 'delPattern').mockRejectedValueOnce(new Error('Test error'));

      const response = await request(app)
        .post('/admin/cache/clear')
        .send({ pattern: 'test:*' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to clear cache');

      cache.delPattern = originalDelPattern;
    });
  });
});
