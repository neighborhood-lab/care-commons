# Mileage & Expense Tracking

> Comprehensive mileage and expense tracking system for staff reimbursements in home care organizations.

## Overview

The **Mileage & Expense Tracking** vertical provides a complete solution for managing employee expenses and mileage reimbursements. It supports expense entry, mileage calculation, receipt management, and multi-stage approval workflows.

## Features

### Expense Management
- Create and manage expense entries across multiple categories
- Support for meals, lodging, supplies, training, equipment, and travel expenses
- Automatic currency handling (default USD, supports multiple currencies)
- Expense validation with configurable limits
- Receipt attachment and validation
- Multi-status workflow (Draft → Submitted → Approved → Paid)

### Mileage Tracking
- Track business mileage with start/end locations
- Support for multiple distance units (miles/kilometers)
- Automatic rate calculation based on configurable rates
- IRS standard mileage rate support
- Client visit tracking integration
- Odometer reading validation
- Multiple rate types (Business, Medical, Moving, Charity)

### Receipt Management
- Upload and store receipt images/PDFs
- Link receipts to expenses or mileage entries
- Receipt verification workflow
- OCR support for data extraction (planned)
- Unlinked receipt management
- File size and type validation

### Approval Workflows
- Submit expenses/mileage for approval
- Approve or reject with reason tracking
- Mark items as paid with payment method tracking
- Approval history and audit trail
- Batch operations support

## Architecture

```
mileage-expense-tracking/
├── types/              # TypeScript type definitions
│   ├── expense.ts      # Expense entry types
│   ├── mileage.ts      # Mileage tracking types
│   ├── receipt.ts      # Receipt types
│   └── index.ts
├── repository/         # Data access layer
│   ├── expense-repository.ts
│   ├── mileage-repository.ts
│   ├── receipt-repository.ts
│   └── index.ts
├── service/           # Business logic layer
│   ├── expense-service.ts
│   ├── mileage-service.ts
│   ├── receipt-service.ts
│   └── index.ts
├── utils/             # Helper functions
│   ├── mileage-calculator.ts
│   ├── expense-validator.ts
│   └── index.ts
├── routes/            # Express handlers
│   ├── expense-handlers.ts
│   ├── mileage-handlers.ts
│   ├── receipt-handlers.ts
│   └── index.ts
└── __tests__/         # Test files
```

## Installation

```bash
# From the monorepo root
npm install

# Or install this vertical specifically
cd verticals/mileage-expense-tracking
npm install
```

## Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for a step-by-step guide to get started.

## Usage

See [USAGE.md](./USAGE.md) for detailed API documentation and examples.

## Development

### Building

```bash
npm run build
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run typecheck
```

## Database Schema

This vertical requires the following database tables:

- `expense_entries` - Expense records
- `mileage_entries` - Mileage tracking records
- `mileage_rates` - Mileage rate configurations
- `receipts` - Receipt files and metadata

Migration files should be created in `packages/core/migrations/`.

## Permissions

The following permissions are used:

### Expenses
- `expenses:create` - Create expense entries
- `expenses:view` - View expenses
- `expenses:update` - Update expense entries
- `expenses:delete` - Delete draft expenses
- `expenses:submit` - Submit expenses for approval
- `expenses:approve` - Approve/reject expenses
- `expenses:pay` - Mark expenses as paid

### Mileage
- `mileage:create` - Create mileage entries
- `mileage:view` - View mileage entries
- `mileage:update` - Update mileage entries
- `mileage:delete` - Delete draft mileage
- `mileage:submit` - Submit mileage for approval
- `mileage:approve` - Approve/reject mileage
- `mileage:pay` - Mark mileage as paid
- `mileage-rates:create` - Create mileage rates
- `mileage-rates:view` - View mileage rates

### Receipts
- `receipts:create` - Upload receipts
- `receipts:view` - View receipts
- `receipts:update` - Update receipt metadata
- `receipts:delete` - Delete receipts
- `receipts:verify` - Verify/reject receipts
- `receipts:archive` - Archive receipts

## Configuration

### Mileage Rates

Configure organization-specific mileage rates or use IRS standard rates:

```typescript
import { IRS_STANDARD_RATES } from '@care-commons/mileage-expense-tracking';

// Get 2024 business rate
const rate = IRS_STANDARD_RATES[2024].BUSINESS; // 67 cents per mile
```

### Expense Limits

Configure category-specific expense limits at the organization level (to be implemented in organization settings).

## Contributing

When contributing to this vertical:

1. Follow the established architecture patterns
2. Add tests for new features
3. Update documentation
4. Ensure all linting and type checks pass
5. Follow the monorepo conventions

## Related Verticals

- **@care-commons/caregiver-staff** - Staff management
- **@care-commons/client-demographics** - Client information
- **@care-commons/scheduling-visits** - Visit scheduling
- **@care-commons/payroll-processing** - Payroll integration

## License

AGPL-3.0
