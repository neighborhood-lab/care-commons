import { StateSpecificClientData, TexasClientData, FloridaClientData } from '../types/client';
export declare class StateSpecificClientValidator {
    validateStateSpecific(data: StateSpecificClientData): ValidationResult;
    validateTexasClient(data: TexasClientData): ValidationResult;
    validateFloridaClient(data: FloridaClientData): ValidationResult;
    validateEVVEligibility(stateData: StateSpecificClientData, serviceCode: string): {
        eligible: boolean;
        reasons: string[];
    };
    calculateComplianceStatus(stateData: StateSpecificClientData): {
        compliant: boolean;
        issues: Array<{
            severity: 'ERROR' | 'WARNING';
            message: string;
        }>;
    };
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