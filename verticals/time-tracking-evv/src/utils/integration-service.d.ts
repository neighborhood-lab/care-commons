import { UUID, Database } from '@care-commons/core';
export interface VisitData {
    visitId: UUID;
    organizationId: UUID;
    branchId: UUID;
    clientId: UUID;
    clientName: string;
    clientMedicaidId?: string;
    caregiverId?: UUID;
    serviceTypeCode: string;
    serviceTypeName: string;
    serviceDate: Date;
    scheduledStartTime: Date;
    scheduledEndTime: Date;
    scheduledDuration: number;
    serviceAddress: ServiceAddress;
}
export interface ServiceAddress {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
    geofenceRadius: number;
    addressVerified: boolean;
    addressId?: UUID;
}
export interface CaregiverData {
    caregiverId: UUID;
    caregiverName: string;
    employeeNumber: string;
    npi?: string;
}
export declare class IntegrationService {
    private database;
    constructor(database: Database);
    getVisitData(visitId: UUID): Promise<VisitData>;
    getCaregiverData(caregiverId: UUID): Promise<CaregiverData>;
    updateVisitStatus(visitId: UUID, status: string, updatedBy: UUID): Promise<void>;
    updateVisitTiming(visitId: UUID, actualStartTime?: Date, actualEndTime?: Date, actualDuration?: number, updatedBy?: UUID): Promise<void>;
    private combineDateTime;
    private generateAddressId;
    private simpleHash;
}
//# sourceMappingURL=integration-service.d.ts.map