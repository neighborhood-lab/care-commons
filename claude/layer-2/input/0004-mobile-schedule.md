# Task 0057: Mobile ScheduleScreen Implementation

**Priority**: 🟠 MEDIUM (Feature Completion)
**Category**: Mobile / Frontend
**Estimated Effort**: 2-3 days

## Context

ScheduleScreen placeholder (28 lines). Caregivers need weekly view of assigned visits.

## Objective

Implement full ScheduleScreen with weekly calendar, visit details, and navigation integration.

## Requirements

1. **Weekly Calendar**: Show current week with visits by day
2. **Visit Cards**: Each visit shows client, time, address
3. **Navigation**: Tap visit to get directions (Apple Maps/Google Maps)
4. **Filters**: Filter by status (upcoming, completed, cancelled)
5. **Offline Support**: View schedule offline
6. **Pull to Refresh**: Update schedule from server

## Implementation

**Key Features**:
- Calendar component (react-native-calendars or custom)
- Fetch from `/api/visits/my-visits?start_date=X&end_date=Y`
- Deep linking to maps apps
- Cached schedule for offline viewing
- Swipe gestures for week navigation

## Success Criteria

- [ ] Weekly calendar view functional
- [ ] Visits display correctly by day
- [ ] Tap visit opens details
- [ ] Navigation to client address works
- [ ] Offline caching works
- [ ] Pull to refresh updates data
