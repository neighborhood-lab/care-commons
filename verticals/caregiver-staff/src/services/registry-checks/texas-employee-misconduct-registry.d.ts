import { UUID } from '@care-commons/core';
import { RegistryCheck } from '../../types/caregiver';
export interface EmployeeMisconductRegistryCheckInput {
    caregiverId: UUID;
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date;
    ssn?: string;
    performedBy: UUID;
}
export interface EmployeeMisconductRegistryCheckResult {
    check: RegistryCheck;
    listed: boolean;
    eligibleForHire: boolean;
    recommendedAction: 'APPROVE' | 'REJECT' | 'REVIEW';
    notes?: string;
}
export declare class TexasEmployeeMisconductRegistryService {
    performRegistryCheck(input: EmployeeMisconductRegistryCheckInput): Promise<EmployeeMisconductRegistryCheckResult>;
    verifyExistingCheck(check: RegistryCheck): Promise<{
        valid: boolean;
        reason?: string;
        requiresRecheck: boolean;
    }>;
    private calculateExpirationDate;
    private validateInput;
    private calculateAge;
    getStatusMessage(check: RegistryCheck): string;
    canAssignToClient(check: RegistryCheck | undefined): {
        allowed: boolean;
        reason?: string;
    };
}
export declare const texasEmployeeMisconductRegistryService: TexasEmployeeMisconductRegistryService;
//# sourceMappingURL=texas-employee-misconduct-registry.d.ts.map