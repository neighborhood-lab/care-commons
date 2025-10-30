"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
exports.initializeDatabase = initializeDatabase;
exports.getDatabase = getDatabase;
const pg_1 = require("pg");
class Database {
    constructor(config) {
        this.pool = new pg_1.Pool({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            password: config.password,
            ssl: config.ssl ? { rejectUnauthorized: false } : false,
            max: config.max ?? 20,
            idleTimeoutMillis: config.idleTimeoutMillis ?? 30000,
        });
    }
    async query(text, params) {
        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            console.log('Executed query', { text, duration, rows: result.rowCount });
            return result;
        }
        catch (error) {
            console.error('Query error', { text, error });
            throw error;
        }
    }
    async getClient() {
        return await this.pool.connect();
    }
    async transaction(callback) {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async close() {
        await this.pool.end();
    }
    async healthCheck() {
        try {
            await this.query('SELECT 1');
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.Database = Database;
let dbInstance = null;
function initializeDatabase(config) {
    if (dbInstance) {
        throw new Error('Database already initialized');
    }
    dbInstance = new Database(config);
    return dbInstance;
}
function getDatabase() {
    if (!dbInstance) {
        throw new Error('Database not initialized. Call initializeDatabase first.');
    }
    return dbInstance;
}
//# sourceMappingURL=connection.js.map