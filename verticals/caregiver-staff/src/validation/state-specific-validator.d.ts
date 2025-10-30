import { StateSpecificCaregiverData, TexasCaregiverData, FloridaCaregiverData, CaregiverRole } from '../types/caregiver';
export declare class StateSpecificCaregiverValidator {
    validateStateSpecific(data: StateSpecificCaregiverData): ValidationResult;
    validateTexasCaregiver(data: TexasCaregiverData, role: CaregiverRole): ValidationResult;
    validateFloridaCaregiver(data: FloridaCaregiverData, role: CaregiverRole): ValidationResult;
    validateCredentialCompliance(stateData: StateSpecificCaregiverData, role: CaregiverRole): {
        compliant: boolean;
        eligibleForAssignment: boolean;
        issues: Array<{
            severity: 'CRITICAL' | 'ERROR' | 'WARNING';
            message: string;
        }>;
    };
    private isDirectCareRole;
    private requiresFloridaLicense;
}
interface ValidationResult {
    success: boolean;
    errors?: Array<{
        path: string;
        message: string;
    }>;
}
export {};
//# sourceMappingURL=state-specific-validator.d.ts.map