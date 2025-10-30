import { Entity, SoftDeletable, UUID, Timestamp } from '@care-commons/core';
export interface BillableItem extends Entity, SoftDeletable {
    organizationId: UUID;
    branchId: UUID;
    clientId: UUID;
    visitId?: UUID;
    evvRecordId?: UUID;
    serviceTypeId: UUID;
    serviceTypeCode: string;
    serviceTypeName: string;
    serviceDate: Date;
    startTime?: Timestamp;
    endTime?: Timestamp;
    durationMinutes: number;
    caregiverId?: UUID;
    caregiverName?: string;
    providerNPI?: string;
    rateScheduleId?: UUID;
    unitType: UnitType;
    units: number;
    unitRate: number;
    subtotal: number;
    modifiers?: BillingModifier[];
    adjustments?: BillableAdjustment[];
    finalAmount: number;
    authorizationId?: UUID;
    authorizationNumber?: string;
    isAuthorized: boolean;
    authorizationRemainingUnits?: number;
    payerId: UUID;
    payerType: PayerType;
    payerName: string;
    status: BillableStatus;
    statusHistory: BillableStatusChange[];
    invoiceId?: UUID;
    invoiceDate?: Date;
    claimId?: UUID;
    claimSubmittedDate?: Date;
    isHold: boolean;
    holdReason?: string;
    requiresReview: boolean;
    reviewReason?: string;
    isDenied: boolean;
    denialReason?: string;
    denialCode?: string;
    denialDate?: Date;
    isAppealable: boolean;
    isPaid: boolean;
    paidAmount?: number;
    paidDate?: Date;
    paymentId?: UUID;
    notes?: string;
    tags?: string[];
}
export type UnitType = 'HOUR' | 'VISIT' | 'DAY' | 'WEEK' | 'MONTH' | 'TASK' | 'MILE' | 'UNIT';
export type BillableStatus = 'PENDING' | 'READY' | 'INVOICED' | 'SUBMITTED' | 'PAID' | 'PARTIAL_PAID' | 'DENIED' | 'APPEALED' | 'ADJUSTED' | 'VOIDED' | 'HOLD';
export type PayerType = 'MEDICAID' | 'MEDICARE' | 'MEDICARE_ADVANTAGE' | 'PRIVATE_INSURANCE' | 'MANAGED_CARE' | 'VETERANS_BENEFITS' | 'WORKERS_COMP' | 'PRIVATE_PAY' | 'GRANT' | 'OTHER';
export interface BillingModifier {
    code: string;
    description: string;
    multiplier?: number;
    addedAmount?: number;
}
export interface BillableAdjustment {
    id: UUID;
    adjustmentType: AdjustmentType;
    amount: number;
    reason: string;
    appliedBy: UUID;
    appliedAt: Timestamp;
    notes?: string;
}
export type AdjustmentType = 'DISCOUNT' | 'WRITE_OFF' | 'CORRECTION' | 'CONTRACTUAL' | 'COURTESY' | 'ROUNDING' | 'OTHER';
export interface BillableStatusChange {
    id: UUID;
    fromStatus: BillableStatus | null;
    toStatus: BillableStatus;
    timestamp: Timestamp;
    changedBy: UUID;
    reason?: string;
    notes?: string;
}
export interface Invoice extends Entity, SoftDeletable {
    organizationId: UUID;
    branchId: UUID;
    invoiceNumber: string;
    invoiceType: InvoiceType;
    payerId: UUID;
    payerType: PayerType;
    payerName: string;
    payerAddress?: Address;
    clientId?: UUID;
    clientName?: string;
    periodStart: Date;
    periodEnd: Date;
    invoiceDate: Date;
    dueDate: Date;
    billableItemIds: UUID[];
    lineItems: InvoiceLineItem[];
    subtotal: number;
    taxAmount: number;
    taxRate?: number;
    discountAmount: number;
    adjustmentAmount: number;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
    status: InvoiceStatus;
    statusHistory: InvoiceStatusChange[];
    submittedDate?: Date;
    submittedBy?: UUID;
    submissionMethod?: SubmissionMethod;
    submissionConfirmation?: string;
    paymentTerms?: string;
    lateFeeRate?: number;
    payments: PaymentReference[];
    pdfUrl?: string;
    documentIds?: UUID[];
    claimIds?: UUID[];
    claimStatus?: ClaimStatus;
    notes?: string;
    internalNotes?: string;
    tags?: string[];
}
export type InvoiceType = 'STANDARD' | 'INTERIM' | 'FINAL' | 'CREDIT' | 'PROFORMA' | 'STATEMENT';
export type InvoiceStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'SENT' | 'SUBMITTED' | 'PARTIALLY_PAID' | 'PAID' | 'PAST_DUE' | 'DISPUTED' | 'CANCELLED' | 'VOIDED';
export type SubmissionMethod = 'EDI' | 'CLEARINGHOUSE' | 'PORTAL' | 'EMAIL' | 'MAIL' | 'FAX' | 'IN_PERSON';
export type ClaimStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PROCESSING' | 'APPROVED' | 'DENIED' | 'APPEALED' | 'RESUBMITTED';
export interface InvoiceLineItem {
    id: UUID;
    billableItemId: UUID;
    serviceDate: Date;
    serviceCode: string;
    serviceDescription: string;
    providerName?: string;
    providerNPI?: string;
    unitType: UnitType;
    units: number;
    unitRate: number;
    subtotal: number;
    adjustments: number;
    total: number;
    clientName?: string;
    clientId?: UUID;
    modifiers?: BillingModifier[];
    authorizationNumber?: string;
}
export interface InvoiceStatusChange {
    id: UUID;
    fromStatus: InvoiceStatus | null;
    toStatus: InvoiceStatus;
    timestamp: Timestamp;
    changedBy: UUID;
    reason?: string;
    notes?: string;
}
export interface PaymentReference {
    paymentId: UUID;
    amount: number;
    date: Date;
}
export interface Address {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}
export interface Payment extends Entity {
    organizationId: UUID;
    branchId: UUID;
    paymentNumber: string;
    paymentType: PaymentType;
    payerId: UUID;
    payerType: PayerType;
    payerName: string;
    amount: number;
    currency: string;
    paymentDate: Date;
    receivedDate: Date;
    depositedDate?: Date;
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    allocations: PaymentAllocation[];
    unappliedAmount: number;
    bankAccountId?: UUID;
    depositSlipNumber?: string;
    status: PaymentStatus;
    statusHistory: PaymentStatusChange[];
    isReconciled: boolean;
    reconciledDate?: Date;
    reconciledBy?: UUID;
    imageUrl?: string;
    documentIds?: UUID[];
    notes?: string;
    internalNotes?: string;
}
export type PaymentType = 'FULL' | 'PARTIAL' | 'DEPOSIT' | 'REFUND' | 'ADJUSTMENT';
export type PaymentMethod = 'CHECK' | 'EFT' | 'ACH' | 'WIRE' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'MONEY_ORDER' | 'ERA';
export type PaymentStatus = 'PENDING' | 'RECEIVED' | 'APPLIED' | 'DEPOSITED' | 'CLEARED' | 'RETURNED' | 'VOIDED' | 'REFUNDED';
export interface PaymentAllocation {
    id: UUID;
    invoiceId: UUID;
    invoiceNumber: string;
    billableItemIds?: UUID[];
    amount: number;
    appliedAt: Timestamp;
    appliedBy: UUID;
    notes?: string;
}
export interface PaymentStatusChange {
    id: UUID;
    fromStatus: PaymentStatus | null;
    toStatus: PaymentStatus;
    timestamp: Timestamp;
    changedBy: UUID;
    reason?: string;
    notes?: string;
}
export interface RateSchedule extends Entity {
    organizationId: UUID;
    branchId?: UUID;
    name: string;
    description?: string;
    scheduleType: RateScheduleType;
    payerId?: UUID;
    payerType?: PayerType;
    payerName?: string;
    effectiveFrom: Date;
    effectiveTo?: Date;
    rates: ServiceRate[];
    status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
    approvedBy?: UUID;
    approvedAt?: Timestamp;
    notes?: string;
}
export type RateScheduleType = 'STANDARD' | 'PAYER_SPECIFIC' | 'CLIENT_SPECIFIC' | 'PROGRAM' | 'PROMOTIONAL';
export interface ServiceRate {
    id: UUID;
    serviceTypeId: UUID;
    serviceTypeCode: string;
    serviceTypeName: string;
    unitType: UnitType;
    unitRate: number;
    minimumUnits?: number;
    maximumUnits?: number;
    minimumCharge?: number;
    roundingRule?: RoundingRule;
    weekendRate?: number;
    holidayRate?: number;
    nightRate?: number;
    overtimeRate?: number;
    ruralRate?: number;
    urbanRate?: number;
    effectiveFrom?: Date;
    effectiveTo?: Date;
}
export type RoundingRule = 'NONE' | 'UP' | 'DOWN' | 'NEAREST' | 'QUARTER_HOUR' | 'HALF_HOUR';
export interface Payer extends Entity, SoftDeletable {
    organizationId: UUID;
    payerName: string;
    payerType: PayerType;
    payerCode?: string;
    nationalPayerId?: string;
    medicaidProviderId?: string;
    medicareProviderId?: string;
    taxId?: string;
    address?: Address;
    phone?: string;
    fax?: string;
    email?: string;
    website?: string;
    billingAddress?: Address;
    billingEmail?: string;
    billingPortalUrl?: string;
    submissionMethod?: SubmissionMethod[];
    ediPayerId?: string;
    clearinghouseId?: UUID;
    paymentTermsDays: number;
    requiresPreAuthorization: boolean;
    requiresReferral: boolean;
    claimFilingLimit?: number;
    defaultRateScheduleId?: UUID;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED';
    averagePaymentDays?: number;
    denialRate?: number;
    notes?: string;
    contacts?: PayerContact[];
}
export interface PayerContact {
    id: UUID;
    name: string;
    role: string;
    phone?: string;
    email?: string;
    isPrimary: boolean;
}
export interface ServiceAuthorization extends Entity, SoftDeletable {
    organizationId: UUID;
    branchId: UUID;
    clientId: UUID;
    authorizationNumber: string;
    authorizationType: AuthorizationType;
    payerId: UUID;
    payerType: PayerType;
    payerName: string;
    serviceTypeId: UUID;
    serviceTypeCode: string;
    serviceTypeName: string;
    authorizedUnits: number;
    unitType: UnitType;
    unitRate?: number;
    authorizedAmount?: number;
    effectiveFrom: Date;
    effectiveTo: Date;
    usedUnits: number;
    remainingUnits: number;
    billedUnits: number;
    requiresReferral: boolean;
    referralNumber?: string;
    allowedProviders?: UUID[];
    locationRestrictions?: string;
    status: AuthorizationStatus;
    statusHistory: AuthorizationStatusChange[];
    reviewedBy?: UUID;
    reviewedAt?: Timestamp;
    reviewNotes?: string;
    lowUnitsThreshold?: number;
    expirationWarningDays?: number;
    documentIds?: UUID[];
    notes?: string;
    internalNotes?: string;
}
export type AuthorizationType = 'INITIAL' | 'RENEWAL' | 'MODIFICATION' | 'EMERGENCY' | 'TEMPORARY';
export type AuthorizationStatus = 'PENDING' | 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED' | 'DENIED';
export interface AuthorizationStatusChange {
    id: UUID;
    fromStatus: AuthorizationStatus | null;
    toStatus: AuthorizationStatus;
    timestamp: Timestamp;
    changedBy: UUID;
    reason?: string;
    notes?: string;
}
export interface Claim extends Entity {
    organizationId: UUID;
    branchId: UUID;
    claimNumber: string;
    claimType: ClaimType;
    claimFormat: ClaimFormat;
    payerId: UUID;
    payerType: PayerType;
    payerName: string;
    clientId: UUID;
    clientName: string;
    invoiceId: UUID;
    invoiceNumber: string;
    billableItemIds: UUID[];
    lineItems: ClaimLineItem[];
    totalCharges: number;
    totalApproved?: number;
    totalPaid?: number;
    totalAdjustments?: number;
    patientResponsibility?: number;
    submittedDate: Date;
    submittedBy: UUID;
    submissionMethod: SubmissionMethod;
    submissionBatchId?: UUID;
    controlNumber?: string;
    status: ClaimStatus;
    statusHistory: ClaimStatusChange[];
    processingDate?: Date;
    paymentDate?: Date;
    denialReason?: string;
    denialCode?: string;
    denialDate?: Date;
    isAppealable: boolean;
    appealDeadline?: Date;
    appealId?: UUID;
    appealSubmittedDate?: Date;
    appealStatus?: AppealStatus;
    eraReceived: boolean;
    eraReceivedDate?: Date;
    eraDocumentId?: UUID;
    claimFormUrl?: string;
    supportingDocumentIds?: UUID[];
    notes?: string;
    internalNotes?: string;
}
export type ClaimType = 'PROFESSIONAL' | 'INSTITUTIONAL' | 'DENTAL' | 'PHARMACY' | 'VISION';
export type ClaimFormat = 'CMS_1500' | 'UB_04' | 'EDI_837P' | 'EDI_837I' | 'PROPRIETARY';
export type AppealStatus = 'PENDING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED' | 'ABANDONED';
export interface ClaimLineItem {
    id: UUID;
    billableItemId: UUID;
    lineNumber: number;
    serviceDate: Date;
    serviceCode: string;
    serviceDescription: string;
    placeOfService: string;
    providerNPI: string;
    providerName: string;
    unitType: UnitType;
    units: number;
    chargeAmount: number;
    approvedAmount?: number;
    paidAmount?: number;
    adjustmentAmount?: number;
    modifiers?: BillingModifier[];
    authorizationNumber?: string;
    diagnosisCodes?: string[];
    lineStatus: ClaimLineStatus;
    denialCode?: string;
    denialReason?: string;
}
export type ClaimLineStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'ADJUSTED' | 'APPEALED';
export interface ClaimStatusChange {
    id: UUID;
    fromStatus: ClaimStatus | null;
    toStatus: ClaimStatus;
    timestamp: Timestamp;
    changedBy?: UUID;
    automatic: boolean;
    reason?: string;
    notes?: string;
}
export interface BillingReport extends Entity {
    organizationId: UUID;
    branchId?: UUID;
    reportType: BillingReportType;
    reportPeriod: ReportPeriod;
    totalBillable: number;
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    totalDenied: number;
    totalAdjustments: number;
    byPayer?: Record<UUID, PayerSummary>;
    byServiceType?: Record<UUID, ServiceTypeSummary>;
    byClient?: Record<UUID, ClientSummary>;
    collectionRate: number;
    denialRate: number;
    daysToPayment: number;
    generatedAt: Timestamp;
    generatedBy: UUID;
    exportUrl?: string;
    exportFormat?: 'PDF' | 'CSV' | 'EXCEL' | 'JSON';
}
export type BillingReportType = 'REVENUE' | 'AGING' | 'PAYER_PERFORMANCE' | 'SERVICE_ANALYSIS' | 'DENIAL_ANALYSIS' | 'COLLECTION' | 'FORECAST';
export interface ReportPeriod {
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM';
    startDate: Date;
    endDate: Date;
}
export interface PayerSummary {
    payerId: UUID;
    payerName: string;
    totalBilled: number;
    totalPaid: number;
    totalOutstanding: number;
    denialRate: number;
    averagePaymentDays: number;
}
export interface ServiceTypeSummary {
    serviceTypeId: UUID;
    serviceTypeName: string;
    totalUnits: number;
    totalBilled: number;
    totalPaid: number;
    averageRate: number;
}
export interface ClientSummary {
    clientId: UUID;
    clientName: string;
    totalBilled: number;
    totalPaid: number;
    balanceDue: number;
    lastPaymentDate?: Date;
}
export interface CreateBillableItemInput {
    organizationId: UUID;
    branchId: UUID;
    clientId: UUID;
    visitId?: UUID;
    evvRecordId?: UUID;
    serviceTypeId: UUID;
    serviceTypeCode: string;
    serviceTypeName: string;
    serviceDate: Date;
    startTime?: Timestamp;
    endTime?: Timestamp;
    durationMinutes: number;
    caregiverId?: UUID;
    caregiverName?: string;
    providerNPI?: string;
    unitType: UnitType;
    units: number;
    rateScheduleId?: UUID;
    payerId: UUID;
    payerType: PayerType;
    payerName: string;
    authorizationId?: UUID;
    authorizationNumber?: string;
    modifiers?: BillingModifier[];
    notes?: string;
}
export interface CreateInvoiceInput {
    organizationId: UUID;
    branchId: UUID;
    invoiceType: InvoiceType;
    payerId: UUID;
    payerType: PayerType;
    payerName: string;
    clientId?: UUID;
    periodStart: Date;
    periodEnd: Date;
    invoiceDate: Date;
    dueDate: Date;
    billableItemIds: UUID[];
    notes?: string;
}
export interface CreatePaymentInput {
    organizationId: UUID;
    branchId: UUID;
    payerId: UUID;
    payerType: PayerType;
    payerName: string;
    amount: number;
    paymentDate: Date;
    receivedDate: Date;
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    notes?: string;
}
export interface AllocatePaymentInput {
    paymentId: UUID;
    allocations: {
        invoiceId: UUID;
        amount: number;
        notes?: string;
    }[];
}
export interface CreateRateScheduleInput {
    organizationId: UUID;
    branchId?: UUID;
    name: string;
    description?: string;
    scheduleType: RateScheduleType;
    payerId?: UUID;
    payerType?: PayerType;
    payerName?: string;
    effectiveFrom: Date;
    effectiveTo?: Date;
    rates: Omit<ServiceRate, 'id'>[];
    notes?: string;
}
export interface CreatePayerInput {
    organizationId: UUID;
    payerName: string;
    payerType: PayerType;
    payerCode?: string;
    nationalPayerId?: string;
    address?: Address;
    phone?: string;
    email?: string;
    billingAddress?: Address;
    billingEmail?: string;
    submissionMethod?: SubmissionMethod[];
    paymentTermsDays: number;
    requiresPreAuthorization: boolean;
    requiresReferral: boolean;
    notes?: string;
}
export interface CreateAuthorizationInput {
    organizationId: UUID;
    branchId: UUID;
    clientId: UUID;
    authorizationNumber: string;
    authorizationType: AuthorizationType;
    payerId: UUID;
    payerType: PayerType;
    payerName: string;
    serviceTypeId: UUID;
    serviceTypeCode: string;
    serviceTypeName: string;
    authorizedUnits: number;
    unitType: UnitType;
    unitRate?: number;
    effectiveFrom: Date;
    effectiveTo: Date;
    requiresReferral: boolean;
    referralNumber?: string;
    notes?: string;
}
export interface SubmitClaimInput {
    organizationId: UUID;
    branchId: UUID;
    invoiceId: UUID;
    claimType: ClaimType;
    claimFormat: ClaimFormat;
    submissionMethod: SubmissionMethod;
    notes?: string;
}
export interface BillableItemSearchFilters {
    organizationId?: UUID;
    branchId?: UUID;
    branchIds?: UUID[];
    clientId?: UUID;
    clientIds?: UUID[];
    caregiverId?: UUID;
    payerId?: UUID;
    payerType?: PayerType[];
    status?: BillableStatus[];
    serviceDate?: Date;
    startDate?: Date;
    endDate?: Date;
    isHold?: boolean;
    requiresReview?: boolean;
    isPaid?: boolean;
    isDenied?: boolean;
    invoiceId?: UUID;
}
export interface InvoiceSearchFilters {
    organizationId?: UUID;
    branchId?: UUID;
    branchIds?: UUID[];
    payerId?: UUID;
    payerType?: PayerType[];
    clientId?: UUID;
    status?: InvoiceStatus[];
    invoiceType?: InvoiceType[];
    startDate?: Date;
    endDate?: Date;
    isPastDue?: boolean;
    hasBalance?: boolean;
}
export interface PaymentSearchFilters {
    organizationId?: UUID;
    branchId?: UUID;
    payerId?: UUID;
    payerType?: PayerType[];
    status?: PaymentStatus[];
    paymentMethod?: PaymentMethod[];
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    isReconciled?: boolean;
}
export interface ClaimSearchFilters {
    organizationId?: UUID;
    branchId?: UUID;
    payerId?: UUID;
    clientId?: UUID;
    status?: ClaimStatus[];
    claimType?: ClaimType[];
    startDate?: Date;
    endDate?: Date;
    isDenied?: boolean;
    hasAppeal?: boolean;
}
//# sourceMappingURL=billing.d.ts.map