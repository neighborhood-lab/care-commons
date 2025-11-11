# Task 0002: Mobile Visit Check-In/Check-Out

## Status
[ ] To Do

## Priority
High

## Description
Caregivers need to check in and check out of visits from the mobile app for EVV (Electronic Visit Verification) compliance. This is critical for Medicaid/Medicare reimbursement.

## Acceptance Criteria
- [ ] Check-in button on ScheduleScreen for scheduled visits
- [ ] Captures GPS coordinates at check-in
- [ ] Validates caregiver is within geofence radius
- [ ] Records actual start time
- [ ] Check-out button during active visit
- [ ] Captures GPS at check-out
- [ ] Records actual end time
- [ ] Syncs to backend API
- [ ] Works offline (queues for later sync)
- [ ] Displays sync status to caregiver

## Technical Notes
- Use expo-location for GPS
- Store in WatermelonDB immediately
- Sync to `/api/visits/:id/check-in` and `/api/visits/:id/check-out`
- Handle permission requests gracefully
- Validate against state-specific EVV requirements (TX, FL, etc.)

## Related Tasks
- Depends on: Task 0004 (ScheduleScreen - complete)
- Blocks: EVV reporting compliance
