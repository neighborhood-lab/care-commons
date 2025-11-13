import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CacheService, initCacheService, getCacheService } from '../cache.service';

describe('CacheService', () => {
  describe('In-Memory Cache', () => {
    let cache: CacheService;

    beforeEach(async () => {
      cache = new CacheService();
      await cache.initialize();
    });

    afterEach(async () => {
      await cache.close();
    });

    describe('get/set operations', () => {
      it('should set and get a value', async () => {
        await cache.set('test-key', { data: 'test-value' });
        const result = await cache.get('test-key');
        expect(result).toEqual({ data: 'test-value' });
      });

      it('should return null for non-existent key', async () => {
        const result = await cache.get('non-existent');
        expect(result).toBeNull();
      });

      it('should handle different data types', async () => {
        await cache.set('string', 'hello');
        await cache.set('number', 42);
        await cache.set('boolean', true);
        await cache.set('object', { nested: { value: 'test' } });
        await cache.set('array', [1, 2, 3]);

        expect(await cache.get('string')).toBe('hello');
        expect(await cache.get('number')).toBe(42);
        expect(await cache.get('boolean')).toBe(true);
        expect(await cache.get('object')).toEqual({ nested: { value: 'test' } });
        expect(await cache.get('array')).toEqual([1, 2, 3]);
      });

      it('should respect TTL and expire values', async () => {
        await cache.set('expiring-key', 'value', 0.1);
        
        const result1 = await cache.get('expiring-key');
        expect(result1).toBe('value');

        await new Promise(resolve => setTimeout(resolve, 150));

        const result2 = await cache.get('expiring-key');
        expect(result2).toBeNull();
      });
    });

    describe('del operations', () => {
      it('should delete a key', async () => {
        await cache.set('delete-me', 'value');
        expect(await cache.get('delete-me')).toBe('value');

        await cache.del('delete-me');
        expect(await cache.get('delete-me')).toBeNull();
      });
    });

    describe('delPattern operations', () => {
      beforeEach(async () => {
        await cache.set('user:1:profile', { name: 'Alice' });
        await cache.set('user:1:settings', { theme: 'dark' });
        await cache.set('user:2:profile', { name: 'Bob' });
        await cache.set('post:1', { title: 'Test' });
      });

      it('should delete keys matching pattern', async () => {
        await cache.delPattern('user:1:*');

        expect(await cache.get('user:1:profile')).toBeNull();
        expect(await cache.get('user:1:settings')).toBeNull();
        expect(await cache.get('user:2:profile')).toEqual({ name: 'Bob' });
        expect(await cache.get('post:1')).toEqual({ title: 'Test' });
      });
    });

    describe('getOrSet operations', () => {
      it('should return cached value if exists', async () => {
        await cache.set('cached', 'existing-value');

        const factory = vi.fn().mockResolvedValue('new-value');
        const result = await cache.getOrSet('cached', factory);

        expect(result).toBe('existing-value');
        expect(factory).not.toHaveBeenCalled();
      });

      it('should compute and cache value if not exists', async () => {
        const factory = vi.fn().mockResolvedValue('computed-value');
        const result = await cache.getOrSet('new-key', factory);

        expect(result).toBe('computed-value');
        expect(factory).toHaveBeenCalledTimes(1);

        const cached = await cache.get('new-key');
        expect(cached).toBe('computed-value');
      });
    });

    describe('getStats', () => {
      it('should return memory cache stats', async () => {
        await cache.set('key1', 'value1');
        await cache.set('key2', 'value2');

        const stats = await cache.getStats();

        expect(stats.type).toBe('memory');
        if (stats.type === 'memory') {
          expect(stats.size).toBe(2);
        }
      });
    });

    describe('clearAll', () => {
      it('should clear all cache entries', async () => {
        await cache.set('key1', 'value1');
        await cache.set('key2', 'value2');

        await cache.clearAll();

        expect(await cache.get('key1')).toBeNull();
        expect(await cache.get('key2')).toBeNull();
      });
    });
  });

  describe('Singleton Functions', () => {
    it('should initialize cache service singleton', async () => {
      const cache = await initCacheService();
      expect(cache).toBeInstanceOf(CacheService);
      await cache.close();
    });

    it('should get initialized cache service', async () => {
      await initCacheService();
      const cache = getCacheService();
      expect(cache).toBeInstanceOf(CacheService);
      await cache.close();
    });
  });
});
