> **Status**: ✅ Backend Complete | 🚧 Frontend In Progress | 📝 Testing Needed

---

# Care Plans & Tasks Library

> Structured plan of care with task management and progress tracking

The **Care Plans & Tasks Library** vertical provides comprehensive functionality for creating, managing, and tracking care plans with associated tasks, interventions, and progress documentation. It enables care coordinators to define structured care strategies and field staff to execute and document care delivery in real-time.

## Features

### Core Functionality

- **Care Plan Management** - Create comprehensive, client-specific care plans
- **Goal Setting** - Define measurable, time-bound care objectives
- **Intervention Planning** - Specify evidence-based interventions to achieve goals
- **Task Templates** - Create reusable task definitions for consistent care delivery
- **Task Instances** - Generate visit-specific tasks from templates
- **Progress Tracking** - Monitor goal achievement and care plan effectiveness
- **Progress Notes** - Capture detailed observations and care narratives
- **Compliance Management** - Track regulatory requirements and authorization
- **Signature Capture** - Electronic signatures for verification and consent

### Care Plan Features

- **Multiple Plan Types** - Personal care, companion, skilled nursing, therapy, hospice, respite
- **Authorization Tracking** - Hours, dates, payer source, authorization numbers
- **Service Frequency** - Define visit patterns and scheduling requirements
- **Care Team Assignment** - Coordinator, primary caregiver, supervisor, physician
- **Medical Context** - Diagnosis, functional limitations, allergies, contraindications
- **Documentation Requirements** - Specify required forms, assessments, reviews
- **Modification History** - Complete audit trail of plan changes
- **Expiration Tracking** - Alerts for plans requiring review or renewal

### Goal Management

- **Structured Goals** - Name, description, category, priority, target date
- **Measurable Outcomes** - Quantitative, qualitative, or binary measurement
- **Milestone Tracking** - Break goals into achievable milestones
- **Progress Percentage** - Visual indicator of goal completion
- **Multiple Categories** - Mobility, ADL, IADL, nutrition, safety, cognitive, emotional
- **Status Tracking** - Not started, in progress, on track, at risk, achieved
- **Barrier Documentation** - Capture obstacles to goal achievement

### Intervention Management

- **Detailed Instructions** - Step-by-step guidance for care delivery
- **Frequency Specification** - Daily, weekly, as-needed, custom patterns
- **Performer Assignment** - Role-based task assignment
- **Equipment & Supplies** - Required resources for intervention
- **Safety Precautions** - Warnings and contraindications
- **Documentation Requirements** - Link to required forms and notes
- **Goal Alignment** - Connect interventions to specific goals

### Task Management

- **Task Templates** - Reusable definitions for common care activities
- **Task Instances** - Visit-specific tasks generated from templates
- **25+ Task Categories** - Bathing, dressing, medication, mobility, monitoring, etc.
- **Scheduling** - Date, time, time-of-day, estimated duration
- **Step-by-Step Instructions** - Break complex tasks into manageable steps
- **Quality Checks** - Embedded questions to ensure quality care
- **Custom Fields** - Capture specific data points for each task
- **Skip Reasons** - Document why tasks weren't completed
- **Issue Reporting** - Flag problems for coordinator follow-up

### Task Completion

- **Status Tracking** - Scheduled, in progress, completed, skipped, missed
- **Completion Notes** - Narrative documentation of care provided
- **Electronic Signatures** - Touchscreen, stylus, or digital signature
- **Photo Verification** - Visual evidence of task completion
- **GPS Verification** - Location-based verification
- **Vital Signs Capture** - Blood pressure, heart rate, temperature, O2 sat, pain scale
- **Quality Check Responses** - Structured quality assurance data
- **Custom Field Values** - Task-specific data collection

### Progress Documentation

- **Multiple Note Types** - Visit notes, weekly summaries, monthly reviews, incidents
- **Goal Progress Tracking** - Status updates for each goal
- **Structured Observations** - Physical, cognitive, emotional, behavioral, social, safety
- **Concerns & Recommendations** - Document issues and suggest interventions
- **Review & Approval** - Supervisor review workflow
- **Signature Support** - Sign notes for compliance
- **Attachment Support** - Link photos, documents, forms

### Compliance & Authorization

- **Authorization Management** - Track approved hours and service dates
- **Payer Source Tracking** - Medicare, Medicaid, private insurance, private pay
- **Regulatory Requirements** - Document compliance with state/federal regulations
- **Compliance Status** - Compliant, pending review, expired, non-compliant
- **Required Documentation** - Track mandatory forms and assessments
- **Signature Requirements** - Client, family, caregiver, physician signatures
- **Audit Trail** - Complete history of all changes

## Data Model

### Care Plan

The core entity representing a comprehensive care strategy:

```typescript
interface CarePlan {
  // Identity
  id: UUID;
  planNumber: string;
  name: string;
  
  // Associations
  clientId: UUID;
  organizationId: UUID;
  branchId?: UUID;
  
  // Plan details
  planType: CarePlanType;
  status: CarePlanStatus;
  priority: Priority;
  effectiveDate: Date;
  expirationDate?: Date;
  
  // Care content
  goals: CarePlanGoal[];
  interventions: Intervention[];
  taskTemplates: TaskTemplate[];
  
  // Team
  coordinatorId?: UUID;
  primaryCaregiverId?: UUID;
  
  // Authorization
  authorizationNumber?: string;
  payerSource?: PayerSource;
  authorizationHours?: number;
  authorizationStartDate?: Date;
  authorizationEndDate?: Date;
  
  // Compliance
  complianceStatus: ComplianceStatus;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

### Goal

Measurable objectives within a care plan:

```typescript
interface CarePlanGoal {
  id: UUID;
  name: string;
  description: string;
  category: GoalCategory;
  status: GoalStatus;
  priority: Priority;
  targetDate?: Date;
  
  // Measurement
  measurementType?: 'QUANTITATIVE' | 'QUALITATIVE' | 'BINARY';
  targetValue?: number;
  currentValue?: number;
  progressPercentage?: number;
  
  // Tracking
  milestones?: Milestone[];
  achievedDate?: Date;
  outcome?: string;
}
```

### Task Template

Reusable task definition:

```typescript
interface TaskTemplate {
  id: UUID;
  name: string;
  description: string;
  category: TaskCategory;
  
  // Scheduling
  frequency: Frequency;
  estimatedDuration?: number;
  timeOfDay?: TimeOfDay[];
  
  // Instructions
  instructions: string;
  steps?: TaskStep[];
  
  // Requirements
  requiresSignature: boolean;
  requiresNote: boolean;
  requiresPhoto?: boolean;
  requiresVitals?: boolean;
  
  // Quality
  qualityChecks?: QualityCheck[];
  
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}
```

### Task Instance

Actual task to be performed:

```typescript
interface TaskInstance {
  id: UUID;
  carePlanId: UUID;
  templateId?: UUID;
  visitId?: UUID;
  clientId: UUID;
  assignedCaregiverId?: UUID;
  
  name: string;
  description: string;
  category: TaskCategory;
  instructions: string;
  
  scheduledDate: Date;
  scheduledTime?: string;
  
  status: TaskStatus;
  
  // Completion
  completedAt?: Date;
  completedBy?: UUID;
  completionNote?: string;
  completionSignature?: Signature;
  verificationData?: VerificationData;
}
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ running locally
- All migrations applied: `npm run db:migrate` (✅ Complete)

### Backend Setup (✅ Complete)
The backend API is fully implemented and ready to use:

```bash
# 1. Install dependencies
npm install

# 2. Verify migrations (should show 12 migrations applied)
npm run db:migrate:status

# 3. Load demo data
npm run db:seed:care-plans

# 4. Start the API server
npm run dev:server
# Server runs at http://localhost:3000
```

### Testing the API
See `DEMO.md` for comprehensive curl examples. Quick test:

```bash
# Get care plan analytics
curl -H "X-User-Id: user-123" \
     -H "X-Organization-Id: org-123" \
     http://localhost:3000/api/analytics/care-plans
```

### Frontend Setup (🚧 In Progress)
The frontend implementation is planned. Follow the pattern from `client-demographics` vertical:
1. Create types in `packages/web/src/verticals/care-plans/types/`
2. Create API service in `packages/web/src/verticals/care-plans/services/`
3. Create React Query hooks in `packages/web/src/verticals/care-plans/hooks/`
4. Create components and pages

See Task 3 in the project improvement tasks for detailed instructions.

## Usage

### Creating a Care Plan

```typescript
import { CarePlanService } from '@care-commons/care-plans-tasks';
import { Database } from '@care-commons/core';

const db = new Database(config);
const service = new CarePlanService(db);

const carePlan = await service.createCarePlan({
  clientId: 'client-123',
  organizationId: 'org-456',
  name: 'Comprehensive Personal Care Plan',
  planType: 'PERSONAL_CARE',
  effectiveDate: new Date('2024-01-01'),
  expirationDate: new Date('2024-12-31'),
  coordinatorId: 'coord-789',
  
  goals: [{
    name: 'Improve Mobility',
    description: 'Increase ability to walk independently for 15 minutes',
    category: 'MOBILITY',
    status: 'NOT_STARTED',
    priority: 'HIGH',
    targetDate: new Date('2024-06-01'),
    measurementType: 'QUANTITATIVE',
    targetValue: 15,
    unit: 'minutes',
  }],
  
  interventions: [{
    name: 'Ambulation Assistance',
    description: 'Assist client with walking exercises',
    category: 'AMBULATION_ASSISTANCE',
    goalIds: ['goal-1'],
    frequency: {
      pattern: 'DAILY',
      timesPerDay: 2,
    },
    duration: 20,
    instructions: 'Help client walk around home for 10-15 minutes...',
    performedBy: ['CAREGIVER', 'CNA'],
    requiresDocumentation: true,
    status: 'ACTIVE',
    startDate: new Date(),
  }],
  
  taskTemplates: [{
    name: 'Morning Ambulation',
    description: 'Assist with morning walk',
    category: 'AMBULATION',
    frequency: {
      pattern: 'DAILY',
      specificTimes: ['09:00'],
    },
    instructions: 'Walk with client for 15 minutes...',
    requiresSignature: true,
    requiresNote: true,
    isOptional: false,
    allowSkip: true,
    skipReasons: ['Client refused', 'Client too fatigued', 'Safety concern'],
    status: 'ACTIVE',
  }],
}, userContext);
```

### Activating a Care Plan

```typescript
const activated = await service.activateCarePlan(
  carePlan.id,
  userContext
);
```

### Creating Tasks for a Visit

```typescript
const tasks = await service.createTasksForVisit(
  carePlanId,
  visitId,
  visitDate,
  userContext
);

console.log(`Created ${tasks.length} tasks for visit`);
```

### Completing a Task

```typescript
const completed = await service.completeTask(
  taskId,
  {
    completionNote: 'Client walked for 15 minutes with minimal assistance. Good endurance today.',
    signature: {
      signatureData: 'base64-encoded-signature...',
      signedBy: caregiverId,
      signedByName: 'Jane Smith, CNA',
      signatureType: 'TOUCHSCREEN',
    },
    verificationData: {
      verificationType: 'GPS',
      gpsLocation: {
        latitude: 47.6062,
        longitude: -122.3321,
        accuracy: 10,
      },
      vitalSigns: {
        heartRate: 78,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        oxygenSaturation: 98,
      },
    },
    qualityCheckResponses: [{
      checkId: 'check-1',
      question: 'Client able to ambulate safely?',
      response: true,
    }],
  },
  userContext
);
```

### Skipping a Task

```typescript
const skipped = await service.skipTask(
  taskId,
  'Client refused',
  'Client stated feeling too tired after physical therapy session',
  userContext
);
```

### Creating a Progress Note

```typescript
const note = await service.createProgressNote({
  carePlanId,
  clientId,
  visitId,
  noteType: 'VISIT_NOTE',
  content: 'Client continues to make progress with mobility goals...',
  
  goalProgress: [{
    goalId: 'goal-1',
    goalName: 'Improve Mobility',
    status: 'ON_TRACK',
    progressDescription: 'Client now walking 12 minutes independently',
    progressPercentage: 80,
    barriers: ['Some days client too fatigued'],
    nextSteps: ['Continue daily ambulation', 'Monitor vital signs'],
  }],
  
  observations: [{
    category: 'PHYSICAL',
    observation: 'Client ambulated for 15 minutes today with steady gait',
    severity: 'NORMAL',
  }],
  
  concerns: ['Occasional dizziness upon standing'],
  recommendations: ['Consider blood pressure monitoring before ambulation'],
  
  signature: {
    signatureData: 'base64...',
    signedBy: caregiverId,
    signedByName: 'Jane Smith, CNA',
    signatureType: 'TOUCHSCREEN',
  },
}, userContext);
```

### Searching Care Plans

```typescript
const results = await service.searchCarePlans({
  organizationId: 'org-456',
  status: ['ACTIVE'],
  expiringWithinDays: 30,
}, {
  page: 1,
  limit: 20,
  sortBy: 'expiration_date',
  sortOrder: 'asc',
}, userContext);

console.log(`Found ${results.total} care plans expiring soon`);
```

### Getting Analytics

```typescript
const analytics = await service.getCarePlanAnalytics(
  'org-456',
  userContext
);

console.log(`Active plans: ${analytics.activePlans}`);
console.log(`Goal completion rate: ${analytics.goalCompletionRate}%`);
console.log(`Task completion rate: ${analytics.taskCompletionRate}%`);

const taskMetrics = await service.getTaskCompletionMetrics({
  dateFrom: new Date('2024-01-01'),
  dateTo: new Date('2024-01-31'),
  organizationId: 'org-456',
}, userContext);

console.log(`Completed: ${taskMetrics.completedTasks}/${taskMetrics.totalTasks}`);
console.log(`Completion rate: ${taskMetrics.completionRate}%`);
```

## Database Schema

The vertical uses three main tables:

### care_plans

Stores comprehensive care plan information with JSONB columns for flexible nested data:

- **goals** - Array of goal objects
- **interventions** - Array of intervention objects
- **task_templates** - Array of task template objects
- **service_frequency** - Service frequency specification
- **allergies** - Array of allergy objects
- **modification_history** - Array of modification records

### task_instances

Stores individual task instances created from templates or manually:

- **verification_data** - JSONB for flexible verification methods
- **completion_signature** - JSONB signature object
- **quality_check_responses** - Array of quality check responses
- **custom_field_values** - JSONB for task-specific data

### progress_notes

Stores narrative documentation and structured progress tracking:

- **goal_progress** - Array of goal progress objects
- **observations** - Array of structured observations
- **concerns** - Array of concern strings
- **recommendations** - Array of recommendation strings
- **signature** - JSONB signature object

### Key Indexes

- Full-text search on plan name and number
- GIN indexes on JSONB columns for efficient queries
- Indexes on client_id, organization_id, status, dates
- Composite indexes for common query patterns

## Permissions

The vertical implements fine-grained permissions:

- **care-plans:create** - Create new care plans
- **care-plans:read** - View care plan details
- **care-plans:update** - Modify care plans
- **care-plans:activate** - Activate pending care plans
- **care-plans:delete** - Soft-delete care plans
- **tasks:create** - Create task instances
- **tasks:read** - View tasks
- **tasks:complete** - Mark tasks as completed
- **tasks:skip** - Skip tasks with reason
- **progress-notes:create** - Create progress notes
- **progress-notes:read** - View progress notes
- **analytics:read** - View analytics and metrics

## Integration Points

This vertical integrates with:

- **Client & Demographics** - Link care plans to clients
- **Caregiver & Staff Management** - Assign caregivers to tasks
- **Scheduling & Visit Management** - Generate tasks for visits
- **Time Tracking & EVV** - Verify task completion with visit data
- **Billing & Invoicing** - Bill for authorized services
- **Compliance & Documentation** - Track regulatory requirements
- **Mobile App** - Field staff task completion interface

## Compliance Features

- **Complete audit trail** - All changes tracked with user, timestamp, reason
- **Electronic signatures** - Legally compliant signature capture
- **Authorization tracking** - Hours, dates, payer source
- **Required documentation** - Ensure all mandatory forms completed
- **Expiration alerts** - Notify when plans need review
- **Goal progress tracking** - Demonstrate care effectiveness
- **Quality checks** - Embedded quality assurance
- **Incident reporting** - Flag issues for follow-up

## Best Practices

1. **Define clear, measurable goals** - Use SMART goal format
2. **Link interventions to goals** - Establish clear cause-effect relationships
3. **Create comprehensive templates** - Reduce manual task creation
4. **Document thoroughly** - Detailed notes support quality care
5. **Review plans regularly** - Schedule monthly or quarterly reviews
6. **Track authorization hours** - Prevent service overages
7. **Use quality checks** - Embed quality assurance in daily work
8. **Capture signatures** - Obtain required approvals and consents
9. **Monitor expiration dates** - Renew plans before expiration
10. **Analyze outcomes** - Use analytics to improve care delivery

## Future Enhancements

- [ ] AI-powered goal suggestions based on assessment
- [ ] Template library with evidence-based interventions
- [ ] Outcome prediction based on historical data
- [ ] Integration with clinical guidelines databases
- [ ] Voice-to-text for progress notes
- [ ] Photo annotation for wound care tracking
- [ ] Family portal for goal progress visibility
- [ ] Automated care plan generation from assessments
- [ ] Medication reconciliation within care plans
- [ ] Integration with telehealth platforms

## Support

For questions or issues with the Care Plans & Tasks Library vertical:

- Open an issue on GitHub
- Check the [documentation](https://docs.care-commons.org)
- Join our community discussions

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
