# Client Portal

> Self-service portal for clients who can self-manage their care

**Status:** ✅ Ready for Integration
**Version:** 0.1.0
**Accessibility:** WCAG 2.1 AA Compliant

---

## Overview

The Client Portal module enables clients with the ability to self-manage to interact with their care services independently through an accessible web interface. This is distinct from the family portal and is designed specifically for clients themselves.

### Key Features

✅ **View Schedule** - See upcoming visits and caregiver assignments
✅ **Rate Visits** - Provide feedback on completed caregiver visits
✅ **Request Changes** - Submit schedule change requests to coordinators
✅ **Video Calls** - Schedule and conduct video calls with care coordinators
✅ **Care Plan Access** - View care plan in plain, accessible language
✅ **Accessibility First** - WCAG 2.1 AA compliant with extensive accessibility features

### Accessibility Features

- **Large Fonts** - Adjustable font sizes (Small, Medium, Large, X-Large)
- **High Contrast** - Light, Dark, and High Contrast themes
- **Voice Control** - Optional voice control integration
- **Screen Reader** - Full screen reader support
- **Keyboard Navigation** - Complete keyboard-only navigation support
- **Captions** - Video call captions and audio descriptions
- **Reduced Motion** - Respect for motion reduction preferences

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Portal Module                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  API Layer (api/)                                            │
│  ├── client-portal-handlers.ts  (Express route handlers)    │
│  └── routes.ts                   (Route configuration)       │
│                                                               │
│  Service Layer (service/)                                    │
│  └── client-portal-service.ts   (Business logic)            │
│                                                               │
│  Repository Layer (repository/)                              │
│  └── client-portal-repository.ts (Data access)              │
│                                                               │
│  Validation Layer (validation/)                              │
│  └── index.ts                     (Zod schemas)              │
│                                                               │
│  Types Layer (types/)                                        │
│  └── index.ts                     (TypeScript interfaces)    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Database Tables

1. **client_portal_access** - Portal access credentials and preferences
2. **client_visit_ratings** - Client ratings for completed visits
3. **client_schedule_change_requests** - Schedule modification requests
4. **client_video_call_sessions** - Video call session metadata
5. **client_care_plan_access_logs** - Audit trail for care plan viewing
6. **client_portal_sessions** - Active portal sessions
7. **client_portal_preferences** - User interface preferences

---

## Installation & Setup

### 1. Database Migration

Run the client portal migration:

```bash
npm run db:migrate
```

This creates all necessary tables (see `packages/core/migrations/20251115000000_create_client_portal_tables.ts`).

### 2. Install Dependencies

```bash
cd verticals/client-portal
npm install
```

### 3. Build

```bash
npm run build
```

### 4. Register Routes

In your main Express app (`packages/app/src/index.ts`):

```typescript
import { createClientPortalRoutes } from '@care-commons/client-portal/dist/api/routes';

// Register client portal routes
app.use('/api/client-portal', createClientPortalRoutes(db));
```

---

## API Endpoints

### Portal Access

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| POST | `/api/client-portal/invite` | Invite client to portal | `clients:portal:invite` |
| POST | `/api/client-portal/activate` | Activate portal access (public) | None |
| GET | `/api/client-portal/access/:clientId` | Get portal access | Self or `clients:portal:read` |
| PATCH | `/api/client-portal/access/:clientId/accessibility` | Update accessibility prefs | Self |
| PATCH | `/api/client-portal/access/:clientId/notifications` | Update notification prefs | Self |

### Visit Ratings

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| POST | `/api/client-portal/clients/:clientId/ratings` | Create rating | Self |
| GET | `/api/client-portal/clients/:clientId/ratings` | Get client ratings | Self or `clients:ratings:read` |
| GET | `/api/client-portal/ratings` | Search all ratings | `clients:ratings:read` |

### Schedule Change Requests

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| POST | `/api/client-portal/clients/:clientId/schedule-requests` | Create request | Self |
| GET | `/api/client-portal/clients/:clientId/schedule-requests/pending` | Get pending requests | Self or `clients:schedule:read` |
| PATCH | `/api/client-portal/schedule-requests/:requestId/review` | Review request | `clients:schedule:approve` |
| GET | `/api/client-portal/schedule-requests` | Search requests | `clients:schedule:read` |

### Video Calls

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| POST | `/api/client-portal/clients/:clientId/video-calls` | Schedule call | Self or `clients:video:schedule` |
| GET | `/api/client-portal/clients/:clientId/video-calls/upcoming` | Get upcoming calls | Self or `clients:video:read` |
| PATCH | `/api/client-portal/video-calls/:sessionId/rate` | Rate call | Self |

### Dashboard

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/client-portal/clients/:clientId/dashboard` | Get dashboard data | Self |

---

## Usage Examples

### 1. Invite Client to Portal

```typescript
import { ClientPortalService } from '@care-commons/client-portal';

const result = await clientPortalService.inviteClientToPortal(
  {
    clientId: 'client-123',
    accessibilityPreferences: {
      fontSize: 'LARGE',
      theme: 'HIGH_CONTRAST',
      voiceControlEnabled: true,
    },
    expiresInDays: 7,
  },
  userContext
);

// Result includes invitation code to send to client
console.log(`Invitation code: ${result.invitationCode}`);
```

### 2. Client Activates Portal

```typescript
// Public endpoint - no auth required
const result = await clientPortalService.activatePortalAccess({
  invitationCode: 'abc123def456...',
  password: 'SecurePassword123!',
  acceptTerms: true,
});

// Returns portal access and session token
console.log(`Session token: ${result.sessionToken}`);
```

### 3. Rate a Visit

```typescript
const rating = await clientPortalService.createVisitRating(
  'client-123',
  {
    visitId: 'visit-456',
    overallRating: 5,
    professionalismRating: 5,
    punctualityRating: 5,
    qualityOfCareRating: 5,
    communicationRating: 5,
    positiveFeedback: 'Excellent care! Very professional and kind.',
    wouldRequestAgain: true,
    isAnonymous: false,
  },
  userContext
);
```

### 4. Request Schedule Change

```typescript
const request = await clientPortalService.createScheduleChangeRequest(
  'client-123',
  {
    requestType: 'RESCHEDULE',
    visitId: 'visit-789',
    requestedStartTime: new Date('2025-11-20T14:00:00Z'),
    requestedEndTime: new Date('2025-11-20T16:00:00Z'),
    requestedReason: 'I have a doctor appointment in the morning.',
    priority: 3,
  },
  userContext
);
```

### 5. Schedule Video Call

```typescript
const session = await clientPortalService.scheduleVideoCall(
  'client-123',
  {
    coordinatorId: 'coordinator-456',
    callType: 'SCHEDULED',
    scheduledStart: new Date('2025-11-18T10:00:00Z'),
    scheduledEnd: new Date('2025-11-18T10:30:00Z'),
    callPurpose: 'Monthly check-in',
    captionsEnabled: true,
    languagePreference: 'en',
  },
  userContext
);
```

### 6. Get Dashboard Data

```typescript
const dashboard = await clientPortalService.getClientDashboard(
  'client-123',
  userContext
);

console.log(`Upcoming visits: ${dashboard.upcomingVisits.length}`);
console.log(`Pending requests: ${dashboard.pendingScheduleRequests.length}`);
console.log(`Unread notifications: ${dashboard.unreadNotifications}`);
```

---

## Permission Model

### Required Permissions

- **clients:portal:invite** - Invite clients to portal
- **clients:portal:read** - View portal access details
- **clients:ratings:read** - View visit ratings
- **clients:schedule:read** - View schedule change requests
- **clients:schedule:approve** - Approve/deny schedule requests
- **clients:video:schedule** - Schedule video calls
- **clients:video:read** - View video call sessions

### Self-Service Permissions

Clients can perform these actions on their own data without special permissions:
- Activate their portal access
- View their own schedule
- Rate their own visits
- Request schedule changes
- Schedule video calls with coordinators
- Update their preferences
- View their care plan
- View their dashboard

---

## Accessibility Implementation

### WCAG 2.1 AA Compliance

All frontend components must implement:

1. **Perceivable**
   - Text alternatives for non-text content
   - Captions for video calls
   - Adaptable layouts that work with assistive technology
   - Sufficient color contrast (4.5:1 minimum)

2. **Operable**
   - All functionality available via keyboard
   - No keyboard traps
   - Sufficient time for interactions
   - No seizure-inducing content

3. **Understandable**
   - Plain language care plan summaries
   - Clear error messages
   - Consistent navigation
   - Predictable interactions

4. **Robust**
   - Compatible with assistive technologies
   - Valid HTML with proper ARIA labels
   - Works across browsers and devices

### Accessibility Features API

```typescript
// Update accessibility preferences
await service.updateAccessibilityPreferences(
  clientId,
  {
    fontSize: 'X_LARGE',
    theme: 'HIGH_CONTRAST',
    reducedMotion: true,
    screenReaderMode: true,
    voiceControlEnabled: true,
    captionsEnabled: true,
    textToSpeechEnabled: true,
  },
  context
);
```

---

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Test Coverage Requirements

- **Lines**: 82%
- **Statements**: 82%
- **Branches**: 70%
- **Functions**: 87%

### Example Tests

See `src/__tests__/` for comprehensive test examples:
- `service/client-portal-service.test.ts` - Service layer tests
- `repository/client-portal-repository.test.ts` - Repository tests
- `validation/validation.test.ts` - Validation schema tests

---

## Security Considerations

### Password Requirements

Passwords must meet these requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Session Management

- Sessions expire after 24 hours of inactivity
- Session tokens are cryptographically secure (48-byte random)
- Failed login attempts trigger account lockout after 5 attempts
- Account locked for 30 minutes after lockout

### Data Protection

- All client data filtered by client ID in queries
- Sensitive fields (SSN, etc.) encrypted at rest
- Audit logging for all portal access
- Care plan access logged for compliance

---

## Integration Points

### Services to Integrate

1. **Visit Service** - Fetch upcoming/completed visits for ratings
2. **Care Plan Service** - Fetch care plans for viewing
3. **User Service** - Create client user accounts
4. **Notification Service** - Send portal invitations and updates
5. **Video Platform** - Generate video call join URLs (Zoom/Twilio/etc.)
6. **Email Service** - Send invitation and notification emails

### Example Integration

```typescript
// In service layer, integrate with visit service
async createVisitRating(clientId: string, input: CreateVisitRatingInput, context: UserContext) {
  // Verify visit belongs to client
  const visit = await this.visitService.getVisit(input.visitId);
  if (visit.clientId !== clientId) {
    throw new PermissionError('Visit does not belong to this client');
  }

  // Get caregiver ID from visit
  const caregiverId = visit.caregiverId;

  // Create rating...
}
```

---

## Future Enhancements

### Planned Features

- [ ] Video platform integration (Zoom, Twilio Video, Jitsi)
- [ ] Push notification support (via Firebase/OneSignal)
- [ ] Mobile app support (React Native)
- [ ] Voice control integration (Web Speech API)
- [ ] Care plan translation to multiple languages
- [ ] AI-powered care plan simplification
- [ ] In-app messaging with care team
- [ ] Medication reminders
- [ ] Health metrics tracking (if integrated with devices)
- [ ] Document upload (photos, forms, etc.)

### Accessibility Improvements

- [ ] Voice navigation commands
- [ ] Eye tracking support
- [ ] Switch control support
- [ ] Braille display support
- [ ] Sign language video interpretation
- [ ] Real-time translation for non-English speakers

---

## Troubleshooting

### Common Issues

**Issue:** Invitation code not found
```
Solution: Check that invitation hasn't expired (default 7 days).
Verify invitation code was copied correctly (case-sensitive).
```

**Issue:** Permission denied when accessing portal
```
Solution: Ensure user has 'CLIENT' role in UserContext.
For coordinators viewing client portal, ensure they have
'clients:portal:read' permission.
```

**Issue:** Cannot rate visit
```
Solution: Verify visit is in 'COMPLETED' status.
Check that visit hasn't already been rated (one rating per visit).
Ensure visit belongs to the client.
```

**Issue:** Video call URLs not generating
```
Solution: Configure video platform integration.
Set platform credentials in environment variables.
Verify platform API is accessible.
```

---

## Contributing

### Adding New Features

1. **Types** - Define TypeScript interfaces in `src/types/`
2. **Validation** - Add Zod schemas in `src/validation/`
3. **Repository** - Implement data access in `src/repository/`
4. **Service** - Add business logic in `src/service/`
5. **Handlers** - Create API handlers in `src/api/`
6. **Routes** - Register routes in `src/api/routes.ts`
7. **Tests** - Write comprehensive tests in `src/__tests__/`
8. **Documentation** - Update this README

### Code Style

- Follow existing patterns in the codebase
- Use TypeScript strict mode (no `any` types)
- Write JSDoc comments for public methods
- Keep functions focused and single-purpose
- Use descriptive variable names

### Testing Requirements

- All new features must have tests
- Maintain coverage thresholds
- Test permission checks thoroughly
- Test error cases and edge cases

---

## License

MIT License - See LICENSE file for details

---

## Support

For questions or issues:
- **GitHub Issues**: https://github.com/neighborhood-lab/care-commons/issues
- **Documentation**: https://docs.carecommons.org
- **Email**: support@carecommons.org

---

**Last Updated:** 2025-11-15
**Maintainer:** Care Commons Team
**Version:** 0.1.0
