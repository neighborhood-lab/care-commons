# Care Plans & Tasks Library - Quickstart

Get up and running with the Care Plans & Tasks Library vertical in minutes.

## Installation

```bash
cd care-commons
npm install
npm run build
```

## Database Setup

### 1. Run Migrations

```bash
# Run core migrations first
npm run db:migrate --workspace=@care-commons/core

# Run care plans migrations
npm run db:migrate --workspace=@care-commons/care-plans-tasks
```

### 2. Verify Tables

```bash
psql -d care_commons -c "\dt"
```

You should see:
- `care_plans`
- `task_instances`
- `progress_notes`

## Basic Usage

### 1. Initialize Services

```typescript
import { Database, PermissionService } from '@care-commons/core';
import { CarePlanService, CarePlanRepository } from '@care-commons/care-plans-tasks';

const db = new Database({
  host: 'localhost',
  port: 5432,
  database: 'care_commons',
  user: 'postgres',
  password: 'your_password',
});

const repository = new CarePlanRepository(db);
const permissions = new PermissionService();
const service = new CarePlanService(repository, permissions);
```

### 2. Create a Simple Care Plan

```typescript
const userContext = {
  userId: 'user-123',
  roles: ['COORDINATOR'],
  permissions: ['care-plans:create', 'care-plans:read'],
  organizationId: 'org-456',
  branchIds: ['branch-789'],
};

const carePlan = await service.createCarePlan({
  clientId: 'client-abc',
  organizationId: 'org-456',
  name: 'Basic Personal Care Plan',
  planType: 'PERSONAL_CARE',
  effectiveDate: new Date(),
  
  goals: [{
    name: 'Maintain Personal Hygiene',
    description: 'Client will maintain good personal hygiene with assistance',
    category: 'ADL',
    status: 'NOT_STARTED',
    priority: 'MEDIUM',
  }],
  
  interventions: [{
    name: 'Bathing Assistance',
    description: 'Assist client with bathing',
    category: 'ASSISTANCE_WITH_ADL',
    goalIds: [],
    frequency: {
      pattern: 'DAILY',
      timesPerDay: 1,
    },
    instructions: 'Help client with shower or bath, ensuring safety',
    performedBy: ['CAREGIVER'],
    requiresDocumentation: true,
    status: 'ACTIVE',
    startDate: new Date(),
  }],
  
  taskTemplates: [{
    name: 'Morning Shower',
    description: 'Assist with morning shower',
    category: 'BATHING',
    frequency: {
      pattern: 'DAILY',
      specificTimes: ['09:00'],
    },
    instructions: 'Assist client with shower. Check water temperature. Ensure non-slip mat in place.',
    requiresSignature: true,
    requiresNote: false,
    isOptional: false,
    allowSkip: true,
    skipReasons: ['Client refused', 'Medical reason'],
    status: 'ACTIVE',
  }],
}, userContext);

console.log('Care plan created:', carePlan.id);
```

### 3. Activate the Care Plan

```typescript
const activated = await service.activateCarePlan(carePlan.id, userContext);
console.log('Care plan activated');
```

### 4. Create Tasks for a Visit

```typescript
const tasks = await service.createTasksForVisit(
  carePlan.id,
  'visit-123',
  new Date(),
  userContext
);

console.log(`Created ${tasks.length} tasks`);
```

### 5. Complete a Task

```typescript
const taskContext = {
  ...userContext,
  roles: ['CAREGIVER'],
  permissions: ['tasks:read', 'tasks:complete'],
};

const completed = await service.completeTask(
  tasks[0].id,
  {
    completionNote: 'Client showered safely. Water temperature comfortable. No issues.',
    signature: {
      signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
      signedBy: userContext.userId,
      signedByName: 'Jane Smith',
      signatureType: 'TOUCHSCREEN',
    },
  },
  taskContext
);

console.log('Task completed');
```

### 6. Create a Progress Note

```typescript
const note = await service.createProgressNote({
  carePlanId: carePlan.id,
  clientId: 'client-abc',
  noteType: 'VISIT_NOTE',
  content: 'Client in good spirits today. Cooperated well with care. No concerns noted.',
  
  observations: [{
    category: 'PHYSICAL',
    observation: 'Skin dry, lotion applied after bathing',
    severity: 'NORMAL',
  }],
}, taskContext);

console.log('Progress note created');
```

## Common Workflows

### Daily Caregiver Workflow

```typescript
// 1. Get today's visits
const visits = await getVisitsForToday(caregiverId);

// 2. For each visit, get tasks
for (const visit of visits) {
  const tasks = await service.getTasksByVisitId(visit.id, context);
  
  // 3. Complete each task
  for (const task of tasks) {
    await service.completeTask(task.id, {
      completionNote: 'Task completed as planned',
      signature: { /* signature data */ },
    }, context);
  }
  
  // 4. Create visit note
  await service.createProgressNote({
    carePlanId: visit.carePlanId,
    clientId: visit.clientId,
    visitId: visit.id,
    noteType: 'VISIT_NOTE',
    content: 'Visit summary...',
  }, context);
}
```

### Coordinator Review Workflow

```typescript
// 1. Get care plans expiring soon
const expiring = await service.getExpiringCarePlans(30, context);

console.log(`${expiring.length} care plans need review`);

// 2. Review each plan
for (const plan of expiring) {
  // Get progress notes
  const notes = await service.getProgressNotesByCarePlanId(plan.id, context);
  
  // Get task metrics
  const metrics = await service.getTaskCompletionMetrics({
    dateFrom: new Date(Date.now() - 30*24*60*60*1000),
    dateTo: new Date(),
    organizationId: context.organizationId,
  }, context);
  
  // Update plan based on review
  await service.updateCarePlan(plan.id, {
    reviewDate: new Date(Date.now() + 90*24*60*60*1000),
    expirationDate: new Date(Date.now() + 365*24*60*60*1000),
  }, context);
}
```

### Analytics Dashboard

```typescript
const analytics = await service.getCarePlanAnalytics(
  context.organizationId,
  context
);

console.log(`
  Total Care Plans: ${analytics.totalPlans}
  Active: ${analytics.activePlans}
  Expiring Soon: ${analytics.expiringPlans}
  Goal Completion Rate: ${analytics.goalCompletionRate}%
  Task Completion Rate: ${analytics.taskCompletionRate}%
`);

const taskMetrics = await service.getTaskCompletionMetrics({
  dateFrom: new Date('2024-01-01'),
  dateTo: new Date('2024-01-31'),
  organizationId: context.organizationId,
}, context);

console.log(`
  Tasks Completed: ${taskMetrics.completedTasks}/${taskMetrics.totalTasks}
  Completion Rate: ${taskMetrics.completionRate}%
  Average Time: ${taskMetrics.averageCompletionTime} minutes
  Issues Reported: ${taskMetrics.issuesReported}
`);
```

## Testing

### Run Unit Tests

```bash
npm test --workspace=@care-commons/care-plans-tasks
```

### Run Integration Tests

```bash
npm run test:integration --workspace=@care-commons/care-plans-tasks
```

## Troubleshooting

### Issue: "Care plan not found"

Check that:
- Care plan exists in database
- User has correct organization access
- Care plan not soft-deleted

### Issue: "Insufficient permissions"

Verify user context has required permissions:
- `care-plans:read`
- `care-plans:create`
- `tasks:complete`
- etc.

### Issue: "Task completion requirements not met"

Check that:
- Signature provided if `requiredSignature = true`
- Note provided if `requiredNote = true`
- Custom fields populated if required

### Issue: "Cannot activate care plan"

Validate that:
- Plan has at least one goal
- Plan has at least one intervention
- Coordinator is assigned
- Effective date not in future

## Next Steps

- Read the [full documentation](./README.md)
- Review [implementation details](./IMPLEMENTATION.md)
- Check out [example templates](./examples/)
- Explore integration with other verticals
- Join the community discussions

## Support

Need help? 

- Open an issue on GitHub
- Check the documentation
- Join our Discord community

---

**Care Commons** - Shared care software, community owned
