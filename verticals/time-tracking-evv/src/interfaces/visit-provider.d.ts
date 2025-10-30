import { UUID } from '@care-commons/core';
export interface EVVVisitData {
    visitId: UUID;
    organizationId: UUID;
    branchId: UUID;
    clientId: UUID;
    caregiverId?: UUID;
    clientName: string;
    clientMedicaidId?: string;
    serviceTypeId: UUID;
    serviceTypeCode: string;
    serviceTypeName: string;
    serviceDate: Date;
    scheduledStartTime: string;
    scheduledEndTime: string;
    scheduledDuration: number;
    serviceAddress: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        latitude: number;
        longitude: number;
        geofenceRadius?: number;
        addressVerified: boolean;
    };
    authorizationId?: UUID;
    authorizedUnits?: number;
    authorizedStartDate?: Date;
    authorizedEndDate?: Date;
    fundingSource?: string;
    requiredSkills?: string[];
    requiredCertifications?: string[];
    carePlanId?: UUID;
    taskIds?: UUID[];
}
export interface IVisitProvider {
    getVisitForEVV(visitId: UUID): Promise<EVVVisitData>;
    canClockIn(visitId: UUID, caregiverId: UUID): Promise<boolean>;
    canClockOut(visitId: UUID, caregiverId: UUID): Promise<boolean>;
    updateVisitStatus(visitId: UUID, status: 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'INCOMPLETE', evvRecordId: UUID): Promise<void>;
}
export interface IClientProvider {
    getClientForEVV(clientId: UUID): Promise<{
        id: UUID;
        name: string;
        medicaidId?: string;
        dateOfBirth: Date;
        stateCode: string;
        stateMedicaidProgram?: string;
        primaryPhone?: string;
        email?: string;
    }>;
}
export interface ICaregiverProvider {
    getCaregiverForEVV(caregiverId: UUID): Promise<{
        id: UUID;
        name: string;
        employeeId: string;
        nationalProviderId?: string;
        activeCredentials: string[];
        activeCertifications: string[];
        backgroundScreeningStatus: 'CLEARED' | 'PENDING' | 'EXPIRED' | 'FAILED';
        backgroundScreeningExpires?: Date;
        stateRegistryStatus?: Record<string, 'CLEARED' | 'FLAGGED' | 'UNKNOWN'>;
    }>;
    canProvideService(caregiverId: UUID, serviceTypeCode: string, clientId: UUID): Promise<{
        authorized: boolean;
        reason?: string;
        missingCredentials?: string[];
        blockedReasons?: string[];
    }>;
}
//# sourceMappingURL=visit-provider.d.ts.map