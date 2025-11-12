/**
 * Conflict Resolver Tests
 *
 * Tests conflict resolution strategies for offline sync:
 * - Last-write-wins based on timestamps
 * - Record-type-specific merge strategies
 * - Visit conflict resolution (merge documentation fields)
 * - Task conflict resolution (client-wins if completed)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConflictResolver } from '../conflict-resolver.js';

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;

  beforeEach(() => {
    resolver = new ConflictResolver();
  });

  describe('Last-Write-Wins Strategy', () => {
    it('should choose client record when client is newer', () => {
      const clientRecord = {
        id: '1',
        updatedAt: new Date('2025-01-02T10:00:00Z'),
        name: 'Client Version'
      };

      const serverRecord = {
        id: '1',
        updatedAt: new Date('2025-01-01T10:00:00Z'),
        name: 'Server Version'
      };

      const result = resolver.resolve(clientRecord as any, serverRecord as any, 'generic');

      expect(result.strategy).toBe('client-wins');
      expect(result.resolvedRecord).toEqual(clientRecord);
    });

    it('should choose server record when server is newer', () => {
      const clientRecord = {
        id: '1',
        updatedAt: new Date('2025-01-01T10:00:00Z'),
        name: 'Client Version'
      };

      const serverRecord = {
        id: '1',
        updatedAt: new Date('2025-01-02T10:00:00Z'),
        name: 'Server Version'
      };

      const result = resolver.resolve(clientRecord as any, serverRecord as any, 'generic');

      expect(result.strategy).toBe('server-wins');
      expect(result.resolvedRecord).toEqual(serverRecord);
    });

    it('should use record-type-specific resolution when timestamps are equal', () => {
      const timestamp = new Date('2025-01-01T10:00:00Z');

      const clientRecord = {
        id: '1',
        updatedAt: timestamp,
        name: 'Client Version'
      };

      const serverRecord = {
        id: '1',
        updatedAt: timestamp,
        name: 'Server Version'
      };

      // For unknown record types with equal timestamps, should default to server-wins
      const result = resolver.resolve(clientRecord as any, serverRecord as any, 'unknown');

      expect(result.strategy).toBe('server-wins');
      expect(result.resolvedRecord).toEqual(serverRecord);
    });
  });

  describe('Visit Conflict Resolution', () => {
    const timestamp = new Date('2025-01-01T10:00:00Z');

    it('should merge visit records with smart field selection', () => {
      const clientRecord = {
        id: 'visit-1',
        updatedAt: timestamp,
        scheduled_date: '2025-01-01',
        client_id: 'client-1',
        caregiver_id: 'cg-1',
        care_notes: 'Client added detailed notes',
        tasks_completed: ['task-1', 'task-2'],
        check_in_time: '2025-01-01T09:00:00Z',
        check_out_time: '2025-01-01T10:00:00Z'
      };

      const serverRecord = {
        id: 'visit-1',
        updatedAt: timestamp,
        scheduled_date: '2025-01-02', // Server changed schedule
        client_id: 'client-1',
        caregiver_id: 'cg-2', // Server reassigned caregiver
        care_notes: null,
        tasks_completed: [],
        check_in_time: null,
        check_out_time: null
      };

      const result = resolver.resolve(clientRecord as any, serverRecord as any, 'visit');

      expect(result.strategy).toBe('merge');
      // Server wins for scheduling fields
      expect(result.resolvedRecord.scheduled_date).toBe('2025-01-02');
      expect(result.resolvedRecord.caregiver_id).toBe('cg-2');
      // Client wins for documentation fields
      expect(result.resolvedRecord.care_notes).toBe('Client added detailed notes');
      expect(result.resolvedRecord.tasks_completed).toEqual(['task-1', 'task-2']);
      expect(result.resolvedRecord.check_in_time).toBe('2025-01-01T09:00:00Z');
      expect(result.resolvedRecord.check_out_time).toBe('2025-01-01T10:00:00Z');
    });

    it('should preserve server values when client has no documentation', () => {
      const clientRecord = {
        id: 'visit-1',
        updatedAt: timestamp,
        care_notes: null,
        tasks_completed: null,
        check_in_time: null,
        check_out_time: null
      };

      const serverRecord = {
        id: 'visit-1',
        updatedAt: timestamp,
        care_notes: 'Server notes',
        tasks_completed: ['task-1'],
        check_in_time: '2025-01-01T08:00:00Z',
        check_out_time: '2025-01-01T09:00:00Z'
      };

      const result = resolver.resolve(clientRecord as any, serverRecord as any, 'visit');

      expect(result.strategy).toBe('merge');
      expect(result.resolvedRecord.care_notes).toBe('Server notes');
      expect(result.resolvedRecord.tasks_completed).toEqual(['task-1']);
      expect(result.resolvedRecord.check_in_time).toBe('2025-01-01T08:00:00Z');
      expect(result.resolvedRecord.check_out_time).toBe('2025-01-01T09:00:00Z');
    });
  });

  describe('Task Conflict Resolution', () => {
    const timestamp = new Date('2025-01-01T10:00:00Z');

    it('should choose client when client marked task complete', () => {
      const clientRecord = {
        id: 'task-1',
        updatedAt: timestamp,
        status: 'completed',
        completed_at: '2025-01-01T10:00:00Z',
        notes: 'Completed by caregiver'
      };

      const serverRecord = {
        id: 'task-1',
        updatedAt: timestamp,
        status: 'pending',
        completed_at: null,
        notes: null
      };

      const result = resolver.resolve(clientRecord as any, serverRecord as any, 'task');

      expect(result.strategy).toBe('client-wins');
      expect(result.resolvedRecord).toEqual(clientRecord);
      expect(result.resolvedRecord.status).toBe('completed');
    });

    it('should choose server when client did not complete task', () => {
      const clientRecord = {
        id: 'task-1',
        updatedAt: timestamp,
        status: 'pending',
        notes: 'Client notes'
      };

      const serverRecord = {
        id: 'task-1',
        updatedAt: timestamp,
        status: 'pending',
        notes: 'Server notes'
      };

      const result = resolver.resolve(clientRecord as any, serverRecord as any, 'task');

      expect(result.strategy).toBe('server-wins');
      expect(result.resolvedRecord).toEqual(serverRecord);
    });

    it('should choose server when both have task completed', () => {
      const clientRecord = {
        id: 'task-1',
        updatedAt: timestamp,
        status: 'completed',
        completed_at: '2025-01-01T09:00:00Z'
      };

      const serverRecord = {
        id: 'task-1',
        updatedAt: timestamp,
        status: 'completed',
        completed_at: '2025-01-01T10:00:00Z'
      };

      const result = resolver.resolve(clientRecord as any, serverRecord as any, 'task');

      expect(result.strategy).toBe('server-wins');
      expect(result.resolvedRecord).toEqual(serverRecord);
    });

    it('should choose server when server completed but client did not', () => {
      const clientRecord = {
        id: 'task-1',
        updatedAt: timestamp,
        status: 'pending'
      };

      const serverRecord = {
        id: 'task-1',
        updatedAt: timestamp,
        status: 'completed',
        completed_at: '2025-01-01T10:00:00Z'
      };

      const result = resolver.resolve(clientRecord as any, serverRecord as any, 'task');

      expect(result.strategy).toBe('server-wins');
      expect(result.resolvedRecord).toEqual(serverRecord);
    });
  });

  describe('Default Fallback Strategy', () => {
    it('should default to server-wins for unknown record types with equal timestamps', () => {
      const timestamp = new Date('2025-01-01T10:00:00Z');

      const clientRecord = {
        id: '1',
        updatedAt: timestamp,
        data: 'client'
      };

      const serverRecord = {
        id: '1',
        updatedAt: timestamp,
        data: 'server'
      };

      const result = resolver.resolve(clientRecord as any, serverRecord as any, 'unknown-type');

      expect(result.strategy).toBe('server-wins');
      expect(result.resolvedRecord).toEqual(serverRecord);
    });
  });
});
