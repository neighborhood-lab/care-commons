# Task 0009: Integrate Family Engagement with Client/Care Plan Services

## Status
- [ ] To Do
- [x] In Progress
- [ ] Completed

## Priority
Medium

## Description
Family Engagement service has 7 FIXME comments where it returns placeholder data instead of integrating with actual client demographics and care plan services. Implement proper service-to-service communication to fetch real client names, upcoming visits, and care plan data.

## Acceptance Criteria
- [ ] Replace FIXME: Get actual user name (2 instances)
- [ ] Replace FIXME: Fetch from client service (client names)
- [ ] Replace FIXME: Get upcoming visits from visit summary table
- [ ] Replace FIXME: Fetch from care plan service (active care plan)
- [ ] Replace FIXME: Trigger actual notification delivery (email, SMS, push)
- [ ] Replace FIXME: Get thread to validate access
- [ ] Add unit tests with proper mocking
- [ ] Add integration tests

## Technical Notes
**Services to Integrate**:
1. **Client Demographics**: Import `ClientService` to fetch client details
2. **Care Plans**: Import `CarePlanService` to fetch active care plan
3. **Scheduling**: Query `visits` table for upcoming visits
4. **Users**: Query `users` table to resolve user names from IDs
5. **Notifications**: Use notification service for actual delivery

**Architecture**:
- Use dependency injection (pass services to constructor)
- Add proper error handling for service failures
- Cache frequently accessed data (client names, user names)

**Performance Considerations**:
- Batch fetch user names (single query for multiple IDs)
- Use LEFT JOIN for optional relationships (care plans may not exist)
- Add database indexes if query performance degrades

## Related Tasks
- Depends on: Client Demographics service
- Depends on: Care Plans service
- Depends on: #0005 (Notification service)

## Completion Checklist
- [ ] Import required services
- [ ] Implement user name resolution
- [ ] Implement client name fetching
- [ ] Implement upcoming visits query
- [ ] Implement active care plan fetching
- [ ] Implement notification trigger
- [ ] Implement thread validation
- [ ] Update unit tests with proper mocks
- [ ] Write integration tests
- [ ] PR created, checks passing
- [ ] PR merged to develop

## Notes
Improves family engagement feature completeness. Enables real family portal functionality.
