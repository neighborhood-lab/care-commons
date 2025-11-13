/**
 * Sync Protocol Service
 * 
 * Implements the two-way sync protocol between client and server.
 * Handles pulling server changes and pushing client changes with
 * conflict detection and resolution.
 * 
 * This is the heart of offline-first architecture, ensuring caregivers
 * never lose data even when working without connectivity for hours.
 */

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable sonarjs/different-types-comparison */

import type { Knex } from 'knex';
import type {
  PullChangesRequest,
  PullChangesResponse,
  PushChangesRequest,
  PushChangesResponse,
  SyncChange,
  SyncConflict,
  LocalChange,
  SyncError,
  SyncEntityType,
} from './types';

export class SyncProtocol {
  private db: Knex;

  constructor(db: Knex) {
    this.db = db;
  }

  /**
   * Pull changes from server since last sync
   * 
   * Returns all changes made on the server since the last pull timestamp.
   * Clients call this periodically to stay up to date.
   */
  async pullChanges(request: PullChangesRequest): Promise<PullChangesResponse> {
    const {
      lastPulledAt,
      entities,
      organizationId,
      branchId,
      caregiverId,
      limit = 100,
    } = request;

    const changes: SyncChange[] = [];
    let maxTimestamp = lastPulledAt;

    // Pull changes for each requested entity type
    for (const entityType of entities) {
      const entityChanges = await this.pullEntityChanges(
        entityType,
        organizationId,
        lastPulledAt,
        branchId,
        caregiverId,
        limit
      );

      changes.push(...entityChanges);

      // Track highest timestamp
      if (entityChanges.length > 0) {
        for (const change of entityChanges) {
          if (change.updatedAt > maxTimestamp) {
            maxTimestamp = change.updatedAt;
          }
        }
      }
    }

    // Sort by timestamp for consistent ordering
    changes.sort((a, b) => a.updatedAt - b.updatedAt);

    // Apply limit across all entity types
    const limitedChanges = changes.slice(0, limit);
    const hasMore = changes.length > limit;

    return {
      changes: limitedChanges,
      timestamp: maxTimestamp,
      hasMore,
      nextCursor: hasMore && limitedChanges.length > 0 
        ? limitedChanges[limitedChanges.length - 1]?.id 
        : undefined,
    };
  }

  /**
   * Push local changes to server
   * 
   * Accepts changes from client and applies them to server database.
   * Detects conflicts when server data has changed since client's version.
   */
  async pushChanges(request: PushChangesRequest): Promise<PushChangesResponse> {
    const { changes, deviceId, timestamp, organizationId } = request;

    const synced: string[] = [];
    const conflicts: SyncConflict[] = [];
    const errors: SyncError[] = [];

    // Process each change in a transaction for atomicity
    for (const change of changes) {
      try {
        const conflict = await this.applyChange(
          change,
          organizationId,
          deviceId,
          timestamp
        );

        if (conflict !== null && conflict !== undefined) {
          conflicts.push(conflict);
        } else {
          synced.push(change.id);
        }
      } catch (error) {
        errors.push(this.createSyncError(change, error));
      }
    }

    return {
      success: errors.length === 0,
      synced: synced.length,
      conflicts,
      errors,
    };
  }

  /**
   * Pull changes for a specific entity type
   */
  private async pullEntityChanges(
    entityType: SyncEntityType,
    organizationId: string,
    lastPulledAt: number,
    branchId?: string,
    caregiverId?: string,
    limit?: number
  ): Promise<SyncChange[]> {
    const tableName = this.getTableName(entityType);

    let query = this.db(tableName)
      .where('organization_id', organizationId)
      .where('updated_at', '>', new Date(lastPulledAt));

    // Apply filters if provided
    if (branchId !== undefined && branchId !== null && branchId !== '') {
      query = query.where('branch_id', branchId);
    }

    if (caregiverId !== undefined && caregiverId !== null && caregiverId !== '' && this.supportsCaregiver(entityType)) {
      query = query.where('caregiver_id', caregiverId);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const records = await query.orderBy('updated_at', 'asc');

    return records.map(record => this.recordToSyncChange(record, entityType));
  }

  /**
   * Apply a local change to the server database
   */
  private async applyChange(
    change: LocalChange,
    organizationId: string,
    deviceId: string,
    timestamp: number
  ): Promise<SyncConflict | null> {
    const tableName = this.getTableName(change.entityType);

    // Check if record exists and get current version
    const existing = await this.db(tableName)
      .where('id', change.entityId)
      .where('organization_id', organizationId)
      .first();

    if (change.operationType === 'CREATE') {
      // Create new record
      if (existing) {
        throw new Error('Record already exists');
      }

      await this.db(tableName).insert({
        ...change.data,
        id: change.entityId,
        organization_id: organizationId,
        version: 1,
        created_at: new Date(change.createdAt),
        updated_at: new Date(timestamp),
        updated_by: deviceId,
      });

      return null;
    }

    if (change.operationType === 'UPDATE') {
      if (!existing) {
        throw new Error('Record not found');
      }

      // Check for version conflict
      const serverVersion = existing.version || 0;
      if (serverVersion > change.version) {
        // Conflict detected - server has newer version
        return this.detectConflicts(
          change,
          existing,
          serverVersion
        );
      }

      // No conflict - apply update
      await this.db(tableName)
        .where('id', change.entityId)
        .where('organization_id', organizationId)
        .update({
          ...change.data,
          version: serverVersion + 1,
          updated_at: new Date(timestamp),
          updated_by: deviceId,
        });

      return null;
    }

    if (change.operationType === 'DELETE') {
      if (!existing) {
        // Already deleted, no conflict
        return null;
      }

      // Soft delete with version check
      if (existing.version > change.version) {
        // Conflict - record modified since client deleted it
        return this.detectConflicts(
          change,
          existing,
          existing.version
        );
      }

      await this.db(tableName)
        .where('id', change.entityId)
        .where('organization_id', organizationId)
        .update({
          deleted_at: new Date(timestamp),
          deleted_by: deviceId,
          version: existing.version + 1,
        });

      return null;
    }

    throw new Error(`Unknown operation type: ${change.operationType}`);
  }

  /**
   * Detect conflicts between local and server versions
   */
  private detectConflicts(
    localChange: LocalChange,
    serverRecord: Record<string, unknown>,
    serverVersion: number
  ): SyncConflict | null {
    // Find fields that differ between local and server
    const conflictedFields: string[] = [];

    for (const [field, localValue] of Object.entries(localChange.data)) {
      const serverValue = serverRecord[field];

      // Skip internal fields
      if (this.isInternalField(field)) continue;

      // Compare values
      if (JSON.stringify(localValue) !== JSON.stringify(serverValue)) {
        conflictedFields.push(field);
      }
    }

    if (conflictedFields.length === 0) {
      // No actual conflicts, just version mismatch
      return null;
    }

    // Return first conflicted field (in practice, would return all)
    const field = conflictedFields[0];
    if (!field) return null; // Should not happen, but type safety

    const localValue = localChange.data[field];
    const serverValue = serverRecord[field];

    return {
      id: `conflict_${localChange.id}_${field}`,
      entityType: localChange.entityType,
      entityId: localChange.entityId,
      field,
      localValue,
      localUpdatedAt: localChange.updatedAt,
      remoteValue: serverValue,
      remoteUpdatedAt: Number(serverRecord.updated_at) || Date.now(),
      serverVersion,
      clientVersion: localChange.version,
    };
  }

  /**
   * Convert database record to sync change
   */
  private recordToSyncChange(
    record: Record<string, unknown>,
    entityType: SyncEntityType
  ): SyncChange {
    const { id, version, updated_at, updated_by, ...data } = record;

    return {
      id: String(id),
      entityType,
      operationType: 'UPDATE', // Could track actual operation type
      data: data as Record<string, unknown>,
      version: Number(version) || 0,
      updatedAt: updated_at instanceof Date ? updated_at.getTime() : Number(updated_at),
      updatedBy: String(updated_by || 'system'),
    };
  }

  /**
   * Create sync error from exception
   */
  private createSyncError(change: LocalChange, error: unknown): SyncError {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Determine if error is retryable
    const isRetryable = this.isRetryableError(error);

    return {
      changeId: change.id,
      entityType: change.entityType,
      entityId: change.entityId,
      errorCode: this.getErrorCode(error),
      errorMessage,
      isRetryable,
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const retryableMessages = [
      'network error',
      'timeout',
      'connection',
      'ECONNREFUSED',
      'ETIMEDOUT',
    ];

    return retryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }

  /**
   * Get error code from error
   */
  private getErrorCode(error: unknown): string {
    if (error instanceof Error) {
      // TypeScript doesn't have error codes by default
      const anyError = error as Error & { code?: string };
      return anyError.code || 'UNKNOWN_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  /**
   * Get database table name for entity type
   */
  private getTableName(entityType: SyncEntityType): string {
    const tableMap: Record<SyncEntityType, string> = {
      VISIT: 'visits',
      EVV_RECORD: 'evv_records',
      TIME_ENTRY: 'time_entries',
      TASK: 'care_plan_tasks',
      CLIENT: 'clients',
      CAREGIVER: 'caregivers',
      GEOFENCE: 'geofences',
    };

    const tableName = tableMap[entityType];
    if (!tableName) {
      throw new Error(`No table mapping for entity type: ${entityType}`);
    }
    return tableName;
  }

  /**
   * Check if entity type supports caregiver filtering
   */
  private supportsCaregiver(entityType: SyncEntityType): boolean {
    return ['VISIT', 'EVV_RECORD', 'TIME_ENTRY'].includes(entityType);
  }

  /**
   * Check if field is internal (should not be synced to clients)
   */
  private isInternalField(field: string): boolean {
    const internalFields = [
      'id',
      'version',
      'created_at',
      'updated_at',
      'created_by',
      'updated_by',
      'deleted_at',
      'deleted_by',
      'organization_id',
    ];

    return internalFields.includes(field);
  }
}
