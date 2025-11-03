/**
 * Database rollback script using Knex
 *
 * Rolls back the last batch of migrations
 */

import dotenv from 'dotenv';
import knex, { Knex } from 'knex';

dotenv.config({ path: '.env', quiet: true });

async function rollbackMigrations() {
  console.log('🔄 Rolling back last migration batch...\n');

  // Determine environment
  const environment = process.env.NODE_ENV || 'development';

  // Build Knex config inline to avoid tsconfig issues
  const config: Knex.Config = {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database:
        environment === 'test'
          ? (process.env.DB_NAME || 'care_commons') + '_test'
          : process.env.DB_NAME || 'care_commons',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    migrations: {
      directory: './packages/core/migrations',
      tableName: 'knex_migrations',
      extension: 'ts',
      loadExtensions: ['.ts'],
    },
  };

  // Initialize Knex
  const db = knex(config);

  try {
    // Rollback last batch
    const [batchNo, migrations] = await db.migrate.rollback();

    if (migrations.length === 0) {
      console.log('✨ No migrations to rollback!');
    } else {
      console.log(`✅ Batch ${batchNo} rolled back: ${migrations.length} migration(s)`);
      migrations.forEach((migration: string) => {
        console.log(`   📝 ${migration}`);
      });
    }

    // Show current migration status
    const [completedMigrations] = await db.migrate.list();
    console.log(`\n📊 Remaining migrations: ${completedMigrations.length}`);
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Run rollback
rollbackMigrations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
