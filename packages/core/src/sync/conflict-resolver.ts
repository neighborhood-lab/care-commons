/**
 * Conflict Resolution Service
 * 
 * Resolves conflicts that occur when the same data is modified offline
 * on multiple devices or when client changes conflict with server changes.
 * 
 * This is critical for home healthcare where caregivers may work offline
 * for extended periods and supervisors may update records simultaneously.
 */

import type {
  SyncConflict,
  ConflictResolution,
  ConflictResolutionStrategy,
  SyncEntityType,
} from './types';

export class ConflictResolver {
  /**
   * Resolve a sync conflict using appropriate strategy
   */
  async resolve(conflict: SyncConflict): Promise<ConflictResolution> {
    const strategy = this.determineStrategy(conflict);
    
    switch (strategy) {
      case 'LAST_WRITE_WINS':
        return this.resolveLastWriteWins(conflict);
      
      case 'MERGE_ARRAYS':
        return this.resolveMergeArrays(conflict);
      
      case 'SERVER_WINS':
        return this.resolveServerWins(conflict);
      
      case 'CLIENT_WINS':
        return this.resolveClientWins(conflict);
      
      case 'MANUAL_REVIEW':
        return this.resolveManualReview(conflict);
      
      default:
        // Default to server wins for safety
        return this.resolveServerWins(conflict);
    }
  }

  /**
   * Determine appropriate resolution strategy based on conflict context
   */
  private determineStrategy(conflict: SyncConflict): ConflictResolutionStrategy {
    const { entityType, field } = conflict;

    // Critical EVV fields require manual review to maintain audit compliance
    if (this.isCriticalEVVField(entityType, field)) {
      return 'MANUAL_REVIEW';
    }

    // Array fields (tasks, notes) should be merged when possible
    if (this.isArrayField(field)) {
      return 'MERGE_ARRAYS';
    }

    // Status fields use last write wins
    if (this.isStatusField(field)) {
      return 'LAST_WRITE_WINS';
    }

    // Clock times are critical for billing - manual review required
    if (this.isClockTimeField(field)) {
      return 'MANUAL_REVIEW';
    }

    // Default to last write wins for most fields
    return 'LAST_WRITE_WINS';
  }

  /**
   * Resolve conflict using last write wins strategy
   * The modification with the most recent timestamp wins
   */
  private resolveLastWriteWins(conflict: SyncConflict): ConflictResolution {
    const winner = conflict.remoteUpdatedAt > conflict.localUpdatedAt 
      ? 'REMOTE' 
      : 'LOCAL';
    
    const value = winner === 'REMOTE' 
      ? conflict.remoteValue 
      : conflict.localValue;

    return {
      conflictId: conflict.id,
      strategy: 'LAST_WRITE_WINS',
      winner,
      value,
    };
  }

  /**
   * Resolve conflict by merging array values
   * Combines both local and remote arrays, removing duplicates
   */
  private resolveMergeArrays(conflict: SyncConflict): ConflictResolution {
    const localArray = Array.isArray(conflict.localValue) ? conflict.localValue : [];
    const remoteArray = Array.isArray(conflict.remoteValue) ? conflict.remoteValue : [];

    // Merge arrays and remove duplicates based on 'id' field if present
    const merged = this.mergeArraysByKey([...localArray, ...remoteArray], 'id');

    return {
      conflictId: conflict.id,
      strategy: 'MERGE_ARRAYS',
      winner: 'MERGED',
      value: merged,
      metadata: {
        localCount: localArray.length,
        remoteCount: remoteArray.length,
        mergedCount: merged.length,
      },
    };
  }

  /**
   * Resolve conflict by always choosing server value
   * Used for fields where server is authoritative
   */
  private resolveServerWins(conflict: SyncConflict): ConflictResolution {
    return {
      conflictId: conflict.id,
      strategy: 'SERVER_WINS',
      winner: 'REMOTE',
      value: conflict.remoteValue,
    };
  }

  /**
   * Resolve conflict by always choosing client value
   * Used when client data takes precedence (rare)
   */
  private resolveClientWins(conflict: SyncConflict): ConflictResolution {
    return {
      conflictId: conflict.id,
      strategy: 'CLIENT_WINS',
      winner: 'LOCAL',
      value: conflict.localValue,
    };
  }

  /**
   * Flag conflict for manual review by supervisor
   * Used for critical fields where automated resolution is risky
   */
  private resolveManualReview(conflict: SyncConflict): ConflictResolution {
    // Determine who should review based on entity type
    const reviewBy = this.isBillingRelated(conflict.entityType, conflict.field)
      ? 'ADMINISTRATOR'
      : 'SUPERVISOR';

    return {
      conflictId: conflict.id,
      strategy: 'MANUAL_REVIEW',
      winner: 'MANUAL',
      value: conflict.remoteValue, // Use server value temporarily
      requiresReview: true,
      reviewBy,
      metadata: {
        localValue: conflict.localValue,
        remoteValue: conflict.remoteValue,
        localUpdatedAt: conflict.localUpdatedAt,
        remoteUpdatedAt: conflict.remoteUpdatedAt,
        reason: 'Critical field requires manual review for compliance',
      },
    };
  }

  /**
   * Check if field is critical for EVV compliance
   */
  private isCriticalEVVField(entityType: SyncEntityType, field: string): boolean {
    if (entityType !== 'EVV_RECORD' && entityType !== 'TIME_ENTRY') {
      return false;
    }

    const criticalFields = [
      'clockInTime',
      'clockOutTime',
      'clock_in_time',
      'clock_out_time',
      'serviceDate',
      'service_date',
      'totalDuration',
      'total_duration',
    ];

    return criticalFields.includes(field);
  }

  /**
   * Check if field is an array type
   */
  private isArrayField(field: string): boolean {
    const arrayFields = [
      'tasks',
      'notes',
      'attachments',
      'tags',
      'services',
      'caregiverIds',
      'caregiver_ids',
    ];

    return arrayFields.includes(field);
  }

  /**
   * Check if field is a status field
   */
  private isStatusField(field: string): boolean {
    return field === 'status' || field.endsWith('_status') || field.endsWith('Status');
  }

  /**
   * Check if field is a clock time field
   */
  private isClockTimeField(field: string): boolean {
    const clockFields = [
      'clockInTime',
      'clockOutTime',
      'clock_in_time',
      'clock_out_time',
      'entryTimestamp',
      'entry_timestamp',
    ];

    return clockFields.includes(field);
  }

  /**
   * Check if field is billing-related (requires admin review)
   */
  private isBillingRelated(entityType: SyncEntityType, field: string): boolean {
    if (entityType === 'EVV_RECORD' || entityType === 'TIME_ENTRY') {
      const billingFields = [
        'clockInTime',
        'clockOutTime',
        'totalDuration',
        'billableUnits',
        'serviceCode',
        'authorizationId',
      ];
      return billingFields.includes(field);
    }
    return false;
  }

  /**
   * Merge arrays by unique key, preferring newer items
   */
  private mergeArraysByKey(
    items: unknown[],
    keyField: string
  ): unknown[] {
    if (items.length === 0) return [];

    const map = new Map<unknown, unknown>();

    for (const item of items) {
      if (item === null || item === undefined || typeof item !== 'object') continue;

      const key = (item as Record<string, unknown>)[keyField];
      if (key === undefined) {
        // No key field, add all items with unique key
        map.set(`unique_${Date.now()}_${map.size}`, item);
        continue;
      }

      const existing = map.get(key);
      if (existing === null || existing === undefined) {
        map.set(key, item);
        continue;
      }

      // If both have updatedAt, keep the newer one
      const existingUpdatedAt = (existing as Record<string, unknown>).updatedAt;
      const itemUpdatedAt = (item as Record<string, unknown>).updatedAt;

      if (
        typeof existingUpdatedAt === 'number' &&
        typeof itemUpdatedAt === 'number'
      ) {
        if (itemUpdatedAt > existingUpdatedAt) {
          map.set(key, item);
        }
      } else {
        // No timestamp, keep existing
        continue;
      }
    }

    return Array.from(map.values());
  }

  /**
   * Batch resolve multiple conflicts
   */
  async resolveAll(conflicts: SyncConflict[]): Promise<ConflictResolution[]> {
    return Promise.all(
      conflicts.map(conflict => this.resolve(conflict))
    );
  }
}
