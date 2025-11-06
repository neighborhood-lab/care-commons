# Usage Guide

Detailed API documentation for the Mileage & Expense Tracking vertical.

## Table of Contents

- [Expense Management](#expense-management)
- [Mileage Tracking](#mileage-tracking)
- [Receipt Management](#receipt-management)
- [Utility Functions](#utility-functions)
- [API Endpoints](#api-endpoints)

## Expense Management

### ExpenseService

#### createExpense(input, context)

Create a new expense entry.

```typescript
const expense = await expenseService.createExpense(
  {
    employeeId: 'emp-123',
    expenseDate: '2024-01-15',
    category: 'MEALS',
    amount: 2500, // In cents
    currency: 'USD',
    description: 'Business lunch',
    merchantName: 'Restaurant Name',
    receiptId: 'receipt-456', // Optional
    notes: 'Additional notes',
    tags: ['Q1-2024', 'client-meeting'],
  },
  context
);
```

**Expense Categories:**
- `MILEAGE` - Mileage reimbursement
- `MEALS` - Meal expenses
- `LODGING` - Hotel/accommodation
- `SUPPLIES` - Office/work supplies
- `TRAINING` - Training/education costs
- `EQUIPMENT` - Equipment purchases
- `TRAVEL` - Travel expenses (flights, etc.)
- `OTHER` - Other expenses

#### updateExpense(expenseId, input, context)

Update an expense entry (only in DRAFT status).

```typescript
const updated = await expenseService.updateExpense(
  'expense-123',
  {
    amount: 3000,
    description: 'Updated description',
  },
  context
);
```

#### submitExpenses(input, context)

Submit expenses for approval (changes status from DRAFT to SUBMITTED).

```typescript
const submitted = await expenseService.submitExpenses(
  {
    expenseIds: ['expense-1', 'expense-2'],
  },
  context
);
```

#### approveExpenses(input, context)

Approve expenses (changes status from SUBMITTED to APPROVED).

```typescript
const approved = await expenseService.approveExpenses(
  {
    expenseIds: ['expense-1', 'expense-2'],
    notes: 'Approved - valid business expenses',
  },
  context
);
```

#### rejectExpenses(input, context)

Reject expenses (changes status from SUBMITTED to REJECTED).

```typescript
const rejected = await expenseService.rejectExpenses(
  {
    expenseIds: ['expense-1'],
    rejectionReason: 'Missing required receipt',
  },
  context
);
```

#### markExpensesPaid(input, context)

Mark expenses as paid (changes status from APPROVED to PAID).

```typescript
const paid = await expenseService.markExpensesPaid(
  {
    expenseIds: ['expense-1', 'expense-2'],
    paymentMethod: 'DIRECT_DEPOSIT',
    paymentReference: 'PAY-2024-001',
  },
  context
);
```

**Payment Methods:**
- `DIRECT_DEPOSIT` - Bank transfer
- `CHECK` - Paper check
- `PAYROLL` - Included in payroll
- `CASH` - Cash payment

#### queryExpenses(filter, context)

Query expenses with filters.

```typescript
const expenses = await expenseService.queryExpenses(
  {
    employeeId: 'emp-123',
    category: 'MEALS',
    status: 'APPROVED',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    minAmount: 1000, // $10.00
    maxAmount: 10000, // $100.00
  },
  context
);
```

#### getExpenseSummary(filter, context)

Get expense summary statistics.

```typescript
const summary = await expenseService.getExpenseSummary(
  {
    employeeId: 'emp-123',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
  context
);

// Returns:
// {
//   totalAmount: 50000,
//   totalCount: 10,
//   byCategory: {
//     MEALS: { count: 5, amount: 25000 },
//     SUPPLIES: { count: 5, amount: 25000 }
//   },
//   byStatus: { ... },
//   pendingAmount: 10000,
//   approvedAmount: 30000,
//   paidAmount: 10000
// }
```

## Mileage Tracking

### MileageService

#### createMileage(input, context)

Create a new mileage entry.

```typescript
const mileage = await mileageService.createMileage(
  {
    employeeId: 'emp-123',
    tripDate: '2024-01-15',
    startLocation: '123 Main St, City A',
    endLocation: '456 Oak Ave, City B',
    distance: 25.5,
    distanceUnit: 'MILES', // or 'KILOMETERS'
    purpose: 'Client visit',
    rateType: 'BUSINESS', // BUSINESS, MEDICAL, MOVING, CHARITY
    clientId: 'client-789',
    vehicleDescription: 'Honda Civic',
    licensePlate: 'ABC-1234',
    odometerStart: 50000,
    odometerEnd: 50025,
  },
  context
);

// Automatically calculates reimbursement based on active rate
console.log(mileage.calculatedAmount); // Amount in cents
```

#### updateMileage(mileageId, input, context)

Update a mileage entry (only in DRAFT status).

```typescript
const updated = await mileageService.updateMileage(
  'mileage-123',
  {
    distance: 30.0,
    purpose: 'Updated purpose',
  },
  context
);
```

#### submitMileage(mileageIds, context)

Submit mileage entries for approval.

```typescript
const submitted = await mileageService.submitMileage(
  ['mileage-1', 'mileage-2'],
  context
);
```

#### approveMileage(mileageIds, notes, context)

Approve mileage entries.

```typescript
const approved = await mileageService.approveMileage(
  ['mileage-1', 'mileage-2'],
  'Approved - verified with client visit logs',
  context
);
```

#### rejectMileage(mileageIds, rejectionReason, context)

Reject mileage entries.

```typescript
const rejected = await mileageService.rejectMileage(
  ['mileage-1'],
  'Distance exceeds reasonable limit',
  context
);
```

#### markMileagePaid(mileageIds, paymentReference, context)

Mark mileage entries as paid.

```typescript
const paid = await mileageService.markMileagePaid(
  ['mileage-1', 'mileage-2'],
  'PAYROLL-2024-01',
  context
);
```

#### createRate(input, context)

Create a new mileage rate configuration.

```typescript
const rate = await mileageService.createRate(
  {
    rateType: 'BUSINESS',
    ratePerMile: 67, // $0.67 per mile (in cents)
    ratePerKilometer: 42, // Converted rate
    effectiveDate: '2024-01-01',
    endDate: '2024-12-31', // Optional
    isDefault: true,
    description: 'IRS standard rate for 2024',
  },
  context
);
```

#### getActiveRates(date, context)

Get all active rates for a specific date.

```typescript
const rates = await mileageService.getActiveRates('2024-01-15', context);
```

#### getMileageSummary(filter, context)

Get mileage summary statistics.

```typescript
const summary = await mileageService.getMileageSummary(
  {
    employeeId: 'emp-123',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
  context
);

// Returns:
// {
//   totalDistance: 250.5,
//   totalAmount: 16783,
//   totalCount: 10,
//   byRateType: { ... },
//   byStatus: { ... }
// }
```

## Receipt Management

### ReceiptService

#### uploadReceipt(input, context)

Upload a new receipt.

```typescript
const receipt = await receiptService.uploadReceipt(
  {
    employeeId: 'emp-123',
    expenseId: 'expense-456', // Optional
    mileageId: 'mileage-789', // Optional
    fileName: 'receipt.jpg',
    fileType: 'IMAGE_JPEG', // IMAGE_JPEG, IMAGE_PNG, IMAGE_GIF, PDF, OTHER
    fileSize: 524288, // In bytes
    filePath: '/uploads/receipts/receipt.jpg',
    thumbnailPath: '/uploads/thumbnails/receipt-thumb.jpg',
    receiptDate: '2024-01-15',
    merchantName: 'Restaurant Name',
    amount: 2500, // Extracted amount in cents
    currency: 'USD',
  },
  context
);
```

#### updateReceipt(receiptId, input, context)

Update receipt metadata.

```typescript
const updated = await receiptService.updateReceipt(
  'receipt-123',
  {
    receiptDate: '2024-01-16',
    merchantName: 'Corrected Name',
    amount: 2600,
  },
  context
);
```

#### verifyReceipts(input, context)

Verify uploaded receipts.

```typescript
const verified = await receiptService.verifyReceipts(
  {
    receiptIds: ['receipt-1', 'receipt-2'],
    notes: 'Verified - all information correct',
  },
  context
);
```

#### rejectReceipts(input, context)

Reject receipts.

```typescript
const rejected = await receiptService.rejectReceipts(
  {
    receiptIds: ['receipt-1'],
    rejectionReason: 'Image too blurry, please re-upload',
  },
  context
);
```

#### linkToExpense(receiptId, expenseId, context)

Link a receipt to an expense.

```typescript
const linked = await receiptService.linkToExpense(
  'receipt-123',
  'expense-456',
  context
);
```

#### getUnlinkedReceipts(context)

Get all unlinked receipts (not attached to any expense or mileage).

```typescript
const unlinked = await receiptService.getUnlinkedReceipts(context);
```

#### getReceiptStatistics(filter, context)

Get receipt statistics.

```typescript
const stats = await receiptService.getReceiptStatistics(
  {
    employeeId: 'emp-123',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
  context
);

// Returns:
// {
//   totalCount: 50,
//   totalSize: 26214400, // In bytes
//   byFileType: { IMAGE_JPEG: 30, PDF: 20 },
//   byStatus: { UPLOADED: 10, VERIFIED: 40 },
//   linkedToExpense: 30,
//   linkedToMileage: 15,
//   unlinked: 5
// }
```

## Utility Functions

### Mileage Calculators

```typescript
import {
  milesToKilometers,
  kilometersToMiles,
  convertDistance,
  calculateMileageAmount,
  formatDistance,
  formatAmount,
  IRS_STANDARD_RATES,
} from '@care-commons/mileage-expense-tracking';

// Unit conversions
const km = milesToKilometers(100); // 160.934 km
const miles = kilometersToMiles(160.934); // 100 miles

// Generic conversion
const converted = convertDistance(100, 'MILES', 'KILOMETERS'); // 160.934

// Calculate reimbursement
const amount = calculateMileageAmount(100, 67); // 6700 cents = $67.00

// Formatting
const distanceStr = formatDistance(25.5, 'MILES'); // "25.5 miles"
const amountStr = formatAmount(6700); // "$67.00"

// IRS rates
const rate2024 = IRS_STANDARD_RATES[2024].BUSINESS; // 67 cents/mile
```

### Expense Validators

```typescript
import {
  validateExpenseAmount,
  validateDescription,
  validateExpenseDate,
  validateCurrency,
  isReceiptRequired,
  validateExpense,
  formatCurrency,
} from '@care-commons/mileage-expense-tracking';

// Validate amount
const amountResult = validateExpenseAmount(2500, 'MEALS');
if (!amountResult.isValid) {
  console.error(amountResult.errors);
}

// Validate description
const descResult = validateDescription('Business lunch');

// Validate date
const dateResult = validateExpenseDate('2024-01-15');

// Check if receipt required
const required = isReceiptRequired('LODGING', 10000); // true (always for lodging)
const required2 = isReceiptRequired('MEALS', 1500); // false (under $25 threshold)

// Validate complete expense
const validation = validateExpense({
  amount: 2500,
  category: 'MEALS',
  description: 'Business lunch',
  expenseDate: '2024-01-15',
  currency: 'USD',
  hasReceipt: true,
});

// Format currency
const formatted = formatCurrency(2500, 'USD'); // "$25.00"
```

## API Endpoints

### Expense Endpoints

```
POST   /api/expenses                 Create expense
GET    /api/expenses/:id              Get expense by ID
PUT    /api/expenses/:id              Update expense
DELETE /api/expenses/:id              Delete expense
GET    /api/expenses/employee/:id     Get employee expenses
GET    /api/expenses/status/:status   Get expenses by status
POST   /api/expenses/query            Query expenses
POST   /api/expenses/summary          Get expense summary
POST   /api/expenses/submit           Submit for approval
POST   /api/expenses/approve          Approve expenses
POST   /api/expenses/reject           Reject expenses
POST   /api/expenses/mark-paid        Mark as paid
```

### Mileage Endpoints

```
POST   /api/mileage                   Create mileage
GET    /api/mileage/:id               Get mileage by ID
PUT    /api/mileage/:id               Update mileage
DELETE /api/mileage/:id               Delete mileage
GET    /api/mileage/employee/:id      Get employee mileage
GET    /api/mileage/client/:id        Get client mileage
POST   /api/mileage/query             Query mileage
POST   /api/mileage/summary           Get mileage summary
POST   /api/mileage/submit            Submit for approval
POST   /api/mileage/approve           Approve mileage
POST   /api/mileage/reject            Reject mileage
POST   /api/mileage/mark-paid         Mark as paid
POST   /api/mileage-rates             Create rate
GET    /api/mileage-rates/active      Get active rates
GET    /api/mileage-rates/:type/active Get active rate by type
```

### Receipt Endpoints

```
POST   /api/receipts                  Upload receipt
GET    /api/receipts/:id              Get receipt by ID
PUT    /api/receipts/:id              Update receipt
DELETE /api/receipts/:id              Delete receipt
GET    /api/receipts/employee/:id     Get employee receipts
GET    /api/receipts/expense/:id      Get expense receipts
GET    /api/receipts/mileage/:id      Get mileage receipts
GET    /api/receipts/unlinked         Get unlinked receipts
POST   /api/receipts/query            Query receipts
POST   /api/receipts/statistics       Get statistics
POST   /api/receipts/verify           Verify receipts
POST   /api/receipts/reject           Reject receipts
POST   /api/receipts/archive          Archive receipts
POST   /api/receipts/:id/link-expense Link to expense
POST   /api/receipts/:id/link-mileage Link to mileage
```

## Error Handling

All service methods may throw errors with descriptive messages:

- **Permission errors**: "Insufficient permissions to..."
- **Validation errors**: "Amount must be positive", "Description is required", etc.
- **Not found errors**: "Expense not found", "Mileage entry not found", etc.
- **State errors**: "Can only update expenses in DRAFT status"

Handle errors appropriately in your application:

```typescript
try {
  const expense = await expenseService.createExpense(input, context);
} catch (error) {
  if (error.message.includes('permissions')) {
    // Handle permission error
  } else if (error.message.includes('validation')) {
    // Handle validation error
  } else {
    // Handle other errors
  }
}
```
