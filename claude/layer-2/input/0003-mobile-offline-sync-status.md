# Task 0003: Mobile Offline Sync Status Screen

## Status
[x] In Progress

## Priority
Medium

## Description
Caregivers working in areas with poor connectivity need visibility into what data is queued for sync, what failed, and what succeeded. A dedicated SyncStatus screen improves trust and troubleshooting.

## Acceptance Criteria
- [ ] SyncStatusScreen accessible from ProfileScreen
- [ ] Shows pending sync queue count
- [ ] Lists items waiting to sync (visits, check-ins, notes)
- [ ] Shows last successful sync timestamp
- [ ] Shows failed sync items with error messages
- [ ] Manual "Retry Failed" button
- [ ] Manual "Sync Now" button
- [ ] Network status indicator (online/offline)
- [ ] Clears queue items after successful sync

## Technical Notes
- Read from offline sync queue in WatermelonDB
- Use useSyncStatus hook (already exists)
- Display human-readable sync operation types
- Add pull-to-refresh to retry
- Consider badge count on Profile tab

## Related Tasks
- Related to: ProfileScreen navigation
- Uses: Existing sync infrastructure
