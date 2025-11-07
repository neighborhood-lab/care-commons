# Task 0002: Implement Care Plans Frontend UI

**Priority**: 🟠 HIGH
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 8-12 hours

## Context

The care plans and tasks vertical has a complete backend with CRUD operations, task tracking, and status management. The frontend needs to be built to allow coordinators to create/manage care plans and caregivers to view/complete tasks.

## Existing Backend

- ✅ Database schema: `care_plans`, `care_plan_tasks`, `task_completions`
- ✅ API routes: Care plan CRUD, task management, completion tracking
- ✅ Services: Care plan service, task service, completion service
- ✅ Types: Defined in `verticals/care-plans-tasks/src/types/`

## Task

### 1. Create Core Components

**Care Plan Components** (`packages/web/src/app/pages/care-plans/components/`):

```
CarePlanList.tsx          - List of care plans for a client
CarePlanCard.tsx          - Summary card with status, dates, task progress
CarePlanForm.tsx          - Create/edit care plan (name, dates, goals, notes)
CarePlanDetail.tsx        - Full care plan view with all tasks
TaskList.tsx              - List of tasks in a care plan
TaskCard.tsx              - Individual task with status, schedule, completion
TaskForm.tsx              - Create/edit task (description, frequency, category)
TaskCompletionModal.tsx   - Modal for marking task complete with notes
TaskProgress.tsx          - Visual progress indicator (X of Y tasks complete)
```

### 2. Create Pages

**Coordinator View** (`packages/web/src/app/pages/care-plans/`):

```typescript
// CarePlansPage.tsx - Main care plans management page
// - Filter by client, status, date range
// - Create new care plan button
// - List all care plans with search

// CarePlanDetailPage.tsx - Single care plan view
// - Care plan details (editable)
// - List of tasks with filters (completed/pending, by category)
// - Add task button
// - Print/export care plan

// CreateCarePlanPage.tsx - Wizard for new care plan
// Step 1: Select client
// Step 2: Care plan details (name, dates, goals)
// Step 3: Add tasks
// Step 4: Review and save
```

**Caregiver View** (`packages/web/src/app/pages/care-plans/caregiver/`):

```typescript
// CaregiverTasksPage.tsx - Tasks for current visit
// - Show only tasks for today's visit
// - Mark tasks complete with notes
// - Quick view of client's care plan

// TaskDetailPage.tsx - Single task view
// - Task description and instructions
// - Completion history
// - Mark complete button
```

### 3. Create Service Hooks

**React Query Hooks** (`packages/web/src/hooks/api/`):

```typescript
// useCarePlans.ts
export const useCarePlans = (clientId?: string, filters?: CarePlanFilters) => {
  return useQuery({
    queryKey: ['care-plans', clientId, filters],
    queryFn: () => api.get('/api/care-plans', { params: { clientId, ...filters } })
  });
};

export const useCarePlan = (carePlanId: string) => {
  return useQuery({
    queryKey: ['care-plan', carePlanId],
    queryFn: () => api.get(`/api/care-plans/${carePlanId}`)
  });
};

export const useCreateCarePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCarePlanInput) => api.post('/api/care-plans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
    }
  });
};

export const useUpdateCarePlan = (carePlanId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCarePlanInput) =>
      api.patch(`/api/care-plans/${carePlanId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-plan', carePlanId] });
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
    }
  });
};

// useCarePlanTasks.ts
export const useCarePlanTasks = (carePlanId: string) => {
  return useQuery({
    queryKey: ['care-plan-tasks', carePlanId],
    queryFn: () => api.get(`/api/care-plans/${carePlanId}/tasks`)
  });
};

export const useCompleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: TaskCompletionInput }) =>
      api.post(`/api/care-plan-tasks/${taskId}/complete`, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['care-plan-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    }
  });
};
```

### 4. Create Forms with Validation

**Care Plan Form Schema** (Zod):

```typescript
import { z } from 'zod';

export const carePlanSchema = z.object({
  client_id: z.string().uuid('Valid client required'),
  name: z.string().min(3, 'Plan name must be at least 3 characters'),
  start_date: z.string().datetime('Valid start date required'),
  end_date: z.string().datetime('Valid end date required').optional(),
  goals: z.string().min(10, 'Care goals must be at least 10 characters'),
  notes: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled'])
});

export const taskSchema = z.object({
  care_plan_id: z.string().uuid(),
  description: z.string().min(5, 'Task description required'),
  category: z.enum([
    'medication',
    'vital_signs',
    'personal_care',
    'meal_prep',
    'mobility',
    'safety_check',
    'documentation',
    'other'
  ]),
  frequency: z.enum(['once', 'daily', 'weekly', 'as_needed']),
  scheduled_time: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  estimated_duration_minutes: z.number().min(1).max(480).optional(),
  instructions: z.string().optional()
});

export const taskCompletionSchema = z.object({
  completed_by_id: z.string().uuid(),
  completion_notes: z.string().min(10, 'Please add completion notes'),
  completed_at: z.string().datetime(),
  attachments: z.array(z.string()).optional()
});
```

### 5. Add UI Components

**Task Status Badge**:
```typescript
export const TaskStatusBadge = ({ status }: { status: TaskStatus }) => {
  const variants = {
    pending: 'bg-gray-100 text-gray-800',
    completed: 'bg-green-100 text-green-800',
    skipped: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[status]}`}>
      {status}
    </span>
  );
};
```

**Task Frequency Display**:
```typescript
export const TaskFrequency = ({ frequency }: { frequency: string }) => {
  const icons = {
    once: '1️⃣',
    daily: '📅',
    weekly: '📆',
    as_needed: '🔔'
  };

  const labels = {
    once: 'One-time',
    daily: 'Daily',
    weekly: 'Weekly',
    as_needed: 'As Needed'
  };

  return (
    <span className="text-sm text-gray-600">
      {icons[frequency]} {labels[frequency]}
    </span>
  );
};
```

**Task Category Icon**:
```typescript
export const TaskCategoryIcon = ({ category }: { category: string }) => {
  const icons = {
    medication: '💊',
    vital_signs: '🩺',
    personal_care: '🚿',
    meal_prep: '🍽️',
    mobility: '🚶',
    safety_check: '✅',
    documentation: '📝',
    other: '📌'
  };

  return <span className="text-xl">{icons[category]}</span>;
};
```

### 6. Add Routes

```typescript
// In packages/web/src/app/routes.tsx

{
  path: '/care-plans',
  element: <ProtectedRoute requiredRoles={['coordinator', 'admin']} />,
  children: [
    { index: true, element: <CarePlansPage /> },
    { path: 'new', element: <CreateCarePlanPage /> },
    { path: ':carePlanId', element: <CarePlanDetailPage /> },
    { path: ':carePlanId/edit', element: <EditCarePlanPage /> }
  ]
},
{
  path: '/caregiver/tasks',
  element: <ProtectedRoute requiredRoles={['caregiver']} />,
  children: [
    { index: true, element: <CaregiverTasksPage /> },
    { path: ':taskId', element: <TaskDetailPage /> }
  ]
}
```

### 7. Add Bulk Operations

Allow coordinators to perform bulk operations:

- **Bulk add tasks**: Add multiple tasks from templates
- **Bulk complete tasks**: Mark multiple tasks complete
- **Clone care plan**: Copy existing care plan to new client
- **Export care plan**: PDF export for printing/sharing

### 8. Add Task Templates

Create common task templates to speed up care plan creation:

```typescript
export const TASK_TEMPLATES = {
  daily_vitals: {
    category: 'vital_signs',
    description: 'Check and record vital signs (BP, pulse, temp)',
    frequency: 'daily',
    scheduled_time: '09:00',
    estimated_duration_minutes: 15,
    priority: 'high'
  },
  medication_reminder: {
    category: 'medication',
    description: 'Administer medications per schedule',
    frequency: 'daily',
    priority: 'critical'
  },
  // ... more templates
};
```

### 9. Add Real-Time Updates

Use React Query polling for task completion updates:

```typescript
export const useCarePlanTasks = (carePlanId: string) => {
  return useQuery({
    queryKey: ['care-plan-tasks', carePlanId],
    queryFn: () => api.get(`/api/care-plans/${carePlanId}/tasks`),
    refetchInterval: 30000 // Poll every 30 seconds
  });
};
```

### 10. Add Accessibility

- Keyboard navigation for task lists
- Screen reader labels for status badges
- ARIA labels for completion buttons
- Focus management in modals

## User Stories

1. **As a coordinator**, I can create a care plan for a client with specific goals
2. **As a coordinator**, I can add tasks to a care plan with categories and frequencies
3. **As a coordinator**, I can view all care plans and filter by status
4. **As a coordinator**, I can see task completion progress for each care plan
5. **As a caregiver**, I can view tasks for my current visit
6. **As a caregiver**, I can mark tasks complete with notes
7. **As a caregiver**, I can see task history and previous completion notes
8. **As an admin**, I can export care plans to PDF

## Design Considerations

- **Task Categorization**: Use color coding for different task categories
- **Priority Indicators**: Visual cues for high-priority/critical tasks
- **Progress Tracking**: Show completion percentage prominently
- **Mobile-Friendly**: Caregivers use mobile, ensure large touch targets
- **Print-Friendly**: Care plans should print cleanly (CSS @media print)

## Acceptance Criteria

- [ ] All core components created
- [ ] Coordinator pages implemented (list, detail, create, edit)
- [ ] Caregiver pages implemented (task list, task detail)
- [ ] Service hooks working with React Query
- [ ] Form validation with Zod schemas
- [ ] Task templates implemented
- [ ] Bulk operations functional
- [ ] Real-time updates working
- [ ] Mobile responsive
- [ ] Print-friendly styles
- [ ] Accessibility features
- [ ] Tests for critical components
- [ ] Works end-to-end in local dev environment

## Backend API Reference

- Care Plans API: `verticals/care-plans-tasks/src/routes/care-plans.routes.ts`
- Tasks API: `verticals/care-plans-tasks/src/routes/tasks.routes.ts`
- Types: `verticals/care-plans-tasks/src/types/`

## Reference

- Task management patterns from Asana, Trello
- Care plan templates from home health industry standards
- Follow WCAG AA accessibility standards

---

**Previous Task**: 0001 - Fix Scheduling Service Placeholder Addresses
**Next Task**: 0003 - Implement Family Engagement Portal UI
