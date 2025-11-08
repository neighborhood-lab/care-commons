import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDatabase, initializeDatabase, resetDatabase } from '../db/connection.js';
import { validateNoSQLInjection } from '../middleware/sanitize-input.js';

describe('SQL Injection Protection', () => {
  beforeAll(async () => {
    // Initialize test database
    if (process.env.DATABASE_URL) {
      initializeDatabase({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'care_commons_test',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      });
    }
  });

  afterAll(async () => {
    resetDatabase();
  });

  it('should detect SQL injection patterns in input validation', () => {
    const maliciousInputs = [
      "1' OR '1'='1",
      "'; DROP TABLE users; --",
      "1 UNION SELECT * FROM users",
      "admin'--",
      "1; DELETE FROM users WHERE '1'='1",
    ];

    maliciousInputs.forEach(input => {
      expect(validateNoSQLInjection(input)).toBe(false);
    });
  });

  it('should allow safe inputs', () => {
    const safeInputs = [
      'john@example.com',
      'John Doe',
      '123 Main St',
      'Password123!',
    ];

    safeInputs.forEach(input => {
      expect(validateNoSQLInjection(input)).toBe(true);
    });
  });

  it('should prevent SQL injection in parameterized queries', async () => {
    if (!process.env.DATABASE_URL) {
      console.log('Skipping database test - no DATABASE_URL');
      return;
    }

    const db = getDatabase();
    const maliciousInput = "1' OR '1'='1";

    // This should NOT return all users due to parameterized query
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [maliciousInput]
    );

    // Should return 0 rows since the malicious input is treated as a literal string
    expect(result.rows).toHaveLength(0);
  });

  it('should handle LIKE queries safely', async () => {
    if (!process.env.DATABASE_URL) {
      console.log('Skipping database test - no DATABASE_URL');
      return;
    }

    const db = getDatabase();
    const maliciousInput = "%'; DROP TABLE users; --";

    // Using parameterized query for LIKE
    await expect(
      db.query(
        'SELECT * FROM users WHERE email LIKE $1',
        [`%${maliciousInput}%`]
      )
    ).resolves.not.toThrow();

    // Verify table still exists by attempting a query
    const tableCheck = await db.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
    );
    expect(tableCheck.rows[0]?.exists).toBe(true);
  });
});
