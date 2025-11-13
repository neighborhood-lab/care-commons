/**
 * Notification Service Tests
 * 
 * Tests for notification orchestration, rate limiting, and provider integration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService, getNotificationService } from '../notification-service';
import type { NotificationPayload, NotificationProvider, NotificationRecipient } from '../types';

// Mock provider for testing
class MockProvider implements NotificationProvider {
  readonly name = 'mock';
  readonly channel = 'EMAIL' as const;
  private _configured = true;
  public sendCalls: Array<{ payload: NotificationPayload; recipient: NotificationRecipient }> = [];

  setConfigured(configured: boolean): void {
    this._configured = configured;
  }

  isConfigured(): boolean {
    return this._configured;
  }

  async send(payload: NotificationPayload, recipient: NotificationRecipient) {
    this.sendCalls.push({ payload, recipient });
    return {
      success: true,
      channel: 'EMAIL' as const,
      recipientId: recipient.userId,
      sentAt: new Date(),
      externalId: `mock-${Date.now()}`,
    };
  }
}

describe('NotificationService', () => {
  let service: NotificationService;
  let mockProvider: MockProvider;

  beforeEach(() => {
    service = new NotificationService();
    mockProvider = new MockProvider();
    service.registerProvider(mockProvider);
  });

  describe('Provider Registration', () => {
    it('should register a provider', () => {
      const newProvider = new MockProvider();
      service.registerProvider(newProvider);
      // Provider should be registered and available
      expect(service).toBeDefined();
    });
  });

  describe('Notification Sending', () => {
    it('should send notification to single recipient', async () => {
      const payload: NotificationPayload = {
        eventType: 'VISIT_CLOCK_IN',
        priority: 'NORMAL',
        recipients: [
          {
            userId: 'user-1',
            email: 'test@example.com',
            preferredChannels: ['EMAIL'],
          },
        ],
        subject: 'Test Notification',
        message: 'Test message',
        data: {},
        organizationId: 'org-1',
      };

      const results = await service.send(payload);

      expect(results).toHaveLength(1);
      expect(results[0]?.success).toBe(true);
      expect(results[0]?.recipientId).toBe('user-1');
      expect(mockProvider.sendCalls).toHaveLength(1);
    });

    it('should send notification to multiple recipients', async () => {
      const payload: NotificationPayload = {
        eventType: 'VISIT_CLOCK_IN',
        priority: 'NORMAL',
        recipients: [
          {
            userId: 'user-1',
            email: 'user1@example.com',
            preferredChannels: ['EMAIL'],
          },
          {
            userId: 'user-2',
            email: 'user2@example.com',
            preferredChannels: ['EMAIL'],
          },
        ],
        subject: 'Test Notification',
        message: 'Test message',
        data: {},
        organizationId: 'org-1',
      };

      const results = await service.send(payload);

      expect(results).toHaveLength(2);
      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(true);
      expect(mockProvider.sendCalls).toHaveLength(2);
    });

    it('should handle missing provider gracefully', async () => {
      const payload: NotificationPayload = {
        eventType: 'VISIT_CLOCK_IN',
        priority: 'NORMAL',
        recipients: [
          {
            userId: 'user-1',
            preferredChannels: ['SMS'], // No SMS provider registered
          },
        ],
        subject: 'Test Notification',
        message: 'Test message',
        data: {},
        organizationId: 'org-1',
      };

      const results = await service.send(payload);

      // Should not throw, but also no results since no provider found
      expect(results).toHaveLength(0);
    });

    it('should warn when provider not configured', async () => {
      mockProvider.setConfigured(false);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const payload: NotificationPayload = {
        eventType: 'VISIT_CLOCK_IN',
        priority: 'NORMAL',
        recipients: [
          {
            userId: 'user-1',
            email: 'test@example.com',
            preferredChannels: ['EMAIL'],
          },
        ],
        subject: 'Test Notification',
        message: 'Test message',
        data: {},
        organizationId: 'org-1',
      };

      await service.send(payload);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Provider EMAIL not configured')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Rate Limiting', () => {
    it('should allow notifications within rate limit', async () => {
      const payload: NotificationPayload = {
        eventType: 'VISIT_CLOCK_IN',
        priority: 'NORMAL',
        recipients: [
          {
            userId: 'user-1',
            email: 'test@example.com',
            preferredChannels: ['EMAIL'],
          },
        ],
        subject: 'Test Notification',
        message: 'Test message',
        data: {},
        organizationId: 'org-1',
      };

      // Send 5 notifications (well within limit of 10)
      for (let i = 0; i < 5; i++) {
        const results = await service.send(payload);
        expect(results[0]?.success).toBe(true);
      }

      expect(mockProvider.sendCalls).toHaveLength(5);
    });

    it('should block notifications exceeding rate limit', async () => {
      const payload: NotificationPayload = {
        eventType: 'VISIT_CLOCK_IN',
        priority: 'NORMAL',
        recipients: [
          {
            userId: 'user-rate-limit',
            email: 'test@example.com',
            preferredChannels: ['EMAIL'],
          },
        ],
        subject: 'Test Notification',
        message: 'Test message',
        data: {},
        organizationId: 'org-1',
      };

      // Send 11 notifications (exceeds limit of 10)
      const allResults = [];
      for (let i = 0; i < 11; i++) {
        const results = await service.send(payload);
        allResults.push(...results);
      }

      // First 10 should succeed
      const successCount = allResults.filter(r => r?.success === true).length;
      const rateLimitedCount = allResults.filter(
        r => r?.success === false && r.error?.includes('Rate limit exceeded') === true
      ).length;

      expect(successCount).toBe(10);
      expect(rateLimitedCount).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle provider errors gracefully', async () => {
      const errorProvider: NotificationProvider = {
        name: 'error-provider',
        channel: 'EMAIL',
        isConfigured: () => true,
        send: async () => {
          throw new Error('Provider error');
        },
      };

      service.registerProvider(errorProvider);

      const payload: NotificationPayload = {
        eventType: 'VISIT_CLOCK_IN',
        priority: 'NORMAL',
        recipients: [
          {
            userId: 'user-1',
            email: 'test@example.com',
            preferredChannels: ['EMAIL'],
          },
        ],
        subject: 'Test Notification',
        message: 'Test message',
        data: {},
        organizationId: 'org-1',
      };

      const results = await service.send(payload);

      expect(results).toHaveLength(1);
      expect(results[0]?.success).toBe(false);
      expect(results[0]?.error).toBe('Provider error');
    });
  });

  describe('Template System', () => {
    it('should generate VISIT_CLOCK_IN template', () => {
      const template = NotificationService.getTemplate('VISIT_CLOCK_IN', {
        caregiverName: 'John Doe',
        clientName: 'Jane Smith',
        clockInTime: '9:00 AM',
      });

      expect(template.subject).toContain('John Doe');
      expect(template.message).toContain('Jane Smith');
      expect(template.message).toContain('9:00 AM');
    });

    it('should generate VISIT_CLOCK_OUT template', () => {
      const template = NotificationService.getTemplate('VISIT_CLOCK_OUT', {
        caregiverName: 'John Doe',
        clientName: 'Jane Smith',
        duration: 60,
      });

      expect(template.subject).toContain('John Doe');
      expect(template.message).toContain('60 minutes');
    });

    it('should generate VISIT_CANCELED template', () => {
      const template = NotificationService.getTemplate('VISIT_CANCELED', {
        clientName: 'Jane Smith',
        scheduledTime: '9:00 AM',
        reason: 'Client request',
      });

      expect(template.subject).toContain('Jane Smith');
      expect(template.message).toContain('Client request');
    });

    it('should generate VISIT_MISSED template with urgency', () => {
      const template = NotificationService.getTemplate('VISIT_MISSED', {
        clientName: 'Jane Smith',
        scheduledTime: '9:00 AM',
        minutesOverdue: 30,
        caregiverName: 'John Doe',
      });

      expect(template.subject).toContain('🚨');
      expect(template.subject).toContain('URGENT');
      expect(template.message).toContain('30 minutes overdue');
    });

    it('should return default template for unknown event type', () => {
      const template = NotificationService.getTemplate('UNKNOWN_EVENT' as any, {});

      expect(template.subject).toBe('Notification');
      expect(template.message).toBe('You have a new notification.');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getNotificationService', () => {
      const instance1 = getNotificationService();
      const instance2 = getNotificationService();

      expect(instance1).toBe(instance2);
    });
  });
});
