# Task 0056: Mobile TasksScreen Implementation

**Priority**: 🟠 MEDIUM (Feature Completion)
**Category**: Mobile / Frontend
**Estimated Effort**: 2-3 days

## Context

TasksScreen currently placeholder (34 lines at `packages/mobile/src/screens/visits/TasksScreen.tsx`). Caregivers need to view and complete care tasks during visits.

## Objective

Implement full TasksScreen with task list, completion UI, photo attachments, and notes.

## Requirements

1. **Task List**: Display assigned tasks for current visit
2. **Task Completion**: Mark tasks as complete with checkmarks
3. **Photo Attachments**: Attach photos to task completions (wound care, etc.)
4. **Notes**: Add text notes to tasks
5. **Offline Support**: Complete tasks offline, sync when online
6. **Progress Tracking**: Show % completion for visit

## Implementation

**Key Features**:
- Fetch tasks from `/api/care-plans/tasks?visit_id={id}`
- Checkboxes for task completion
- Camera for photo attachments
- Text input for notes
- Progress bar showing completion %
- Offline queue for task completions

## Success Criteria

- [ ] Tasks load from care plan API
- [ ] Tasks can be marked complete offline
- [ ] Photos attach to tasks
- [ ] Notes save with tasks
- [ ] Progress updates in real-time
- [ ] Syncs when back online
