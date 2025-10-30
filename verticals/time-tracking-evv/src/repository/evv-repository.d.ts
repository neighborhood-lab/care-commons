import { Database, UUID, PaginationParams, PaginatedResult } from '@care-commons/core';
import { EVVRecord, TimeEntry, Geofence, EVVRecordSearchFilters } from '../types/evv';
export declare class EVVRepository {
    private database;
    constructor(database: Database);
    createEVVRecord(record: Omit<EVVRecord, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<EVVRecord>;
    getEVVRecordById(id: UUID): Promise<EVVRecord | null>;
    getEVVRecordByVisitId(visitId: UUID): Promise<EVVRecord | null>;
    updateEVVRecord(id: UUID, updates: Partial<EVVRecord>, updatedBy: UUID): Promise<EVVRecord>;
    searchEVVRecords(filters: EVVRecordSearchFilters, pagination: PaginationParams): Promise<PaginatedResult<EVVRecord>>;
    createTimeEntry(entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<TimeEntry>;
    getTimeEntriesByVisitId(visitId: UUID): Promise<TimeEntry[]>;
    getPendingTimeEntries(organizationId: UUID, limit?: number): Promise<TimeEntry[]>;
    getTimeEntryById(id: UUID): Promise<TimeEntry | null>;
    updateTimeEntry(id: UUID, updates: Partial<TimeEntry>, updatedBy: UUID): Promise<TimeEntry>;
    updateTimeEntryStatus(id: UUID, status: string, verificationPassed: boolean, issues?: string[], updatedBy?: UUID): Promise<TimeEntry>;
    createGeofence(geofence: Omit<Geofence, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Geofence>;
    getGeofenceByAddress(addressId: UUID): Promise<Geofence | null>;
    updateGeofenceStats(id: UUID, successful: boolean, accuracy: number): Promise<void>;
    private mapEVVRecord;
    private mapTimeEntry;
    private mapGeofence;
    private camelToSnake;
}
//# sourceMappingURL=evv-repository.d.ts.map