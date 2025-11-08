# Task 0031: Implement Caching Layer for Performance

**Priority**: 🔴 CRITICAL
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 8-10 hours

## Context

Many database queries are repeated frequently (user profiles, organization settings, state compliance rules, etc.). Without caching, every request hits the database, increasing latency and database load. A well-designed caching layer can reduce response times by 80%+ and database load by 60%+.

## Problem Statement

Current issues:
- User profile fetched on every authenticated request
- Organization settings queried repeatedly
- State compliance rules loaded for every EVV operation
- Shift matching scores recalculated unnecessarily
- Reference data (service codes, task categories) loaded from DB repeatedly
- No cache invalidation strategy

## Task

### 1. Install Caching Dependencies

```bash
npm install ioredis --save
npm install @types/ioredis --save-dev
npm install cache-manager cache-manager-ioredis-yet --save
```

### 2. Create Cache Service

**File**: `packages/core/src/services/cache.service.ts`

```typescript
import { Redis } from 'ioredis';
import { caching, Cache } from 'cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  ttl: number; // Default TTL in seconds
}

export class CacheService {
  private cache: Cache | null = null;
  private redis: Redis | null = null;
  private memoryCache: Map<string, { value: any; expires: number }> = new Map();
  private isRedisAvailable = false;

  constructor(private config?: CacheConfig) {}

  async initialize(): Promise<void> {
    if (!this.config) {
      console.log('Cache service: Using in-memory cache (no Redis configured)');
      this.isRedisAvailable = false;
      return;
    }

    try {
      this.redis = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db || 0,
        retryStrategy: (times) => {
          if (times > 3) {
            console.error('Redis connection failed after 3 retries, falling back to memory cache');
            this.isRedisAvailable = false;
            return null; // Stop retrying
          }
          return Math.min(times * 100, 2000); // Exponential backoff
        },
      });

      this.cache = await caching(
        redisStore({
          client: this.redis,
          ttl: this.config.ttl,
        })
      );

      this.isRedisAvailable = true;
      console.log('Cache service: Redis connected successfully');
    } catch (error) {
      console.error('Failed to initialize Redis cache:', error);
      console.log('Cache service: Falling back to in-memory cache');
      this.isRedisAvailable = false;
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isRedisAvailable && this.cache) {
        return await this.cache.get<T>(key);
      } else {
        // Memory cache fallback
        const cached = this.memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
          return cached.value as T;
        }
        if (cached) {
          this.memoryCache.delete(key); // Clean up expired
        }
        return null;
      }
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (this.isRedisAvailable && this.cache) {
        await this.cache.set(key, value, ttl ? ttl * 1000 : undefined);
      } else {
        // Memory cache fallback
        const expiresAt = Date.now() + (ttl || this.config?.ttl || 300) * 1000;
        this.memoryCache.set(key, { value, expires: expiresAt });

        // Basic memory cache cleanup (remove old entries when size > 1000)
        if (this.memoryCache.size > 1000) {
          const now = Date.now();
          for (const [k, v] of this.memoryCache.entries()) {
            if (v.expires < now) {
              this.memoryCache.delete(k);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<void> {
    try {
      if (this.isRedisAvailable && this.cache) {
        await this.cache.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        // Memory cache: simple prefix matching
        const keysToDelete: string[] = [];
        const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => this.memoryCache.delete(key));
      }
    } catch (error) {
      console.error(`Cache delete pattern error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Get or compute a value
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Singleton instance
let cacheService: CacheService | null = null;

export const initCacheService = async (config?: CacheConfig): Promise<CacheService> => {
  if (!cacheService) {
    cacheService = new CacheService(config);
    await cacheService.initialize();
  }
  return cacheService;
};

export const getCacheService = (): CacheService => {
  if (!cacheService) {
    throw new Error('Cache service not initialized. Call initCacheService first.');
  }
  return cacheService;
};
```

### 3. Add Cache Keys Constants

**File**: `packages/core/src/constants/cache-keys.ts`

```typescript
export const CacheKeys = {
  // User caching
  user: (userId: string) => `user:${userId}`,
  userByEmail: (email: string) => `user:email:${email}`,
  userPermissions: (userId: string) => `user:${userId}:permissions`,
  userOrganizations: (userId: string) => `user:${userId}:organizations`,

  // Organization caching
  organization: (orgId: string) => `org:${orgId}`,
  organizationSettings: (orgId: string) => `org:${orgId}:settings`,
  organizationBranches: (orgId: string) => `org:${orgId}:branches`,

  // Client caching
  client: (clientId: string) => `client:${clientId}`,
  clientWithAddress: (clientId: string) => `client:${clientId}:address`,
  clientsByOrganization: (orgId: string) => `clients:org:${orgId}`,

  // Caregiver caching
  caregiver: (caregiverId: string) => `caregiver:${caregiverId}`,
  caregiverCredentials: (caregiverId: string) => `caregiver:${caregiverId}:credentials`,
  caregiversByOrganization: (orgId: string) => `caregivers:org:${orgId}`,

  // Visit caching
  visit: (visitId: string) => `visit:${visitId}`,
  visitsByCaregiver: (caregiverId: string, date: string) =>
    `visits:caregiver:${caregiverId}:${date}`,
  visitsByClient: (clientId: string, date: string) =>
    `visits:client:${clientId}:${date}`,

  // EVV state config caching
  evvStateConfig: (orgId: string, state: string) => `evv:config:${orgId}:${state}`,

  // Shift matching caching
  shiftMatchScores: (visitId: string) => `shift:match:${visitId}`,

  // Care plan caching
  carePlan: (planId: string) => `careplan:${planId}`,
  carePlansByClient: (clientId: string) => `careplans:client:${clientId}`,

  // Reference data (rarely changes)
  serviceTypes: () => 'ref:service_types',
  taskCategories: () => 'ref:task_categories',
  stateComplianceRules: (state: string) => `ref:compliance:${state}`,

  // Pattern matchers for invalidation
  patterns: {
    user: (userId: string) => `user:${userId}*`,
    organization: (orgId: string) => `org:${orgId}*`,
    client: (clientId: string) => `client:${clientId}*`,
    caregiver: (caregiverId: string) => `caregiver:${caregiverId}*`,
    visit: (visitId: string) => `visit:${visitId}*`,
  },
};

export const CacheTTL = {
  SHORT: 60, // 1 minute - frequently changing data
  MEDIUM: 300, // 5 minutes - moderately stable data
  LONG: 3600, // 1 hour - stable data
  VERY_LONG: 86400, // 24 hours - reference data
};
```

### 4. Update Services to Use Caching

**File**: `verticals/client-demographics/src/services/client.service.ts`

```typescript
import { getCacheService } from '@care-commons/core/services/cache.service';
import { CacheKeys, CacheTTL } from '@care-commons/core/constants/cache-keys';

export class ClientService implements IClientProvider {
  async getClientById(clientId: string): Promise<Client | null> {
    const cache = getCacheService();

    return cache.getOrSet(
      CacheKeys.client(clientId),
      async () => {
        // Actual database query
        const client = await this.db('clients')
          .where({ id: clientId, deleted_at: null })
          .first();
        return client || null;
      },
      CacheTTL.MEDIUM
    );
  }

  async getClientWithAddress(clientId: string): Promise<ClientWithAddress | null> {
    const cache = getCacheService();

    return cache.getOrSet(
      CacheKeys.clientWithAddress(clientId),
      async () => {
        const client = await this.db('clients')
          .leftJoin('addresses', 'clients.service_address_id', 'addresses.id')
          .where({ 'clients.id': clientId, 'clients.deleted_at': null })
          .select('clients.*', 'addresses.*')
          .first();
        return client || null;
      },
      CacheTTL.MEDIUM
    );
  }

  async updateClient(clientId: string, data: UpdateClientInput): Promise<Client> {
    const cache = getCacheService();

    // Update database
    const updated = await this.db('clients')
      .where({ id: clientId })
      .update(data)
      .returning('*');

    // Invalidate cache
    await cache.delPattern(CacheKeys.patterns.client(clientId));

    return updated[0];
  }
}
```

**File**: `packages/core/src/services/auth.service.ts`

```typescript
import { getCacheService } from './cache.service';
import { CacheKeys, CacheTTL } from '../constants/cache-keys';

export class AuthService {
  async getUserById(userId: string): Promise<User | null> {
    const cache = getCacheService();

    return cache.getOrSet(
      CacheKeys.user(userId),
      async () => {
        const user = await this.db('users')
          .where({ id: userId })
          .first();
        return user || null;
      },
      CacheTTL.SHORT // User data changes frequently
    );
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const cache = getCacheService();

    return cache.getOrSet(
      CacheKeys.userPermissions(userId),
      async () => {
        const permissions = await this.db('user_permissions')
          .where({ user_id: userId })
          .select('*');
        return permissions;
      },
      CacheTTL.MEDIUM // Permissions don't change often
    );
  }
}
```

**File**: `verticals/time-tracking-evv/src/services/evv.service.ts`

```typescript
import { getCacheService } from '@care-commons/core/services/cache.service';
import { CacheKeys, CacheTTL } from '@care-commons/core/constants/cache-keys';

export class EVVService {
  async getEVVStateConfig(organizationId: string, state: string): Promise<EVVStateConfig> {
    const cache = getCacheService();

    return cache.getOrSet(
      CacheKeys.evvStateConfig(organizationId, state),
      async () => {
        const config = await this.db('evv_state_config')
          .where({ organization_id: organizationId, state })
          .first();
        return config;
      },
      CacheTTL.LONG // Compliance rules rarely change
    );
  }
}
```

### 5. Cache Reference Data

**File**: `packages/core/src/services/reference-data.service.ts`

```typescript
import { getCacheService } from './cache.service';
import { CacheKeys, CacheTTL } from '../constants/cache-keys';

export class ReferenceDataService {
  async getServiceTypes(): Promise<ServiceType[]> {
    const cache = getCacheService();

    return cache.getOrSet(
      CacheKeys.serviceTypes(),
      async () => {
        return await this.db('service_types').select('*');
      },
      CacheTTL.VERY_LONG // Reference data rarely changes
    );
  }

  async getTaskCategories(): Promise<TaskCategory[]> {
    const cache = getCacheService();

    return cache.getOrSet(
      CacheKeys.taskCategories(),
      async () => {
        return await this.db('task_categories').select('*');
      },
      CacheTTL.VERY_LONG
    );
  }

  async getStateComplianceRules(state: string): Promise<ComplianceRules> {
    const cache = getCacheService();

    return cache.getOrSet(
      CacheKeys.stateComplianceRules(state),
      async () => {
        return await this.db('state_compliance_rules')
          .where({ state })
          .first();
      },
      CacheTTL.VERY_LONG
    );
  }
}
```

### 6. Initialize Cache Service

**File**: `packages/app/src/index.ts`

```typescript
import { initCacheService } from '@care-commons/core/services/cache.service';

async function startServer() {
  // Initialize cache service
  const cacheConfig = process.env.REDIS_URL
    ? {
        host: new URL(process.env.REDIS_URL).hostname,
        port: parseInt(new URL(process.env.REDIS_URL).port || '6379'),
        password: new URL(process.env.REDIS_URL).password || undefined,
        ttl: 300, // 5 minutes default
      }
    : undefined;

  await initCacheService(cacheConfig);

  // ... rest of server initialization
}
```

### 7. Add Cache Warming

**File**: `packages/core/src/services/cache-warmer.service.ts`

```typescript
import { getCacheService } from './cache.service';
import { ReferenceDataService } from './reference-data.service';
import { CacheKeys } from '../constants/cache-keys';

export class CacheWarmerService {
  constructor(
    private referenceDataService: ReferenceDataService
  ) {}

  /**
   * Warm up cache with frequently accessed data
   * Run this on server startup
   */
  async warmCache(): Promise<void> {
    console.log('Warming cache...');

    try {
      // Warm reference data
      await this.referenceDataService.getServiceTypes();
      await this.referenceDataService.getTaskCategories();

      // Warm state compliance rules for all supported states
      const states = ['TX', 'FL', 'OH', 'PA', 'GA', 'NC', 'AZ'];
      await Promise.all(
        states.map(state =>
          this.referenceDataService.getStateComplianceRules(state)
        )
      );

      console.log('Cache warmed successfully');
    } catch (error) {
      console.error('Failed to warm cache:', error);
    }
  }
}
```

### 8. Add Cache Monitoring Endpoint

**File**: `packages/app/src/routes/admin.routes.ts`

```typescript
import { getCacheService } from '@care-commons/core/services/cache.service';

router.get('/cache/stats', authenticate, authorize(['admin']), async (req, res) => {
  const cache = getCacheService();

  // If using Redis, get stats
  if (cache['redis']) {
    const info = await cache['redis'].info();
    res.json({
      type: 'redis',
      info: parseRedisInfo(info),
    });
  } else {
    res.json({
      type: 'memory',
      size: cache['memoryCache'].size,
    });
  }
});

router.post('/cache/clear', authenticate, authorize(['admin']), async (req, res) => {
  const cache = getCacheService();
  const { pattern } = req.body;

  if (pattern) {
    await cache.delPattern(pattern);
    res.json({ message: `Cleared cache for pattern: ${pattern}` });
  } else {
    // Clear all cache
    if (cache['redis']) {
      await cache['redis'].flushdb();
    } else {
      cache['memoryCache'].clear();
    }
    res.json({ message: 'Cleared all cache' });
  }
});
```

### 9. Add Tests

**File**: `packages/core/src/services/__tests__/cache.service.test.ts`

```typescript
import { CacheService } from '../cache.service';

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
    const factory = jest.fn().mockResolvedValue('computed-value');

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
```

## Acceptance Criteria

- [ ] Cache service implemented with Redis and memory fallback
- [ ] Cache keys defined for all major entities
- [ ] TTL constants defined for different data types
- [ ] User, client, caregiver services use caching
- [ ] EVV state config cached
- [ ] Reference data cached with long TTL
- [ ] Cache invalidation on updates
- [ ] Cache warming on server startup
- [ ] Admin endpoints for cache monitoring
- [ ] Tests written with 80%+ coverage
- [ ] Documentation updated

## Testing Checklist

1. **Unit Tests**: Cache service methods work correctly
2. **Integration Tests**: Services use cache and invalidate properly
3. **Performance Test**: Measure query time with/without cache
4. **Load Test**: Verify cache handles high concurrency

## Performance Impact

Expected improvements:
- User profile queries: 150ms → 5ms (97% faster)
- Organization settings: 200ms → 5ms (97.5% faster)
- Reference data: 100ms → 2ms (98% faster)
- Database load: -60% queries

## Documentation

Update:
- API documentation with caching behavior
- Deployment guide with Redis setup
- Performance tuning guide

## Dependencies

**Blocks**: None
**Depends on**: None (Redis optional)

## Priority Justification

This is **CRITICAL** because:
1. Performance improvement - 80%+ faster responses
2. Database load reduction - 60% fewer queries
3. Cost savings - reduced database instance size needs
4. Better user experience - faster page loads

---

**Next Task**: 0032 - Security Hardening and Penetration Testing
