# Quick Start Guide

This guide will help you get started with the Mileage & Expense Tracking vertical.

## Prerequisites

- Node.js 22.x
- PostgreSQL database
- @care-commons/core package installed

## Setup

### 1. Install Dependencies

```bash
cd verticals/mileage-expense-tracking
npm install
```

### 2. Database Setup

Run the migration to create the required tables:

```bash
# From the monorepo root
npm run db:migrate
```

### 3. Build the Vertical

```bash
npm run build
```

## Basic Usage

### Initialize Services

```typescript
import { Database, PermissionService } from '@care-commons/core';
import {
  ExpenseRepository,
  ExpenseService,
  MileageRepository,
  MileageRateRepository,
  MileageService,
  ReceiptRepository,
  ReceiptService,
} from '@care-commons/mileage-expense-tracking';

// Initialize database connection
const database = new Database({
  host: 'localhost',
  port: 5432,
  database: 'care_commons',
  user: 'postgres',
  password: 'password',
});

await database.connect();

// Initialize permission service
const permissions = new PermissionService(database);

// Initialize repositories
const expenseRepo = new ExpenseRepository(database);
const mileageRepo = new MileageRepository(database);
const mileageRateRepo = new MileageRateRepository(database);
const receiptRepo = new ReceiptRepository(database);

// Initialize services
const expenseService = new ExpenseService(expenseRepo, permissions);
const mileageService = new MileageService(mileageRepo, mileageRateRepo, permissions);
const receiptService = new ReceiptService(receiptRepo, permissions);
```

### Create User Context

```typescript
import type { UserContext } from '@care-commons/core';

const context: UserContext = {
  userId: 'user-123',
  organizationId: 'org-456',
  branchIds: ['branch-789'],
  roles: ['STAFF'],
  permissions: [
    'expenses:create',
    'expenses:view',
    'mileage:create',
    'mileage:view',
    'receipts:create',
  ],
};
```

### Example 1: Create an Expense

```typescript
// Create a meal expense
const expense = await expenseService.createExpense(
  {
    employeeId: 'emp-123',
    expenseDate: '2024-01-15',
    category: 'MEALS',
    amount: 2500, // $25.00 in cents
    currency: 'USD',
    description: 'Team lunch with clients',
    merchantName: 'Local Restaurant',
  },
  context
);

console.log('Expense created:', expense);
```

### Example 2: Create a Mileage Entry

```typescript
// First, create a mileage rate
const rate = await mileageService.createRate(
  {
    rateType: 'BUSINESS',
    ratePerMile: 67, // $0.67 per mile
    ratePerKilometer: 42, // Converted rate
    effectiveDate: '2024-01-01',
    isDefault: true,
  },
  context
);

// Create a mileage entry
const mileage = await mileageService.createMileage(
  {
    employeeId: 'emp-123',
    tripDate: '2024-01-15',
    startLocation: '123 Main St, City A',
    endLocation: '456 Oak Ave, City B',
    distance: 25.5,
    distanceUnit: 'MILES',
    purpose: 'Client visit',
    clientId: 'client-789',
    vehicleDescription: 'Honda Civic',
  },
  context
);

console.log('Mileage entry created:', mileage);
console.log('Calculated amount:', mileage.calculatedAmount / 100); // Amount in dollars
```

### Example 3: Upload a Receipt

```typescript
const receipt = await receiptService.uploadReceipt(
  {
    employeeId: 'emp-123',
    expenseId: expense.id,
    fileName: 'receipt-20240115.jpg',
    fileType: 'IMAGE_JPEG',
    fileSize: 524288, // 512 KB
    filePath: '/uploads/receipts/receipt-20240115.jpg',
    receiptDate: '2024-01-15',
    merchantName: 'Local Restaurant',
    amount: 2500,
  },
  context
);

console.log('Receipt uploaded:', receipt);
```

### Example 4: Submit for Approval

```typescript
// Submit expenses for approval
const submittedExpenses = await expenseService.submitExpenses(
  {
    expenseIds: [expense.id],
  },
  context
);

console.log('Expenses submitted:', submittedExpenses);
```

### Example 5: Approve Expenses

```typescript
// Create a manager context with approval permissions
const managerContext: UserContext = {
  ...context,
  roles: ['MANAGER'],
  permissions: ['expenses:approve', 'mileage:approve'],
};

// Approve expenses
const approvedExpenses = await expenseService.approveExpenses(
  {
    expenseIds: [expense.id],
    notes: 'Approved - valid business expense',
  },
  managerContext
);

console.log('Expenses approved:', approvedExpenses);
```

### Example 6: Query Expenses

```typescript
// Query expenses for a specific employee and date range
const expenses = await expenseService.queryExpenses(
  {
    employeeId: 'emp-123',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    status: 'APPROVED',
  },
  context
);

console.log('Found expenses:', expenses);

// Get expense summary
const summary = await expenseService.getExpenseSummary(
  {
    employeeId: 'emp-123',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
  context
);

console.log('Expense summary:', summary);
```

## Express API Integration

```typescript
import express from 'express';
import {
  createExpenseHandlers,
  createMileageHandlers,
  createReceiptHandlers,
} from '@care-commons/mileage-expense-tracking';

const app = express();
app.use(express.json());

// Create handlers
const expenseHandlers = createExpenseHandlers(expenseService);
const mileageHandlers = createMileageHandlers(mileageService);
const receiptHandlers = createReceiptHandlers(receiptService);

// Register routes
app.post('/api/expenses', expenseHandlers.createExpense);
app.get('/api/expenses/:id', expenseHandlers.getExpenseById);
app.put('/api/expenses/:id', expenseHandlers.updateExpense);
app.delete('/api/expenses/:id', expenseHandlers.deleteExpense);
app.post('/api/expenses/submit', expenseHandlers.submitExpenses);
app.post('/api/expenses/approve', expenseHandlers.approveExpenses);

app.post('/api/mileage', mileageHandlers.createMileage);
app.get('/api/mileage/:id', mileageHandlers.getMileageById);
app.put('/api/mileage/:id', mileageHandlers.updateMileage);

app.post('/api/receipts', receiptHandlers.uploadReceipt);
app.get('/api/receipts/:id', receiptHandlers.getReceiptById);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Next Steps

- Read [USAGE.md](./USAGE.md) for detailed API documentation
- Check the [README.md](./README.md) for architecture details
- Explore the type definitions in `src/types/`
- Review the service layer implementations

## Common Workflows

### Employee Submits Expense Claim

1. Employee creates expense entry (Draft)
2. Employee uploads receipt
3. Employee submits for approval
4. Manager approves/rejects
5. Finance marks as paid

### Employee Logs Mileage

1. Employee creates mileage entry (Draft)
2. System calculates reimbursement amount
3. Employee submits for approval
4. Manager approves/rejects
5. Mileage included in next payroll

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure the user context has the required permissions
2. **Validation Errors**: Check that all required fields are provided and valid
3. **Database Errors**: Verify migrations have been run and database is connected

### Getting Help

- Check the documentation in the `README.md`
- Review the type definitions for available options
- Look at the test files for usage examples
