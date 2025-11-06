# @care-commons/communication-messaging

**Communication & Messaging Vertical for Care Commons**

Multi-channel messaging, notifications, and team collaboration platform for home care coordination.

## Overview

The Communication & Messaging vertical provides comprehensive communication capabilities for the Care Commons platform, enabling:

- **Multi-Channel Messaging**: Direct messages, group conversations, and broadcast communications
- **Smart Notifications**: Category-based notifications with delivery tracking and read receipts
- **Communication Preferences**: User-configurable channel preferences, quiet hours, and opt-in management
- **Message Templates**: Reusable templates with variable substitution for common communications
- **Delivery Management**: Intelligent routing, scheduling, and retry logic across multiple channels

## Features

### Messaging System

- **Message Threads**: Direct, group, and broadcast thread types
- **Rich Content**: Plain text, Markdown, and HTML formatting support
- **Attachments**: File attachments with size limits and type validation
- **Reactions**: Emoji reactions to messages
- **Read Receipts**: Track message delivery and read status
- **Mentions**: @mention users in conversations
- **Threading**: Reply to specific messages within threads

### Notification System

- **Category-Based**: Visit, schedule, care plan, task, message, incident, reminder, approval, system, and marketing notifications
- **Priority Levels**: Low, normal, high, and urgent priority routing
- **Multi-Channel Delivery**: SMS, email, push, in-app, voice, and video channels
- **Scheduled Delivery**: Schedule notifications for future delivery
- **Expiration**: Auto-expire notifications after a specified time
- **Grouping**: Group related notifications to reduce noise

### Communication Preferences

- **Channel Selection**: Users choose preferred communication channels
- **Quiet Hours**: Configure do-not-disturb periods with timezone support
- **Category Preferences**: Fine-grained control over notification categories
- **Digest Mode**: Batch notifications into daily, weekly, or monthly digests
- **Opt-In Management**: TCPA-compliant opt-in tracking for SMS and marketing

### Message Templates

- **Variable Substitution**: Dynamic content with typed variables
- **Channel Versions**: Different versions optimized for each channel
- **Usage Tracking**: Monitor template usage and effectiveness
- **Localization**: Multi-language template support

## Architecture

### Types

Core domain types in `src/types/communication.ts`:

- `MessageThread`: Conversation container with participants
- `Message`: Individual message with delivery tracking
- `Notification`: Single notification to a recipient
- `CommunicationPreferences`: User communication settings
- `MessageTemplate`: Reusable message template
- `BroadcastMessage`: One-to-many communications

### Repositories

Data access layer:

- `MessageThreadRepository`: Thread CRUD and queries
- `MessageRepository`: Message storage and retrieval
- `NotificationRepository`: Notification management
- `MessageTemplateRepository`: Template storage
- `CommunicationPreferencesRepository`: User preferences

### Services

Business logic layer:

- `MessagingService`: Thread and message management
- `NotificationService`: Notification sending and delivery

### Validation

Zod schemas for input validation:

- `CreateThreadInputSchema`
- `SendMessageInputSchema`
- `SendNotificationInputSchema`
- `UpdatePreferencesInputSchema`
- `CreateTemplateInputSchema`

## Usage

### Creating a Message Thread

```typescript
import { MessagingService, CreateThreadInput } from '@care-commons/communication-messaging';

const input: CreateThreadInput = {
  organizationId: 'org-123',
  branchId: 'branch-456',
  threadType: 'GROUP',
  subject: 'Client Care Coordination',
  participantIds: ['user-1', 'user-2', 'user-3'],
  relatedEntityType: 'CLIENT',
  relatedEntityId: 'client-789',
};

const thread = await messagingService.createThread(input, userContext);
```

### Sending a Message

```typescript
import { SendMessageInput } from '@care-commons/communication-messaging';

const input: SendMessageInput = {
  threadId: thread.id,
  senderId: userContext.userId,
  content: 'Visit completed successfully. Client is doing well.',
  priority: 'NORMAL',
  channels: ['IN_APP', 'EMAIL'],
};

const message = await messagingService.sendMessage(input, userContext);
```

### Sending a Notification

```typescript
import { SendNotificationInput } from '@care-commons/communication-messaging';

const input: SendNotificationInput = {
  organizationId: 'org-123',
  recipientId: 'user-456',
  recipientType: 'FAMILY',
  category: 'VISIT',
  priority: 'NORMAL',
  title: 'Visit Completed',
  message: 'Caregiver Jane has completed the visit for your loved one.',
  channels: ['EMAIL', 'SMS', 'PUSH'],
  relatedEntityType: 'VISIT',
  relatedEntityId: 'visit-789',
};

const notification = await notificationService.sendNotification(input, userContext);
```

### Managing User Preferences

```typescript
import { UpdatePreferencesInput } from '@care-commons/communication-messaging';

const input: UpdatePreferencesInput = {
  userId: 'user-123',
  preferredChannel: 'EMAIL',
  enabledChannels: ['EMAIL', 'IN_APP', 'SMS'],
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  quietHoursTimezone: 'America/New_York',
};

const preferences = await preferencesRepository.update(
  existingPrefs.id,
  input,
  userContext
);
```

## API Endpoints

### Messaging Endpoints

- `POST /api/messaging/threads` - Create new thread
- `GET /api/messaging/threads/:threadId` - Get thread with messages
- `POST /api/messaging/threads/:threadId/messages` - Send message
- `GET /api/messaging/inbox` - Get user inbox summary
- `POST /api/messaging/messages/:messageId/read` - Mark message as read
- `POST /api/messaging/threads/:threadId/read` - Mark all messages in thread as read
- `POST /api/messaging/messages/:messageId/reactions` - Add reaction
- `POST /api/messaging/threads/:threadId/lock` - Lock thread
- `POST /api/messaging/threads/:threadId/archive` - Archive thread

### Notification Endpoints

- `POST /api/notifications` - Send notification
- `GET /api/notifications` - Get notifications for user
- `POST /api/notifications/:notificationId/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read
- `POST /api/notifications/:notificationId/dismiss` - Dismiss notification
- `GET /api/notifications/unread-count` - Get unread count

## Database Schema

The vertical requires the following database tables:

- `message_threads`: Conversation containers
- `messages`: Individual messages
- `notifications`: Notification records
- `message_templates`: Reusable templates
- `communication_preferences`: User preferences
- `broadcast_messages`: Broadcast campaigns
- `message_deliveries`: Delivery tracking

## Channel Integration

### SMS (Twilio)

Configure SMS delivery through Twilio:

```typescript
const channel: CommunicationChannel = {
  channelType: 'SMS',
  providerName: 'Twilio',
  providerConfig: {
    accountSid: 'AC...',
    authToken: '...',
    fromNumber: '+1234567890',
  },
};
```

### Email (SendGrid)

Configure email delivery through SendGrid:

```typescript
const channel: CommunicationChannel = {
  channelType: 'EMAIL',
  providerName: 'SendGrid',
  providerConfig: {
    apiKey: 'SG...',
    fromEmail: 'noreply@carecommons.com',
    fromName: 'Care Commons',
  },
};
```

### Push Notifications (AWS SNS)

Configure push notifications through AWS SNS:

```typescript
const channel: CommunicationChannel = {
  channelType: 'PUSH',
  providerName: 'AWS SNS',
  providerConfig: {
    accessKeyId: 'AKIA...',
    secretAccessKey: '...',
    region: 'us-east-1',
    platformApplicationArn: 'arn:aws:sns:...',
  },
};
```

## Compliance

### TCPA Compliance (SMS)

- Explicit opt-in required before sending SMS
- Opt-out keywords (STOP, UNSUBSCRIBE) automatically processed
- Quiet hours enforcement (9 PM - 8 AM local time)
- Message rate limiting

### CAN-SPAM Compliance (Email)

- Unsubscribe links in all marketing emails
- Physical address in email footer
- Accurate subject lines and headers
- Opt-out processing within 10 business days

### HIPAA Compliance

- Encrypted message storage
- Access logging and audit trails
- PHI filtering for external channels (SMS, email)
- Secure channel configuration

## Background Jobs

### Scheduled Message Processing

Process scheduled messages and notifications:

```typescript
// Run every minute
await messagingService.processScheduledMessages();
await notificationService.processScheduled();
```

### Delivery Retry

Retry failed deliveries with exponential backoff:

```typescript
// Run every 5 minutes
await deliveryService.retryFailedDeliveries();
```

### Notification Cleanup

Remove expired notifications:

```typescript
// Run daily
const deletedCount = await notificationService.cleanupExpired();
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## License

Private - Care Commons Platform

## Support

For questions and support, contact the Care Commons development team.
