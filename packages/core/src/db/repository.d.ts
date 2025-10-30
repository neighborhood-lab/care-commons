import { Entity, Revision, UserContext, PaginationParams, PaginatedResult } from '../types/base';
import { Database } from './connection';
export interface RepositoryConfig {
    tableName: string;
    database: Database;
    enableAudit?: boolean;
    enableSoftDelete?: boolean;
}
export declare abstract class Repository<T extends Entity> {
    protected tableName: string;
    protected database: Database;
    protected enableAudit: boolean;
    protected enableSoftDelete: boolean;
    constructor(config: RepositoryConfig);
    protected abstract mapRowToEntity(row: any): T;
    protected abstract mapEntityToRow(entity: Partial<T>): Record<string, any>;
    create(entity: Partial<T>, context: UserContext): Promise<T>;
    findById(id: string): Promise<T | null>;
    findAll(params: PaginationParams): Promise<PaginatedResult<T>>;
    update(id: string, updates: Partial<T>, context: UserContext): Promise<T>;
    delete(id: string, context: UserContext): Promise<void>;
    private createRevision;
    private computeChanges;
    getRevisionHistory(entityId: string): Promise<Revision[]>;
}
//# sourceMappingURL=repository.d.ts.map