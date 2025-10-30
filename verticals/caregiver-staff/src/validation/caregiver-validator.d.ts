import { CreateCaregiverInput, UpdateCaregiverInput } from '../types/caregiver';
export declare class CaregiverValidator {
    validateCreate(input: CreateCaregiverInput): ValidationResult;
    validateUpdate(input: UpdateCaregiverInput): ValidationResult;
    validateEmail(email: string): boolean;
    validatePhone(phone: string): boolean;
    validateDateOfBirth(dateOfBirth: Date): {
        valid: boolean;
        message?: string;
    };
    validateHireDate(hireDate: Date): {
        valid: boolean;
        message?: string;
    };
}
interface ValidationResult {
    success: boolean;
    errors?: Array<{
        field: string;
        message: string;
    }>;
}
export {};
//# sourceMappingURL=caregiver-validator.d.ts.map