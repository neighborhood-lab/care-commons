# Family Engagement & Transparency

**Status**: 🚧 Backend In Progress | 📝 Testing Needed | 🎯 Part 5 Implementation

---

> Enable families to stay informed and engaged in their loved ones' care through transparent communication, progress updates, and secure portal access.

The **Family Engagement & Transparency** vertical provides comprehensive functionality for connecting families with care teams, sharing progress updates in plain language, and facilitating two-way communication between coordinators, caregivers, and family members.

## Features

### Core Functionality

- **Authorized Family Contacts** - Manage family members with role-based portal access
- **Family Progress Summaries** - Plain-language updates tailored for families
- **Family Notifications** - Multi-channel notification delivery (email, SMS, push, portal)
- **Care Team Messaging** - Internal communication between coordinators and caregivers
- **Consent Management** - Track authorization and consent documents
- **Access Control** - Fine-grained permissions and access levels
- **Portal Authentication** - Secure access via unique access codes

### Family Contact Management

- **Multiple Contact Roles** - VIEW_ONLY, RECEIVE_UPDATES, CARE_COORDINATOR, EMERGENCY_CONTACT
- **Access Levels** - BASIC, STANDARD, FULL information visibility
- **Legal Guardian Tracking** - Designate and track legal guardians
- **Contact Preferences** - Email, SMS, and push notification preferences
- **Portal Access Codes** - Unique, expiring codes for secure portal login
- **Relationship Types** - Parent, spouse, guardian, healthcare proxy, etc.
- **Permission Granularity** - Control access to specific information types

### Family Progress Summaries

- **Multiple Summary Types** - Daily, weekly, monthly, incident, milestone updates
- **Plain Language Content** - Non-clinical summaries for family comprehension
- **Progress Indicators** - Engagement scores, wellbeing scores, goal updates
- **Health Observations** - General health and mood observations (non-clinical)
- **Safety Notes** - Important safety updates and concerns
- **Multimedia Support** - Photos and attachments (with consent)
- **Review Workflow** - Coordinator review before family delivery
- **Read Tracking** - Monitor which family members have viewed updates

### Family Notifications

- **Multi-Channel Delivery** - Email, SMS, push notifications, and in-portal
- **Notification Categories** - Progress, schedule, care plan, communication, alerts
- **Priority Levels** - LOW, NORMAL, HIGH, URGENT
- **Delivery Tracking** - Comprehensive tracking per channel
- **Retry Logic** - Automatic retry for failed deliveries
- **Notification Preferences** - Per-contact preferences and quiet hours
- **Read Receipts** - Track when notifications are opened and read
- **Deep Links** - Direct links to relevant portal content

### Care Team Messaging

- **Direct Messages** - One-to-one or group messaging
- **Threaded Conversations** - Organized message threads
- **Client Context** - Messages linked to specific clients
- **Message Categories** - Schedule, care plan, incident, questions, general
- **Attachments** - File attachments with messages
- **Read Status** - Per-recipient read tracking
- **Urgent Flags** - Mark messages as urgent
- **Search & Filter** - Find messages by keyword, category, or date

## Data Model

### Authorized Family Contact

The primary entity for managing family member access:

```typescript
interface AuthorizedFamilyContact {
  // Identity
  id: string;
  clientId: string;
  organizationId: string;

  // Contact information
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  relationship: string;

  // Access control
  role: FamilyContactRole;
  permissions: FamilyContactPermissions;
  accessLevel: AccessLevel;

  // Portal access
  accessCode?: string;
  accessCodeExpiresAt?: Date;
  portalAccessEnabled: boolean;
  lastPortalAccessAt?: Date;

  // Consent
  isLegalGuardian: boolean;
  consentGiven: boolean;
  consentDate?: Date;
  consentMethod?: ConsentMethod;
  consentDocuments?: ConsentDocument[];

  // Communication preferences
  notifyByEmail: boolean;
  notifyBySms: boolean;
  notifyByPush: boolean;
  notificationPreferences?: FamilyNotificationPreferences;

  // Status & audit
  status: FamilyContactStatus;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

### Family Progress Summary

Plain-language updates for families:

```typescript
interface FamilyProgressSummary {
  // Identity
  id: string;
  clientId: string;
  carePlanId?: string;

  // Summary details
  summaryType: SummaryType;
  summaryDate: Date;
  title: string;
  summary: string;
  highlights?: string;
  areasOfFocus?: string;

  // Progress indicators
  goalUpdates?: GoalUpdate[];
  overallStatus?: OverallStatus;
  engagementScore?: number; // 1-10
  wellbeingScore?: number;  // 1-10

  // Health & safety
  healthObservations?: HealthObservation[];
  safetyNotes?: SafetyNote[];
  moodBehavior?: MoodBehaviorObservation[];

  // Care team insights
  caregiverNotes?: string;
  coordinatorNotes?: string;
  recommendations?: string[];

  // Multimedia
  photos?: PhotoAttachment[];
  attachments?: DocumentAttachment[];

  // Visibility & delivery
  visibleToFamily: boolean;
  deliveryStatus: SummaryDeliveryStatus;
  sentAt?: Date;
  readBy?: ReadStatus[];
}
```

### Family Notification

Multi-channel notification delivery:

```typescript
interface FamilyNotification {
  // Identity & targeting
  id: string;
  familyContactId: string;
  clientId: string;

  // Notification details
  notificationType: string;
  category: NotificationCategory;
  priority: NotificationPriority;

  // Content
  title: string;
  message: string;
  summary?: string; // For SMS/push

  // Channels
  sendEmail: boolean;
  sendSms: boolean;
  sendPush: boolean;
  showInPortal: boolean;

  // Delivery tracking
  status: NotificationStatus;
  emailStatus?: ChannelStatus;
  smsStatus?: ChannelStatus;
  pushStatus?: ChannelStatus;

  // Read tracking
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
}
```

### Care Team Message

Internal team communication:

```typescript
interface CareTeamMessage {
  // Identity
  id: string;
  organizationId: string;
  clientId?: string;

  // Thread management
  threadId?: string;
  parentMessageId?: string;

  // Participants
  senderId: string;
  senderType: SenderType;
  recipients: MessageRecipient[];

  // Content
  subject?: string;
  message: string;
  messageType: MessageType;
  category?: MessageCategory;
  priority: MessagePriority;

  // Attachments
  attachments?: MessageAttachment[];
  hasAttachments: boolean;

  // Status & tracking
  deliveryStatus?: RecipientDeliveryStatus[];
  readStatus?: RecipientReadStatus[];
  allRead: boolean;

  // Flags
  isUrgent: boolean;
  requiresResponse: boolean;
  isPinned: boolean;
}
```

## Getting Started

### Prerequisites

- Node.js 22+ and npm
- PostgreSQL 14+ running locally
- All migrations applied: `npm run db:migrate`

### Backend Setup

```bash
# 1. Install dependencies from root
npm install

# 2. Apply the family engagement migration
npm run db:migrate

# 3. Build the vertical
cd verticals/family-engagement-transparency
npm run build

# 4. Run type checking
npm run typecheck

# 5. Run linter
npm run lint
```

### Database Migration

The migration `20251105000000_family_engagement_transparency.ts` creates four tables:

1. **authorized_family_contacts** - Family member access management
2. **family_progress_summaries** - Plain-language updates for families
3. **family_notifications** - Multi-channel notification tracking
4. **care_team_messages** - Internal team communication

### Testing the API

```bash
# Start the API server (from project root)
npm run dev:server

# Create a family contact
curl -X POST http://localhost:3000/api/family-contacts \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-123" \
  -H "X-Organization-Id: org-456" \
  -d '{
    "clientId": "client-789",
    "organizationId": "org-456",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "phone": "555-0123",
    "relationship": "SPOUSE",
    "role": "CARE_COORDINATOR",
    "isLegalGuardian": true,
    "consentGiven": true,
    "generateAccessCode": true
  }'

# Get family contacts for a client
curl http://localhost:3000/api/family-contacts/client/client-789 \
  -H "X-User-Id: user-123" \
  -H "X-Organization-Id: org-456"
```

## Usage

### Creating a Family Contact

```typescript
import { FamilyPortalService } from '@care-commons/family-engagement-transparency';
import { Database } from '@care-commons/core';

const db = new Database(config);
const service = new FamilyPortalService(db);

const contact = await service.createFamilyContact({
  clientId: 'client-123',
  organizationId: 'org-456',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@example.com',
  phone: '555-0123',
  relationship: 'SPOUSE',
  role: 'CARE_COORDINATOR',
  accessLevel: 'FULL',
  isLegalGuardian: true,
  consentGiven: true,
  generateAccessCode: true,
  notifyByEmail: true,
  notifyBySms: true,
}, userContext);

console.log(`Created contact with access code: ${contact.accessCode}`);
```

### Searching Family Contacts

```typescript
const results = await service.searchFamilyContacts({
  organizationId: 'org-456',
  status: ['ACTIVE'],
  role: ['CARE_COORDINATOR', 'EMERGENCY_CONTACT'],
  isLegalGuardian: true,
}, {
  page: 1,
  limit: 20,
  sortBy: 'last_name',
  sortOrder: 'asc',
}, userContext);

console.log(`Found ${results.pagination.total} contacts`);
```

### Authenticating with Access Code

```typescript
const contact = await service.authenticateWithAccessCode('ABC123XYZ789');

if (contact) {
  console.log(`Authenticated: ${contact.firstName} ${contact.lastName}`);
  await service.recordPortalAccess(contact.id, userContext);
}
```

## Database Schema

### Key Tables

#### authorized_family_contacts

Stores family member information and access control:

- **Contact Info** - Name, email, phone, relationship
- **Access Control** - Role, permissions (JSONB), access level
- **Portal Access** - Access code, expiration, last access timestamp
- **Consent** - Legal guardian flag, consent status, documents (JSONB)
- **Preferences** - Notification preferences (JSONB), channel flags

**Key Indexes:**
- Client ID + Status
- Email (for active contacts)
- Access code (for portal login)
- Legal guardian flag

#### family_progress_summaries

Stores plain-language updates for families:

- **Summary Details** - Type, date, title, content
- **Progress** - Goal updates (JSONB), scores, activities (JSONB)
- **Health & Safety** - Observations (JSONB), safety notes (JSONB), mood/behavior (JSONB)
- **Multimedia** - Photos (JSONB), attachments (JSONB)
- **Delivery** - Status, sent timestamp, read tracking (JSONB)

**Key Indexes:**
- Client ID + Date (for timeline)
- Summary type
- Visible to family flag
- Delivery status
- Full-text search on content

#### family_notifications

Tracks multi-channel notification delivery:

- **Notification Details** - Type, category, priority, content
- **Channels** - Email, SMS, push flags and status
- **Delivery Tracking** - Per-channel status, timestamps, message IDs
- **Related Entities** - Link to summaries, visits, messages, etc.
- **Retry Logic** - Retry count, next retry timestamp

**Key Indexes:**
- Family contact ID + Date
- Status + Scheduled time
- Pending notifications
- Failed notifications (for retry)
- Unread notifications
- Priority + Status

#### care_team_messages

Internal team communication:

- **Thread Management** - Thread ID, parent message ID, depth
- **Participants** - Sender, recipients (JSONB), CC (JSONB)
- **Content** - Subject, message, category, priority
- **Attachments** - Files (JSONB), has attachments flag
- **Tracking** - Delivery status (JSONB), read status (JSONB)
- **Flags** - Urgent, requires response, pinned

**Key Indexes:**
- Organization ID + Date
- Thread ID
- Sender ID
- Recipients (GIN index on JSONB)
- Unread messages
- Urgent messages
- Full-text search on subject and message

## Permissions

The vertical implements fine-grained permissions:

- **family-contacts:create** - Create new family contacts
- **family-contacts:read** - View family contact details
- **family-contacts:update** - Modify family contacts
- **family-contacts:delete** - Deactivate family contacts
- **family-summaries:create** - Create progress summaries
- **family-summaries:read** - View summaries
- **family-summaries:update** - Edit summaries
- **family-summaries:approve** - Approve summaries for delivery
- **family-notifications:send** - Send notifications
- **family-notifications:read** - View notification history
- **care-messages:create** - Send messages
- **care-messages:read** - View messages
- **care-messages:read-all** - View all organization messages

## Integration Points

This vertical integrates with:

- **Client Demographics** - Link family contacts to clients
- **Care Plans & Tasks** - Generate summaries from care plans and progress notes
- **Scheduling & Visits** - Notify families of schedule changes
- **Mobile Support** - Push notifications to family mobile devices
- **User Management** - Portal user accounts for family members
- **Document Management** - Store consent forms and attachments

## Compliance Features

- **HIPAA Compliance** - Secure storage, access controls, audit trails
- **Consent Tracking** - Electronic consent with multiple methods
- **Access Audit Logs** - Track all family portal access
- **Minimum Necessary** - Role-based access to appropriate information
- **Data Encryption** - Sensitive data encrypted at rest and in transit
- **Retention Policies** - Configurable retention for messages and notifications
- **Right to Access** - Families can access their loved one's information
- **Communication Records** - Complete audit trail of all communications

## Best Practices

1. **Always obtain consent** - Verify legal authority before granting access
2. **Use appropriate access levels** - Match access level to relationship
3. **Plain language** - Write summaries in clear, non-clinical terms
4. **Regular updates** - Send consistent updates (weekly minimum)
5. **Respect preferences** - Honor notification preferences and quiet hours
6. **Secure access codes** - Use expiring access codes, regenerate periodically
7. **Monitor engagement** - Track which families are engaged
8. **Review before sending** - Have coordinators review summaries
9. **Include multimedia** - Use photos to enhance engagement (with consent)
10. **Respond promptly** - Reply to family messages within 24 hours

## Security Considerations

- **Access Codes** - Generate strong, unique, expiring codes
- **Email Verification** - Verify email addresses before granting access
- **Two-Factor Auth** - Consider 2FA for sensitive access levels
- **Session Management** - Implement secure session timeouts
- **Rate Limiting** - Limit authentication attempts
- **Audit Logging** - Log all access and modifications
- **Data Minimization** - Only expose necessary information
- **Consent Validation** - Regularly review and update consent

## Future Enhancements

- [ ] Family mobile app with native push notifications
- [ ] Video messages from care team to families
- [ ] Two-way photo sharing with consent workflow
- [ ] Automated summary generation from progress notes
- [ ] AI-powered plain-language translation
- [ ] Family satisfaction surveys
- [ ] Virtual visit scheduling for families
- [ ] Multi-language support for diverse families
- [ ] Voice messages for families with limited digital literacy
- [ ] Integration with family calendar apps
- [ ] Predictive engagement scoring
- [ ] Family education content library

## Support

For questions or issues with the Family Engagement & Transparency vertical:

- Open an issue on GitHub
- Check the [documentation](https://docs.care-commons.org)
- Join our community discussions

---

**Care Commons** - Shared care software, community owned
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
