/**
 * Payroll Processing domain model
 *
 * Transforms time tracking and visit data into accurate compensation,
 * manages pay periods, deductions, tax withholdings, and payment distribution.
 *
 * Key concepts:
 * - Pay Period: Time span for calculating wages (weekly, bi-weekly, etc.)
 * - Pay Run: Execution of payroll for a specific pay period
 * - Pay Stub: Individual caregiver's earnings statement
 * - Time Sheet: Aggregated time entries for payroll calculation
 * - Deduction: Withholdings (taxes, benefits, garnishments)
 * - Adjustment: Bonuses, corrections, reimbursements
 * - Payment: Actual disbursement to caregiver
 */

import { Entity, SoftDeletable, UUID, Timestamp } from '@care-commons/core';

/**
 * Pay Period - Time span for payroll cycle
 *
 * Defines the boundaries for accumulating work hours and calculating pay.
 */
export interface PayPeriod extends Entity {
  organizationId: UUID;
  branchId?: UUID;

  // Period identity
  periodNumber: number; // Sequential number (e.g., 1, 2, 3...)
  periodYear: number;
  periodType: PayPeriodType;

  // Date range
  startDate: Date;
  endDate: Date;

  // Pay date
  payDate: Date; // When caregivers receive payment

  // Processing
  status: PayPeriodStatus;
  statusHistory: PayPeriodStatusChange[];

  // Lock-down dates
  cutoffDate?: Date; // Last date to submit timesheets
  approvalDeadline?: Date; // Deadline for approvals

  // Pay run reference
  payRunId?: UUID;

  // Statistics
  totalCaregivers?: number;
  totalHours?: number;
  totalGrossPay?: number;
  totalNetPay?: number;
  totalTaxWithheld?: number;
  totalDeductions?: number;

  // Metadata
  notes?: string;
  fiscalQuarter?: number; // 1-4
  fiscalYear?: number;
}

export type PayPeriodType =
  | 'WEEKLY' // Every week
  | 'BI_WEEKLY' // Every 2 weeks
  | 'SEMI_MONTHLY' // Twice per month (1st-15th, 16th-end)
  | 'MONTHLY' // Once per month
  | 'DAILY' // Daily pay (rare, but needed for some)
  | 'CUSTOM'; // Custom period

export type PayPeriodStatus =
  | 'DRAFT' // Period created, not yet active
  | 'OPEN' // Active, accepting timesheets
  | 'LOCKED' // No more timesheet changes
  | 'PROCESSING' // Payroll being calculated
  | 'PENDING_APPROVAL' // Awaiting approval
  | 'APPROVED' // Approved, ready for payment
  | 'PAID' // Payments issued
  | 'CLOSED' // Period closed
  | 'CANCELLED'; // Cancelled

export interface PayPeriodStatusChange {
  id: UUID;
  fromStatus: PayPeriodStatus | null;
  toStatus: PayPeriodStatus;
  timestamp: Timestamp;
  changedBy: UUID;
  reason?: string;
  notes?: string;
}

/**
 * Time Sheet - Aggregated time entries for payroll
 *
 * Consolidates EVV records and time entries into a single
 * sheet for pay calculation.
 */
export interface TimeSheet extends Entity, SoftDeletable {
  organizationId: UUID;
  branchId: UUID;

  // Period and caregiver
  payPeriodId: UUID;
  caregiverId: UUID;
  caregiverName: string;
  caregiverEmployeeId: string;

  // Time entries
  timeEntries: TimeSheetEntry[];

  // Hours summary
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  ptoHours: number;
  holidayHours: number;
  sickHours: number;
  otherHours: number;
  totalHours: number;

  // Rates and earnings
  regularRate: number; // Base hourly rate
  overtimeRate: number; // OT rate (usually 1.5x)
  doubleTimeRate: number; // DT rate (usually 2x)

  regularEarnings: number;
  overtimeEarnings: number;
  doubleTimeEarnings: number;
  ptoEarnings: number;
  holidayEarnings: number;
  sickEarnings: number;
  otherEarnings: number;
  grossEarnings: number;

  // Additional payments
  bonuses: TimeSheetAdjustment[];
  reimbursements: TimeSheetAdjustment[];
  adjustments: TimeSheetAdjustment[];
  totalAdjustments: number;

  // Final gross
  totalGrossPay: number;

  // Status
  status: TimeSheetStatus;
  statusHistory: TimeSheetStatusChange[];

  // Approval
  submittedAt?: Timestamp;
  submittedBy?: UUID;
  approvedAt?: Timestamp;
  approvedBy?: UUID;
  approvalNotes?: string;

  // Validation
  hasDiscrepancies: boolean;
  discrepancyFlags?: DiscrepancyFlag[];

  // Links
  evvRecordIds: UUID[]; // Source EVV records
  visitIds: UUID[]; // Source visits

  // Metadata
  notes?: string;
  reviewNotes?: string;
}

export type TimeSheetStatus =
  | 'DRAFT' // Being compiled
  | 'SUBMITTED' // Submitted by caregiver/supervisor
  | 'PENDING_REVIEW' // Awaiting review
  | 'APPROVED' // Approved for payroll
  | 'REJECTED' // Rejected, needs correction
  | 'PROCESSING' // Being processed in payroll
  | 'PAID' // Paid out
  | 'VOIDED'; // Voided

export interface TimeSheetStatusChange {
  id: UUID;
  fromStatus: TimeSheetStatus | null;
  toStatus: TimeSheetStatus;
  timestamp: Timestamp;
  changedBy: UUID;
  reason?: string;
  notes?: string;
}

export interface TimeSheetEntry {
  id: UUID;

  // Visit reference
  visitId: UUID;
  evvRecordId: UUID;
  clientId: UUID;
  clientName: string;

  // Date and time
  workDate: Date;
  clockInTime: Timestamp;
  clockOutTime: Timestamp;

  // Hours breakdown
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  breakHours: number; // Unpaid breaks
  totalHours: number;

  // Pay rates for this entry
  payRate: number; // Applicable rate
  payRateType: PayRateType;

  // Modifiers
  isWeekend: boolean;
  isHoliday: boolean;
  isNightShift: boolean;
  isLiveIn: boolean;

  // Rate multipliers applied
  appliedMultipliers: PayRateMultiplier[];

  // Earnings for this entry
  earnings: number;

  // Service type
  serviceType?: string;
  serviceCode?: string;

  // Flags
  isBillable: boolean;
  billableItemId?: UUID;
  requiresReview: boolean;
  reviewReason?: string;
}

export type PayRateType =
  | 'REGULAR' // Standard hourly rate
  | 'OVERTIME' // Overtime rate
  | 'DOUBLE_TIME' // Double time rate
  | 'WEEKEND' // Weekend rate
  | 'HOLIDAY' // Holiday rate
  | 'NIGHT_SHIFT' // Night shift differential
  | 'LIVE_IN' // Live-in rate
  | 'ON_CALL' // On-call rate
  | 'TRAINING' // Training rate
  | 'SPECIALIZED'; // Specialized care rate

export interface PayRateMultiplier {
  multiplierType: string; // e.g., 'WEEKEND', 'HOLIDAY', 'OVERTIME'
  multiplier: number; // e.g., 1.5 for overtime
  baseRate: number;
  appliedAmount: number;
}

export interface TimeSheetAdjustment {
  id: UUID;
  adjustmentType: AdjustmentType;
  amount: number; // Positive or negative
  description: string;
  reason: string;
  addedBy: UUID;
  addedAt: Timestamp;
  approvedBy?: UUID;
  approvedAt?: Timestamp;
  notes?: string;
  referenceId?: UUID; // Reference to related record
}

export type AdjustmentType =
  | 'BONUS' // Bonus payment
  | 'COMMISSION' // Commission
  | 'REIMBURSEMENT' // Expense reimbursement
  | 'MILEAGE' // Mileage reimbursement
  | 'CORRECTION' // Payroll correction
  | 'RETROACTIVE' // Retroactive pay adjustment
  | 'RETENTION' // Retention bonus
  | 'REFERRAL' // Referral bonus
  | 'HOLIDAY_BONUS' // Holiday bonus
  | 'SHIFT_DIFFERENTIAL' // Additional shift pay
  | 'HAZARD_PAY' // Hazard pay
  | 'OTHER';

export interface DiscrepancyFlag {
  flagType: DiscrepancyType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedEntryIds?: UUID[];
  requiresResolution: boolean;
  resolution?: string;
  resolvedAt?: Timestamp;
  resolvedBy?: UUID;
}

export type DiscrepancyType =
  | 'MISSING_CLOCK_OUT' // No clock-out recorded
  | 'EXCESSIVE_HOURS' // Hours exceed threshold
  | 'OVERLAPPING_SHIFTS' // Overlapping time entries
  | 'RATE_MISMATCH' // Rate doesn't match expected
  | 'UNAPPROVED_OVERTIME' // Overtime not pre-approved
  | 'MISSING_EVV' // No EVV record for time
  | 'LOCATION_VIOLATION' // Location compliance issue
  | 'DATE_MISMATCH' // Date inconsistency
  | 'DUPLICATE_ENTRY' // Possible duplicate
  | 'CALCULATION_ERROR' // Math doesn't add up
  | 'OTHER';

/**
 * Pay Run - Execution of payroll for a pay period
 *
 * Orchestrates the calculation, approval, and payment
 * generation for an entire pay period.
 */
export interface PayRun extends Entity {
  organizationId: UUID;
  branchId?: UUID;

  // Period
  payPeriodId: UUID;
  payPeriodStartDate: Date;
  payPeriodEndDate: Date;
  payDate: Date;

  // Run identity
  runNumber: string; // Human-readable (e.g., "2025-05")
  runType: PayRunType;

  // Status
  status: PayRunStatus;
  statusHistory: PayRunStatusChange[];

  // Processing
  initiatedAt?: Timestamp;
  initiatedBy?: UUID;
  calculatedAt?: Timestamp;
  approvedAt?: Timestamp;
  approvedBy?: UUID;
  processedAt?: Timestamp;
  processedBy?: UUID;

  // Pay stubs
  payStubIds: UUID[];
  totalPayStubs: number;

  // Aggregates
  totalCaregivers: number;
  totalHours: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalTaxWithheld: number;
  totalNetPay: number;

  // Tax totals
  federalIncomeTax: number;
  stateIncomeTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  localTax: number;

  // Other deductions
  benefitsDeductions: number;
  garnishments: number;
  otherDeductions: number;

  // Payment summary
  directDepositCount: number;
  directDepositAmount: number;
  checkCount: number;
  checkAmount: number;
  cashCount: number;
  cashAmount: number;

  // Files
  payrollRegisterUrl?: string;
  taxReportUrl?: string;
  exportFiles?: ExportFile[];

  // Compliance
  complianceChecks?: ComplianceCheck[];
  compliancePassed: boolean;

  // Errors and issues
  hasErrors: boolean;
  errors?: PayRunError[];
  warnings?: PayRunWarning[];

  // Metadata
  notes?: string;
  internalNotes?: string;
}

export type PayRunType =
  | 'REGULAR' // Regular scheduled payroll
  | 'OFF_CYCLE' // Unscheduled/special payroll
  | 'CORRECTION' // Correction run
  | 'BONUS' // Bonus-only run
  | 'FINAL' // Final pay for terminated employee
  | 'ADVANCE' // Pay advance
  | 'RETRO'; // Retroactive pay

export type PayRunStatus =
  | 'DRAFT' // Being set up
  | 'CALCULATING' // Calculations in progress
  | 'CALCULATED' // Calculations complete
  | 'PENDING_REVIEW' // Awaiting review
  | 'PENDING_APPROVAL' // Awaiting approval
  | 'APPROVED' // Approved for processing
  | 'PROCESSING' // Payments being generated
  | 'PROCESSED' // Payments generated
  | 'FUNDED' // Funds transferred to bank
  | 'COMPLETED' // All payments issued
  | 'FAILED' // Processing failed
  | 'CANCELLED'; // Cancelled

export interface PayRunStatusChange {
  id: UUID;
  fromStatus: PayRunStatus | null;
  toStatus: PayRunStatus;
  timestamp: Timestamp;
  changedBy?: UUID;
  automatic: boolean;
  reason?: string;
  notes?: string;
}

export interface ExportFile {
  fileType: string; // e.g., 'DIRECT_DEPOSIT', 'TAX_REPORT'
  fileFormat: string; // e.g., 'ACH', 'NACHA', 'CSV', 'PDF'
  fileName: string;
  fileUrl: string;
  generatedAt: Timestamp;
  fileSize?: number;
  checksum?: string;
}

export interface ComplianceCheck {
  checkType: string;
  checkName: string;
  passed: boolean;
  message?: string;
  checkedAt: Timestamp;
}

export interface PayRunError {
  errorType: string;
  severity: 'ERROR' | 'CRITICAL';
  message: string;
  caregiverId?: UUID;
  payStubId?: UUID;
  resolution?: string;
}

export interface PayRunWarning {
  warningType: string;
  message: string;
  caregiverId?: UUID;
  payStubId?: UUID;
  canBeOverridden: boolean;
}

/**
 * Pay Stub - Individual caregiver's earnings statement
 *
 * Complete record of earnings, deductions, and net pay
 * for one caregiver in one pay period.
 */
export interface PayStub extends Entity {
  organizationId: UUID;
  branchId: UUID;

  // References
  payRunId: UUID;
  payPeriodId: UUID;
  caregiverId: UUID;
  timeSheetId: UUID;

  // Caregiver info
  caregiverName: string;
  caregiverEmployeeId: string;
  caregiverAddress?: Address;

  // Period
  payPeriodStartDate: Date;
  payPeriodEndDate: Date;
  payDate: Date;

  // Stub number
  stubNumber: string; // Unique identifier

  // Hours
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  ptoHours: number;
  holidayHours: number;
  sickHours: number;
  otherHours: number;
  totalHours: number;

  // Earnings
  regularPay: number;
  overtimePay: number;
  doubleTimePay: number;
  ptoPay: number;
  holidayPay: number;
  sickPay: number;
  otherPay: number;

  // Additional earnings
  bonuses: number;
  commissions: number;
  reimbursements: number;
  retroactivePay: number;
  otherEarnings: number;

  // Gross pay
  currentGrossPay: number;
  yearToDateGrossPay: number;

  // Deductions
  deductions: Deduction[];

  // Tax withholdings
  federalIncomeTax: number;
  stateIncomeTax: number;
  localIncomeTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  additionalMedicareTax: number;
  totalTaxWithheld: number;

  // Other deductions
  healthInsurance: number;
  dentalInsurance: number;
  visionInsurance: number;
  lifeInsurance: number;
  retirement401k: number;
  retirementRoth: number;
  fsaHealthcare: number;
  fsaDependentCare: number;
  hsa: number;
  garnishments: number;
  unionDues: number;
  otherDeductions: number;
  totalOtherDeductions: number;

  // Net pay
  currentNetPay: number;
  yearToDateNetPay: number;

  // Year-to-date totals
  ytdHours: number;
  ytdGrossPay: number;
  ytdFederalTax: number;
  ytdStateTax: number;
  ytdSocialSecurity: number;
  ytdMedicare: number;
  ytdDeductions: number;
  ytdNetPay: number;

  // Payment method
  paymentMethod: PaymentMethod;
  paymentId?: UUID; // Reference to payment record

  // Bank info (for direct deposit)
  bankAccountId?: UUID;
  bankAccountLast4?: string;

  // Check info
  checkNumber?: string;
  checkDate?: Date;
  checkStatus?: CheckStatus;

  // Status
  status: PayStubStatus;
  statusHistory: PayStubStatusChange[];

  // Approval
  calculatedAt: Timestamp;
  calculatedBy?: UUID;
  approvedAt?: Timestamp;
  approvedBy?: UUID;

  // Delivery
  deliveredAt?: Timestamp;
  deliveryMethod?: 'EMAIL' | 'PRINT' | 'PORTAL' | 'MAIL';
  viewedAt?: Timestamp;

  // Documents
  pdfUrl?: string;
  pdfGeneratedAt?: Timestamp;

  // Flags
  isVoid: boolean;
  voidReason?: string;
  voidedAt?: Timestamp;
  voidedBy?: UUID;

  // Metadata
  notes?: string;
  internalNotes?: string;
}

export type PaymentMethod =
  | 'DIRECT_DEPOSIT' // Electronic direct deposit
  | 'CHECK' // Paper check
  | 'CASH' // Cash payment
  | 'PAYCARD' // Payroll debit card
  | 'WIRE' // Wire transfer
  | 'VENMO' // Venmo (for special cases)
  | 'ZELLE'; // Zelle (for special cases)

export type CheckStatus =
  | 'ISSUED' // Check printed/issued
  | 'DELIVERED' // Given to caregiver
  | 'CASHED' // Check cashed
  | 'VOID' // Check voided
  | 'STOP_PAYMENT' // Stop payment placed
  | 'LOST' // Check lost
  | 'REISSUED'; // Check reissued

export type PayStubStatus =
  | 'DRAFT' // Being calculated
  | 'CALCULATED' // Calculations complete
  | 'PENDING_APPROVAL' // Awaiting approval
  | 'APPROVED' // Approved for payment
  | 'PAYMENT_PENDING' // Payment being processed
  | 'PAID' // Payment issued
  | 'VOID' // Voided
  | 'CANCELLED'; // Cancelled

export interface PayStubStatusChange {
  id: UUID;
  fromStatus: PayStubStatus | null;
  toStatus: PayStubStatus;
  timestamp: Timestamp;
  changedBy?: UUID;
  reason?: string;
  notes?: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Deduction - Withholding or deduction from pay
 */
export interface Deduction {
  id: UUID;
  deductionType: DeductionType;
  deductionCode: string;
  description: string;

  // Amount
  amount: number;
  calculationMethod: DeductionCalculationMethod;
  percentage?: number; // If percentage-based

  // Limits
  hasLimit: boolean;
  yearlyLimit?: number;
  yearToDateAmount?: number;
  remainingAmount?: number;

  // Tax treatment
  isPreTax: boolean; // Deducted before taxes calculated
  isPostTax: boolean; // Deducted after taxes

  // Statutory
  isStatutory: boolean; // Required by law

  // Employer match (for retirement, etc.)
  employerMatch?: number;
  employerMatchPercentage?: number;

  // Garnishment specifics
  garnishmentOrder?: GarnishmentOrder;

  // Status
  isActive: boolean;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export type DeductionType =
  | 'FEDERAL_INCOME_TAX'
  | 'STATE_INCOME_TAX'
  | 'LOCAL_INCOME_TAX'
  | 'SOCIAL_SECURITY'
  | 'MEDICARE'
  | 'ADDITIONAL_MEDICARE' // For high earners
  | 'HEALTH_INSURANCE'
  | 'DENTAL_INSURANCE'
  | 'VISION_INSURANCE'
  | 'LIFE_INSURANCE'
  | 'DISABILITY_INSURANCE'
  | 'RETIREMENT_401K'
  | 'RETIREMENT_403B'
  | 'RETIREMENT_ROTH'
  | 'HSA' // Health Savings Account
  | 'FSA_HEALTHCARE' // Flexible Spending Account
  | 'FSA_DEPENDENT_CARE'
  | 'COMMUTER_BENEFITS'
  | 'UNION_DUES'
  | 'GARNISHMENT_CHILD_SUPPORT'
  | 'GARNISHMENT_TAX_LEVY'
  | 'GARNISHMENT_CREDITOR'
  | 'GARNISHMENT_STUDENT_LOAN'
  | 'LOAN_REPAYMENT'
  | 'ADVANCE_REPAYMENT'
  | 'UNIFORM'
  | 'EQUIPMENT'
  | 'OTHER';

export type DeductionCalculationMethod =
  | 'FIXED' // Fixed dollar amount
  | 'PERCENTAGE' // Percentage of gross
  | 'PERCENTAGE_OF_NET' // Percentage of net
  | 'GRADUATED' // Graduated based on income
  | 'FORMULA'; // Custom formula

export interface GarnishmentOrder {
  orderNumber: string;
  issuingAuthority: string;
  orderType: GarnishmentType;
  orderDate: Date;
  orderAmount: number;
  maxPercentage?: number; // Maximum percentage of disposable income
  priority: number; // Priority order (1 = highest)
  startDate: Date;
  endDate?: Date;
  totalAmountOrdered?: number;
  totalAmountPaid?: number;
  remainingBalance?: number;
  remittanceAddress?: Address;
  remittanceAccountNumber?: string;
  remittanceFrequency?: 'EACH_PAY' | 'MONTHLY' | 'QUARTERLY';
  notes?: string;
}

export type GarnishmentType =
  | 'CHILD_SUPPORT'
  | 'SPOUSAL_SUPPORT'
  | 'TAX_LEVY'
  | 'CREDITOR'
  | 'STUDENT_LOAN'
  | 'BANKRUPTCY'
  | 'OTHER';

/**
 * Tax Configuration - Tax withholding setup
 */
export interface TaxConfiguration extends Entity {
  organizationId: UUID;
  caregiverId: UUID;

  // Federal
  federalFilingStatus: FederalFilingStatus;
  federalAllowances: number; // Deprecated but still used
  federalExtraWithholding: number;
  federalExempt: boolean;

  // W-4 fields (2020+ format)
  w4Step2: boolean; // Multiple jobs
  w4Step3Dependents: number; // Dependent amount
  w4Step4aOtherIncome: number;
  w4Step4bDeductions: number;
  w4Step4cExtraWithholding: number;

  // State
  stateFilingStatus: StateFilingStatus;
  stateAllowances: number;
  stateExtraWithholding: number;
  stateExempt: boolean;
  stateResidence: string; // State code

  // Local
  localTaxJurisdiction?: string;
  localExempt: boolean;

  // Status
  effectiveFrom: Date;
  effectiveTo?: Date;
  lastUpdated: Timestamp;
  updatedBy: UUID;

  // W-4 form
  w4OnFile: boolean;
  w4FileDate?: Date;
  w4DocumentId?: UUID;

  // State form
  stateFormOnFile: boolean;
  stateFormDate?: Date;
  stateFormDocumentId?: UUID;
}

export type FederalFilingStatus =
  | 'SINGLE'
  | 'MARRIED_JOINTLY'
  | 'MARRIED_SEPARATELY'
  | 'HEAD_OF_HOUSEHOLD'
  | 'QUALIFYING_WIDOW';

export type StateFilingStatus =
  | 'SINGLE'
  | 'MARRIED'
  | 'MARRIED_JOINTLY'
  | 'MARRIED_SEPARATELY'
  | 'HEAD_OF_HOUSEHOLD'
  | 'EXEMPT';

/**
 * Payment Record - Actual disbursement to caregiver
 */
export interface PaymentRecord extends Entity {
  organizationId: UUID;
  branchId: UUID;

  // References
  payRunId: UUID;
  payStubId: UUID;
  caregiverId: UUID;

  // Payment details
  paymentNumber: string;
  paymentMethod: PaymentMethod;
  paymentAmount: number;
  paymentDate: Date;

  // Direct deposit
  bankAccountId?: UUID;
  routingNumber?: string; // Encrypted
  accountNumber?: string; // Encrypted
  accountType?: 'CHECKING' | 'SAVINGS';
  transactionId?: string;
  traceNumber?: string;

  // Check
  checkNumber?: string;
  checkDate?: Date;
  checkStatus?: CheckStatus;
  checkClearedDate?: Date;
  checkImageUrl?: string;

  // Status
  status: PaymentStatus;
  statusHistory: PaymentStatusChange[];

  // Processing
  initiatedAt: Timestamp;
  initiatedBy: UUID;
  processedAt?: Timestamp;
  settledAt?: Timestamp;

  // ACH batch (for direct deposit)
  achBatchId?: UUID;
  achFileId?: string;

  // Errors
  hasErrors: boolean;
  errorCode?: string;
  errorMessage?: string;
  errorDetails?: string;

  // Reissue tracking
  isReissue: boolean;
  originalPaymentId?: UUID;
  reissueReason?: string;

  // Metadata
  notes?: string;
}

export type PaymentStatus =
  | 'PENDING' // Payment pending
  | 'SCHEDULED' // Scheduled for processing
  | 'PROCESSING' // Being processed
  | 'SENT' // Sent to bank/issued
  | 'CLEARED' // Cleared/settled
  | 'RETURNED' // Returned (NSF, invalid account, etc.)
  | 'CANCELLED' // Cancelled before processing
  | 'VOIDED' // Voided after processing
  | 'FAILED' // Failed to process
  | 'ON_HOLD'; // On hold

export interface PaymentStatusChange {
  id: UUID;
  fromStatus: PaymentStatus | null;
  toStatus: PaymentStatus;
  timestamp: Timestamp;
  changedBy?: UUID;
  automatic: boolean;
  reason?: string;
  notes?: string;
}

/**
 * ACH Batch - Batch of direct deposit payments
 */
export interface ACHBatch extends Entity {
  organizationId: UUID;

  // Batch details
  batchNumber: string;
  batchDate: Date;
  effectiveDate: Date; // When funds settle

  // Company (employer) info
  companyName: string;
  companyId: string; // Company ID for ACH
  companyEntryDescription: string;

  // Payments
  paymentIds: UUID[];
  transactionCount: number;
  totalDebitAmount: number; // Usually 0 for payroll
  totalCreditAmount: number;

  // File generation
  achFileUrl?: string;
  achFileFormat: 'NACHA' | 'CCD' | 'PPD' | 'CTX';
  achFileGeneratedAt?: Timestamp;
  achFileHash?: string;

  // Processing
  status: ACHBatchStatus;
  submittedAt?: Timestamp;
  submittedBy?: UUID;

  // Bank info
  originatingBankRoutingNumber: string;
  originatingBankAccountNumber: string; // Encrypted

  // Settlement
  settledAt?: Timestamp;
  settlementConfirmation?: string;

  // Errors
  hasReturns: boolean;
  returnCount?: number;
  returns?: ACHReturn[];

  // Metadata
  notes?: string;
}

export type ACHBatchStatus =
  | 'DRAFT' // Being compiled
  | 'READY' // Ready for submission
  | 'SUBMITTED' // Submitted to bank
  | 'PROCESSING' // Bank processing
  | 'SETTLED' // Funds settled
  | 'COMPLETED' // All transactions completed
  | 'PARTIAL_RETURN' // Some returns
  | 'FAILED'; // Failed

export interface ACHReturn {
  paymentId: UUID;
  caregiverId: UUID;
  returnCode: string;
  returnReason: string;
  returnDate: Date;
  amount: number;
  resolution?: string;
  resolvedAt?: Timestamp;
}

/**
 * Payroll Tax Filing - Quarterly/annual tax filings
 */
export interface PayrollTaxFiling extends Entity {
  organizationId: UUID;

  // Filing period
  filingType: TaxFilingType;
  filingYear: number;
  filingQuarter?: number; // 1-4
  filingMonth?: number; // 1-12
  periodStartDate: Date;
  periodEndDate: Date;

  // Jurisdiction
  jurisdiction: TaxJurisdiction;
  filingForm: string; // e.g., '941', 'W-2', 'SUTA'

  // Amounts
  totalWages: number;
  totalTips: number;
  federalIncomeTax: number;
  socialSecurityWages: number;
  socialSecurityTax: number;
  medicareWages: number;
  medicareTax: number;
  stateWages: number;
  stateIncomeTax: number;
  stateUnemploymentTax: number;
  localTax: number;

  // Status
  status: TaxFilingStatus;

  // Filing
  dueDate: Date;
  filedDate?: Date;
  filedBy?: UUID;
  confirmationNumber?: string;

  // Payment
  paymentAmount?: number;
  paymentDate?: Date;
  paymentMethod?: string;
  paymentConfirmation?: string;

  // Documents
  filingDocumentUrl?: string;
  receiptDocumentUrl?: string;

  // Metadata
  notes?: string;
}

export type TaxFilingType =
  | 'QUARTERLY_941' // Federal quarterly (Form 941)
  | 'ANNUAL_940' // Federal unemployment (Form 940)
  | 'ANNUAL_W2' // W-2 forms
  | 'ANNUAL_W3' // W-3 summary
  | 'STATE_QUARTERLY' // State quarterly withholding
  | 'STATE_UNEMPLOYMENT' // State unemployment (SUTA)
  | 'LOCAL' // Local tax filing
  | 'YEAR_END'; // Year-end reconciliation

export type TaxJurisdiction = 'FEDERAL' | 'STATE' | 'LOCAL' | 'COUNTY' | 'CITY';

export type TaxFilingStatus =
  | 'PENDING' // Not yet filed
  | 'CALCULATED' // Amounts calculated
  | 'READY_TO_FILE' // Ready for filing
  | 'FILED' // Filed with agency
  | 'ACCEPTED' // Accepted by agency
  | 'REJECTED' // Rejected by agency
  | 'AMENDED' // Amended filing
  | 'LATE'; // Filed late

/**
 * Input types for operations
 */

export interface CreatePayPeriodInput {
  organizationId: UUID;
  branchId?: UUID;
  periodType: PayPeriodType;
  startDate: Date;
  endDate: Date;
  payDate: Date;
  cutoffDate?: Date;
  approvalDeadline?: Date;
  notes?: string;
}

export interface CreateTimeSheetInput {
  organizationId: UUID;
  branchId: UUID;
  payPeriodId: UUID;
  caregiverId: UUID;
  evvRecordIds?: UUID[];
  visitIds?: UUID[];
  notes?: string;
}

export interface AddTimeSheetAdjustmentInput {
  timeSheetId: UUID;
  adjustmentType: AdjustmentType;
  amount: number;
  description: string;
  reason: string;
  notes?: string;
}

export interface CreatePayRunInput {
  organizationId: UUID;
  branchId?: UUID;
  payPeriodId: UUID;
  runType: PayRunType;
  caregiverIds?: UUID[]; // If null, include all
  notes?: string;
}

export interface ApprovePayRunInput {
  payRunId: UUID;
  approvedBy: UUID;
  notes?: string;
}

export interface CreatePayStubInput {
  organizationId: UUID;
  branchId: UUID;
  payRunId: UUID;
  payPeriodId: UUID;
  caregiverId: UUID;
  timeSheetId: UUID;
}

export interface AddDeductionInput {
  caregiverId: UUID;
  deductionType: DeductionType;
  deductionCode: string;
  description: string;
  amount?: number;
  percentage?: number;
  calculationMethod: DeductionCalculationMethod;
  isPreTax: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  garnishmentOrder?: Omit<GarnishmentOrder, 'totalAmountPaid' | 'remainingBalance'>;
  notes?: string;
}

export interface UpdateTaxConfigurationInput {
  caregiverId: UUID;
  federalFilingStatus?: FederalFilingStatus;
  federalAllowances?: number;
  federalExtraWithholding?: number;
  federalExempt?: boolean;
  w4Step2?: boolean;
  w4Step3Dependents?: number;
  w4Step4aOtherIncome?: number;
  w4Step4bDeductions?: number;
  w4Step4cExtraWithholding?: number;
  stateFilingStatus?: StateFilingStatus;
  stateAllowances?: number;
  stateExtraWithholding?: number;
  stateExempt?: boolean;
  stateResidence?: string;
  effectiveFrom?: Date;
}

export interface ProcessPaymentInput {
  payStubId: UUID;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  bankAccountId?: UUID;
  notes?: string;
}

export interface CreateACHBatchInput {
  organizationId: UUID;
  paymentIds: UUID[];
  effectiveDate: Date;
  companyEntryDescription: string;
}

/**
 * Search and filter types
 */

export interface PayPeriodSearchFilters {
  organizationId?: UUID;
  branchId?: UUID;
  periodType?: PayPeriodType[];
  status?: PayPeriodStatus[];
  year?: number;
  quarter?: number;
  startDate?: Date;
  endDate?: Date;
  payDateStart?: Date;
  payDateEnd?: Date;
}

export interface TimeSheetSearchFilters {
  organizationId?: UUID;
  branchId?: UUID;
  payPeriodId?: UUID;
  caregiverId?: UUID;
  status?: TimeSheetStatus[];
  hasDiscrepancies?: boolean;
  startDate?: Date;
  endDate?: Date;
  requiresApproval?: boolean;
}

export interface PayStubSearchFilters {
  organizationId?: UUID;
  branchId?: UUID;
  payRunId?: UUID;
  payPeriodId?: UUID;
  caregiverId?: UUID;
  status?: PayStubStatus[];
  paymentMethod?: PaymentMethod[];
  payDateStart?: Date;
  payDateEnd?: Date;
  minAmount?: number;
  maxAmount?: number;
  isVoid?: boolean;
}

export interface PaymentSearchFilters {
  organizationId?: UUID;
  branchId?: UUID;
  payRunId?: UUID;
  caregiverId?: UUID;
  paymentMethod?: PaymentMethod[];
  status?: PaymentStatus[];
  paymentDateStart?: Date;
  paymentDateEnd?: Date;
  hasErrors?: boolean;
  isReissue?: boolean;
}

/**
 * Calculation helpers
 */

export interface OvertimeCalculationResult {
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  regularPay: number;
  overtimePay: number;
  doubleTimePay: number;
  totalPay: number;
}

export interface TaxCalculationResult {
  federalIncomeTax: number;
  stateIncomeTax: number;
  localIncomeTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  additionalMedicareTax: number;
  totalTax: number;
}

export interface PayStubSummary {
  totalHours: number;
  grossPay: number;
  totalDeductions: number;
  totalTax: number;
  netPay: number;
}
