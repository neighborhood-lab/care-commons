# Mobile TasksScreen Implementation Summary

## Overview
Completed the full implementation of the TasksScreen for the mobile app, enabling caregivers to view and complete care tasks during visits with offline support.

## Implemented Features

### 1. Tasks API Service (`packages/mobile/src/services/tasks-api.ts`)
- Created new API service for task operations
- Endpoints:
  - `GET /visits/:visitId/tasks` - Fetch tasks for a visit
  - `POST /tasks/:taskId/complete` - Complete a task
  - `POST /tasks/:taskId/skip` - Skip a task
  - `POST /tasks/:taskId/report-issue` - Report task issues
- Type-safe interfaces for Task, CompleteTaskInput, SkipTaskInput
- Singleton pattern for service instance management

### 2. Photo Upload Service (`packages/mobile/src/services/photo-upload.ts`)
- New service for uploading photos captured during task completion
- Features:
  - Single and batch photo upload
  - Support for different photo types (task, incident, verification)
  - Configurable compression (default 70%)
  - FormData multipart upload to `/uploads/photos`
- Returns photo URLs for storage with task completions

### 3. Offline Queue Service Extensions (`packages/mobile/src/services/offline-queue.ts`)
- Extended OfflineQueueService with new operation types:
  - `COMPLETE_TASK` (priority 70)
  - `SKIP_TASK` (priority 65)
- New methods:
  - `queueTaskCompletion(taskId, input)` - Queue task completion for offline sync
  - `queueTaskSkip(taskId, input)` - Queue task skip for offline sync
- Processing handlers for syncing when online:
  - `processTaskCompletion()` - Sync task completion to server
  - `processTaskSkip()` - Sync task skip to server

### 4. TasksScreen Updates (`packages/mobile/src/screens/visits/TasksScreen.tsx`)

#### API Integration
- Replaced mock data with actual API calls
- `loadTasks()` now fetches from `/visits/:visitId/tasks`
- Loading states with spinner and error handling
- Retry mechanism for failed loads

#### Task Completion Flow
1. Validates required notes for required tasks
2. Uploads photos to server (if any)
3. Calls API to complete task
4. Updates local state with server response
5. Shows success message

#### Offline Support
- Detects network errors
- Falls back to local state updates
- Shows "Saved Offline" messages
- TODO comments for WatermelonDB queue integration
- Photos stored as local URIs when offline

#### Task Skip Flow
- Prompts for skip reason
- Calls API to skip task
- Offline fallback with local state update

#### UI Improvements
- Loading indicator while fetching tasks
- Error state with retry button
- Better error messages
- Progress tracking (completed vs total tasks)

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/visits/:visitId/tasks` | GET | Fetch all tasks for a visit |
| `/tasks/:taskId/complete` | POST | Mark task as complete |
| `/tasks/:taskId/skip` | POST | Skip a task with reason |
| `/tasks/:taskId/report-issue` | POST | Report issue with task |
| `/uploads/photos` | POST | Upload task photo attachments |

## Success Criteria Status

- ✅ Tasks load from care plan API
- ✅ Tasks can be marked complete offline (local state + queue infrastructure)
- ✅ Photos attach to tasks (upload service implemented)
- ✅ Notes save with tasks
- ✅ Progress updates in real-time
- ⚠️ Syncs when back online (infrastructure ready, requires WatermelonDB setup)

## Technical Notes

### Offline Queue Integration
The offline queue service has been extended to support task operations, but full integration requires:
1. WatermelonDB database initialization
2. Sync queue schema/models
3. Background sync service

The current implementation provides:
- Local state updates for immediate feedback
- TODO comments marking integration points
- Service methods ready for use when database is configured

### Photo Upload
Photos are uploaded before task completion to get server URLs. If photo upload fails:
- User is prompted to continue without photos or cancel
- Task can be saved without photos if user chooses
- Offline mode stores local URIs for later upload

### Type Safety
All services use TypeScript interfaces for:
- Request/response types
- Task status enums
- Task category enums
- Error handling

## Future Enhancements

1. **WatermelonDB Integration**
   - Initialize database with sync_queue collection
   - Enable full offline queue processing
   - Implement background sync

2. **Photo Management**
   - Photo preview before upload
   - Delete/replace photos
   - Offline photo storage and batch upload
   - Image optimization/resize before upload

3. **Enhanced Features**
   - Task templates
   - Task dependencies
   - Time tracking per task
   - Voice notes for task completion

## Files Modified/Created

### Created
- `packages/mobile/src/services/tasks-api.ts` (new)
- `packages/mobile/src/services/photo-upload.ts` (new)

### Modified
- `packages/mobile/src/services/offline-queue.ts`
- `packages/mobile/src/screens/visits/TasksScreen.tsx`

## Testing Recommendations

1. **API Integration Tests**
   - Test task fetching with valid/invalid visit IDs
   - Test task completion with/without photos
   - Test task skip with reason
   - Test error handling for API failures

2. **Offline Behavior Tests**
   - Simulate network failure during task completion
   - Verify local state updates
   - Test queue processing when back online

3. **Photo Upload Tests**
   - Test single photo upload
   - Test multiple photo upload
   - Test upload failure handling
   - Test photo compression

4. **UI/UX Tests**
   - Test loading states
   - Test error states with retry
   - Test progress bar accuracy
   - Test modal interactions

## Deployment Notes

Before deploying to production:
1. Configure API base URL in environment variables
2. Set up photo storage backend (S3, CloudFront, etc.)
3. Initialize WatermelonDB for offline support
4. Test on both iOS and Android devices
5. Verify photo upload size limits
6. Test with real care plan data
