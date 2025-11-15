/**
 * useSchedule Hook - Weekly schedule view with offline support
 * 
 * Provides React components with offline-first access to weekly visit schedules.
 * Integrates with WatermelonDB for local storage and syncs with the backend API.
 */

import { useEffect, useState, useCallback } from 'react';
import { database } from '../../../database/index';
import { getVisitsInDateRange } from '../../../database/queries/visitQueries';
import type { Visit } from '../../../database/models/index';
import type { MobileVisit } from '../../../shared/index';
import { getApiClient } from '../../../services/api-client';
import { startOfWeek, endOfWeek } from 'date-fns';

interface UseScheduleOptions {
  caregiverId: string;
  selectedDate: Date;
}

interface UseScheduleReturn {
  visits: MobileVisit[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSchedule({
  caregiverId,
  selectedDate,
}: UseScheduleOptions): UseScheduleReturn {
  const [visits, setVisits] = useState<MobileVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Refetch data (pull-to-refresh)
   */
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Fetch from API with timeout
    try {
      const apiClient = getApiClient();
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        const response = await apiClient.get<{ visits: any[] }>(
          `/api/visits/my-visits?start_date=${weekStart.toISOString()}&end_date=${weekEnd.toISOString()}`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        // Sync to local database
        await database.write(async () => {
          const visitsCollection = database.get<Visit>('visits');
          
          for (const apiVisit of response.data.visits) {
            try {
              // Try to find existing visit
              const existingVisit = await visitsCollection.find(apiVisit.id);
              await existingVisit.update((visit: any) => {
                visit.organizationId = apiVisit.organizationId;
                visit.branchId = apiVisit.branchId;
                visit.clientId = apiVisit.clientId;
                visit.caregiverId = apiVisit.caregiverId;
                visit.scheduledStartTime = new Date(apiVisit.scheduledStartTime);
                visit.scheduledEndTime = new Date(apiVisit.scheduledEndTime);
                visit.scheduledDuration = apiVisit.scheduledDuration;
                visit.clientName = apiVisit.clientName;
                visit.clientAddress = apiVisit.clientAddress;
                visit.serviceTypeCode = apiVisit.serviceTypeCode;
                visit.serviceTypeName = apiVisit.serviceTypeName;
                visit.status = apiVisit.status;
                visit.evvRecordId = apiVisit.evvRecordId;
                visit.isSynced = true;
                visit.syncPending = false;
              });
            } catch {
              // Create new visit if not found
              await visitsCollection.create((visit: any) => {
                visit._raw.id = apiVisit.id;
                visit.organizationId = apiVisit.organizationId;
                visit.branchId = apiVisit.branchId;
                visit.clientId = apiVisit.clientId;
                visit.caregiverId = apiVisit.caregiverId;
                visit.scheduledStartTime = new Date(apiVisit.scheduledStartTime);
                visit.scheduledEndTime = new Date(apiVisit.scheduledEndTime);
                visit.scheduledDuration = apiVisit.scheduledDuration;
                visit.clientName = apiVisit.clientName;
                visit.clientAddress = apiVisit.clientAddress;
                visit.serviceTypeCode = apiVisit.serviceTypeCode;
                visit.serviceTypeName = apiVisit.serviceTypeName;
                visit.status = apiVisit.status;
                visit.evvRecordId = apiVisit.evvRecordId;
                visit.isSynced = true;
                visit.syncPending = false;
                visit.lastModifiedAt = new Date();
                visit.serverVersion = 1;
              });
            }
          }
        });
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === 'AbortError') {
          console.warn('API request timeout, using cached data');
          setError(new Error('Connection timeout. Using cached data.'));
        } else {
          console.warn('Failed to fetch visits from API, using cached data:', err);
          setError(err instanceof Error ? err : new Error('Failed to sync. Using cached data.'));
        }
      }
    } catch (err) {
      console.warn('API client initialization error:', err);
      setError(err instanceof Error ? err : new Error('Unable to connect to server'));
    }
    
    // Load from database
    try {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });

      const query = getVisitsInDateRange(
        database,
        caregiverId,
        weekStart,
        weekEnd
      );

      const visitRecords = await query.fetch();
      const mappedVisits = visitRecords.map(mapVisitToMobileVisit);
      setVisits(mappedVisits);
    } catch (err) {
      // Only set error if we don't have one from API fetch
      if (!error) {
        setError(err instanceof Error ? err : new Error('Failed to load visits from local storage'));
      }
    } finally {
      setLoading(false);
    }
  }, [caregiverId, selectedDate, error]);

  /**
   * Initial load and subscription
   */
  useEffect(() => {
    let subscription: any;

    const initialize = async () => {
      // Load initial data
      await refetch();
      
      // Subscribe to database changes
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
      
      const query = getVisitsInDateRange(
        database,
        caregiverId,
        weekStart,
        weekEnd
      );

      subscription = query.observe().subscribe((visitRecords: Visit[]) => {
        const mappedVisits = visitRecords.map(mapVisitToMobileVisit);
        setVisits(mappedVisits);
        setLoading(false);
      });
    };

    void initialize();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [caregiverId, selectedDate, refetch]);

  return { visits, loading, error, refetch };
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
