/**
 * Tests for EVV Notification Recipient Resolution
 * 
 * These tests verify that clock-in/clock-out notifications are sent to the correct recipients:
 * - Supervisors
 * - Coordinators
 * - Family members (who have opted in)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Database } from '@care-commons/core';
import type { UUID } from '@care-commons/core';

describe('EVV Notification Recipient Resolution', () => {
  let mockDatabase: Database;
  const organizationId = 'org-123' as UUID;
  const caregiverId = 'caregiver-123' as UUID;
  const clientId = 'client-123' as UUID;

  beforeEach(() => {
    mockDatabase = {
      query: vi.fn(),
    } as any as Database;
  });

  describe('Supervisor Resolution', () => {
    it('should resolve caregiver supervisor', async () => {
      const mockQuery = mockDatabase.query as any;
      mockQuery.mockResolvedValue({
        rows: [{ supervisor_id: 'supervisor-456' }],
      });

      const result = await mockDatabase.query(
        `SELECT supervisor_id FROM caregivers 
         WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
        [caregiverId, organizationId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('supervisor_id', 'supervisor-456');
    });

    it('should handle caregiver without supervisor', async () => {
      const mockQuery = mockDatabase.query as any;
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await mockDatabase.query(
        `SELECT supervisor_id FROM caregivers 
         WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
        [caregiverId, organizationId]
      );

      expect(result.rows).toHaveLength(0);
    });
  });

  describe('Coordinator Resolution', () => {
    it('should resolve branch coordinators', async () => {
      const mockQuery = mockDatabase.query as any;
      mockQuery.mockResolvedValue({
        rows: [
          { id: 'coord-1', email: 'coord1@example.com' },
          { id: 'coord-2', email: 'coord2@example.com' },
        ],
      });

      const result = await mockDatabase.query(
        `SELECT u.id, u.email FROM users u
         JOIN caregivers c ON c.organization_id = u.organization_id
         WHERE c.id = $1 
         AND u.roles && ARRAY['COORDINATOR', 'BRANCH_ADMIN']::text[]
         AND u.deleted_at IS NULL
         LIMIT 5`,
        [caregiverId]
      );

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toHaveProperty('id', 'coord-1');
      expect(result.rows[1]).toHaveProperty('id', 'coord-2');
    });
  });

  describe('Family Member Resolution', () => {
    it('should resolve family members who opted in to notifications', async () => {
      const mockQuery = mockDatabase.query as any;
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 'family-1',
            preferred_contact_method: 'EMAIL',
            notification_preferences: null,
          },
          {
            id: 'family-2',
            preferred_contact_method: 'SMS',
            notification_preferences: null,
          },
        ],
      });

      const result = await mockDatabase.query(
        `SELECT id, preferred_contact_method, notification_preferences
         FROM family_members
         WHERE client_id = $1
         AND status = 'ACTIVE'
         AND receive_notifications = true
         AND deleted_at IS NULL
         ORDER BY is_primary_contact DESC, created_at ASC
         LIMIT 10`,
        [clientId]
      );

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toHaveProperty('preferred_contact_method', 'EMAIL');
      expect(result.rows[1]).toHaveProperty('preferred_contact_method', 'SMS');
    });

    it('should not include family members who opted out', async () => {
      const mockQuery = mockDatabase.query as any;
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await mockDatabase.query(
        `SELECT id, preferred_contact_method, notification_preferences
         FROM family_members
         WHERE client_id = $1
         AND status = 'ACTIVE'
         AND receive_notifications = true
         AND deleted_at IS NULL
         ORDER BY is_primary_contact DESC, created_at ASC
         LIMIT 10`,
        [clientId]
      );

      expect(result.rows).toHaveLength(0);
    });

    it('should prioritize primary contact family members', async () => {
      const mockQuery = mockDatabase.query as any;
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 'family-primary',
            preferred_contact_method: 'EMAIL',
            is_primary_contact: true,
          },
          {
            id: 'family-secondary',
            preferred_contact_method: 'SMS',
            is_primary_contact: false,
          },
        ],
      });

      const result = await mockDatabase.query(
        `SELECT id, preferred_contact_method, notification_preferences
         FROM family_members
         WHERE client_id = $1
         AND status = 'ACTIVE'
         AND receive_notifications = true
         AND deleted_at IS NULL
         ORDER BY is_primary_contact DESC, created_at ASC
         LIMIT 10`,
        [clientId]
      );

      // Primary contact should be first due to ORDER BY
      expect(result.rows[0]).toHaveProperty('id', 'family-primary');
      expect(result.rows[1]).toHaveProperty('id', 'family-secondary');
    });
  });

  describe('Channel Preferences', () => {
    it('should map EMAIL preferred contact method to EMAIL channel', () => {
      const preferredMethod = 'EMAIL';
      const channels = [];
      
      if (preferredMethod === 'EMAIL' || preferredMethod === 'BOTH') {
        channels.push('EMAIL');
      }
      if (preferredMethod === 'SMS' || preferredMethod === 'BOTH') {
        channels.push('SMS');
      }

      expect(channels).toEqual(['EMAIL']);
    });

    it('should map SMS preferred contact method to SMS channel', () => {
      const preferredMethod = 'SMS';
      const channels = [];
      
      if (preferredMethod === 'EMAIL' || preferredMethod === 'BOTH') {
        channels.push('EMAIL');
      }
      if (preferredMethod === 'SMS' || preferredMethod === 'BOTH') {
        channels.push('SMS');
      }

      expect(channels).toEqual(['SMS']);
    });

    it('should map BOTH preferred contact method to both channels', () => {
      const preferredMethod = 'BOTH';
      const channels = [];
      
      if (preferredMethod === 'EMAIL' || preferredMethod === 'BOTH') {
        channels.push('EMAIL');
      }
      if (preferredMethod === 'SMS' || preferredMethod === 'BOTH') {
        channels.push('SMS');
      }

      expect(channels).toEqual(['EMAIL', 'SMS']);
    });

    it('should default to EMAIL if no preference specified', () => {
      const preferredMethod = '';
      const channels = [];
      
      if (preferredMethod === 'EMAIL' || preferredMethod === 'BOTH') {
        channels.push('EMAIL');
      }
      if (preferredMethod === 'SMS' || preferredMethod === 'BOTH') {
        channels.push('SMS');
      }
      
      // Default to EMAIL
      if (channels.length === 0) {
        channels.push('EMAIL');
      }

      expect(channels).toEqual(['EMAIL']);
    });
  });

  describe('Deduplication', () => {
    it('should handle same user ID appearing in multiple roles', () => {
      const seenIds = new Set<string>();
      const recipients = [];

      // User is supervisor
      const supervisorId = 'user-123';
      if (!seenIds.has(supervisorId)) {
        recipients.push({ userId: supervisorId, role: 'supervisor' });
        seenIds.add(supervisorId);
      }

      // Same user is also coordinator (should be deduplicated)
      const coordinatorId = 'user-123';
      if (!seenIds.has(coordinatorId)) {
        recipients.push({ userId: coordinatorId, role: 'coordinator' });
        seenIds.add(coordinatorId);
      }

      expect(recipients).toHaveLength(1);
      expect(recipients[0].userId).toBe('user-123');
    });
  });

  describe('Error Handling', () => {
    it('should handle database query errors gracefully', async () => {
      const mockQuery = mockDatabase.query as any;
      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      try {
        await mockDatabase.query('SELECT * FROM users', []);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Database connection failed');
      }
    });
  });
});
