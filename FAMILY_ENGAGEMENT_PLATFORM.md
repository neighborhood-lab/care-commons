# Family Engagement Platform with AI Chatbot

## Overview

The Family Engagement Platform enables families and authorized contacts to stay connected with their loved ones' care delivery through a secure, HIPAA-compliant portal. The platform includes real-time messaging, AI-powered assistance, personalized notifications, and comprehensive care information access.

## Features

### 1. Family Portal
- **Secure Access**: Email-based authentication with two-factor support
- **Permission Management**: Fine-grained access controls per client
- **Activity Logging**: Complete audit trail for PHI access (HIPAA §164.528)
- **Multi-Client Support**: Single family member can access multiple clients

### 2. AI Chatbot Assistant
- **Healthcare-Aware**: Trained on home healthcare domain knowledge
- **Natural Language**: Conversational interface for care information
- **Intent Classification**: 12+ healthcare-specific intents
- **Entity Extraction**: Dates, names, medications, symptoms
- **Suggested Actions**: Context-aware quick actions
- **Quick Replies**: Pre-populated response options
- **Feedback System**: Quality monitoring and improvement
- **Human Escalation**: Seamless handoff to care coordinators

### 3. Real-Time Messaging
- **Direct Messages**: One-on-one with care coordinators
- **Group Conversations**: Care team channels
- **Read Receipts**: Track message delivery and reading
- **Message Reactions**: Emoji reactions
- **File Attachments**: Share documents and photos
- **Message Search**: Full-text search across conversations

### 4. Notifications
- **Multi-Channel**: Email, SMS, Push, In-App
- **Smart Scheduling**: Respect quiet hours and preferences
- **Priority Levels**: LOW, NORMAL, HIGH, URGENT
- **Categories**: Care updates, messages, system alerts, reminders
- **Delivery Tracking**: Status monitoring and retry logic

## Architecture

### Backend Stack
- **TypeScript**: Full type safety
- **Node.js**: Runtime environment
- **PostgreSQL**: Primary database
- **Anthropic Claude**: AI chatbot provider
- **WebSocket**: Real-time messaging

### Frontend Stack
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **TanStack Query**: Server state management
- **Lucide Icons**: Icon library

## Database Schema

### Core Tables

#### `family_members`
Portal accounts for family members with authentication and preferences.

```sql
id                    UUID PRIMARY KEY
organization_id       UUID NOT NULL
first_name            VARCHAR(100) NOT NULL
last_name             VARCHAR(100) NOT NULL
email                 VARCHAR(255) NOT NULL UNIQUE
phone_number          VARCHAR(50)
auth_provider_id      VARCHAR(255)  -- External auth (Auth0, etc.)
email_verified        BOOLEAN DEFAULT false
status                VARCHAR(50)   -- INVITED, ACTIVE, SUSPENDED, etc.
notification_preferences JSONB
two_factor_enabled    BOOLEAN DEFAULT false
created_at            TIMESTAMP
updated_at            TIMESTAMP
deleted_at            TIMESTAMP
```

#### `family_client_access`
Links family members to clients with specific permissions.

```sql
id                    UUID PRIMARY KEY
family_member_id      UUID NOT NULL -> family_members(id)
client_id             UUID NOT NULL -> clients(id)
relationship_type     VARCHAR(50)   -- PARENT, SPOUSE, GUARDIAN, etc.
is_primary_contact    BOOLEAN
permissions           JSONB         -- Fine-grained permission object
consent_status        VARCHAR(50)   -- PENDING, GRANTED, EXPIRED, REVOKED
legal_authority       VARCHAR(50)   -- HEALTHCARE_POA, GUARDIANSHIP, etc.
status                VARCHAR(50)   -- ACTIVE, SUSPENDED, REVOKED
granted_at            TIMESTAMP
granted_by            UUID -> users(id)
last_accessed_at      TIMESTAMP
access_count          INTEGER
```

#### `conversations`
Message threads between participants.

```sql
id                    UUID PRIMARY KEY
client_id             UUID NOT NULL -> clients(id)
subject               VARCHAR(255)
conversation_type     VARCHAR(50)   -- DIRECT, GROUP, CARE_TEAM
participants          JSONB         -- Array of participant objects
status                VARCHAR(20)   -- ACTIVE, ARCHIVED, CLOSED
last_message_at       TIMESTAMP
last_message_preview  TEXT
created_at            TIMESTAMP
```

#### `messages`
Individual messages within conversations.

```sql
id                    UUID PRIMARY KEY
conversation_id       UUID NOT NULL -> conversations(id)
client_id             UUID NOT NULL -> clients(id)
sender_id             UUID NOT NULL
sender_type           VARCHAR(50)   -- FAMILY_MEMBER, CAREGIVER, etc.
content               TEXT NOT NULL
attachments           JSONB
read_by               JSONB         -- Array of read receipts
contains_phi          BOOLEAN
sent_at               TIMESTAMP
delivered_at          TIMESTAMP
```

#### `chat_sessions`
AI chatbot conversation sessions.

```sql
id                    UUID PRIMARY KEY
family_member_id      UUID NOT NULL -> family_members(id)
client_id             UUID NOT NULL -> clients(id)
status                VARCHAR(20)   -- ACTIVE, IDLE, ENDED, ESCALATED
context               JSONB         -- Conversation context
conversation_history  JSONB         -- Message history
total_messages        INTEGER
total_tokens_used     INTEGER
started_at            TIMESTAMP
last_activity_at      TIMESTAMP
ended_at              TIMESTAMP
```

#### `chat_messages`
Individual messages in chatbot sessions.

```sql
id                    UUID PRIMARY KEY
session_id            UUID NOT NULL -> chat_sessions(id)
role                  VARCHAR(20)   -- USER, ASSISTANT, SYSTEM
content               TEXT NOT NULL
intent                VARCHAR(100)  -- Classified intent
confidence            DECIMAL(5,4)  -- 0.0000 to 1.0000
entities              JSONB         -- Extracted entities
suggested_actions     JSONB
quick_replies         JSONB
tokens_used           INTEGER
processing_time_ms    INTEGER
timestamp             TIMESTAMP
```

#### `notifications`
Multi-channel notifications for family members.

```sql
id                    UUID PRIMARY KEY
family_member_id      UUID NOT NULL -> family_members(id)
client_id             UUID NOT NULL -> clients(id)
type                  VARCHAR(50)   -- VISIT_SCHEDULED, CARE_PLAN_UPDATED, etc.
category              VARCHAR(50)   -- CARE_UPDATES, MESSAGES, ALERTS
priority              VARCHAR(20)   -- LOW, NORMAL, HIGH, URGENT
title                 VARCHAR(255)
body                  TEXT
delivery_channels     JSONB         -- [IN_APP, EMAIL, SMS, PUSH]
delivery_status       VARCHAR(20)
read_at               TIMESTAMP
created_at            TIMESTAMP
```

## API Endpoints

### Chatbot API

#### Send Message
```http
POST /api/family/chat/message
Content-Type: application/json

{
  "sessionId": "uuid",  // Optional for new sessions
  "clientId": "uuid",   // Required for new sessions
  "message": "When is the next visit?"
}

Response:
{
  "sessionId": "uuid",
  "userMessage": { ... },
  "assistantResponse": {
    "id": "uuid",
    "content": "Your next visit is scheduled for...",
    "suggestedActions": [...],
    "quickReplies": [...]
  }
}
```

#### Get Chat History
```http
GET /api/family/chat/sessions/:sessionId/history

Response:
{
  "messages": [
    {
      "id": "uuid",
      "role": "USER",
      "content": "...",
      "timestamp": "2025-11-05T10:00:00Z"
    },
    ...
  ]
}
```

#### Submit Feedback
```http
POST /api/family/chat/sessions/:sessionId/feedback
Content-Type: application/json

{
  "messageId": "uuid",
  "rating": 5,
  "feedbackType": "HELPFUL",
  "comment": "Very helpful response"
}
```

#### Escalate to Human
```http
POST /api/family/chat/sessions/:sessionId/escalate
Content-Type: application/json

{
  "reason": "COMPLEX_QUESTION",
  "priority": "NORMAL",
  "description": "Need specific medical advice",
  "clientId": "uuid"
}
```

### Portal API (Future Implementation)

```http
POST   /api/family/portal/invite          # Send invitation
GET    /api/family/portal/me               # Get current family member
GET    /api/family/portal/clients          # List accessible clients
GET    /api/family/portal/activity         # Get activity log

POST   /api/family/conversations           # Create conversation
GET    /api/family/conversations           # List conversations
POST   /api/family/conversations/:id/messages  # Send message

GET    /api/family/notifications           # List notifications
PUT    /api/family/notifications/:id/read  # Mark as read
```

## Permission System

### Permission Types

```typescript
interface FamilyAccessPermissions {
  // Care Information
  viewCarePlan: boolean;
  viewCarePlanGoals: boolean;
  viewCarePlanTasks: boolean;

  // Visit Information
  viewScheduledVisits: boolean;
  viewVisitHistory: boolean;
  viewVisitNotes: boolean;
  viewCaregiverInfo: boolean;

  // Health Information (PHI)
  viewMedicalInfo: boolean;
  viewMedications: boolean;
  viewVitalSigns: boolean;
  viewProgressNotes: boolean;

  // Communication
  sendMessages: boolean;
  receiveMessages: boolean;
  requestVisitChanges: boolean;

  // Documents
  viewDocuments: boolean;
  downloadDocuments: boolean;
  uploadDocuments: boolean;

  // Administrative
  viewBillingInfo: boolean;
  viewInvoices: boolean;
}
```

### Permission Templates

#### FULL_ACCESS
All permissions enabled. For primary contacts with legal authority.

#### LIMITED_ACCESS
- ✅ View care plan goals
- ✅ View scheduled visits
- ✅ Send/receive messages
- ❌ View medical information
- ❌ View billing information

#### VIEW_ONLY
- ✅ View care plan
- ✅ View visits
- ✅ Receive messages
- ❌ Send messages
- ❌ Download documents

## AI Chatbot

### Supported Intents

1. **GREETING**: Welcome and introduction
2. **FAREWELL**: Goodbye and thank you
3. **GET_NEXT_VISIT**: Next scheduled visit information
4. **GET_VISIT_SCHEDULE**: Full visit schedule
5. **GET_VISIT_DETAILS**: Specific visit information
6. **GET_CARE_PLAN**: Care plan information
7. **GET_CARE_PLAN_PROGRESS**: Goal completion status
8. **GET_CAREGIVER_INFO**: Caregiver assignments
9. **GET_MEDICATION_INFO**: Medication questions (escalates to nurse)
10. **REQUEST_VISIT_CHANGE**: Request schedule changes
11. **REQUEST_CALLBACK**: Request coordinator callback
12. **SEND_MESSAGE**: Send message to care team
13. **GET_HELP**: General help and support
14. **REPORT_ISSUE**: Report problems or concerns
15. **PROVIDE_FEEDBACK**: Submit feedback

### System Prompt

The AI is configured with healthcare-specific guidelines:

- Empathetic and supportive tone
- HIPAA compliance awareness
- Clear escalation for medical questions
- Safety-first approach
- Context-aware responses
- Concise but friendly

### Configuration

```typescript
interface AIModelConfig {
  provider: 'ANTHROPIC';
  modelName: 'claude-3-5-sonnet-20241022';
  maxTokens: 1024;
  temperature: 0.7;
  systemPrompt: string;
}
```

## Security & Compliance

### HIPAA Compliance

- ✅ All PHI access logged (§164.528)
- ✅ Minimum necessary access
- ✅ Audit trails with IP and device tracking
- ✅ Consent management
- ✅ Legal authority verification
- ✅ Encryption at rest and in transit
- ✅ Access revocation
- ✅ Session timeouts

### Authentication

- Email/password with verification
- Two-factor authentication support
- External auth providers (Auth0, Cognito)
- Session management
- Secure token handling

### Authorization

- Role-based access control (RBAC)
- Fine-grained permissions
- Client-level access control
- Legal authority validation
- Consent status verification

## Web UI Components

### AIChatbot
Full-featured chatbot component with:
- Message history
- Suggested actions
- Quick replies
- Feedback buttons
- Loading states
- Error handling
- Auto-scroll
- Keyboard shortcuts

### FamilyPortalDashboard
Complete dashboard with:
- Quick stats cards
- Next visit information
- Care plan progress
- Recent activity feed
- Quick actions
- Contact information
- Chatbot integration (slide-over)

## Deployment

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-...

# Authentication
AUTH_SECRET=...
AUTH0_DOMAIN=...
AUTH0_CLIENT_ID=...

# Notifications
SENDGRID_API_KEY=...      # Email
TWILIO_ACCOUNT_SID=...    # SMS
TWILIO_AUTH_TOKEN=...
FIREBASE_CONFIG=...       # Push notifications
```

### Database Migration

```bash
# Run migrations
npm run migrate

# Rollback
npm run migrate:rollback
```

### Build & Deploy

```bash
# Install dependencies
npm install

# Build backend
npm run build -w @care-commons/family-engagement

# Build frontend
npm run build -w @care-commons/web

# Run in production
npm run start
```

## Usage Examples

### Create Family Member Invitation

```typescript
import { FamilyInvitationRepository } from '@care-commons/family-engagement';

const invitation = await invitationRepo.create({
  clientId: 'client-uuid',
  email: 'family@example.com',
  relationshipType: 'SPOUSE',
  permissions: DEFAULT_PERMISSIONS.LIMITED_ACCESS,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  token: generateSecureToken(),
}, context);

// Send invitation email
await sendInvitationEmail(invitation);
```

### Send Notification

```typescript
import { NotificationRepository } from '@care-commons/family-engagement';

const notification = await notificationRepo.create({
  familyMemberId: 'family-uuid',
  clientId: 'client-uuid',
  type: 'VISIT_COMPLETED',
  category: 'CARE_UPDATES',
  priority: 'NORMAL',
  title: 'Visit Completed',
  body: 'Sarah Johnson completed the morning visit.',
  deliveryChannels: ['IN_APP', 'EMAIL'],
}, context);
```

### Use AI Chatbot

```typescript
import { AIChatbotService } from '@care-commons/family-engagement';

const chatService = new AIChatbotService(
  sessionRepo,
  messageRepo,
  feedbackRepo,
  escalationRepo,
  knowledgeBaseRepo,
  process.env.ANTHROPIC_API_KEY
);

const result = await chatService.sendMessage(
  sessionId,
  'When is the next visit?',
  context
);

console.log(result.response.content);
// "Your next visit is scheduled for tomorrow at 10:00 AM with Sarah Johnson."
```

## Testing

```bash
# Run all tests
npm test

# Run specific vertical tests
npm test -w @care-commons/family-engagement

# Run with coverage
npm run test:coverage
```

## Future Enhancements

### Phase 1 (Current)
- ✅ Backend infrastructure
- ✅ Database schema
- ✅ AI chatbot service
- ✅ Web UI components

### Phase 2 (Planned)
- [ ] Mobile app integration
- [ ] Real-time WebSocket server
- [ ] Email notification provider
- [ ] SMS notification provider
- [ ] Push notification service
- [ ] Document upload/download
- [ ] Video calling

### Phase 3 (Future)
- [ ] Advanced analytics dashboard
- [ ] Sentiment analysis
- [ ] Predictive alerts
- [ ] Voice interface
- [ ] Multi-language support
- [ ] Integration with wearables
- [ ] Medication reminders

## Support

For questions or issues:

1. Check the [API documentation](#api-endpoints)
2. Review [security guidelines](#security--compliance)
3. Contact the development team
4. File an issue on GitHub

## License

Copyright © 2025 Care Commons. All rights reserved.
