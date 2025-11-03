# Billing & Invoicing - Usage Guide

This guide demonstrates how to use the Billing & Invoicing vertical for common
operations.

## Setup

```typescript
import { Pool } from 'pg';
import { BillingRepository } from '@care-commons/billing-invoicing';
import {
  validateCreateBillableItem,
  validateCreateInvoice,
  validateCreatePayment,
  calculateUnits,
  calculateBaseAmount,
  applyModifiers,
  calculateInvoiceTotal,
} from '@care-commons/billing-invoicing';

// Initialize database connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'care_commons',
  user: 'postgres',
  password: 'postgres',
});

// Create repository instance
const billingRepo = new BillingRepository(pool);
```

## Seed Demo Data

To populate the database with realistic billing data:

```bash
# First, seed base data (organizations, clients, caregivers)
npm run seed

# Then seed billing data
npm run seed:billing
```

This creates:

- 5 payers (Medicare, Medicaid, Blue Cross, VA, Private Pay)
- 3 rate schedules with different pricing
- Service authorizations for clients
- 15 billable items with various statuses
- Invoices grouped by payer
- Payments applied to invoices

## Common Operations

### 1. Create a Billable Item from a Completed Visit

```typescript
import { v4 as uuid } from 'uuid';

async function createBillableItemFromVisit(visitData: any) {
  // Calculate units based on duration
  const units = calculateUnits(
    visitData.durationMinutes,
    'HOUR',
    'QUARTER_HOUR' // Round to 15-minute increments
  );

  // Calculate amounts
  const unitRate = 28.0; // From rate schedule
  const subtotal = calculateBaseAmount(units, unitRate);
  const finalAmount = applyModifiers(subtotal, visitData.modifiers);

  // Prepare input
  const input = {
    organizationId: visitData.organizationId,
    branchId: visitData.branchId,
    clientId: visitData.clientId,
    visitId: visitData.visitId,
    evvRecordId: visitData.evvRecordId,
    serviceTypeId: visitData.serviceTypeId,
    serviceTypeCode: 'S5126',
    serviceTypeName: 'Personal Care Services',
    serviceDate: visitData.serviceDate,
    startTime: visitData.startTime,
    endTime: visitData.endTime,
    durationMinutes: visitData.durationMinutes,
    caregiverId: visitData.caregiverId,
    caregiverName: visitData.caregiverName,
    unitType: 'HOUR',
    units,
    payerId: visitData.payerId,
    payerType: visitData.payerType,
    payerName: visitData.payerName,
    createdBy: visitData.userId,
    updatedBy: visitData.userId,
  };

  // Validate
  const validation = validateCreateBillableItem(input);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Create billable item
  const billableItem = await billingRepo.createBillableItem({
    ...input,
    unitRate,
    subtotal,
    finalAmount,
    status: 'PENDING',
    statusHistory: [],
    isHold: false,
    requiresReview: false,
    isAuthorized: false,
    isDenied: false,
    isAppealable: false,
    isPaid: false,
  });

  console.log(`Created billable item: ${billableItem.id}`);
  return billableItem;
}
```

### 2. Generate an Invoice from Ready Billable Items

```typescript
import {
  generateInvoiceNumber,
  calculateInvoiceTotal,
} from '@care-commons/billing-invoicing';

async function generateInvoiceForPayer(
  organizationId: string,
  branchId: string,
  payerId: string,
  periodStart: Date,
  periodEnd: Date,
  userId: string
) {
  // Find ready billable items for this payer
  const items = await billingRepo.searchBillableItems({
    organizationId,
    payerId,
    status: ['READY'],
    startDate: periodStart,
    endDate: periodEnd,
  });

  if (items.length === 0) {
    throw new Error('No billable items ready for invoicing');
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.finalAmount, 0);
  const taxAmount = 0; // Healthcare services typically not taxed
  const discountAmount = 0;
  const adjustmentAmount = 0;
  const totalAmount = calculateInvoiceTotal(
    subtotal,
    taxAmount,
    discountAmount,
    adjustmentAmount
  );

  // Generate invoice number
  const invoiceNumber = generateInvoiceNumber('CCHH', 1, 2024);

  // Prepare invoice input
  const invoiceDate = new Date();
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + 30); // Net 30

  const input = {
    organizationId,
    branchId,
    invoiceNumber,
    invoiceType: 'STANDARD' as const,
    payerId,
    payerType: items[0].payerType,
    payerName: items[0].payerName,
    periodStart,
    periodEnd,
    invoiceDate,
    dueDate,
    billableItemIds: items.map((item) => item.id),
    lineItems: items.map((item) => ({
      id: uuid(),
      billableItemId: item.id,
      serviceDate: item.serviceDate,
      serviceCode: item.serviceTypeCode,
      serviceDescription: item.serviceTypeName,
      unitType: item.unitType,
      units: item.units,
      unitRate: item.unitRate,
      subtotal: item.subtotal,
      adjustments: 0,
      total: item.finalAmount,
    })),
    subtotal,
    taxAmount,
    discountAmount,
    adjustmentAmount,
    totalAmount,
    paidAmount: 0,
    balanceDue: totalAmount,
    status: 'DRAFT' as const,
    statusHistory: [],
    payments: [],
    createdBy: userId,
    updatedBy: userId,
  };

  // Validate
  const validation = validateCreateInvoice(input);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Create invoice
  const invoice = await billingRepo.createInvoice(input);

  // Update billable items to INVOICED status
  for (const item of items) {
    await billingRepo.updateBillableItemStatus(
      item.id,
      'INVOICED',
      {
        id: uuid(),
        fromStatus: 'READY',
        toStatus: 'INVOICED',
        timestamp: new Date().toISOString(),
        changedBy: userId,
        reason: `Included in invoice ${invoiceNumber}`,
      },
      userId
    );
  }

  console.log(`Created invoice: ${invoice.invoiceNumber}`);
  return invoice;
}
```

### 3. Record and Allocate a Payment

```typescript
import { generatePaymentNumber } from '@care-commons/billing-invoicing';

async function recordPayment(
  organizationId: string,
  branchId: string,
  payerId: string,
  amount: number,
  referenceNumber: string,
  userId: string
) {
  // Get payer info
  const payer = await billingRepo.findPayerById(payerId);
  if (!payer) {
    throw new Error('Payer not found');
  }

  // Generate payment number
  const paymentNumber = generatePaymentNumber('CCHH', 1, 2024);

  // Prepare payment input
  const input = {
    organizationId,
    branchId,
    paymentNumber,
    paymentType: 'FULL' as const,
    payerId,
    payerType: payer.payerType,
    payerName: payer.payerName,
    amount,
    paymentDate: new Date(),
    receivedDate: new Date(),
    paymentMethod: 'CHECK' as const,
    referenceNumber,
    createdBy: userId,
    updatedBy: userId,
  };

  // Validate
  const validation = validateCreatePayment(input);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Create payment
  const payment = await billingRepo.createPayment({
    ...input,
    currency: 'USD',
    allocations: [],
    unappliedAmount: amount,
    status: 'RECEIVED',
    statusHistory: [],
    isReconciled: false,
  });

  console.log(`Recorded payment: ${payment.paymentNumber}`);
  return payment;
}

async function allocatePaymentToInvoices(
  paymentId: string,
  allocations: Array<{ invoiceId: string; amount: number }>,
  userId: string
) {
  // Validate each allocation
  for (const alloc of allocations) {
    const invoice = await billingRepo.findInvoiceById(alloc.invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${alloc.invoiceId} not found`);
    }
    if (alloc.amount > invoice.balanceDue) {
      throw new Error(
        `Allocation exceeds balance due on invoice ${invoice.invoiceNumber}`
      );
    }
  }

  // Apply allocations
  for (const alloc of allocations) {
    const invoice = await billingRepo.findInvoiceById(alloc.invoiceId);

    // Record allocation in payment
    await billingRepo.allocatePayment(
      paymentId,
      {
        id: uuid(),
        invoiceId: alloc.invoiceId,
        invoiceNumber: invoice!.invoiceNumber,
        amount: alloc.amount,
        appliedAt: new Date().toISOString(),
        appliedBy: userId,
      },
      userId
    );

    // Update invoice payment
    await billingRepo.updateInvoicePayment(
      alloc.invoiceId,
      alloc.amount,
      {
        paymentId,
        amount: alloc.amount,
        date: new Date(),
      },
      userId
    );
  }

  console.log(`Allocated payment to ${allocations.length} invoices`);
}
```

### 4. Check Service Authorization

```typescript
async function checkAuthorization(
  clientId: string,
  serviceTypeId: string,
  units: number
) {
  // Find active authorizations
  const authorizations = await billingRepo.findActiveAuthorizationsForClient(
    clientId,
    serviceTypeId
  );

  if (authorizations.length === 0) {
    return {
      isAuthorized: false,
      reason: 'No active authorization found',
    };
  }

  // Use first available authorization
  const auth = authorizations[0];

  if (auth.remainingUnits < units) {
    return {
      isAuthorized: false,
      reason: `Insufficient units: ${auth.remainingUnits} remaining, ${units} requested`,
      authorizationId: auth.id,
      remainingUnits: auth.remainingUnits,
    };
  }

  return {
    isAuthorized: true,
    authorizationId: auth.id,
    authorizationNumber: auth.authorizationNumber,
    remainingUnits: auth.remainingUnits,
  };
}
```

### 5. Search and Report

```typescript
async function getOutstandingInvoices(organizationId: string) {
  const invoices = await billingRepo.searchInvoices({
    organizationId,
    hasBalance: true,
    status: ['SENT', 'SUBMITTED', 'PARTIALLY_PAID', 'PAST_DUE'],
  });

  const total = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  console.log(`Outstanding invoices: ${invoices.length}`);
  console.log(`Total outstanding: $${total.toFixed(2)}`);

  return {
    invoices,
    count: invoices.length,
    totalOutstanding: total,
  };
}

async function getPastDueInvoices(organizationId: string) {
  const invoices = await billingRepo.searchInvoices({
    organizationId,
    isPastDue: true,
  });

  return invoices.map((invoice) => ({
    invoiceNumber: invoice.invoiceNumber,
    payerName: invoice.payerName,
    dueDate: invoice.dueDate,
    balanceDue: invoice.balanceDue,
    daysPastDue: Math.floor(
      (new Date().getTime() - new Date(invoice.dueDate).getTime()) /
        (1000 * 60 * 60 * 24)
    ),
  }));
}

async function getPayerPerformance(organizationId: string, payerId: string) {
  // Get all invoices for payer
  const invoices = await billingRepo.searchInvoices({
    organizationId,
    payerId,
  });

  const totalBilled = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstanding = invoices.reduce(
    (sum, inv) => sum + inv.balanceDue,
    0
  );

  // Calculate average payment days for paid invoices
  const paidInvoices = invoices.filter((inv) => inv.paidAmount > 0);
  const paymentDays = paidInvoices.map((inv) =>
    Math.floor(
      (new Date(inv.updatedAt).getTime() -
        new Date(inv.invoiceDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const avgPaymentDays =
    paymentDays.length > 0
      ? Math.round(paymentDays.reduce((a, b) => a + b, 0) / paymentDays.length)
      : 0;

  return {
    totalInvoices: invoices.length,
    totalBilled,
    totalPaid,
    totalOutstanding,
    collectionRate: totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0,
    averagePaymentDays: avgPaymentDays,
  };
}
```

## Working with Rate Schedules

```typescript
async function getApplicableRate(
  organizationId: string,
  payerId: string,
  serviceTypeCode: string,
  serviceDate: Date
) {
  // Find active rate schedule for payer
  const schedule = await billingRepo.findActiveRateSchedule(
    organizationId,
    payerId,
    serviceDate
  );

  if (!schedule) {
    throw new Error('No active rate schedule found');
  }

  // Find rate for service type
  const rate = schedule.rates.find(
    (r) => r.serviceTypeCode === serviceTypeCode
  );

  if (!rate) {
    throw new Error(`No rate found for service type ${serviceTypeCode}`);
  }

  return rate;
}
```

## Error Handling

All operations should include proper error handling:

```typescript
import { ValidationResult } from '@care-commons/billing-invoicing';

async function handleBillingOperation() {
  try {
    // Perform operation
    const result = await someOperation();
    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Billing operation failed:', error.message);
      // Handle specific error types
      if (error.message.includes('Validation failed')) {
        // Handle validation errors
      } else if (error.message.includes('not found')) {
        // Handle not found errors
      }
    }
    throw error;
  }
}
```

## Best Practices

1. **Always validate input** before creating entities
2. **Use transactions** for multi-step operations
3. **Check authorizations** before creating billable items
4. **Apply rate schedules** consistently
5. **Track status history** for audit trails
6. **Handle EVV records** for Medicaid/Medicare compliance
7. **Implement retry logic** for external submissions
8. **Monitor past due invoices** regularly
9. **Reconcile payments** promptly
10. **Generate reports** for financial oversight

## Next Steps

- Implement service layer with business workflows
- Add API handlers for external integrations
- Create automated invoicing schedules
- Implement claims submission to clearinghouses
- Add ERA (Electronic Remittance Advice) processing
- Build reporting dashboards
- Add payment plan management
- Implement collections workflows
