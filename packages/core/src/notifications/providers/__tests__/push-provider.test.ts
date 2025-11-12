/**
 * Tests for Push Notification Provider
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PushProvider } from '../push-provider.js';
import type { Database } from '../../../db/connection.js';
import type { NotificationPayload, NotificationRecipient } from '../../types.js';

describe('PushProvider', () => {
  let mockDatabase: Database;
  let provider: PushProvider;

  beforeEach(() => {
    mockDatabase = {
      query: vi.fn(),
    } as any;

    provider = new PushProvider(mockDatabase);
    vi.clearAllMocks();
  });

  describe('isConfigured', () => {
    it('should always return true for Expo push', () => {
      expect(provider.isConfigured()).toBe(true);
    });
  });

  describe('send', () => {
    const mockPayload: NotificationPayload = {
      eventType: 'VISIT_CLOCK_IN',
      priority: 'NORMAL',
      recipients: [],
      subject: 'Visit Started',
      message: 'Caregiver has started the visit',
      data: { visitId: 'visit-123' },
      organizationId: 'org-123',
      relatedEntityType: 'visit',
      relatedEntityId: 'visit-123',
    };

    const mockRecipient: NotificationRecipient = {
      userId: 'user-123',
      preferredChannels: ['PUSH'],
    };

    it('should return error if no active tokens found', async () => {
      (mockDatabase.query as any).mockResolvedValue({ rows: [] });

      const result = await provider.send(mockPayload, mockRecipient);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active push tokens found for user');
    });

    it('should send push notification successfully', async () => {
      (mockDatabase.query as any).mockResolvedValueOnce({
        rows: [{ id: 'token-123', device_token: 'ExponentPushToken[abc123]' }],
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ status: 'ok', id: 'expo-ticket-123' }] }),
      });

      (mockDatabase.query as any).mockResolvedValue({ rows: [] });

      const result = await provider.send(mockPayload, mockRecipient);

      expect(result.success).toBe(true);
      expect(result.externalId).toBe('expo-ticket-123');
    });
  });
});
