import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  OfflineQueue,
  QueuePriority,
} from '../offline-queue.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Create in-memory storage for tests
const mockStorage: Record<string, string> = {};

// Mock AsyncStorage with real persistence
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => mockStorage[key] || null),
    setItem: vi.fn(async (key: string, value: string) => {
      mockStorage[key] = value;
    }),
    removeItem: vi.fn(async (key: string) => {
      delete mockStorage[key];
    }),
  },
}));

// Mock NetInfo
vi.mock('@react-native-community/netinfo', () => ({
  default: {
    fetch: vi.fn(() => Promise.resolve({ isConnected: true })),
    addEventListener: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('OfflineQueue - Comprehensive Coverage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    await OfflineQueue.clearQueue();
  });

  describe('Enqueue Operations', () => {
    it('should enqueue with default CRITICAL priority for EVV events', async () => {
      const id = await OfflineQueue.enqueue({
        type: 'visit-check-in',
        payload: { visitId: 'v1' },
      });

      expect(id).toBeDefined();
      const items = await OfflineQueue.getQueueItems();
      expect(items).toHaveLength(1);
      expect(items[0].priority).toBe(QueuePriority.CRITICAL);
    });

    it('should enqueue with HIGH priority for care documentation', async () => {
      await OfflineQueue.enqueue({
        type: 'care-note',
        payload: { note: 'test' },
      });

      const items = await OfflineQueue.getQueueItems();
      expect(items[0].priority).toBe(QueuePriority.HIGH);
    });

    it('should enqueue with custom priority', async () => {
      await OfflineQueue.enqueue({
        type: 'care-note',
        payload: { note: 'test' },
        priority: QueuePriority.LOW,
      });

      const items = await OfflineQueue.getQueueItems();
      expect(items[0].priority).toBe(QueuePriority.LOW);
    });

    it('should enqueue with custom maxRetries', async () => {
      await OfflineQueue.enqueue(
        {
          type: 'care-note',
          payload: { note: 'test' },
        },
        { maxRetries: 10 }
      );

      const items = await OfflineQueue.getQueueItems();
      expect(items[0].maxRetries).toBe(10);
    });

    it('should initialize errors array', async () => {
      await OfflineQueue.enqueue({
        type: 'visit-check-in',
        payload: { visitId: 'v1' },
      });

      const items = await OfflineQueue.getQueueItems();
      expect(items[0].errors).toEqual([]);
    });
  });

  describe('Queue Processing', () => {
    it('should skip processing when offline', async () => {
      (NetInfo.fetch as any).mockResolvedValueOnce({ isConnected: false });

      await OfflineQueue.enqueue({
        type: 'visit-check-in',
        payload: { visitId: 'v1' },
      });

      const result = await OfflineQueue.processQueue();

      expect(result.processed).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it('should process queue in priority order', async () => {
      const executedOrder: string[] = [];
      (global.fetch as any).mockImplementation(async (url: string) => {
        executedOrder.push(url.split('/').pop() || '');
        return { ok: true, json: async () => ({}) };
      });

      // Add items in reverse priority order
      await OfflineQueue.enqueue({
        type: 'care-note',
        payload: {},
        priority: QueuePriority.NORMAL,
      });
      await OfflineQueue.enqueue({
        type: 'visit-check-in',
        payload: {},
        priority: QueuePriority.CRITICAL,
      });
      await OfflineQueue.enqueue({
        type: 'task-complete',
        payload: {},
        priority: QueuePriority.HIGH,
      });

      await OfflineQueue.processQueue();

      // Should execute in priority order: CRITICAL, HIGH, NORMAL
      expect(executedOrder).toEqual(['visit-check-in', 'task-complete', 'care-note']);
    });

    it('should skip items with future retry times', async () => {
      const futureTime = Date.now() + 10000;
      await OfflineQueue.enqueue({
        type: 'visit-check-in',
        payload: { visitId: 'v1' },
      });

      const items = await OfflineQueue.getQueueItems();
      items[0].nextRetryAt = futureTime;
      await AsyncStorage.setItem('@offline_queue', JSON.stringify(items));

      const result = await OfflineQueue.processQueue();

      expect(result.skipped).toBe(1);
      expect(result.processed).toBe(0);
    });

    it('should discard items exceeding max retries', async () => {
      await OfflineQueue.enqueue({
        type: 'visit-check-in',
        payload: { visitId: 'v1' },
      });

      const items = await OfflineQueue.getQueueItems();
      items[0].retries = 5;
      items[0].maxRetries = 5;
      await AsyncStorage.setItem('@offline_queue', JSON.stringify(items));

      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await OfflineQueue.processQueue();

      expect(result.failed).toBe(1);
      const remainingItems = await OfflineQueue.getQueueItems();
      expect(remainingItems).toHaveLength(0);
    });

    it('should handle retryable errors with exponential backoff', async () => {
      await OfflineQueue.enqueue({
        type: 'visit-check-in',
        payload: { visitId: 'v1' },
      });

      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await OfflineQueue.processQueue();

      const items = await OfflineQueue.getQueueItems();
      expect(items).toHaveLength(1);
      expect(items[0].retries).toBe(1);
      expect(items[0].errors).toHaveLength(1);
      expect(items[0].nextRetryAt).toBeGreaterThan(Date.now());
    });

    it('should handle non-retryable errors (4xx client errors)', async () => {
      await OfflineQueue.enqueue({
        type: 'visit-check-in',
        payload: { visitId: 'v1' },
      });

      const error: any = new Error('Bad request');
      error.status = 400;
      (global.fetch as any).mockRejectedValue(error);

      const result = await OfflineQueue.processQueue();

      expect(result.failed).toBe(1);
      const items = await OfflineQueue.getQueueItems();
      expect(items).toHaveLength(0); // Non-retryable, so discarded
    });

    it('should handle 409 conflict as non-retryable', async () => {
      await OfflineQueue.enqueue({
        type: 'visit-check-in',
        payload: { visitId: 'v1' },
      });

      const error: any = new Error('Conflict');
      error.status = 409;
      (global.fetch as any).mockRejectedValue(error);

      const result = await OfflineQueue.processQueue();

      expect(result.failed).toBe(1);
      const items = await OfflineQueue.getQueueItems();
      expect(items).toHaveLength(0);
    });

    it('should retry 500 server errors', async () => {
      await OfflineQueue.enqueue({
        type: 'visit-check-in',
        payload: { visitId: 'v1' },
      });

      const error: any = new Error('Server error');
      error.status = 500;
      (global.fetch as any).mockRejectedValue(error);

      await OfflineQueue.processQueue();

      const items = await OfflineQueue.getQueueItems();
      expect(items).toHaveLength(1);
      expect(items[0].errors[0].isRetryable).toBe(true);
    });

    it('should retry 429 rate limit errors', async () => {
      await OfflineQueue.enqueue({
        type: 'visit-check-in',
        payload: { visitId: 'v1' },
      });

      const error: any = new Error('Rate limited');
      error.status = 429;
      (global.fetch as any).mockRejectedValue(error);

      await OfflineQueue.processQueue();

      const items = await OfflineQueue.getQueueItems();
      expect(items).toHaveLength(1);
      expect(items[0].errors[0].isRetryable).toBe(true);
    });
  });

  describe('Queue Statistics', () => {
    it('should provide accurate queue stats', async () => {
      await OfflineQueue.enqueue({
        type: 'visit-check-in',
        payload: {},
        priority: QueuePriority.CRITICAL,
      });
      await OfflineQueue.enqueue({
        type: 'care-note',
        payload: {},
        priority: QueuePriority.HIGH,
      });
      await OfflineQueue.enqueue({
        type: 'attachment-upload',
        payload: {},
        priority: QueuePriority.NORMAL,
      });

      const stats = await OfflineQueue.getQueueStats();

      expect(stats.total).toBe(3);
      expect(stats.byPriority[QueuePriority.CRITICAL]).toBe(1);
      expect(stats.byPriority[QueuePriority.HIGH]).toBe(1);
      expect(stats.byPriority[QueuePriority.NORMAL]).toBe(1);
      expect(stats.byType['visit-check-in']).toBe(1);
      expect(stats.byType['care-note']).toBe(1);
    });

    it('should track failed and retryable counts', async () => {
      await OfflineQueue.enqueue({
        type: 'visit-check-in',
        payload: {},
      });
      await OfflineQueue.enqueue({
        type: 'care-note',
        payload: {},
      });

      const items = await OfflineQueue.getQueueItems();
      items[0].retries = 5;
      items[0].maxRetries = 5;
      items[1].retries = 2;
      items[1].maxRetries = 5;
      await AsyncStorage.setItem('@offline_queue', JSON.stringify(items));

      const stats = await OfflineQueue.getQueueStats();

      expect(stats.failedCount).toBe(1);
      expect(stats.retryableCount).toBe(1);
    });
  });

  describe('Retry Failed Items', () => {
    it('should reset retry count and process failed items', async () => {
      await OfflineQueue.enqueue({
        type: 'visit-check-in',
        payload: { visitId: 'v1' },
      });

      const items = await OfflineQueue.getQueueItems();
      items[0].retries = 3;
      items[0].errors = [
        {
          message: 'Error 1',
          timestamp: Date.now(),
          isRetryable: true,
        },
      ];
      await AsyncStorage.setItem('@offline_queue', JSON.stringify(items));

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await OfflineQueue.retryFailedItems();

      const updatedItems = await OfflineQueue.getQueueItems();
      expect(updatedItems).toHaveLength(0); // Successfully processed
    });
  });

  describe('Remove Item', () => {
    it('should remove specific item from queue', async () => {
      const id1 = await OfflineQueue.enqueue({
        type: 'visit-check-in',
        payload: {},
      });
      await OfflineQueue.enqueue({
        type: 'care-note',
        payload: {},
      });

      const removed = await OfflineQueue.removeItem(id1);

      expect(removed).toBe(true);
      const items = await OfflineQueue.getQueueItems();
      expect(items).toHaveLength(1);
      expect(items[0].type).toBe('care-note');
    });

    it('should return false for non-existent item', async () => {
      const removed = await OfflineQueue.removeItem('non-existent-id');

      expect(removed).toBe(false);
    });
  });

  describe('Queue Validation', () => {
    it('should validate queue integrity', async () => {
      await OfflineQueue.enqueue({
        type: 'visit-check-in',
        payload: {},
      });

      const validation = await OfflineQueue.validateQueue();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing ID', async () => {
      await AsyncStorage.setItem(
        '@offline_queue',
        JSON.stringify([
          {
            type: 'visit-check-in',
            payload: {},
            timestamp: Date.now(),
            retries: 0,
            priority: 4,
            maxRetries: 5,
            errors: [],
          },
        ])
      );

      const validation = await OfflineQueue.validateQueue();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect missing type', async () => {
      await AsyncStorage.setItem(
        '@offline_queue',
        JSON.stringify([
          {
            id: '123',
            payload: {},
            timestamp: Date.now(),
            retries: 0,
            priority: 4,
            maxRetries: 5,
            errors: [],
          },
        ])
      );

      const validation = await OfflineQueue.validateQueue();

      expect(validation.isValid).toBe(false);
    });

    it('should detect retries exceeding maxRetries', async () => {
      await AsyncStorage.setItem(
        '@offline_queue',
        JSON.stringify([
          {
            id: '123',
            type: 'visit-check-in',
            payload: {},
            timestamp: Date.now(),
            retries: 10,
            priority: 4,
            maxRetries: 5,
            errors: [],
          },
        ])
      );

      const validation = await OfflineQueue.validateQueue();

      expect(validation.isValid).toBe(false);
    });
  });

  describe('Empty Queue Handling', () => {
    it('should handle empty queue gracefully', async () => {
      const result = await OfflineQueue.processQueue();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it('should return 0 for empty queue size', async () => {
      const size = await OfflineQueue.getQueueSize();

      expect(size).toBe(0);
    });

    it('should return empty array for empty queue items', async () => {
      const items = await OfflineQueue.getQueueItems();

      expect(items).toEqual([]);
    });
  });

  describe('All Action Types', () => {
    it('should handle visit-check-out with CRITICAL priority', async () => {
      await OfflineQueue.enqueue({
        type: 'visit-check-out',
        payload: {},
      });

      const items = await OfflineQueue.getQueueItems();
      expect(items[0].priority).toBe(QueuePriority.CRITICAL);
    });

    it('should handle signature-upload with CRITICAL priority', async () => {
      await OfflineQueue.enqueue({
        type: 'signature-upload',
        payload: {},
      });

      const items = await OfflineQueue.getQueueItems();
      expect(items[0].priority).toBe(QueuePriority.CRITICAL);
    });

    it('should handle visit-note with HIGH priority', async () => {
      await OfflineQueue.enqueue({
        type: 'visit-note',
        payload: {},
      });

      const items = await OfflineQueue.getQueueItems();
      expect(items[0].priority).toBe(QueuePriority.HIGH);
    });

    it('should handle task-complete with HIGH priority', async () => {
      await OfflineQueue.enqueue({
        type: 'task-complete',
        payload: {},
      });

      const items = await OfflineQueue.getQueueItems();
      expect(items[0].priority).toBe(QueuePriority.HIGH);
    });

    it('should handle incident-report with HIGH priority', async () => {
      await OfflineQueue.enqueue({
        type: 'incident-report',
        payload: {},
      });

      const items = await OfflineQueue.getQueueItems();
      expect(items[0].priority).toBe(QueuePriority.HIGH);
    });

    it('should handle attachment-upload with NORMAL priority', async () => {
      await OfflineQueue.enqueue({
        type: 'attachment-upload',
        payload: {},
      });

      const items = await OfflineQueue.getQueueItems();
      expect(items[0].priority).toBe(QueuePriority.NORMAL);
    });
  });
});
