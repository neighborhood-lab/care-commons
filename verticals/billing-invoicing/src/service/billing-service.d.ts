import { Pool } from 'pg';
import { UUID } from '@care-commons/core';
import { CreateBillableItemInput, CreateInvoiceInput, CreatePaymentInput, AllocatePaymentInput, BillableItem, Invoice, Payment } from '../types/billing';
export declare class BillingService {
    private pool;
    private repository;
    constructor(pool: Pool);
    createBillableItem(input: CreateBillableItemInput, userId: UUID): Promise<BillableItem>;
    createInvoice(input: CreateInvoiceInput, userId: UUID, orgCode: string): Promise<Invoice>;
    createPayment(input: CreatePaymentInput, userId: UUID, orgCode: string): Promise<Payment>;
    allocatePayment(input: AllocatePaymentInput, userId: UUID): Promise<void>;
    approveBillableItem(billableItemId: UUID, userId: UUID): Promise<void>;
    approveInvoice(invoiceId: UUID, userId: UUID): Promise<void>;
    private getInvoiceCount;
    private getPaymentCount;
}
//# sourceMappingURL=billing-service.d.ts.map