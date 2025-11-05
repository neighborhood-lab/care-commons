import { Database } from '../../packages/core/src/db/connection.js';

/**
 * Test Database Helper
 *
 * Provides utilities for managing test database state in E2E tests:
 * - Connection pooling
 * - Data seeding
 * - Cleanup between tests
 * - Transaction support
 */
export class TestDatabase {
  private static instance: Database | null = null;
  private static dbUrl: string;

  /**
   * Initialize connection to test database
   */
  static async setup(): Promise<Database> {
    if (this.instance) {
      return this.instance;
    }

    this.dbUrl = process.env['E2E_DATABASE_URL'] || 'postgresql://postgres:postgres@localhost:5432/care_commons_e2e_test';

    console.log('🔌 Connecting to test database...');
    this.instance = new Database(this.dbUrl);
    await this.instance.connect();
    console.log('✅ Connected to test database');

    return this.instance;
  }

  /**
   * Get database instance (must call setup() first)
   */
  static getInstance(): Database {
    if (!this.instance) {
      throw new Error('TestDatabase not initialized. Call setup() first.');
    }
    return this.instance;
  }

  /**
   * Seed database with scenario-specific data
   */
  static async seed(scenarioName: string): Promise<void> {
    console.log(`🌱 Seeding test data for scenario: ${scenarioName}...`);

    try {
      // Dynamic import of seed module
      const seedModule = await import(`./seeds/${scenarioName}.seed.js`);

      if (typeof seedModule.seedDatabase !== 'function') {
        throw new Error(`Seed module ${scenarioName} does not export seedDatabase function`);
      }

      await seedModule.seedDatabase(this.getInstance());
      console.log(`✅ Seed data loaded for ${scenarioName}`);
    } catch (error: unknown) {
      const err = error as Error;
      console.error(`❌ Failed to seed ${scenarioName}:`, err.message);
      throw error;
    }
  }

  /**
   * Clean up all data from database tables (preserve schema)
   * This is faster than dropping/recreating tables
   */
  static async cleanup(): Promise<void> {
    const db = this.getInstance();

    try {
      await db.query(`
        DO $$
        DECLARE
          r RECORD;
        BEGIN
          -- Disable triggers temporarily
          SET session_replication_role = replica;

          -- Truncate all tables
          FOR r IN (
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename NOT IN ('schema_migrations')
          ) LOOP
            EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;

          -- Re-enable triggers
          SET session_replication_role = DEFAULT;
        END $$;
      `);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Failed to cleanup database:', err.message);
      throw error;
    }
  }

  /**
   * Execute raw SQL query (for custom test setup)
   */
  static async query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[] }> {
    return this.getInstance().query<T>(sql, params);
  }

  /**
   * Close database connection
   */
  static async teardown(): Promise<void> {
    if (this.instance) {
      console.log('🔌 Closing test database connection...');
      await this.instance.close();
      this.instance = null;
      console.log('✅ Test database connection closed');
    }
  }

  /**
   * Begin a transaction (useful for test isolation)
   */
  static async beginTransaction(): Promise<void> {
    await this.query('BEGIN');
  }

  /**
   * Rollback transaction
   */
  static async rollback(): Promise<void> {
    await this.query('ROLLBACK');
  }

  /**
   * Commit transaction
   */
  static async commit(): Promise<void> {
    await this.query('COMMIT');
  }
}
