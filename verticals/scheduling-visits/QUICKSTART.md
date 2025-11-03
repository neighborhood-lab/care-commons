# Quickstart: Scheduling & Visit Management

Get started with the Scheduling & Visit Management vertical in 10 minutes.

## Prerequisites

- Care Commons core package installed
- PostgreSQL database running
- Client & Demographics vertical (for client data)
- Caregiver & Staff vertical (for caregiver assignments)

## Installation

```bash
cd verticals/scheduling-visits
npm install
npm run build
```

## Database Setup

Run the migration to create scheduling tables:

```bash
cd ../../packages/core
npm run db:migrate
```

This creates:

- `service_patterns` - Recurring service templates
- `schedules` - Generated visit schedules
- `visits` - Individual visit occurrences
- `visit_exceptions` - Exception tracking

## Basic Usage

### 1. Initialize the Service

```typescript
import { Pool } from 'pg';
import {
  ScheduleRepository,
  ScheduleService,
} from '@care-commons/scheduling-visits';

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Initialize repository and service
const repository = new ScheduleRepository(pool);
const scheduleService = new ScheduleService(repository);
```

### 2. Create a Service Pattern

Service patterns are templates for recurring care schedules.

```typescript
import { UserContext } from '@care-commons/core';

const userContext: UserContext = {
  userId: 'user-123',
  roles: ['COORDINATOR'],
  permissions: ['schedules:create', 'visits:create'],
  organizationId: 'org-456',
  branchIds: ['branch-789'],
};

// Create a pattern for daily morning care
const pattern = await scheduleService.createServicePattern(
  {
    organizationId: 'org-456',
    branchId: 'branch-789',
    clientId: 'client-abc',
    name: 'Daily Morning Personal Care',
    patternType: 'RECURRING',
    serviceTypeId: 'service-type-001',
    serviceTypeName: 'Personal Care',

    // Schedule: Monday-Friday, 8:00 AM, 2 hours
    recurrence: {
      frequency: 'WEEKLY',
      interval: 1,
      daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      startTime: '08:00',
      timezone: 'America/New_York',
    },
    duration: 120, // 2 hours

    // Requirements
    requiredCertifications: ['HHA', 'CPR'],

    // Active for one year
    effectiveFrom: new Date('2024-01-01'),
    effectiveTo: new Date('2024-12-31'),

    // Instructions
    clientInstructions:
      'Use side entrance. Client prefers shower before breakfast.',
    caregiverInstructions: 'Assist with hygiene, dressing, and breakfast prep.',
  },
  userContext
);

console.log(`Created pattern: ${pattern.id}`);
```

### 3. Generate Visit Schedule

Generate visits for the next 4 weeks:

```typescript
const visits = await scheduleService.generateScheduleFromPattern(
  {
    patternId: pattern.id,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-28'),
    autoAssign: false, // We'll assign manually
    respectHourlyLimits: true,
    skipHolidays: true,
  },
  userContext
);

console.log(`Generated ${visits.length} visits`);
```

### 4. Assign a Caregiver

Assign a caregiver to a visit:

```typescript
const visit = visits[0];

// Check if caregiver is available
const isAvailable = await scheduleService.checkCaregiverAvailability({
  caregiverId: 'caregiver-xyz',
  date: visit.scheduledDate,
  startTime: visit.scheduledStartTime,
  endTime: visit.scheduledEndTime,
  includeTravel: true,
});

if (isAvailable) {
  const assignedVisit = await scheduleService.assignCaregiver(
    {
      visitId: visit.id,
      caregiverId: 'caregiver-xyz',
      assignmentMethod: 'MANUAL',
      notes: 'Best available match for this client',
    },
    userContext
  );

  console.log(`Assigned caregiver to visit ${assignedVisit.visitNumber}`);
} else {
  console.log('Caregiver not available');
}
```

### 5. Track Visit Lifecycle

Update visit status as it progresses:

```typescript
// Caregiver confirms the visit
await scheduleService.updateVisitStatus(
  {
    visitId: visit.id,
    newStatus: 'CONFIRMED',
    notes: 'Caregiver confirmed availability',
  },
  userContext
);

// Caregiver en route
await scheduleService.updateVisitStatus(
  {
    visitId: visit.id,
    newStatus: 'EN_ROUTE',
  },
  userContext
);

// Clock in with GPS verification
await scheduleService.updateVisitStatus(
  {
    visitId: visit.id,
    newStatus: 'IN_PROGRESS',
    locationVerification: {
      method: 'GPS',
      timestamp: new Date(),
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 10,
      isWithinGeofence: true,
    },
  },
  userContext
);

// Complete the visit
await scheduleService.completeVisit(
  {
    visitId: visit.id,
    actualEndTime: new Date(),
    completionNotes: 'All tasks completed. Client doing well.',
    tasksCompleted: 5,
    tasksTotal: 5,
    locationVerification: {
      method: 'GPS',
      timestamp: new Date(),
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 12,
      isWithinGeofence: true,
    },
  },
  userContext
);

console.log('Visit completed successfully');
```

### 6. Search Visits

Find visits by various criteria:

```typescript
// Get today's visits for a branch
const todayVisits = await scheduleService.searchVisits(
  {
    branchId: 'branch-789',
    dateFrom: new Date(),
    dateTo: new Date(),
    status: ['ASSIGNED', 'CONFIRMED', 'IN_PROGRESS'],
  },
  {
    page: 1,
    limit: 50,
    sortBy: 'scheduled_start_time',
    sortOrder: 'asc',
  },
  userContext
);

console.log(`${todayVisits.total} visits scheduled today`);

// Get unassigned visits that need caregivers
const unassigned = await scheduleService.getUnassignedVisits(
  'org-456',
  'branch-789',
  userContext
);

console.log(`${unassigned.length} visits need assignment`);

// Get a caregiver's schedule for the day
const caregiverSchedule = await scheduleService.searchVisits(
  {
    caregiverId: 'caregiver-xyz',
    dateFrom: new Date(),
    dateTo: new Date(),
  },
  {
    page: 1,
    limit: 20,
    sortBy: 'scheduled_start_time',
    sortOrder: 'asc',
  },
  userContext
);

console.log(`Caregiver has ${caregiverSchedule.total} visits today`);
```

## Common Patterns

### Creating One-Time Visit

For emergency or non-recurring visits:

```typescript
const emergencyVisit = await scheduleService.createVisit(
  {
    organizationId: 'org-456',
    branchId: 'branch-789',
    clientId: 'client-abc',
    visitType: 'EMERGENCY',
    serviceTypeId: 'service-type-001',
    serviceTypeName: 'Personal Care',
    scheduledDate: new Date(),
    scheduledStartTime: '14:00',
    scheduledEndTime: '16:00',
    address: {
      line1: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62701',
      country: 'US',
    },
    isUrgent: true,
    clientInstructions: 'Emergency call from family',
  },
  userContext
);
```

### Finding Available Time Slots

Get available time slots for a caregiver:

```typescript
const slots = await scheduleService.getCaregiverAvailabilitySlots({
  caregiverId: 'caregiver-xyz',
  date: new Date('2024-01-15'),
  duration: 120, // 2-hour visit
  includeTravel: true,
});

slots.forEach((slot) => {
  if (slot.isAvailable) {
    console.log(`Available: ${slot.startTime} - ${slot.endTime}`);
  }
});
```

### Handling Visit Cancellation

```typescript
await scheduleService.updateVisitStatus(
  {
    visitId: visit.id,
    newStatus: 'CANCELLED',
    reason: 'Client hospitalized',
    notes: 'Family called to cancel. Will reschedule after discharge.',
  },
  userContext
);
```

### Handling No-Shows

```typescript
// Client wasn't home
await scheduleService.updateVisitStatus(
  {
    visitId: visit.id,
    newStatus: 'NO_SHOW_CLIENT',
    reason: 'Client not home at scheduled time',
    notes: 'Caregiver waited 15 minutes and called multiple times.',
  },
  userContext
);

// Caregiver didn't show up
await scheduleService.updateVisitStatus(
  {
    visitId: visit.id,
    newStatus: 'NO_SHOW_CAREGIVER',
    reason: 'Caregiver did not arrive',
    notes: 'Need to reassign immediately',
  },
  userContext
);

// Now reassign to another caregiver
await scheduleService.assignCaregiver(
  {
    visitId: visit.id,
    caregiverId: 'backup-caregiver-123',
    assignmentMethod: 'OVERFLOW',
    notes: 'Reassigned due to no-show',
  },
  userContext
);
```

## Next Steps

- Read the [full README](./README.md) for detailed API documentation
- Check [IMPLEMENTATION.md](./IMPLEMENTATION.md) for architecture details
- Explore the [types](./src/types/schedule.ts) for all available options
- Review status transition rules for visit lifecycle management
- Integrate with Time Tracking & EVV vertical for complete visit verification
- Connect with Billing vertical for automated invoicing

## Getting Help

- Review the [test cases](./src/__tests__/) for more examples
- Check the [Care Commons documentation](https://docs.care-commons.org)
- Open an issue on [GitHub](https://github.com/neighborhood-lab/care-commons)

---

**Care Commons** - Shared care software, community owned
