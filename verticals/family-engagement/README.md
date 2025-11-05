# Family Engagement Platform

**Part 3 of Build Family Engagement Platform with AI Chatbot**

A comprehensive family portal with messaging, AI chatbot, and care activity feeds for the Care Commons platform.

## Overview

The Family Engagement Platform enables family members to stay connected and informed about their loved one's care through:

- 👥 **Family Portal** - Secure portal access for family members
- 💬 **Messaging System** - Real-time communication with care teams
- 🤖 **AI Chatbot** - Intelligent assistant powered by Claude (Anthropic)
- 📊 **Activity Feed** - Real-time updates about care activities
- 🔔 **Notifications** - Multi-channel notifications (email, SMS, push, in-app)

## Features Implemented

### 1. Database Schema ✅

Comprehensive database migration created (`20251105000000_family_engagement_platform.ts`) including:

- **family_portal_users** - Family member accounts with permissions and preferences
- **conversations** - Message threads between families, caregivers, and coordinators
- **messages** - Individual messages with AI generation tracking
- **care_activity_feed** - Timeline of care activities visible to families
- **chatbot_sessions** - AI conversation tracking and analytics
- **family_notifications** - Multi-channel notification queue

### 2. TypeScript Types ✅

Comprehensive type definitions (`src/types/family-portal.ts`):

- FamilyPortalUser - Family member profiles
- Conversation - Message thread management
- Message - Individual messages with AI support
- CareActivityFeedItem - Care activity updates
- ChatbotSession - AI conversation sessions
- FamilyNotification - Notification management
- Supporting DTOs and request/response types

### 3. Validation Schemas ✅

Zod validation schemas (`src/validation/family-portal-validator.ts`):

- Request validation for all API endpoints
- Type-safe runtime validation
- Input sanitization and security

### 4. Repository Layer ✅

Data access layer (`src/repository/family-portal-repository.ts`):

- FamilyPortalUserRepository
- ConversationRepository
- MessageRepository
- CareActivityFeedRepository
- ChatbotSessionRepository

### 5. Service Layer ✅

Business logic (`src/service/`):

**FamilyEngagementService** - Core family portal operations:
- Family user management (invite, activate, permissions)
- Conversation management
- Message handling
- Activity feed management
- Dashboard data aggregation

**ChatbotService** - AI chatbot integration:
- Claude API integration (Anthropic SDK)
- Context-aware responses
- Session management
- Usage tracking and cost estimation
- Human handoff detection
- Suggested actions generation

### 6. API Handlers ✅

HTTP request handlers (`src/api/family-engagement-handlers.ts`):

**Family Portal User Endpoints:**
- POST /family-portal-users - Create/invite family member
- GET /family-portal-users/:id - Get family member
- PATCH /family-portal-users/:id - Update family member
- POST /family-portal-users/accept-invitation - Accept invite
- DELETE /family-portal-users/:id - Deactivate

**Conversation Endpoints:**
- POST /conversations - Create conversation
- GET /conversations/:id - Get conversation
- GET /conversations/family-member/:id - List conversations
- POST /conversations/:id/archive - Archive conversation

**Message Endpoints:**
- POST /messages - Send message
- GET /messages/conversation/:id - Get messages
- POST /messages/mark-read - Mark as read

**Activity Feed Endpoints:**
- POST /activity-feed - Create activity
- GET /activity-feed/client/:id - Get feed
- POST /activity-feed/:id/mark-read - Mark as read

**AI Chatbot Endpoints:**
- POST /chat - Send chat message
- POST /chat/sessions/:id/end - End session with feedback
- POST /chat/sessions/:id/handoff - Request human handoff

**Dashboard:**
- GET /dashboard/:familyMemberId - Get dashboard data

## Technology Stack

- **Backend**: TypeScript, Node.js 22, Express 5
- **Database**: PostgreSQL with JSONB
- **AI**: Anthropic Claude SDK (claude-3-5-sonnet-20241022)
- **Validation**: Zod 4.x
- **Real-time**: Socket.io (WebSocket support)
- **Testing**: Vitest
- **Type Safety**: Strict TypeScript mode

## Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run database migration
npm run db:migrate

# Run tests
npm test
```

## Configuration

### Environment Variables

```env
# Anthropic API Key for Claude chatbot
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Override default AI model
AI_MODEL=claude-3-5-sonnet-20241022

# Optional: WebSocket configuration
WEBSOCKET_PORT=3001
```

### AI Chatbot Configuration

The chatbot service supports configuration:

```typescript
const chatbotConfig = {
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
  maxTokens: 1024,
  temperature: 0.7,
};
```

## Usage Examples

### Creating a Family Portal User

```typescript
const familyUser = await familyService.createFamilyUser(
  {
    clientId: 'client-uuid',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    relationship: 'ADULT_CHILD',
    isPrimaryContact: true,
    permissions: {
      canViewCareNotes: true,
      canViewSchedule: true,
      canMessageCaregivers: true,
    },
  },
  organizationId,
  createdBy
);
```

### Sending a Chat Message to AI Assistant

```typescript
const response = await chatbotService.chat(
  {
    message: "How is my mom doing today?",
    context: {
      clientId: 'client-uuid',
      familyMemberId: 'family-uuid',
      includeRecentActivity: true,
      includeSchedule: true,
    },
  },
  userId,
  organizationId
);
```

### Creating an Activity Feed Item

```typescript
const activity = await familyService.createActivityFeedItem(
  {
    clientId: 'client-uuid',
    activityType: 'VISIT_COMPLETED',
    title: 'Morning visit completed',
    description: 'All tasks completed successfully',
    actorType: 'CAREGIVER',
    actorName: 'John Doe',
    occurredAt: new Date(),
    visibleToFamily: true,
  },
  organizationId,
  createdBy
);
```

## AI Chatbot Features

### Context-Aware Responses

The chatbot automatically includes relevant context:
- Recent care activities
- Upcoming schedule
- Care plan information (optional)

### Human Handoff Detection

The system automatically detects when conversations should be escalated:
- Emergency keywords (pain, bleeding, fall, etc.)
- Medical urgencies
- Questions requiring coordinator input

### Usage Tracking

All AI interactions are tracked:
- Token consumption
- Cost estimation ($3/M input tokens, $15/M output tokens)
- Session duration
- User satisfaction ratings

### Suggested Actions

The chatbot provides contextual suggestions:
- View Schedule
- View Care Plan
- View Medications
- Contact Care Coordinator

## Database Schema

### Key Tables

**family_portal_users**
- Identity and authentication
- Relationship to client
- Granular permissions
- Notification preferences

**conversations**
- Multi-participant threads
- AI conversation tracking
- Status and metadata

**messages**
- Rich content support
- AI-generated flag
- Read tracking
- Threading support

**care_activity_feed**
- Care event timeline
- Sensitivity levels
- Family visibility control

**chatbot_sessions**
- Session analytics
- Cost tracking
- Quality metrics
- Handoff management

## Security & Privacy

### HIPAA Compliance

- Audit logging for all data access
- Soft delete support
- Encryption ready (fields marked for encryption)
- Role-based access control

### Permission System

Family members have granular permissions:
- View care notes
- View schedule
- View medications
- View billing
- Message caregivers
- Request schedule changes

### Data Access

- Family members can only access data for their linked client
- Organization-scoped data isolation
- Soft delete with audit trail

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## API Response Format

All endpoints return consistent JSON responses:

```typescript
// Success response
{
  "success": true,
  "data": { /* entity or array */ },
  "pagination": { /* if applicable */ }
}

// Error response
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Roadmap

### Future Enhancements

- [ ] WebSocket real-time messaging
- [ ] React/React Native UI components
- [ ] Push notification integration
- [ ] Video/voice call support
- [ ] Document sharing
- [ ] Mobile app (React Native)
- [ ] Multilingual AI chatbot
- [ ] Advanced analytics dashboard
- [ ] Family member role management
- [ ] Care team collaboration tools

## Architecture

The family engagement vertical follows the Care Commons architecture pattern:

```
family-engagement/
├── src/
│   ├── types/           # TypeScript type definitions
│   ├── validation/      # Zod schemas
│   ├── repository/      # Data access layer
│   ├── service/         # Business logic
│   ├── api/            # HTTP handlers
│   └── index.ts        # Public exports
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

Follow the Care Commons contributing guidelines:

1. Type safety - Strict TypeScript
2. Validation - Zod schemas for all inputs
3. Testing - Comprehensive test coverage
4. Documentation - Clear code comments
5. Security - HIPAA compliance considerations

## License

Part of Care Commons - see main repository license.

## Support

For issues and feature requests, please use the Care Commons GitHub repository.

---

**Built with ❤️ for better family engagement in care services**
