# Family Engagement, Transparency & Communication

> Part 6 of the Care Commons Family Engagement Platform

## Overview

The **Family Engagement, Transparency & Communication** vertical enables family members to actively participate in their loved ones' care journey. It provides a secure portal for viewing care information, communicating with staff, and receiving automated progress updates.

## Key Features

### 👥 Family Member Management
- Family member account creation and management
- Secure authentication integration (Auth0, Cognito, etc.)
- Account activation and lifecycle management
- Customizable portal and communication preferences
- Two-factor authentication support

### 🔗 Relationship Management
- Link family members to clients with relationship types
- Legal authority tracking (POA, Guardian, etc.)
- HIPAA authorization and consent management
- Configurable involvement levels
- Emergency contact designation

### 🔐 Fine-Grained Permissions
- Category-based access control (care, medical, billing, etc.)
- Permission templates for common roles
- Notification preferences per permission category
- Temporary elevated permissions support
- Comprehensive access logging

### 💬 Secure Messaging
- Thread-based conversations between families and staff
- Message read receipts and delivery tracking
- File attachments with virus scanning
- Message moderation and flagging
- SLA tracking for response times
- Email, SMS, and push notification integration

### 📊 Progress Updates
- Automated weekly/monthly care progress reports
- Manual and hybrid (AI + staff) update generation
- Visit summaries and goal progress tracking
- Highlights of achievements and concerns
- Delivery tracking and read receipts

### ⚙️ Transparency Settings
- Organization-level default visibility settings
- Client-specific override capabilities
- Configurable auto-notifications for key events
- Privacy controls and data retention settings
- Custom welcome messages and privacy notices

### 📋 Audit & Compliance
- Comprehensive access logging for all family portal activity
- HIPAA-compliant data handling
- Permission change audit trail
- Message delivery and read tracking
- Legal document verification tracking

## Architecture

### Database Schema

The vertical introduces the following tables:

#### Family & Relationships
- `family_members` - Family member profiles and account information
- `family_client_relationships` - Links families to clients with relationship details
- `family_permissions` - Fine-grained access control permissions
- `family_access_log` - Comprehensive audit trail

#### Communication
- `message_threads` - Conversation groupings
- `messages` - Individual messages
- `message_participants` - Thread participation tracking
- `message_read_receipts` - Read tracking
- `message_attachments` - File attachments

#### Transparency & Updates
- `progress_updates` - Automated and manual care progress reports
- `transparency_settings` - Organization and client-level configuration
- `communication_templates` - Reusable message templates

### Service Layer

```typescript
// Create the service stack
import { createFamilyMemberStack } from '@care-commons/family-engagement-transparency-comms';

const { service, handlers } = createFamilyMemberStack(database);

// Use the service
const familyMember = await service.createFamilyMember(input, context);
```

### Type System

Comprehensive TypeScript types for all entities:

```typescript
import {
  FamilyMember,
  FamilyClientRelationship,
  FamilyPermissions,
  MessageThread,
  ProgressUpdate,
  TransparencySettings,
} from '@care-commons/family-engagement-transparency-comms';
```

## API Endpoints

### Family Members

```
GET    /api/family-members              # List family members
GET    /api/family-members/:id          # Get family member details
GET    /api/family-members/:id/relationships  # Get with relationships
POST   /api/family-members              # Create family member
PATCH  /api/family-members/:id          # Update family member
DELETE /api/family-members/:id          # Delete (soft delete)

POST   /api/family-members/:id/activate # Activate account
POST   /api/family-members/:id/deactivate # Deactivate account
POST   /api/family-members/:id/suspend  # Suspend account
POST   /api/family-members/:id/reactivate # Reactivate account

PATCH  /api/family-members/:id/portal-preferences
PATCH  /api/family-members/:id/communication-preferences
```

### Relationships (Future)

```
POST   /api/relationships               # Create relationship
GET    /api/relationships/:id           # Get relationship details
PATCH  /api/relationships/:id           # Update relationship
DELETE /api/relationships/:id           # Remove relationship
POST   /api/relationships/:id/verify    # Verify legal authority
```

### Permissions (Future)

```
GET    /api/relationships/:id/permissions    # Get permissions
PATCH  /api/relationships/:id/permissions    # Update permissions
POST   /api/permissions/check                # Check permission
POST   /api/permissions/bulk-check           # Bulk permission check
```

### Messaging (Future)

```
GET    /api/threads                     # List threads
POST   /api/threads                     # Create thread
GET    /api/threads/:id                 # Get thread with messages
PATCH  /api/threads/:id                 # Update thread
POST   /api/threads/:id/messages        # Send message
POST   /api/messages/:id/read           # Mark as read
```

### Progress Updates (Future)

```
GET    /api/clients/:id/progress-updates    # List updates
POST   /api/clients/:id/progress-updates    # Create update
GET    /api/progress-updates/:id            # Get update
PATCH  /api/progress-updates/:id            # Update draft
POST   /api/progress-updates/:id/publish    # Publish to families
```

### Transparency Settings (Future)

```
GET    /api/organizations/:id/transparency-settings
PATCH  /api/organizations/:id/transparency-settings
GET    /api/clients/:id/transparency-settings
PATCH  /api/clients/:id/transparency-settings
```

## Permission System

### Permission Categories

1. **Care Information**
   - View care plan
   - View visit schedule
   - View visit notes
   - View progress updates
   - View tasks and goals

2. **Medical Information** (HIPAA-sensitive)
   - View medications
   - View medical history
   - View vital signs
   - View assessments
   - View diagnoses

3. **Billing & Financial**
   - View invoices
   - View payment history
   - Make payments

4. **Communication**
   - Send messages
   - Receive messages
   - View message history
   - Request callbacks

5. **Scheduling**
   - View caregiver info
   - Request schedule changes
   - Cancel visits
   - Rate visits

6. **Documents**
   - View documents
   - Upload documents
   - Sign documents

7. **Incidents**
   - View incident reports
   - Submit concerns

### Permission Templates

Predefined templates for common roles:

- **FULL_ACCESS** - Complete access (primary caregivers)
- **OBSERVER** - Read-only basic information
- **PRIMARY_CAREGIVER** - Full care and scheduling access
- **BILLING_CONTACT** - Billing and payments only
- **EMERGENCY_CONTACT** - Minimal access, notifications only
- **LEGAL_REPRESENTATIVE** - Full access with legal authority

## Notification System

Family members can be notified about:

- Visit start and end
- Missed visits
- Schedule changes
- Care plan updates
- New messages
- Medication changes
- Incidents
- Progress updates

Notification methods:
- In-app notifications
- Email
- SMS
- Push notifications (mobile app)

Notification frequency options:
- Immediate
- Hourly digest
- Daily digest
- Weekly summary

## Transparency Levels

Organizations can configure default transparency levels:

### High Transparency
- Families see real-time visit updates
- Full access to visit notes and care plans
- Automated progress reports
- Direct messaging with caregivers

### Moderate Transparency
- Scheduled progress updates
- Basic visit schedule visibility
- Filtered visit notes (staff notes hidden)
- Messaging through care coordinators

### Low Transparency
- Monthly summary reports only
- Limited visit information
- No direct messaging
- Families must call for updates

### Custom
- Mix and match specific permissions
- Client-specific overrides
- Role-based access control

## Security & Compliance

### HIPAA Compliance
- Explicit HIPAA authorization required
- Granular authorization scopes
- Consent document tracking
- Access logging for PHI

### Authentication
- Integration with external auth systems (Auth0, Cognito)
- Two-factor authentication support
- Session management
- Password policies

### Audit Trail
- All family portal access logged
- Permission changes tracked
- Message delivery and reads tracked
- Legal document verification logged

### Data Retention
- Configurable message retention
- Access log retention
- Automatic archival
- Soft delete support

## Usage Examples

### Create Family Member and Relationship

```typescript
import { FamilyMemberService, RelationshipService } from '@care-commons/family-engagement';

// Create family member
const familyMember = await familyMemberService.createFamilyMember({
  organizationId: 'org-123',
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah.johnson@email.com',
  preferredContactMethod: 'EMAIL',
  primaryPhone: {
    number: '555-0123',
    type: 'MOBILE',
  },
}, context);

// Create relationship to client
const relationship = await relationshipService.createRelationship({
  organizationId: 'org-123',
  familyMemberId: familyMember.id,
  clientId: 'client-456',
  relationshipType: 'CHILD',
  isPrimaryContact: true,
  hipaaAuthorized: true,
  hipaaAuthorizationDate: new Date(),
  involvementLevel: 'ACTIVE',
}, context);

// Set permissions using template
await permissionService.createPermissions({
  relationshipId: relationship.id,
  template: 'PRIMARY_CAREGIVER',
}, context);
```

### Send Message to Family

```typescript
// Create thread
const thread = await messageService.createThread({
  organizationId: 'org-123',
  clientId: 'client-456',
  subject: 'Weekly Visit Update',
  threadType: 'CARE_QUESTION',
  priority: 'NORMAL',
  initialMessage: 'Your mother had a great week! Here are the highlights...',
}, context);

// Send follow-up message
await messageService.sendMessage({
  threadId: thread.id,
  body: 'She especially enjoyed the gardening activity on Tuesday.',
  senderUserId: 'caregiver-789',
  notifyParticipants: true,
  notificationMethods: ['EMAIL', 'PUSH'],
}, context);
```

### Generate Progress Update

```typescript
// Create automated weekly update
const update = await progressUpdateService.createProgressUpdate({
  organizationId: 'org-123',
  clientId: 'client-456',
  updateType: 'WEEKLY',
  title: 'Weekly Care Summary - Week of Jan 15',
  summary: 'Great week with 5 visits completed...',
  content: {
    visitsCompleted: 5,
    totalHours: 15,
    goalsProgress: [
      {
        goalId: 'goal-1',
        goalDescription: 'Improve mobility',
        progressPercentage: 75,
        status: 'ON_TRACK',
      },
    ],
  },
  periodStart: new Date('2025-01-15'),
  periodEnd: new Date('2025-01-21'),
  generationMethod: 'AUTOMATED',
}, context);

// Publish to families
await progressUpdateService.publishProgressUpdate({
  progressUpdateId: update.id,
  notifyFamilies: true,
  notificationMethods: ['EMAIL'],
}, context);
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Development

```bash
# Build
npm run build

# Type check
npm run typecheck

# Lint
npm run lint
```

## Roadmap

### Phase 1: Foundation (Current)
- [x] Database schema
- [x] TypeScript types
- [x] Family member management
- [x] Repository layer
- [x] Service layer
- [x] API handlers

### Phase 2: Relationships & Permissions
- [ ] Relationship service and API
- [ ] Permission service and API
- [ ] Permission templates
- [ ] Bulk permission operations
- [ ] Access control middleware

### Phase 3: Messaging
- [ ] Message thread service
- [ ] Message sending and receiving
- [ ] Read receipts
- [ ] File attachments
- [ ] Message moderation

### Phase 4: Progress Updates
- [ ] Automated update generation
- [ ] Update templates
- [ ] Publishing workflow
- [ ] Delivery tracking

### Phase 5: Transparency Configuration
- [ ] Settings management
- [ ] Client-specific overrides
- [ ] Template system

### Phase 6: Frontend Portal
- [ ] Family portal UI
- [ ] Message center
- [ ] Progress dashboard
- [ ] Care plan viewer
- [ ] Preferences management

### Phase 7: Mobile App
- [ ] React Native family app
- [ ] Push notifications
- [ ] Offline support

### Phase 8: Advanced Features
- [ ] AI-assisted progress updates
- [ ] Predictive notifications
- [ ] Family collaboration features
- [ ] Care team coordination

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

See [LICENSE](../../LICENSE) for details.

---

**Part of the Care Commons Platform** - Shared care software, community owned.
