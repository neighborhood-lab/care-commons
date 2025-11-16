import type { Model } from '@nozbe/watermelondb';

/**
 * Conflict resolution strategies
 * - client-wins: Use client version (caregiver has latest data)
 * - server-wins: Use server version (trust authoritative source)
 * - merge: Intelligently merge non-conflicting fields
 * - manual: Requires user intervention to resolve
 */
export type ConflictStrategy = 'client-wins' | 'server-wins' | 'merge' | 'manual';

/**
 * Field-level conflict information for granular resolution
 */
export interface FieldConflict {
  field: string;
  clientValue: any;
  serverValue: any;
  lastModifiedBy?: string;
  clientTimestamp?: Date;
  serverTimestamp?: Date;
}

/**
 * Detailed conflict resolution result
 */
export interface ConflictResolution {
  strategy: ConflictStrategy;
  resolvedRecord: any;
  fieldConflicts?: FieldConflict[];
  requiresManualReview: boolean;
  resolution_metadata?: {
    resolvedAt: Date;
    resolvedBy?: string;
    reason?: string;
  };
}

/**
 * User decision for manual conflict resolution
 */
export interface ManualResolution {
  recordId: string;
  recordType: string;
  selectedStrategy: 'client' | 'server' | 'field-by-field';
  fieldResolutions?: Record<string, 'client' | 'server' | any>;
  userId: string;
  timestamp: Date;
}

/**
 * Enhanced conflict resolver with field-level granularity and
 * compliance-aware resolution for home healthcare workflows
 */
export class ConflictResolver {
  /**
   * Core conflict detection fields that should never auto-merge
   * These require manual review for regulatory compliance
   */
  private static readonly CRITICAL_FIELDS = [
    'clock_in_time',
    'clock_out_time',
    'client_signature',
    'caregiver_signature',
    'verification_status',
    'evv_status',
  ];

  /**
   * Client-preferred fields (caregiver observations in the field)
   */
  private static readonly CLIENT_PRIORITY_FIELDS = [
    'care_notes',
    'tasks_completed',
    'client_mood',
    'client_condition_notes',
    'activities_performed',
    'incident_description',
    'visit_notes',
  ];

  /**
   * Server-authoritative fields (administrative/scheduling data)
   */
  private static readonly SERVER_PRIORITY_FIELDS = [
    'scheduled_date',
    'scheduled_start_time',
    'scheduled_end_time',
    'client_id',
    'caregiver_id',
    'service_type_code',
    'authorization_id',
  ];

  /**
   * Main conflict resolution entry point
   */
  resolve<T extends Model>(
    clientRecord: T,
    serverRecord: T,
    recordType: string
  ): ConflictResolution {
    // Extract timestamps for last-write-wins logic
    const clientUpdatedAt = (clientRecord as any).updatedAt as Date;
    const serverUpdatedAt = (serverRecord as any).updatedAt as Date;

    // Simple case: One record is clearly newer
    if (clientUpdatedAt > serverUpdatedAt) {
      return {
        strategy: 'client-wins',
        resolvedRecord: clientRecord,
        requiresManualReview: false,
      };
    }

    if (serverUpdatedAt > clientUpdatedAt) {
      return {
        strategy: 'server-wins',
        resolvedRecord: serverRecord,
        requiresManualReview: false,
      };
    }

    // Same timestamp - use record-type-specific resolution
    switch (recordType) {
      case 'visit':
      case 'visits':
        return this.resolveVisitConflict(clientRecord, serverRecord);
      case 'task':
      case 'tasks':
        return this.resolveTaskConflict(clientRecord, serverRecord);
      case 'evv_record':
      case 'evv_records':
        return this.resolveEVVConflict(clientRecord, serverRecord);
      case 'visit_note':
      case 'visit_notes':
        return this.resolveVisitNoteConflict(clientRecord, serverRecord);
      default:
        // Conservative default: server wins for safety, but flag for review
        return {
          strategy: 'server-wins',
          resolvedRecord: serverRecord,
          requiresManualReview: true,
        };
    }
  }

  /**
   * Resolve visit conflicts with field-level analysis
   */
  private resolveVisitConflict(client: any, server: any): ConflictResolution {
    const fieldConflicts: FieldConflict[] = [];
    const resolvedRecord: any = { ...server }; // Start with server as base

    // Check for critical field conflicts (only if values DIFFER)
    const hasCriticalConflict = ConflictResolver.CRITICAL_FIELDS.some((field) => {
      if (
        client[field] !== undefined &&
        server[field] !== undefined &&
        client[field] !== server[field] &&
        client[field] !== null &&
        server[field] !== null
      ) {
        fieldConflicts.push({
          field,
          clientValue: client[field],
          serverValue: server[field],
        });
        return true;
      }
      return false;
    });

    // Critical conflicts require manual review
    if (hasCriticalConflict) {
      return {
        strategy: 'manual',
        resolvedRecord: server, // Temporary: use server until resolved
        fieldConflicts,
        requiresManualReview: true,
      };
    }

    // Merge all fields intelligently based on priority
    const allFields = new Set([
      ...Object.keys(client),
      ...Object.keys(server),
      ...ConflictResolver.CLIENT_PRIORITY_FIELDS,
      ...ConflictResolver.SERVER_PRIORITY_FIELDS,
      ...ConflictResolver.CRITICAL_FIELDS,
    ]);

    for (const field of allFields) {
      const clientValue = client[field];
      const serverValue = server[field];
      const hasClientValue = clientValue !== undefined && clientValue !== null;
      const hasServerValue = serverValue !== undefined && serverValue !== null;

      // Skip ID fields
      if (field === 'id' || field === 'updatedAt') {
        continue;
      }

      // Client priority fields: client wins if it has a value
      if (ConflictResolver.CLIENT_PRIORITY_FIELDS.includes(field)) {
        resolvedRecord[field] = hasClientValue ? clientValue : serverValue;
        continue;
      }

      // Server priority fields: server wins if it has a value
      if (ConflictResolver.SERVER_PRIORITY_FIELDS.includes(field)) {
        resolvedRecord[field] = hasServerValue ? serverValue : clientValue;
        continue;
      }

      // Critical fields: prefer non-null value (already checked for conflicts above)
      if (ConflictResolver.CRITICAL_FIELDS.includes(field)) {
        resolvedRecord[field] = hasClientValue ? clientValue : serverValue;
        continue;
      }

      // Default: server wins
      resolvedRecord[field] = hasServerValue ? serverValue : clientValue;
    }

    return {
      strategy: 'merge',
      resolvedRecord,
      fieldConflicts: fieldConflicts.length > 0 ? fieldConflicts : undefined,
      requiresManualReview: false,
    };
  }

  /**
   * Resolve task conflicts - client completion takes precedence
   */
  private resolveTaskConflict(client: any, server: any): ConflictResolution {
    // If client marked complete, always prefer client
    // (caregiver completed task in the field - trust their work)
    if (client.status === 'completed' && server.status !== 'completed') {
      return {
        strategy: 'client-wins',
        resolvedRecord: client,
        requiresManualReview: false,
      };
    }

    // If server marked complete but client didn't, investigate
    if (server.status === 'completed' && client.status !== 'completed') {
      return {
        strategy: 'manual',
        resolvedRecord: server,
        fieldConflicts: [
          {
            field: 'status',
            clientValue: client.status,
            serverValue: server.status,
          },
        ],
        requiresManualReview: true,
      };
    }

    // Otherwise server wins
    return {
      strategy: 'server-wins',
      resolvedRecord: server,
      requiresManualReview: false,
    };
  }

  /**
   * Resolve EVV record conflicts - extremely sensitive for compliance
   */
  private resolveEVVConflict(client: any, server: any): ConflictResolution {
    const fieldConflicts: FieldConflict[] = [];

    // EVV records are immutable once created - any conflict is critical
    const criticalFields = [
      'clock_in_time',
      'clock_out_time',
      'clock_in_location',
      'clock_out_location',
      'service_date',
    ];

    for (const field of criticalFields) {
      if (client[field] && server[field] && client[field] !== server[field]) {
        fieldConflicts.push({
          field,
          clientValue: client[field],
          serverValue: server[field],
        });
      }
    }

    // Any EVV conflicts require manual review for audit compliance
    if (fieldConflicts.length > 0) {
      return {
        strategy: 'manual',
        resolvedRecord: server, // Preserve server until manual review
        fieldConflicts,
        requiresManualReview: true,
        resolution_metadata: {
          resolvedAt: new Date(),
          reason: 'EVV data conflict - regulatory compliance review required',
        },
      };
    }

    // No conflicts - use last-write-wins based on server timestamp
    return {
      strategy: 'server-wins',
      resolvedRecord: server,
      requiresManualReview: false,
    };
  }

  /**
   * Resolve visit note conflicts - merge content intelligently
   */
  private resolveVisitNoteConflict(client: any, server: any): ConflictResolution {
    // If client has more content, prefer client (caregiver added details)
    const clientContentLength = (client.note_text || '').length;
    const serverContentLength = (server.note_text || '').length;

    if (clientContentLength > serverContentLength) {
      return {
        strategy: 'client-wins',
        resolvedRecord: client,
        requiresManualReview: false,
      };
    }

    // Otherwise server wins
    return {
      strategy: 'server-wins',
      resolvedRecord: server,
      requiresManualReview: false,
    };
  }

  /**
   * Apply manual resolution decision
   */
  applyManualResolution(
    clientRecord: any,
    serverRecord: any,
    decision: ManualResolution
  ): ConflictResolution {
    let resolvedRecord: any;

    switch (decision.selectedStrategy) {
      case 'client':
        resolvedRecord = { ...clientRecord };
        break;
      case 'server':
        resolvedRecord = { ...serverRecord };
        break;
      case 'field-by-field':
        resolvedRecord = { ...serverRecord }; // Start with server
        if (decision.fieldResolutions) {
          Object.entries(decision.fieldResolutions).forEach(([field, resolution]) => {
            if (resolution === 'client') {
              resolvedRecord[field] = clientRecord[field];
            } else if (resolution === 'server') {
              resolvedRecord[field] = serverRecord[field];
            } else {
              // Custom value provided
              resolvedRecord[field] = resolution;
            }
          });
        }
        break;
    }

    return {
      strategy: 'manual',
      resolvedRecord,
      requiresManualReview: false,
      resolution_metadata: {
        resolvedAt: decision.timestamp,
        resolvedBy: decision.userId,
        reason: `Manual resolution: ${decision.selectedStrategy}`,
      },
    };
  }

  /**
   * Detect potential conflicts before they happen
   * (for optimistic UI updates)
   */
  detectPotentialConflicts(
    localRecord: any,
    serverRecord: any
  ): {
    hasConflict: boolean;
    conflictingFields: string[];
    severity: 'low' | 'medium' | 'high';
  } {
    const conflictingFields: string[] = [];

    // Compare all fields
    Object.keys(localRecord).forEach((field) => {
      if (
        localRecord[field] !== serverRecord[field] &&
        field !== 'id' &&
        field !== 'updated_at' &&
        field !== 'created_at'
      ) {
        conflictingFields.push(field);
      }
    });

    // Determine severity
    let severity: 'low' | 'medium' | 'high' = 'low';
    const hasCriticalConflict = conflictingFields.some((field) =>
      ConflictResolver.CRITICAL_FIELDS.includes(field)
    );

    if (hasCriticalConflict) {
      severity = 'high';
    } else if (conflictingFields.length > 3) {
      severity = 'medium';
    }

    return {
      hasConflict: conflictingFields.length > 0,
      conflictingFields,
      severity,
    };
  }
}
