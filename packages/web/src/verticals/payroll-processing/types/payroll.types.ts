export type PayPeriodStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'LOCKED'
  | 'PROCESSING'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PAID'
  | 'CLOSED'
  | 'CANCELLED';

export type PayRunStatus =
  | 'DRAFT'
  | 'CALCULATING'
  | 'CALCULATED'
  | 'PENDING_REVIEW'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'FUNDED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type PayStubStatus =
  | 'DRAFT'
  | 'CALCULATED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'VOID'
  | 'CANCELLED';

export type PaymentMethod =
  | 'DIRECT_DEPOSIT'
  | 'CHECK'
  | 'CASH'
  | 'PAYCARD'
  | 'WIRE';

export type PayPeriodType =
  | 'WEEKLY'
  | 'BI_WEEKLY'
  | 'SEMI_MONTHLY'
  | 'MONTHLY';

export interface PayPeriod {
  id: string;
  periodNumber: number;
  periodYear: number;
  periodType: PayPeriodType;
  startDate: string;
  endDate: string;
  payDate: string;
  status: PayPeriodStatus;
  cutoffDate?: string;
  approvalDeadline?: string;
  payRunId?: string;
  totalCaregivers?: number;
  totalHours?: number;
  totalGrossPay?: number;
  totalNetPay?: number;
  totalTaxWithheld?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayRun {
  id: string;
  payPeriodId: string;
  runNumber: string;
  runType: string;
  status: PayRunStatus;
  payPeriodStartDate: string;
  payPeriodEndDate: string;
  payDate: string;
  totalCaregivers: number;
  totalHours: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalTaxWithheld: number;
  totalNetPay: number;
  directDepositCount: number;
  directDepositAmount: number;
  checkCount: number;
  checkAmount: number;
  hasErrors: boolean;
  initiatedAt?: string;
  calculatedAt?: string;
  approvedAt?: string;
  processedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayStub {
  id: string;
  payRunId: string;
  payPeriodId: string;
  caregiverId: string;
  caregiverName: string;
  caregiverEmployeeId: string;
  stubNumber: string;
  payPeriodStartDate: string;
  payPeriodEndDate: string;
  payDate: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  regularPay: number;
  overtimePay: number;
  bonuses: number;
  reimbursements: number;
  currentGrossPay: number;
  yearToDateGrossPay: number;
  federalIncomeTax: number;
  stateIncomeTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  totalTaxWithheld: number;
  healthInsurance: number;
  retirement401k: number;
  otherDeductions: number;
  totalOtherDeductions: number;
  currentNetPay: number;
  yearToDateNetPay: number;
  paymentMethod: PaymentMethod;
  checkNumber?: string;
  status: PayStubStatus;
  calculatedAt: string;
  approvedAt?: string;
  deliveredAt?: string;
  pdfUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface PayrollSearchFilters {
  periodType?: PayPeriodType;
  status?: PayPeriodStatus;
  year?: number;
  startDate?: string;
  endDate?: string;
}

export interface PayRunSearchFilters {
  payPeriodId?: string;
  status?: PayRunStatus;
  startDate?: string;
  endDate?: string;
}

export interface PayStubSearchFilters {
  payRunId?: string;
  payPeriodId?: string;
  caregiverId?: string;
  status?: PayStubStatus;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
}

export interface PayPeriodListResponse {
  items: PayPeriod[];
  total: number;
  hasMore: boolean;
}

export interface PayRunListResponse {
  items: PayRun[];
  total: number;
  hasMore: boolean;
}

export interface PayStubListResponse {
  items: PayStub[];
  total: number;
  hasMore: boolean;
}

export interface PayrollSummary {
  currentPeriod?: PayPeriod;
  upcomingPayDate?: string;
  totalEmployees: number;
  pendingApprovals: number;
  recentPayRuns: {
    total: number;
    completed: number;
    failed: number;
  };
  ytdTotals: {
    grossPay: number;
    netPay: number;
    taxWithheld: number;
  };
}

export interface CreatePayRunInput {
  payPeriodId: string;
  caregiverIds?: string[];
  notes?: string;
}

export interface ApprovePayRunInput {
  notes?: string;
}
