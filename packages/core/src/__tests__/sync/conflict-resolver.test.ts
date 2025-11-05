/**
 * Conflict Resolver Tests
 * 
 * Tests conflict resolution strategies for offline-first sync.
 * Critical for ensuring data integrity when caregivers work offline.
 */

import { describe, it, expect } from 'vitest';
import { ConflictResolver } from '../../sync/conflict-resolver.js';
import type { SyncConflict } from '../../sync/types.js';

describe('ConflictResolver', () => {
  const resolver = new ConflictResolver();

  describe('Last Write Wins Strategy', () => {
    it('should choose remote value when remote is newer', async () => {
      const conflict: SyncConflict = {
        id: 'conflict_1',
        entityType: 'VISIT',
        entityId: 'visit_123',
        field: 'status',
        localValue: 'SCHEDULED',
        localUpdatedAt: 1000,
        remoteValue: 'IN_PROGRESS',
        remoteUpdatedAt: 2000, // Newer
        serverVersion: 2,
        clientVersion: 1,
      };

      const resolution = await resolver.resolve(conflict);

      expect(resolution.winner).toBe('REMOTE');
      expect(resolution.value).toBe('IN_PROGRESS');
      expect(resolution.strategy).toBe('LAST_WRITE_WINS');
    });

    it('should choose local value when local is newer', async () => {
      const conflict: SyncConflict = {
        id: 'conflict_2',
        entityType: 'VISIT',
        entityId: 'visit_123',
        field: 'status',
        localValue: 'COMPLETED',
        localUpdatedAt: 3000, // Newer
        remoteValue: 'IN_PROGRESS',
        remoteUpdatedAt: 2000,
        serverVersion: 2,
        clientVersion: 1,
      };

      const resolution = await resolver.resolve(conflict);

      expect(resolution.winner).toBe('LOCAL');
      expect(resolution.value).toBe('COMPLETED');
      expect(resolution.strategy).toBe('LAST_WRITE_WINS');
    });
  });

  describe('Merge Arrays Strategy', () => {
    it('should merge arrays from local and remote', async () => {
      const conflict: SyncConflict = {
        id: 'conflict_3',
        entityType: 'VISIT',
        entityId: 'visit_123',
        field: 'tasks',
        localValue: [
          { id: 'task_1', title: 'Medication', updatedAt: 1000 },
          { id: 'task_2', title: 'Vitals', updatedAt: 2000 },
        ],
        localUpdatedAt: 2000,
        remoteValue: [
          { id: 'task_1', title: 'Medication', updatedAt: 1000 },
          { id: 'task_3', title: 'Bathing', updatedAt: 1500 },
        ],
        remoteUpdatedAt: 2000,
        serverVersion: 2,
        clientVersion: 1,
      };

      const resolution = await resolver.resolve(conflict);

      expect(resolution.winner).toBe('MERGED');
      expect(resolution.strategy).toBe('MERGE_ARRAYS');
      
      const merged = resolution.value as Array<{ id: string }>;
      expect(merged).toHaveLength(3);
      expect(merged.some(t => t.id === 'task_1')).toBe(true);
      expect(merged.some(t => t.id === 'task_2')).toBe(true);
      expect(merged.some(t => t.id === 'task_3')).toBe(true);
    });

    it('should keep newer version when same id in array', async () => {
      const conflict: SyncConflict = {
        id: 'conflict_4',
        entityType: 'VISIT',
        entityId: 'visit_123',
        field: 'tasks',
        localValue: [
          { id: 'task_1', title: 'Old Title', updatedAt: 1000 },
        ],
        localUpdatedAt: 1000,
        remoteValue: [
          { id: 'task_1', title: 'New Title', updatedAt: 2000 },
        ],
        remoteUpdatedAt: 2000,
        serverVersion: 2,
        clientVersion: 1,
      };

      const resolution = await resolver.resolve(conflict);

      const merged = resolution.value as Array<{ id: string; title: string }>;
      expect(merged).toHaveLength(1);
      expect(merged[0]?.title).toBe('New Title');
    });
  });

  describe('Manual Review Strategy', () => {
    it('should require manual review for critical EVV fields', async () => {
      const conflict: SyncConflict = {
        id: 'conflict_5',
        entityType: 'EVV_RECORD',
        entityId: 'evv_123',
        field: 'clockInTime',
        localValue: 1609459200000, // Jan 1, 2021 00:00:00
        localUpdatedAt: 1000,
        remoteValue: 1609462800000, // Jan 1, 2021 01:00:00
        remoteUpdatedAt: 2000,
        serverVersion: 2,
        clientVersion: 1,
      };

      const resolution = await resolver.resolve(conflict);

      expect(resolution.winner).toBe('MANUAL');
      expect(resolution.strategy).toBe('MANUAL_REVIEW');
      expect(resolution.requiresReview).toBe(true);
      expect(resolution.reviewBy).toBe('ADMINISTRATOR'); // Clock time is billing-related
    });

    it('should require manual review for clock out time', async () => {
      const conflict: SyncConflict = {
        id: 'conflict_6',
        entityType: 'TIME_ENTRY',
        entityId: 'entry_123',
        field: 'clockOutTime',
        localValue: 1609459200000,
        localUpdatedAt: 1000,
        remoteValue: 1609462800000,
        remoteUpdatedAt: 2000,
        serverVersion: 2,
        clientVersion: 1,
      };

      const resolution = await resolver.resolve(conflict);

      expect(resolution.requiresReview).toBe(true);
      expect(resolution.strategy).toBe('MANUAL_REVIEW');
    });
  });

  describe('Batch Resolution', () => {
    it('should resolve multiple conflicts', async () => {
      const conflicts: SyncConflict[] = [
        {
          id: 'conflict_7',
          entityType: 'VISIT',
          entityId: 'visit_123',
          field: 'status',
          localValue: 'COMPLETED',
          localUpdatedAt: 3000,
          remoteValue: 'IN_PROGRESS',
          remoteUpdatedAt: 2000,
          serverVersion: 2,
          clientVersion: 1,
        },
        {
          id: 'conflict_8',
          entityType: 'VISIT',
          entityId: 'visit_123',
          field: 'tasks',
          localValue: [{ id: 'task_1' }],
          localUpdatedAt: 2000,
          remoteValue: [{ id: 'task_2' }],
          remoteUpdatedAt: 2000,
          serverVersion: 2,
          clientVersion: 1,
        },
      ];

      const resolutions = await resolver.resolveAll(conflicts);

      expect(resolutions).toHaveLength(2);
      expect(resolutions[0]?.strategy).toBe('LAST_WRITE_WINS');
      expect(resolutions[1]?.strategy).toBe('MERGE_ARRAYS');
    });
  });
});
