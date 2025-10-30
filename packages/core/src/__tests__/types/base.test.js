"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../../types/base");
const vitest_1 = require("vitest");
(0, vitest_1.describe)('Base Types', () => {
    (0, vitest_1.describe)('Error Classes', () => {
        (0, vitest_1.describe)('DomainError', () => {
            (0, vitest_1.it)('should create a DomainError with message and code', () => {
                const error = new base_1.DomainError('Test error', 'TEST_CODE');
                (0, vitest_1.expect)(error).toBeInstanceOf(Error);
                (0, vitest_1.expect)(error).toBeInstanceOf(base_1.DomainError);
                (0, vitest_1.expect)(error.name).toBe('DomainError');
                (0, vitest_1.expect)(error.message).toBe('Test error');
                (0, vitest_1.expect)(error.code).toBe('TEST_CODE');
                (0, vitest_1.expect)(error.context).toBeUndefined();
            });
            (0, vitest_1.it)('should create a DomainError with context', () => {
                const context = { field: 'value' };
                const error = new base_1.DomainError('Test error', 'TEST_CODE', context);
                (0, vitest_1.expect)(error.context).toEqual(context);
            });
        });
        (0, vitest_1.describe)('ValidationError', () => {
            (0, vitest_1.it)('should create a ValidationError with correct properties', () => {
                const error = new base_1.ValidationError('Invalid input');
                (0, vitest_1.expect)(error).toBeInstanceOf(base_1.DomainError);
                (0, vitest_1.expect)(error).toBeInstanceOf(base_1.ValidationError);
                (0, vitest_1.expect)(error.name).toBe('ValidationError');
                (0, vitest_1.expect)(error.message).toBe('Invalid input');
                (0, vitest_1.expect)(error.code).toBe('VALIDATION_ERROR');
            });
            (0, vitest_1.it)('should accept context', () => {
                const context = { field: 'email', value: 'invalid' };
                const error = new base_1.ValidationError('Invalid email', context);
                (0, vitest_1.expect)(error.context).toEqual(context);
            });
        });
        (0, vitest_1.describe)('PermissionError', () => {
            (0, vitest_1.it)('should create a PermissionError with correct properties', () => {
                const error = new base_1.PermissionError('Access denied');
                (0, vitest_1.expect)(error).toBeInstanceOf(base_1.DomainError);
                (0, vitest_1.expect)(error).toBeInstanceOf(base_1.PermissionError);
                (0, vitest_1.expect)(error.name).toBe('PermissionError');
                (0, vitest_1.expect)(error.message).toBe('Access denied');
                (0, vitest_1.expect)(error.code).toBe('PERMISSION_DENIED');
            });
        });
        (0, vitest_1.describe)('NotFoundError', () => {
            (0, vitest_1.it)('should create a NotFoundError with correct properties', () => {
                const error = new base_1.NotFoundError('Resource not found');
                (0, vitest_1.expect)(error).toBeInstanceOf(base_1.DomainError);
                (0, vitest_1.expect)(error).toBeInstanceOf(base_1.NotFoundError);
                (0, vitest_1.expect)(error.name).toBe('NotFoundError');
                (0, vitest_1.expect)(error.message).toBe('Resource not found');
                (0, vitest_1.expect)(error.code).toBe('NOT_FOUND');
            });
        });
        (0, vitest_1.describe)('ConflictError', () => {
            (0, vitest_1.it)('should create a ConflictError with correct properties', () => {
                const error = new base_1.ConflictError('Resource already exists');
                (0, vitest_1.expect)(error).toBeInstanceOf(base_1.DomainError);
                (0, vitest_1.expect)(error).toBeInstanceOf(base_1.ConflictError);
                (0, vitest_1.expect)(error.name).toBe('ConflictError');
                (0, vitest_1.expect)(error.message).toBe('Resource already exists');
                (0, vitest_1.expect)(error.code).toBe('CONFLICT');
            });
        });
    });
    (0, vitest_1.describe)('Result Type', () => {
        (0, vitest_1.it)('should represent a successful result', () => {
            const result = { success: true, value: 'success' };
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.value).toBe('success');
        });
        (0, vitest_1.it)('should represent a failed result', () => {
            const error = new base_1.ValidationError('fail');
            const result = { success: false, error };
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toBeInstanceOf(base_1.ValidationError);
        });
        (0, vitest_1.it)('should work with type guards', () => {
            const successResult = { success: true, value: 'test' };
            const failureResult = { success: false, error: new base_1.ValidationError('fail') };
            if (successResult.success) {
                (0, vitest_1.expect)(successResult.value).toBe('test');
            }
            if (!failureResult.success) {
                (0, vitest_1.expect)(failureResult.error).toBeInstanceOf(Error);
            }
        });
    });
    (0, vitest_1.describe)('Pagination Types', () => {
        (0, vitest_1.it)('should create valid PaginationParams', () => {
            const params = {
                page: 1,
                limit: 10,
                sortBy: 'name',
                sortOrder: 'asc',
            };
            (0, vitest_1.expect)(params.page).toBe(1);
            (0, vitest_1.expect)(params.limit).toBe(10);
            (0, vitest_1.expect)(params.sortBy).toBe('name');
            (0, vitest_1.expect)(params.sortOrder).toBe('asc');
        });
        (0, vitest_1.it)('should create valid PaginatedResult', () => {
            const result = {
                items: ['item1', 'item2'],
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1,
            };
            (0, vitest_1.expect)(result.items).toHaveLength(2);
            (0, vitest_1.expect)(result.total).toBe(2);
            (0, vitest_1.expect)(result.page).toBe(1);
            (0, vitest_1.expect)(result.limit).toBe(10);
            (0, vitest_1.expect)(result.totalPages).toBe(1);
        });
    });
    (0, vitest_1.describe)('Entity Types', () => {
        (0, vitest_1.it)('should create a valid Entity', () => {
            const entity = {
                id: 'test-id',
                createdAt: new Date(),
                createdBy: 'user-id',
                updatedAt: new Date(),
                updatedBy: 'user-id',
                version: 1,
            };
            (0, vitest_1.expect)(entity.id).toBe('test-id');
            (0, vitest_1.expect)(entity.version).toBe(1);
            (0, vitest_1.expect)(entity.createdAt).toBeInstanceOf(Date);
            (0, vitest_1.expect)(entity.updatedAt).toBeInstanceOf(Date);
        });
        (0, vitest_1.it)('should create a valid SoftDeletable entity', () => {
            const softDeletable = {
                deletedAt: null,
                deletedBy: null,
            };
            (0, vitest_1.expect)(softDeletable.deletedAt).toBeNull();
            (0, vitest_1.expect)(softDeletable.deletedBy).toBeNull();
        });
        (0, vitest_1.it)('should create a valid Auditable entity', () => {
            const revision = {
                revisionId: 'rev-id',
                timestamp: new Date(),
                userId: 'user-id',
                operation: 'CREATE',
                changes: { name: { from: 'old', to: 'new' } },
            };
            const auditable = {
                id: 'test-id',
                createdAt: new Date(),
                createdBy: 'user-id',
                updatedAt: new Date(),
                updatedBy: 'user-id',
                version: 1,
                revisionHistory: [revision],
            };
            (0, vitest_1.expect)(auditable.revisionHistory).toHaveLength(1);
            (0, vitest_1.expect)(auditable.revisionHistory[0].operation).toBe('CREATE');
        });
    });
    (0, vitest_1.describe)('UserContext', () => {
        (0, vitest_1.it)('should create a valid UserContext', () => {
            const context = {
                userId: 'user-id',
                roles: ['COORDINATOR', 'CAREGIVER'],
                permissions: ['clients:read', 'clients:write'],
                organizationId: 'org-id',
                branchIds: ['branch-1', 'branch-2'],
            };
            (0, vitest_1.expect)(context.userId).toBe('user-id');
            (0, vitest_1.expect)(context.roles).toContain('COORDINATOR');
            (0, vitest_1.expect)(context.permissions).toContain('clients:read');
            (0, vitest_1.expect)(context.organizationId).toBe('org-id');
            (0, vitest_1.expect)(context.branchIds).toHaveLength(2);
        });
    });
    (0, vitest_1.describe)('LifecycleStatus', () => {
        (0, vitest_1.it)('should accept valid lifecycle statuses', () => {
            const validStatuses = [
                'DRAFT',
                'ACTIVE',
                'INACTIVE',
                'SUSPENDED',
                'ARCHIVED',
            ];
            validStatuses.forEach(status => {
                (0, vitest_1.expect)(status).toBeDefined();
            });
        });
    });
    (0, vitest_1.describe)('Role Type', () => {
        (0, vitest_1.it)('should accept valid roles', () => {
            const validRoles = [
                'SUPER_ADMIN',
                'ORG_ADMIN',
                'BRANCH_ADMIN',
                'COORDINATOR',
                'SCHEDULER',
                'CAREGIVER',
                'FAMILY',
                'CLIENT',
                'BILLING',
                'HR',
                'AUDITOR',
                'READ_ONLY',
            ];
            validRoles.forEach(role => {
                (0, vitest_1.expect)(role).toBeDefined();
            });
        });
    });
    (0, vitest_1.describe)('SyncMetadata', () => {
        (0, vitest_1.it)('should create valid SyncMetadata', () => {
            const sync = {
                syncId: 'sync-id',
                lastSyncedAt: new Date(),
                syncStatus: 'SYNCED',
            };
            (0, vitest_1.expect)(sync.syncId).toBe('sync-id');
            (0, vitest_1.expect)(sync.syncStatus).toBe('SYNCED');
            (0, vitest_1.expect)(sync.lastSyncedAt).toBeInstanceOf(Date);
            (0, vitest_1.expect)(sync.conflictData).toBeUndefined();
        });
        (0, vitest_1.it)('should include conflict data when present', () => {
            const sync = {
                syncId: 'sync-id',
                lastSyncedAt: null,
                syncStatus: 'CONFLICT',
                conflictData: { field: 'conflicting value' },
            };
            (0, vitest_1.expect)(sync.syncStatus).toBe('CONFLICT');
            (0, vitest_1.expect)(sync.lastSyncedAt).toBeNull();
            (0, vitest_1.expect)(sync.conflictData).toEqual({ field: 'conflicting value' });
        });
    });
});
//# sourceMappingURL=base.test.js.map