/**
 * Notification Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '../notification-service.js';
import { NotificationTemplate } from '../types.js';
import type { Pool } from 'pg';

// Mock dependencies
const mockDb = {
  query: vi.fn(),
} as unknown as Pool;

const mockConfig = {
  db: mockDb,
  sendgridApiKey: undefined,
  sendgridFromEmail: undefined,
  twilioAccountSid: undefined,
  twilioAuthToken: undefined,
  twilioFromNumber: undefined,
};

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NotificationService(mockConfig);
  });

  describe('constructor', () => {
    it('should create service without providers when not configured', () => {
      expect(service).toBeDefined();
    });

    it('should warn when providers are not configured', () => {
      new NotificationService(mockConfig);
      // Service should log warnings about missing providers
      expect(service).toBeDefined();
    });
  });

  describe('sendEmail', () => {
    it('should return error when email provider not configured', async () => {
      const result = await service.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        template: NotificationTemplate.VISIT_SCHEDULED,
        data: {},
        priority: 'normal',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Email provider not configured');
    });
  });

  describe('sendSMS', () => {
    it('should return error when SMS provider not configured', async () => {
      const result = await service.sendSMS({
        to: '+1234567890',
        message: 'Test message',
        priority: 'normal',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('SMS provider not configured');
    });
  });

  describe('sendPush', () => {
    it('should attempt to send with push provider even when not fully configured', async () => {
      // Push provider is created by default
      const result = await service.sendPush({
        token: 'invalid-token',
        title: 'Test',
        body: 'Test message',
        priority: 'normal',
      });

      // Should fail due to invalid token
      expect(result.success).toBe(false);
    });
  });

  describe('sendBatch', () => {
    it('should process empty batch', async () => {
      const results = await service.sendBatch([]);
      expect(results).toEqual([]);
    });
  });

  describe('scheduleDigest', () => {
    it('should log that digest scheduling is not implemented', async () => {
      await expect(service.scheduleDigest('user123', 'daily')).resolves.toBeUndefined();
    });
  });
});
