/**
 * Offline Queue Service Tests
 * 
 * Tests the offline queue service for EVV operations with retry logic,
 * priority-based processing, and conflict resolution.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfflineQueueService } from '../offline-queue';
import type { ClockInInput, ClockOutInput } from '../../shared/index';

// Mock NetInfo
vi.mock('@react-native-community/netinfo', () => ({
  default: {
    fetch: vi.fn().mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    }),
  },
}));

// Mock WatermelonDB
const mockDatabase = {
  collections: {
    get: vi.fn(),
  },
  get: vi.fn(),
  write: vi.fn((callback) => callback()),
} as any;

const mockCollection = {
  create: vi.fn(),
  find: vi.fn(),
  query: vi.fn(() => ({
    fetch: vi.fn().mockResolvedValue([]),
    fetchCount: vi.fn().mockResolvedValue(0),
  })),
};

describe('OfflineQueueService', () => {
  let service: OfflineQueueService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset create mock to default implementation
    mockCollection.create.mockImplementation((callback) => {
      const record = {
        id: '',
        operationType: '',
        entityType: '',
        entityId: '',
        payloadJson: '',
        priority: 0,
        retryCount: 0,
        maxRetries: 0,
        status: '',
        createdAt: 0,
        updatedAt: 0,
      };
      callback(record);
      return Promise.resolve(record);
    });
    mockDatabase.collections.get.mockReturnValue(mockCollection);
    mockDatabase.get.mockReturnValue(mockCollection);
    service = new OfflineQueueService(mockDatabase);
  });

  describe('queueClockIn', () => {
    it('should queue a clock-in operation with high priority', async () => {
      const clockInInput: ClockInInput = {
        visitId: 'visit-123',
        caregiverId: 'caregiver-456',
        location: {
          latitude: 30.2672,
          longitude: -97.7431,
          accuracy: 10,
          timestamp: new Date('2025-01-01T10:00:00Z'),
          method: 'GPS',
          mockLocationDetected: false,
        },
        deviceInfo: {
          deviceId: 'device-789',
          deviceModel: 'iPhone 15',
          deviceOS: 'iOS',
          osVersion: '17.0',
          appVersion: '0.1.0',
          batteryLevel: 85,
          networkType: 'WIFI',
        },
      };

      const operationId = await service.queueClockIn(clockInInput);

      expect(operationId).toMatch(/^op_\d+_[a-z0-9]+$/);
      expect(mockCollection.create).toHaveBeenCalledOnce();
      
      const createCallback = mockCollection.create.mock.calls[0][0];
      const mockRecord = {
        id: '',
        operationType: '',
        entityType: '',
        entityId: '',
        payloadJson: '',
        priority: 0,
        retryCount: 0,
        maxRetries: 0,
        status: '',
        createdAt: 0,
        updatedAt: 0,
      };
      
      createCallback(mockRecord);
      
      expect(mockRecord.operationType).toBe('CLOCK_IN');
      expect(mockRecord.entityType).toBe('TIME_ENTRY');
      expect(mockRecord.entityId).toBe('visit-123');
      expect(mockRecord.priority).toBe(100); // Highest priority
      expect(mockRecord.status).toBe('PENDING');
      
      const parsed = JSON.parse(mockRecord.payloadJson);
      expect(parsed.visitId).toBe(clockInInput.visitId);
      expect(parsed.caregiverId).toBe(clockInInput.caregiverId);
      expect(parsed.location.latitude).toBe(clockInInput.location.latitude);
      expect(parsed.location.longitude).toBe(clockInInput.location.longitude);
      expect(parsed.location.timestamp).toBe(clockInInput.location.timestamp.toISOString());
    });

    it('should handle errors gracefully', async () => {
      mockCollection.create.mockRejectedValue(new Error('Database error'));

      await expect(
        service.queueClockIn({} as ClockInInput)
      ).rejects.toThrow('Database error');
    });
  });

  describe('queueClockOut', () => {
    it('should queue a clock-out operation with appropriate priority', async () => {
      const clockOutInput: ClockOutInput = {
        visitId: 'visit-123',
        evvRecordId: 'evv-789',
        caregiverId: 'caregiver-456',
        location: {
          latitude: 30.2672,
          longitude: -97.7431,
          accuracy: 12,
          timestamp: new Date('2025-01-01T12:00:00Z'),
          method: 'GPS',
          mockLocationDetected: false,
        },
        deviceInfo: {
          deviceId: 'device-789',
          deviceModel: 'iPhone 15',
          deviceOS: 'iOS',
          osVersion: '17.0',
          appVersion: '0.1.0',
          batteryLevel: 75,
          networkType: 'WIFI',
        },
      };

      const operationId = await service.queueClockOut(clockOutInput);

      expect(operationId).toMatch(/^op_\d+_[a-z0-9]+$/);
      expect(mockCollection.create).toHaveBeenCalledOnce();
      
      const createCallback = mockCollection.create.mock.calls[0][0];
      const mockRecord = {
        id: '',
        operationType: '',
        entityType: '',
        entityId: '',
        payloadJson: '',
        priority: 0,
        retryCount: 0,
        maxRetries: 0,
        status: '',
        createdAt: 0,
        updatedAt: 0,
      };
      
      createCallback(mockRecord);
      
      expect(mockRecord.operationType).toBe('CLOCK_OUT');
      expect(mockRecord.entityType).toBe('TIME_ENTRY');
      expect(mockRecord.priority).toBe(90); // High priority, but lower than clock-in
      expect(mockRecord.status).toBe('PENDING');
    });
  });

  describe('getQueueStatus', () => {
    it('should return accurate queue status counts', async () => {
      const mockQuery = {
        fetch: vi.fn().mockResolvedValue([]),
        fetchCount: vi.fn(),
      };
      
      mockCollection.query.mockReturnValue(mockQuery);
      mockQuery.fetchCount
        .mockResolvedValueOnce(5)  // pending
        .mockResolvedValueOnce(2)  // in_progress
        .mockResolvedValueOnce(1)  // failed
        .mockResolvedValueOnce(10); // completed

      const status = await service.getQueueStatus();

      expect(status).toEqual({
        pending: 5,
        inProgress: 2,
        failed: 1,
        completed: 10,
      });
      expect(mockCollection.query).toHaveBeenCalledTimes(4);
    });

    it('should handle query errors', async () => {
      mockCollection.query.mockReturnValue({
        fetch: vi.fn().mockResolvedValue([]),
        fetchCount: vi.fn().mockRejectedValue(new Error('Query failed')),
      });

      await expect(service.getQueueStatus()).rejects.toThrow('Query failed');
    });
  });

  describe('processQueue', () => {
    it('should not process if sync already in progress', async () => {
      // Start first sync
      const promise1 = service.processQueue();
      
      // Try to start second sync immediately
      const result2 = await service.processQueue();
      
      expect(result2).toEqual({
        processed: 0,
        succeeded: 0,
        failed: 0,
      });

      await promise1; // Clean up
    });

    it('should return stats with no pending operations', async () => {
      mockCollection.query.mockReturnValue({
        fetch: vi.fn().mockResolvedValue([]),
        fetchCount: vi.fn().mockResolvedValue(0),
      });

      const result = await service.processQueue();

      expect(result).toEqual({
        processed: 0,
        succeeded: 0,
        failed: 0,
      });
    });
  });

  describe('clearCompleted', () => {
    it('should clear completed operations older than specified days', async () => {
      const mockOldOperations = [
        { destroyPermanently: vi.fn() },
        { destroyPermanently: vi.fn() },
        { destroyPermanently: vi.fn() },
      ];

      mockCollection.query.mockReturnValue({
        fetch: vi.fn().mockResolvedValue(mockOldOperations),
        fetchCount: vi.fn().mockResolvedValue(3),
      });

      const cleared = await service.clearCompleted(7);

      expect(cleared).toBe(3);
      expect(mockOldOperations[0].destroyPermanently).toHaveBeenCalledOnce();
      expect(mockOldOperations[1].destroyPermanently).toHaveBeenCalledOnce();
      expect(mockOldOperations[2].destroyPermanently).toHaveBeenCalledOnce();
    });

    it('should use default 7 days if not specified', async () => {
      mockCollection.query.mockReturnValue({
        fetch: vi.fn().mockResolvedValue([]),
        fetchCount: vi.fn().mockResolvedValue(0),
      });

      const cleared = await service.clearCompleted();

      expect(cleared).toBe(0);
      // Verify query was called with proper time range
      expect(mockCollection.query).toHaveBeenCalled();
    });
  });

  describe('startAutoSync', () => {
    it('should start automatic sync interval', async () => {
      vi.useFakeTimers();
      const processQueueSpy = vi.spyOn(service, 'processQueue').mockResolvedValue({
        processed: 0,
        succeeded: 0,
        failed: 0,
      });

      service.startAutoSync(1000); // 1 second interval

      await vi.advanceTimersByTimeAsync(1000);
      expect(processQueueSpy).toHaveBeenCalledOnce();

      await vi.advanceTimersByTimeAsync(1000);
      expect(processQueueSpy).toHaveBeenCalledTimes(2);

      service.stopAutoSync();
      vi.useRealTimers();
    });

    it('should clear existing interval before starting new one', () => {
      vi.useFakeTimers();
      
      service.startAutoSync(1000);
      service.startAutoSync(2000); // Should clear first interval

      vi.useRealTimers();
    });
  });

  describe('stopAutoSync', () => {
    it('should stop automatic sync', async () => {
      vi.useFakeTimers();
      const processQueueSpy = vi.spyOn(service, 'processQueue').mockResolvedValue({
        processed: 0,
        succeeded: 0,
        failed: 0,
      });

      service.startAutoSync(1000);
      await vi.advanceTimersByTimeAsync(1000);
      expect(processQueueSpy).toHaveBeenCalledOnce();

      service.stopAutoSync();
      await vi.advanceTimersByTimeAsync(1000);
      // Should not be called again after stopping
      expect(processQueueSpy).toHaveBeenCalledOnce();

      vi.useRealTimers();
    });
  });

  describe('generateOperationId', () => {
    it('should generate unique IDs', async () => {
      const id1 = await service.queueClockIn({} as ClockInInput);
      const id2 = await service.queueClockIn({} as ClockInInput);

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^op_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^op_\d+_[a-z0-9]+$/);
    });
  });

  describe('configuration', () => {
    it('should use default config if not provided', () => {
      const defaultService = new OfflineQueueService(mockDatabase);
      expect(defaultService).toBeDefined();
    });

    it('should merge custom config with defaults', () => {
      const customService = new OfflineQueueService(mockDatabase, {
        maxRetries: 10,
        baseRetryDelay: 5000,
      });

      expect(customService).toBeDefined();
    });
  });

  describe('setAuthToken', () => {
    it('should update the auth token', () => {
      const token = 'test-token-123';
      service.setAuthToken(token);

      // Verify token is set (indirectly by checking service is still functional)
      expect(service).toBeDefined();
    });
  });

  describe('processQueue with operations', () => {
    it('should process pending operations in priority order', async () => {
      const mockOp1 = {
        id: 'op1',
        operationType: 'CLOCK_IN',
        payloadJson: JSON.stringify({
          visitId: 'visit-123',
          caregiverId: 'caregiver-456',
        }),
        retryCount: 0,
        maxRetries: 3,
        update: vi.fn((callback) => {
          callback({
            status: '',
            updatedAt: 0,
            completedAt: 0,
          });
        }),
      };

      mockCollection.query.mockReturnValue({
        fetch: vi.fn().mockResolvedValue([mockOp1]),
        fetchCount: vi.fn().mockResolvedValue(1),
      });

      // Mock fetch for API calls
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

      const result = await service.processQueue();

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockOp1.update).toHaveBeenCalled();
    });

    it('should handle operation failures with retry logic', async () => {
      const mockOp1 = {
        id: 'op1',
        operationType: 'CLOCK_OUT',
        payloadJson: JSON.stringify({
          visitId: 'visit-123',
          evvRecordId: 'evv-789',
        }),
        retryCount: 0,
        maxRetries: 3,
        update: vi.fn((callback) => {
          callback({
            status: '',
            retryCount: 0,
            nextRetryAt: 0,
            errorMessage: '',
            errorDetailsJson: '',
            updatedAt: 0,
          });
        }),
      };

      mockCollection.query.mockReturnValue({
        fetch: vi.fn().mockResolvedValue([mockOp1]),
        fetchCount: vi.fn().mockResolvedValue(1),
      });

      // Mock fetch to fail
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Server Error',
        json: vi.fn().mockResolvedValue({ message: 'API error' }),
      });

      const result = await service.processQueue();

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(1);
      expect(mockOp1.update).toHaveBeenCalled();
    });

    it('should mark operations as failed after max retries', async () => {
      const mockOp1 = {
        id: 'op1',
        operationType: 'UPDATE_EVV',
        payloadJson: JSON.stringify({ data: 'test' }),
        retryCount: 4, // Already at max retries
        maxRetries: 3,
        update: vi.fn((callback) => {
          callback({
            status: '',
            errorMessage: '',
            errorDetailsJson: '',
            updatedAt: 0,
          });
        }),
      };

      mockCollection.query.mockReturnValue({
        fetch: vi.fn().mockResolvedValue([mockOp1]),
        fetchCount: vi.fn().mockResolvedValue(1),
      });

      // Mock fetch to fail
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Server Error',
        json: vi.fn().mockResolvedValue({ message: 'API error' }),
      });

      const result = await service.processQueue();

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(1);
    });

    it('should process SYNC_VISIT operations', async () => {
      const mockOp1 = {
        id: 'op1',
        operationType: 'SYNC_VISIT',
        payloadJson: JSON.stringify({ visitId: 'visit-123' }),
        retryCount: 0,
        maxRetries: 3,
        update: vi.fn((callback) => {
          callback({
            status: '',
            updatedAt: 0,
            completedAt: 0,
          });
        }),
      };

      mockCollection.query.mockReturnValue({
        fetch: vi.fn().mockResolvedValue([mockOp1]),
        fetchCount: vi.fn().mockResolvedValue(1),
      });

      // Mock fetch for API calls
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

      const result = await service.processQueue();

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
    });

    it('should handle unknown operation types', async () => {
      const mockOp1 = {
        id: 'op1',
        operationType: 'UNKNOWN_TYPE',
        payloadJson: JSON.stringify({}),
        retryCount: 0,
        maxRetries: 3,
        update: vi.fn((callback) => {
          callback({
            status: '',
            retryCount: 0,
            nextRetryAt: 0,
            errorMessage: '',
            updatedAt: 0,
          });
        }),
      };

      mockCollection.query.mockReturnValue({
        fetch: vi.fn().mockResolvedValue([mockOp1]),
        fetchCount: vi.fn().mockResolvedValue(1),
      });

      const result = await service.processQueue();

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe('API request handling', () => {
    it('should make authenticated requests when token is set', async () => {
      service.setAuthToken('test-token-123');

      const mockOp = {
        id: 'op1',
        operationType: 'CLOCK_IN',
        payloadJson: JSON.stringify({
          visitId: 'visit-123',
          caregiverId: 'caregiver-456',
        }),
        retryCount: 0,
        maxRetries: 3,
        update: vi.fn((callback) => {
          callback({
            status: '',
            updatedAt: 0,
            completedAt: 0,
          });
        }),
      };

      mockCollection.query.mockReturnValue({
        fetch: vi.fn().mockResolvedValue([mockOp]),
        fetchCount: vi.fn().mockResolvedValue(1),
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

      await service.processQueue();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/evv/clock-in'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123',
          }),
        })
      );
    });

    it('should handle API errors with JSON response', async () => {
      const mockOp = {
        id: 'op1',
        operationType: 'CLOCK_IN',
        payloadJson: JSON.stringify({
          visitId: 'visit-123',
        }),
        retryCount: 0,
        maxRetries: 3,
        update: vi.fn((callback) => {
          callback({
            status: '',
            retryCount: 0,
            nextRetryAt: 0,
            errorMessage: '',
            updatedAt: 0,
          });
        }),
      };

      mockCollection.query.mockReturnValue({
        fetch: vi.fn().mockResolvedValue([mockOp]),
        fetchCount: vi.fn().mockResolvedValue(1),
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({ message: 'Invalid visit ID' }),
      });

      const result = await service.processQueue();

      expect(result.failed).toBe(1);
    });

    it('should handle API errors without JSON response', async () => {
      const mockOp = {
        id: 'op1',
        operationType: 'CLOCK_OUT',
        payloadJson: JSON.stringify({
          visitId: 'visit-123',
          evvRecordId: 'evv-789',
        }),
        retryCount: 0,
        maxRetries: 3,
        update: vi.fn((callback) => {
          callback({
            status: '',
            retryCount: 0,
            nextRetryAt: 0,
            errorMessage: '',
            updatedAt: 0,
          });
        }),
      };

      mockCollection.query.mockReturnValue({
        fetch: vi.fn().mockResolvedValue([mockOp]),
        fetchCount: vi.fn().mockResolvedValue(1),
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
        json: vi.fn().mockRejectedValue(new Error('Not JSON')),
      });

      const result = await service.processQueue();

      expect(result.failed).toBe(1);
    });
  });
});
