"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const uuid_1 = require("uuid");
const billing_repository_1 = require("../repository/billing-repository");
const billing_validator_1 = require("../validation/billing-validator");
const billing_calculations_1 = require("../utils/billing-calculations");
class BillingService {
    constructor(pool) {
        this.pool = pool;
        this.repository = new billing_repository_1.BillingRepository(pool);
    }
    async createBillableItem(input, userId) {
        const validation = (0, billing_validator_1.validateCreateBillableItem)(input);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        const rateSchedule = await this.repository.findActiveRateSchedule(input.organizationId, input.payerId);
        if (!rateSchedule) {
            throw new Error('No active rate schedule found for payer');
        }
        const serviceRate = rateSchedule.rates.find((r) => r.serviceTypeCode === input.serviceTypeCode);
        if (!serviceRate) {
            throw new Error(`No rate found for service code ${input.serviceTypeCode}`);
        }
        const units = input.units || (0, billing_calculations_1.calculateUnits)(input.durationMinutes, input.unitType, serviceRate.roundingRule);
        const unitRate = input.rateScheduleId
            ? serviceRate.unitRate
            : serviceRate.unitRate;
        const subtotal = (0, billing_calculations_1.calculateBaseAmount)(units, unitRate);
        const finalAmount = (0, billing_calculations_1.applyModifiers)(subtotal, input.modifiers);
        let authorizationRemainingUnits;
        let isAuthorized = false;
        if (input.authorizationId) {
            const auth = await this.repository.findAuthorizationByNumber(input.authorizationNumber);
            if (!auth) {
                throw new Error('Authorization not found');
            }
            if (auth.status !== 'ACTIVE') {
                throw new Error(`Authorization is ${auth.status}, not ACTIVE`);
            }
            if (auth.remainingUnits < units) {
                throw new Error(`Insufficient authorization units. Needed: ${units}, Available: ${auth.remainingUnits}`);
            }
            authorizationRemainingUnits = auth.remainingUnits - units;
            isAuthorized = true;
        }
        const billableItem = {
            ...input,
            units,
            unitRate,
            subtotal,
            finalAmount,
            isAuthorized,
            authorizationRemainingUnits,
            status: 'PENDING',
            statusHistory: [
                {
                    id: (0, uuid_1.v4)(),
                    fromStatus: null,
                    toStatus: 'PENDING',
                    timestamp: new Date(),
                    changedBy: userId,
                    reason: 'Billable item created from service delivery',
                },
            ],
            isHold: false,
            requiresReview: false,
            isDenied: false,
            isAppealable: false,
            isPaid: false,
            createdBy: userId,
            updatedBy: userId,
        };
        const created = await this.repository.createBillableItem(billableItem);
        if (input.authorizationId && isAuthorized) {
            await this.repository.updateAuthorizationUnits(input.authorizationId, units, 0, userId);
        }
        return created;
    }
    async createInvoice(input, userId, orgCode) {
        const validation = (0, billing_validator_1.validateCreateInvoice)(input);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const billableItems = await this.repository.searchBillableItems({
                organizationId: input.organizationId,
            });
            const items = billableItems.filter((item) => input.billableItemIds.includes(item.id));
            if (items.length === 0) {
                throw new Error('No billable items found');
            }
            const payerIds = new Set(items.map((item) => item.payerId));
            if (payerIds.size > 1) {
                throw new Error('All billable items must be for the same payer');
            }
            const notReady = items.filter((item) => item.status !== 'READY');
            if (notReady.length > 0) {
                throw new Error(`${notReady.length} items are not in READY status`);
            }
            const subtotal = items.reduce((sum, item) => sum + item.finalAmount, 0);
            const taxAmount = 0;
            const totalAmount = (0, billing_calculations_1.calculateInvoiceTotal)(subtotal, taxAmount, 0, 0);
            const balanceDue = totalAmount;
            const invoiceCount = await this.getInvoiceCount(input.organizationId, new Date().getFullYear(), client);
            const invoiceNumber = (0, billing_calculations_1.generateInvoiceNumber)(orgCode, invoiceCount + 1, new Date().getFullYear());
            const lineItems = items.map((item) => ({
                id: (0, uuid_1.v4)(),
                billableItemId: item.id,
                serviceDate: item.serviceDate,
                serviceCode: item.serviceTypeCode,
                serviceDescription: item.serviceTypeName,
                providerName: item.caregiverName,
                providerNPI: item.providerNPI,
                unitType: item.unitType,
                units: item.units,
                unitRate: item.unitRate,
                subtotal: item.subtotal,
                adjustments: 0,
                total: item.finalAmount,
                clientName: undefined,
                clientId: item.clientId,
                modifiers: item.modifiers,
                authorizationNumber: item.authorizationNumber,
            }));
            const payer = await this.repository.findPayerById(input.payerId);
            if (!payer) {
                throw new Error('Payer not found');
            }
            const dueDate = (0, billing_calculations_1.calculateDueDate)(input.invoiceDate, payer.paymentTermsDays);
            const invoice = {
                organizationId: input.organizationId,
                branchId: input.branchId,
                invoiceNumber,
                invoiceType: input.invoiceType,
                payerId: input.payerId,
                payerType: input.payerType,
                payerName: input.payerName,
                payerAddress: payer.billingAddress || payer.address,
                clientId: input.clientId,
                clientName: input.clientId ? undefined : undefined,
                periodStart: input.periodStart,
                periodEnd: input.periodEnd,
                invoiceDate: input.invoiceDate,
                dueDate,
                billableItemIds: input.billableItemIds,
                lineItems,
                subtotal,
                taxAmount,
                taxRate: undefined,
                discountAmount: 0,
                adjustmentAmount: 0,
                totalAmount,
                paidAmount: 0,
                balanceDue,
                status: 'DRAFT',
                statusHistory: [
                    {
                        id: (0, uuid_1.v4)(),
                        fromStatus: null,
                        toStatus: 'DRAFT',
                        timestamp: new Date(),
                        changedBy: userId,
                        reason: 'Invoice created',
                    },
                ],
                payments: [],
                notes: input.notes,
                createdBy: userId,
                updatedBy: userId,
            };
            const created = await this.repository.createInvoice(invoice, client);
            for (const item of items) {
                await this.repository.updateBillableItemStatus(item.id, 'INVOICED', {
                    id: (0, uuid_1.v4)(),
                    fromStatus: 'READY',
                    toStatus: 'INVOICED',
                    timestamp: new Date(),
                    changedBy: userId,
                    reason: `Added to invoice ${invoiceNumber}`,
                }, userId, client);
            }
            await client.query('COMMIT');
            return created;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async createPayment(input, userId, orgCode) {
        const validation = (0, billing_validator_1.validateCreatePayment)(input);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        const paymentCount = await this.getPaymentCount(input.organizationId, new Date().getFullYear());
        const paymentNumber = (0, billing_calculations_1.generatePaymentNumber)(orgCode, paymentCount + 1, new Date().getFullYear());
        const payment = {
            organizationId: input.organizationId,
            branchId: input.branchId,
            paymentNumber,
            paymentType: 'FULL',
            payerId: input.payerId,
            payerType: input.payerType,
            payerName: input.payerName,
            amount: input.amount,
            currency: 'USD',
            paymentDate: input.paymentDate,
            receivedDate: input.receivedDate,
            paymentMethod: input.paymentMethod,
            referenceNumber: input.referenceNumber,
            allocations: [],
            unappliedAmount: input.amount,
            status: 'RECEIVED',
            statusHistory: [
                {
                    id: (0, uuid_1.v4)(),
                    fromStatus: null,
                    toStatus: 'RECEIVED',
                    timestamp: new Date(),
                    changedBy: userId,
                    reason: 'Payment received',
                },
            ],
            isReconciled: false,
            notes: input.notes,
            createdBy: userId,
            updatedBy: userId,
        };
        return this.repository.createPayment(payment);
    }
    async allocatePayment(input, userId) {
        const payment = await this.repository.findPaymentById(input.paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }
        const validation = (0, billing_validator_1.validateAllocatePayment)(input, payment.unappliedAmount);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            for (const allocation of input.allocations) {
                const invoice = await this.repository.findInvoiceById(allocation.invoiceId);
                if (!invoice) {
                    throw new Error(`Invoice ${allocation.invoiceId} not found`);
                }
                if (allocation.amount > invoice.balanceDue) {
                    throw new Error(`Allocation amount ${allocation.amount} exceeds balance due ${invoice.balanceDue}`);
                }
                const paymentAllocation = {
                    id: (0, uuid_1.v4)(),
                    invoiceId: allocation.invoiceId,
                    invoiceNumber: invoice.invoiceNumber,
                    amount: allocation.amount,
                    appliedAt: new Date(),
                    appliedBy: userId,
                    notes: allocation.notes,
                };
                await this.repository.allocatePayment(payment.id, paymentAllocation, userId, client);
                await this.repository.updateInvoicePayment(invoice.id, allocation.amount, {
                    paymentId: payment.id,
                    amount: allocation.amount,
                    date: payment.paymentDate,
                }, userId, client);
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async approveBillableItem(billableItemId, userId) {
        const item = await this.repository.searchBillableItems({
            organizationId: undefined,
        });
        const billableItem = item.find((i) => i.id === billableItemId);
        if (!billableItem) {
            throw new Error('Billable item not found');
        }
        if (billableItem.status !== 'PENDING') {
            throw new Error(`Cannot approve item in ${billableItem.status} status`);
        }
        await this.repository.updateBillableItemStatus(billableItemId, 'READY', {
            id: (0, uuid_1.v4)(),
            fromStatus: 'PENDING',
            toStatus: 'READY',
            timestamp: new Date(),
            changedBy: userId,
            reason: 'Approved for billing',
        }, userId);
    }
    async approveInvoice(invoiceId, userId) {
        const invoice = await this.repository.findInvoiceById(invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }
        if (invoice.status !== 'DRAFT' && invoice.status !== 'PENDING_REVIEW') {
            throw new Error(`Cannot approve invoice in ${invoice.status} status`);
        }
        throw new Error('Not implemented - would update status to APPROVED');
    }
    async getInvoiceCount(organizationId, year, client) {
        const db = client || this.pool;
        const result = await db.query(`SELECT COUNT(*) as count FROM invoices 
       WHERE organization_id = $1 
       AND EXTRACT(YEAR FROM invoice_date) = $2`, [organizationId, year]);
        return parseInt(result.rows[0].count);
    }
    async getPaymentCount(organizationId, year) {
        const result = await this.pool.query(`SELECT COUNT(*) as count FROM payments 
       WHERE organization_id = $1 
       AND EXTRACT(YEAR FROM payment_date) = $2`, [organizationId, year]);
        return parseInt(result.rows[0].count);
    }
}
exports.BillingService = BillingService;
//# sourceMappingURL=billing-service.js.map