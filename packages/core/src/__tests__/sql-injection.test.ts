import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Database, initializeDatabase, resetDatabase } from '../db/connection';

describe.skipIf(process.env.DB_NAME === undefined || process.env.DB_NAME === '')('SQL Injection Protection', () => {
  let db: Database;

  beforeAll(async () => {
    // Initialize test database
    db = initializeDatabase({
      host: process.env.DB_HOST ?? 'localhost',
      port: process.env.DB_PORT !== undefined && process.env.DB_PORT !== '' ? Number(process.env.DB_PORT) : 5432,
      database: process.env.DB_NAME ?? 'care_commons_test',
      user: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      ssl: false,
    });

    // Ensure users table exists for testing
    await db.query(`
      CREATE TABLE IF NOT EXISTS test_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL
      )
    `);

    // Insert test data
    await db.query(
      `INSERT INTO test_users (id, email, name) VALUES ($1, $2, $3)`,
      [1, 'test@example.com', 'Test User']
    );
  });

  afterAll(async () => {
    // Clean up test data
    await db.query('DROP TABLE IF EXISTS test_users');
    await db.close();
    resetDatabase();
  });

  it('should prevent SQL injection in WHERE clause with parameterized query', async () => {
    const maliciousInput = "1' OR '1'='1";

    // Using parameterized query (safe)
    const result = await db.query(
      'SELECT * FROM test_users WHERE id = $1',
      [maliciousInput]
    );

    // Should return 0 rows since there's no user with id = "1' OR '1'='1"
    expect(result.rows).toHaveLength(0);
  });

  it('should prevent SQL injection with UNION attack', async () => {
    const maliciousInput = "1 UNION SELECT 1, 'hacker@evil.com', 'Hacker' --";

    // Using parameterized query (safe)
    const result = await db.query(
      'SELECT * FROM test_users WHERE id = $1',
      [maliciousInput]
    );

    // Should return 0 rows
    expect(result.rows).toHaveLength(0);
  });

  it('should prevent SQL injection in LIKE queries', async () => {
    const maliciousInput = "%'; DROP TABLE test_users; --";

    // Using parameterized query (safe)
    const result = await db.query(
      `SELECT * FROM test_users WHERE name LIKE $1`,
      [`%${maliciousInput}%`]
    );

    // Should not throw error and table should still exist
    expect(result).toBeDefined();

    // Verify table still exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'test_users'
      )
    `);
    expect(tableCheck.rows[0]?.exists).toBe(true);
  });

  it('should safely handle special characters in user input', async () => {
    const specialChars = "'; DELETE FROM test_users; --";

    // Using parameterized query (safe)
    const result = await db.query(
      'SELECT * FROM test_users WHERE email = $1',
      [specialChars]
    );

    expect(result.rows).toHaveLength(0);

    // Verify data still exists
    const allUsers = await db.query('SELECT * FROM test_users');
    expect(allUsers.rows.length).toBeGreaterThan(0);
  });

  it('should prevent SQL injection with comment injection', async () => {
    const maliciousInput = "admin'--";

    // Using parameterized query (safe)
    const result = await db.query(
      'SELECT * FROM test_users WHERE name = $1',
      [maliciousInput]
    );

    expect(result.rows).toHaveLength(0);
  });
});
