/**
 * Sync API Validation Schemas
 * 
 * Input validation for offline sync endpoints
 */

import { z } from 'zod';

// UUID validation using regex pattern (more reliable than deprecated .uuid())
// eslint-disable-next-line security/detect-unsafe-regex -- Standard UUID regex, not user-controlled
const uuidRegex = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;
const uuidSchema = z.string().regex(uuidRegex, 'Must be a valid UUID');

/**
 * Sync change operation types
 */
export const syncOperationSchema = z.enum(['CREATE', 'UPDATE', 'DELETE']);

/**
 * Sync entity types
 */
export const syncEntityTypeSchema = z.enum([
  'visit',
  'task',
  'client',
  'evv_record',
  'care_note',
  'signature',
]);

/**
 * Individual sync change schema
 */
export const syncChangeSchema = z.object({
  entityType: syncEntityTypeSchema,
  entityId: uuidSchema,
  operation: syncOperationSchema,
  data: z.record(z.string(), z.unknown()).optional(),
  clientTimestamp: z.number().int().positive(),
});

/**
 * Sync push request schema
 */
export const syncPushRequestSchema = z.object({
  changes: z.array(syncChangeSchema).min(1).max(100),
  deviceId: uuidSchema,
  batchId: uuidSchema.optional(),
});

/**
 * Sync pull request schema (query params)
 */
export const syncPullRequestSchema = z.object({
  lastPulledAt: z.string().regex(/^\d+$/, 'Must be a valid timestamp'),
  entityTypes: z.string().optional(), // Comma-separated list
  limit: z.coerce.number().int().positive().max(1000).default(100),
});

/**
 * Sync heartbeat request schema
 */
export const syncHeartbeatRequestSchema = z.object({
  deviceId: uuidSchema,
  batteryLevel: z.number().min(0).max(100).optional(),
  isCharging: z.boolean().optional(),
  networkType: z.enum(['WIFI', 'CELLULAR', 'OFFLINE', 'UNKNOWN']).optional(),
  storageAvailable: z.number().int().nonnegative().optional(),
});

/**
 * Sync status params schema
 */
export const syncStatusParamsSchema = z.object({
  deviceId: uuidSchema,
});
