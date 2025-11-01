/**
 * UserRepository tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRepository } from '../../repository/user-repository';
import { Database } from '../../db/connection';

describe('UserRepository', () => {
  let repository: UserRepository;
  let mockDb: Database;

  beforeEach(() => {
    mockDb = {
      query: vi.fn(),
    } as unknown as Database;
    repository = new UserRepository(mockDb);
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
      };

      vi.spyOn(mockDb, 'query').mockResolvedValue({
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await repository.getUserById('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, first_name, last_name, email'),
        ['123e4567-e89b-12d3-a456-426614174000']
      );
    });

    it('should return null when user not found', async () => {
      vi.spyOn(mockDb, 'query').mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await repository.getUserById('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should filter out soft-deleted users', async () => {
      vi.spyOn(mockDb, 'query').mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await repository.getUserById('deleted-user-id');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at IS NULL'),
        ['deleted-user-id']
      );
    });
  });

  describe('getUsersByIds', () => {
    it('should return empty array when no IDs provided', async () => {
      const result = await repository.getUsersByIds([]);

      expect(result).toEqual([]);
      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it('should return multiple users', async () => {
      const mockUsers = [
        {
          id: 'id-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
        {
          id: 'id-2',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
        },
      ];

      vi.spyOn(mockDb, 'query').mockResolvedValue({
        rows: mockUsers,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await repository.getUsersByIds(['id-1', 'id-2']);

      expect(result).toEqual([
        {
          id: 'id-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        {
          id: 'id-2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
        },
      ]);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('id = ANY($1)'),
        [['id-1', 'id-2']]
      );
    });

    it('should order results by last name and first name', async () => {
      vi.spyOn(mockDb, 'query').mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await repository.getUsersByIds(['id-1', 'id-2']);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY last_name, first_name'),
        [['id-1', 'id-2']]
      );
    });

    it('should filter out soft-deleted users', async () => {
      vi.spyOn(mockDb, 'query').mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await repository.getUsersByIds(['id-1']);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at IS NULL'),
        [['id-1']]
      );
    });
  });
});
