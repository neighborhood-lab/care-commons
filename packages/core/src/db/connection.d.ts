import { PoolClient, QueryResult } from 'pg';
export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
    max?: number;
    idleTimeoutMillis?: number;
}
export declare class Database {
    private pool;
    constructor(config: DatabaseConfig);
    query<T extends Record<string, any> = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
    getClient(): Promise<PoolClient>;
    transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
    close(): Promise<void>;
    healthCheck(): Promise<boolean>;
}
export declare function initializeDatabase(config: DatabaseConfig): Database;
export declare function getDatabase(): Database;
//# sourceMappingURL=connection.d.ts.map