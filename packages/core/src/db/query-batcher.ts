/**
 * Query Batching Utility
 *
 * Helps prevent N+1 query problems by batching multiple single-record
 * queries into a single query with an IN clause.
 *
 * Inspired by Facebook's DataLoader pattern.
 */

export interface BatchLoader<K, V> {
  /**
   * Load a single item by key
   */
  load(key: K): Promise<V | null>;

  /**
   * Load multiple items by keys
   */
  loadMany(keys: K[]): Promise<Array<V | null>>;

  /**
   * Clear the cache for a specific key
   */
  clear(key: K): void;

  /**
   * Clear all cached data
   */
  clearAll(): void;
}

interface BatchLoaderOptions<K, V> {
  /**
   * Function to fetch multiple items by their keys
   * Should return results in the same order as keys
   */
  batchLoadFn: (keys: K[]) => Promise<Array<V | null>>;

  /**
   * Maximum batch size (default: 100)
   */
  maxBatchSize?: number;

  /**
   * Batch window in milliseconds (default: 10ms)
   * Requests within this window will be batched together
   */
  batchWindowMs?: number;

  /**
   * Enable caching (default: true)
   */
  cache?: boolean;
}

/**
 * Create a batch loader for efficient data loading
 *
 * Example usage:
 * ```typescript
 * const userLoader = createBatchLoader<string, User>({
 *   batchLoadFn: async (userIds) => {
 *     const result = await db.query(
 *       'SELECT * FROM users WHERE id = ANY($1)',
 *       [userIds]
 *     );
 *     // Map results back to input order
 *     return userIds.map(id =>
 *       result.rows.find(user => user.id === id) || null
 *     );
 *   }
 * });
 *
 * // Later in code:
 * const user1 = await userLoader.load('user-1');
 * const user2 = await userLoader.load('user-2');
 * // These will be batched into a single query
 * ```
 */
export function createBatchLoader<K, V>(
  options: BatchLoaderOptions<K, V>
): BatchLoader<K, V> {
  const {
    batchLoadFn,
    maxBatchSize = 100,
    batchWindowMs = 10,
    cache = true,
  } = options;

  // Cache for loaded items
  const cacheMap = new Map<K, V | null>();

  // Queue of pending load requests
  let pendingKeys: K[] = [];
  let pendingPromises: Array<{
    key: K;
    resolve: (value: V | null) => void;
    reject: (error: unknown) => void;
  }> = [];

  // Timer for batch window
  let batchTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Execute the batched load
   */
  async function executeBatch(): Promise<void> {
    if (pendingKeys.length === 0) {
      return;
    }

    const keysToLoad = pendingKeys;
    const promisesToResolve = pendingPromises;

    // Reset for next batch
    pendingKeys = [];
    pendingPromises = [];
    batchTimer = null;

    try {
      // Execute batch load
      const results = await batchLoadFn(keysToLoad);

      if (results.length !== keysToLoad.length) {
        throw new Error(
          `batchLoadFn must return array of same length as keys. ` +
          `Expected ${keysToLoad.length}, got ${results.length}`
        );
      }

      // Cache results and resolve promises
      for (const [index, key] of keysToLoad.entries()) {
        const value = results[index];

        if (cache) {
          cacheMap.set(key, value ?? null);
        }

        promisesToResolve[index]?.resolve(value ?? null);
      }
    } catch (error) {
      // Reject all pending promises
      for (const promise of promisesToResolve) {
        promise.reject(error);
      }
    }
  }

  /**
   * Schedule a batch execution
   */
  function scheduleBatch(): void {
    if (batchTimer !== null) {
      return; // Already scheduled
    }

    batchTimer = setTimeout(() => {
      void executeBatch();
    }, batchWindowMs);
  }

  const loader: BatchLoader<K, V> = {
    load: async (key: K): Promise<V | null> => {
      // Check cache first
      if (cache && cacheMap.has(key)) {
        return cacheMap.get(key) ?? null;
      }

      // Add to pending batch
      return await new Promise<V | null>((resolve, reject) => {
        pendingKeys.push(key);
        pendingPromises.push({ key, resolve, reject });

        // If batch is full, execute immediately
        if (pendingKeys.length >= maxBatchSize) {
          if (batchTimer !== null) {
            clearTimeout(batchTimer);
            batchTimer = null;
          }
          void executeBatch();
        } else {
          // Otherwise schedule for later
          scheduleBatch();
        }
      });
    },

    loadMany: async (keys: K[]): Promise<Array<V | null>> => {
      return await Promise.all(keys.map(key => loader.load(key)));
    },

    clear: (key: K): void => {
      cacheMap.delete(key);
    },

    clearAll: (): void => {
      cacheMap.clear();
      if (batchTimer !== null) {
        clearTimeout(batchTimer);
        batchTimer = null;
      }
      pendingKeys = [];
      pendingPromises = [];
    },
  };

  return loader;
}

/**
 * Helper to create a database query batcher
 *
 * Example:
 * ```typescript
 * const getUsersByIds = createQueryBatcher<string, User>(
 *   db,
 *   'SELECT * FROM users WHERE id = ANY($1)',
 *   (row) => row.id
 * );
 * ```
 */
export function createQueryBatcher<K, V extends Record<string, unknown>>(
  queryFn: (keys: K[]) => Promise<V[]>,
  keyExtractor: (row: V) => K,
  options?: Omit<BatchLoaderOptions<K, V>, 'batchLoadFn'>
): BatchLoader<K, V> {
  return createBatchLoader<K, V>({
    ...options,
    batchLoadFn: async (keys: K[]) => {
      const results = await queryFn(keys);

      // Create a map for O(1) lookup
      const resultMap = new Map<K, V>();
      for (const result of results) {
        const key = keyExtractor(result);
        resultMap.set(key, result);
      }

      // Return results in same order as keys
      return keys.map(key => resultMap.get(key) ?? null);
    },
  });
}
