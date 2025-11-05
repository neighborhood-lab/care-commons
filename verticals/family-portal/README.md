# Family Portal & Engagement Platform

> Secure family portal with AI-powered chatbot for family members to stay connected with their loved ones' care

## Overview

The Family Portal provides family members with secure access to view care information, communicate with care teams, and get instant answers through an AI-powered chatbot. This vertical enables transparent care coordination and reduces anxiety by keeping families informed and engaged.

## Features

### Core Capabilities

- **Secure Authentication** - Email/password authentication with JWT tokens
- **Invitation System** - Staff can invite family members with granular permissions
- **AI Chatbot Support** - Claude-powered chatbot for instant answers and support
- **Real-time Dashboard** - View care plans, visit schedules, and recent updates
- **Smart Notifications** - Multi-channel notifications (in-app, email, SMS, push)
- **Permission-based Access** - Granular control over what family members can view
- **Emergency Detection** - AI detects urgent concerns and provides appropriate guidance

### AI Chatbot Features

The AI chatbot (powered by Claude) provides:

- **24/7 Availability** - Get answers anytime, reducing burden on staff
- **Context-Aware Responses** - Accesses care plan, visit history, and medications
- **Emotional Support** - Compassionate, professional responses to family concerns
- **Emergency Detection** - Automatically identifies urgent situations and escalates
- **HIPAA Compliant** - Only shares information family is authorized to view
- **Multi-turn Conversations** - Maintains conversation history for better context

## Architecture

```
family-portal/
├── src/
│   ├── types/           # TypeScript types and interfaces
│   ├── validation/      # Zod schemas for input validation
│   ├── repository/      # Data access layer
│   ├── service/         # Business logic
│   └── api/            # Express routes
```

## Data Model

### Family Member

```typescript
interface FamilyMember {
  id: UUID;
  organizationId: UUID;
  clientId: UUID;
  authorizedContactId: UUID;
  email: string;
  firstName: string;
  lastName: string;
  relationship: string;
  status: 'INVITED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'REVOKED';
  permissions: FamilyPermission[];
  accessLevel: 'BASIC' | 'STANDARD' | 'FULL';
  preferences: FamilyMemberPreferences;
  notificationSettings: NotificationSettings;
}
```

### Permissions

Available family member permissions:

- `VIEW_PROFILE` - View client demographic information
- `VIEW_CARE_PLAN` - View care plans and goals
- `VIEW_VISITS` - View visit schedules and history
- `VIEW_NOTES` - View care notes and progress reports
- `VIEW_MEDICATIONS` - View medication information
- `VIEW_DOCUMENTS` - View uploaded documents
- `RECEIVE_NOTIFICATIONS` - Receive notifications
- `USE_CHATBOT` - Access AI chatbot
- `REQUEST_UPDATES` - Request updates from staff
- `MESSAGE_STAFF` - Send messages to care team

### Access Levels

- **BASIC** - View profile and visits only
- **STANDARD** - View profile, visits, care plans, and use chatbot
- **FULL** - All viewing permissions plus messaging

## Getting Started

### Installation

```bash
cd verticals/family-portal
npm install
```

### Environment Variables

```env
# Anthropic API (for AI chatbot)
ANTHROPIC_API_KEY=your_api_key_here

# JWT Secret
FAMILY_PORTAL_JWT_SECRET=your_secret_here

# Email/SMS providers (optional)
SENDGRID_API_KEY=your_key
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
```

### Database Setup

Run migrations to create family portal tables:

```bash
npm run db:migrate
```

This creates:
- `family_members` - Family member accounts
- `family_invitations` - Invitation tokens
- `family_sessions` - Active sessions
- `chat_conversations` - Chat conversation threads
- `chat_messages` - Individual chat messages
- `family_notifications` - Notifications

## Usage

### Initialize Services

```typescript
import { Database } from '@care-commons/core';
import {
  FamilyMemberRepository,
  FamilyInvitationRepository,
  ChatConversationRepository,
  ChatMessageRepository,
  NotificationRepository,
  FamilyAuthService,
  FamilyInvitationService,
  ChatbotService,
  NotificationService,
  DashboardService,
  createFamilyPortalRouter,
} from '@care-commons/family-portal';

// Initialize database
const database = new Database(/* config */);

// Create repositories
const familyMemberRepo = new FamilyMemberRepository(database);
const invitationRepo = new FamilyInvitationRepository(database);
const conversationRepo = new ChatConversationRepository(database);
const messageRepo = new ChatMessageRepository(database);
const notificationRepo = new NotificationRepository(database);

// Create services
const authService = new FamilyAuthService(
  familyMemberRepo,
  process.env.FAMILY_PORTAL_JWT_SECRET!
);

const invitationService = new FamilyInvitationService(
  invitationRepo,
  familyMemberRepo,
  authService
);

const chatbotService = new ChatbotService(
  conversationRepo,
  messageRepo,
  process.env.ANTHROPIC_API_KEY!
);

const notificationService = new NotificationService(notificationRepo);

const dashboardService = new DashboardService(notificationService);

// Create router
const familyPortalRouter = createFamilyPortalRouter({
  authService,
  invitationService,
  chatbotService,
  notificationService,
  dashboardService,
});

// Mount router
app.use('/api/family-portal', familyPortalRouter);
```

### Invite a Family Member

```typescript
// As staff, create an invitation
const invitation = await invitationService.createInvitation(
  {
    organizationId: 'org-uuid',
    clientId: 'client-uuid',
    authorizedContactId: 'contact-uuid',
    email: 'family@example.com',
    permissions: ['VIEW_PROFILE', 'VIEW_CARE_PLAN', 'VIEW_VISITS', 'USE_CHATBOT'],
    accessLevel: 'STANDARD',
    expiresInDays: 7,
  },
  staffContext
);

// Email invitation.token to family member
// Family member visits: https://yourapp.com/family/accept?token={invitation.token}
```

### Accept Invitation

```typescript
// Family member accepts invitation
const result = await invitationService.acceptInvitation({
  token: 'invitation-token',
  password: 'SecurePassword123!',
  firstName: 'John',
  lastName: 'Smith',
});

// Account created, family member can now login
```

### Use AI Chatbot

```typescript
// Family member sends a message
const response = await chatbotService.sendMessage(familyMember, {
  message: 'What visits are scheduled this week?',
  includeContext: {
    carePlan: true,
    recentVisits: true,
  },
});

console.log(response.message.content);
// => "Based on the schedule, your loved one has 3 visits this week..."
```

### Send Notifications

```typescript
// Notify family when visit is completed
await notificationService.sendNotification(
  {
    familyMemberId: 'family-member-uuid',
    clientId: 'client-uuid',
    type: 'VISIT_COMPLETED',
    category: 'SCHEDULE',
    title: 'Visit Completed',
    message: 'Maria Garcia completed the 2:00 PM visit. All tasks were completed successfully.',
    priority: 'MEDIUM',
    channels: ['IN_APP', 'EMAIL'],
    relatedEntity: {
      type: 'visit',
      id: 'visit-uuid',
    },
  },
  staffContext
);
```

## API Endpoints

### Authentication

```
POST   /api/family-portal/auth/login
POST   /api/family-portal/auth/refresh
POST   /api/family-portal/auth/password/reset-request
POST   /api/family-portal/auth/password/reset
POST   /api/family-portal/auth/password/change
GET    /api/family-portal/auth/me
PUT    /api/family-portal/auth/me
```

### Invitations

```
POST   /api/family-portal/invitations
GET    /api/family-portal/invitations/verify/:token
POST   /api/family-portal/invitations/accept
GET    /api/family-portal/invitations/client/:clientId
POST   /api/family-portal/invitations/:id/revoke
POST   /api/family-portal/invitations/:id/resend
```

### Chatbot

```
POST   /api/family-portal/chat/messages
GET    /api/family-portal/chat/conversations
GET    /api/family-portal/chat/conversations/:id/messages
POST   /api/family-portal/chat/conversations/:id/archive
```

### Notifications

```
GET    /api/family-portal/notifications
GET    /api/family-portal/notifications/summary
PUT    /api/family-portal/notifications/:id/read
POST   /api/family-portal/notifications/mark-read
POST   /api/family-portal/notifications/mark-all-read
DELETE /api/family-portal/notifications/:id
```

### Dashboard

```
GET    /api/family-portal/dashboard
```

## Security

### Authentication

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens for session management (7-day expiry)
- Refresh tokens for long-term access (30-day expiry)
- Password reset tokens expire after 24 hours

### Authorization

- Family members can only access their own client's data
- Permissions checked on every API call
- JWT tokens contain permission claims
- Database queries filtered by family member ID

### Data Protection

- Sensitive data (passwords) never returned in API responses
- HIPAA-compliant data access controls
- Audit trail for all family member actions
- Rate limiting on chatbot (30 messages/hour, 100/day)

## Chatbot Configuration

### Default Configuration

```typescript
{
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 1024,
  temperature: 0.7,
  features: {
    contextAwareness: true,
    careplanAccess: true,
    visitHistory: true,
    medicationInfo: true,
    documentSearch: false,
    emergencyDetection: true,
  },
  rateLimit: {
    messagesPerHour: 30,
    messagesPerDay: 100,
    maxConversationLength: 100,
  },
}
```

### Customizing the Chatbot

```typescript
const chatbotService = new ChatbotService(
  conversationRepo,
  messageRepo,
  apiKey,
  {
    model: 'claude-3-opus-20240229', // Use more powerful model
    maxTokens: 2048,
    temperature: 0.5, // More focused responses
    systemPrompt: 'Custom system prompt here...',
  }
);
```

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## Future Enhancements

- [ ] Video call integration with care team
- [ ] Document upload and sharing
- [ ] Calendar integration for visit reminders
- [ ] Mobile push notifications
- [ ] SMS-based chatbot interface
- [ ] Voice assistant integration
- [ ] Translation for non-English speakers
- [ ] Progress photo sharing
- [ ] Care team messaging
- [ ] Appointment scheduling

## Related Verticals

- **Client Demographics** - Client data that family can view
- **Care Plans & Tasks** - Care plans visible to family
- **Scheduling & Visits** - Visit schedules and history
- **Time Tracking & EVV** - Visit verification data

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

See [LICENSE](../../LICENSE) for details.

---

**Family Portal** - Keeping families connected and informed 💙
