# Task 0005: My Visits API Endpoint

## Status
[x] In Progress

## Priority
High

## Description
The mobile ScheduleScreen is integrated but needs the `/api/visits/my-visits` endpoint to fetch visits assigned to the authenticated caregiver within a date range.

## Acceptance Criteria
- [ ] GET `/api/visits/my-visits` endpoint implemented
- [ ] Accepts start_date and end_date query params
- [ ] Returns visits for authenticated caregiver only
- [ ] Includes client name and address
- [ ] Includes scheduled start/end times
- [ ] Includes service type details
- [ ] Includes visit status
- [ ] Includes EVV record ID if exists
- [ ] Ordered by scheduled start time
- [ ] Requires authentication (JWT)
- [ ] Response time < 200ms

## Technical Notes
- Filter by caregiver_id from JWT
- Join with clients table for name/address
- Join with service_types table
- Date range validation (max 31 days)
- Add pagination if needed (limit 100)
- Proper timezone handling

## Related Tasks
- Integrates with: ScheduleScreen.tsx (mobile)
- Uses: useSchedule hook
