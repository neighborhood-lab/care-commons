/**
 * useVisit Hook - Offline-first visit data management
 * 
 * This hook provides React components with offline-first access to visit data.
 * It uses WatermelonDB for local storage with automatic sync to server.
 */

import { useEffect, useState } from 'react';
import { database } from '../../../database/index';
import type { Visit } from '../../../database/models/index';
import type { MobileVisit } from '../../../shared/index';

export function useVisit(visitId: string) {
  const [visit, setVisit] = useState<MobileVisit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let subscription: any;

    const loadVisit = async () => {
      try {
        const visitCollection = database.get<Visit>('visits');
        const visitRecord = await visitCollection.find(visitId);
        
        // Subscribe to changes
        subscription = visitRecord.observe().subscribe((updatedVisit: Visit) => {
          setVisit(mapVisitToMobileVisit(updatedVisit));
          setLoading(false);
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load visit'));
        setLoading(false);
      }
    };

    void loadVisit();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [visitId]);

  return { visit, loading, error };
}

/**
 * Map WatermelonDB Visit model to MobileVisit interface
 */
function mapVisitToMobileVisit(visit: Visit): MobileVisit {
  return {
    id: visit.id,
    organizationId: visit.organizationId,
    branchId: visit.branchId,
    clientId: visit.clientId,
    caregiverId: visit.caregiverId,
    scheduledStartTime: visit.scheduledStartTime,
    scheduledEndTime: visit.scheduledEndTime,
    scheduledDuration: visit.scheduledDuration,
    clientName: visit.clientName,
    clientAddress: visit.clientAddress,
    serviceTypeCode: visit.serviceTypeCode,
    serviceTypeName: visit.serviceTypeName,
    status: visit.status,
    evvRecordId: visit.evvRecordId,
    isSynced: visit.isSynced,
    lastModifiedAt: visit.lastModifiedAt,
    syncPending: visit.syncPending,
  };
}
