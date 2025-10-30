"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("../../db/connection");
const vitest_1 = require("vitest");
const createMockDatabaseConfig = () => ({
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    user: 'test_user',
    password: 'test_password',
    ssl: false,
    max: 5,
    idleTimeoutMillis: 1000,
});
const mockQuery = vitest_1.vi.fn();
const mockClient = {
    query: vitest_1.vi.fn(),
    release: vitest_1.vi.fn(),
};
const mockPool = {
    query: mockQuery,
    connect: vitest_1.vi.fn().mockResolvedValue(mockClient),
    end: vitest_1.vi.fn().mockResolvedValue(undefined),
};
vitest_1.vi.mock('pg', () => ({
    Pool: vitest_1.vi.fn().mockImplementation(() => mockPool),
}));
const pg_1 = require("pg");
(0, vitest_1.describe)('Database Connection', () => {
    let database;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockQuery.mockResolvedValue({
            rows: [],
            rowCount: 0,
        });
        database = new connection_1.Database(createMockDatabaseConfig());
    });
    (0, vitest_1.describe)('Database Configuration', () => {
        (0, vitest_1.it)('should create database with correct configuration', () => {
            const config = createMockDatabaseConfig();
            new connection_1.Database(config);
            (0, vitest_1.expect)(pg_1.Pool).toHaveBeenCalledWith({
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
        (0, vitest_1.it)('should handle SSL configuration', () => {
            const config = {
                ...createMockDatabaseConfig(),
                ssl: true,
            };
            new connection_1.Database(config);
            (0, vitest_1.expect)(pg_1.Pool).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                ssl: { rejectUnauthorized: false },
            }));
        });
        (0, vitest_1.it)('should use default values when not provided', () => {
            const config = {
                host: 'localhost',
                port: 5432,
                database: 'test',
                user: 'user',
                password: 'pass',
            };
            new connection_1.Database(config);
            (0, vitest_1.expect)(pg_1.Pool).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                max: 20,
                idleTimeoutMillis: 30000,
            }));
        });
    });
    (0, vitest_1.describe)('Query Execution', () => {
        (0, vitest_1.it)('should execute query successfully', async () => {
            const mockResult = { rows: [{ id: 1, name: 'test' }], rowCount: 1 };
            mockQuery.mockResolvedValue(mockResult);
            const result = await database.query('SELECT * FROM test');
            (0, vitest_1.expect)(mockQuery).toHaveBeenCalledWith('SELECT * FROM test', undefined);
            (0, vitest_1.expect)(result).toEqual(mockResult);
            (0, vitest_1.expect)(console.log).toHaveBeenCalledWith('Executed query', {
                text: 'SELECT * FROM test',
                duration: vitest_1.expect.any(Number),
                rows: 1,
            });
        });
        (0, vitest_1.it)('should execute query with parameters', async () => {
            const mockResult = { rows: [{ id: 1 }], rowCount: 1 };
            mockQuery.mockResolvedValue(mockResult);
            await database.query('SELECT * FROM test WHERE id = $1', [1]);
            (0, vitest_1.expect)(mockQuery).toHaveBeenCalledWith('SELECT * FROM test WHERE id = $1', [1]);
        });
        (0, vitest_1.it)('should handle query errors', async () => {
            const error = new Error('Database error');
            mockQuery.mockRejectedValue(error);
            await (0, vitest_1.expect)(database.query('INVALID SQL')).rejects.toThrow('Database error');
            (0, vitest_1.expect)(console.error).toHaveBeenCalledWith('Query error', {
                text: 'INVALID SQL',
                error,
            });
        });
        (0, vitest_1.it)('should log query execution time', async () => {
            const mockResult = { rows: [], rowCount: 0 };
            mockQuery.mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return mockResult;
            });
            await database.query('SELECT 1');
            (0, vitest_1.expect)(console.log).toHaveBeenCalledWith('Executed query', {
                text: 'SELECT 1',
                duration: vitest_1.expect.any(Number),
                rows: 0,
            });
        });
    });
    (0, vitest_1.describe)('Client Management', () => {
        (0, vitest_1.it)('should get a client from pool', async () => {
            const mockClient = { query: vitest_1.vi.fn(), release: vitest_1.vi.fn() };
            mockPool.connect.mockResolvedValue(mockClient);
            const client = await database.getClient();
            (0, vitest_1.expect)(mockPool.connect).toHaveBeenCalled();
            (0, vitest_1.expect)(client).toBe(mockClient);
        });
    });
    (0, vitest_1.describe)('Transaction Management', () => {
        let mockClient;
        (0, vitest_1.beforeEach)(() => {
            mockClient = {
                query: vitest_1.vi.fn(),
                release: vitest_1.vi.fn(),
            };
            mockPool.connect.mockResolvedValue(mockClient);
        });
        (0, vitest_1.it)('should execute successful transaction', async () => {
            const callback = vitest_1.vi.fn().mockResolvedValue('success');
            const result = await database.transaction(callback);
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith('BEGIN');
            (0, vitest_1.expect)(callback).toHaveBeenCalledWith(mockClient);
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith('COMMIT');
            (0, vitest_1.expect)(mockClient.release).toHaveBeenCalled();
            (0, vitest_1.expect)(result).toBe('success');
        });
        (0, vitest_1.it)('should rollback on transaction failure', async () => {
            const error = new Error('Transaction failed');
            const callback = vitest_1.vi.fn().mockRejectedValue(error);
            await (0, vitest_1.expect)(database.transaction(callback)).rejects.toThrow('Transaction failed');
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith('BEGIN');
            (0, vitest_1.expect)(callback).toHaveBeenCalledWith(mockClient);
            (0, vitest_1.expect)(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            (0, vitest_1.expect)(mockClient.release).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should release client even if rollback fails', async () => {
            const error = new Error('Transaction failed');
            const callback = vitest_1.vi.fn().mockRejectedValue(error);
            mockClient.query.mockRejectedValue(new Error('Rollback failed'));
            await (0, vitest_1.expect)(database.transaction(callback)).rejects.toThrow('Rollback failed');
            (0, vitest_1.expect)(mockClient.release).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Database Lifecycle', () => {
        (0, vitest_1.it)('should close all connections', async () => {
            await database.close();
            (0, vitest_1.expect)(mockPool.end).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should return true on successful health check', async () => {
            mockQuery.mockResolvedValue({ rows: [{ result: 1 }], rowCount: 1 });
            const isHealthy = await database.healthCheck();
            (0, vitest_1.expect)(mockQuery).toHaveBeenCalledWith('SELECT 1', undefined);
            (0, vitest_1.expect)(isHealthy).toBe(true);
        });
        (0, vitest_1.it)('should return false on failed health check', async () => {
            mockQuery.mockRejectedValue(new Error('Connection failed'));
            const isHealthy = await database.healthCheck();
            (0, vitest_1.expect)(isHealthy).toBe(false);
        });
    });
});
//# sourceMappingURL=connection.test.js.map