import { describe, it, expect } from 'vitest';
import {
  ConflictResolver,
  type ManualResolution,
} from '../conflict-resolver';

describe('ConflictResolver - Comprehensive Coverage', () => {
  const resolver = new ConflictResolver();

  describe('Timestamp-based Resolution', () => {
    it('should choose client when client is newer', () => {
      const client = {
        id: '1',
        updatedAt: new Date('2025-01-02').getTime(),
        data: 'client',
      };
      const server = {
        id: '1',
        updatedAt: new Date('2025-01-01').getTime(),
        data: 'server',
      };

      const result = resolver.resolve(client as any, server as any, 'unknown');

      expect(result.strategy).toBe('client-wins');
      expect(result.resolvedRecord).toEqual(client);
    });

    it('should choose server when server is newer', () => {
      const client = {
        id: '1',
        updatedAt: new Date('2025-01-01').getTime(),
        data: 'client',
      };
      const server = {
        id: '1',
        updatedAt: new Date('2025-01-02').getTime(),
        data: 'server',
      };

      const result = resolver.resolve(client as any, server as any, 'unknown');

      expect(result.strategy).toBe('server-wins');
      expect(result.resolvedRecord).toEqual(server);
    });
  });

  describe('Visit Conflict Resolution', () => {
    const timestamp = new Date('2025-01-01').getTime();

    it('should detect critical field conflicts', () => {
      const client = {
        id: 'v1',
        updatedAt: timestamp,
        clock_in_time: '09:00',
        care_notes: 'Client notes',
      };
      const server = {
        id: 'v1',
        updatedAt: timestamp,
        clock_in_time: '09:05', // Different - CRITICAL conflict
        care_notes: null,
      };

      const result = resolver.resolve(client as any, server as any, 'visit');

      expect(result.strategy).toBe('manual');
      expect(result.requiresManualReview).toBe(true);
      expect(result.fieldConflicts).toBeDefined();
      expect(result.fieldConflicts?.some((f) => f.field === 'clock_in_time')).toBe(true);
    });

    it('should merge when client has clock times and server does not', () => {
      const client = {
        id: 'v1',
        updatedAt: timestamp,
        clock_in_time: '09:00',
        clock_out_time: '10:00',
        care_notes: 'Client notes',
      };
      const server = {
        id: 'v1',
        updatedAt: timestamp,
        clock_in_time: null,
        clock_out_time: null,
        scheduled_date: '2025-01-02',
      };

      const result = resolver.resolve(client as any, server as any, 'visit');

      expect(result.strategy).toBe('merge');
      expect(result.resolvedRecord.clock_in_time).toBe('09:00');
      expect(result.resolvedRecord.clock_out_time).toBe('10:00');
      expect(result.resolvedRecord.care_notes).toBe('Client notes');
      expect(result.resolvedRecord.scheduled_date).toBe('2025-01-02');
    });

    it('should handle client signature conflicts', () => {
      const client = {
        id: 'v1',
        updatedAt: timestamp,
        client_signature: 'sig1',
      };
      const server = {
        id: 'v1',
        updatedAt: timestamp,
        client_signature: 'sig2',
      };

      const result = resolver.resolve(client as any, server as any, 'visit');

      expect(result.strategy).toBe('manual');
      expect(result.requiresManualReview).toBe(true);
    });

    it('should handle caregiver signature conflicts', () => {
      const client = {
        id: 'v1',
        updatedAt: timestamp,
        caregiver_signature: 'sig1',
      };
      const server = {
        id: 'v1',
        updatedAt: timestamp,
        caregiver_signature: 'sig2',
      };

      const result = resolver.resolve(client as any, server as any, 'visit');

      expect(result.strategy).toBe('manual');
      expect(result.requiresManualReview).toBe(true);
    });

    it('should prioritize client for all CLIENT_PRIORITY_FIELDS', () => {
      const client = {
        id: 'v1',
        updatedAt: timestamp,
        care_notes: 'Client care notes',
        tasks_completed: ['task1', 'task2'],
        client_mood: 'GOOD',
        client_condition_notes: 'Stable',
        activities_performed: ['bathing', 'feeding'],
        incident_description: 'Minor incident',
        visit_notes: 'Visit went well',
      };
      const server = {
        id: 'v1',
        updatedAt: timestamp,
        care_notes: null,
        tasks_completed: [],
        client_mood: null,
        client_condition_notes: null,
        activities_performed: [],
        incident_description: null,
        visit_notes: null,
      };

      const result = resolver.resolve(client as any, server as any, 'visit');

      expect(result.resolvedRecord.care_notes).toBe('Client care notes');
      expect(result.resolvedRecord.tasks_completed).toEqual(['task1', 'task2']);
      expect(result.resolvedRecord.client_mood).toBe('GOOD');
      expect(result.resolvedRecord.client_condition_notes).toBe('Stable');
      expect(result.resolvedRecord.activities_performed).toEqual(['bathing', 'feeding']);
      expect(result.resolvedRecord.incident_description).toBe('Minor incident');
      expect(result.resolvedRecord.visit_notes).toBe('Visit went well');
    });

    it('should prioritize server for all SERVER_PRIORITY_FIELDS', () => {
      const client = {
        id: 'v1',
        updatedAt: timestamp,
        scheduled_date: '2025-01-01',
        scheduled_start_time: '09:00',
        scheduled_end_time: '10:00',
        client_id: 'c1',
        caregiver_id: 'cg1',
        service_type_code: 'PC',
        authorization_id: 'auth1',
      };
      const server = {
        id: 'v1',
        updatedAt: timestamp,
        scheduled_date: '2025-01-02',
        scheduled_start_time: '10:00',
        scheduled_end_time: '11:00',
        client_id: 'c2',
        caregiver_id: 'cg2',
        service_type_code: 'HC',
        authorization_id: 'auth2',
      };

      const result = resolver.resolve(client as any, server as any, 'visit');

      expect(result.resolvedRecord.scheduled_date).toBe('2025-01-02');
      expect(result.resolvedRecord.scheduled_start_time).toBe('10:00');
      expect(result.resolvedRecord.scheduled_end_time).toBe('11:00');
      expect(result.resolvedRecord.client_id).toBe('c2');
      expect(result.resolvedRecord.caregiver_id).toBe('cg2');
      expect(result.resolvedRecord.service_type_code).toBe('HC');
      expect(result.resolvedRecord.authorization_id).toBe('auth2');
    });

    it('should handle plural record type "visits"', () => {
      const client = {
        id: 'v1',
        updatedAt: timestamp,
        care_notes: 'Notes',
      };
      const server = {
        id: 'v1',
        updatedAt: timestamp,
        scheduled_date: '2025-01-01',
      };

      const result = resolver.resolve(client as any, server as any, 'visits');

      expect(result.strategy).toBe('merge');
    });
  });

  describe('Task Conflict Resolution', () => {
    const timestamp = new Date('2025-01-01').getTime();

    it('should choose client when client completed task', () => {
      const client = {
        id: 't1',
        updatedAt: timestamp,
        status: 'completed',
        completed_at: '2025-01-01T10:00:00Z',
      };
      const server = {
        id: 't1',
        updatedAt: timestamp,
        status: 'pending',
      };

      const result = resolver.resolve(client as any, server as any, 'task');

      expect(result.strategy).toBe('client-wins');
      expect(result.requiresManualReview).toBe(false);
    });

    it('should require manual review when server completed but client did not', () => {
      const client = {
        id: 't1',
        updatedAt: timestamp,
        status: 'pending',
      };
      const server = {
        id: 't1',
        updatedAt: timestamp,
        status: 'completed',
      };

      const result = resolver.resolve(client as any, server as any, 'task');

      expect(result.strategy).toBe('manual');
      expect(result.requiresManualReview).toBe(true);
    });

    it('should choose server when both pending', () => {
      const client = {
        id: 't1',
        updatedAt: timestamp,
        status: 'pending',
      };
      const server = {
        id: 't1',
        updatedAt: timestamp,
        status: 'pending',
      };

      const result = resolver.resolve(client as any, server as any, 'task');

      expect(result.strategy).toBe('server-wins');
    });

    it('should handle plural record type "tasks"', () => {
      const client = {
        id: 't1',
        updatedAt: timestamp,
        status: 'completed',
      };
      const server = {
        id: 't1',
        updatedAt: timestamp,
        status: 'pending',
      };

      const result = resolver.resolve(client as any, server as any, 'tasks');

      expect(result.strategy).toBe('client-wins');
    });
  });

  describe('EVV Record Conflict Resolution', () => {
    const timestamp = new Date('2025-01-01').getTime();

    it('should require manual review for clock_in_time conflicts', () => {
      const client = {
        id: 'e1',
        updatedAt: timestamp,
        clock_in_time: '09:00',
      };
      const server = {
        id: 'e1',
        updatedAt: timestamp,
        clock_in_time: '09:05',
      };

      const result = resolver.resolve(client as any, server as any, 'evv_record');

      expect(result.strategy).toBe('manual');
      expect(result.requiresManualReview).toBe(true);
      expect(result.resolution_metadata?.reason).toContain('regulatory compliance');
    });

    it('should require manual review for service_date conflicts', () => {
      const client = {
        id: 'e1',
        updatedAt: timestamp,
        service_date: '2025-01-01',
      };
      const server = {
        id: 'e1',
        updatedAt: timestamp,
        service_date: '2025-01-02',
      };

      const result = resolver.resolve(client as any, server as any, 'evv_record');

      expect(result.strategy).toBe('manual');
      expect(result.requiresManualReview).toBe(true);
    });

    it('should require manual review for location conflicts', () => {
      const client = {
        id: 'e1',
        updatedAt: timestamp,
        clock_in_location: { lat: 1, lng: 1 },
      };
      const server = {
        id: 'e1',
        updatedAt: timestamp,
        clock_in_location: { lat: 2, lng: 2 },
      };

      const result = resolver.resolve(client as any, server as any, 'evv_record');

      expect(result.strategy).toBe('manual');
      expect(result.requiresManualReview).toBe(true);
    });

    it('should use server-wins when no conflicts', () => {
      const client = {
        id: 'e1',
        updatedAt: timestamp,
        metadata: 'client',
      };
      const server = {
        id: 'e1',
        updatedAt: timestamp,
        metadata: 'server',
      };

      const result = resolver.resolve(client as any, server as any, 'evv_record');

      expect(result.strategy).toBe('server-wins');
      expect(result.requiresManualReview).toBe(false);
    });

    it('should handle plural "evv_records"', () => {
      const client = {
        id: 'e1',
        updatedAt: timestamp,
        clock_in_time: '09:00',
      };
      const server = {
        id: 'e1',
        updatedAt: timestamp,
        clock_in_time: '09:05',
      };

      const result = resolver.resolve(client as any, server as any, 'evv_records');

      expect(result.strategy).toBe('manual');
    });
  });

  describe('Visit Note Conflict Resolution', () => {
    const timestamp = new Date('2025-01-01').getTime();

    it('should choose client when client has more content', () => {
      const client = {
        id: 'n1',
        updatedAt: timestamp,
        note_text: 'This is a long detailed note with lots of information',
      };
      const server = {
        id: 'n1',
        updatedAt: timestamp,
        note_text: 'Short note',
      };

      const result = resolver.resolve(client as any, server as any, 'visit_note');

      expect(result.strategy).toBe('client-wins');
    });

    it('should choose server when server has more content', () => {
      const client = {
        id: 'n1',
        updatedAt: timestamp,
        note_text: 'Short',
      };
      const server = {
        id: 'n1',
        updatedAt: timestamp,
        note_text: 'This is a much longer and more detailed note',
      };

      const result = resolver.resolve(client as any, server as any, 'visit_note');

      expect(result.strategy).toBe('server-wins');
    });

    it('should handle plural "visit_notes"', () => {
      const client = {
        id: 'n1',
        updatedAt: timestamp,
        note_text: 'Long client note',
      };
      const server = {
        id: 'n1',
        updatedAt: timestamp,
        note_text: 'Short',
      };

      const result = resolver.resolve(client as any, server as any, 'visit_notes');

      expect(result.strategy).toBe('client-wins');
    });
  });

  describe('Default Fallback', () => {
    const timestamp = new Date('2025-01-01').getTime();

    it('should use server-wins for unknown types with manual review flag', () => {
      const client = {
        id: '1',
        updatedAt: timestamp,
        data: 'client',
      };
      const server = {
        id: '1',
        updatedAt: timestamp,
        data: 'server',
      };

      const result = resolver.resolve(client as any, server as any, 'unknown_type');

      expect(result.strategy).toBe('server-wins');
      expect(result.requiresManualReview).toBe(true);
    });
  });

  describe('Manual Resolution Application', () => {
    const client = {
      id: 'v1',
      field1: 'client1',
      field2: 'client2',
      field3: 'client3',
    };
    const server = {
      id: 'v1',
      field1: 'server1',
      field2: 'server2',
      field3: 'server3',
    };

    it('should apply client strategy', () => {
      const decision: ManualResolution = {
        recordId: 'v1',
        recordType: 'visit',
        selectedStrategy: 'client',
        userId: 'user1',
        timestamp: new Date(),
      };

      const result = resolver.applyManualResolution(client, server, decision);

      expect(result.strategy).toBe('manual');
      expect(result.resolvedRecord).toEqual(client);
      expect(result.resolution_metadata?.resolvedBy).toBe('user1');
    });

    it('should apply server strategy', () => {
      const decision: ManualResolution = {
        recordId: 'v1',
        recordType: 'visit',
        selectedStrategy: 'server',
        userId: 'user1',
        timestamp: new Date(),
      };

      const result = resolver.applyManualResolution(client, server, decision);

      expect(result.strategy).toBe('manual');
      expect(result.resolvedRecord).toEqual(server);
    });

    it('should apply field-by-field resolution', () => {
      const decision: ManualResolution = {
        recordId: 'v1',
        recordType: 'visit',
        selectedStrategy: 'field-by-field',
        fieldResolutions: {
          field1: 'client',
          field2: 'server',
          field3: 'custom value',
        },
        userId: 'user1',
        timestamp: new Date(),
      };

      const result = resolver.applyManualResolution(client, server, decision);

      expect(result.resolvedRecord.field1).toBe('client1');
      expect(result.resolvedRecord.field2).toBe('server2');
      expect(result.resolvedRecord.field3).toBe('custom value');
    });
  });

  describe('Potential Conflict Detection', () => {
    it('should detect conflicts between records', () => {
      const local = {
        id: '1',
        field1: 'value1',
        field2: 'value2',
        updated_at: new Date(),
      };
      const remote = {
        id: '1',
        field1: 'different',
        field2: 'value2',
        updated_at: new Date(),
      };

      const result = resolver.detectPotentialConflicts(local, remote);

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingFields).toContain('field1');
      expect(result.conflictingFields).not.toContain('field2');
    });

    it('should mark as high severity for critical fields', () => {
      const local = {
        id: '1',
        clock_in_time: '09:00',
      };
      const remote = {
        id: '1',
        clock_in_time: '09:05',
      };

      const result = resolver.detectPotentialConflicts(local, remote);

      expect(result.severity).toBe('high');
    });

    it('should mark as medium severity for many fields', () => {
      const local = {
        id: '1',
        field1: 'a',
        field2: 'b',
        field3: 'c',
        field4: 'd',
      };
      const remote = {
        id: '1',
        field1: 'x',
        field2: 'y',
        field3: 'z',
        field4: 'w',
      };

      const result = resolver.detectPotentialConflicts(local, remote);

      expect(result.severity).toBe('medium');
    });

    it('should mark as low severity for few non-critical fields', () => {
      const local = {
        id: '1',
        metadata: 'a',
      };
      const remote = {
        id: '1',
        metadata: 'b',
      };

      const result = resolver.detectPotentialConflicts(local, remote);

      expect(result.severity).toBe('low');
    });

    it('should ignore ID and timestamp fields', () => {
      const local = {
        id: '1',
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-02'),
      };
      const remote = {
        id: '2',
        created_at: new Date('2025-01-03'),
        updated_at: new Date('2025-01-04'),
      };

      const result = resolver.detectPotentialConflicts(local, remote);

      expect(result.hasConflict).toBe(false);
    });
  });
});
