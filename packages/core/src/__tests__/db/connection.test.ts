/**
 * Tests for database connection and transaction management
 */

import { Database } from '../../db/connection';
import { vi, describe, it, expect, beforeEach } from 'vitest';

interface MockClient {
  query: ReturnType<typeof vi.fn>;
  release: ReturnType<typeof vi.fn>;
}

interface MockPool {
  query: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
}

const createMockDatabaseConfig = () => ({
  host: 'localhost',
  port: 5432,
  database: 'test_db',
  user: 'test_user',
        password: process.env['TEST_DB_PASSWORD'] ?? 'test_password',
  ssl: false,
  max: 5,
  idleTimeoutMillis: 1000,
});

// Mock the 'pg' module
const mockQuery = vi.fn();
const mockClient: MockClient = {
  query: vi.fn(),
  release: vi.fn(),
};
const mockPool: MockPool = {
  query: mockQuery,
  connect: vi.fn().mockResolvedValue(mockClient),
  end: vi.fn().mockResolvedValue(undefined),
};

vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(function() {
    return mockPool;
  }),
}));

// Mock console methods
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

import { Pool } from 'pg';
import { initializeDatabase, getDatabase, resetDatabase } from '../../db/connection';

describe('Database Connection', () => {
  let database: Database;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful query
    mockQuery.mockResolvedValue({
      rows: [],
      rowCount: 0,
    });

    database = new Database(createMockDatabaseConfig());
  });

  describe('Database Configuration', () => {
    it('should create database with correct configuration', () => {
      const config = createMockDatabaseConfig();
      new Database(config);

      expect(Pool).toHaveBeenCalledWith({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: false,
        max: config.max,
        idleTimeoutMillis: config.idleTimeoutMillis,
        connectionTimeoutMillis: 10000,
        allowExitOnIdle: false,
      });
    });

    it('should handle SSL configuration', () => {
      const config = {
        ...createMockDatabaseConfig(),
        ssl: true,
      };

      new Database(config);

      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          ssl: { rejectUnauthorized: false },
        })
      );
    });

    it('should use default values when not provided', () => {
      const config = {
        host: 'localhost',
        port: 5432,
        database: 'test',
        user: 'user',
  password: process.env['TEST_DB_PASSWORD'] ?? 'test_password',
      };

      new Database(config);

      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
          allowExitOnIdle: false,
        })
      );
    });
  });

  describe('Query Execution', () => {
    it('should execute query successfully', async () => {
      const mockResult = { rows: [{ id: 1, name: 'test' }], rowCount: 1 };
      mockQuery.mockResolvedValue(mockResult);

      const result = await database.query('SELECT * FROM test');

      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM test', undefined);
      expect(result).toEqual(mockResult);
      expect(console.log).toHaveBeenCalledWith('Executed query', {
        text: 'SELECT * FROM test',
        duration: expect.any(Number),
        rows: 1,
      });
    });

    it('should execute query with parameters', async () => {
      const mockResult = { rows: [{ id: 1 }], rowCount: 1 };
      mockQuery.mockResolvedValue(mockResult);

      await database.query('SELECT * FROM test WHERE id = $1', [1]);

      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM test WHERE id = $1', [1]);
    });

    it('should handle query errors', async () => {
      const error = new Error('Database error');
      mockQuery.mockRejectedValue(error);

      await expect(database.query('INVALID SQL')).rejects.toThrow('Database error');
      expect(console.error).toHaveBeenCalledWith('Query error', {
        text: 'INVALID SQL',
        error,
      });
    });

    it('should log query execution time', async () => {
      const mockResult = { rows: [], rowCount: 0 };
      mockQuery.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return mockResult;
      });

      await database.query('SELECT 1');

      expect(console.log).toHaveBeenCalledWith('Executed query', {
        text: 'SELECT 1',
        duration: expect.any(Number),
        rows: 0,
      });
    });
  });

  describe('Client Management', () => {
    it('should get a client from pool', async () => {
      const mockClient = { query: vi.fn(), release: vi.fn() };
      (mockPool.connect as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);

      const client = await database.getClient();

      expect(mockPool.connect).toHaveBeenCalled();
      expect(client).toBe(mockClient);
    });
  });

  describe('Transaction Management', () => {
    let mockClient: MockClient;

    beforeEach(() => {
      mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      (mockPool.connect as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);
    });

    it('should execute successful transaction', async () => {
      const callback = vi.fn().mockResolvedValue('success');

      const result = await database.transaction(callback);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(callback).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should rollback on transaction failure', async () => {
      const error = new Error('Transaction failed');
      const callback = vi.fn().mockRejectedValue(error);

      await expect(database.transaction(callback)).rejects.toThrow('Transaction failed');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(callback).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should release client even if rollback fails', async () => {
      const error = new Error('Transaction failed');
      const callback = vi.fn().mockRejectedValue(error);
      mockClient.query.mockRejectedValue(new Error('Rollback failed'));

      await expect(database.transaction(callback)).rejects.toThrow('Rollback failed');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('Database Lifecycle', () => {
    it('should close all connections', async () => {
      await database.close();

      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should return true on successful health check', async () => {
      mockQuery.mockResolvedValue({ rows: [{ result: 1 }], rowCount: 1 });

      const isHealthy = await database.healthCheck();

      expect(mockQuery).toHaveBeenCalledWith('SELECT 1', undefined);
      expect(isHealthy).toBe(true);
    });

    it('should return false on failed health check', async () => {
      mockQuery.mockRejectedValue(new Error('Connection failed'));

      const isHealthy = await database.healthCheck();

      expect(isHealthy).toBe(false);
    });
  });

  // Note: Singleton pattern tests are complex to test due to module caching
  // These would require more sophisticated test setup to properly reset module state
});

describe('Database Singleton', () => {
  beforeEach(() => {
    // Reset singleton instance before each test
    resetDatabase();
  });

  it('should initialize database successfully', () => {
    const config = createMockDatabaseConfig();
    const database = initializeDatabase(config);

    expect(database).toBeInstanceOf(Database);
  });

  it('should throw error when trying to initialize already initialized database', () => {
    const config = createMockDatabaseConfig();
    initializeDatabase(config);

    expect(() => {
      initializeDatabase(config);
    }).toThrow('Database already initialized');
  });

  it('should get initialized database instance', () => {
    const config = createMockDatabaseConfig();
    const firstInstance = initializeDatabase(config);
    
    const retrievedInstance = getDatabase();
    
    expect(retrievedInstance).toBe(firstInstance);
  });

  it('should throw error when getting database before initialization', () => {
    resetDatabase(); // Ensure no instance exists
    
    expect(() => {
      getDatabase();
    }).toThrow('Database not initialized. Call initializeDatabase first.');
  });
});