/**
 * Tests for base types and error classes
 */

import {
  DomainError,
  ValidationError,
  PermissionError,
  NotFoundError,
  ConflictError,
  Result,
  PaginationParams,
  PaginatedResult,
  Entity,
  SoftDeletable,
  Auditable,
  Revision,
  UserContext,
  LifecycleStatus,
  Role,
  SyncMetadata,
  isValidUUID,
  requireValidUUID,
  UUID_REGEX,
} from '../../types/base';
import { describe, it, expect } from 'vitest';

describe('Base Types', () => {
  describe('Error Classes', () => {
    describe('DomainError', () => {
      it('should create a DomainError with message and code', () => {
        const error = new DomainError('Test error', 'TEST_CODE');

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(DomainError);
        expect(error.name).toBe('DomainError');
        expect(error.message).toBe('Test error');
        expect(error.code).toBe('TEST_CODE');
        expect(error.statusCode).toBe(500); // Default status code
        expect(error.context).toBeUndefined();
      });

      it('should create a DomainError with custom status code and context', () => {
        const context = { field: 'value' };
        const error = new DomainError('Test error', 'TEST_CODE', 418, context);

        expect(error.statusCode).toBe(418);
        expect(error.context).toEqual(context);
      });
    });

    describe('ValidationError', () => {
      it('should create a ValidationError with correct properties', () => {
        const error = new ValidationError('Invalid input');

        expect(error).toBeInstanceOf(DomainError);
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.name).toBe('ValidationError');
        expect(error.message).toBe('Invalid input');
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.statusCode).toBe(400);
      });

      it('should accept context', () => {
        const context = { field: 'email', value: 'invalid' };
        const error = new ValidationError('Invalid email', context);

        expect(error.context).toEqual(context);
      });
    });

    describe('PermissionError', () => {
      it('should create a PermissionError with correct properties', () => {
        const error = new PermissionError('Access denied');

        expect(error).toBeInstanceOf(DomainError);
        expect(error).toBeInstanceOf(PermissionError);
        expect(error.name).toBe('PermissionError');
        expect(error.message).toBe('Access denied');
        expect(error.code).toBe('PERMISSION_DENIED');
        expect(error.statusCode).toBe(403);
      });
    });

    describe('NotFoundError', () => {
      it('should create a NotFoundError with correct properties', () => {
        const error = new NotFoundError('Resource not found');

        expect(error).toBeInstanceOf(DomainError);
        expect(error).toBeInstanceOf(NotFoundError);
        expect(error.name).toBe('NotFoundError');
        expect(error.message).toBe('Resource not found');
        expect(error.code).toBe('NOT_FOUND');
        expect(error.statusCode).toBe(404);
      });
    });

    describe('ConflictError', () => {
      it('should create a ConflictError with correct properties', () => {
        const error = new ConflictError('Resource already exists');

        expect(error).toBeInstanceOf(DomainError);
        expect(error).toBeInstanceOf(ConflictError);
        expect(error.name).toBe('ConflictError');
        expect(error.message).toBe('Resource already exists');
        expect(error.code).toBe('CONFLICT');
        expect(error.statusCode).toBe(409);
      });
    });
  });

  describe('Result Type', () => {
    it('should represent a successful result', () => {
      const result: Result<string> = { success: true, value: 'success' };
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
    });

    it('should represent a failed result', () => {
      const error = new ValidationError('fail');
      const result: Result<string> = { success: false, error };
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
    });

    it('should work with type guards', () => {
      const successResult: Result<string> = { success: true, value: 'test' };
      const failureResult: Result<string> = { success: false, error: new ValidationError('fail') };

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Type guard for discriminated union
      if (successResult.success) {
        expect(successResult.value).toBe('test');
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Type guard for discriminated union
      if (!failureResult.success) {
        expect(failureResult.error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Pagination Types', () => {
    it('should create valid PaginationParams', () => {
      const params: PaginationParams = {
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      };

      expect(params.page).toBe(1);
      expect(params.limit).toBe(10);
      expect(params.sortBy).toBe('name');
      expect(params.sortOrder).toBe('asc');
    });

    it('should create valid PaginatedResult', () => {
      const result: PaginatedResult<string> = {
        items: ['item1', 'item2'],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('Entity Types', () => {
    it('should create a valid Entity', () => {
      const entity: Entity = {
        id: 'test-id',
        createdAt: new Date(),
        createdBy: 'user-id',
        updatedAt: new Date(),
        updatedBy: 'user-id',
        version: 1,
      };

      expect(entity.id).toBe('test-id');
      expect(entity.version).toBe(1);
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a valid SoftDeletable entity', () => {
      const softDeletable: SoftDeletable = {
        deletedAt: null,
        deletedBy: null,
      };

      expect(softDeletable.deletedAt).toBeNull();
      expect(softDeletable.deletedBy).toBeNull();
    });

    it('should create a valid Auditable entity', () => {
      const revision: Revision = {
        revisionId: 'rev-id',
        timestamp: new Date(),
        userId: 'user-id',
        operation: 'CREATE',
        changes: { name: { from: 'old', to: 'new' } },
      };

      const auditable: Auditable = {
        id: 'test-id',
        createdAt: new Date(),
        createdBy: 'user-id',
        updatedAt: new Date(),
        updatedBy: 'user-id',
        version: 1,
        revisionHistory: [revision],
      };

      expect(auditable.revisionHistory).toHaveLength(1);
      expect(auditable.revisionHistory[0]?.operation).toBe('CREATE');
    });
  });

  describe('UserContext', () => {
    it('should create a valid UserContext', () => {
      const context: UserContext = {
        userId: 'user-id',
        roles: ['COORDINATOR', 'CAREGIVER'],
        permissions: ['clients:read', 'clients:write'],
        organizationId: 'org-id',
        branchIds: ['branch-1', 'branch-2'],
      };

      expect(context.userId).toBe('user-id');
      expect(context.roles).toContain('COORDINATOR');
      expect(context.permissions).toContain('clients:read');
      expect(context.organizationId).toBe('org-id');
      expect(context.branchIds).toHaveLength(2);
    });
  });

  describe('LifecycleStatus', () => {
    it('should accept valid lifecycle statuses', () => {
      const validStatuses: LifecycleStatus[] = [
        'DRAFT',
        'ACTIVE',
        'INACTIVE',
        'SUSPENDED',
        'ARCHIVED',
      ];

      validStatuses.forEach(status => {
        expect(status).toBeDefined();
      });
    });
  });

  describe('Role Type', () => {
    it('should accept valid roles', () => {
      const validRoles: Role[] = [
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
        expect(role).toBeDefined();
      });
    });
  });

  describe('SyncMetadata', () => {
    it('should create valid SyncMetadata', () => {
      const sync: SyncMetadata = {
        syncId: 'sync-id',
        lastSyncedAt: new Date(),
        syncStatus: 'SYNCED',
      };

      expect(sync.syncId).toBe('sync-id');
      expect(sync.syncStatus).toBe('SYNCED');
      expect(sync.lastSyncedAt).toBeInstanceOf(Date);
      expect(sync.conflictData).toBeUndefined();
    });

    it('should include conflict data when present', () => {
      const sync: SyncMetadata = {
        syncId: 'sync-id',
        lastSyncedAt: null,
        syncStatus: 'CONFLICT',
        conflictData: { field: 'conflicting value' },
      };

      expect(sync.syncStatus).toBe('CONFLICT');
      expect(sync.lastSyncedAt).toBeNull();
      expect(sync.conflictData).toEqual({ field: 'conflicting value' });
    });
  });

  describe('UUID Validation', () => {
    describe('UUID_REGEX', () => {
      it('should match valid UUIDs', () => {
        expect(UUID_REGEX.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
        expect(UUID_REGEX.test('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
        expect(UUID_REGEX.test('ABCDEFAB-1234-5678-9ABC-DEF012345678')).toBe(true);
      });

      it('should not match invalid UUIDs', () => {
        expect(UUID_REGEX.test('')).toBe(false);
        expect(UUID_REGEX.test('invalid-uuid')).toBe(false);
        expect(UUID_REGEX.test('550e8400-e29b-41d4-a716')).toBe(false);
        expect(UUID_REGEX.test('550e8400e29b41d4a716446655440000')).toBe(false);
        expect(UUID_REGEX.test('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false);
      });
    });

    describe('isValidUUID', () => {
      it('should return true for valid UUIDs', () => {
        expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
        expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      });

      it('should return false for invalid UUIDs', () => {
        expect(isValidUUID('')).toBe(false);
        expect(isValidUUID('invalid-uuid')).toBe(false);
        expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
      });

      it('should return false for non-string values', () => {
        expect(isValidUUID(null)).toBe(false);
        expect(isValidUUID(undefined)).toBe(false);
        expect(isValidUUID(123)).toBe(false);
        expect(isValidUUID({})).toBe(false);
        expect(isValidUUID([])).toBe(false);
      });
    });

    describe('requireValidUUID', () => {
      it('should return UUID for valid values', () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        expect(requireValidUUID(validUuid, 'testField')).toBe(validUuid);
      });

      it('should throw ValidationError for invalid UUIDs', () => {
        expect(() => requireValidUUID('invalid-uuid', 'testField')).toThrow(ValidationError);
        expect(() => requireValidUUID('', 'testField')).toThrow(ValidationError);
        expect(() => requireValidUUID('550e8400-e29b-41d4-a716', 'testField')).toThrow(ValidationError);
      });

      it('should throw ValidationError for non-string values', () => {
        expect(() => requireValidUUID(null, 'testField')).toThrow(ValidationError);
        expect(() => requireValidUUID(undefined, 'testField')).toThrow(ValidationError);
        expect(() => requireValidUUID(123, 'testField')).toThrow(ValidationError);
      });

      it('should include field name in error message', () => {
        try {
          requireValidUUID('invalid', 'organizationId');
          expect.fail('Should have thrown ValidationError');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).message).toContain('organizationId');
          expect((error as ValidationError).message).toContain('UUID');
        }
      });
    });
  });
});