# Task 0005: Implement Visit Status Notifications

## Status
- [ ] To Do
- [x] In Progress
- [ ] Completed

## Priority
High

## Description
Implement real-time notifications for visit status changes (clock-in, clock-out, cancellations, no-shows) to keep coordinators and family members informed. This reduces "where is the caregiver?" phone calls and improves transparency.

## Acceptance Criteria
- [ ] Coordinators receive notifications when caregivers clock in/out late or miss visits
- [ ] Family members (if opted-in) receive notifications when visits start and end
- [ ] Notifications support multiple channels (in-app, email, SMS)
- [ ] Notification preferences are configurable per user
- [ ] Rate limiting prevents notification spam (max 10/hour per user)
- [ ] Audit trail logs all notifications sent

## Technical Notes
**Architecture**:
- Provider pattern for extensibility (EmailProvider, SMSProvider, InAppProvider)
- Event-driven: Hook into EVVService clockIn/clockOut and ScheduleService updateVisitStatus
- Queue-based delivery for reliability (in-memory queue for MVP, Redis later)

**Integration Points**:
- `EVVService.clockIn()` at verticals/time-tracking-evv/src/service/evv-service.ts:300
- `EVVService.clockOut()` at verticals/time-tracking-evv/src/service/evv-service.ts:529
- `ScheduleService.updateVisitStatus()` at verticals/scheduling-visits/src/service/schedule-service.ts:193

**Notification Rules**:
- Late clock-in (>10 min): Coordinator
- Missed visit (no clock-in 30 min after): Coordinator + Family
- Successful clock-in: Family (if opted-in)
- Successful clock-out: Family + Coordinator
- Visit canceled: Caregiver + Family + Coordinator

## Related Tasks
- Depends on: #0004 (EVV validation integration points)
- Blocks: Family portal notifications

## Completion Checklist
- [ ] NotificationService with provider pattern implemented
- [ ] Email provider (SendGrid) implemented
- [ ] SMS provider (Twilio) stubbed (no API keys yet)
- [ ] In-app notification system implemented
- [ ] Event hooks in EVV and Schedule services
- [ ] User notification preferences CRUD API
- [ ] Notification templates for each event type
- [ ] Rate limiting (10/hour per user)
- [ ] Unit tests >80% coverage
- [ ] Integration tests for delivery
- [ ] PR created, checks passing
- [ ] PR merged to develop

## Notes
MVP: Focus on email notifications first (SendGrid free tier). SMS and in-app can be Phase 2.
