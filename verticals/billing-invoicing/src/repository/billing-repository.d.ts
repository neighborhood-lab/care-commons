import { Pool, PoolClient } from 'pg';
import { UUID } from '@care-commons/core';
import { BillableItem, Invoice, Payment, Payer, RateSchedule, ServiceAuthorization, BillableItemSearchFilters, InvoiceSearchFilters, PaymentSearchFilters } from '../types/billing';
export declare class BillingRepository {
    private pool;
    constructor(pool: Pool);
    createPayer(payer: Omit<Payer, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt' | 'deletedBy'>, client?: PoolClient): Promise<Payer>;
    findPayerById(id: UUID): Promise<Payer | null>;
    findPayersByOrganization(organizationId: UUID): Promise<Payer[]>;
    createRateSchedule(schedule: Omit<RateSchedule, 'id' | 'createdAt' | 'updatedAt' | 'version'>, client?: PoolClient): Promise<RateSchedule>;
    findActiveRateSchedule(organizationId: UUID, payerId?: UUID, date?: Date): Promise<RateSchedule | null>;
    createAuthorization(auth: Omit<ServiceAuthorization, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt' | 'deletedBy'>, client?: PoolClient): Promise<ServiceAuthorization>;
    findAuthorizationByNumber(authNumber: string): Promise<ServiceAuthorization | null>;
    findActiveAuthorizationsForClient(clientId: UUID, serviceTypeId?: UUID): Promise<ServiceAuthorization[]>;
    updateAuthorizationUnits(authId: UUID, unitsUsed: number, unitsBilled: number, userId: UUID, client?: PoolClient): Promise<void>;
    createBillableItem(item: Omit<BillableItem, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt' | 'deletedBy'>, client?: PoolClient): Promise<BillableItem>;
    searchBillableItems(filters: BillableItemSearchFilters): Promise<BillableItem[]>;
    updateBillableItemStatus(id: UUID, status: string, statusChange: any, userId: UUID, client?: PoolClient): Promise<void>;
    createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt' | 'deletedBy'>, client?: PoolClient): Promise<Invoice>;
    findInvoiceById(id: UUID): Promise<Invoice | null>;
    findInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null>;
    searchInvoices(filters: InvoiceSearchFilters): Promise<Invoice[]>;
    updateInvoicePayment(id: UUID, paymentAmount: number, paymentReference: any, userId: UUID, client?: PoolClient): Promise<void>;
    createPayment(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'version'>, client?: PoolClient): Promise<Payment>;
    findPaymentById(id: UUID): Promise<Payment | null>;
    searchPayments(filters: PaymentSearchFilters): Promise<Payment[]>;
    allocatePayment(paymentId: UUID, allocation: any, userId: UUID, client?: PoolClient): Promise<void>;
    private mapPayer;
    private mapRateSchedule;
    private mapAuthorization;
    private mapBillableItem;
    private mapInvoice;
    private mapPayment;
}
//# sourceMappingURL=billing-repository.d.ts.map