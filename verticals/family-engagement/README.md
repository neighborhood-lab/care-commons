# Family Engagement, Transparency & Communication Vertical

Part 7 of the Care Commons Family Engagement Platform - comprehensive messaging, family portal, and transparency features for home care coordination.

## Overview

This vertical provides secure communication and transparency features that enable families to stay informed and engaged in their loved ones' care:

- **Secure Messaging**: HIPAA-compliant messaging between caregivers, staff, and family members
- **Family Portal**: Dedicated access for family members with granular permission controls
- **Transparency & Activity Tracking**: Real-time visibility into care activities
- **HIPAA Compliance**: §164.528-compliant access logging and disclosure tracking
- **Notification Management**: Comprehensive notification preferences and delivery

## Features

### 1. Messaging System

- **Thread Types**: Direct, group, family, and care team conversations
- **Rich Messages**: Text, system notifications, alerts with urgency flags
- **Attachments**: Support for documents, images, and files
- **Read Receipts**: Track message delivery and read status
- **Threading**: Reply-to functionality for organized conversations
- **Archive/Mute**: Thread management for users

### 2. Family Member Management

- **Invitation System**: Secure email invitations with expiring tokens
- **Access Levels**: Basic, Standard, Full, and Admin access tiers
- **HIPAA Authorization**: Digital consent and authorization tracking
- **Granular Permissions**: Resource-level access control (care plans, visits, tasks, etc.)
- **Primary/Emergency Contacts**: Designation and prioritization
- **Consent Preferences**: Fine-grained control over information sharing

### 3. Transparency & Activity Tracking

- **Activity Feed**: Real-time feed of care activities and changes
- **Access Logs**: HIPAA §164.528-compliant audit trail
- **Change Tracking**: Before/after records for all modifications
- **Family Visibility**: Configurable visibility levels per activity
- **HIPAA Disclosure Reports**: 6-year retention, patient-accessible reports
- **Emergency Access Tracking**: Special logging for break-glass scenarios

### 4. Notification System

- **Multi-Channel**: Push, email, SMS, and in-app notifications
- **Type Preferences**: Granular control over notification types
- **Quiet Hours**: Configurable do-not-disturb periods
- **Digest Mode**: Hourly, daily, or weekly notification summaries
- **Priority Filtering**: Only receive high-priority notifications if desired

## Database Schema

### Core Tables

#### `message_threads`
- Thread management with participant tracking
- Subject, type, and status fields
- Last message preview for list views
- Archive functionality

#### `messages`
- Individual messages with delivery tracking
- Attachment support via JSONB
- Reply threading and counts
- Soft delete with audit trail

#### `family_members`
- Family member registration and profiles
- Invitation workflow (pending → sent → accepted)
- HIPAA authorization tracking
- Access level and permission storage
- Notification preferences

#### `family_access_rules`
- Granular resource-level permissions
- Resource types: CARE_PLAN, VISIT, TASK, MESSAGE, etc.
- Permission types: READ, WRITE, DELETE, APPROVE
- Time-based effective dates
- Condition-based access rules

#### `activity_feed`
- Transparent activity logging
- Actor, action, and resource tracking
- Before/after change tracking
- Family visibility flags
- Categorized actions (CARE, VISIT, TASK, MESSAGE, etc.)

#### `access_logs`
- HIPAA §164.528 compliant audit logs
- WHO, WHAT, WHEN, HOW, WHY tracking
- Patient vs. non-patient access differentiation
- Emergency access logging
- 6-year retention requirement support

#### `notification_preferences`
- Per-user notification settings
- Channel enablement (push, email, SMS, in-app)
- Type-specific preferences
- Quiet hours configuration
- Digest frequency settings

## Access Control

### Access Levels

#### BASIC
- View recent visits
- View activity feed
- Receive basic notifications

#### STANDARD
- Read care plans
- Read visits, tasks, messages
- Send messages
- View documents
- Full activity feed access

#### FULL
- All STANDARD permissions
- View incident reports
- View medications
- View health records
- Comprehensive care visibility

#### ADMIN
- Full access to all resources
- Manage family members
- Configure access rules
- Administrative functions

### Resource Types

```typescript
type ResourceType =
  | 'CARE_PLAN'       // Care plans and goals
  | 'VISIT'           // Service visits
  | 'TASK'            // Care tasks
  | 'MESSAGE'         // Messaging
  | 'DOCUMENT'        // Documents and files
  | 'ACTIVITY_FEED'   // Transparency feed
  | 'INCIDENT_REPORT' // Incident tracking
  | 'MEDICATION'      // Medication management
  | 'HEALTH_RECORD'   // Health information
  | 'BILLING'         // Billing information
```

## HIPAA Compliance

### §164.528 Accounting of Disclosures

The `access_logs` table implements HIPAA's disclosure accounting requirements:

1. **Required Information**:
   - Date of disclosure (accessedAt)
   - Name/description of recipient (userDisplayName)
   - Address if available (ipAddress)
   - Brief description of information disclosed (resourceType, action)
   - Brief statement of purpose (purpose field)

2. **Retention**: 6-year minimum retention (database-level, not implemented in code)

3. **Patient Rights**: Care recipients can request disclosure reports for past 6 years

4. **Exclusions**: Patient access to their own records (`isPatientAccess` flag)

### Authorization Tracking

- `hipaaAuthorizationSigned`: Boolean flag
- `hipaaAuthorizationDate`: Date of authorization
- `hipaaAuthorizationDocumentId`: Reference to signed document
- `consentPreferences`: Granular consent for different information types

## State-Specific Compliance

### Texas
- **Privacy Protection Act**: Biometric data consent (if applicable)
- **26 TAC §558**: Family notification requirements
- Client consent required before family portal access

### Florida
- **Florida Statute 400.487**: Family notification of care plan changes
- Activity feed automatically logs care plan modifications
- Family members with FULL access receive care plan update notifications

## API Usage (Examples)

### Creating a Family Member

```typescript
const familyMember = await familyService.createFamilyMember(
  {
    organizationId: 'org-123',
    careRecipientId: 'client-456',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    relationship: 'Daughter',
    accessLevel: 'STANDARD',
    isPrimaryContact: true,
    sendInvitation: true,
  },
  context
);
```

### Sending a Message

```typescript
const message = await messageService.sendMessage(
  {
    threadId: 'thread-789',
    body: 'Visit completed successfully. All tasks done.',
    isUrgent: false,
  },
  context
);
```

### Logging Activity

```typescript
await transparencyService.logActivity(
  {
    organizationId: 'org-123',
    action: 'COMPLETED',
    actionCategory: 'VISIT',
    resourceType: 'VISIT',
    resourceId: 'visit-999',
    resourceDisplayName: 'Morning Care Visit',
    careRecipientId: 'client-456',
    visibleToFamily: true,
    visibilityLevel: 'FAMILY',
  },
  context
);
```

### Generating HIPAA Disclosure Report

```typescript
const report = await transparencyService.generateHipaaDisclosureReport(
  'client-456',
  startDate,
  endDate,
  context
);
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Type Checking

```bash
# Type check without emitting files
npm run typecheck
```

## Building

```bash
# Build TypeScript and resolve path aliases
npm run build

# Build in watch mode
npm run dev
```

## Dependencies

- **@care-commons/core**: Core repository, database, and type infrastructure
- **date-fns**: Date manipulation utilities
- **uuid**: Unique identifier generation
- **zod**: Runtime type validation

## Integration Points

### With Other Verticals

- **Client Demographics**: Links to care recipients via `careRecipientId`
- **Scheduling & Visits**: Activity logging for visit start/end
- **Care Plans & Tasks**: Activity logging for plan and task changes
- **Time Tracking & EVV**: Visit verification triggers family notifications
- **Billing**: Optional access for family members with ADMIN level

### With Mobile App

- Push notifications via `push_notifications` table
- Device registration via `mobile_devices` table
- Offline sync support via `sync_metadata` table

## Security Considerations

1. **Authentication**: All endpoints require authenticated user context
2. **Authorization**: Permission-based access control via PermissionService
3. **Organization Scope**: All queries enforce organization boundaries
4. **Data Encryption**: Sensitive fields should be encrypted at rest
5. **Token Security**: Invitation tokens are single-use and time-limited
6. **Audit Trail**: All access logged for compliance

## Performance Optimizations

- **Indexes**: Comprehensive indexes on foreign keys and filter fields
- **JSONB Indexes**: GIN indexes on participants and read_by fields
- **Pagination**: All list endpoints support limit/offset
- **Query Optimization**: Selective field loading for large datasets
- **Caching**: Activity feed and access logs suitable for caching

## Future Enhancements

- [ ] Real-time messaging via WebSocket
- [ ] Video call integration
- [ ] Document signing and e-signatures
- [ ] Mobile app deep linking
- [ ] Multi-language support
- [ ] Scheduled message delivery
- [ ] Message templates
- [ ] Auto-replies and chatbots
- [ ] Advanced analytics dashboards
- [ ] Integration with external EMR systems

## License

Proprietary - Care Commons Platform

## Support

For questions or issues, please contact the Care Commons development team.
