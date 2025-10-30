"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = require("../../db/repository");
const base_1 = require("../../types/base");
const vitest_1 = require("vitest");
const createMockUserContext = (overrides = {}) => ({
    userId: 'test-user-id',
    roles: ['COORDINATOR'],
    permissions: ['clients:read', 'clients:write'],
    organizationId: 'test-org-id',
    branchIds: ['test-branch-id'],
    ...overrides,
});
vitest_1.vi.mock('../../db/connection');
vitest_1.vi.mock('uuid', () => ({
    v4: vitest_1.vi.fn(() => 'test-entity-id'),
}));
class TestRepository extends repository_1.Repository {
    mapRowToEntity(row) {
        return {
            id: row.id,
            name: row.name,
            email: row.email,
            status: row.status,
            createdAt: row.created_at,
            createdBy: row.created_by,
            updatedAt: row.updated_at,
            updatedBy: row.updated_by,
            version: row.version,
        };
    }
    mapEntityToRow(entity) {
        const row = {};
        if (entity.name !== undefined)
            row.name = entity.name;
        if (entity.email !== undefined)
            row.email = entity.email;
        if (entity.status !== undefined)
            row.status = entity.status;
        if (entity.version !== undefined)
            row.version = entity.version;
        return row;
    }
}
(0, vitest_1.describe)('Repository Pattern', () => {
    let repository;
    let mockDatabase;
    let mockUserContext;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockDatabase = {
            query: vitest_1.vi.fn(),
            getClient: vitest_1.vi.fn(),
            transaction: vitest_1.vi.fn(),
            close: vitest_1.vi.fn(),
            healthCheck: vitest_1.vi.fn(),
        };
        repository = new TestRepository({
            tableName: 'test_entities',
            database: mockDatabase,
            enableAudit: true,
            enableSoftDelete: true,
        });
        mockUserContext = createMockUserContext();
    });
    (0, vitest_1.describe)('Repository Configuration', () => {
        (0, vitest_1.it)('should initialize with correct configuration', () => {
            (0, vitest_1.expect)(repository).toBeInstanceOf(repository_1.Repository);
        });
        (0, vitest_1.it)('should use default values when not provided', () => {
            const repo = new TestRepository({
                tableName: 'test_entities',
                database: mockDatabase,
            });
            (0, vitest_1.expect)(repo).toBeInstanceOf(repository_1.Repository);
        });
    });
    (0, vitest_1.describe)('Create Operations', () => {
        (0, vitest_1.it)('should create a new entity successfully', async () => {
            const entityData = {
                name: 'Test Entity',
                email: 'test@example.com',
                status: 'ACTIVE',
            };
            const mockResult = {
                rows: [{
                        id: 'test-entity-id',
                        name: 'Test Entity',
                        email: 'test@example.com',
                        status: 'ACTIVE',
                        created_at: new Date(),
                        created_by: mockUserContext.userId,
                        updated_at: new Date(),
                        updated_by: mockUserContext.userId,
                        version: 1,
                        deleted_at: null,
                        deleted_by: null,
                    }],
                rowCount: 1,
                command: 'INSERT',
                oid: 0,
                fields: [],
            };
            mockDatabase.query.mockResolvedValue(mockResult);
            const result = await repository.create(entityData, mockUserContext);
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('INSERT INTO test_entities'), vitest_1.expect.arrayContaining([
                'Test Entity',
                'test@example.com',
                'ACTIVE',
                'test-entity-id',
                vitest_1.expect.any(Date),
                mockUserContext.userId,
                vitest_1.expect.any(Date),
                mockUserContext.userId,
                1,
                null,
                null,
            ]));
            (0, vitest_1.expect)(result).toEqual({
                id: 'test-entity-id',
                name: 'Test Entity',
                email: 'test@example.com',
                status: 'ACTIVE',
                createdAt: vitest_1.expect.any(Date),
                createdBy: mockUserContext.userId,
                updatedAt: vitest_1.expect.any(Date),
                updatedBy: mockUserContext.userId,
                version: 1,
            });
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('should create entity without audit when disabled', async () => {
            const repo = new TestRepository({
                tableName: 'test_entities',
                database: mockDatabase,
                enableAudit: false,
            });
            const entityData = { name: 'Test', email: 'test@test.com', status: 'ACTIVE' };
            const mockResult = { rows: [{}], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
            mockDatabase.query.mockResolvedValue(mockResult);
            await repo.create(entityData, mockUserContext);
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledTimes(1);
        });
    });
    (0, vitest_1.describe)('Read Operations', () => {
        (0, vitest_1.it)('should find entity by ID successfully', async () => {
            const mockResult = {
                rows: [{
                        id: 'test-id',
                        name: 'Test Entity',
                        email: 'test@example.com',
                        status: 'ACTIVE',
                        created_at: new Date(),
                        created_by: 'user-id',
                        updated_at: new Date(),
                        updated_by: 'user-id',
                        version: 1,
                    }],
                rowCount: 1,
                command: 'SELECT',
                oid: 0,
                fields: [],
            };
            mockDatabase.query.mockResolvedValue(mockResult);
            const result = await repository.findById('test-id');
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledWith('SELECT * FROM test_entities WHERE id = $1 AND deleted_at IS NULL', ['test-id']);
            (0, vitest_1.expect)(result).toEqual({
                id: 'test-id',
                name: 'Test Entity',
                email: 'test@example.com',
                status: 'ACTIVE',
                createdAt: vitest_1.expect.any(Date),
                createdBy: 'user-id',
                updatedAt: vitest_1.expect.any(Date),
                updatedBy: 'user-id',
                version: 1,
            });
        });
        (0, vitest_1.it)('should return null when entity not found', async () => {
            const mockResult = { rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] };
            mockDatabase.query.mockResolvedValue(mockResult);
            const result = await repository.findById('non-existent-id');
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('should find all entities with pagination', async () => {
            const mockCountResult = { rows: [{ count: '25' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] };
            const mockDataResult = {
                rows: [
                    {
                        id: 'test-id-1',
                        name: 'Entity 1',
                        email: 'test1@example.com',
                        status: 'ACTIVE',
                        created_at: new Date(),
                        created_by: 'user-id',
                        updated_at: new Date(),
                        updated_by: 'user-id',
                        version: 1,
                    },
                    {
                        id: 'test-id-2',
                        name: 'Entity 2',
                        email: 'test2@example.com',
                        status: 'INACTIVE',
                        created_at: new Date(),
                        created_by: 'user-id',
                        updated_at: new Date(),
                        updated_by: 'user-id',
                        version: 1,
                    },
                ],
                rowCount: 2,
                command: 'SELECT',
                oid: 0,
                fields: [],
            };
            mockDatabase.query
                .mockResolvedValueOnce(mockCountResult)
                .mockResolvedValueOnce(mockDataResult);
            const result = await repository.findAll({
                page: 1,
                limit: 10,
                sortBy: 'name',
                sortOrder: 'asc',
            });
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledWith('SELECT COUNT(*) FROM test_entities WHERE deleted_at IS NULL');
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledWith(`
      SELECT * FROM test_entities
      WHERE deleted_at IS NULL
      ORDER BY name asc
      LIMIT $1 OFFSET $2
    `, [10, 0]);
            (0, vitest_1.expect)(result).toEqual({
                items: vitest_1.expect.arrayContaining([
                    vitest_1.expect.objectContaining({ name: 'Entity 1' }),
                    vitest_1.expect.objectContaining({ name: 'Entity 2' }),
                ]),
                total: 25,
                page: 1,
                limit: 10,
                totalPages: 3,
            });
        });
    });
    (0, vitest_1.describe)('Update Operations', () => {
        (0, vitest_1.it)('should update entity successfully', async () => {
            const updates = {
                name: 'New Name',
                version: 1,
            };
            const mockFindResult = {
                rows: [{
                        id: 'test-id',
                        name: 'Old Name',
                        email: 'old@example.com',
                        status: 'ACTIVE',
                        created_at: new Date(),
                        created_by: 'user-id',
                        updated_at: new Date(),
                        updated_by: 'user-id',
                        version: 1,
                    }],
                rowCount: 1,
                command: 'SELECT',
                oid: 0,
                fields: [],
            };
            const mockUpdateResult = {
                rows: [{
                        id: 'test-id',
                        name: 'New Name',
                        email: 'old@example.com',
                        status: 'ACTIVE',
                        created_at: new Date(),
                        created_by: 'user-id',
                        updated_at: new Date(),
                        updated_by: mockUserContext.userId,
                        version: 2,
                    }],
                rowCount: 1,
                command: 'UPDATE',
                oid: 0,
                fields: [],
            };
            mockDatabase.query
                .mockResolvedValueOnce(mockFindResult)
                .mockResolvedValueOnce(mockUpdateResult);
            const result = await repository.update('test-id', updates, mockUserContext);
            (0, vitest_1.expect)(result).toEqual({
                id: 'test-id',
                name: 'New Name',
                email: 'old@example.com',
                status: 'ACTIVE',
                createdAt: vitest_1.expect.any(Date),
                createdBy: 'user-id',
                updatedAt: vitest_1.expect.any(Date),
                updatedBy: mockUserContext.userId,
                version: 2,
            });
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledTimes(3);
        });
        (0, vitest_1.it)('should throw NotFoundError when entity does not exist', async () => {
            const mockResult = { rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] };
            mockDatabase.query.mockResolvedValue(mockResult);
            await (0, vitest_1.expect)(repository.update('non-existent-id', { name: 'New Name' }, mockUserContext)).rejects.toThrow(base_1.NotFoundError);
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should throw ConflictError on version mismatch', async () => {
            const mockFindResult = {
                rows: [{ id: 'test-id', version: 2 }],
                rowCount: 1,
                command: 'SELECT',
                oid: 0,
                fields: [],
            };
            mockDatabase.query.mockResolvedValue(mockFindResult);
            await (0, vitest_1.expect)(repository.update('test-id', { version: 1 }, mockUserContext)).rejects.toThrow(base_1.ConflictError);
        });
    });
    (0, vitest_1.describe)('Delete Operations', () => {
        (0, vitest_1.it)('should soft delete entity successfully', async () => {
            const mockFindResult = {
                rows: [{
                        id: 'test-id',
                        name: 'Test Entity',
                        email: 'test@example.com',
                        status: 'ACTIVE',
                        created_at: new Date(),
                        created_by: 'user-id',
                        updated_at: new Date(),
                        updated_by: 'user-id',
                        version: 1,
                    }],
                rowCount: 1,
                command: 'SELECT',
                oid: 0,
                fields: [],
            };
            mockDatabase.query.mockResolvedValue(mockFindResult);
            await repository.delete('test-id', mockUserContext);
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenNthCalledWith(2, `
      UPDATE test_entities
      SET deleted_at = $1, deleted_by = $2
      WHERE id = $3
    `, [vitest_1.expect.any(Date), mockUserContext.userId, 'test-id']);
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledTimes(3);
        });
        (0, vitest_1.it)('should throw NotFoundError when deleting non-existent entity', async () => {
            const mockResult = { rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] };
            mockDatabase.query.mockResolvedValue(mockResult);
            await (0, vitest_1.expect)(repository.delete('non-existent-id', mockUserContext))
                .rejects.toThrow(base_1.NotFoundError);
        });
    });
    (0, vitest_1.describe)('Audit Trail', () => {
        (0, vitest_1.it)('should get revision history for entity', async () => {
            const mockRevisions = [
                {
                    revision_id: 'rev-1',
                    entity_id: 'test-id',
                    entity_type: 'test_entities',
                    timestamp: new Date(),
                    user_id: 'user-id',
                    operation: 'CREATE',
                    changes: '{}',
                    snapshot: '{}',
                    ip_address: null,
                    user_agent: null,
                },
            ];
            const mockResult = { rows: mockRevisions, rowCount: 1, command: 'SELECT', oid: 0, fields: [] };
            mockDatabase.query.mockResolvedValue(mockResult);
            const history = await repository.getRevisionHistory('test-id');
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledWith(`
      SELECT * FROM audit_revisions
      WHERE entity_id = $1 AND entity_type = $2
      ORDER BY timestamp DESC
    `, ['test-id', 'test_entities']);
            (0, vitest_1.expect)(history).toEqual([
                {
                    revisionId: 'rev-1',
                    timestamp: vitest_1.expect.any(Date),
                    userId: 'user-id',
                    operation: 'CREATE',
                    changes: {},
                    ipAddress: null,
                    userAgent: null,
                },
            ]);
        });
        (0, vitest_1.it)('should return empty array when audit is disabled', async () => {
            const repo = new TestRepository({
                tableName: 'test_entities',
                database: mockDatabase,
                enableAudit: false,
            });
            const history = await repo.getRevisionHistory('test-id');
            (0, vitest_1.expect)(history).toEqual([]);
            (0, vitest_1.expect)(mockDatabase.query).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=repository.test.js.map