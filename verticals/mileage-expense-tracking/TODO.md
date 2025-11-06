# TODO: Complete Implementation

## Type System Alignment

The vertical structure is complete but needs TypeScript type alignment with the core package.

### Issues to Resolve

1. **Date Type Conversion**
   - Core package defines `Timestamp` as `Date` type
   - Current implementation uses `string` for dates throughout
   - Need to either:
     - Convert string dates to Date objects in repositories, OR
     - Align type definitions to match how dates are actually stored/retrieved

2. **Repository Method Signatures**
   - Base `Repository` class methods have specific signatures
   - Some service methods pass extra parameters to repository methods
   - Review and align with base class interface

3. **Entity Type Fields**
   - Ensure all Entity extending interfaces properly include:
     - `id: UUID`
     - `createdAt: Timestamp` (Date)
     - `createdBy: UUID`
     - `updatedAt: Timestamp` (Date)
     - `updatedBy: UUID`
     - `version: number`

### Fix Strategy

**Option 1: Use Date objects throughout**
```typescript
// In type definitions
expenseDate: Date;
submittedAt?: Date;

// In repositories, convert from database
expenseDate: new Date(row.expense_date),
```

**Option 2: Keep strings, override Timestamp type**
```typescript
// In types files
import type { Entity as BaseEntity, UUID } from '@care-commons/core';

// Override Timestamp to be string
type Timestamp = string;

interface ExpenseEntry extends Omit<BaseEntity, 'createdAt' | 'updatedAt'> {
  expenseDate: Timestamp;
  // ... other fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Recommended: Option 1** - Align with core package conventions

## Database Migration

Create migration file: `packages/core/migrations/XXX_mileage_expense_tracking.sql`

### Tables Needed

1. **expense_entries**
   - All fields from ExpenseEntry type
   - Indexes on employee_id, organization_id, status, expense_date

2. **mileage_entries**
   - All fields from MileageEntry type
   - Indexes on employee_id, client_id, organization_id, status, trip_date

3. **mileage_rates**
   - All fields from MileageRate type
   - Indexes on organization_id, rate_type, effective_date

4. **receipts**
   - All fields from Receipt type
   - Indexes on employee_id, expense_id, mileage_id, organization_id, status

## Testing

Once types are aligned:
1. Run `npm run build` to verify compilation
2. Run `npm test` to verify tests pass
3. Add integration tests for key workflows
4. Test API endpoints with sample data

## Integration

1. Add to showcase/demo app
2. Create seed data for demo
3. Document permission setup
4. Create example usage in showcase

## Performance Optimization

- Add database indexes for common queries
- Consider pagination for list endpoints
- Add caching for mileage rates
- Optimize summary queries

## Future Enhancements

- [ ] OCR integration for receipt processing
- [ ] Integration with payroll vertical
- [ ] Mobile app support for on-the-go expense entry
- [ ] Receipt image compression
- [ ] Bulk import/export functionality
- [ ] Expense policy configuration per organization
- [ ] Email notifications for approvals
- [ ] Reporting and analytics dashboard
