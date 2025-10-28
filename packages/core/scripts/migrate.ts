/**
 * Database migration script
 * 
 * Runs all SQL migrations in order
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Database, initializeDatabase } from '../src/db/connection';

async function runMigrations() {
  console.log('🔄 Starting database migrations...\n');

  // Initialize database connection
  const db = initializeDatabase({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'care_commons',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
  });

  try {
    // Create migrations tracking table
    await db.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Get list of applied migrations
    const appliedResult = await db.query(
      'SELECT migration_name FROM schema_migrations ORDER BY id'
    );
    const appliedMigrations = new Set(
      appliedResult.rows.map((row) => row.migration_name)
    );

    // Read migration files
    const migrationsDir = join(__dirname, '..', 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files`);
    console.log(`${appliedMigrations.size} migrations already applied\n`);

    // Run pending migrations
    let appliedCount = 0;
    for (const file of migrationFiles) {
      if (appliedMigrations.has(file)) {
        console.log(`⏭️  Skipping ${file} (already applied)`);
        continue;
      }

      console.log(`📝 Applying migration: ${file}`);
      const sql = readFileSync(join(migrationsDir, file), 'utf-8');

      await db.transaction(async (client) => {
        // Execute migration SQL
        await client.query(sql);

        // Record migration
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
          [file]
        );
      });

      console.log(`✅ Applied ${file}\n`);
      appliedCount++;
    }

    if (appliedCount === 0) {
      console.log('✨ Database is up to date!');
    } else {
      console.log(`\n✅ Successfully applied ${appliedCount} migration(s)`);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Run migrations
runMigrations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
