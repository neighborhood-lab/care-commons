import { Database, DatabaseConfig } from '../../packages/core/src/db/connection.js';

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
    
    // Parse DATABASE_URL into config
    const config = this.parseDatabaseUrl(this.dbUrl);
    this.instance = new Database(config);
    
    // Verify connection with health check
    const isHealthy = await this.instance.healthCheck();
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }
    
    console.log('✅ Connected to test database');

    return this.instance;
  }

  /**
   * Parse PostgreSQL connection URL into DatabaseConfig
   */
  private static parseDatabaseUrl(url: string): DatabaseConfig {
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
      max: 10, // Smaller pool for tests
      idleTimeoutMillis: 30000,
    };
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
  static async query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<{ rows: T[] }> {
    const result = await this.getInstance().query<T>(sql, params);
    return { rows: result.rows };
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
