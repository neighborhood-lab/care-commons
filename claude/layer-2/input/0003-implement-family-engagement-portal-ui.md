# Task 0003: Implement Family Engagement Portal Frontend UI

**Priority**: 🟠 HIGH
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 10-14 hours

## Context

The family engagement vertical has a complete backend with portal access, notifications, activity feeds, and messaging. The frontend needs to be built to provide family members with transparency into their loved one's care.

## Existing Backend

- ✅ Database schema: `family_members`, `portal_sessions`, `family_notifications`, `activity_feeds`, `family_messages`
- ✅ API routes: Portal authentication, activity feed, notifications, messaging
- ✅ Services: Family portal service, notification service, messaging service
- ✅ Types: Defined in `verticals/family-engagement/src/types/`

## Task

### 1. Create Portal Layout

**Family Portal Layout** (`packages/web/src/app/layouts/FamilyPortalLayout.tsx`):
- Simplified navigation for non-technical users
- Client name/photo in header
- Notification bell with unread count
- Logout option
- Mobile-friendly drawer navigation

### 2. Create Core Components

**Activity Feed Components** (`packages/web/src/app/pages/family-portal/components/`):
- `ActivityFeed.tsx` - Timeline of care activities (visits, tasks completed, notes)
- `ActivityCard.tsx` - Single activity item with icon, timestamp, details
- `ActivityFilters.tsx` - Filter by date range, activity type

**Notification Components**:
- `NotificationList.tsx` - List of notifications
- `NotificationBell.tsx` - Header notification icon with badge
- `NotificationSettings.tsx` - Manage notification preferences

**Messaging Components**:
- `MessageThread.tsx` - Conversation with care team
- `MessageComposer.tsx` - Send new message
- `MessageList.tsx` - List of conversations

**Care Overview Components**:
- `CareSummary.tsx` - High-level overview (upcoming visits, recent activities)
- `CareTeamCard.tsx` - Display assigned caregivers with photos
- `UpcomingVisits.tsx` - Next 7 days of scheduled visits

### 3. Create Pages

- `packages/web/src/app/pages/family-portal/FamilyDashboard.tsx` - Main family dashboard
- `packages/web/src/app/pages/family-portal/ActivityPage.tsx` - Full activity feed
- `packages/web/src/app/pages/family-portal/MessagesPage.tsx` - Messaging interface
- `packages/web/src/app/pages/family-portal/NotificationsPage.tsx` - All notifications

### 4. Create Simplified Authentication

**Family Portal Auth** (`packages/web/src/app/pages/family-portal/auth/`):
- `FamilyLoginPage.tsx` - Simplified login (email + secure code)
- No password required - use magic link or SMS code
- Session management with auto-logout after inactivity

### 5. Add API Integration

Create service hooks:
- `useFamilyPortal.ts` - Activity feed, care summary
- `useFamilyNotifications.ts` - Notifications CRUD
- `useFamilyMessages.ts` - Messaging functionality

### 6. Add Routes

```typescript
{
  path: '/family-portal',
  element: <FamilyPortalLayout />,
  children: [
    { index: true, element: <FamilyDashboard /> },
    { path: 'activity', element: <ActivityPage /> },
    { path: 'messages', element: <MessagesPage /> },
    { path: 'notifications', element: <NotificationsPage /> }
  ]
}
```

### 7. Real-Time Updates

- Use React Query polling for activity feed (30-second interval)
- WebSocket support for instant messaging (future enhancement - document in README)
- Notification badge updates in real-time

### 8. Privacy & Consent

- Display consent status for data sharing
- Allow family members to manage their communication preferences
- Show privacy policy link

## User Stories

1. **As a family member**, I can log into a simple portal to see my loved one's care activities
2. **As a family member**, I can view upcoming scheduled visits
3. **As a family member**, I can see which caregivers are on the care team
4. **As a family member**, I can receive notifications about important care events
5. **As a family member**, I can send messages to the coordinator
6. **As a family member**, I can view completed tasks and care notes (with appropriate permissions)

## Design Considerations

- **Simplified UX**: Family members are non-technical, prioritize clarity over features
- **Large Touch Targets**: Many users are elderly on mobile devices
- **Clear Language**: No medical jargon, plain language explanations
- **Reassuring Design**: Calm colors, friendly tone, trustworthy appearance
- **Accessibility**: High contrast, large fonts, screen reader support

## Acceptance Criteria

- [ ] Family portal layout and navigation created
- [ ] All core components implemented
- [ ] Simplified authentication flow working
- [ ] Activity feed displays real data
- [ ] Notifications system functional
- [ ] Messaging interface working
- [ ] Mobile responsive with large touch targets
- [ ] Real-time polling for updates
- [ ] Privacy and consent UI
- [ ] Tests for critical components
- [ ] Works end-to-end in local dev environment

## Backend API Reference

- Family Portal API: `verticals/family-engagement/src/routes/portal.routes.ts`
- Notifications API: `verticals/family-engagement/src/routes/notifications.routes.ts`
- Messaging API: `verticals/family-engagement/src/routes/messages.routes.ts`
- Types: `verticals/family-engagement/src/types/`

## Reference

- Look at consumer health apps (e.g., patient portals) for UX patterns
- Follow WCAG AA accessibility standards
- Test with actual family members if possible (user testing)
