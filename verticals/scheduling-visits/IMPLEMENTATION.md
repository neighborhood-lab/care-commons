# Implementation: Scheduling & Visit Management

Technical implementation details for the Scheduling & Visit Management vertical.

## Architecture Overview

The Scheduling & Visit Management vertical follows a layered architecture:

```
┌─────────────────────────────────────────────────────┐
│                  API / HTTP Layer                    │
│              (Future: Express routes)                │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                  Service Layer                       │
│            (Business Logic & Rules)                  │
│  • ScheduleService                                   │
│  • Pattern validation                                │
│  • Visit lifecycle management                        │
│  • Conflict detection                                │
│  • Assignment logic                                  │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                Repository Layer                      │
│              (Data Access Logic)                     │
│  • ScheduleRepository                                │
│  • CRUD operations                                   │
│  • Query builders                                    │
│  • Data mapping                                      │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                  Database Layer                      │
│                   (PostgreSQL)                       │
│  • service_patterns table                            │
│  • schedules table                                   │
│  • visits table                                      │
│  • visit_exceptions table                            │
└─────────────────────────────────────────────────────┘
```

## Key Design Patterns

### 1. Service Pattern as Template

Service patterns are **immutable templates** once activated. Changes require:

- Creating a new version, OR
- Setting `effectiveTo` date and creating replacement

This ensures historical accuracy and audit compliance.

### 2. Visit Lifecycle State Machine

Visits follow a strict state machine with validated transitions:

```typescript
const validTransitions: Record<VisitStatus, VisitStatus[]> = {
  DRAFT: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['UNASSIGNED', 'ASSIGNED', 'CANCELLED'],
  UNASSIGNED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['CONFIRMED', 'EN_ROUTE', 'CANCELLED', 'REJECTED'],
  CONFIRMED: ['EN_ROUTE', 'CANCELLED', 'NO_SHOW_CAREGIVER'],
  EN_ROUTE: ['ARRIVED', 'CANCELLED', 'NO_SHOW_CAREGIVER'],
  ARRIVED: ['IN_PROGRESS', 'NO_SHOW_CLIENT'],
  IN_PROGRESS: ['PAUSED', 'COMPLETED', 'INCOMPLETE'],
  PAUSED: ['IN_PROGRESS', 'COMPLETED', 'INCOMPLETE'],
  // Terminal states
  COMPLETED: [],
  INCOMPLETE: [],
  CANCELLED: [],
  NO_SHOW_CLIENT: [],
  NO_SHOW_CAREGIVER: ['ASSIGNED'], // Can reassign
  REJECTED: ['ASSIGNED'], // Can reassign
};
```

Benefits:

- Prevents invalid state transitions
- Ensures data integrity
- Clear audit trail
- Predictable behavior

### 3. Event Sourcing for Status History

All status changes are recorded in an immutable `status_history` JSONB array:

```typescript
interface VisitStatusChange {
  id: UUID;
  fromStatus: VisitStatus | null;
  toStatus: VisitStatus;
  timestamp: Timestamp;
  changedBy: UUID;
  reason?: string;
  notes?: string;
  automatic: boolean;
}
```

Benefits:

- Complete audit trail
- Can reconstruct visit history
- Analytics on status patterns
- Compliance reporting

### 4. Conflict Detection

The service layer implements multi-level conflict detection:

```typescript
async validateVisitConflicts(input: CreateVisitInput): Promise<void> {
  // 1. Check client double-booking
  // 2. Check caregiver availability (when assigning)
  // 3. Check travel time between visits
  // 4. Respect authorization limits
}
```

### 5. Lazy Schedule Generation

Schedules are generated on-demand rather than at pattern creation:

**Pros:**

- Patterns can be edited before generation
- Can regenerate with different parameters
- Reduced upfront database load

**Cons:**

- Generation adds latency
- Need to handle partial failures

**Implementation:**

```typescript
async generateScheduleFromPattern(
  options: ScheduleGenerationOptions
): Promise<Visit[]> {
  // 1. Calculate dates from recurrence rule
  // 2. Filter holidays if requested
  // 3. Create visit records in transaction
  // 4. Optionally auto-assign caregivers
  // 5. Handle authorization limits
}
```

## Database Design

### Key Design Decisions

#### 1. JSONB for Flexible Data

We use JSONB extensively for:

- `recurrence` - Complex recurrence rules
- `status_history` - Append-only event log
- `address` - Structured address without FK overhead
- `verification_data` - EVV location records
- `signature_data` - Signature capture metadata

**Benefits:**

- Schema flexibility
- Fast queries with GIN indexes
- Atomic updates
- No JOIN overhead for nested data

#### 2. Denormalization for Performance

Visit records denormalize some data:

- `service_type_name` (from service type reference)
- `client_instructions` (from pattern)
- `address` (from client)

**Rationale:**

- Visits are historical records
- Original data may change
- Avoids JOINs on large visit table
- Preserves "what actually happened"

#### 3. Soft Deletes

All tables use soft deletes (`deleted_at` timestamp):

```sql
WHERE deleted_at IS NULL
```

**Benefits:**

- Data recovery
- Historical reporting
- Audit compliance
- Referential integrity

#### 4. Indexes for Common Queries

```sql
-- Client's schedule
CREATE INDEX idx_visits_client
  ON visits(client_id, scheduled_date)
  WHERE deleted_at IS NULL;

-- Caregiver's schedule
CREATE INDEX idx_visits_caregiver
  ON visits(assigned_caregiver_id, scheduled_date)
  WHERE deleted_at IS NULL;

-- Unassigned visits (hot query)
CREATE INDEX idx_visits_unassigned
  ON visits(organization_id, branch_id, scheduled_date)
  WHERE deleted_at IS NULL
    AND assigned_caregiver_id IS NULL
    AND status IN ('UNASSIGNED', 'SCHEDULED');

-- Full-text search
CREATE INDEX idx_visits_search
  ON visits USING gin(to_tsvector('english',
    coalesce(visit_number, '') || ' ' ||
    coalesce(client_instructions, '') || ' ' ||
    coalesce(caregiver_instructions, '')))
  WHERE deleted_at IS NULL;
```

## Business Logic

### Recurrence Rule Processing

The system supports multiple recurrence patterns:

#### Daily Pattern

```typescript
{
  frequency: 'DAILY',
  interval: 2, // Every 2 days
  startTime: '09:00',
  timezone: 'America/New_York'
}
```

#### Weekly Pattern

```typescript
{
  frequency: 'WEEKLY',
  interval: 1, // Every week
  daysOfWeek: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
  startTime: '10:00',
  timezone: 'America/New_York'
}
```

#### Bi-weekly Pattern

```typescript
{
  frequency: 'BIWEEKLY',
  interval: 1,
  daysOfWeek: ['MONDAY', 'THURSDAY'],
  startTime: '08:00',
  timezone: 'America/New_York'
}
```

#### Monthly Pattern

```typescript
{
  frequency: 'MONTHLY',
  interval: 1,
  datesOfMonth: [1, 15], // 1st and 15th of month
  startTime: '14:00',
  timezone: 'America/New_York'
}
```

**Algorithm:**

1. Start at `startDate`
2. Iterate through date range
3. Check if date matches recurrence rule
4. Generate visit for matching dates
5. Apply holidays filter if requested
6. Check authorization limits

### Caregiver Assignment Logic

The system supports multiple assignment strategies:

#### 1. Manual Assignment

Scheduler explicitly assigns caregiver:

```typescript
assignmentMethod: 'MANUAL';
```

#### 2. Auto-Match (Future)

System scores and recommends caregivers based on:

- **Skills Match** (40 points): Required certifications and skills
- **Availability** (30 points): No conflicts, sufficient gap time
- **Proximity** (15 points): Distance from client
- **Preference** (10 points): Client's preferred caregiver
- **History** (5 points): Past successful visits with client

```typescript
interface MatchScore {
  caregiverId: UUID;
  score: number; // 0-100
  reasons: string[];
  conflicts: string[];
}
```

#### 3. Preferred Assignment

Assign to client's preferred caregiver if available:

```typescript
if (pattern.preferredCaregivers) {
  for (const caregiverId of pattern.preferredCaregivers) {
    if (await isAvailable(caregiverId, visit)) {
      return assignCaregiver(caregiverId, 'PREFERRED');
    }
  }
}
```

#### 4. Self-Assignment (Future)

Caregivers can claim open shifts:

- View available shifts
- Self-assign if qualified
- Subject to approval if configured

### Availability Checking

Multi-factor availability check:

```typescript
async checkCaregiverAvailability(query: {
  caregiverId: UUID;
  date: Date;
  startTime: string;
  endTime: string;
  includeTravel: boolean;
}): Promise<boolean> {
  // 1. Get all visits for caregiver on date
  const visits = await getVisitsForDate(caregiverId, date);

  // 2. Convert times to minutes for comparison
  const requestedStart = timeToMinutes(startTime);
  const requestedEnd = timeToMinutes(endTime);

  // 3. Check each visit for overlap
  for (const visit of visits) {
    const visitStart = timeToMinutes(visit.scheduledStartTime);
    const visitEnd = timeToMinutes(visit.scheduledEndTime);

    // 4. Add travel time buffers
    if (includeTravel) {
      visitStart -= calculateTravelTime(visit);
      visitEnd += calculateTravelTime(visit);
    }

    // 5. Check for time overlap
    if (hasOverlap(requestedStart, requestedEnd, visitStart, visitEnd)) {
      return false;
    }
  }

  // 6. Check caregiver availability preferences (future)
  // const preferences = await getCaregiverPreferences(caregiverId);
  // if (!preferences.isAvailable(date, startTime, endTime)) {
  //   return false;
  // }

  return true;
}
```

### Authorization Limit Enforcement

Track and enforce authorized hours:

```typescript
async respectHourlyLimits(
  pattern: ServicePattern,
  visits: Visit[],
  startDate: Date,
  endDate: Date
): Promise<Visit[]> {
  if (!pattern.authorizedHoursPerWeek) {
    return visits; // No limit
  }

  const weeklyLimit = pattern.authorizedHoursPerWeek;
  const filteredVisits: Visit[] = [];
  const weeklyHours = new Map<string, number>();

  for (const visit of visits) {
    const weekKey = getWeekKey(visit.scheduledDate);
    const currentHours = weeklyHours.get(weekKey) || 0;
    const visitHours = visit.scheduledDuration / 60;

    if (currentHours + visitHours <= weeklyLimit) {
      filteredVisits.push(visit);
      weeklyHours.set(weekKey, currentHours + visitHours);
    } else {
      // Log warning: visit exceeds weekly limit
      console.warn(`Visit ${visit.visitNumber} exceeds weekly limit`);
    }
  }

  return filteredVisits;
}
```

## Permission Model

Permissions are checked at service layer:

```typescript
private checkPermission(
  context: UserContext,
  permission: string
): void {
  if (!context.permissions.includes(permission) &&
      !context.roles.includes('SUPER_ADMIN')) {
    throw new PermissionError(`Missing: ${permission}`);
  }
}
```

### Permission Matrix

| Action            | Required Permission  | Additional Checks      |
| ----------------- | -------------------- | ---------------------- |
| Create pattern    | `schedules:create`   | Organization access    |
| Read pattern      | `schedules:read`     | Organization access    |
| Update pattern    | `schedules:update`   | Organization access    |
| Delete pattern    | `schedules:delete`   | Organization + creator |
| Generate schedule | `schedules:generate` | Pattern owner          |
| Create visit      | `visits:create`      | Branch access          |
| Read visit        | `visits:read`        | Organization access    |
| Update visit      | `visits:update`      | Branch access          |
| Assign caregiver  | `visits:assign`      | Branch access          |
| Update status     | `visits:update`      | Role-dependent         |

### Role-Based Status Updates

Different roles can perform different status transitions:

```typescript
// Caregivers can only update their own visits
if (context.roles.includes('CAREGIVER')) {
  if (visit.assignedCaregiverId !== context.userId) {
    throw new PermissionError('Can only update own visits');
  }
  // Caregivers can: CONFIRMED, EN_ROUTE, ARRIVED, IN_PROGRESS,
  //                 PAUSED, COMPLETED, INCOMPLETE
}

// Coordinators can update any visit
if (context.roles.includes('COORDINATOR')) {
  // Full access to all status changes
}

// Clients/Family can only view
if (context.roles.includes('CLIENT') || context.roles.includes('FAMILY')) {
  throw new PermissionError('Cannot update visits');
}
```

## Validation Strategy

Multi-layered validation:

### 1. Schema Validation (Zod)

Runtime type checking and format validation:

```typescript
const validated = createVisitInputSchema.parse(input);
```

### 2. Business Rules Validation

Domain-specific logic:

```typescript
private async validatePatternBusinessRules(
  input: CreateServicePatternInput
): Promise<void> {
  // Check authorization date logic
  // Validate recurrence rule completeness
  // Check skill/certification references
}
```

### 3. Conflict Validation

Check for scheduling conflicts:

```typescript
private async validateVisitConflicts(
  input: CreateVisitInput
): Promise<void> {
  // Check client double-booking
  // Check caregiver availability
  // Validate time windows
}
```

### 4. State Transition Validation

Ensure valid status changes:

```typescript
private validateStatusTransition(
  currentStatus: VisitStatus,
  newStatus: VisitStatus,
  context: UserContext
): void {
  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    throw new ValidationError('Invalid transition');
  }
}
```

## Error Handling

Consistent error types from `@care-commons/core`:

```typescript
// Input validation errors
throw new ValidationError('Invalid recurrence rule', {
  field: 'recurrence',
  value: input.recurrence,
});

// Permission errors
throw new PermissionError('Access denied to branch', {
  userId: context.userId,
  branchId: input.branchId,
});

// Not found errors
throw new NotFoundError('Visit not found', {
  visitId: id,
});

// Business logic conflicts
throw new ConflictError('Client already has visit at this time', {
  existingVisitId: existingVisit.id,
});
```

## Testing Strategy

### Unit Tests

- Recurrence rule calculation
- Time conflict detection
- Status transition validation
- Permission checking

### Integration Tests

- Database operations
- Transaction handling
- Concurrent access

### End-to-End Tests

- Complete visit lifecycle
- Pattern generation
- Assignment workflow

## Performance Considerations

### Query Optimization

- Use indexes for common queries
- Partial indexes for filtered queries
- JSONB GIN indexes for nested data
- Avoid N+1 queries (batch loading)

### Caching Strategy (Future)

- Cache active patterns per client
- Cache caregiver availability for day
- Cache holiday calendars
- Invalidate on updates

### Batch Operations

- Bulk visit creation in transactions
- Batch assignment operations
- Bulk status updates

## Future Enhancements

### 1. Real-Time Updates

- WebSocket connections for live updates
- Push notifications for status changes
- Real-time calendar synchronization

### 2. Advanced Auto-Assignment

- Machine learning for optimal matching
- Historical performance analysis
- Predictive availability

### 3. Route Optimization

- Multi-visit route planning
- Travel time estimation (Google Maps API)
- Geographic clustering

### 4. Constraint Solver

- Automatic schedule optimization
- Conflict resolution suggestions
- What-if scenario modeling

### 5. Integration APIs

- Google Calendar sync
- Outlook calendar sync
- SMS reminder system
- Mobile push notifications

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
