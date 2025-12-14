/**
 * Family Billing Transparency Service
 *
 * Provides clear, understandable billing information for family members.
 * No surprise charges. Full line-item detail.
 *
 * Requirements:
 * - Family member must have VIEW_FINANCIAL access level
 * - All amounts shown with full breakdown
 * - Clear service descriptions
 * - Payment history accessible
 * - Authorization status visible
 */

import type { UUID } from '@folkcare/core';
import type {
  FamilyMember,
  FamilyInvoiceSummary,
  FamilyInvoiceLineItem,
  FamilyPaymentRecord,
  FamilyBillingStatement,
  FamilyBillingDashboard,
  FamilyAuthorizationStatus,
  FamilyAuthorizationAlert,
  FamilyServiceChargeBreakdown,
  FamilyBillingQueryInput,
  FamilyInvoiceStatus,
  ServiceUnitType,
  BillingPayerType,
  PaymentMethodType,
  FamilyInvoiceHistoryEntry,
  FamilyInvoiceHistoryResponse,
  InvoiceDownloadRequest,
  InvoiceDownloadResponse,
  BulkInvoiceDownloadRequest,
  BulkInvoiceDownloadResponse,
  StatementDownloadRequest,
  StatementDownloadResponse,
  InvoicePDFData,
} from '../types/family-engagement.js';

/**
 * Error thrown when family member lacks billing access
 */
export class BillingAccessDeniedError extends Error {
  constructor(familyMemberId: UUID) {
    super(`Family member ${familyMemberId} does not have VIEW_FINANCIAL access`);
    this.name = 'BillingAccessDeniedError';
  }
}

/**
 * Minimal repository interface for billing data
 * In production, this would integrate with the billing-invoicing vertical
 */
export interface BillingDataRepository {
  getInvoicesForClient(
    clientId: UUID,
    organizationId: UUID,
    filters?: {
      startDate?: string;
      endDate?: string;
      status?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<RawInvoiceData[]>;

  getInvoicesCount(
    clientId: UUID,
    organizationId: UUID,
    filters?: {
      startDate?: string;
      endDate?: string;
      status?: string[];
    }
  ): Promise<number>;

  getPaymentsForClient(
    clientId: UUID,
    organizationId: UUID,
    filters?: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<RawPaymentData[]>;

  getAuthorizationsForClient(
    clientId: UUID,
    organizationId: UUID
  ): Promise<RawAuthorizationData[]>;

  getClientBalance(
    clientId: UUID,
    organizationId: UUID
  ): Promise<RawBalanceData>;

  getOrganizationInfo(
    organizationId: UUID
  ): Promise<OrganizationBillingInfo>;
}

/**
 * Organization billing info for invoice PDFs
 */
interface OrganizationBillingInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId?: string;
  logo?: string;
}

/**
 * Raw invoice data from billing system
 */
interface RawInvoiceData {
  id: UUID;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  payerId: UUID;
  payerType: string;
  payerName: string;
  clientId: UUID;
  clientName: string;
  lineItems: RawLineItemData[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  adjustmentAmount: number;
  adjustmentNotes?: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: string;
  servicePeriodStart: string;
  servicePeriodEnd: string;
  organizationId: UUID;
}

/**
 * Raw line item data
 */
interface RawLineItemData {
  id: UUID;
  serviceDate: string;
  serviceCode: string;
  serviceDescription: string;
  providerName: string;
  unitType: string;
  units: number;
  unitRate: number;
  subtotal: number;
  adjustments: number;
  total: number;
  notes?: string;
}

/**
 * Raw payment data from billing system
 */
interface RawPaymentData {
  id: UUID;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  payerName: string;
  invoiceNumber?: string;
  invoiceId?: UUID;
  checkNumber?: string;
  referenceNumber?: string;
  status: string;
  notes?: string;
}

/**
 * Raw authorization data
 */
interface RawAuthorizationData {
  id: UUID;
  authorizationNumber: string;
  payerName: string;
  serviceTypeCode: string;
  serviceTypeName: string;
  effectiveFrom: string;
  effectiveTo: string;
  authorizedUnits: number;
  usedUnits: number;
  remainingUnits: number;
  unitType: string;
  status: string;
}

/**
 * Raw balance data
 */
interface RawBalanceData {
  currentBalance: number;
  current: number;
  days31to60: number;
  days61to90: number;
  over90Days: number;
}

/**
 * Family member repository interface
 */
export interface FamilyMemberAccessRepository {
  getFamilyMemberById(id: UUID): Promise<FamilyMember | null>;
  getFamilyMemberForClient(
    familyMemberId: UUID,
    clientId: UUID
  ): Promise<FamilyMember | null>;
}

/**
 * Service for providing billing transparency to family members
 */
export class FamilyBillingTransparencyService {
  constructor(
    private familyMemberRepo: FamilyMemberAccessRepository,
    private billingRepo: BillingDataRepository
  ) {}

  /**
   * Verify family member has VIEW_FINANCIAL access
   */
  private async verifyBillingAccess(
    familyMemberId: UUID,
    clientId: UUID
  ): Promise<FamilyMember> {
    const familyMember = await this.familyMemberRepo.getFamilyMemberForClient(
      familyMemberId,
      clientId
    );

    if (familyMember === null) {
      throw new BillingAccessDeniedError(familyMemberId);
    }

    if (
      familyMember.status !== 'ACTIVE' ||
      familyMember.invitationStatus !== 'ACCEPTED'
    ) {
      throw new BillingAccessDeniedError(familyMemberId);
    }

    // Check for VIEW_FINANCIAL or FULL_ACCESS
    const hasFinancialAccess =
      familyMember.portalAccessLevel === 'VIEW_FINANCIAL' ||
      familyMember.portalAccessLevel === 'FULL_ACCESS';

    if (!hasFinancialAccess) {
      throw new BillingAccessDeniedError(familyMemberId);
    }

    return familyMember;
  }

  /**
   * Get billing dashboard for family
   * Overview of current balance, recent activity, and alerts
   */
  async getBillingDashboard(
    input: FamilyBillingQueryInput
  ): Promise<FamilyBillingDashboard> {
    const familyMember = await this.verifyBillingAccess(
      input.familyMemberId,
      input.clientId
    );

    const organizationId = familyMember.organizationId;

    // Fetch data in parallel
    const [balanceData, recentInvoices, recentPayments, authorizations] =
      await Promise.all([
        this.billingRepo.getClientBalance(input.clientId, organizationId),
        this.billingRepo.getInvoicesForClient(input.clientId, organizationId, {
          limit: 5,
        }),
        this.billingRepo.getPaymentsForClient(input.clientId, organizationId, {
          limit: 5,
        }),
        this.billingRepo.getAuthorizationsForClient(
          input.clientId,
          organizationId
        ),
      ]);

    // Find next payment due
    const unpaidInvoices = recentInvoices.filter(
      (inv) => inv.balanceDue > 0 && inv.status !== 'PAID'
    );
    const nextDue = unpaidInvoices.length > 0 ? unpaidInvoices[0] : undefined;

    // Process authorizations and generate alerts
    const processedAuths = authorizations.map((auth) =>
      this.processAuthorization(auth)
    );
    const authAlerts = processedAuths.flatMap((auth) => auth.alerts);

    // Calculate YTD totals
    const currentYear = new Date().getFullYear();
    const ytdStart = `${currentYear}-01-01`;
    const ytdInvoices = await this.billingRepo.getInvoicesForClient(
      input.clientId,
      organizationId,
      { startDate: ytdStart }
    );
    const ytdPayments = await this.billingRepo.getPaymentsForClient(
      input.clientId,
      organizationId,
      { startDate: ytdStart }
    );

    const ytdTotalCharges = ytdInvoices.reduce(
      (sum, inv) => sum + inv.totalAmount,
      0
    );
    const ytdTotalPayments = ytdPayments.reduce(
      (sum, pay) => sum + pay.amount,
      0
    );
    const ytdInsurancePaid = ytdPayments
      .filter((p) => p.paymentMethod === 'ERA' || p.paymentMethod === 'EFT')
      .reduce((sum, pay) => sum + pay.amount, 0);

    return {
      clientId: input.clientId,
      clientName: recentInvoices[0]?.clientName ?? 'Unknown',
      currentBalance: balanceData.currentBalance,
      pastDueBalance:
        balanceData.days31to60 +
        balanceData.days61to90 +
        balanceData.over90Days,
      nextPaymentDueDate: nextDue?.dueDate,
      nextPaymentAmount: nextDue?.balanceDue,
      recentInvoices: recentInvoices.map((inv) => this.transformInvoice(inv)),
      recentPayments: recentPayments.map((pay) => this.transformPayment(pay)),
      authorizations: processedAuths,
      authorizationAlerts: authAlerts,
      ytdTotalCharges,
      ytdTotalPayments,
      ytdInsurancePaid,
      ytdClientResponsibility: ytdTotalCharges - ytdInsurancePaid,
      acceptedPaymentMethods: [
        'CHECK',
        'CREDIT_CARD',
        'DEBIT_CARD',
        'ACH',
      ] as PaymentMethodType[],
      paymentInstructions:
        'Payments can be made online through the payment portal or by mailing a check to our billing address.',
      organizationId,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get invoices for family member
   * Full line-item detail for transparency
   */
  async getInvoices(
    input: FamilyBillingQueryInput
  ): Promise<FamilyInvoiceSummary[]> {
    const familyMember = await this.verifyBillingAccess(
      input.familyMemberId,
      input.clientId
    );

    const invoices = await this.billingRepo.getInvoicesForClient(
      input.clientId,
      familyMember.organizationId,
      {
        startDate: input.startDate,
        endDate: input.endDate,
        status: input.status,
        limit: input.limit ?? 20,
        offset: input.offset ?? 0,
      }
    );

    return invoices.map((inv) => this.transformInvoice(inv));
  }

  /**
   * Get single invoice with full detail
   */
  async getInvoiceDetail(
    familyMemberId: UUID,
    clientId: UUID,
    invoiceId: UUID
  ): Promise<FamilyInvoiceSummary | null> {
    const familyMember = await this.verifyBillingAccess(
      familyMemberId,
      clientId
    );

    const invoices = await this.billingRepo.getInvoicesForClient(
      clientId,
      familyMember.organizationId
    );

    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (invoice === undefined) {
      return null;
    }

    return this.transformInvoice(invoice);
  }

  /**
   * Get payment history for family
   */
  async getPaymentHistory(
    input: FamilyBillingQueryInput
  ): Promise<FamilyPaymentRecord[]> {
    const familyMember = await this.verifyBillingAccess(
      input.familyMemberId,
      input.clientId
    );

    const payments = await this.billingRepo.getPaymentsForClient(
      input.clientId,
      familyMember.organizationId,
      {
        startDate: input.startDate,
        endDate: input.endDate,
        limit: input.limit ?? 50,
      }
    );

    return payments.map((pay) => this.transformPayment(pay));
  }

  /**
   * Get billing statement for a period
   */
  async getBillingStatement(
    familyMemberId: UUID,
    clientId: UUID,
    periodStart: string,
    periodEnd: string
  ): Promise<FamilyBillingStatement> {
    const familyMember = await this.verifyBillingAccess(
      familyMemberId,
      clientId
    );

    const organizationId = familyMember.organizationId;

    // Get data for the period
    const [invoices, payments, balanceData] = await Promise.all([
      this.billingRepo.getInvoicesForClient(clientId, organizationId, {
        startDate: periodStart,
        endDate: periodEnd,
      }),
      this.billingRepo.getPaymentsForClient(clientId, organizationId, {
        startDate: periodStart,
        endDate: periodEnd,
      }),
      this.billingRepo.getClientBalance(clientId, organizationId),
    ]);

    // Calculate totals
    const newCharges = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const paymentsReceived = payments.reduce((sum, pay) => sum + pay.amount, 0);
    const adjustments = invoices.reduce(
      (sum, inv) => sum + inv.adjustmentAmount,
      0
    );

    // Group charges by service type
    const chargesByService = this.calculateChargesByService(invoices);

    return {
      statementId: `stmt-${Date.now()}` as UUID,
      statementDate: new Date().toISOString().slice(0, 10),
      statementPeriodStart: periodStart,
      statementPeriodEnd: periodEnd,
      clientId,
      clientName: invoices[0]?.clientName ?? 'Unknown',
      previousBalance: balanceData.currentBalance - newCharges + paymentsReceived,
      newCharges,
      paymentsReceived,
      adjustments,
      currentBalance: balanceData.currentBalance,
      chargesByService,
      invoicesIncluded: invoices.map((inv) => this.transformInvoice(inv)),
      paymentsIncluded: payments.map((pay) => this.transformPayment(pay)),
      aging: {
        current: balanceData.current,
        days31to60: balanceData.days31to60,
        days61to90: balanceData.days61to90,
        over90Days: balanceData.over90Days,
        totalPastDue:
          balanceData.days31to60 +
          balanceData.days61to90 +
          balanceData.over90Days,
      },
      organizationId,
    };
  }

  /**
   * Get authorization status for family
   */
  async getAuthorizationStatus(
    familyMemberId: UUID,
    clientId: UUID
  ): Promise<FamilyAuthorizationStatus[]> {
    const familyMember = await this.verifyBillingAccess(
      familyMemberId,
      clientId
    );

    const authorizations = await this.billingRepo.getAuthorizationsForClient(
      clientId,
      familyMember.organizationId
    );

    return authorizations.map((auth) => this.processAuthorization(auth));
  }

  // ============================================================================
  // Invoice History & Download Methods
  // ============================================================================

  /**
   * Get paginated invoice history with download availability
   */
  async getInvoiceHistory(
    familyMemberId: UUID,
    clientId: UUID,
    options?: {
      page?: number;
      pageSize?: number;
      startDate?: string;
      endDate?: string;
      status?: FamilyInvoiceStatus[];
    }
  ): Promise<FamilyInvoiceHistoryResponse> {
    const familyMember = await this.verifyBillingAccess(
      familyMemberId,
      clientId
    );

    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const organizationId = familyMember.organizationId;

    // Get invoices and count in parallel
    const [invoices, totalCount] = await Promise.all([
      this.billingRepo.getInvoicesForClient(clientId, organizationId, {
        startDate: options?.startDate,
        endDate: options?.endDate,
        status: options?.status,
        limit: pageSize,
        offset,
      }),
      this.billingRepo.getInvoicesCount(clientId, organizationId, {
        startDate: options?.startDate,
        endDate: options?.endDate,
        status: options?.status,
      }),
    ]);

    // Transform invoices to history entries with download info
    const historyEntries: FamilyInvoiceHistoryEntry[] = invoices.map((inv) => ({
      ...this.transformInvoice(inv),
      pdfAvailable: true, // PDFs available for all invoices
      downloadUrl: undefined, // Generated on-demand
      downloadExpiresAt: undefined,
      viewedAt: undefined, // Would come from tracking table
      downloadedAt: undefined, // Would come from tracking table
    }));

    // Calculate summary
    const allInvoices = await this.billingRepo.getInvoicesForClient(
      clientId,
      organizationId,
      { startDate: options?.startDate, endDate: options?.endDate }
    );

    const summary = {
      totalInvoices: totalCount,
      totalAmount: allInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      paidAmount: allInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
      pendingAmount: allInvoices
        .filter((inv) => inv.status !== 'PAID')
        .reduce((sum, inv) => sum + inv.balanceDue, 0),
      overdueAmount: allInvoices
        .filter((inv) => inv.status === 'PAST_DUE')
        .reduce((sum, inv) => sum + inv.balanceDue, 0),
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      invoices: historyEntries,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      summary,
    };
  }

  /**
   * Generate a download URL for a single invoice
   */
  async generateInvoiceDownload(
    request: InvoiceDownloadRequest
  ): Promise<InvoiceDownloadResponse> {
    await this.verifyBillingAccess(request.familyMemberId, request.clientId);

    // Generate download URL (in production, this would create actual PDF)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const fileName = `invoice-${request.invoiceId}.${request.format.toLowerCase()}`;

    // In production, this would:
    // 1. Fetch invoice data
    // 2. Generate PDF using a PDF library
    // 3. Upload to cloud storage
    // 4. Return signed URL

    return {
      invoiceId: request.invoiceId,
      downloadUrl: `/api/family-billing/download/${request.invoiceId}?format=${request.format}`,
      expiresAt,
      format: request.format,
      fileName,
      fileSizeBytes: 0, // Would be actual size after generation
      status: 'READY',
    };
  }

  /**
   * Generate a bulk download for multiple invoices
   */
  async generateBulkInvoiceDownload(
    request: BulkInvoiceDownloadRequest
  ): Promise<BulkInvoiceDownloadResponse> {
    await this.verifyBillingAccess(request.familyMemberId, request.clientId);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const fileName = request.combineIntoSingle
      ? `invoices-combined.${request.format.toLowerCase()}`
      : `invoices-${Date.now()}.zip`;

    // In production, this would:
    // 1. Queue a background job to generate PDFs
    // 2. Combine or ZIP the files
    // 3. Return status with job ID for polling

    return {
      downloadUrl: `/api/family-billing/download/bulk?ids=${request.invoiceIds.join(',')}`,
      expiresAt,
      format: request.format,
      fileName,
      fileSizeBytes: 0,
      status: 'GENERATING',
      invoiceCount: request.invoiceIds.length,
    };
  }

  /**
   * Generate a statement download for a period
   */
  async generateStatementDownload(
    request: StatementDownloadRequest
  ): Promise<StatementDownloadResponse> {
    await this.verifyBillingAccess(request.familyMemberId, request.clientId);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const fileName = `statement-${request.periodStart}-to-${request.periodEnd}.${request.format.toLowerCase()}`;

    return {
      downloadUrl: `/api/family-billing/download/statement?start=${request.periodStart}&end=${request.periodEnd}`,
      expiresAt,
      format: request.format,
      fileName,
      fileSizeBytes: 0,
      status: 'GENERATING',
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
    };
  }

  /**
   * Get invoice PDF data for rendering
   * Used by PDF generation service
   */
  async getInvoicePDFData(
    familyMemberId: UUID,
    clientId: UUID,
    invoiceId: UUID
  ): Promise<InvoicePDFData | null> {
    const familyMember = await this.verifyBillingAccess(
      familyMemberId,
      clientId
    );

    const organizationId = familyMember.organizationId;

    // Get invoice and organization info
    const [invoices, orgInfo] = await Promise.all([
      this.billingRepo.getInvoicesForClient(clientId, organizationId),
      this.billingRepo.getOrganizationInfo(organizationId),
    ]);

    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (invoice === undefined) {
      return null;
    }

    return {
      invoice: this.transformInvoice(invoice),
      organizationInfo: {
        name: orgInfo.name,
        address: orgInfo.address,
        phone: orgInfo.phone,
        email: orgInfo.email,
        taxId: orgInfo.taxId,
        logo: orgInfo.logo,
      },
      clientInfo: {
        name: invoice.clientName,
      },
      paymentInstructions:
        'Payment is due within 30 days. Please include the invoice number with your payment.',
      footerText:
        'Thank you for choosing our care services. If you have questions about this invoice, please contact our billing department.',
    };
  }

  /**
   * Transform raw invoice to family-friendly format
   */
  private transformInvoice(raw: RawInvoiceData): FamilyInvoiceSummary {
    return {
      id: raw.id,
      invoiceNumber: raw.invoiceNumber,
      invoiceDate: raw.invoiceDate,
      dueDate: raw.dueDate,
      payerType: this.mapPayerType(raw.payerType),
      payerName: raw.payerName,
      lineItems: raw.lineItems.map((item) => this.transformLineItem(item)),
      subtotal: raw.subtotal,
      taxAmount: raw.taxAmount,
      discountAmount: raw.discountAmount,
      adjustmentAmount: raw.adjustmentAmount,
      adjustmentDescription: raw.adjustmentNotes,
      totalAmount: raw.totalAmount,
      paidAmount: raw.paidAmount,
      balanceDue: raw.balanceDue,
      status: this.mapInvoiceStatus(raw.status),
      servicePeriodStart: raw.servicePeriodStart,
      servicePeriodEnd: raw.servicePeriodEnd,
      clientId: raw.clientId,
      clientName: raw.clientName,
      organizationId: raw.organizationId,
    };
  }

  /**
   * Transform raw line item to family-friendly format
   */
  private transformLineItem(raw: RawLineItemData): FamilyInvoiceLineItem {
    return {
      id: raw.id,
      serviceDate: raw.serviceDate,
      serviceDescription: raw.serviceDescription,
      caregiverName: raw.providerName,
      unitType: this.mapUnitType(raw.unitType),
      units: raw.units,
      unitRate: raw.unitRate,
      subtotal: raw.subtotal,
      adjustments: raw.adjustments,
      total: raw.total,
      notes: raw.notes,
    };
  }

  /**
   * Transform raw payment to family-friendly format
   */
  private transformPayment(raw: RawPaymentData): FamilyPaymentRecord {
    return {
      id: raw.id,
      paymentDate: raw.paymentDate,
      amount: raw.amount,
      paymentMethod: this.mapPaymentMethod(raw.paymentMethod),
      payerName: raw.payerName,
      invoiceNumber: raw.invoiceNumber,
      invoiceId: raw.invoiceId,
      confirmationNumber: raw.referenceNumber ?? raw.checkNumber,
      status: this.mapPaymentStatus(raw.status),
      notes: raw.notes,
    };
  }

  /**
   * Process authorization and generate alerts
   */
  private processAuthorization(
    raw: RawAuthorizationData
  ): FamilyAuthorizationStatus {
    const today = new Date();
    const effectiveTo = new Date(raw.effectiveTo);
    const daysRemaining = Math.ceil(
      (effectiveTo.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const percentUsed =
      raw.authorizedUnits > 0
        ? Math.round((raw.usedUnits / raw.authorizedUnits) * 100)
        : 0;

    const alerts: FamilyAuthorizationAlert[] = [];

    // Generate alerts
    if (daysRemaining <= 0) {
      alerts.push({
        alertType: 'EXPIRED',
        message: `Authorization expired on ${raw.effectiveTo}`,
        severity: 'URGENT',
      });
    } else if (daysRemaining <= 30) {
      alerts.push({
        alertType: 'EXPIRING_SOON',
        message: `Authorization expires in ${daysRemaining} days`,
        severity: 'WARNING',
      });
    }

    if (raw.remainingUnits <= 0) {
      alerts.push({
        alertType: 'RENEWAL_NEEDED',
        message: 'All authorized units have been used',
        severity: 'URGENT',
      });
    } else if (percentUsed >= 80) {
      alerts.push({
        alertType: 'UNITS_LOW',
        message: `Only ${raw.remainingUnits} units remaining (${100 - percentUsed}%)`,
        severity: 'WARNING',
      });
    }

    // Determine status
    let status: 'ACTIVE' | 'EXPIRING_SOON' | 'DEPLETED' | 'EXPIRED';
    if (daysRemaining <= 0) {
      status = 'EXPIRED';
    } else if (raw.remainingUnits <= 0) {
      status = 'DEPLETED';
    } else if (daysRemaining <= 30 || percentUsed >= 80) {
      status = 'EXPIRING_SOON';
    } else {
      status = 'ACTIVE';
    }

    return {
      id: raw.id,
      authorizationNumber: raw.authorizationNumber,
      payerName: raw.payerName,
      serviceType: raw.serviceTypeCode,
      serviceDescription: raw.serviceTypeName,
      effectiveFrom: raw.effectiveFrom,
      effectiveTo: raw.effectiveTo,
      authorizedUnits: raw.authorizedUnits,
      usedUnits: raw.usedUnits,
      remainingUnits: raw.remainingUnits,
      unitType: this.mapUnitType(raw.unitType),
      status,
      percentUsed,
      daysRemaining: Math.max(0, daysRemaining),
      alerts,
    };
  }

  /**
   * Calculate charges grouped by service type
   */
  private calculateChargesByService(
    invoices: RawInvoiceData[]
  ): FamilyServiceChargeBreakdown[] {
    const serviceMap = new Map<
      string,
      {
        serviceType: string;
        serviceDescription: string;
        totalHours: number;
        totalUnits: number;
        unitType: string;
        totalRate: number;
        count: number;
        totalAmount: number;
      }
    >();

    for (const invoice of invoices) {
      for (const item of invoice.lineItems) {
        const key = item.serviceCode;
        const existing = serviceMap.get(key);

        if (existing !== undefined) {
          existing.totalUnits += item.units;
          existing.totalRate += item.unitRate;
          existing.count += 1;
          existing.totalAmount += item.total;
          if (item.unitType === 'HOUR') {
            existing.totalHours += item.units;
          }
        } else {
          serviceMap.set(key, {
            serviceType: item.serviceCode,
            serviceDescription: item.serviceDescription,
            totalHours: item.unitType === 'HOUR' ? item.units : 0,
            totalUnits: item.units,
            unitType: item.unitType,
            totalRate: item.unitRate,
            count: 1,
            totalAmount: item.total,
          });
        }
      }
    }

    return Array.from(serviceMap.values()).map((svc) => ({
      serviceType: svc.serviceType,
      serviceDescription: svc.serviceDescription,
      totalHours: svc.totalHours > 0 ? svc.totalHours : undefined,
      totalUnits: svc.totalUnits,
      unitType: this.mapUnitType(svc.unitType),
      averageRate: svc.count > 0 ? svc.totalRate / svc.count : 0,
      totalAmount: svc.totalAmount,
    }));
  }

  /**
   * Map raw payer type to family-friendly type
   */
  private mapPayerType(raw: string): BillingPayerType {
    const mapping: Record<string, BillingPayerType> = {
      MEDICAID: 'MEDICAID',
      MEDICARE: 'MEDICARE',
      MEDICARE_ADVANTAGE: 'MEDICARE',
      PRIVATE_INSURANCE: 'PRIVATE_INSURANCE',
      MANAGED_CARE: 'PRIVATE_INSURANCE',
      VETERANS_BENEFITS: 'VETERANS_BENEFITS',
      PRIVATE_PAY: 'PRIVATE_PAY',
    };
    return mapping[raw] ?? 'OTHER';
  }

  /**
   * Map raw invoice status to family-friendly status
   */
  private mapInvoiceStatus(raw: string): FamilyInvoiceStatus {
    const mapping: Record<string, FamilyInvoiceStatus> = {
      DRAFT: 'PENDING',
      PENDING_REVIEW: 'PENDING',
      APPROVED: 'PENDING',
      SENT: 'SENT',
      SUBMITTED: 'PROCESSING',
      PARTIALLY_PAID: 'PARTIALLY_PAID',
      PAID: 'PAID',
      PAST_DUE: 'PAST_DUE',
      DISPUTED: 'DISPUTED',
    };
    return mapping[raw] ?? 'PENDING';
  }

  /**
   * Map raw unit type
   */
  private mapUnitType(raw: string): ServiceUnitType {
    const mapping: Record<string, ServiceUnitType> = {
      HOUR: 'HOUR',
      VISIT: 'VISIT',
      DAY: 'DAY',
      WEEK: 'WEEK',
      MONTH: 'MONTH',
      TASK: 'TASK',
      MILE: 'MILE',
      UNIT: 'UNIT',
    };
    return mapping[raw] ?? 'UNIT';
  }

  /**
   * Map raw payment method
   */
  private mapPaymentMethod(raw: string): PaymentMethodType {
    const mapping: Record<string, PaymentMethodType> = {
      CHECK: 'CHECK',
      CREDIT_CARD: 'CREDIT_CARD',
      DEBIT_CARD: 'DEBIT_CARD',
      ACH: 'ACH',
      EFT: 'ACH',
      CASH: 'CASH',
      ERA: 'INSURANCE',
    };
    return mapping[raw] ?? 'OTHER';
  }

  /**
   * Map raw payment status
   */
  private mapPaymentStatus(
    raw: string
  ): 'RECEIVED' | 'APPLIED' | 'PENDING' | 'RETURNED' {
    const mapping: Record<
      string,
      'RECEIVED' | 'APPLIED' | 'PENDING' | 'RETURNED'
    > = {
      PENDING: 'PENDING',
      RECEIVED: 'RECEIVED',
      APPLIED: 'APPLIED',
      DEPOSITED: 'APPLIED',
      CLEARED: 'APPLIED',
      RETURNED: 'RETURNED',
      VOIDED: 'RETURNED',
    };
    return mapping[raw] ?? 'PENDING';
  }
}
