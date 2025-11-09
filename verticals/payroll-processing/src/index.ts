/**
 * Payroll Processing vertical - Main exports
 * 
 * Transforms time tracking data into accurate compensation for caregivers.
 */

// Types
export * from './types/payroll';

// Repository
export { PayrollRepository } from './repository/payroll-repository';

// Service
export { PayrollService } from './service/payroll-service';
export type {
  CreatePayPeriodInput,
  CompileTimeSheetInput,
  CreatePayRunInput,
  ApproveTimeSheetInput,
} from './service/payroll-service';
export { PayStubGeneratorService } from './service/pay-stub-generator.service';
export type { PayStubPDFData } from './service/pay-stub-generator.service';

// Utilities
export * from './utils/pay-calculations';
export * from './utils/tax-calculations';
export * from './utils/deduction-calculations';
