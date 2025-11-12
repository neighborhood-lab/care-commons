# Task 0014: Implement Mobile Push Notifications

## Status
- [ ] To Do
- [x] In Progress
- [ ] Completed

## Priority
High

## Description
Implement push notification infrastructure for the mobile app to enable real-time alerts for caregivers. Notifications are critical for: visit reminders, schedule changes, urgent client needs, and compliance alerts. This directly impacts caregiver responsiveness and visit completion rates.

## Acceptance Criteria
- [ ] Expo push notification setup in mobile app
- [ ] Device token registration endpoint (`POST /api/push/register`)
- [ ] Send notification endpoint (`POST /api/push/send`)
- [ ] Integration with NotificationService for automatic push delivery
- [ ] Notification types: visit_reminder, schedule_change, urgent_alert, compliance_warning
- [ ] Proper iOS and Android configuration
- [ ] Handle notification permissions gracefully
- [ ] Deep linking to relevant screens (visit details, messages, etc.)
- [ ] Store notification delivery status for audit trails
- [ ] Retry logic for failed pushes
- [ ] Unit tests for push service
- [ ] E2E test for notification flow

## Technical Notes
**Technology Stack**:
- **Expo Notifications** - React Native push notification API
- **Expo Push Service** - Handles iOS/Android delivery
- **Backend**: New `PushNotificationService` in packages/core

**Notification Flow**:
1. Mobile app requests permission on first launch
2. Device receives push token from Expo
3. App sends token to backend via `/api/push/register`
4. Backend stores token linked to user/caregiver
5. When event occurs (visit reminder, etc.), NotificationService triggers push
6. Backend calls Expo Push API with tokens
7. Expo delivers to iOS/Android
8. User taps notification → deep link to relevant screen

**Database Schema**:
```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_token VARCHAR(255) NOT NULL UNIQUE,
  device_type VARCHAR(10) NOT NULL, -- 'ios' or 'android'
  device_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(is_active);

CREATE TABLE push_notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id),
  push_token_id UUID NOT NULL REFERENCES push_tokens(id),
  expo_ticket_id VARCHAR(255), -- For tracking delivery status
  status VARCHAR(50) NOT NULL, -- 'sent', 'delivered', 'failed', 'error'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_push_deliveries_notification ON push_notification_deliveries(notification_id);
CREATE INDEX idx_push_deliveries_status ON push_notification_deliveries(status);
```

**Mobile Implementation**:
- Location: `packages/mobile/src/services/PushNotificationService.ts`
- Register for notifications on app launch
- Handle foreground and background notifications
- Deep link routing based on notification data

**Backend Implementation**:
- Location: `packages/core/src/services/push-notification-service.ts`
- HTTP client to Expo Push API
- Batch notification sending (max 100 per request)
- Error handling and retry logic
- Integration with existing NotificationService

**Notification Types & Deep Links**:
- `visit_reminder` → `/visits/:id`
- `schedule_change` → `/schedule`
- `urgent_alert` → `/messages/:id`
- `compliance_warning` → `/profile/compliance`

**Environment Variables**:
```
# No auth needed for Expo push - uses app credentials
EXPO_PROJECT_ID=<from app.json>
```

## Related Tasks
- Integrates with: NotificationService (packages/core)
- Enhances: Mobile caregiver experience
- Enables: Real-time visit coordination

## Completion Checklist
- [ ] Database migration for push_tokens and push_notification_deliveries tables
- [ ] PushNotificationService implementation (backend)
- [ ] Device token registration endpoint
- [ ] Send notification endpoint
- [ ] Mobile PushNotificationService (expo-notifications)
- [ ] Permission request flow in mobile app
- [ ] Deep linking configuration
- [ ] Integration with NotificationService
- [ ] Unit tests for backend service
- [ ] Unit tests for mobile service
- [ ] E2E test for notification delivery
- [ ] Documentation for push notification setup
- [ ] Lint passing
- [ ] Type check passing
- [ ] PR created, checks passing
- [ ] PR merged to develop
- [ ] Post-merge checks passing

## Notes
Push notifications are **critical for caregiver engagement**. Studies show:
- 70% higher visit completion rates with reminders
- 50% faster response to schedule changes
- Improved client safety through urgent alerts

This feature directly serves underserved populations by:
- Ensuring consistent care delivery
- Reducing missed visits (which can have serious health consequences)
- Enabling rapid response to emergencies
- Supporting caregivers who may have limited English proficiency (visual alerts + icons)

**Implementation Priority**: High - This is a foundational mobile feature that enables real-time coordination.

**Testing Strategy**:
- Unit tests: Service methods, token registration, notification sending
- Integration tests: End-to-end flow from event → push delivery
- Manual tests: iOS and Android devices with Expo Go and production builds
- Compliance: Ensure audit trail for all push deliveries (HIPAA requirement)

**Security Considerations**:
- Never include PHI in push notification body (use generic messages like "New visit update")
- Require authentication for token registration
- Validate push tokens before storage
- Implement rate limiting to prevent abuse
- Track delivery failures for security monitoring

**Future Enhancements** (out of scope for this task):
- Rich notifications with action buttons
- Notification preferences/settings
- Scheduled push reminders
- Badge count synchronization
- Custom notification sounds
