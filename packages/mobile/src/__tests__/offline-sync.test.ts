import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictResolver } from '../database/sync/conflict-resolver';
import { OfflineQueue } from '../database/sync/offline-queue';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
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

describe('Offline Sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OfflineQueue', () => {
    it('should queue visit check-in when offline', async () => {
      // Mock AsyncStorage to simulate offline queue
      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify([]));
      (AsyncStorage.setItem as any).mockResolvedValue(undefined);

      await OfflineQueue.enqueue({
        type: 'visit-check-in',
        payload: { visitId: 'visit-123' },
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@offline_queue',
        expect.stringContaining('visit-check-in')
      );
    });

    it('should process queue when coming back online', async () => {
      // Setup queue with one item
      const queueItem = {
        id: '123',
        type: 'visit-check-in',
        payload: { visitId: 'visit-123' },
        timestamp: Date.now(),
        retries: 0
      };

      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify([queueItem]));
      (AsyncStorage.setItem as any).mockResolvedValue(undefined);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({})
      });

      await OfflineQueue.processQueue();

      expect(global.fetch).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@offline_queue',
        JSON.stringify([]) // Empty queue after successful processing
      );
    });

    it('should get queue size correctly', async () => {
      const queue = [
        { id: '1', type: 'visit-check-in', payload: {}, timestamp: Date.now(), retries: 0 },
        { id: '2', type: 'visit-check-out', payload: {}, timestamp: Date.now(), retries: 0 }
      ];

      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(queue));

      const size = await OfflineQueue.getQueueSize();
      expect(size).toBe(2);
    });

    it('should clear queue', async () => {
      await OfflineQueue.clearQueue();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@offline_queue');
    });

    it('should retry failed actions with max retries', async () => {
      const queueItem = {
        id: '123',
        type: 'visit-check-in',
        payload: { visitId: 'visit-123' },
        timestamp: Date.now(),
        retries: 3 // Already at max retries
      };

      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify([queueItem]));
      (AsyncStorage.setItem as any).mockResolvedValue(undefined);
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await OfflineQueue.processQueue();

      // Item should be discarded after max retries
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@offline_queue',
        JSON.stringify([]) // Empty because max retries exceeded
      );
    });

    it('should increment retries on failed actions', async () => {
      const queueItem = {
        id: '123',
        type: 'visit-check-in' as const,
        payload: { visitId: 'visit-123' },
        timestamp: Date.now(),
        retries: 0,
        priority: 4, // CRITICAL
        maxRetries: 5,
        errors: [],
      };

      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify([queueItem]));
      (AsyncStorage.setItem as any).mockResolvedValue(undefined);
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await OfflineQueue.processQueue();

      // Item should be kept with retries incremented
      const savedQueue = (AsyncStorage.setItem as any).mock.calls[0][1];
      const parsedQueue = JSON.parse(savedQueue);
      expect(parsedQueue).toHaveLength(1);
      expect(parsedQueue[0].retries).toBe(1);
    });

    it('should handle empty queue gracefully', async () => {
      (AsyncStorage.getItem as any).mockResolvedValue(null);

      await OfflineQueue.processQueue();

      // Should not crash and not call setItem
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should get queue items', async () => {
      const queue = [
        { id: '1', type: 'visit-check-in', payload: {}, timestamp: Date.now(), retries: 0 },
        { id: '2', type: 'visit-check-out', payload: {}, timestamp: Date.now(), retries: 0 }
      ];

      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(queue));

      const items = await OfflineQueue.getQueueItems();
      expect(items).toHaveLength(2);
      expect(items[0].type).toBe('visit-check-in');
      expect(items[1].type).toBe('visit-check-out');
    });

    it('should retry failed items by resetting retry count', async () => {
      const queue = [
        { id: '1', type: 'visit-check-in', payload: {}, timestamp: Date.now(), retries: 2 },
        { id: '2', type: 'visit-check-out', payload: {}, timestamp: Date.now(), retries: 0 }
      ];

      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(queue));
      (AsyncStorage.setItem as any).mockResolvedValue(undefined);
      (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({}) });

      await OfflineQueue.retryFailedItems();

      // Should reset retries and process queue
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const calls = (AsyncStorage.setItem as any).mock.calls;
      
      // First call resets retries
      const resetQueue = JSON.parse(calls[0][1]);
      expect(resetQueue[0].retries).toBe(0);
      expect(resetQueue[1].retries).toBe(0);
    });

    it('should handle HTTP errors when executing actions', async () => {
      const queueItem = {
        id: '123',
        type: 'visit-check-in' as const,
        payload: { visitId: 'visit-123' },
        timestamp: Date.now(),
        retries: 0,
        priority: 4, // CRITICAL
        maxRetries: 5,
        errors: [],
      };

      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify([queueItem]));
      (AsyncStorage.setItem as any).mockResolvedValue(undefined);
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500
      });

      await OfflineQueue.processQueue();

      // Should keep item with incremented retries
      const savedQueue = (AsyncStorage.setItem as any).mock.calls[0][1];
      const parsedQueue = JSON.parse(savedQueue);
      expect(parsedQueue).toHaveLength(1);
      expect(parsedQueue[0].retries).toBe(1);
    });
  });

  describe('ConflictResolver', () => {
    it('should resolve conflicts with last-write-wins', () => {
      const resolver = new ConflictResolver();
      const clientRecord = {
        id: '123',
        updatedAt: new Date('2024-01-02').getTime()
      } as any;
      const serverRecord = {
        id: '123',
        updatedAt: new Date('2024-01-01').getTime()
      } as any;

      const resolution = resolver.resolve(
        clientRecord,
        serverRecord,
        'visit'
      );

      expect(resolution.strategy).toBe('client-wins');
      expect(resolution.resolvedRecord).toEqual(clientRecord);
    });

    it('should merge visit conflicts intelligently', () => {
      const resolver = new ConflictResolver();
      const clientRecord = {
        id: '123',
        updatedAt: new Date('2024-01-01').getTime(),
        care_notes: 'Client notes',
        check_in_time: null, // Not set on client to avoid conflict
        scheduled_date: '2024-01-01'
      } as any;
      const serverRecord = {
        id: '123',
        updatedAt: new Date('2024-01-01').getTime(),
        care_notes: null,
        check_in_time: null,
        scheduled_date: '2024-01-02'
      } as any;

      const resolution = resolver.resolve(
        clientRecord,
        serverRecord,
        'visit'
      );

      expect(resolution.strategy).toBe('merge');
      expect(resolution.resolvedRecord.care_notes).toBe('Client notes');
      expect(resolution.resolvedRecord.scheduled_date).toBe('2024-01-02'); // Server wins for core fields
    });

    it('should handle task completion conflicts', () => {
      const resolver = new ConflictResolver();
      const clientRecord = {
        id: '123',
        updatedAt: new Date('2024-01-01').getTime(),
        status: 'completed'
      } as any;
      const serverRecord = {
        id: '123',
        updatedAt: new Date('2024-01-01').getTime(),
        status: 'pending'
      } as any;

      const resolution = resolver.resolve(
        clientRecord,
        serverRecord,
        'task'
      );

      expect(resolution.strategy).toBe('client-wins');
      expect(resolution.resolvedRecord.status).toBe('completed');
    });

    it('should default to server-wins for unknown record types', () => {
      const resolver = new ConflictResolver();
      const clientRecord = {
        id: '123',
        updatedAt: new Date('2024-01-01').getTime(),
        data: 'client'
      } as any;
      const serverRecord = {
        id: '123',
        updatedAt: new Date('2024-01-01').getTime(),
        data: 'server'
      } as any;

      const resolution = resolver.resolve(
        clientRecord,
        serverRecord,
        'unknown'
      );

      expect(resolution.strategy).toBe('server-wins');
      expect(resolution.resolvedRecord).toEqual(serverRecord);
    });
  });
});
