import { CreateBillableItemInput, CreateInvoiceInput, CreatePaymentInput, AllocatePaymentInput, CreateRateScheduleInput, CreatePayerInput, CreateAuthorizationInput, SubmitClaimInput, PayerType, UnitType, BillableStatus, InvoiceStatus, PaymentStatus, AuthorizationStatus } from '../types/billing';
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings?: string[];
}
export declare function validateCreateBillableItem(input: CreateBillableItemInput): ValidationResult;
export declare function validateCreateInvoice(input: CreateInvoiceInput): ValidationResult;
export declare function validateCreatePayment(input: CreatePaymentInput): ValidationResult;
export declare function validateAllocatePayment(input: AllocatePaymentInput, currentUnapplied: number): ValidationResult;
export declare function validateCreateRateSchedule(input: CreateRateScheduleInput): ValidationResult;
export declare function validateCreatePayer(input: CreatePayerInput): ValidationResult;
export declare function validateCreateAuthorization(input: CreateAuthorizationInput): ValidationResult;
export declare function validateSubmitClaim(input: SubmitClaimInput): ValidationResult;
export declare function validateBillableStatusTransition(currentStatus: BillableStatus, newStatus: BillableStatus): ValidationResult;
export declare function validateInvoiceStatusTransition(currentStatus: InvoiceStatus, newStatus: InvoiceStatus): ValidationResult;
export declare function validatePaymentStatusTransition(currentStatus: PaymentStatus, newStatus: PaymentStatus): ValidationResult;
export declare function validateAuthorizationStatusTransition(currentStatus: AuthorizationStatus, newStatus: AuthorizationStatus): ValidationResult;
export declare function isValidPayerType(payerType: string): payerType is PayerType;
export declare function isValidUnitType(unitType: string): unitType is UnitType;
//# sourceMappingURL=billing-validator.d.ts.map