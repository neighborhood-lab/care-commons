import { UUID } from '@care-commons/core';
import { RegistryCheck } from '../../types/caregiver';
export interface NurseAideRegistryCheckInput {
    caregiverId: UUID;
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date;
    certificationNumber?: string;
    performedBy: UUID;
}
export interface NurseAideRegistryCheckResult {
    check: RegistryCheck;
    found: boolean;
    certified: boolean;
    certificationStatus?: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';
    certificationNumber?: string;
    certificationDate?: Date;
    expirationDate?: Date;
    hasFindings: boolean;
    eligibleForEmployment: boolean;
    recommendedAction: 'APPROVE' | 'REJECT' | 'REVIEW';
    notes?: string;
}
export declare class TexasNurseAideRegistryService {
    performRegistryCheck(input: NurseAideRegistryCheckInput): Promise<NurseAideRegistryCheckResult>;
    verifyCertification(certificationNumber: string): Promise<{
        valid: boolean;
        status?: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';
        expirationDate?: Date;
        findings?: boolean;
        reason?: string;
    }>;
    verifyExistingCheck(check: RegistryCheck): Promise<{
        valid: boolean;
        reason?: string;
        requiresRecheck: boolean;
    }>;
    canPerformCNATasks(check: RegistryCheck | undefined): {
        allowed: boolean;
        reason?: string;
        restrictions?: string[];
    };
    private calculateExpirationDate;
    private validateInput;
    private calculateAge;
    getStatusMessage(check: RegistryCheck): string;
    private determineRecommendedAction;
    private buildDetailedNotes;
}
export declare const texasNurseAideRegistryService: TexasNurseAideRegistryService;
//# sourceMappingURL=texas-nurse-aide-registry.d.ts.map