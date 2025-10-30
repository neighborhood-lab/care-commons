/**
 * Database migration script using Knex
 * 
 * Runs all Knex migrations
 */

import dotenv from "dotenv";
import knex, { Knex } from 'knex';

dotenv.config({ path: '.env', quiet: true });

const env = process.env.NODE_ENV || 'development';
const dbName = process.env.DB_NAME || 'care_commons';

const connectionConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
}

async function runMigrations() {
  console.log('🔄 Starting database migrations with Knex...\n');

  const database = env === 'test' ? `${dbName}_test` : dbName;

  // Build Knex config inline to avoid tsconfig issues
  const config: Knex.Config = {
    client: 'postgresql',
    connection: { ...connectionConfig, database },
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
