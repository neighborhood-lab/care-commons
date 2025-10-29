/**
 * Tests for database connection and transaction management
 */

import { Database } from '../../db/connection';
import { createMockDatabaseConfig } from '../test-utils.helper';

// Mock the 'pg' module
const mockQuery = jest.fn();
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};
const mockPool = {
  query: mockQuery,
  connect: jest.fn().mockResolvedValue(mockClient),
  end: jest.fn().mockResolvedValue(undefined),
};

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => mockPool),
}));

import { Pool } from 'pg';

describe('Database Connection', () => {
  let database: Database;

  beforeEach(() => {
    jest.clearAllMocks();
    
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
        password: 'pass',
      };

      new Database(config);

      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          max: 20,
          idleTimeoutMillis: 30000,
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
      const mockClient = { query: jest.fn(), release: jest.fn() };
      (mockPool.connect as jest.MockedFunction<any>).mockResolvedValue(mockClient);

      const client = await database.getClient();

      expect(mockPool.connect).toHaveBeenCalled();
      expect(client).toBe(mockClient);
    });
  });

  describe('Transaction Management', () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      (mockPool.connect as jest.MockedFunction<any>).mockResolvedValue(mockClient);
    });

    it('should execute successful transaction', async () => {
      const callback = jest.fn().mockResolvedValue('success');

      const result = await database.transaction(callback);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(callback).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should rollback on transaction failure', async () => {
      const error = new Error('Transaction failed');
      const callback = jest.fn().mockRejectedValue(error);

      await expect(database.transaction(callback)).rejects.toThrow('Transaction failed');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(callback).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should release client even if rollback fails', async () => {
      const error = new Error('Transaction failed');
      const callback = jest.fn().mockRejectedValue(error);
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