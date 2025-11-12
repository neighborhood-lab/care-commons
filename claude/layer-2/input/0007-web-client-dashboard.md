# Task 0007: Web Client Dashboard

## Status
[x] Completed - PR #268 Merged

## Priority
Medium

## Description
Coordinators need a dashboard view showing all clients with quick access to upcoming visits, recent notes, alerts, and care plan status. Currently navigation requires multiple clicks.

## Acceptance Criteria
- [x] Dashboard page at `/clients/dashboard`
- [x] Client list with search and filters
- [x] Each client card shows: name, next visit, alerts count
- [x] Click to expand shows recent visit notes
- [x] Shows care plan compliance status
- [x] Shows outstanding tasks
- [x] Filter by: active/inactive, alerts, upcoming visits
- [x] Sort by: name, last visit, alerts
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
