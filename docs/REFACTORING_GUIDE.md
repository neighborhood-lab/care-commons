# Refactoring Guide

This guide outlines best practices for refactoring code in the Care Commons platform, with a focus on applying SOLID principles and reducing code duplication.

## Table of Contents

1. [When to Refactor](#when-to-refactor)
2. [SOLID Principles](#solid-principles)
3. [Common Refactoring Patterns](#common-refactoring-patterns)
4. [Available Utilities](#available-utilities)
5. [Code Review Checklist](#code-review-checklist)
6. [Tools and Automation](#tools-and-automation)

## When to Refactor

Refactor when you encounter:

- **Duplicate code** (DRY violation) - Same logic repeated in multiple places
- **Large files** (>300 lines) - Consider splitting into smaller modules
- **Complex functions** (>50 lines or complexity >10) - Break into smaller functions
- **God objects** - Classes/services doing too many things
- **Tight coupling** - Hard-coded dependencies between modules
- **Unclear intent** - Code that's hard to understand or test

### The Boy Scout Rule

> "Leave the code cleaner than you found it."

When touching existing code:
1. Fix obvious issues while you're there
2. Add missing type annotations
3. Extract magic numbers to constants
4. Improve variable names for clarity

## SOLID Principles

### Single Responsibility Principle (SRP)

**Definition**: A class/function should have one reason to change.

**Bad Example**:
```typescript
class ClientService {
  async create(data: any) { /* ... */ }
  async sendWelcomeEmail(client: Client) { /* ... */ }
  async generatePDF(client: Client) { /* ... */ }
  async checkEligibility(client: Client) { /* ... */ }
}
```

**Good Example**:
```typescript
class ClientService {
  async create(data: any) { /* ... */ }
  async findById(id: string) { /* ... */ }
}

class ClientNotificationService {
  async sendWelcomeEmail(client: Client) { /* ... */ }
}

class ClientEligibilityService {
  async checkMedicaidEligibility(client: Client) { /* ... */ }
}
```

### Open/Closed Principle (OCP)

**Definition**: Open for extension, closed for modification.

**Implementation**: Use inheritance, composition, or strategy patterns.

```typescript
// Base class that's closed for modification
abstract class BaseValidator {
  validate(data: unknown): ValidationResult {
    const schema = this.getSchema();
    return schema.parse(data);
  }

  abstract getSchema(): ZodSchema;
}

// Extend with new validators without modifying base
class ClientValidator extends BaseValidator {
  getSchema() {
    return clientSchema;
  }
}
```

### Liskov Substitution Principle (LSP)

**Definition**: Subtypes must be substitutable for their base types.

Ensure derived classes don't break expectations:
- Don't throw unexpected errors
- Don't add stricter preconditions
- Don't weaken postconditions

### Interface Segregation Principle (ISP)

**Definition**: Don't force clients to depend on methods they don't use.

**Bad**:
```typescript
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}

class Robot implements Worker {
  work() { /* ... */ }
  eat() { throw new Error('Robots don\'t eat'); } // ❌ Forced to implement
  sleep() { throw new Error('Robots don\'t sleep'); } // ❌ Forced to implement
}
```

**Good**:
```typescript
interface Workable {
  work(): void;
}

interface Biological {
  eat(): void;
  sleep(): void;
}

class Robot implements Workable {
  work() { /* ... */ } // ✅ Only implements what makes sense
}
```

### Dependency Inversion Principle (DIP)

**Definition**: Depend on abstractions, not concretions.

**Bad**:
```typescript
class VisitService {
  async create(data: any) {
    const client = await new ClientService().findById(data.clientId); // ❌ Tight coupling
  }
}
```

**Good**:
```typescript
class VisitService {
  constructor(
    private clientService: ClientService, // ✅ Inject dependencies
    private caregiverService: CaregiverService
  ) {}

  async create(data: any) {
    const client = await this.clientService.findById(data.clientId);
  }
}
```

## Common Refactoring Patterns

### Extract Common Utilities

#### Date Operations
Use `DateUtils` from `@care-commons/core`:

```typescript
import { DateUtils } from '@care-commons/core';

// Format dates consistently
const formatted = DateUtils.formatDate(new Date(), 'yyyy-MM-dd');
const dateTime = DateUtils.formatDateTime(new Date());

// Business days calculation
const deadline = DateUtils.addBusinessDays(new Date(), 5);

// Date range generation
const dates = DateUtils.getDateRange(startDate, endDate);
```

#### Validation Schemas
Use common schemas from `@care-commons/core`:

```typescript
import {
  emailSchema,
  phoneSchema,
  addressSchema,
  paginationSchema
} from '@care-commons/core';

const userSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  address: addressSchema,
  // ... other fields
});
```

#### Error Handling
Use standard error classes:

```typescript
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError
} from '@care-commons/core';

// In services
if (!client) {
  throw new NotFoundError('Client', id);
}

if (!validation.success) {
  throw new ValidationError('Invalid data', validation.errors);
}

// In Express routes
import { errorHandler, asyncHandler } from '@care-commons/core';

app.use(errorHandler);

router.get('/clients/:id', asyncHandler(async (req, res) => {
  const client = await clientService.findById(req.params.id);
  res.json(client);
}));
```

### Extract Reusable Components

#### Form Fields
Use `FormField` components from `packages/web`:

```typescript
import { FormField } from '@/components/forms/FormField';
import { useForm } from 'react-hook-form';

function ClientForm() {
  const { register, formState: { errors } } = useForm();

  return (
    <form>
      <FormField
        name="firstName"
        label="First Name"
        register={register}
        errors={errors}
        required
      />
      <FormField
        name="email"
        label="Email"
        type="email"
        register={register}
        errors={errors}
      />
    </form>
  );
}
```

### Extract Service Logic

When a service gets too large, split by responsibility:

```typescript
// Before: ClientService (400 lines)
class ClientService {
  create() { }
  update() { }
  delete() { }
  sendEmail() { }
  generateReport() { }
  checkEligibility() { }
}

// After: Split into focused services
class ClientService {
  create() { }
  update() { }
  delete() { }
}

class ClientNotificationService {
  sendWelcomeEmail() { }
  sendReminder() { }
}

class ClientReportService {
  generateReport() { }
  exportToCSV() { }
}

class ClientEligibilityService {
  checkMedicaidEligibility() { }
}
```

### Repository Pattern

Use the base `Repository` class from `@care-commons/core`:

```typescript
import { Repository } from '@care-commons/core';

class ClientRepository extends Repository<Client> {
  constructor(database: Database) {
    super({
      tableName: 'clients',
      database,
      enableAudit: true,
      enableSoftDelete: true,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): Client {
    // Map database row to domain entity
  }

  protected mapEntityToRow(entity: Partial<Client>): Record<string, unknown> {
    // Map domain entity to database row
  }

  // Add domain-specific queries
  async findByMedicaidId(medicaidId: string): Promise<Client | null> {
    // Custom query
  }
}
```

## Available Utilities

### Core Package (`@care-commons/core`)

#### Date Utilities
- `DateUtils.formatDate(date, format?)` - Format date to string
- `DateUtils.formatDateTime(date)` - Format as datetime
- `DateUtils.formatTime(date)` - Format time only
- `DateUtils.addBusinessDays(date, days)` - Add business days
- `DateUtils.getDateRange(start, end)` - Get array of dates
- `DateUtils.isWithinTolerance(actual, expected, minutes)` - Check time tolerance
- `DateUtils.isPast(date)` - Check if date is in past
- `DateUtils.isFuture(date)` - Check if date is in future

#### Validation Schemas
- `emailSchema` - Email validation
- `phoneSchema` - 10-digit phone
- `zipCodeSchema` - US ZIP code
- `ssnSchema` - SSN format
- `addressSchema` - Physical address
- `nameSchema` - Person name
- `paginationSchema` - Pagination params
- `dateRangeSchema` - Date range with validation

#### Error Classes
- `AppError` - Base error class
- `NotFoundError` - 404 errors
- `ValidationError` - 400 validation errors
- `UnauthorizedError` - 401 auth errors
- `ForbiddenError` - 403 permission errors
- `ConflictError` - 409 conflicts
- `errorHandler` - Express error middleware
- `asyncHandler` - Async route wrapper

### Web Package

#### Form Components
- `FormField` - Generic form field
- `CheckboxField` - Checkbox input
- `RadioField` - Radio button group

## Code Review Checklist

When reviewing code, check for:

### Code Quality
- [ ] No duplicate code (DRY principle)
- [ ] Functions are small and focused (<50 lines)
- [ ] Files are reasonably sized (<300 lines)
- [ ] Complexity is manageable (cyclomatic complexity <10)
- [ ] Functions have ≤3 parameters (use objects for more)

### SOLID Principles
- [ ] Each class/function has a single responsibility
- [ ] Code is open for extension, closed for modification
- [ ] Dependencies are injected, not created inline
- [ ] Interfaces are small and focused

### Type Safety
- [ ] All functions have explicit return types
- [ ] No `any` types (except in tests)
- [ ] Proper null/undefined handling
- [ ] Zod schemas for external data

### Error Handling
- [ ] Errors use standard error classes
- [ ] Async errors are properly caught
- [ ] Error messages are clear and actionable

### Testing
- [ ] New code has unit tests
- [ ] Edge cases are covered
- [ ] Tests are readable and maintainable

### Documentation
- [ ] Complex logic has comments
- [ ] Public APIs have JSDoc comments
- [ ] README updated if needed

## Tools and Automation

### Detect Duplicate Code

Run `jscpd` to find duplication:

```bash
npx jscpd --min-lines 10 --min-tokens 50 packages/ verticals/
```

### ESLint Rules

The project enforces SOLID principles via ESLint:

- `max-lines`: Warns at 300 lines per file
- `max-lines-per-function`: Warns at 50 lines per function
- `complexity`: Warns at cyclomatic complexity >10
- `max-depth`: Warns at nesting depth >3
- `max-params`: Warns at >3 function parameters

### Run Quality Checks

```bash
# Lint
npm run lint

# Type check
npm run typecheck

# Tests
npm run test

# Build
npm run build
```

## Best Practices Summary

1. **Keep it Simple** - Simple code is easier to understand and maintain
2. **Avoid Premature Optimization** - Make it work, then make it fast
3. **Test First** - Write tests before or while coding
4. **Refactor Regularly** - Small, frequent refactorings are safer
5. **Use Type System** - Let TypeScript catch errors early
6. **Follow Conventions** - Consistency makes code predictable
7. **Review Code** - Get feedback before merging
8. **Document Intent** - Explain *why*, not *what*

## Questions?

If you're unsure about a refactoring:
1. Discuss with the team
2. Start with a small, safe refactoring
3. Get code review feedback
4. Iterate and improve

Remember: **Perfect is the enemy of good.** Aim for continuous improvement, not perfection.
