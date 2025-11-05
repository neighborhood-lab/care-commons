# Family Engagement Platform - Transparency & Communication

> **Status**: ✅ Backend Complete | 🚧 Frontend Pending | 📝 Testing Needed

---

## Overview

The **Family Engagement Platform** vertical enables transparent, real-time communication between care providers and family members. It provides family members with secure portal access to view care updates, receive notifications, track progress, and communicate with the care team.

This vertical focuses on building trust and partnership with families through proactive transparency and open communication channels.

## Key Features

### 🔐 Secure Portal Access
- **Role-based access control** - Granular permissions based on relationship and authorization
- **Invitation system** - Secure onboarding with email/SMS invitations
- **Multi-level access** - Basic, detailed, medical, financial, and full access levels
- **Consent management** - HIPAA-compliant authorization tracking
- **Access expiration** - Time-limited access for temporary guardians or advocates

### 📬 Notifications & Alerts
- **Multi-channel delivery** - Email, SMS, and push notifications
- **Priority levels** - Low, normal, high, and urgent notifications
- **Category-based** - Visit updates, care plan changes, incidents, appointments, messages
- **User preferences** - Customizable notification settings per family member
- **Quiet hours** - Respect family members' preferred communication times
- **Digest options** - Immediate, daily, or weekly notification summaries

### 📰 Activity Feed
- **Real-time updates** - See care activities as they happen
- **Event tracking** - Visits, tasks, goals, incidents, and more
- **Rich metadata** - Who performed the action, when, and context
- **Read status** - Track which updates have been viewed
- **Filtering** - Filter by activity type, date range, or caregiver

### 💬 Messaging System
- **Threaded conversations** - Organized discussions with care team
- **File attachments** - Share photos, documents, and reports
- **Staff assignment** - Route conversations to appropriate coordinators
- **Read receipts** - Know when messages have been viewed
- **Internal notes** - Staff-only comments not visible to family
- **Priority flagging** - Mark important conversations

### 📊 Transparency Reports
- **Visit summaries** - Family-friendly reports of completed visits
- **Task completion** - See which care tasks were performed
- **Progress reports** - Weekly/monthly care plan progress updates
- **Goal tracking** - Visual progress toward care goals
- **Incident notifications** - Immediate alerts for important events

### 👥 Family Member Management
- **Multiple family members** - Support for multiple authorized contacts
- **Relationship tracking** - Spouse, child, guardian, healthcare proxy, etc.
- **Primary contact** - Designate main point of contact
- **Contact preferences** - Email, phone, SMS, or portal
- **Access audit** - Track who accessed what information and when

## Architecture

### Data Model

```typescript
// Core entities
- FamilyMember         // Portal user with relationship to client
- PortalInvitation     // Secure invitation for portal access
- Notification         // Alert sent to family member
- ActivityFeedItem     // Care event in family timeline
- MessageThread        // Conversation between family and staff
- Message              // Individual message in thread
- VisitSummary         // Family-friendly visit report
- CarePlanProgressReport // Periodic progress summary
- FamilyConsent        // Authorization and consent records
```

### Key Relationships

```
Client
  └── FamilyMember (1:many)
       ├── Notifications (1:many)
       ├── ActivityFeedItems (1:many)
       ├── MessageThreads (1:many)
       ├── VisitSummaries (many:many)
       └── Consents (1:many)

MessageThread
  └── Messages (1:many)

Visit
  └── VisitSummary (1:1)

CarePlan
  └── CarePlanProgressReport (1:many)
```

## Getting Started

### Installation

The family engagement vertical is part of the Care Commons monorepo:

```bash
# Install dependencies
npm install

# Build the vertical
cd verticals/family-engagement
npm run build

# Run tests
npm test
```

### Database Migration

Run the migration to create family engagement tables:

```bash
# From project root
npm run db:migrate

# The migration creates:
# - family_members
# - portal_invitations
# - family_notifications
# - family_activity_feed
# - message_threads
# - messages
# - family_visit_summaries
# - care_plan_progress_reports
# - family_consent
```

### Service Setup

```typescript
import { Database, PermissionService } from '@care-commons/core';
import {
  FamilyMemberRepository,
  NotificationRepository,
  ActivityFeedRepository,
  MessageRepository,
  FamilyEngagementService
} from '@care-commons/family-engagement';

// Initialize repositories
const familyMemberRepo = new FamilyMemberRepository(database);
const notificationRepo = new NotificationRepository(database);
const activityFeedRepo = new ActivityFeedRepository(database);
const messageRepo = new MessageRepository(database);

// Initialize service
const familyEngagementService = new FamilyEngagementService(
  familyMemberRepo,
  notificationRepo,
  activityFeedRepo,
  messageRepo,
  permissionService
);
```

### API Routes

```typescript
import { Router } from 'express';
import { createFamilyEngagementHandlers } from '@care-commons/family-engagement';

const router = Router();
const handlers = createFamilyEngagementHandlers(familyEngagementService);

// Family member management
router.post('/family-members/invite', handlers.inviteFamilyMember);
router.get('/family-members/:id', handlers.getFamilyMemberProfile);
router.get('/family-members/client/:clientId', handlers.getFamilyMembersForClient);
router.patch('/family-members/:id/portal-access', handlers.updatePortalAccess);

// Notifications
router.post('/notifications', handlers.sendNotification);
router.post('/notifications/broadcast', handlers.broadcastNotification);
router.get('/notifications/family-member/:familyMemberId/unread',
  handlers.getUnreadNotifications);
router.patch('/notifications/:id/read', handlers.markNotificationAsRead);

// Activity feed
router.get('/activity-feed/family-member/:familyMemberId',
  handlers.getRecentActivity);
router.post('/activity-feed', handlers.createActivityFeedItem);

// Messaging
router.post('/messages/threads', handlers.createMessageThread);
router.post('/messages/threads/:threadId/messages', handlers.sendMessage);
router.get('/messages/family-member/:familyMemberId/threads',
  handlers.getThreadsForFamilyMember);
router.get('/messages/threads/:threadId/messages',
  handlers.getMessagesInThread);

// Dashboard
router.get('/dashboard/family-member/:familyMemberId',
  handlers.getFamilyDashboard);

// Care events
router.post('/events/notify', handlers.notifyFamilyOfCareEvent);
```

## Usage Examples

### 1. Invite Family Member to Portal

```typescript
const familyMember = await familyEngagementService.inviteFamilyMember(
  {
    clientId: 'client-123',
    relationship: 'CHILD',
    relationshipNote: 'Primary caregiver for mother',
    isPrimaryContact: true,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1-555-0123',
    portalAccessLevel: 'VIEW_DETAILED',
    accessExpiresAt: null, // No expiration
    notificationPreferences: {
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: false,
      visitReminders: true,
      visitCompletedUpdates: true,
      careplanUpdates: true,
      incidentAlerts: true,
      appointmentReminders: true,
      messageNotifications: true,
      digestFrequency: 'IMMEDIATE'
    }
  },
  userContext
);
```

### 2. Send Notification After Visit Completion

```typescript
// Automatically notify family when visit is completed
await familyEngagementService.notifyFamilyOfCareEvent(
  clientId,
  'VISIT_COMPLETED',
  {
    title: 'Visit Completed',
    message: 'Sarah Smith completed a 2-hour visit with your mother. All scheduled tasks were completed successfully.',
    relatedEntityType: 'VISIT',
    relatedEntityId: visitId,
    performedBy: caregiverId,
    performedByName: 'Sarah Smith'
  },
  userContext
);
```

### 3. Create Message Thread

```typescript
const thread = await familyEngagementService.createMessageThread(
  {
    familyMemberId: 'family-member-123',
    clientId: 'client-123',
    subject: 'Question about medication schedule',
    initialMessage: 'I noticed the medication times have changed. Can you explain the new schedule?',
    priority: 'NORMAL',
    assignedToUserId: coordinatorId
  },
  userContext
);
```

### 4. Broadcast Important Update

```typescript
// Send notification to all family members
await familyEngagementService.broadcastNotification(
  clientId,
  {
    category: 'CARE_PLAN',
    priority: 'HIGH',
    title: 'Care Plan Updated',
    message: 'The care plan has been updated with new physical therapy goals. Please review the changes in your portal.',
    actionUrl: '/portal/care-plans/123',
    actionLabel: 'View Care Plan'
  },
  userContext
);
```

### 5. Get Family Dashboard

```typescript
const dashboard = await familyEngagementService.getFamilyDashboard(
  familyMemberId,
  userContext
);

// Returns:
// {
//   client: { id, name, photoUrl },
//   upcomingVisits: [...],
//   recentActivity: [...],
//   unreadNotifications: 3,
//   unreadMessages: 1,
//   activeCarePlan: { id, name, goalsTotal, goalsAchieved }
// }
```

## Access Levels

### VIEW_BASIC
- View client profile (name, photo)
- View upcoming visit schedule
- Receive basic notifications
- View activity feed (high-level)

### VIEW_DETAILED
- All of VIEW_BASIC, plus:
- View care plan goals and interventions
- View task completion details
- View progress notes (family-appropriate)
- Full activity feed access

### VIEW_MEDICAL
- All of VIEW_DETAILED, plus:
- View medical diagnoses
- View medications and vitals
- View physician information
- View incident reports

### VIEW_FINANCIAL
- View billing statements
- View payment history
- View insurance information
- View authorization details

### FULL_ACCESS
- All permissions above
- Can update contact information
- Can grant access to additional family members (with approval)

## Notification Categories

| Category | Description | Default Priority |
|----------|-------------|------------------|
| VISIT | Visit scheduled, started, completed, cancelled | NORMAL |
| CARE_PLAN | Care plan created, updated, goals achieved | NORMAL |
| INCIDENT | Incidents, falls, concerns | HIGH |
| APPOINTMENT | Medical appointments, assessments | NORMAL |
| MESSAGE | New messages from care team | NORMAL |
| REMINDER | Upcoming visits, medication reminders | LOW |
| SYSTEM | Account updates, access changes | NORMAL |

## Integration with Other Verticals

### Scheduling & Visits
```typescript
// After visit completion, create family notification
await familyEngagementService.notifyFamilyOfCareEvent(
  clientId,
  'VISIT_COMPLETED',
  visitSummaryData,
  userContext
);
```

### Care Plans & Tasks
```typescript
// When goal is achieved
await familyEngagementService.notifyFamilyOfCareEvent(
  clientId,
  'GOAL_ACHIEVED',
  {
    title: 'Care Goal Achieved!',
    message: 'Your mother has successfully achieved her mobility goal.',
    relatedEntityType: 'GOAL',
    relatedEntityId: goalId
  },
  userContext
);
```

### Incident Reporting
```typescript
// Immediate notification for incidents
await familyEngagementService.sendNotification(
  {
    familyMemberId,
    clientId,
    category: 'INCIDENT',
    priority: 'URGENT',
    title: 'Incident Report',
    message: 'An incident has been reported. Please contact the care coordinator.',
    relatedEntityType: 'INCIDENT',
    relatedEntityId: incidentId
  },
  userContext
);
```

## Security & Privacy

### HIPAA Compliance
- **Consent tracking** - All information sharing requires documented consent
- **Access audit logs** - Track all family member access to PHI
- **Minimum necessary** - Access levels enforce minimum necessary access
- **Secure communications** - All messages and notifications encrypted in transit

### Authentication
- **Portal invitations** - Secure, time-limited invitation codes
- **Password requirements** - Strong password policies
- **Session management** - Automatic logout after inactivity
- **2FA support** - Optional two-factor authentication

### Authorization
- **Relationship verification** - Verify family relationships before granting access
- **Client consent** - Client (or guardian) must approve family portal access
- **Revocable access** - Access can be revoked at any time
- **Expiring access** - Support for time-limited access (e.g., temporary guardians)

## Permissions

Required permissions for family engagement operations:

| Operation | Permission | Roles |
|-----------|------------|-------|
| Invite family member | `family-portal:invite` | ADMIN, COORDINATOR |
| View family profiles | `family-portal:view` | ADMIN, COORDINATOR, CAREGIVER |
| Manage portal access | `family-portal:manage` | ADMIN, COORDINATOR |
| Send notifications | `notifications:send` | ADMIN, COORDINATOR, CAREGIVER |
| Broadcast notifications | `notifications:broadcast` | ADMIN, COORDINATOR |
| View notifications | `notifications:view` | ALL |
| View activity feed | `activity-feed:view` | ALL |
| Create messages | `messages:create` | ALL |
| Send messages | `messages:send` | ALL |
| View messages | `messages:view` | ALL |

## Best Practices

### Family Onboarding
1. **Verify relationship** - Confirm family member's relationship to client
2. **Obtain consent** - Get signed consent from client or legal guardian
3. **Set appropriate access** - Choose access level based on relationship and consent
4. **Send clear invitation** - Provide helpful onboarding materials
5. **Follow up** - Check that family member successfully activated portal

### Communication
1. **Be proactive** - Notify family of important events immediately
2. **Use appropriate tone** - Keep messages family-friendly and empathetic
3. **Provide context** - Include relevant details to avoid confusion
4. **Respond promptly** - Reply to family messages within 24 hours
5. **Escalate when needed** - Flag urgent concerns for immediate attention

### Privacy
1. **Respect preferences** - Honor notification and communication preferences
2. **Use access levels** - Grant minimum necessary access
3. **Regular audits** - Review family access periodically
4. **Secure messaging** - Never include PHI in email or SMS notifications
5. **Document everything** - Maintain audit trail of all access and communications

## Development Status

### ✅ Completed (Part 4)
- [x] TypeScript type definitions
- [x] Database schema and migrations
- [x] Repository layer (data access)
- [x] Service layer (business logic)
- [x] API handlers and routes
- [x] Notification system foundation
- [x] Activity feed system
- [x] Messaging system
- [x] Dashboard aggregation

### 🚧 In Progress
- [ ] Frontend React components
- [ ] Portal registration flow
- [ ] Email/SMS notification delivery
- [ ] Push notification service
- [ ] File attachment handling

### 📋 Planned
- [ ] Mobile app support
- [ ] Video calling integration
- [ ] Photo/video sharing
- [ ] Calendar integration
- [ ] Appointment scheduling
- [ ] Survey/feedback system
- [ ] Multi-language support
- [ ] Accessibility (WCAG 2.1 AA)

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- family-engagement-service.test.ts
```

## API Documentation

For detailed API endpoint documentation, see:
- [API Reference](./API_REFERENCE.md) _(coming soon)_
- [Integration Guide](./INTEGRATION_GUIDE.md) _(coming soon)_

## Contributing

When contributing to the family engagement vertical:

1. **Maintain privacy** - Always consider PHI and privacy implications
2. **Test thoroughly** - Family features require extra care and testing
3. **Document changes** - Update this README for any new features
4. **Follow patterns** - Maintain consistency with other verticals
5. **Get feedback** - Have changes reviewed by care coordinators

## Support

For questions or issues with the family engagement vertical:

- **GitHub Issues**: [Report bugs or request features](https://github.com/neighborhood-lab/care-commons/issues)
- **Discord**: Join our community for support
- **Documentation**: Check the main Care Commons docs

## License

This vertical is part of Care Commons and is licensed under the same license. See [LICENSE](../../LICENSE) for details.

---

**Care Commons** is brought to you by [Neighborhood Lab](https://neighborhoodlab.org) 🏡

*Building trust through transparency and communication.*
