# Care Plans & Tasks Library - Quick Reference

## Core Entities

### CarePlan

```typescript
{
  id: UUID
  planNumber: string          // e.g., "CP-ABC123"
  name: string
  clientId: UUID
  planType: CarePlanType      // PERSONAL_CARE, COMPANION, etc.
  status: CarePlanStatus      // DRAFT, ACTIVE, EXPIRED, etc.
  effectiveDate: Date
  expirationDate?: Date
  goals: CarePlanGoal[]
  interventions: Intervention[]
  taskTemplates: TaskTemplate[]
  authorizationNumber?: string
  authorizationHours?: number
  complianceStatus: ComplianceStatus
}
```

### CarePlanGoal

```typescript
{
  id: UUID
  name: string
  description: string
  category: GoalCategory       // MOBILITY, ADL, IADL, etc.
  status: GoalStatus          // NOT_STARTED, IN_PROGRESS, ACHIEVED, etc.
  priority: Priority          // LOW, MEDIUM, HIGH, URGENT
  targetDate?: Date
  measurementType?: 'QUANTITATIVE' | 'QUALITATIVE' | 'BINARY'
  targetValue?: number
  progressPercentage?: number
}
```

### Intervention

```typescript
{
  id: UUID
  name: string
  category: InterventionCategory  // ASSISTANCE_WITH_ADL, MEDICATION_ADMINISTRATION, etc.
  goalIds: UUID[]
  frequency: Frequency           // Pattern, times per day/week, specific times/days
  instructions: string
  performedBy: PerformerType[]   // CAREGIVER, CNA, RN, etc.
  requiresDocumentation: boolean
  status: 'ACTIVE' | 'SUSPENDED' | 'DISCONTINUED'
}
```

### TaskTemplate

```typescript
{
  id: UUID
  name: string
  category: TaskCategory      // BATHING, DRESSING, MEDICATION, etc.
  frequency: Frequency
  instructions: string
  steps?: TaskStep[]
  requiresSignature: boolean
  requiresNote: boolean
  qualityChecks?: QualityCheck[]
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
}
```

### TaskInstance

```typescript
{
  id: UUID
  carePlanId: UUID
  visitId?: UUID
  clientId: UUID
  scheduledDate: Date
  status: TaskStatus          // SCHEDULED, COMPLETED, SKIPPED, etc.
  completedAt?: Date
  completionNote?: string
  completionSignature?: Signature
  verificationData?: VerificationData
}
```

### ProgressNote

```typescript
{
  id: UUID
  carePlanId: UUID
  clientId: UUID
  noteType: ProgressNoteType  // VISIT_NOTE, WEEKLY_SUMMARY, etc.
  content: string
  goalProgress?: GoalProgress[]
  observations?: Observation[]
  signature?: Signature
}
```

## Enums & Types

### Plan Types

- `PERSONAL_CARE` - Personal care services
- `COMPANION` - Companionship services
- `SKILLED_NURSING` - Skilled nursing care
- `THERAPY` - Therapy services
- `HOSPICE` - Hospice care
- `RESPITE` - Respite care
- `LIVE_IN` - Live-in care

### Care Plan Status

- `DRAFT` - Plan in draft state
- `PENDING_APPROVAL` - Awaiting approval
- `ACTIVE` - Currently active
- `ON_HOLD` - Temporarily on hold
- `EXPIRED` - Past expiration date
- `DISCONTINUED` - Discontinued by coordinator
- `COMPLETED` - Services completed

### Goal Categories

- `MOBILITY` - Movement and ambulation
- `ADL` - Activities of daily living
- `IADL` - Instrumental ADL
- `NUTRITION` - Nutrition and hydration
- `MEDICATION_MANAGEMENT` - Medication adherence
- `SAFETY` - Safety and fall prevention
- `SOCIAL_ENGAGEMENT` - Social interaction
- `COGNITIVE` - Cognitive function
- `EMOTIONAL_WELLBEING` - Emotional health
- `PAIN_MANAGEMENT` - Pain control
- `WOUND_CARE` - Wound management
- `CHRONIC_DISEASE_MANAGEMENT` - Disease management

### Task Categories

- `PERSONAL_HYGIENE` / `BATHING` / `DRESSING` / `GROOMING` / `TOILETING`
- `MOBILITY` / `TRANSFERRING` / `AMBULATION`
- `MEDICATION` - Med administration/reminder
- `MEAL_PREPARATION` / `FEEDING`
- `HOUSEKEEPING` / `LAUNDRY` / `SHOPPING`
- `TRANSPORTATION`
- `COMPANIONSHIP`
- `MONITORING`
- `DOCUMENTATION`

### Task Status

- `SCHEDULED` - Not yet started
- `IN_PROGRESS` - Currently being performed
- `COMPLETED` - Successfully completed
- `SKIPPED` - Skipped with reason
- `MISSED` - Not completed (overdue)
- `CANCELLED` - Cancelled
- `ISSUE_REPORTED` - Issue flagged

### Verification Types

- `NONE` - No verification needed
- `CHECKBOX` - Simple checkbox
- `SIGNATURE` - Electronic signature required
- `PHOTO` - Photo evidence
- `GPS` - GPS location verification
- `BARCODE_SCAN` - Barcode/QR scan
- `VITAL_SIGNS` - Vital signs measurement
- `CUSTOM` - Custom verification

## Service Methods

### Care Plan Management

```typescript
// Create
createCarePlan(input, context): Promise<CarePlan>

// Read
getCarePlanById(id, context): Promise<CarePlan>
getCarePlansByClientId(clientId, context): Promise<CarePlan[]>
getActiveCarePlanForClient(clientId, context): Promise<CarePlan | null>
searchCarePlans(filters, pagination, context): Promise<PaginatedResult<CarePlan>>

// Update
updateCarePlan(id, input, context): Promise<CarePlan>
activateCarePlan(id, context): Promise<CarePlan>

// Delete
deleteCarePlan(id, context): Promise<void>

// Utilities
getExpiringCarePlans(days, context): Promise<CarePlan[]>
getCarePlanAnalytics(orgId, context): Promise<CarePlanAnalytics>
```

### Task Management

```typescript
// Create
createTaskInstance(input, context): Promise<TaskInstance>
createTasksForVisit(carePlanId, visitId, date, context): Promise<TaskInstance[]>

// Read
getTaskInstanceById(id, context): Promise<TaskInstance>
getTasksByVisitId(visitId, context): Promise<TaskInstance[]>
searchTaskInstances(filters, pagination, context): Promise<PaginatedResult<TaskInstance>>

// Update
completeTask(id, input, context): Promise<TaskInstance>
skipTask(id, reason, note, context): Promise<TaskInstance>
reportTaskIssue(id, description, context): Promise<TaskInstance>

// Analytics
getTaskCompletionMetrics(filters, context): Promise<TaskCompletionMetrics>
```

### Progress Notes

```typescript
// Create
createProgressNote(input, context): Promise<ProgressNote>

// Read
getProgressNotesByCarePlanId(carePlanId, context): Promise<ProgressNote[]>
```

## Common Workflows

### 1. Create & Activate Care Plan

```typescript
// Create plan
const plan = await service.createCarePlan({
  clientId: 'client-123',
  organizationId: 'org-456',
  name: 'Personal Care Plan',
  planType: 'PERSONAL_CARE',
  effectiveDate: new Date(),
  goals: [{ name: 'Improve Mobility', ... }],
  interventions: [{ name: 'Ambulation Assistance', ... }],
  taskTemplates: [{ name: 'Morning Walk', ... }],
}, context);

// Activate plan
await service.activateCarePlan(plan.id, context);
```

### 2. Generate & Complete Tasks

```typescript
// Generate tasks for visit
const tasks = await service.createTasksForVisit(
  carePlanId,
  visitId,
  new Date(),
  context
);

// Complete each task
for (const task of tasks) {
  await service.completeTask(
    task.id,
    {
      completionNote: 'Task completed successfully',
      signature: {
        /* signature data */
      },
      verificationData: {
        /* GPS, photos, etc. */
      },
    },
    context
  );
}
```

### 3. Document Progress

```typescript
// Create visit note
await service.createProgressNote(
  {
    carePlanId,
    clientId,
    visitId,
    noteType: 'VISIT_NOTE',
    content: 'Client doing well today...',
    goalProgress: [
      {
        goalId: 'goal-123',
        status: 'ON_TRACK',
        progressDescription: 'Making good progress',
      },
    ],
    observations: [
      {
        category: 'PHYSICAL',
        observation: 'Client walked 15 minutes today',
      },
    ],
  },
  context
);
```

### 4. Monitor & Review

```typescript
// Get expiring plans
const expiring = await service.getExpiringCarePlans(30, context);

// Get analytics
const analytics = await service.getCarePlanAnalytics(orgId, context);
console.log(`Active plans: ${analytics.activePlans}`);
console.log(`Goal completion: ${analytics.goalCompletionRate}%`);

// Get task metrics
const metrics = await service.getTaskCompletionMetrics(
  {
    dateFrom: startDate,
    dateTo: endDate,
    organizationId: orgId,
  },
  context
);
console.log(`Completion rate: ${metrics.completionRate}%`);
```

## Search Filters

### Care Plan Filters

```typescript
{
  query?: string                // Text search
  clientId?: UUID
  organizationId?: UUID
  branchId?: UUID
  status?: CarePlanStatus[]
  planType?: CarePlanType[]
  coordinatorId?: UUID
  expiringWithinDays?: number   // e.g., 30
  needsReview?: boolean
  complianceStatus?: ComplianceStatus[]
}
```

### Task Filters

```typescript
{
  carePlanId?: UUID
  clientId?: UUID
  assignedCaregiverId?: UUID
  visitId?: UUID
  status?: TaskStatus[]
  category?: TaskCategory[]
  scheduledDateFrom?: Date
  scheduledDateTo?: Date
  overdue?: boolean
  requiresSignature?: boolean
}
```

## Validation Rules

### Care Plan Activation

- ✅ Must have at least 1 goal
- ✅ Must have at least 1 intervention
- ✅ Must have assigned coordinator
- ✅ Effective date not in future
- ✅ Expiration date after effective date

### Task Completion

- ✅ Signature if `requiredSignature = true`
- ✅ Note if `requiredNote = true`
- ✅ Custom fields if required
- ✅ Valid vital signs ranges

### Vital Signs Ranges

- BP Systolic: 50-250 mmHg (warn > 180)
- BP Diastolic: 30-150 mmHg (warn > 120)
- Heart Rate: 30-200 bpm
- Temperature: 90-110°F
- O2 Saturation: 0-100% (warn < 90)
- Respiratory Rate: 5-60 breaths/min
- Blood Glucose: 20-600 mg/dL
- Pain: 0-10 scale

## Permissions

### Required Permissions

- `care-plans:create` - Create care plans
- `care-plans:read` - View care plans
- `care-plans:update` - Modify care plans
- `care-plans:activate` - Activate plans
- `care-plans:delete` - Delete plans
- `tasks:create` - Create tasks
- `tasks:read` - View tasks
- `tasks:complete` - Complete tasks
- `tasks:skip` - Skip tasks
- `progress-notes:create` - Create notes
- `progress-notes:read` - View notes
- `analytics:read` - View analytics

## Common Patterns

### Frequency Specification

```typescript
{
  pattern: 'DAILY',
  timesPerDay: 2,
  specificTimes: ['09:00', '17:00']
}

{
  pattern: 'WEEKLY',
  timesPerWeek: 3,
  specificDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY']
}

{
  pattern: 'AS_NEEDED'
}
```

### Signature Capture

```typescript
{
  signatureData: 'base64-encoded-image',
  signedBy: userId,
  signedByName: 'Jane Smith, CNA',
  signatureType: 'TOUCHSCREEN',
  ipAddress: '192.168.1.1',
  deviceInfo: 'iPad'
}
```

### GPS Verification

```typescript
{
  verificationType: 'GPS',
  gpsLocation: {
    latitude: 47.6062,
    longitude: -122.3321,
    accuracy: 10
  }
}
```

### Vital Signs

```typescript
{
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  heartRate: 75,
  temperature: 98.6,
  temperatureUnit: 'F',
  oxygenSaturation: 98,
  pain: 2
}
```

## Error Handling

```typescript
try {
  const plan = await service.createCarePlan(input, context);
} catch (error) {
  if (error instanceof ValidationError) {
    // Input validation failed
    console.error('Validation:', error.context);
  } else if (error instanceof PermissionError) {
    // Insufficient permissions
    console.error('Permission denied');
  } else if (error instanceof NotFoundError) {
    // Entity not found
    console.error('Not found:', error.context);
  } else if (error instanceof ConflictError) {
    // Version conflict or business rule violation
    console.error('Conflict:', error.message);
  }
}
```

## Database Tables

- `care_plans` - Care plan records
- `task_instances` - Individual task records
- `progress_notes` - Progress documentation

See IMPLEMENTATION.md for complete schema.

---

**Quick Start**: See QUICKSTART.md  
**Full Docs**: See README.md  
**Technical**: See IMPLEMENTATION.md

**Care Commons** - Shared care software, community owned
