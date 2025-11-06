# Task 0015: Refactor Duplicate Code and Apply SOLID Principles

**Priority**: 🟡 MEDIUM
**Phase**: Phase 3 - Polish & Developer Experience
**Estimated Effort**: 8-12 hours

## Context

As the codebase has grown, some duplication has crept in and some services violate SOLID principles. Refactor to improve maintainability and reduce technical debt.

## Goals

- Eliminate duplicate code (DRY principle)
- Apply SOLID principles consistently
- Extract reusable patterns into shared utilities
- Improve code organization and testability

## Task

### 1. Identify Duplicate Code

**Run duplicate code detection**:

```bash
npm install --save-dev jscpd
npx jscpd --min-lines 10 --min-tokens 50 packages/ verticals/
```

**Common duplication patterns to look for**:
- CRUD operations across verticals
- Form validation logic
- Date formatting utilities
- Permission checking logic
- Error handling patterns

### 2. Extract Common CRUD Pattern

Many services have similar CRUD operations. Extract to base class:

**File**: `packages/core/src/services/base-crud.service.ts`

```typescript
import { Knex } from 'knex';
import knex from '../db/knex';

export abstract class BaseCRUDService<T> {
  constructor(
    protected tableName: string,
    protected db: Knex = knex
  ) {}

  async findAll(filters?: Partial<T>): Promise<T[]> {
    let query = this.db(this.tableName).where('deleted_at', null);

    if (filters) {
      query = query.where(filters);
    }

    return query.select('*');
  }

  async findById(id: string): Promise<T | null> {
    const record = await this.db(this.tableName)
      .where('id', id)
      .where('deleted_at', null)
      .first();

    return record || null;
  }

  async create(data: Partial<T>): Promise<T> {
    const [created] = await this.db(this.tableName)
      .insert({
        ...data,
        id: this.generateId(),
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    await this.afterCreate(created);

    return created;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const [updated] = await this.db(this.tableName)
      .where('id', id)
      .update({
        ...data,
        updated_at: new Date()
      })
      .returning('*');

    await this.afterUpdate(updated);

    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    // Soft delete
    await this.db(this.tableName)
      .where('id', id)
      .update({
        deleted_at: new Date(),
        deleted_by: userId
      });

    await this.afterDelete(id);
  }

  // Hook methods for subclasses to override
  protected async afterCreate(record: T): Promise<void> {}
  protected async afterUpdate(record: T): Promise<void> {}
  protected async afterDelete(id: string): Promise<void> {}

  protected generateId(): string {
    return crypto.randomUUID();
  }
}
```

**Refactor services to use base class**:

**Before**:
```typescript
export class ClientService {
  async findAll() {
    return knex('clients').where('deleted_at', null).select('*');
  }

  async findById(id: string) {
    return knex('clients').where('id', id).where('deleted_at', null).first();
  }

  async create(data: any) {
    const [created] = await knex('clients').insert({
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date()
    }).returning('*');
    return created;
  }

  // ... similar repetitive code
}
```

**After**:
```typescript
export class ClientService extends BaseCRUDService<Client> {
  constructor() {
    super('clients');
  }

  // Override hook for client-specific logic
  protected async afterCreate(client: Client): Promise<void> {
    // Send welcome email, create default care plan, etc.
    await this.sendWelcomeEmail(client);
  }

  // Add client-specific methods
  async findByMedicaidId(medicaidId: string): Promise<Client | null> {
    return this.db(this.tableName)
      .where('medicaid_id', medicaidId)
      .where('deleted_at', null)
      .first();
  }
}
```

### 3. Extract Date Utilities

**File**: `packages/core/src/utils/date.utils.ts`

Consolidate date formatting logic:

```typescript
import { format, parseISO, addDays, differenceInDays } from 'date-fns';

export class DateUtils {
  static formatDate(date: Date | string, formatStr = 'yyyy-MM-dd'): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  }

  static formatDateTime(date: Date | string): string {
    return this.formatDate(date, 'yyyy-MM-dd HH:mm:ss');
  }

  static formatTime(date: Date | string): string {
    return this.formatDate(date, 'HH:mm');
  }

  static addBusinessDays(date: Date, days: number): Date {
    // Skip weekends
    let result = date;
    let addedDays = 0;

    while (addedDays < days) {
      result = addDays(result, 1);
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        addedDays++;
      }
    }

    return result;
  }

  static isWithinTolerance(
    actual: Date,
    expected: Date,
    toleranceMinutes: number
  ): boolean {
    const diffMinutes = Math.abs(differenceInDays(actual, expected) * 24 * 60);
    return diffMinutes <= toleranceMinutes;
  }

  static getDateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    let current = start;

    while (current <= end) {
      dates.push(current);
      current = addDays(current, 1);
    }

    return dates;
  }
}
```

Replace all date formatting throughout codebase with `DateUtils`.

### 4. Extract Validation Schemas

**File**: `packages/core/src/validation/common-schemas.ts`

Extract reusable Zod schemas:

```typescript
import { z } from 'zod';

// Common field schemas
export const emailSchema = z.string().email().toLowerCase();
export const phoneSchema = z.string().regex(/^\d{10}$/);
export const zipCodeSchema = z.string().regex(/^\d{5}(-\d{4})?$/);
export const ssnSchema = z.string().regex(/^\d{3}-\d{2}-\d{4}$/);
export const uuidSchema = z.string().uuid();

// Common object schemas
export const addressSchema = z.object({
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  zipCode: zipCodeSchema,
  country: z.string().default('US')
});

export const nameSchema = z.object({
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100),
  suffix: z.enum(['Jr', 'Sr', 'II', 'III', 'IV']).optional()
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50)
});

export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date()
}).refine(data => data.endDate >= data.startDate, {
  message: 'End date must be after start date'
});

// Reuse across services
export const createClientSchema = z.object({
  ...nameSchema.shape,
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  dateOfBirth: z.coerce.date(),
  address: addressSchema,
  // ... client-specific fields
});
```

### 5. Apply Single Responsibility Principle (SRP)

**Identify services with too many responsibilities**:

**Before** (ClientService doing too much):
```typescript
export class ClientService {
  async create(data: any) { /* ... */ }
  async findAll() { /* ... */ }
  async sendWelcomeEmail(client: Client) { /* ... */ }
  async generateCarePlan(client: Client) { /* ... */ }
  async checkEligibility(client: Client) { /* ... */ }
  async exportToCSV(clients: Client[]) { /* ... */ }
}
```

**After** (split into focused services):
```typescript
// Core CRUD operations only
export class ClientService extends BaseCRUDService<Client> {
  constructor() {
    super('clients');
  }
}

// Email responsibilities
export class ClientNotificationService {
  async sendWelcomeEmail(client: Client) { /* ... */ }
  async sendBirthdayGreeting(client: Client) { /* ... */ }
}

// Care plan generation
export class CarePlanGenerationService {
  async generateInitialCarePlan(client: Client) { /* ... */ }
}

// Eligibility checking
export class EligibilityService {
  async checkMedicaidEligibility(client: Client) { /* ... */ }
  async checkInsuranceEligibility(client: Client) { /* ... */ }
}

// Export responsibilities
export class ClientExportService {
  async exportToCSV(clients: Client[]) { /* ... */ }
  async exportToPDF(clients: Client[]) { /* ... */ }
}
```

### 6. Apply Dependency Injection

**Before** (tight coupling):
```typescript
export class VisitService {
  async createVisit(data: any) {
    const client = await new ClientService().findById(data.clientId);
    const caregiver = await new CaregiverService().findById(data.caregiverId);
    // ...
  }
}
```

**After** (dependency injection):
```typescript
export class VisitService {
  constructor(
    private clientService: ClientService,
    private caregiverService: CaregiverService,
    private notificationService: NotificationService
  ) {}

  async createVisit(data: any) {
    const client = await this.clientService.findById(data.clientId);
    const caregiver = await this.caregiverService.findById(data.caregiverId);
    // ...
  }
}

// In route handler
const visitService = new VisitService(
  new ClientService(),
  new CaregiverService(),
  new NotificationService()
);
```

Or use dependency injection container (optional):

```bash
npm install tsyringe reflect-metadata
```

```typescript
import { injectable, inject } from 'tsyringe';

@injectable()
export class VisitService {
  constructor(
    @inject('ClientService') private clientService: ClientService,
    @inject('CaregiverService') private caregiverService: CaregiverService
  ) {}
}
```

### 7. Extract Common Error Handling

**File**: `packages/core/src/errors/app-errors.ts`

```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

// Global error handler
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      ...(err instanceof ValidationError && { details: err.details })
    });
  }

  // Unexpected errors
  console.error('Unexpected error:', err);
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  });
}
```

### 8. Extract Form Patterns

**File**: `packages/web/src/components/forms/FormField.tsx`

Consolidate form field rendering:

```typescript
interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea';
  options?: Array<{ value: string; label: string }>;
  register: UseFormRegister<any>;
  errors?: FieldErrors;
  required?: boolean;
  disabled?: boolean;
}

export function FormField({
  name,
  label,
  type = 'text',
  options,
  register,
  errors,
  required,
  disabled
}: FormFieldProps) {
  const error = errors?.[name];

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'select' ? (
        <select
          id={name}
          {...register(name)}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Select...</option>
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          {...register(name)}
          disabled={disabled}
          rows={4}
          className="w-full px-3 py-2 border rounded-lg"
        />
      ) : (
        <input
          id={name}
          type={type}
          {...register(name)}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded-lg"
        />
      )}

      {error && (
        <p className="text-sm text-red-600 mt-1">
          {error.message as string}
        </p>
      )}
    </div>
  );
}
```

### 9. Create Linting Rules for SOLID

**File**: `.eslintrc.js`

```javascript
module.exports = {
  rules: {
    // Enforce max lines per file (SRP)
    'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],

    // Enforce max lines per function (SRP)
    'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],

    // Enforce max complexity (SRP)
    'complexity': ['warn', 10],

    // Enforce max depth (readability)
    'max-depth': ['warn', 3],

    // Enforce max params (DIP - use objects instead)
    'max-params': ['warn', 3],
  }
};
```

### 10. Document Refactoring Patterns

**File**: `docs/REFACTORING_GUIDE.md`

Create guide for future refactoring:
- When to extract a utility
- When to create a service
- How to apply SOLID principles
- Common refactoring patterns
- Code review checklist

## Acceptance Criteria

- [ ] Duplicate code identified and eliminated
- [ ] BaseCRUDService implemented and adopted
- [ ] Common utilities extracted (date, validation, errors)
- [ ] Services follow SRP (single responsibility)
- [ ] Dependency injection applied
- [ ] Form components consolidated
- [ ] Error handling standardized
- [ ] ESLint rules enforced
- [ ] All tests still passing
- [ ] Documentation updated

## Metrics

**Before refactoring**:
- Run `npx jscpd` to get duplication baseline
- Measure average file size
- Count number of services

**After refactoring**:
- Duplication reduced by >50%
- Average file size reduced
- Code is more testable (easier to mock dependencies)

## Reference

- SOLID Principles: https://en.wikipedia.org/wiki/SOLID
- Refactoring (Martin Fowler): https://refactoring.com/
- Clean Code (Robert Martin): https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882
