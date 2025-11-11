# Task 0007: Web Client Dashboard

## Status
[ ] To Do

## Priority
Medium

## Description
Coordinators need a dashboard view showing all clients with quick access to upcoming visits, recent notes, alerts, and care plan status. Currently navigation requires multiple clicks.

## Acceptance Criteria
- [ ] Dashboard page at `/clients/dashboard`
- [ ] Client list with search and filters
- [ ] Each client card shows: name, next visit, alerts count
- [ ] Click to expand shows recent visit notes
- [ ] Shows care plan compliance status
- [ ] Shows outstanding tasks
- [ ] Filter by: active/inactive, alerts, upcoming visits
- [ ] Sort by: name, last visit, alerts
- [ ] Pagination (50 per page)
- [ ] Responsive design

## Technical Notes
- Use existing client components where possible
- Fetch from `/api/clients/dashboard` endpoint
- Use React Query for caching
- Consider virtualization for large lists
- Add skeleton loading states

## Related Tasks
- Uses: Existing client-demographics vertical
- Related to: Coordinator workflows
