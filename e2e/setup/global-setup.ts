import { exec } from 'child_process';
import { promisify } from 'util';
import { Database, DatabaseConfig } from '../../packages/core/src/db/connection.js';

const execAsync = promisify(exec);

/**
 * Parse PostgreSQL connection URL into DatabaseConfig
 */
function parseDatabaseUrl(url: string): DatabaseConfig {
  const match = url.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid database URL format: ${url}`);
  }

  const [, user, password, host, port, database] = match;
  return {
    host,
    port: parseInt(port, 10),
    database,
    user,
    password,
    ssl: false,
    max: 10,
    idleTimeoutMillis: 30000,
  };
}

/**
 * Global Setup for Playwright E2E Tests
 *
 * This runs once before all tests to:
 * 1. Create test database if not exists
 * 2. Run all migrations
 * 3. Verify database connection
 */
export default async function globalSetup() {
  console.log('\n🔧 Setting up E2E test environment...\n');

  const dbName = process.env['E2E_DATABASE_NAME'] || 'folkcare_e2e_test';
  const dbUrl = process.env['E2E_DATABASE_URL'] || `postgresql://postgres:postgres@localhost:5432/${dbName}`;

  try {
    // Step 1: Create test database if it doesn't exist
    console.log(`📦 Creating test database: ${dbName}...`);
    try {
      await execAsync(`createdb ${dbName}`);
      console.log(`✅ Database ${dbName} created successfully`);
    } catch (error: unknown) {
      const err = error as Error & { stderr?: string };
      if (err.stderr && err.stderr.includes('already exists')) {
        console.log(`ℹ️  Database ${dbName} already exists, skipping creation`);
      } else {
        console.error(`⚠️  Error creating database: ${err.message}`);
        // Continue anyway - database might already exist
      }
    }

    // Step 2: Run migrations
    console.log('\n🔄 Running database migrations...');
    const migrationCommand = `DATABASE_URL=${dbUrl} npm run db:migrate --workspace=@folkcare/core`;
    try {
      const { stdout, stderr } = await execAsync(migrationCommand);
      if (stdout) console.log(stdout);
      if (stderr) console.warn(stderr);
      console.log('✅ Migrations completed successfully');
    } catch (error: unknown) {
      const err = error as Error & { stdout?: string; stderr?: string };
      console.error('❌ Migration failed:', err.message);
      if (err.stdout) console.log(err.stdout);
      if (err.stderr) console.error(err.stderr);
      throw error;
    }

    // Step 3: Verify connection
    console.log('\n🔌 Verifying database connection...');
    const config = parseDatabaseUrl(dbUrl);
    const db = new Database(config);
    const isHealthy = await db.healthCheck();
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }
    const result = await db.query<{ version: string }>('SELECT version()');
    console.log(`✅ Connected to PostgreSQL: ${result.rows[0]?.version.split(',')[0]}`);
    await db.close();

    console.log('\n✨ E2E test environment ready!\n');
  } catch (error) {
    console.error('\n❌ Failed to set up E2E test environment:', error);
    throw error;
  }
}
