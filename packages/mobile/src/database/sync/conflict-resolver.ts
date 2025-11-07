import type { Model } from '@nozbe/watermelondb';

export interface ConflictResolution {
  strategy: 'client-wins' | 'server-wins' | 'merge' | 'manual';
  resolvedRecord: any;
}

export class ConflictResolver {
  resolve<T extends Model>(
    clientRecord: T,
    serverRecord: T,
    recordType: string
  ): ConflictResolution {
    // Default strategy: last-write-wins (check updated_at)
    const clientUpdatedAt = (clientRecord as any).updatedAt as Date;
    const serverUpdatedAt = (serverRecord as any).updatedAt as Date;

    if (clientUpdatedAt > serverUpdatedAt) {
      return {
        strategy: 'client-wins',
        resolvedRecord: clientRecord
      };
    }

    if (serverUpdatedAt > clientUpdatedAt) {
      return {
        strategy: 'server-wins',
        resolvedRecord: serverRecord
      };
    }

    // Same timestamp - use smart merge for specific record types
    switch (recordType) {
      case 'visit':
        return this.resolveVisitConflict(clientRecord, serverRecord);
      case 'task':
        return this.resolveTaskConflict(clientRecord, serverRecord);
      default:
        // Default to server-wins for safety
        return {
          strategy: 'server-wins',
          resolvedRecord: serverRecord
        };
    }
  }

  private resolveVisitConflict(client: any, server: any): ConflictResolution {
    // For visits, merge non-conflicting fields
    // Server wins for core fields (scheduled_date, client, caregiver)
    // Client wins for documentation (notes, tasks_completed)
    return {
      strategy: 'merge',
      resolvedRecord: {
        ...server,
        care_notes: client.care_notes || server.care_notes,
        tasks_completed: client.tasks_completed || server.tasks_completed,
        check_in_time: client.check_in_time || server.check_in_time,
        check_out_time: client.check_out_time || server.check_out_time
      }
    };
  }

  private resolveTaskConflict(client: any, server: any): ConflictResolution {
    // For tasks, if client marked complete, client wins
    if (client.status === 'completed' && server.status !== 'completed') {
      return {
        strategy: 'client-wins',
        resolvedRecord: client
      };
    }

    return {
      strategy: 'server-wins',
      resolvedRecord: server
    };
  }
}
