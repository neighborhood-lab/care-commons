# Task 0002: Implement Care Plans & Tasks Frontend UI

**Priority**: 🟠 HIGH
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 8-12 hours

## Context

The care plans and tasks vertical has a complete backend implementation with API routes, database schema, and services. The frontend UI needs to be built to make this functionality accessible to coordinators and caregivers.

## Existing Backend

- ✅ Database schema: `care_plans`, `care_plan_goals`, `care_plan_interventions`, `task_templates`, `task_instances`
- ✅ API routes: CRUD for care plans, goals, interventions, tasks
- ✅ Services: Care plan service, task service
- ✅ Types: Defined in `verticals/care-plans-tasks/src/types/`

## Task

### 1. Create Core Components

**Care Plan Components** (`packages/web/src/app/pages/care-plans/components/`):
- `CarePlanList.tsx` - List all care plans for a client
- `CarePlanForm.tsx` - Create/edit care plan with goals and interventions
- `CarePlanDetail.tsx` - View single care plan with full details
- `GoalCard.tsx` - Display individual goal with progress
- `InterventionList.tsx` - List interventions for a goal

**Task Components** (`packages/web/src/app/pages/tasks/components/`):
- `TaskList.tsx` - List tasks (filtered by status, client, caregiver)
- `TaskCard.tsx` - Display task with completion status
- `TaskDetailModal.tsx` - View/complete task with signature capture
- `TaskTemplateForm.tsx` - Create/edit task templates

### 2. Create Pages

- `packages/web/src/app/pages/care-plans/CarePlansPage.tsx` - Main care plans page
- `packages/web/src/app/pages/care-plans/[id]/CarePlanDetailPage.tsx` - Single care plan
- `packages/web/src/app/pages/tasks/TasksPage.tsx` - Task management page

### 3. Add API Integration

Create service hooks in `packages/web/src/services/`:
- `useCarePlans.ts` - React Query hooks for care plans
- `useTasks.ts` - React Query hooks for tasks

Use existing API client pattern from other verticals.

### 4. Add Routes

Update `packages/web/src/app/routes.tsx`:
```typescript
{
  path: '/care-plans',
  element: <CarePlansPage />,
  permissions: ['care_plan:read']
},
{
  path: '/care-plans/:id',
  element: <CarePlanDetailPage />,
  permissions: ['care_plan:read']
},
{
  path: '/tasks',
  element: <TasksPage />,
  permissions: ['task:read']
}
```

### 5. Add Navigation

Update main navigation in `packages/web/src/app/components/Navigation.tsx`:
- Add "Care Plans" menu item for coordinators
- Add "My Tasks" menu item for caregivers

### 6. Styling & UX

- Use existing Tailwind design system
- Follow form patterns from client demographics vertical
- Mobile-responsive (mobile-first)
- Loading states for all async operations
- Optimistic updates for task completion
- Accessible (WCAG AA)

## User Stories

1. **As a coordinator**, I can create a care plan with goals and interventions for a client
2. **As a coordinator**, I can view all care plans and track progress toward goals
3. **As a coordinator**, I can create task templates and assign tasks to caregivers
4. **As a caregiver**, I can view my assigned tasks filtered by client and date
5. **As a caregiver**, I can mark tasks complete with notes and signature
6. **As an administrator**, I can generate reports on care plan outcomes

## Acceptance Criteria

- [ ] All components created and styled
- [ ] Pages integrated with React Router
- [ ] API integration with React Query hooks
- [ ] Form validation with Zod schemas
- [ ] Navigation menu updated
- [ ] Mobile responsive design
- [ ] Loading and error states implemented
- [ ] Tests for critical components (>70% coverage)
- [ ] Works end-to-end in local dev environment

## Reference Components

Look at these existing verticals for patterns:
- `packages/web/src/app/pages/clients/` - Client demographics UI patterns
- `packages/web/src/app/pages/scheduling/` - Scheduling UI patterns
- Form patterns and validation examples

## Backend API Reference

- Care Plans API: `verticals/care-plans-tasks/src/routes/care-plans.routes.ts`
- Tasks API: `verticals/care-plans-tasks/src/routes/tasks.routes.ts`
- Types: `verticals/care-plans-tasks/src/types/`
