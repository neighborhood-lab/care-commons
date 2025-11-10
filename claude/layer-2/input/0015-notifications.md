# Task 0067: Notification Delivery System Implementation

**Priority:** 🔴 CRITICAL
**Estimated Effort:** 1-2 weeks
**Vertical:** family-engagement
**Type:** Feature Implementation

---

## Context

The family engagement portal was recently built (#196) but currently has **zero actual notification delivery**. The service has 6 `FIXME` comments related to notification delivery:

```typescript
// verticals/family-engagement/src/services/family-engagement-service.ts:183
FIXME: Trigger actual notification delivery (email, SMS, push)
```

Families can use the portal, but they receive no proactive notifications about:
- Visit updates (scheduled, started, completed, missed)
- New messages from care team
- Care plan changes
- Upcoming visits
- Emergency alerts

This is a **user experience blocker** - families won't know to check the portal without notifications.

---

## Objectives

Implement a complete, production-ready notification delivery system supporting:

1. **Email notifications** (primary channel)
2. **SMS notifications** (urgent alerts)
3. **Push notifications** (mobile app users)
4. **Notification preferences** (per-user settings)
5. **Delivery retry logic** (handle failures gracefully)
6. **Notification templates** (consistent messaging)
7. **Digest scheduling** (avoid notification spam)

---

## Technical Requirements

### 1. Service Provider Integration

Choose and integrate notification providers:

**Email:**
- **Option A (Recommended):** SendGrid (transactional email specialist)
- **Option B:** AWS SES (cost-effective, requires more setup)
- **Option C:** Postmark (developer-friendly)

**SMS:**
- **Recommended:** Twilio (industry standard)
- **Alternative:** AWS SNS (lower cost, less features)

**Push Notifications:**
- **Mobile:** Expo Push Notifications (already using Expo)
- **Web:** Firebase Cloud Messaging (FCM)

### 2. Implementation Plan

#### Phase 1: Email Notifications (Week 1)

**2.1 Create notification service abstraction:**

```typescript
// packages/core/src/services/notification/notification-service.ts

export interface INotificationService {
  sendEmail(params: EmailNotificationParams): Promise<NotificationResult>;
  sendSMS(params: SMSNotificationParams): Promise<NotificationResult>;
  sendPush(params: PushNotificationParams): Promise<NotificationResult>;

  // Batch operations
  sendBatch(notifications: NotificationRequest[]): Promise<NotificationResult[]>;

  // Scheduled/digest notifications
  scheduleDigest(userId: string, frequency: DigestFrequency): Promise<void>;
}

interface EmailNotificationParams {
  to: string;
  subject: string;
  template: NotificationTemplate;
  data: Record<string, any>;
  priority: 'high' | 'normal' | 'low';
}

interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: Error;
  provider: 'email' | 'sms' | 'push';
}

enum NotificationTemplate {
  VISIT_SCHEDULED = 'visit-scheduled',
  VISIT_STARTED = 'visit-started',
  VISIT_COMPLETED = 'visit-completed',
  VISIT_MISSED = 'visit-missed',
  MESSAGE_RECEIVED = 'message-received',
  CARE_PLAN_UPDATED = 'care-plan-updated',
  WEEKLY_DIGEST = 'weekly-digest',
  EMERGENCY_ALERT = 'emergency-alert',
}
```

**2.2 Implement SendGrid provider:**

```typescript
// packages/core/src/services/notification/providers/sendgrid-provider.ts

import sgMail from '@sendgrid/mail';

export class SendGridProvider implements IEmailProvider {
  constructor(apiKey: string, fromEmail: string) {
    sgMail.setApiKey(apiKey);
    this.fromEmail = fromEmail;
  }

  async send(params: EmailNotificationParams): Promise<NotificationResult> {
    try {
      const html = await this.renderTemplate(params.template, params.data);

      const msg = {
        to: params.to,
        from: this.fromEmail,
        subject: params.subject,
        html,
        // Track opens/clicks
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
        },
      };

      const [response] = await sgMail.send(msg);

      return {
        success: true,
        messageId: response.headers['x-message-id'],
        provider: 'email',
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        provider: 'email',
      };
    }
  }
}
```

**2.3 Create email templates:**

Use Handlebars or similar for templates:

```
packages/core/src/services/notification/templates/
├── visit-scheduled.hbs
├── visit-started.hbs
├── visit-completed.hbs
├── visit-missed.hbs
├── message-received.hbs
├── care-plan-updated.hbs
├── weekly-digest.hbs
└── emergency-alert.hbs
```

Example template (`visit-scheduled.hbs`):

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    /* Inline styles for email compatibility */
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #4F46E5; color: white; padding: 20px; }
    .content { padding: 20px; }
    .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Visit Scheduled</h1>
  </div>
  <div class="content">
    <p>Hello {{familyMemberName}},</p>

    <p>A visit has been scheduled for <strong>{{clientName}}</strong>:</p>

    <ul>
      <li><strong>Date:</strong> {{visitDate}}</li>
      <li><strong>Time:</strong> {{visitTime}}</li>
      <li><strong>Caregiver:</strong> {{caregiverName}}</li>
      <li><strong>Duration:</strong> {{duration}}</li>
    </ul>

    <p>You can view visit details and track progress in the family portal:</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="{{portalUrl}}/visits/{{visitId}}" class="button">View Visit Details</a>
    </p>

    <p>If you have any questions, please contact us or reply to this email.</p>

    <p>Best regards,<br>{{agencyName}}</p>
  </div>
</body>
</html>
```

#### Phase 2: SMS Notifications (Week 1)

**2.4 Implement Twilio provider:**

```typescript
// packages/core/src/services/notification/providers/twilio-provider.ts

import twilio from 'twilio';

export class TwilioProvider implements ISMSProvider {
  private client: twilio.Twilio;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.client = twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
  }

  async send(params: SMSNotificationParams): Promise<NotificationResult> {
    try {
      const message = await this.client.messages.create({
        to: params.to,
        from: this.fromNumber,
        body: params.message,
      });

      return {
        success: true,
        messageId: message.sid,
        provider: 'sms',
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        provider: 'sms',
      };
    }
  }
}
```

**SMS templates** (simple text):

```
Visit scheduled for {{clientName}} on {{visitDate}} at {{visitTime}}.
Caregiver: {{caregiverName}}. View details: {{shortUrl}}
```

Use a URL shortener for SMS links (Bitly, TinyURL, or custom).

#### Phase 3: Push Notifications (Week 2)

**2.5 Implement Expo Push provider:**

```typescript
// packages/core/src/services/notification/providers/expo-push-provider.ts

import { Expo, ExpoPushMessage } from 'expo-server-sdk';

export class ExpoPushProvider implements IPushProvider {
  private expo: Expo;

  constructor() {
    this.expo = new Expo();
  }

  async send(params: PushNotificationParams): Promise<NotificationResult> {
    // Validate push token
    if (!Expo.isExpoPushToken(params.token)) {
      return {
        success: false,
        error: new Error('Invalid Expo push token'),
        provider: 'push',
      };
    }

    try {
      const message: ExpoPushMessage = {
        to: params.token,
        title: params.title,
        body: params.body,
        data: params.data,
        sound: params.priority === 'high' ? 'default' : undefined,
        priority: params.priority === 'high' ? 'high' : 'default',
      };

      const chunks = this.expo.chunkPushNotifications([message]);
      const tickets = await this.expo.sendPushNotificationsAsync(chunks[0]);

      return {
        success: tickets[0].status === 'ok',
        messageId: tickets[0].status === 'ok' ? tickets[0].id : undefined,
        error: tickets[0].status === 'error' ? new Error(tickets[0].message) : undefined,
        provider: 'push',
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        provider: 'push',
      };
    }
  }
}
```

#### Phase 4: User Preferences & Delivery Logic (Week 2)

**2.6 Database schema for preferences:**

```sql
-- packages/core/migrations/026_notification_preferences.sql

CREATE TABLE notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),

  -- Channel preferences
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,

  -- Notification type preferences
  visit_updates_email BOOLEAN DEFAULT true,
  visit_updates_sms BOOLEAN DEFAULT false,
  visit_updates_push BOOLEAN DEFAULT true,

  messages_email BOOLEAN DEFAULT true,
  messages_sms BOOLEAN DEFAULT false,
  messages_push BOOLEAN DEFAULT true,

  care_plan_updates_email BOOLEAN DEFAULT true,
  care_plan_updates_sms BOOLEAN DEFAULT false,
  care_plan_updates_push BOOLEAN DEFAULT false,

  emergency_alerts_email BOOLEAN DEFAULT true,
  emergency_alerts_sms BOOLEAN DEFAULT true,
  emergency_alerts_push BOOLEAN DEFAULT true,

  -- Digest preferences
  digest_frequency VARCHAR(20) DEFAULT 'daily', -- 'immediate', 'daily', 'weekly', 'never'
  digest_time TIME DEFAULT '18:00:00', -- When to send daily digests
  digest_day_of_week INTEGER DEFAULT 1, -- Monday for weekly digests

  -- Contact info
  email VARCHAR(255),
  phone_number VARCHAR(20),
  push_tokens JSONB DEFAULT '[]', -- Array of device tokens

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

-- Notification delivery log
CREATE TABLE notification_deliveries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  notification_type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push'

  -- Delivery details
  delivered_at TIMESTAMP,
  success BOOLEAN,
  error_message TEXT,
  provider_message_id VARCHAR(255),

  -- Content snapshot
  subject VARCHAR(255),
  preview TEXT,

  -- Engagement tracking
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_deliveries_user ON notification_deliveries(user_id);
CREATE INDEX idx_notification_deliveries_type ON notification_deliveries(notification_type);
CREATE INDEX idx_notification_deliveries_created ON notification_deliveries(created_at);
```

**2.7 Intelligent delivery logic:**

```typescript
// packages/core/src/services/notification/delivery-manager.ts

export class NotificationDeliveryManager {
  async deliver(notification: NotificationRequest): Promise<void> {
    const prefs = await this.getPreferences(notification.userId);

    // Check quiet hours
    if (this.isQuietHours(prefs) && notification.priority !== 'high') {
      await this.queueForLater(notification);
      return;
    }

    // Determine channels based on preferences and priority
    const channels = this.selectChannels(notification, prefs);

    // Send via selected channels with retry logic
    const results = await Promise.allSettled(
      channels.map(channel => this.sendViaChannel(notification, channel))
    );

    // Log delivery results
    await this.logDeliveries(notification, results);
  }

  private selectChannels(
    notification: NotificationRequest,
    prefs: NotificationPreferences
  ): NotificationChannel[] {
    const channels: NotificationChannel[] = [];

    // Emergency alerts go to all enabled channels
    if (notification.priority === 'high') {
      if (prefs.emergency_alerts_email && prefs.email) channels.push('email');
      if (prefs.emergency_alerts_sms && prefs.phone_number) channels.push('sms');
      if (prefs.emergency_alerts_push && prefs.push_tokens.length) channels.push('push');
    } else {
      // Normal notifications follow type-specific preferences
      // ... logic based on notification type and user preferences
    }

    return channels;
  }

  private async sendViaChannel(
    notification: NotificationRequest,
    channel: NotificationChannel
  ): Promise<NotificationResult> {
    const provider = this.getProvider(channel);

    // Retry logic with exponential backoff
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const result = await provider.send(notification);

      if (result.success) {
        return result;
      }

      attempts++;
      if (attempts < maxAttempts) {
        await this.delay(Math.pow(2, attempts) * 1000); // 2s, 4s, 8s
      }
    }

    // All retries failed
    throw new Error(`Failed to deliver via ${channel} after ${maxAttempts} attempts`);
  }
}
```

---

## Integration Points

### Update Family Engagement Service

Replace all `FIXME` comments with actual notification calls:

```typescript
// verticals/family-engagement/src/services/family-engagement-service.ts

// Line 183 - After creating notification record
async createNotification(
  familyMemberId: number,
  type: string,
  data: any
): Promise<NotificationRecord> {
  const notification = await this.repository.createNotification({
    family_member_id: familyMemberId,
    type,
    ...data,
  });

  // BEFORE: FIXME: Trigger actual notification delivery
  // AFTER:
  await notificationDeliveryManager.deliver({
    userId: familyMemberId,
    type,
    priority: this.getPriority(type),
    template: this.getTemplate(type),
    data,
  });

  return notification;
}
```

---

## Configuration

### Environment Variables

```bash
# Email (SendGrid)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=notifications@carecommons.example.com
SENDGRID_FROM_NAME=Care Commons

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+1234567890

# Push (Expo)
EXPO_ACCESS_TOKEN=xxx (optional, for increased rate limits)

# Notification settings
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_RETRY_DELAY_MS=2000
NOTIFICATION_BATCH_SIZE=100
```

---

## Testing Requirements

### Unit Tests

1. Email provider sends correctly formatted emails
2. SMS provider sends correctly formatted messages
3. Push provider handles valid/invalid tokens
4. Template rendering works with all data combinations
5. Delivery manager respects user preferences
6. Quiet hours logic works correctly
7. Retry logic executes with exponential backoff

### Integration Tests

1. End-to-end email delivery (use test accounts)
2. End-to-end SMS delivery (use test numbers)
3. End-to-end push delivery (use test tokens)
4. Batch notification delivery
5. Failed delivery handling and logging
6. Preference updates reflect in next delivery

### Manual Testing Checklist

- [ ] Sign up as family member with valid email/phone
- [ ] Set notification preferences in portal
- [ ] Schedule a visit and verify notifications sent
- [ ] Start a visit and verify notifications sent
- [ ] Send a message and verify notifications sent
- [ ] Update care plan and verify notifications sent
- [ ] Test during quiet hours (should queue)
- [ ] Test emergency alert (should override quiet hours)
- [ ] Verify email templates render correctly in Gmail, Outlook, Apple Mail
- [ ] Verify SMS messages are under 160 characters
- [ ] Verify push notifications appear on iOS and Android

---

## Dependencies

```json
{
  "dependencies": {
    "@sendgrid/mail": "^8.1.4",
    "twilio": "^5.3.7",
    "expo-server-sdk": "^3.11.0",
    "handlebars": "^4.7.8",
    "node-html-to-text": "^6.0.0"
  },
  "devDependencies": {
    "@types/node-html-to-text": "^6.0.4"
  }
}
```

---

## Documentation

Update documentation:

1. **User Guide:** How to set notification preferences
2. **Admin Guide:** How to configure notification providers
3. **Developer Guide:** How to add new notification types
4. **Runbook:** Troubleshooting delivery failures

---

## Success Criteria

- [ ] All 6 `FIXME` comments in family-engagement-service.ts resolved
- [ ] Email notifications delivered successfully
- [ ] SMS notifications delivered successfully (optional)
- [ ] Push notifications delivered successfully
- [ ] User preferences honored
- [ ] Quiet hours respected
- [ ] Retry logic handles transient failures
- [ ] Delivery logs captured for debugging
- [ ] Template rendering works correctly
- [ ] Tests passing with >80% coverage
- [ ] Documentation complete

---

## Non-Goals

- Advanced analytics on notification engagement (future)
- A/B testing notification content (future)
- Multi-language support (future - use i18n)
- Rich media in notifications (future)
- In-app notification center (future)

---

## Related Tasks

- Task 0036: Family Engagement Portal UI (completed in #196)
- Task 0068: Family Engagement Data Integration Fixes
- Future: Task for notification analytics dashboard
