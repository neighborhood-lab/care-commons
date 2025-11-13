# Task 0014: Mobile Push Notifications

## Status
[ ] To Do

## Priority
Low

## Description
Send push notifications to caregivers for important updates: upcoming visits (1 hour before), shift changes, urgent messages from coordinators.

## Acceptance Criteria
- [ ] Push notification permission request flow
- [ ] Register device token with backend
- [ ] Notifications for: upcoming visits, shift changes, messages
- [ ] Notification settings in ProfileScreen
- [ ] Granular control (can disable certain notification types)
- [ ] Deep linking to relevant screen when tapped
- [ ] Works when app is closed/backgrounded
- [ ] Badge count on app icon
- [ ] Clear notifications when viewed
- [ ] Respects Do Not Disturb hours (if set)

## Technical Notes
- Use expo-notifications
- Backend: Firebase Cloud Messaging or similar
- Store device tokens in caregivers table
- Send from backend when events occur
- Add notification_preferences table for granular settings
- Handle both iOS and Android

## Related Tasks
- Enhances: Communication workflow
- Related to: ProfileScreen settings
