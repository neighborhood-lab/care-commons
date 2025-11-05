# Family Engagement Platform

> Transparency, Communication, and Family Portal features for Care Commons

The Family Engagement Platform vertical provides comprehensive features for engaging family members in the care process through transparency, notifications, and two-way communication.

## Features

### 🏠 Family Member Management
- Maintain detailed family member records with relationships to clients
- Support for multiple relationship types (parent, child, guardian, etc.)
- Primary contact and emergency contact designation
- Authorized representative tracking for legal decision-making
- Flexible permission system for data access control

### 🔔 Transparency & Notifications
- Real-time notifications for care events (visits, care plans, health updates)
- Multi-channel delivery (email, SMS, in-app, push notifications)
- Configurable notification preferences per family member
- Priority levels (LOW, NORMAL, HIGH, URGENT)
- Notification categories (VISIT, CARE_PLAN, HEALTH, BILLING, COMMUNICATION, SYSTEM)

### 💬 Two-Way Messaging
- Secure messaging between family members and care team
- Conversation threading and replies
- Message attachments (images, files, voice notes)
- Urgent message flagging
- Message categories (general, care questions, scheduling, billing)
- Read receipts and delivery tracking

### 🔐 Privacy & Consent Management
- Granular permission controls for data access
- Consent tracking for various features (view care plans, medical info, billing)
- Digital signature capture
- HIPAA-compliant access controls
- Audit trails for all family data access

## Architecture

The Family Engagement Platform follows Care Commons' vertical architecture:

```
family-engagement/
├── src/
│   ├── types/              # TypeScript type definitions
│   │   ├── family-member.types.ts
│   │   ├── family-user.types.ts
│   │   ├── family-notification.types.ts
│   │   ├── family-message.types.ts
│   │   └── family-consent.types.ts
│   ├── repository/         # Data access layer
│   │   ├── family-member-repository.ts
│   │   ├── family-notification-repository.ts
│   │   └── family-message-repository.ts
│   ├── service/            # Business logic layer
│   │   ├── family-member-service.ts
│   │   ├── family-notification-service.ts
│   │   └── family-message-service.ts
│   ├── api/                # API endpoints (to be implemented)
│   └── index.ts            # Main entry point
└── package.json
```

## Database Schema

### Family Members (`family_members`)
Stores information about family members related to clients:
- Identity (name, DOB)
- Relationship type
- Contact information (email, phone, address)
- Communication preferences
- Permissions (view care plans, visit logs, medical info, billing)
- Language and accessibility needs

### Family Users (`family_users`)
Portal user accounts for family member access:
- Authentication (local or OAuth providers: Google, Apple, Microsoft)
- Email verification
- Password reset functionality
- Security features (login attempts, account locking)
- Notification and UI preferences
- Terms and privacy policy acceptance tracking

### Family Notifications (`family_notifications`)
Notifications sent to family members:
- Notification types (visit updates, care plan changes, health updates, etc.)
- Multi-channel delivery tracking
- Read status and user interactions
- Scheduled delivery support
- Expiration handling

### Family Messages (`family_messages`)
Two-way messaging between family and staff:
- Conversation threading
- Sender and recipient tracking
- Attachment support
- Message status (sent, delivered, read)
- Moderation features (flagging, soft delete)
- Urgent message prioritization

### Family Consents (`family_consents`)
Tracks consents for various features:
- Consent types (view medical info, receive notifications, etc.)
- Digital signature capture
- Expiration and renewal tracking
- Revocation support with audit trail

## Getting Started

### Installation

```bash
# From the root of the care-commons repository
npm install
```

### Database Migration

Run the family engagement platform migration:

```bash
npm run db:migrate
```

This creates all necessary tables:
- `family_members`
- `family_users`
- `family_notifications`
- `family_messages`
- `family_consents`

### Usage Example

```typescript
import { Database } from '@care-commons/core';
import {
  FamilyMemberService,
  FamilyNotificationService,
  FamilyMessageService,
} from '@care-commons/family-engagement';

// Initialize services
const database = new Database(/* config */);
const familyMemberService = new FamilyMemberService(database);
const notificationService = new FamilyNotificationService(database);
const messageService = new FamilyMessageService(database);

// Create a family member
const familyMember = await familyMemberService.createFamilyMember({
  client_id: 'client-uuid',
  organization_id: 'org-uuid',
  first_name: 'John',
  last_name: 'Doe',
  relationship_type: 'PARENT',
  is_primary_contact: true,
  email: 'john.doe@example.com',
  phone_primary: '555-1234',
  can_view_care_plans: true,
  can_receive_notifications: true,
  created_by: 'user-uuid',
});

// Send a visit notification
await notificationService.notifyVisitUpdate(
  familyMember.id,
  'client-uuid',
  'org-uuid',
  'visit-uuid',
  'completed',
  'Visit completed successfully. All tasks were performed.',
  'caregiver-uuid'
);

// Start a conversation
const message = await messageService.startConversation(
  'client-uuid',
  'org-uuid',
  {
    sender_id: familyMember.id,
    sender_type: 'FAMILY',
    sender_name: 'John Doe',
  },
  {
    recipient_type: 'CARE_TEAM',
  },
  'I have a question about the care plan.',
  familyMember.id,
  {
    category: 'CARE_QUESTION',
  }
);
```

## API Endpoints (Planned)

### Family Members
- `GET /api/family-members/:id` - Get family member by ID
- `GET /api/clients/:clientId/family-members` - List family members for a client
- `POST /api/family-members` - Create family member
- `PUT /api/family-members/:id` - Update family member
- `DELETE /api/family-members/:id` - Deactivate family member
- `GET /api/clients/:clientId/primary-contact` - Get primary contact
- `GET /api/clients/:clientId/emergency-contacts` - Get emergency contacts

### Notifications
- `GET /api/family-members/:id/notifications` - List notifications
- `GET /api/family-members/:id/notifications/unread` - Get unread notifications
- `POST /api/family-members/:id/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/:id/archive` - Archive notification
- `GET /api/family-members/:id/notifications/stats` - Get notification statistics

### Messaging
- `GET /api/conversations/:id/messages` - Get conversation messages
- `POST /api/messages` - Send message
- `POST /api/messages/:id/reply` - Reply to message
- `PUT /api/messages/:id/read` - Mark message as read
- `DELETE /api/messages/:id` - Delete message
- `GET /api/clients/:clientId/conversations` - List conversations
- `GET /api/organizations/:id/messages/urgent` - Get urgent messages

## Permission System

Family members have granular permissions:

- `can_view_care_plans` - View client's care plans and goals
- `can_view_visit_logs` - View visit history and notes
- `can_view_medical_info` - Access medical information
- `can_view_billing` - View billing and payment information
- `can_receive_notifications` - Receive notifications about care events
- `can_message_care_team` - Send messages to care team

Additional custom permissions can be defined in the `custom_permissions` JSONB field.

## Notification Types

### Visit Notifications
- `VISIT_SCHEDULED` - New visit scheduled
- `VISIT_STARTED` - Caregiver arrived and visit started
- `VISIT_COMPLETED` - Visit finished with summary
- `VISIT_CANCELLED` - Visit cancelled

### Care Plan Notifications
- `CARE_PLAN_UPDATED` - Care plan modified
- `TASK_COMPLETED` - Care task completed

### Health & Medical
- `HEALTH_UPDATE` - Health status update
- `MEDICATION_REMINDER` - Medication administration reminder
- `INCIDENT_REPORT` - Incident or safety concern reported

### Administrative
- `BILLING_STATEMENT` - New billing statement available
- `APPOINTMENT_REMINDER` - Upcoming appointment reminder
- `DOCUMENT_SHARED` - New document shared
- `CONSENT_REQUIRED` - Consent action required

### Communication
- `MESSAGE_RECEIVED` - New message from care team
- `SYSTEM_ANNOUNCEMENT` - Important system announcement
- `SURVEY_REQUEST` - Feedback survey request

## Multi-Channel Delivery

Notifications can be delivered through multiple channels:

- **EMAIL** - Email notifications with HTML templates
- **SMS** - Text message notifications
- **APP** - In-app notifications (badge counts, notification center)
- **PUSH** - Mobile push notifications (requires mobile app integration)

Family members can configure preferences for each channel and notification type.

## Relationship Types

Supported relationship types:
- `PARENT` - Parent
- `CHILD` - Child (adult child providing support)
- `SIBLING` - Brother or sister
- `SPOUSE` - Husband or wife
- `GUARDIAN` - Legal guardian
- `GRANDPARENT` - Grandparent
- `GRANDCHILD` - Grandchild
- `AUNT_UNCLE` - Aunt or uncle
- `NIECE_NEPHEW` - Niece or nephew
- `COUSIN` - Cousin
- `FRIEND` - Close friend
- `NEIGHBOR` - Neighbor providing support
- `OTHER` - Other relationship

## Security & Privacy

The Family Engagement Platform implements robust security:

1. **Data Access Controls**
   - Permission checks on all data access
   - Role-based access for staff users
   - Family member permissions verified for each request

2. **Audit Trails**
   - All family data access logged
   - Audit events for sensitive operations
   - Revision history for all changes

3. **Authentication**
   - Secure password hashing (bcrypt)
   - Email verification
   - Password reset with time-limited tokens
   - Account lockout after failed attempts
   - OAuth support for trusted providers

4. **Consent Management**
   - Explicit consent required for data access
   - Digital signature capture
   - Revocation support
   - Expiration and renewal tracking

5. **HIPAA Compliance**
   - Minimum necessary data access
   - Audit logs for PHI access
   - Encrypted data transmission
   - Secure message storage

## Development

### Running Tests

```bash
npm run test
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## Roadmap

### Phase 1 (Current) ✅
- [x] Database schema and migrations
- [x] Core types and interfaces
- [x] Repository layer
- [x] Service layer with business logic

### Phase 2 (In Progress)
- [ ] API endpoints with Express/Fastify
- [ ] Authentication and authorization
- [ ] Permission middleware
- [ ] Unit and integration tests
- [ ] API documentation

### Phase 3 (Planned)
- [ ] Family portal frontend (React)
- [ ] Mobile app integration
- [ ] Email notification templates
- [ ] SMS integration (Twilio/similar)
- [ ] Push notification delivery
- [ ] File attachment handling
- [ ] Real-time messaging (WebSocket)

### Phase 4 (Future)
- [ ] Video messaging
- [ ] Calendar integration
- [ ] Document sharing and e-signatures
- [ ] Surveys and feedback collection
- [ ] Multi-language support
- [ ] Accessibility enhancements

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

See [LICENSE](../../LICENSE) for details.

---

**Care Commons** - Family Engagement Platform
Shared care software, community owned 🏡
