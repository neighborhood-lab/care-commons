# Task 0021: Wire Provider Interfaces Across All Verticals

**Priority**: 🔴 CRITICAL
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 6-8 hours

## Context

While tasks 0000 and 0001 fix specific instances of mocked data, there's a broader architectural issue: provider interfaces (`IClientProvider`, `ICaregiverProvider`, `IVisitProvider`, etc.) are defined but not consistently wired up across all verticals. This prevents proper separation of concerns and makes testing difficult.

## Problem Statement

**Current State**:
- Provider interfaces exist in `packages/core/src/providers/`
- Some services use direct database queries instead of providers
- Dependency injection is inconsistent across verticals
- Testing is harder than it should be (can't easily mock providers)

**Impact**:
- Tight coupling between services and database layer
- Difficult to test services in isolation
- Hard to swap implementations (e.g., caching layer)
- Violates SOLID principles (Dependency Inversion)

## Task

### 1. Audit Current Provider Usage

Create a checklist of all services that need provider wiring:

**Verticals to Audit**:
- ✅ `client-demographics` - Already uses ClientProvider (verify)
- ✅ `caregiver-staff` - Already uses CaregiverProvider (verify)
- 🔍 `scheduling-visits` - Needs ClientProvider, CaregiverProvider, VisitProvider
- 🔍 `care-plans-tasks` - Needs ClientProvider, CarePlanProvider
- 🔍 `time-tracking-evv` - Needs VisitProvider, ClientProvider, CaregiverProvider (Task 0000 covers this)
- 🔍 `family-engagement` - Needs ClientProvider, FamilyMemberProvider
- 🔍 `shift-matching` - Needs ClientProvider, CaregiverProvider, VisitProvider
- 🔍 `billing-invoicing` - Needs ClientProvider, VisitProvider, ServiceProvider
- 🔍 `payroll-processing` - Needs CaregiverProvider, VisitProvider
- 🔍 `analytics-reporting` - Needs all providers for data aggregation

### 2. Define Missing Provider Interfaces

**Create `IVisitProvider`** (`packages/core/src/providers/visit.provider.ts`):

```typescript
export interface IVisitProvider {
  getVisitById(visitId: string): Promise<Visit | null>;
  getVisitsByIds(visitIds: string[]): Promise<Visit[]>;
  getVisitsByClientId(clientId: string, filters?: VisitFilters): Promise<Visit[]>;
  getVisitsByCaregiverId(caregiverId: string, filters?: VisitFilters): Promise<Visit[]>;
  getVisitsInDateRange(startDate: Date, endDate: Date, filters?: VisitFilters): Promise<Visit[]>;
  createVisit(data: CreateVisitInput): Promise<Visit>;
  updateVisit(visitId: string, data: UpdateVisitInput): Promise<Visit>;
  deleteVisit(visitId: string): Promise<void>;
}

export class VisitProvider implements IVisitProvider {
  constructor(private db: Knex) {}

  async getVisitById(visitId: string): Promise<Visit | null> {
    const visit = await this.db('visits')
      .where({ id: visitId, deleted_at: null })
      .first();
    return visit || null;
  }

  async getVisitsByIds(visitIds: string[]): Promise<Visit[]> {
    return this.db('visits')
      .whereIn('id', visitIds)
      .whereNull('deleted_at');
  }

  // ... implement other methods
}
```

**Create `ICarePlanProvider`** (`packages/core/src/providers/care-plan.provider.ts`):

```typescript
export interface ICarePlanProvider {
  getCarePlanById(carePlanId: string): Promise<CarePlan | null>;
  getCarePlansByClientId(clientId: string): Promise<CarePlan[]>;
  getActiveCarePlanForClient(clientId: string): Promise<CarePlan | null>;
  createCarePlan(data: CreateCarePlanInput): Promise<CarePlan>;
  updateCarePlan(carePlanId: string, data: UpdateCarePlanInput): Promise<CarePlan>;
  deleteCarePlan(carePlanId: string): Promise<void>;
}

export class CarePlanProvider implements ICarePlanProvider {
  constructor(private db: Knex) {}

  async getCarePlanById(carePlanId: string): Promise<CarePlan | null> {
    const plan = await this.db('care_plans')
      .where({ id: carePlanId, deleted_at: null })
      .first();
    return plan || null;
  }

  // ... implement other methods
}
```

**Create `IFamilyMemberProvider`** (`packages/core/src/providers/family-member.provider.ts`):

```typescript
export interface IFamilyMemberProvider {
  getFamilyMemberById(memberId: string): Promise<FamilyMember | null>;
  getFamilyMembersByClientId(clientId: string): Promise<FamilyMember[]>;
  createFamilyMember(data: CreateFamilyMemberInput): Promise<FamilyMember>;
  updateFamilyMember(memberId: string, data: UpdateFamilyMemberInput): Promise<FamilyMember>;
  deleteFamilyMember(memberId: string): Promise<void>;
}

export class FamilyMemberProvider implements IFamilyMemberProvider {
  constructor(private db: Knex) {}
  // ... implementation
}
```

### 3. Update Scheduling Service

**File**: `verticals/scheduling-visits/src/services/schedule.service.ts`

```typescript
import { IClientProvider } from '@care-commons/core/providers/client.provider';
import { ICaregiverProvider } from '@care-commons/core/providers/caregiver.provider';
import { IVisitProvider } from '@care-commons/core/providers/visit.provider';

export class ScheduleService {
  constructor(
    private db: Knex,
    private clientProvider: IClientProvider,
    private caregiverProvider: ICaregiverProvider,
    private visitProvider: IVisitProvider
  ) {}

  async getVisitsForWeek(weekStart: Date): Promise<Visit[]> {
    // OLD: Direct DB query
    // return this.db('visits').where(...)

    // NEW: Use provider
    const weekEnd = addDays(weekStart, 7);
    return this.visitProvider.getVisitsInDateRange(weekStart, weekEnd);
  }

  // ... update all methods to use providers
}
```

### 4. Update Shift Matching Service

**File**: `verticals/shift-matching/src/services/shift-matching.service.ts`

```typescript
import { IClientProvider } from '@care-commons/core/providers/client.provider';
import { ICaregiverProvider } from '@care-commons/core/providers/caregiver.provider';
import { IVisitProvider } from '@care-commons/core/providers/visit.provider';

export class ShiftMatchingService {
  constructor(
    private db: Knex,
    private clientProvider: IClientProvider,
    private caregiverProvider: ICaregiverProvider,
    private visitProvider: IVisitProvider
  ) {}

  async findMatchesForShift(shiftId: string): Promise<CaregiverMatch[]> {
    const shift = await this.visitProvider.getVisitById(shiftId);
    if (!shift) throw new Error('Shift not found');

    const client = await this.clientProvider.getClientById(shift.client_id);
    if (!client) throw new Error('Client not found');

    // Get available caregivers
    const caregivers = await this.caregiverProvider.getAvailableCaregivers(
      shift.scheduled_start,
      shift.scheduled_end
    );

    // Score and rank matches
    const matches = caregivers.map(caregiver =>
      this.scoreMatch(shift, client, caregiver)
    );

    return matches.sort((a, b) => b.score - a.score);
  }
}
```

### 5. Update Billing Service

**File**: `verticals/billing-invoicing/src/services/billing.service.ts`

```typescript
import { IClientProvider } from '@care-commons/core/providers/client.provider';
import { IVisitProvider } from '@care-commons/core/providers/visit.provider';

export class BillingService {
  constructor(
    private db: Knex,
    private clientProvider: IClientProvider,
    private visitProvider: IVisitProvider
  ) {}

  async generateInvoiceForClient(clientId: string, month: Date): Promise<Invoice> {
    const client = await this.clientProvider.getClientById(clientId);
    if (!client) throw new Error('Client not found');

    const startDate = startOfMonth(month);
    const endDate = endOfMonth(month);

    const visits = await this.visitProvider.getVisitsByClientId(clientId, {
      startDate,
      endDate,
      status: 'completed'
    });

    // Generate invoice from visits
    return this.createInvoice(client, visits);
  }
}
```

### 6. Update Payroll Service

**File**: `verticals/payroll-processing/src/services/payroll.service.ts`

```typescript
import { ICaregiverProvider } from '@care-commons/core/providers/caregiver.provider';
import { IVisitProvider } from '@care-commons/core/providers/visit.provider';

export class PayrollService {
  constructor(
    private db: Knex,
    private caregiverProvider: ICaregiverProvider,
    private visitProvider: IVisitProvider
  ) {}

  async calculatePayForPeriod(
    caregiverId: string,
    payPeriodStart: Date,
    payPeriodEnd: Date
  ): Promise<PayStub> {
    const caregiver = await this.caregiverProvider.getCaregiverById(caregiverId);
    if (!caregiver) throw new Error('Caregiver not found');

    const visits = await this.visitProvider.getVisitsByCaregiverId(caregiverId, {
      startDate: payPeriodStart,
      endDate: payPeriodEnd,
      status: 'completed'
    });

    // Calculate pay
    return this.generatePayStub(caregiver, visits);
  }
}
```

### 7. Update Care Plans Service

**File**: `verticals/care-plans-tasks/src/services/care-plan.service.ts`

```typescript
import { IClientProvider } from '@care-commons/core/providers/client.provider';
import { ICarePlanProvider } from '@care-commons/core/providers/care-plan.provider';

export class CarePlanService {
  constructor(
    private db: Knex,
    private clientProvider: IClientProvider,
    private carePlanProvider: ICarePlanProvider
  ) {}

  async createCarePlanForClient(
    clientId: string,
    data: CreateCarePlanInput
  ): Promise<CarePlan> {
    const client = await this.clientProvider.getClientById(clientId);
    if (!client) throw new Error('Client not found');

    // Create care plan
    return this.carePlanProvider.createCarePlan({
      ...data,
      client_id: clientId
    });
  }
}
```

### 8. Update Family Engagement Service

**File**: `verticals/family-engagement/src/services/portal.service.ts`

```typescript
import { IClientProvider } from '@care-commons/core/providers/client.provider';
import { IFamilyMemberProvider } from '@care-commons/core/providers/family-member.provider';
import { IVisitProvider } from '@care-commons/core/providers/visit.provider';

export class FamilyPortalService {
  constructor(
    private db: Knex,
    private clientProvider: IClientProvider,
    private familyMemberProvider: IFamilyMemberProvider,
    private visitProvider: IVisitProvider
  ) {}

  async getActivityFeedForFamily(
    familyMemberId: string
  ): Promise<ActivityFeedItem[]> {
    const familyMember = await this.familyMemberProvider.getFamilyMemberById(familyMemberId);
    if (!familyMember) throw new Error('Family member not found');

    const client = await this.clientProvider.getClientById(familyMember.client_id);
    if (!client) throw new Error('Client not found');

    const visits = await this.visitProvider.getVisitsByClientId(client.id, {
      limit: 30,
      orderBy: 'scheduled_start',
      order: 'desc'
    });

    return this.buildActivityFeed(visits);
  }
}
```

### 9. Create Provider Factory

**File**: `packages/core/src/providers/index.ts`

```typescript
import { Knex } from 'knex';
import { ClientProvider, IClientProvider } from './client.provider';
import { CaregiverProvider, ICaregiverProvider } from './caregiver.provider';
import { VisitProvider, IVisitProvider } from './visit.provider';
import { CarePlanProvider, ICarePlanProvider } from './care-plan.provider';
import { FamilyMemberProvider, IFamilyMemberProvider } from './family-member.provider';

export interface IProviders {
  client: IClientProvider;
  caregiver: ICaregiverProvider;
  visit: IVisitProvider;
  carePlan: ICarePlanProvider;
  familyMember: IFamilyMemberProvider;
}

export function createProviders(db: Knex): IProviders {
  return {
    client: new ClientProvider(db),
    caregiver: new CaregiverProvider(db),
    visit: new VisitProvider(db),
    carePlan: new CarePlanProvider(db),
    familyMember: new FamilyMemberProvider(db)
  };
}
```

### 10. Update Service Factories

Update each vertical's service factory to accept providers:

```typescript
// verticals/scheduling-visits/src/services/index.ts
import { Knex } from 'knex';
import { IProviders } from '@care-commons/core/providers';
import { ScheduleService } from './schedule.service';

export function createScheduleService(db: Knex, providers: IProviders): ScheduleService {
  return new ScheduleService(
    db,
    providers.client,
    providers.caregiver,
    providers.visit
  );
}
```

### 11. Update Tests

Update all service tests to use mocked providers:

```typescript
describe('ScheduleService', () => {
  let scheduleService: ScheduleService;
  let mockProviders: jest.Mocked<IProviders>;

  beforeEach(() => {
    mockProviders = {
      client: {
        getClientById: jest.fn(),
        getClientsByIds: jest.fn()
      } as any,
      caregiver: {
        getCaregiverById: jest.fn(),
        getAvailableCaregivers: jest.fn()
      } as any,
      visit: {
        getVisitById: jest.fn(),
        getVisitsInDateRange: jest.fn()
      } as any,
      // ... other providers
    };

    scheduleService = new ScheduleService(
      db,
      mockProviders.client,
      mockProviders.caregiver,
      mockProviders.visit
    );
  });

  it('should schedule a visit', async () => {
    mockProviders.client.getClientById.mockResolvedValue(mockClient);
    mockProviders.caregiver.getCaregiverById.mockResolvedValue(mockCaregiver);

    const visit = await scheduleService.createVisit({
      client_id: 'client-123',
      caregiver_id: 'caregiver-456',
      // ...
    });

    expect(visit).toBeDefined();
  });
});
```

## Acceptance Criteria

- [ ] All provider interfaces defined (`IVisitProvider`, `ICarePlanProvider`, `IFamilyMemberProvider`)
- [ ] All provider implementations created
- [ ] Scheduling service uses providers (no direct DB queries)
- [ ] Shift matching service uses providers
- [ ] Billing service uses providers
- [ ] Payroll service uses providers
- [ ] Care plans service uses providers
- [ ] Family engagement service uses providers
- [ ] Provider factory created
- [ ] Service factories updated
- [ ] All tests updated to use mocked providers
- [ ] All tests passing
- [ ] No direct DB queries in service logic (only in providers)
- [ ] Code reviewed and merged

## Testing Checklist

1. **Unit Tests**: All service tests pass with mocked providers
2. **Integration Tests**: Services work with real providers and database
3. **Isolation**: Each service can be tested without database connection
4. **Coverage**: Maintain 70%+ test coverage

## Definition of Done

- ✅ Provider interfaces consistently used across all verticals
- ✅ No direct database queries in service layer (only in providers)
- ✅ All tests pass with 70%+ coverage
- ✅ Services are testable in isolation
- ✅ Code follows SOLID principles (Dependency Inversion)
- ✅ Documentation updated

## Dependencies

**Blocks**: Tasks 0008 (E2E tests), 0015 (Refactoring)
**Depends on**: Tasks 0000, 0001 (same provider wiring work)

## Priority Justification

This is **CRITICAL** because:
1. Architectural foundation for all services
2. Enables proper testing (mocking)
3. Reduces coupling (easier to refactor)
4. Follows SOLID principles
5. Required for maintainability as codebase grows

---

**Next Task**: 0022 - Additional implementation tasks
