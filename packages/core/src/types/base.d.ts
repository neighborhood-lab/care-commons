export type UUID = string;
export type Timestamp = Date;
export interface Entity {
    id: UUID;
    createdAt: Timestamp;
    createdBy: UUID;
    updatedAt: Timestamp;
    updatedBy: UUID;
    version: number;
}
export interface SoftDeletable {
    deletedAt: Timestamp | null;
    deletedBy: UUID | null;
}
export interface Auditable extends Entity {
    revisionHistory: Revision[];
}
export interface Revision {
    revisionId: UUID;
    timestamp: Timestamp;
    userId: UUID;
    operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
    changes: Record<string, {
        from: unknown;
        to: unknown;
    }>;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
}
export type LifecycleStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export interface UserContext {
    userId: UUID;
    roles: Role[];
    permissions: Permission[];
    organizationId: UUID;
    branchIds: UUID[];
}
export type Role = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'BRANCH_ADMIN' | 'COORDINATOR' | 'SCHEDULER' | 'CAREGIVER' | 'FAMILY' | 'CLIENT' | 'BILLING' | 'HR' | 'AUDITOR' | 'READ_ONLY';
export type Permission = string;
export declare class DomainError extends Error {
    code: string;
    context?: Record<string, unknown> | undefined;
    constructor(message: string, code: string, context?: Record<string, unknown> | undefined);
}
export declare class ValidationError extends DomainError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class PermissionError extends DomainError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class NotFoundError extends DomainError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class ConflictError extends DomainError {
    constructor(message: string, context?: Record<string, unknown>);
}
export type Result<T, E = DomainError> = {
    success: true;
    value: T;
} | {
    success: false;
    error: E;
};
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface SyncMetadata {
    syncId: UUID;
    lastSyncedAt: Timestamp | null;
    syncStatus: 'SYNCED' | 'PENDING' | 'CONFLICT';
    conflictData?: unknown;
}
//# sourceMappingURL=base.d.ts.map