/**
 * WatermelonDB Database for Web - Offline-first IndexedDB storage
 * 
 * This module sets up WatermelonDB for the web application using IndexedDB
 * as the underlying storage mechanism. It provides offline-first capabilities
 * similar to the mobile app but optimized for web browsers.
 */

import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { schema } from './schema.js';

/**
 * Configure LokiJS adapter for web (uses IndexedDB)
 * 
 * LokiJS is used for web as it provides better performance than the SQLite
 * adapter in browsers and integrates seamlessly with IndexedDB.
 */
const adapter = new LokiJSAdapter({
  schema,
  // Use web worker for better performance (offloads DB operations)
  useWebWorker: false, // Set to true if using web workers
  // Use IndexedDB for persistence
  useIncrementalIndexedDB: true,
  // Database name
  dbName: 'care_commons_offline',
});

/**
 * Create database instance
 * 
 * This is a singleton that should be imported throughout the app.
 * All WatermelonDB models will be registered here.
 */
export const database = new Database({
  adapter,
  modelClasses: [
    // Models will be added here as they are created
    // Visit,
    // Task,
    // Client,
    // TimeEntry,
    // SyncQueue,
  ],
});

/**
 * Reset database (for development/testing only)
 * WARNING: This deletes all local data!
 */
export async function resetDatabase(): Promise<void> {
  await database.write(async () => {
    await database.unsafeResetDatabase();
  });
}

/**
 * Get database health status
 */
export async function getDatabaseStatus() {
  try {
    // Test basic query operation
    const syncQueueCount = await database
      .get('sync_queue')
      .query()
      .fetchCount();

    return {
      isHealthy: true,
      collections: {
        syncQueue: syncQueueCount,
      },
    };
  } catch (error) {
    return {
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Clear all synced items from sync queue (housekeeping)
 */
export async function clearSyncedItems(olderThanDays: number = 7): Promise<number> {
  const cutoffTimestamp = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
  
  const syncedItems = await database
    .get('sync_queue')
    .query()
    .fetch();

  const itemsToDelete = syncedItems.filter(item => {
    const record = item as unknown as { status: string; syncedAt: number | null };
    return (
      record.status === 'SYNCED' &&
      record.syncedAt !== null &&
      record.syncedAt < cutoffTimestamp
    );
  });

  await database.write(async () => {
    for (const item of itemsToDelete) {
      await item.destroyPermanently();
    }
  });

  return itemsToDelete.length;
}
