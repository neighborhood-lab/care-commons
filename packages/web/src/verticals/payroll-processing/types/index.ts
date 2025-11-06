export * from './payroll.types';

// Aliases for provider compatibility
export type { PayPeriod as PayrollPeriod } from './payroll.types';

// Missing input types - define based on API expectations
export interface CreatePayrollPeriodInput {
  periodType: 'WEEKLY' | 'BI_WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY';
  startDate: string;
  endDate: string;
  payDate: string;
  notes?: string;
}

export interface ProcessPayrollInput {
  payPeriodId: string;
  caregiverIds?: string[];
  notes?: string;
}
