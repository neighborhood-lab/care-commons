/**
 * Database configuration and initialization
 * 
 * This module sets up WatermelonDB for offline-first data persistence.
 * It handles database initialization, migrations, and provides the database
 * instance for use throughout the mobile app.
 */

import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema.js';
import { Visit } from './models/index.js';

// Configure SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  // Production apps should use JSI for better performance
  jsi: true,
  // Migrations will be added here as schema evolves
  migrations: [],
  onSetUpError: (error: Error) => {
    // Handle setup errors - could send to error tracking service
    console.error('Database setup error:', error);
  },
});

// Create database instance
export const database = new Database({
  adapter,
  modelClasses: [
    Visit,
    // Add other models here
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
    const visits = await database.get<Visit>('visits').query().fetchCount();
    
    return {
      isHealthy: true,
      collections: {
        visits,
      },
    };
  } catch (error) {
    return {
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
