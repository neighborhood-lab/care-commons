/**
 * Tests for repository pattern with CRUD operations
 */

import { Repository } from '../../db/repository';
import { Entity, UserContext, NotFoundError, ConflictError } from '../../types/base';
import { vi, describe, it, expect, beforeEach } from 'vitest';

interface MockDatabase {
  query: ReturnType<typeof vi.fn>;
  getClient: ReturnType<typeof vi.fn>;
  transaction: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  healthCheck: ReturnType<typeof vi.fn>;
  pool: unknown;
}

const createMockUserContext = (overrides = {}) => ({
  userId: 'test-user-id',
  roles: ['COORDINATOR' as const],
  permissions: ['clients:read', 'clients:write'],
  organizationId: 'test-org-id',
  branchIds: ['test-branch-id'],
  ...overrides,
});

// Mock Database
vi.mock('../../db/connection');

// Mock UUID
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-entity-id'),
}));

// Test entity interface
interface TestEntity extends Entity {
  name: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
}

// Test repository implementation
class TestRepository extends Repository<TestEntity> {
  protected mapRowToEntity(row: Record<string, unknown>): TestEntity {
    return {
      id: row.id as string,
      name: row.name as string,
      email: row.email as string,
      status: row.status as 'ACTIVE' | 'INACTIVE',
      createdAt: row.created_at as Date,
      createdBy: row.created_by as string,
      updatedAt: row.updated_at as Date,
      updatedBy: row.updated_by as string,
      version: row.version as number,
    };
  }

  protected mapEntityToRow(entity: Partial<TestEntity>): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    if (entity.name !== undefined) row.name = entity.name;
    if (entity.email !== undefined) row.email = entity.email;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.version !== undefined) row.version = entity.version;
    return row;
  }
}

describe('Repository Pattern', () => {
  let repository: TestRepository;
  let mockDatabase: MockDatabase;
  let mockUserContext: UserContext;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock database
    mockDatabase = {
      query: vi.fn(),
      getClient: vi.fn(),
      transaction: vi.fn(),
      close: vi.fn(),
      healthCheck: vi.fn(),
    } as any;

    // Create repository instance
    repository = new TestRepository({
      tableName: 'test_entities',
      database: mockDatabase as any,
      enableAudit: true,
      enableSoftDelete: true,
    });

    mockUserContext = createMockUserContext();
  });

  describe('Repository Configuration', () => {
    it('should initialize with correct configuration', () => {
      expect(repository).toBeInstanceOf(Repository);
    });

    it('should use default values when not provided', () => {
      const repo = new TestRepository({
        tableName: 'test_entities',
        database: mockDatabase as any,
      });

      expect(repo).toBeInstanceOf(Repository);
    });
  });

  describe('Create Operations', () => {
    it('should create a new entity successfully', async () => {
      const entityData = {
        name: 'Test Entity',
        email: 'test@example.com',
        status: 'ACTIVE' as const,
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
        command: 'INSERT' as const,
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      const result = await repository.create(entityData, mockUserContext);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO test_entities'),
        expect.arrayContaining([
          'Test Entity',
          'test@example.com',
          'ACTIVE',
          'test-entity-id',
          expect.any(Date),
          mockUserContext.userId,
          expect.any(Date),
          mockUserContext.userId,
          1,
          null,
          null,
        ])
      );

      expect(result).toEqual({
        id: 'test-entity-id',
        name: 'Test Entity',
        email: 'test@example.com',
        status: 'ACTIVE',
        createdAt: expect.any(Date),
        createdBy: mockUserContext.userId,
        updatedAt: expect.any(Date),
        updatedBy: mockUserContext.userId,
        version: 1,
      });

      // Should create audit revision
      expect(mockDatabase.query).toHaveBeenCalledTimes(2);
    });

    it('should create entity without audit when disabled', async () => {
      const repo = new TestRepository({
        tableName: 'test_entities',
        database: mockDatabase as any,
        enableAudit: false,
      });

      const entityData = { name: 'Test', email: 'test@test.com', status: 'ACTIVE' as const };
      const mockResult = { rows: [{}], rowCount: 1, command: 'INSERT' as const, oid: 0, fields: [] };

      mockDatabase.query.mockResolvedValue(mockResult);

      await repo.create(entityData, mockUserContext);

      expect(mockDatabase.query).toHaveBeenCalledTimes(1); // Only INSERT, no audit
    });
  });

  describe('Read Operations', () => {
    it('should find entity by ID successfully', async () => {
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
        command: 'SELECT' as const,
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      const result = await repository.findById('test-id');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        'SELECT * FROM test_entities WHERE id = $1 AND deleted_at IS NULL',
        ['test-id']
      );

      expect(result).toEqual({
        id: 'test-id',
        name: 'Test Entity',
        email: 'test@example.com',
        status: 'ACTIVE',
        createdAt: expect.any(Date),
        createdBy: 'user-id',
        updatedAt: expect.any(Date),
        updatedBy: 'user-id',
        version: 1,
      });
    });

    it('should return null when entity not found', async () => {
      const mockResult = { rows: [], rowCount: 0, command: 'SELECT' as const, oid: 0, fields: [] };
      mockDatabase.query.mockResolvedValue(mockResult);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should find all entities with pagination', async () => {
      const mockCountResult = { rows: [{ count: '25' }], rowCount: 1, command: 'SELECT' as const, oid: 0, fields: [] };
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
        command: 'SELECT' as const,
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

      expect(mockDatabase.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) FROM test_entities WHERE deleted_at IS NULL'
      );
      expect(mockDatabase.query).toHaveBeenCalledWith(
        `
      SELECT * FROM test_entities
      WHERE deleted_at IS NULL
      ORDER BY name asc
      LIMIT $1 OFFSET $2
    `,
        [10, 0]
      );

      expect(result).toEqual({
        items: expect.arrayContaining([
          expect.objectContaining({ name: 'Entity 1' }),
          expect.objectContaining({ name: 'Entity 2' }),
        ]),
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      });
    });
  });

  describe('Update Operations', () => {
    it('should update entity successfully', async () => {
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
        command: 'SELECT' as const,
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
        command: 'UPDATE' as const,
        oid: 0,
        fields: [],
      };

      mockDatabase.query
        .mockResolvedValueOnce(mockFindResult) // findById
        .mockResolvedValueOnce(mockUpdateResult); // UPDATE

      const result = await repository.update('test-id', updates, mockUserContext);

      expect(result).toEqual({
        id: 'test-id',
        name: 'New Name',
        email: 'old@example.com',
        status: 'ACTIVE',
        createdAt: expect.any(Date),
        createdBy: 'user-id',
        updatedAt: expect.any(Date),
        updatedBy: mockUserContext.userId,
        version: 2,
      });

      expect(mockDatabase.query).toHaveBeenCalledTimes(3); // findById + UPDATE + audit
    });

    it('should throw NotFoundError when entity does not exist', async () => {
      const mockResult = { rows: [], rowCount: 0, command: 'SELECT' as const, oid: 0, fields: [] };
      mockDatabase.query.mockResolvedValue(mockResult);

      await expect(
        repository.update('non-existent-id', { name: 'New Name' }, mockUserContext)
      ).rejects.toThrow(NotFoundError);

      expect(mockDatabase.query).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictError on version mismatch', async () => {
      const mockFindResult = {
        rows: [{ id: 'test-id', version: 2 }],
        rowCount: 1,
        command: 'SELECT' as const,
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockFindResult);

      await expect(
        repository.update('test-id', { version: 1 }, mockUserContext)
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('Delete Operations', () => {
    it('should soft delete entity successfully', async () => {
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
        command: 'SELECT' as const,
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockFindResult);

      await repository.delete('test-id', mockUserContext);

      expect(mockDatabase.query).toHaveBeenNthCalledWith(2,
        `
      UPDATE test_entities
      SET deleted_at = $1, deleted_by = $2
      WHERE id = $3
    `,
        [expect.any(Date), mockUserContext.userId, 'test-id']
      );

      expect(mockDatabase.query).toHaveBeenCalledTimes(3); // findById + UPDATE + audit
    });

    it('should throw NotFoundError when deleting non-existent entity', async () => {
      const mockResult = { rows: [], rowCount: 0, command: 'SELECT' as const, oid: 0, fields: [] };
      mockDatabase.query.mockResolvedValue(mockResult);

      await expect(repository.delete('non-existent-id', mockUserContext))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('Audit Trail', () => {
    it('should get revision history for entity', async () => {
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

      const mockResult = { rows: mockRevisions, rowCount: 1, command: 'SELECT' as const, oid: 0, fields: [] };
      mockDatabase.query.mockResolvedValue(mockResult);

      const history = await repository.getRevisionHistory('test-id');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        `
      SELECT * FROM audit_revisions
      WHERE entity_id = $1 AND entity_type = $2
      ORDER BY timestamp DESC
    `,
        ['test-id', 'test_entities']
      );

      expect(history).toEqual([
        {
          revisionId: 'rev-1',
          timestamp: expect.any(Date),
          userId: 'user-id',
          operation: 'CREATE',
          changes: {},
          ipAddress: null,
          userAgent: null,
        },
      ]);
    });

    it('should return empty array when audit is disabled', async () => {
      const repo = new TestRepository({
        tableName: 'test_entities',
        database: mockDatabase as any,
        enableAudit: false,
      });

      const history = await repo.getRevisionHistory('test-id');

      expect(history).toEqual([]);
      expect(mockDatabase.query).not.toHaveBeenCalled();
    });
  });
});