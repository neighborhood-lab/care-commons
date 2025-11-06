# Task 0004: Mobile App - Complete Visit Workflow Screens

**Priority**: 🟠 HIGH
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 12-16 hours

## Context

The mobile app has a solid foundation with `TodayVisitsScreen` fully implemented as a reference. Other visit workflow screens need to be built following the same patterns. The backend EVV and visit APIs are complete.

## Existing Reference

- ✅ `TodayVisitsScreen` - Fully implemented (use as template)
- ✅ WatermelonDB models defined
- ✅ Offline sync working
- ✅ GPS and biometric verification working

## Task

### 1. Implement Visit Detail Screen

**File**: `packages/mobile/src/screens/visits/VisitDetailScreen.tsx`

**Features**:
- Display full visit details (client, time, services, notes)
- Show client address with "Get Directions" button (open native maps)
- Display assigned tasks for the visit
- Show visit status and timeline (scheduled → en route → in progress → completed)
- "Start Visit" button with GPS check-in
- "End Visit" button with GPS check-out
- Offline-first (works without connection)

**UI Components**:
- Visit info card (client name, address, scheduled time)
- Service list (what services to provide)
- Task checklist (tasks to complete during visit)
- Status timeline indicator
- Action buttons (start, end, call client, get directions)

### 2. Implement Visit Check-In Screen

**File**: `packages/mobile/src/screens/visits/VisitCheckInScreen.tsx`

**Features**:
- GPS location capture and validation
- Geofence check (within configured radius of client address)
- Mock location detection (security)
- Biometric verification (fingerprint/Face ID)
- Photo capture option (proof of presence)
- Offline support (queue check-in for later sync)

**Validation**:
- Verify caregiver is at correct location
- Verify check-in within scheduled time window (or allow with warning)
- Display warning if outside geofence
- Block if mock location detected

### 3. Implement Visit Documentation Screen

**File**: `packages/mobile/src/screens/visits/VisitDocumentationScreen.tsx`

**Features**:
- Task completion checklist
- Care notes entry (text area with voice-to-text option)
- Vital signs recording (if applicable)
- Incident reporting (optional)
- Photo documentation (before/after photos)
- Signature capture (caregiver and client/family)

**UX**:
- Autosave drafts to local DB
- Validation before allowing check-out
- Clear required vs optional fields
- Mobile-optimized form inputs

### 4. Implement Visit Check-Out Screen

**File**: `packages/mobile/src/screens/visits/VisitCheckOutScreen.tsx`

**Features**:
- GPS location capture and validation
- Biometric verification
- Summary of completed tasks
- Confirm all documentation complete
- Calculate total visit duration
- Submit visit for coordinator review
- Offline support (queue for later sync)

**Validation**:
- All required tasks marked complete
- Care notes entered
- Required signatures captured
- Minimum visit duration met (with override option)

### 5. Implement Visit History Screen

**File**: `packages/mobile/src/screens/visits/VisitHistoryScreen.tsx`

**Features**:
- List of past visits (last 30 days)
- Filter by client, date range, status
- Search functionality
- View visit details (read-only)
- Export visit summaries (for payroll disputes)

### 6. Update Navigation

**File**: `packages/mobile/src/navigation/AppNavigator.tsx`

Add routes:
```typescript
<Stack.Screen name="VisitDetail" component={VisitDetailScreen} />
<Stack.Screen name="VisitCheckIn" component={VisitCheckInScreen} />
<Stack.Screen name="VisitDocumentation" component={VisitDocumentationScreen} />
<Stack.Screen name="VisitCheckOut" component={VisitCheckOutScreen} />
<Stack.Screen name="VisitHistory" component={VisitHistoryScreen} />
```

### 7. Add WatermelonDB Queries

Create query helpers in `packages/mobile/src/database/queries/`:
- `visitQueries.ts` - Queries for visits (today, upcoming, past, by client)
- `taskQueries.ts` - Queries for tasks (by visit, by status)

### 8. Add Offline Sync Logic

Ensure these actions queue for sync when offline:
- Check-in
- Check-out
- Task completion
- Care notes
- Signatures

## User Stories

1. **As a caregiver**, I can view full visit details including client info and assigned tasks
2. **As a caregiver**, I can check in to a visit with GPS and biometric verification
3. **As a caregiver**, I can document care activities and complete tasks during the visit
4. **As a caregiver**, I can capture signatures from clients/family members
5. **As a caregiver**, I can check out of a visit and submit for review
6. **As a caregiver**, I can view my visit history and export summaries
7. **As a caregiver**, all visit workflows work offline and sync when connection restored

## Acceptance Criteria

- [ ] All 5 screens implemented and functional
- [ ] Navigation between screens working
- [ ] GPS check-in/check-out with geofencing
- [ ] Biometric verification integrated
- [ ] Task completion and documentation working
- [ ] Signature capture working
- [ ] Offline support for all workflows
- [ ] WatermelonDB queries optimized
- [ ] Loading states and error handling
- [ ] Works on both iOS and Android
- [ ] Tests for critical workflows

## Testing Checklist

- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test offline mode (airplane mode)
- [ ] Test GPS accuracy with real locations
- [ ] Test biometric (fingerprint, Face ID)
- [ ] Test mock location detection
- [ ] Test sync after coming back online

## Reference Implementation

Use `TodayVisitsScreen` as the reference for:
- WatermelonDB integration
- Offline-first patterns
- UI/UX styling
- Error handling
- Loading states

## Backend API Reference

- Visits API: `verticals/scheduling-visits/src/routes/visits.routes.ts`
- EVV API: `verticals/time-tracking-evv/src/routes/evv.routes.ts`
- Tasks API: `verticals/care-plans-tasks/src/routes/tasks.routes.ts`
