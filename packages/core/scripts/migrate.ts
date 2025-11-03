/**
 * Database migration script using Knex
 *
 * Runs all Knex migrations
 */

import dotenv from 'dotenv';
import knex, { Knex } from 'knex';

dotenv.config({ path: '.env', quiet: true });

const env = process.env.NODE_ENV || 'development';
const dbName = process.env.DB_NAME || 'care_commons';

// Use DATABASE_URL if provided, otherwise build from individual DB_* variables
const connectionConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

async function runMigrations() {
  console.log('🔄 Starting database migrations with Knex...\n');

  // Build connection config
  let connection;
  if (process.env.DATABASE_URL) {
    connection = connectionConfig; // Already contains connectionString
  } else {
    const database = env === 'test' ? `${dbName}_test` : dbName;
    connection = { ...connectionConfig, database };
  }

  // Build Knex config inline to avoid tsconfig issues
  const config: Knex.Config = {
    client: 'postgresql',
    connection,
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
    // Run migrations
    const [batchNo, migrations] = await db.migrate.latest();

    if (migrations.length === 0) {
      console.log('✨ Database is already up to date!');
    } else {
      console.log(`✅ Batch ${batchNo} run: ${migrations.length} migration(s)`);
      migrations.forEach((migration: string) => {
        console.log(`   📝 ${migration}`);
      });
    }

    // Show current migration status
    const [completedMigrations] = await db.migrate.list();
    console.log(`\n📊 Total migrations applied: ${completedMigrations.length}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

async function createDatabase() {
  // Skip database creation when using DATABASE_URL (production environments)
  if (process.env.DATABASE_URL) {
    console.log('📝 Using DATABASE_URL, skipping database creation');
    return;
  }

  const config = {
    client: 'postgresql',
    connection: {
      ...connectionConfig,
      database: 'postgres',
    },
  };

  const db = knex(config);

  try {
    const existsResult = await db.raw(`SELECT 1 FROM pg_database WHERE datname = ?`, [dbName]);

    if (existsResult.rowCount === 0) {
      await db.raw(`CREATE DATABASE ${dbName} TEMPLATE template1`);
    }
  } finally {
    await db.destroy();
  }
}

(async () => {
  try {
    await createDatabase();
    await runMigrations();
  } catch (err) {
    console.error('Migration failed: ', err);
    process.exit(1);
  }
})();
