/**
 * Offline Sync Validator
 *
 * Zod schemas for validating offline sync operations, conflicts, and cache policies.
 */

import { z } from 'zod';

// Common schemas
const UUIDSchema = z.string().uuid();
const TimestampSchema = z.string().datetime();

// Offline Sync Queue Validation
export const SyncOperationSchema = z.enum([
  'CREATE',
  'UPDATE',
  'DELETE',
  'PATCH',
  'MERGE',
  'UPSERT',
]);

export const SyncPrioritySchema = z.enum(['CRITICAL', 'HIGH', 'NORMAL', 'LOW', 'BACKGROUND']);

export const SyncQueueStatusSchema = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'CONFLICT',
  'EXPIRED',
  'CANCELLED',
  'PAUSED',
  'WAITING_APPROVAL',
  'BLOCKED',
]);

export const QueueSyncOperationSchema = z.object({
  userId: UUIDSchema,
  deviceId: z.string().min(1),
  operation: SyncOperationSchema,
  entityType: z.string().min(1),
  entityId: UUIDSchema,
  payload: z.record(z.unknown()),
  previousVersion: z.record(z.unknown()).optional(),
  priority: SyncPrioritySchema.optional(),
  dependsOn: z.array(UUIDSchema).optional(),
});

// Sync Conflict Validation
export const ConflictTypeSchema = z.enum([
  'UPDATE_UPDATE',
  'UPDATE_DELETE',
  'DELETE_UPDATE',
  'CREATE_CREATE',
  'FIELD_LEVEL',
  'DEPENDENCY',
]);

export const ConflictStrategySchema = z.enum([
  'CLIENT_WINS',
  'SERVER_WINS',
  'NEWEST_WINS',
  'MANUAL',
  'FIELD_LEVEL_MERGE',
  'CUSTOM',
]);

export const ResolveSyncConflictSchema = z.object({
  conflictId: UUIDSchema,
  strategy: ConflictStrategySchema,
  resolvedBy: UUIDSchema,
  customResolution: z.record(z.unknown()).optional(),
  notes: z.string().max(1000).optional(),
});

// Offline Cache Policy Validation
export const CacheScopeSchema = z.object({
  entities: z.array(z.string()).min(1),
  dateRangeStart: z.coerce.date().optional(),
  dateRangeEnd: z.coerce.date().optional(),
  myClientsOnly: z.boolean().optional(),
  myScheduleOnly: z.boolean().optional(),
  myBranchOnly: z.boolean().optional(),
  customFilters: z.record(z.unknown()).optional(),
});

export const CacheRefreshStrategySchema = z.enum([
  'ON_CONNECT',
  'PERIODIC',
  'ON_DEMAND',
  'BACKGROUND',
]);

export const CachePrioritySchema = z.enum(['CRITICAL', 'HIGH', 'NORMAL', 'LOW']);

export const EvictionPolicySchema = z.enum(['LRU', 'LFU', 'FIFO', 'TTL', 'PRIORITY']);

export const CreateCachePolicySchema = z.object({
  organizationId: UUIDSchema,
  branchIds: z.array(UUIDSchema).optional(),
  userId: UUIDSchema.optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  scope: CacheScopeSchema,
  maxCacheSizeMB: z.number().positive(),
  defaultTTL: z.number().positive(),
  refreshStrategy: CacheRefreshStrategySchema,
  evictionPolicy: EvictionPolicySchema,
  preloadOnLogin: z.boolean(),
  backgroundSync: z.boolean(),
});

export const UpdateCachePolicySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  scope: CacheScopeSchema.optional(),
  maxCacheSizeMB: z.number().positive().optional(),
  defaultTTL: z.number().positive().optional(),
  refreshStrategy: CacheRefreshStrategySchema.optional(),
  evictionPolicy: EvictionPolicySchema.optional(),
  preloadOnLogin: z.boolean().optional(),
  backgroundSync: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
});

// Network Status Validation
export const NetworkStatusSchema = z.object({
  isOnline: z.boolean(),
  connectionType: z.enum(['WIFI', 'CELLULAR', 'ETHERNET', 'UNKNOWN']).optional(),
  effectiveType: z.enum(['2g', '3g', '4g', '5g', 'slow-2g', 'unknown']).optional(),
  downlink: z.number().positive().optional(),
  rtt: z.number().nonnegative().optional(),
  lastCheckedAt: TimestampSchema,
});

/**
 * OfflineSyncValidator
 *
 * Provides validation methods for offline sync operations.
 */
export class OfflineSyncValidator {
  /**
   * Validate queue sync operation input
   */
  static validateQueueOperation(data: unknown): boolean {
    try {
      QueueSyncOperationSchema.parse(data);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.errors.map((e) => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Validate resolve sync conflict input
   */
  static validateResolveConflict(data: unknown): boolean {
    try {
      ResolveSyncConflictSchema.parse(data);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.errors.map((e) => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Validate create cache policy input
   */
  static validateCreateCachePolicy(data: unknown): boolean {
    try {
      CreateCachePolicySchema.parse(data);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.errors.map((e) => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Validate update cache policy input
   */
  static validateUpdateCachePolicy(data: unknown): boolean {
    try {
      UpdateCachePolicySchema.parse(data);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.errors.map((e) => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Validate network status
   */
  static validateNetworkStatus(data: unknown): boolean {
    try {
      NetworkStatusSchema.parse(data);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.errors.map((e) => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Validate sync operation priority
   */
  static validatePriority(priority: string): boolean {
    const validPriorities = ['CRITICAL', 'HIGH', 'NORMAL', 'LOW', 'BACKGROUND'];
    if (!validPriorities.includes(priority)) {
      throw new Error(
        `Invalid priority: ${priority}. Must be one of: ${validPriorities.join(', ')}`
      );
    }
    return true;
  }

  /**
   * Validate cache size limit
   */
  static validateCacheSize(sizeMB: number, maxAllowedMB: number = 1000): boolean {
    if (sizeMB <= 0) {
      throw new Error('Cache size must be positive');
    }

    if (sizeMB > maxAllowedMB) {
      throw new Error(`Cache size (${sizeMB}MB) exceeds maximum allowed (${maxAllowedMB}MB)`);
    }

    return true;
  }

  /**
   * Validate TTL (time-to-live)
   */
  static validateTTL(ttlSeconds: number): boolean {
    if (ttlSeconds <= 0) {
      throw new Error('TTL must be positive');
    }

    const maxTTL = 30 * 24 * 60 * 60; // 30 days
    if (ttlSeconds > maxTTL) {
      throw new Error(`TTL (${ttlSeconds}s) exceeds maximum (${maxTTL}s / 30 days)`);
    }

    return true;
  }
}
