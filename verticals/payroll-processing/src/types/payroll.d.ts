import { Entity, SoftDeletable, UUID, Timestamp } from '@care-commons/core';
export interface PayPeriod extends Entity {
    organizationId: UUID;
    branchId?: UUID;
    periodNumber: number;
    periodYear: number;
    periodType: PayPeriodType;
    startDate: Date;
    endDate: Date;
    payDate: Date;
    status: PayPeriodStatus;
    statusHistory: PayPeriodStatusChange[];
    cutoffDate?: Date;
    approvalDeadline?: Date;
    payRunId?: UUID;
    totalCaregivers?: number;
    totalHours?: number;
    totalGrossPay?: number;
    totalNetPay?: number;
    totalTaxWithheld?: number;
    totalDeductions?: number;
    notes?: string;
    fiscalQuarter?: number;
    fiscalYear?: number;
}
export type PayPeriodType = 'WEEKLY' | 'BI_WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY' | 'DAILY' | 'CUSTOM';
export type PayPeriodStatus = 'DRAFT' | 'OPEN' | 'LOCKED' | 'PROCESSING' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAID' | 'CLOSED' | 'CANCELLED';
export interface PayPeriodStatusChange {
    id: UUID;
    fromStatus: PayPeriodStatus | null;
    toStatus: PayPeriodStatus;
    timestamp: Timestamp;
    changedBy: UUID;
    reason?: string;
    notes?: string;
}
export interface TimeSheet extends Entity, SoftDeletable {
    organizationId: UUID;
    branchId: UUID;
    payPeriodId: UUID;
    caregiverId: UUID;
    caregiverName: string;
    caregiverEmployeeId: string;
    timeEntries: TimeSheetEntry[];
    regularHours: number;
    overtimeHours: number;
    doubleTimeHours: number;
    ptoHours: number;
    holidayHours: number;
    sickHours: number;
    otherHours: number;
    totalHours: number;
    regularRate: number;
    overtimeRate: number;
    doubleTimeRate: number;
    regularEarnings: number;
    overtimeEarnings: number;
    doubleTimeEarnings: number;
    ptoEarnings: number;
    holidayEarnings: number;
    sickEarnings: number;
    otherEarnings: number;
    grossEarnings: number;
    bonuses: TimeSheetAdjustment[];
    reimbursements: TimeSheetAdjustment[];
    adjustments: TimeSheetAdjustment[];
    totalAdjustments: number;
    totalGrossPay: number;
    status: TimeSheetStatus;
    statusHistory: TimeSheetStatusChange[];
    submittedAt?: Timestamp;
    submittedBy?: UUID;
    approvedAt?: Timestamp;
    approvedBy?: UUID;
    approvalNotes?: string;
    hasDiscrepancies: boolean;
    discrepancyFlags?: DiscrepancyFlag[];
    evvRecordIds: UUID[];
    visitIds: UUID[];
    notes?: string;
    reviewNotes?: string;
}
export type TimeSheetStatus = 'DRAFT' | 'SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'PAID' | 'VOIDED';
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
    visitId: UUID;
    evvRecordId: UUID;
    clientId: UUID;
    clientName: string;
    workDate: Date;
    clockInTime: Timestamp;
    clockOutTime: Timestamp;
    regularHours: number;
    overtimeHours: number;
    doubleTimeHours: number;
    breakHours: number;
    totalHours: number;
    payRate: number;
    payRateType: PayRateType;
    isWeekend: boolean;
    isHoliday: boolean;
    isNightShift: boolean;
    isLiveIn: boolean;
    appliedMultipliers: PayRateMultiplier[];
    earnings: number;
    serviceType?: string;
    serviceCode?: string;
    isBillable: boolean;
    billableItemId?: UUID;
    requiresReview: boolean;
    reviewReason?: string;
}
export type PayRateType = 'REGULAR' | 'OVERTIME' | 'DOUBLE_TIME' | 'WEEKEND' | 'HOLIDAY' | 'NIGHT_SHIFT' | 'LIVE_IN' | 'ON_CALL' | 'TRAINING' | 'SPECIALIZED';
export interface PayRateMultiplier {
    multiplierType: string;
    multiplier: number;
    baseRate: number;
    appliedAmount: number;
}
export interface TimeSheetAdjustment {
    id: UUID;
    adjustmentType: AdjustmentType;
    amount: number;
    description: string;
    reason: string;
    addedBy: UUID;
    addedAt: Timestamp;
    approvedBy?: UUID;
    approvedAt?: Timestamp;
    notes?: string;
    referenceId?: UUID;
}
export type AdjustmentType = 'BONUS' | 'COMMISSION' | 'REIMBURSEMENT' | 'MILEAGE' | 'CORRECTION' | 'RETROACTIVE' | 'RETENTION' | 'REFERRAL' | 'HOLIDAY_BONUS' | 'SHIFT_DIFFERENTIAL' | 'HAZARD_PAY' | 'OTHER';
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
export type DiscrepancyType = 'MISSING_CLOCK_OUT' | 'EXCESSIVE_HOURS' | 'OVERLAPPING_SHIFTS' | 'RATE_MISMATCH' | 'UNAPPROVED_OVERTIME' | 'MISSING_EVV' | 'LOCATION_VIOLATION' | 'DATE_MISMATCH' | 'DUPLICATE_ENTRY' | 'CALCULATION_ERROR' | 'OTHER';
export interface PayRun extends Entity {
    organizationId: UUID;
    branchId?: UUID;
    payPeriodId: UUID;
    payPeriodStartDate: Date;
    payPeriodEndDate: Date;
    payDate: Date;
    runNumber: string;
    runType: PayRunType;
    status: PayRunStatus;
    statusHistory: PayRunStatusChange[];
    initiatedAt?: Timestamp;
    initiatedBy?: UUID;
    calculatedAt?: Timestamp;
    approvedAt?: Timestamp;
    approvedBy?: UUID;
    processedAt?: Timestamp;
    processedBy?: UUID;
    payStubIds: UUID[];
    totalPayStubs: number;
    totalCaregivers: number;
    totalHours: number;
    totalGrossPay: number;
    totalDeductions: number;
    totalTaxWithheld: number;
    totalNetPay: number;
    federalIncomeTax: number;
    stateIncomeTax: number;
    socialSecurityTax: number;
    medicareTax: number;
    localTax: number;
    benefitsDeductions: number;
    garnishments: number;
    otherDeductions: number;
    directDepositCount: number;
    directDepositAmount: number;
    checkCount: number;
    checkAmount: number;
    cashCount: number;
    cashAmount: number;
    payrollRegisterUrl?: string;
    taxReportUrl?: string;
    exportFiles?: ExportFile[];
    complianceChecks?: ComplianceCheck[];
    compliancePassed: boolean;
    hasErrors: boolean;
    errors?: PayRunError[];
    warnings?: PayRunWarning[];
    notes?: string;
    internalNotes?: string;
}
export type PayRunType = 'REGULAR' | 'OFF_CYCLE' | 'CORRECTION' | 'BONUS' | 'FINAL' | 'ADVANCE' | 'RETRO';
export type PayRunStatus = 'DRAFT' | 'CALCULATING' | 'CALCULATED' | 'PENDING_REVIEW' | 'PENDING_APPROVAL' | 'APPROVED' | 'PROCESSING' | 'PROCESSED' | 'FUNDED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
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
    fileType: string;
    fileFormat: string;
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
export interface PayStub extends Entity {
    organizationId: UUID;
    branchId: UUID;
    payRunId: UUID;
    payPeriodId: UUID;
    caregiverId: UUID;
    timeSheetId: UUID;
    caregiverName: string;
    caregiverEmployeeId: string;
    caregiverAddress?: Address;
    payPeriodStartDate: Date;
    payPeriodEndDate: Date;
    payDate: Date;
    stubNumber: string;
    regularHours: number;
    overtimeHours: number;
    doubleTimeHours: number;
    ptoHours: number;
    holidayHours: number;
    sickHours: number;
    otherHours: number;
    totalHours: number;
    regularPay: number;
    overtimePay: number;
    doubleTimePay: number;
    ptoPay: number;
    holidayPay: number;
    sickPay: number;
    otherPay: number;
    bonuses: number;
    commissions: number;
    reimbursements: number;
    retroactivePay: number;
    otherEarnings: number;
    currentGrossPay: number;
    yearToDateGrossPay: number;
    deductions: Deduction[];
    federalIncomeTax: number;
    stateIncomeTax: number;
    localIncomeTax: number;
    socialSecurityTax: number;
    medicareTax: number;
    additionalMedicareTax: number;
    totalTaxWithheld: number;
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
    currentNetPay: number;
    yearToDateNetPay: number;
    ytdHours: number;
    ytdGrossPay: number;
    ytdFederalTax: number;
    ytdStateTax: number;
    ytdSocialSecurity: number;
    ytdMedicare: number;
    ytdDeductions: number;
    ytdNetPay: number;
    paymentMethod: PaymentMethod;
    paymentId?: UUID;
    bankAccountId?: UUID;
    bankAccountLast4?: string;
    checkNumber?: string;
    checkDate?: Date;
    checkStatus?: CheckStatus;
    status: PayStubStatus;
    statusHistory: PayStubStatusChange[];
    calculatedAt: Timestamp;
    calculatedBy?: UUID;
    approvedAt?: Timestamp;
    approvedBy?: UUID;
    deliveredAt?: Timestamp;
    deliveryMethod?: 'EMAIL' | 'PRINT' | 'PORTAL' | 'MAIL';
    viewedAt?: Timestamp;
    pdfUrl?: string;
    pdfGeneratedAt?: Timestamp;
    isVoid: boolean;
    voidReason?: string;
    voidedAt?: Timestamp;
    voidedBy?: UUID;
    notes?: string;
    internalNotes?: string;
}
export type PaymentMethod = 'DIRECT_DEPOSIT' | 'CHECK' | 'CASH' | 'PAYCARD' | 'WIRE' | 'VENMO' | 'ZELLE';
export type CheckStatus = 'ISSUED' | 'DELIVERED' | 'CASHED' | 'VOID' | 'STOP_PAYMENT' | 'LOST' | 'REISSUED';
export type PayStubStatus = 'DRAFT' | 'CALCULATED' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAYMENT_PENDING' | 'PAID' | 'VOID' | 'CANCELLED';
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
export interface Deduction {
    id: UUID;
    deductionType: DeductionType;
    deductionCode: string;
    description: string;
    amount: number;
    calculationMethod: DeductionCalculationMethod;
    percentage?: number;
    hasLimit: boolean;
    yearlyLimit?: number;
    yearToDateAmount?: number;
    remainingAmount?: number;
    isPreTax: boolean;
    isPostTax: boolean;
    isStatutory: boolean;
    employerMatch?: number;
    employerMatchPercentage?: number;
    garnishmentOrder?: GarnishmentOrder;
    isActive: boolean;
    effectiveFrom?: Date;
    effectiveTo?: Date;
}
export type DeductionType = 'FEDERAL_INCOME_TAX' | 'STATE_INCOME_TAX' | 'LOCAL_INCOME_TAX' | 'SOCIAL_SECURITY' | 'MEDICARE' | 'ADDITIONAL_MEDICARE' | 'HEALTH_INSURANCE' | 'DENTAL_INSURANCE' | 'VISION_INSURANCE' | 'LIFE_INSURANCE' | 'DISABILITY_INSURANCE' | 'RETIREMENT_401K' | 'RETIREMENT_403B' | 'RETIREMENT_ROTH' | 'HSA' | 'FSA_HEALTHCARE' | 'FSA_DEPENDENT_CARE' | 'COMMUTER_BENEFITS' | 'UNION_DUES' | 'GARNISHMENT_CHILD_SUPPORT' | 'GARNISHMENT_TAX_LEVY' | 'GARNISHMENT_CREDITOR' | 'GARNISHMENT_STUDENT_LOAN' | 'LOAN_REPAYMENT' | 'ADVANCE_REPAYMENT' | 'UNIFORM' | 'EQUIPMENT' | 'OTHER';
export type DeductionCalculationMethod = 'FIXED' | 'PERCENTAGE' | 'PERCENTAGE_OF_NET' | 'GRADUATED' | 'FORMULA';
export interface GarnishmentOrder {
    orderNumber: string;
    issuingAuthority: string;
    orderType: GarnishmentType;
    orderDate: Date;
    orderAmount: number;
    maxPercentage?: number;
    priority: number;
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
export type GarnishmentType = 'CHILD_SUPPORT' | 'SPOUSAL_SUPPORT' | 'TAX_LEVY' | 'CREDITOR' | 'STUDENT_LOAN' | 'BANKRUPTCY' | 'OTHER';
export interface TaxConfiguration extends Entity {
    organizationId: UUID;
    caregiverId: UUID;
    federalFilingStatus: FederalFilingStatus;
    federalAllowances: number;
    federalExtraWithholding: number;
    federalExempt: boolean;
    w4Step2: boolean;
    w4Step3Dependents: number;
    w4Step4aOtherIncome: number;
    w4Step4bDeductions: number;
    w4Step4cExtraWithholding: number;
    stateFilingStatus: StateFilingStatus;
    stateAllowances: number;
    stateExtraWithholding: number;
    stateExempt: boolean;
    stateResidence: string;
    localTaxJurisdiction?: string;
    localExempt: boolean;
    effectiveFrom: Date;
    effectiveTo?: Date;
    lastUpdated: Timestamp;
    updatedBy: UUID;
    w4OnFile: boolean;
    w4FileDate?: Date;
    w4DocumentId?: UUID;
    stateFormOnFile: boolean;
    stateFormDate?: Date;
    stateFormDocumentId?: UUID;
}
export type FederalFilingStatus = 'SINGLE' | 'MARRIED_JOINTLY' | 'MARRIED_SEPARATELY' | 'HEAD_OF_HOUSEHOLD' | 'QUALIFYING_WIDOW';
export type StateFilingStatus = 'SINGLE' | 'MARRIED' | 'MARRIED_JOINTLY' | 'MARRIED_SEPARATELY' | 'HEAD_OF_HOUSEHOLD' | 'EXEMPT';
export interface PaymentRecord extends Entity {
    organizationId: UUID;
    branchId: UUID;
    payRunId: UUID;
    payStubId: UUID;
    caregiverId: UUID;
    paymentNumber: string;
    paymentMethod: PaymentMethod;
    paymentAmount: number;
    paymentDate: Date;
    bankAccountId?: UUID;
    routingNumber?: string;
    accountNumber?: string;
    accountType?: 'CHECKING' | 'SAVINGS';
    transactionId?: string;
    traceNumber?: string;
    checkNumber?: string;
    checkDate?: Date;
    checkStatus?: CheckStatus;
    checkClearedDate?: Date;
    checkImageUrl?: string;
    status: PaymentStatus;
    statusHistory: PaymentStatusChange[];
    initiatedAt: Timestamp;
    initiatedBy: UUID;
    processedAt?: Timestamp;
    settledAt?: Timestamp;
    achBatchId?: UUID;
    achFileId?: string;
    hasErrors: boolean;
    errorCode?: string;
    errorMessage?: string;
    errorDetails?: string;
    isReissue: boolean;
    originalPaymentId?: UUID;
    reissueReason?: string;
    notes?: string;
}
export type PaymentStatus = 'PENDING' | 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'CLEARED' | 'RETURNED' | 'CANCELLED' | 'VOIDED' | 'FAILED' | 'ON_HOLD';
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
export interface ACHBatch extends Entity {
    organizationId: UUID;
    batchNumber: string;
    batchDate: Date;
    effectiveDate: Date;
    companyName: string;
    companyId: string;
    companyEntryDescription: string;
    paymentIds: UUID[];
    transactionCount: number;
    totalDebitAmount: number;
    totalCreditAmount: number;
    achFileUrl?: string;
    achFileFormat: 'NACHA' | 'CCD' | 'PPD' | 'CTX';
    achFileGeneratedAt?: Timestamp;
    achFileHash?: string;
    status: ACHBatchStatus;
    submittedAt?: Timestamp;
    submittedBy?: UUID;
    originatingBankRoutingNumber: string;
    originatingBankAccountNumber: string;
    settledAt?: Timestamp;
    settlementConfirmation?: string;
    hasReturns: boolean;
    returnCount?: number;
    returns?: ACHReturn[];
    notes?: string;
}
export type ACHBatchStatus = 'DRAFT' | 'READY' | 'SUBMITTED' | 'PROCESSING' | 'SETTLED' | 'COMPLETED' | 'PARTIAL_RETURN' | 'FAILED';
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
export interface PayrollTaxFiling extends Entity {
    organizationId: UUID;
    filingType: TaxFilingType;
    filingYear: number;
    filingQuarter?: number;
    filingMonth?: number;
    periodStartDate: Date;
    periodEndDate: Date;
    jurisdiction: TaxJurisdiction;
    filingForm: string;
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
    status: TaxFilingStatus;
    dueDate: Date;
    filedDate?: Date;
    filedBy?: UUID;
    confirmationNumber?: string;
    paymentAmount?: number;
    paymentDate?: Date;
    paymentMethod?: string;
    paymentConfirmation?: string;
    filingDocumentUrl?: string;
    receiptDocumentUrl?: string;
    notes?: string;
}
export type TaxFilingType = 'QUARTERLY_941' | 'ANNUAL_940' | 'ANNUAL_W2' | 'ANNUAL_W3' | 'STATE_QUARTERLY' | 'STATE_UNEMPLOYMENT' | 'LOCAL' | 'YEAR_END';
export type TaxJurisdiction = 'FEDERAL' | 'STATE' | 'LOCAL' | 'COUNTY' | 'CITY';
export type TaxFilingStatus = 'PENDING' | 'CALCULATED' | 'READY_TO_FILE' | 'FILED' | 'ACCEPTED' | 'REJECTED' | 'AMENDED' | 'LATE';
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
    caregiverIds?: UUID[];
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
//# sourceMappingURL=payroll.d.ts.map