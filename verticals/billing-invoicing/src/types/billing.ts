/**
 * Billing & Invoicing domain model
 *
 * Transforms care delivery data (visits, time tracking, care plans) into
 * billable items, generates invoices for multiple payer types, tracks
 * claims submission and payment cycles, and provides revenue analytics.
 *
 * Key concepts:
 * - Billable Item: Unit of service that can be billed
 * - Invoice: Collection of line items for a specific payer
 * - Claim: Submission to insurance/Medicaid/Medicare
 * - Payment: Incoming payment from any source
 * - Rate Schedule: Pricing rules by service type and payer
 * - Adjustment: Corrections, write-offs, discounts
 */

import { Entity, SoftDeletable, UUID, Timestamp } from '@care-commons/core';

/**
 * Billable Item - Individual service occurrence ready for billing
 *
 * Created from completed visits, EVV records, and authorized services.
 * Links service delivery to financial transaction.
 */
export interface BillableItem extends Entity, SoftDeletable {
  organizationId: UUID;
  branchId: UUID;
  clientId: UUID;

  // Service reference
  visitId?: UUID; // May be null for non-visit items
  evvRecordId?: UUID; // Link to EVV for compliance
  serviceTypeId: UUID;
  serviceTypeCode: string; // e.g., CPT, HCPCS codes
  serviceTypeName: string;

  // Timing
  serviceDate: Date;
  startTime?: Timestamp;
  endTime?: Timestamp;
  durationMinutes: number;

  // Provider
  caregiverId?: UUID;
  caregiverName?: string;
  providerNPI?: string; // National Provider Identifier

  // Rates and pricing
  rateScheduleId?: UUID;
  unitType: UnitType;
  units: number; // Hours, visits, tasks, etc.
  unitRate: number; // Rate per unit
  subtotal: number; // units * unitRate

  // Modifiers
  modifiers?: BillingModifier[];
  adjustments?: BillableAdjustment[];
  finalAmount: number; // After modifiers and adjustments

  // Authorization
  authorizationId?: UUID;
  authorizationNumber?: string;
  isAuthorized: boolean;
  authorizationRemainingUnits?: number;

  // Payer
  payerId: UUID;
  payerType: PayerType;
  payerName: string;

  // Status
  status: BillableStatus;
  statusHistory: BillableStatusChange[];

  // Billing grouping
  invoiceId?: UUID;
  invoiceDate?: Date;
  claimId?: UUID;
  claimSubmittedDate?: Date;

  // Flags
  isHold: boolean; // Temporarily held from billing
  holdReason?: string;
  requiresReview: boolean;
  reviewReason?: string;

  // Denial handling
  isDenied: boolean;
  denialReason?: string;
  denialCode?: string;
  denialDate?: Date;
  isAppealable: boolean;

  // Payment tracking
  isPaid: boolean;
  paidAmount?: number;
  paidDate?: Date;
  paymentId?: UUID;

  // Metadata
  notes?: string;
  tags?: string[];
}

export type UnitType =
  | 'HOUR' // Hourly rate
  | 'VISIT' // Per visit
  | 'DAY' // Daily rate
  | 'WEEK' // Weekly rate
  | 'MONTH' // Monthly rate
  | 'TASK' // Per task
  | 'MILE' // Mileage
  | 'UNIT'; // Generic unit

export type BillableStatus =
  | 'PENDING' // Created, awaiting review
  | 'READY' // Ready for invoicing
  | 'INVOICED' // Included in invoice
  | 'SUBMITTED' // Claim submitted
  | 'PAID' // Payment received
  | 'PARTIAL_PAID' // Partially paid
  | 'DENIED' // Claim denied
  | 'APPEALED' // Denial appealed
  | 'ADJUSTED' // Adjusted after initial billing
  | 'VOIDED' // Cancelled/voided
  | 'HOLD'; // On hold

export type PayerType =
  | 'MEDICAID' // State Medicaid
  | 'MEDICARE' // Federal Medicare
  | 'MEDICARE_ADVANTAGE' // Medicare Advantage plan
  | 'PRIVATE_INSURANCE' // Private insurance
  | 'MANAGED_CARE' // Managed care organization
  | 'VETERANS_BENEFITS' // VA benefits
  | 'WORKERS_COMP' // Workers compensation
  | 'PRIVATE_PAY' // Direct client payment
  | 'GRANT' // Grant funding
  | 'OTHER';

export interface BillingModifier {
  code: string; // e.g., 'U1', 'UN', 'GT'
  description: string;
  multiplier?: number; // Rate adjustment
  addedAmount?: number; // Flat addition
}

export interface BillableAdjustment {
  id: UUID;
  adjustmentType: AdjustmentType;
  amount: number; // Positive or negative
  reason: string;
  appliedBy: UUID;
  appliedAt: Timestamp;
  notes?: string;
}

export type AdjustmentType =
  | 'DISCOUNT' // Client discount
  | 'WRITE_OFF' // Bad debt write-off
  | 'CORRECTION' // Billing error correction
  | 'CONTRACTUAL' // Contractual adjustment
  | 'COURTESY' // Courtesy adjustment
  | 'ROUNDING' // Rounding adjustment
  | 'OTHER';

export interface BillableStatusChange {
  id: UUID;
  fromStatus: BillableStatus | null;
  toStatus: BillableStatus;
  timestamp: Timestamp;
  changedBy: UUID;
  reason?: string;
  notes?: string;
}

/**
 * Invoice - Collection of billable items for a payer
 */
export interface Invoice extends Entity, SoftDeletable {
  organizationId: UUID;
  branchId: UUID;

  // Invoice identity
  invoiceNumber: string; // Human-readable
  invoiceType: InvoiceType;

  // Payer
  payerId: UUID;
  payerType: PayerType;
  payerName: string;
  payerAddress?: Address;

  // Client (for private pay)
  clientId?: UUID;
  clientName?: string;

  // Period
  periodStart: Date;
  periodEnd: Date;
  invoiceDate: Date;
  dueDate: Date;

  // Line items
  billableItemIds: UUID[];
  lineItems: InvoiceLineItem[];

  // Amounts
  subtotal: number;
  taxAmount: number;
  taxRate?: number;
  discountAmount: number;
  adjustmentAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;

  // Status
  status: InvoiceStatus;
  statusHistory: InvoiceStatusChange[];

  // Submission
  submittedDate?: Date;
  submittedBy?: UUID;
  submissionMethod?: SubmissionMethod;
  submissionConfirmation?: string;

  // Payment
  paymentTerms?: string;
  lateFeeRate?: number;
  payments: PaymentReference[];

  // Documents
  pdfUrl?: string;
  documentIds?: UUID[];

  // Claims (for insurance)
  claimIds?: UUID[];
  claimStatus?: ClaimStatus;

  // Metadata
  notes?: string;
  internalNotes?: string;
  tags?: string[];
}

export type InvoiceType =
  | 'STANDARD' // Regular invoice
  | 'INTERIM' // Mid-cycle billing
  | 'FINAL' // Final invoice
  | 'CREDIT' // Credit memo
  | 'PROFORMA' // Proforma invoice
  | 'STATEMENT'; // Account statement

export type InvoiceStatus =
  | 'DRAFT' // Being prepared
  | 'PENDING_REVIEW' // Awaiting approval
  | 'APPROVED' // Approved for submission
  | 'SENT' // Sent to payer
  | 'SUBMITTED' // Claim submitted (insurance)
  | 'PARTIALLY_PAID' // Partial payment received
  | 'PAID' // Fully paid
  | 'PAST_DUE' // Payment overdue
  | 'DISPUTED' // Payment disputed
  | 'CANCELLED' // Cancelled
  | 'VOIDED'; // Voided

export type SubmissionMethod =
  | 'EDI' // Electronic Data Interchange
  | 'CLEARINGHOUSE' // Through clearinghouse
  | 'PORTAL' // Payer portal
  | 'EMAIL' // Email
  | 'MAIL' // Postal mail
  | 'FAX' // Fax
  | 'IN_PERSON'; // In person delivery

export type ClaimStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PROCESSING'
  | 'APPROVED'
  | 'DENIED'
  | 'APPEALED'
  | 'RESUBMITTED';

export interface InvoiceLineItem {
  id: UUID;
  billableItemId: UUID;

  // Service
  serviceDate: Date;
  serviceCode: string;
  serviceDescription: string;

  // Provider
  providerName?: string;
  providerNPI?: string;

  // Pricing
  unitType: UnitType;
  units: number;
  unitRate: number;
  subtotal: number;
  adjustments: number;
  total: number;

  // Client reference (for statements)
  clientName?: string;
  clientId?: UUID;

  // Modifiers
  modifiers?: BillingModifier[];

  // Authorization
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

/**
 * Payment - Incoming payment from any source
 */
export interface Payment extends Entity {
  organizationId: UUID;
  branchId: UUID;

  // Payment identity
  paymentNumber: string;
  paymentType: PaymentType;

  // Payer
  payerId: UUID;
  payerType: PayerType;
  payerName: string;

  // Amount
  amount: number;
  currency: string; // ISO 4217 code

  // Date
  paymentDate: Date;
  receivedDate: Date;
  depositedDate?: Date;

  // Method
  paymentMethod: PaymentMethod;
  referenceNumber?: string; // Check number, transaction ID, etc.

  // Application
  allocations: PaymentAllocation[];
  unappliedAmount: number; // Amount not yet allocated

  // Bank information
  bankAccountId?: UUID;
  depositSlipNumber?: string;

  // Status
  status: PaymentStatus;
  statusHistory: PaymentStatusChange[];

  // Reconciliation
  isReconciled: boolean;
  reconciledDate?: Date;
  reconciledBy?: UUID;

  // Documents
  imageUrl?: string; // Image of check, etc.
  documentIds?: UUID[];

  // Metadata
  notes?: string;
  internalNotes?: string;
}

export type PaymentType =
  | 'FULL' // Full payment
  | 'PARTIAL' // Partial payment
  | 'DEPOSIT' // Advance payment
  | 'REFUND' // Refund payment
  | 'ADJUSTMENT'; // Payment adjustment

export type PaymentMethod =
  | 'CHECK' // Paper check
  | 'EFT' // Electronic funds transfer
  | 'ACH' // ACH transfer
  | 'WIRE' // Wire transfer
  | 'CREDIT_CARD' // Credit card
  | 'DEBIT_CARD' // Debit card
  | 'CASH' // Cash
  | 'MONEY_ORDER' // Money order
  | 'ERA'; // Electronic remittance advice

export type PaymentStatus =
  | 'PENDING' // Awaiting processing
  | 'RECEIVED' // Received but not applied
  | 'APPLIED' // Applied to invoices
  | 'DEPOSITED' // Deposited to bank
  | 'CLEARED' // Cleared by bank
  | 'RETURNED' // Payment returned (NSF, etc.)
  | 'VOIDED' // Voided
  | 'REFUNDED'; // Refunded

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

/**
 * Rate Schedule - Pricing rules by service and payer
 */
export interface RateSchedule extends Entity {
  organizationId: UUID;
  branchId?: UUID;

  // Identity
  name: string;
  description?: string;
  scheduleType: RateScheduleType;

  // Payer
  payerId?: UUID; // Null for default schedule
  payerType?: PayerType;
  payerName?: string;

  // Effective dates
  effectiveFrom: Date;
  effectiveTo?: Date;

  // Rates
  rates: ServiceRate[];

  // Status
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

  // Approval
  approvedBy?: UUID;
  approvedAt?: Timestamp;

  // Metadata
  notes?: string;
}

export type RateScheduleType =
  | 'STANDARD' // Standard organizational rates
  | 'PAYER_SPECIFIC' // Payer contract rates
  | 'CLIENT_SPECIFIC' // Individual client rates
  | 'PROGRAM' // Program-specific rates
  | 'PROMOTIONAL'; // Temporary promotional rates

export interface ServiceRate {
  id: UUID;
  serviceTypeId: UUID;
  serviceTypeCode: string;
  serviceTypeName: string;

  // Rate
  unitType: UnitType;
  unitRate: number;

  // Optional overrides
  minimumUnits?: number;
  maximumUnits?: number;
  minimumCharge?: number;
  roundingRule?: RoundingRule;

  // Time-based modifiers
  weekendRate?: number; // Multiplier for weekends
  holidayRate?: number; // Multiplier for holidays
  nightRate?: number; // Multiplier for night shift
  overtimeRate?: number; // Multiplier for overtime

  // Geographic modifiers
  ruralRate?: number; // Adjustment for rural areas
  urbanRate?: number; // Adjustment for urban areas

  // Effective dates (within schedule)
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export type RoundingRule =
  | 'NONE' // No rounding
  | 'UP' // Always round up
  | 'DOWN' // Always round down
  | 'NEAREST' // Round to nearest
  | 'QUARTER_HOUR' // Round to 15-minute increments
  | 'HALF_HOUR'; // Round to 30-minute increments

/**
 * Payer - Insurance company, agency, or individual paying for services
 */
export interface Payer extends Entity, SoftDeletable {
  organizationId: UUID;

  // Identity
  payerName: string;
  payerType: PayerType;
  payerCode?: string; // Internal code

  // External identifiers
  nationalPayerId?: string; // National payer ID
  medicaidProviderId?: string;
  medicareProviderId?: string;
  taxId?: string; // EIN

  // Contact
  address?: Address;
  phone?: string;
  fax?: string;
  email?: string;
  website?: string;

  // Billing
  billingAddress?: Address;
  billingEmail?: string;
  billingPortalUrl?: string;
  submissionMethod?: SubmissionMethod[];
  ediPayerId?: string; // For EDI submissions
  clearinghouseId?: UUID;

  // Terms
  paymentTermsDays: number; // Net days
  requiresPreAuthorization: boolean;
  requiresReferral: boolean;
  claimFilingLimit?: number; // Days to file claim

  // Rates
  defaultRateScheduleId?: UUID;

  // Status
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED';

  // Performance
  averagePaymentDays?: number;
  denialRate?: number; // Percentage

  // Metadata
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

/**
 * Authorization - Pre-approval for services
 */
export interface ServiceAuthorization extends Entity, SoftDeletable {
  organizationId: UUID;
  branchId: UUID;
  clientId: UUID;

  // Authorization identity
  authorizationNumber: string;
  authorizationType: AuthorizationType;

  // Payer
  payerId: UUID;
  payerType: PayerType;
  payerName: string;

  // Service
  serviceTypeId: UUID;
  serviceTypeCode: string;
  serviceTypeName: string;

  // Authorized amounts
  authorizedUnits: number;
  unitType: UnitType;
  unitRate?: number;
  authorizedAmount?: number;

  // Period
  effectiveFrom: Date;
  effectiveTo: Date;

  // Usage tracking
  usedUnits: number;
  remainingUnits: number;
  billedUnits: number;

  // Restrictions
  requiresReferral: boolean;
  referralNumber?: string;
  allowedProviders?: UUID[]; // Specific caregivers only
  locationRestrictions?: string;

  // Status
  status: AuthorizationStatus;
  statusHistory: AuthorizationStatusChange[];

  // Review
  reviewedBy?: UUID;
  reviewedAt?: Timestamp;
  reviewNotes?: string;

  // Alerts
  lowUnitsThreshold?: number; // Alert when units drop below this
  expirationWarningDays?: number; // Alert days before expiration

  // Documents
  documentIds?: UUID[];

  // Metadata
  notes?: string;
  internalNotes?: string;
}

export type AuthorizationType =
  | 'INITIAL' // Initial authorization
  | 'RENEWAL' // Renewal of existing auth
  | 'MODIFICATION' // Modified existing auth
  | 'EMERGENCY' // Emergency authorization
  | 'TEMPORARY'; // Temporary authorization

export type AuthorizationStatus =
  | 'PENDING' // Awaiting approval
  | 'ACTIVE' // Active and available
  | 'DEPLETED' // All units used
  | 'EXPIRED' // Past end date
  | 'SUSPENDED' // Temporarily suspended
  | 'CANCELLED' // Cancelled
  | 'DENIED'; // Denied by payer

export interface AuthorizationStatusChange {
  id: UUID;
  fromStatus: AuthorizationStatus | null;
  toStatus: AuthorizationStatus;
  timestamp: Timestamp;
  changedBy: UUID;
  reason?: string;
  notes?: string;
}

/**
 * Claim - Submission to insurance payer
 */
export interface Claim extends Entity {
  organizationId: UUID;
  branchId: UUID;

  // Claim identity
  claimNumber: string;
  claimType: ClaimType;
  claimFormat: ClaimFormat;

  // Payer
  payerId: UUID;
  payerType: PayerType;
  payerName: string;

  // Patient
  clientId: UUID;
  clientName: string;

  // Invoice
  invoiceId: UUID;
  invoiceNumber: string;

  // Billable items
  billableItemIds: UUID[];
  lineItems: ClaimLineItem[];

  // Amounts
  totalCharges: number;
  totalApproved?: number;
  totalPaid?: number;
  totalAdjustments?: number;
  patientResponsibility?: number;

  // Submission
  submittedDate: Date;
  submittedBy: UUID;
  submissionMethod: SubmissionMethod;
  submissionBatchId?: UUID;
  controlNumber?: string; // Payer-assigned control number

  // Processing
  status: ClaimStatus;
  statusHistory: ClaimStatusChange[];
  processingDate?: Date;
  paymentDate?: Date;

  // Denial/rejection
  denialReason?: string;
  denialCode?: string;
  denialDate?: Date;
  isAppealable: boolean;
  appealDeadline?: Date;

  // Appeal
  appealId?: UUID;
  appealSubmittedDate?: Date;
  appealStatus?: AppealStatus;

  // ERA (Electronic Remittance Advice)
  eraReceived: boolean;
  eraReceivedDate?: Date;
  eraDocumentId?: UUID;

  // Documents
  claimFormUrl?: string; // CMS-1500, UB-04, etc.
  supportingDocumentIds?: UUID[];

  // Metadata
  notes?: string;
  internalNotes?: string;
}

export type ClaimType =
  | 'PROFESSIONAL' // CMS-1500
  | 'INSTITUTIONAL' // UB-04
  | 'DENTAL' // ADA form
  | 'PHARMACY' // Pharmacy claim
  | 'VISION'; // Vision claim

export type ClaimFormat =
  | 'CMS_1500' // Standard professional claim
  | 'UB_04' // Institutional claim
  | 'EDI_837P' // Electronic professional
  | 'EDI_837I' // Electronic institutional
  | 'PROPRIETARY'; // Payer-specific format

export type AppealStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'DENIED'
  | 'ABANDONED';

export interface ClaimLineItem {
  id: UUID;
  billableItemId: UUID;
  lineNumber: number;

  // Service
  serviceDate: Date;
  serviceCode: string; // CPT, HCPCS
  serviceDescription: string;

  // Location
  placeOfService: string; // Place of service code

  // Provider
  providerNPI: string;
  providerName: string;

  // Charges
  unitType: UnitType;
  units: number;
  chargeAmount: number;
  approvedAmount?: number;
  paidAmount?: number;
  adjustmentAmount?: number;

  // Modifiers
  modifiers?: BillingModifier[];

  // Authorization
  authorizationNumber?: string;

  // Diagnosis
  diagnosisCodes?: string[]; // ICD-10 codes

  // Status
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
  changedBy?: UUID; // May be system-updated
  automatic: boolean;
  reason?: string;
  notes?: string;
}

/**
 * Billing Report - Summary analytics
 */
export interface BillingReport extends Entity {
  organizationId: UUID;
  branchId?: UUID;

  // Report identity
  reportType: BillingReportType;
  reportPeriod: ReportPeriod;

  // Summary
  totalBillable: number;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  totalDenied: number;
  totalAdjustments: number;

  // Breakdowns
  byPayer?: Record<UUID, PayerSummary>;
  byServiceType?: Record<UUID, ServiceTypeSummary>;
  byClient?: Record<UUID, ClientSummary>;

  // Metrics
  collectionRate: number; // Percentage
  denialRate: number; // Percentage
  daysToPayment: number; // Average

  // Generation
  generatedAt: Timestamp;
  generatedBy: UUID;

  // Export
  exportUrl?: string;
  exportFormat?: 'PDF' | 'CSV' | 'EXCEL' | 'JSON';
}

export type BillingReportType =
  | 'REVENUE' // Revenue summary
  | 'AGING' // Accounts receivable aging
  | 'PAYER_PERFORMANCE' // Payer performance
  | 'SERVICE_ANALYSIS' // Service type analysis
  | 'DENIAL_ANALYSIS' // Denial trends
  | 'COLLECTION' // Collection report
  | 'FORECAST'; // Revenue forecast

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

/**
 * Input types for operations
 */

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

/**
 * Search and filter types
 */

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
