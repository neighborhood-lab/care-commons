# Task 0008: Fix EVV Notification Recipients

## Status
- [ ] To Do
- [ ] In Progress
- [x] Completed

## Priority
High

## Description
EVV service has TODO comments for determining notification recipients when clock-in/clock-out occurs. Currently notifications are sent with empty recipient lists. Implement proper recipient resolution (supervisors, family members, on-call staff) based on organization configuration.

## Acceptance Criteria
- [ ] Resolve supervisors for notification (org/branch hierarchy)
- [ ] Resolve family members (if enabled per client preferences)
- [ ] Resolve on-call staff (for late/missed visits)
- [ ] Add organization-level notification preferences
- [ ] Add client-level notification preferences (opt-in/opt-out)
- [ ] Update notification calls in EVV service
- [ ] Add tests for recipient resolution logic

## Technical Notes
**Files to Update**:
- `verticals/time-tracking-evv/src/service/evv-service.ts` (2 TODOs)
- Add recipient resolution helper function
- Query organization/client preferences from database

**Notification Triggers**:
1. **Clock-in verification failure** → Notify supervisor
2. **Clock-out late** → Notify supervisor + family (if enabled)
3. **Missed visit** → Notify supervisor + on-call + family

**Database Schema** (may need migration):
- `organizations` table: Add `notification_preferences` JSONB
- `clients` table: Add `notification_preferences` JSONB

## Related Tasks
- Depends on: #0005 (Visit Status Notifications)
- Improves: EVV compliance monitoring
- Blocks: Full notification feature rollout

## Completion Checklist
- [ ] Design notification preferences schema
- [ ] Create database migration (if needed)
- [ ] Implement recipient resolution logic
- [ ] Update EVV service notification calls
- [ ] Write unit tests for recipient resolution
- [ ] Write integration tests for notification delivery
- [ ] Manual testing with demo data
- [ ] PR created, checks passing
- [ ] PR merged to develop

## Notes
Critical for operational workflows - supervisors need real-time alerts for visit issues.
