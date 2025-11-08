import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheService } from '../cache.service.js';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(async () => {
    cacheService = new CacheService();
    await cacheService.initialize();
  });

  afterEach(async () => {
    await cacheService.close();
  });

  it('should get and set values', async () => {
    await cacheService.set('test-key', { foo: 'bar' }, 60);
    const value = await cacheService.get('test-key');

    expect(value).toEqual({ foo: 'bar' });
  });

  it('should return null for non-existent keys', async () => {
    const value = await cacheService.get('non-existent');
    expect(value).toBeNull();
  });

  it('should delete values', async () => {
    await cacheService.set('test-key', 'test-value', 60);
    await cacheService.del('test-key');
    const value = await cacheService.get('test-key');

    expect(value).toBeNull();
  });

  it('should use getOrSet pattern', async () => {
    const factory = vi.fn().mockResolvedValue('computed-value');

    // First call should execute factory
    const value1 = await cacheService.getOrSet('test-key', factory, 60);
    expect(value1).toBe('computed-value');
    expect(factory).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const value2 = await cacheService.getOrSet('test-key', factory, 60);
    expect(value2).toBe('computed-value');
    expect(factory).toHaveBeenCalledTimes(1); // Not called again
  });

  it('should delete by pattern', async () => {
    await cacheService.set('user:1', 'value1', 60);
    await cacheService.set('user:2', 'value2', 60);
    await cacheService.set('org:1', 'value3', 60);

    await cacheService.delPattern('user:*');

    expect(await cacheService.get('user:1')).toBeNull();
    expect(await cacheService.get('user:2')).toBeNull();
    expect(await cacheService.get('org:1')).toBe('value3');
  });

  it('should handle TTL expiration', async () => {
    await cacheService.set('test-key', 'test-value', 1); // 1 second TTL

    // Should exist immediately
    expect(await cacheService.get('test-key')).toBe('test-value');

    // Wait 1.5 seconds
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Should be expired
    expect(await cacheService.get('test-key')).toBeNull();
  });
});
