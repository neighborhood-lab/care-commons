import { CreateClientInput, UpdateClientInput } from '../types/client';
export declare class ClientValidator {
    validateCreate(input: CreateClientInput): ValidationResult;
    validateUpdate(input: UpdateClientInput): ValidationResult;
    validateSSN(ssn: string): boolean;
    validateEmail(email: string): boolean;
    validateMinimumAge(dateOfBirth: Date, minimumAge?: number): boolean;
    calculateAge(dateOfBirth: Date): number;
}
interface ValidationResult {
    success: boolean;
    errors?: Array<{
        path: string;
        message: string;
    }>;
}
export {};
//# sourceMappingURL=client-validator.d.ts.map