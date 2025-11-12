# Task 0015: Implement Mobile Sync Status Screen

## Metadata
- **Status**: To Do
- **Priority**: High
- **Created**: 2025-11-12
- **Source**: Layer-2 Task 0003

## Problem Statement

Caregivers working in areas with poor or intermittent connectivity need visibility into:
- What data is queued for synchronization
- What failed to sync and why
- What successfully synced
- Current network status

Without this visibility, caregivers lack confidence that their critical work (check-ins, notes, visit completions) is being properly recorded in the system. This creates anxiety and uncertainty in the field.

## Regulatory Context

**HIPAA Security Rule** (§164.312(b) - Audit Controls):
- Electronic health information systems must maintain audit trails
- Users must be able to verify that their actions are properly recorded
- Failed sync operations could result in missing audit trail data

**21st Century Cures Act EVV Requirements**:
- EVV data must be reliably transmitted to state aggregators
- Agencies must have mechanisms to detect and correct failed transmissions
- Visibility into sync status helps ensure EVV compliance

## Acceptance Criteria

### Core Functionality
- [ ] `SyncStatusScreen` accessible from `ProfileScreen` via navigation
- [ ] Shows pending sync queue count (e.g., "3 items waiting to sync")
- [ ] Lists items waiting to sync with details (visits, check-ins, notes)
- [ ] Shows last successful sync timestamp
- [ ] Shows failed sync items with error messages
- [ ] Manual "Retry Failed" button to re-attempt failed syncs
- [ ] Manual "Sync Now" button to trigger immediate sync
- [ ] Network status indicator (online/offline)
- [ ] Clears queue items from display after successful sync

### User Experience
- [ ] Pull-to-refresh gesture to reload sync status
- [ ] Loading states during sync operations
- [ ] Success/error toast messages after sync attempts
- [ ] Human-readable sync operation types (not technical codes)
- [ ] Badge count on Profile tab showing pending items

### Technical Requirements
- [ ] Read from offline sync queue in WatermelonDB
- [ ] Use existing `useSyncStatus` hook (if exists) or create one
- [ ] TypeScript strict mode compliance
- [ ] No lint warnings or errors
- [ ] Deterministic unit tests with >80% coverage
- [ ] ESM architecture maintained (`.js` imports)

## Technical Approach

### 1. Check Existing Sync Infrastructure

First, I need to examine:
- Current WatermelonDB sync implementation
- Existing sync queue structure
- Whether `useSyncStatus` hook exists
- How sync operations are currently tracked

### 2. Create Sync Status Hook

If it doesn't exist, create `useSyncStatus` hook to:
- Query WatermelonDB for pending sync operations
- Track last sync timestamp
- Track failed operations with error details
- Provide retry and manual sync functions
- Subscribe to sync queue changes (real-time updates)

### 3. Implement UI Components

Create:
- `SyncStatusScreen.tsx` - Main screen component
- `SyncQueueItem.tsx` - Individual queue item display
- `SyncStatusBadge.tsx` - Badge for Profile tab
- Navigation integration in `ProfileScreen`

### 4. Wire Up Actions

Implement:
- Manual sync trigger
- Retry failed items
- Pull-to-refresh
- Real-time queue updates

## State-Specific Considerations

**Texas (HHSC)**:
- EVV data must be submitted within 4 days of visit completion
- Sync failures could result in late submissions and compliance violations
- Clear visibility helps caregivers and coordinators identify at-risk visits

**Florida (AHCA)**:
- Real-time EVV submission preferred
- Sync status helps identify connectivity issues early
- Failed submissions must be corrected within service authorization period

**Universal**:
- All states require reliable EVV data transmission
- Sync visibility is a quality assurance mechanism
- Helps identify systemic issues (bad network coverage in service areas)

## Files to Modify

**New Files**:
- `packages/mobile/src/screens/SyncStatusScreen.tsx`
- `packages/mobile/src/hooks/useSyncStatus.ts` (if doesn't exist)
- `packages/mobile/src/components/SyncQueueItem.tsx`
- `packages/mobile/src/components/SyncStatusBadge.tsx`
- `packages/mobile/src/__tests__/SyncStatusScreen.test.tsx`
- `packages/mobile/src/__tests__/useSyncStatus.test.ts`

**Modified Files**:
- `packages/mobile/src/screens/ProfileScreen.tsx` (add navigation)
- `packages/mobile/src/navigation/types.ts` (add SyncStatus screen type)
- `packages/mobile/src/navigation/AppNavigator.tsx` (register screen)

## Success Criteria

1. **Functional**: All acceptance criteria met
2. **Code Quality**: Zero lint/typecheck warnings
3. **Testing**: >80% coverage with deterministic tests
4. **CI/CD**: All checks pass (lint, typecheck, test, build)
5. **User Impact**: Caregivers have confidence in data sync

## Out of Scope

- Backend sync endpoint modifications (use existing)
- Sync algorithm changes (use existing WatermelonDB sync)
- Offline data conflict resolution (handled by existing sync)
- Advanced sync debugging tools (future enhancement)

## Implementation Notes

- This is a **frontend-only** task focused on visibility
- Backend sync infrastructure already exists
- Focus on clear, actionable information for caregivers
- Error messages should be non-technical and actionable
- Consider battery/performance impact of real-time updates

## Related Tasks

- Depends on: Existing WatermelonDB sync implementation
- Enables: Caregiver confidence in offline-first architecture
- Future: Advanced sync debugging and conflict resolution tools

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] All CI checks passing
- [ ] Tests passing with >80% coverage
- [ ] No lint or typecheck warnings
- [ ] Documentation updated
- [ ] PR merged to `develop`
- [ ] Task marked as completed
