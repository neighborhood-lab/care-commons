# Task 0055: Mobile ClockInScreen Implementation

**Priority**: 🟠 MEDIUM (Feature Completion)
**Category**: Mobile / Frontend
**Estimated Effort**: 2-3 days

## Context

Mobile foundation is complete with LoginScreen and TodayVisitsScreen as reference implementations. ClockInScreen is currently a placeholder (41 lines at `packages/mobile/src/screens/visits/ClockInScreen.tsx`).

## Objective

Implement full ClockInScreen with GPS verification, geofencing, offline support, and photo capture.

## Requirements

1. **GPS Verification**: Verify caregiver is at client location (within 200m radius)
2. **Geofencing**: Visual indicator showing proximity to client
3. **Offline Support**: Queue clock-in if offline, sync when online
4. **Photo Capture**: Optional photo for verification (some states require)
5. **Biometric Confirmation**: Touch ID/Face ID before clock-in
6. **Error Handling**: Clear messages for GPS issues, distance violations, etc.

## Implementation

**File**: `packages/mobile/src/screens/visits/ClockInScreen.tsx`

**Key Components**:
- GPS location service integration
- Distance calculation (Haversine formula)
- Camera integration for photo capture
- Biometric authentication prompt
- Offline queue management
- Real-time geofence visualization

**API Integration**:
- POST `/api/evv/clock-in` with GPS coordinates
- Handle EVV validation errors
- Store EVV ID for clock-out

**Reference**: Use `TodayVisitsScreen.tsx` (370 lines) as pattern for API calls and offline handling.

## Success Criteria

- [ ] GPS location accurately captured
- [ ] Distance validation works (reject if > 200m from client)
- [ ] Photo capture optional but functional
- [ ] Works offline (queues for later sync)
- [ ] Biometric confirmation required
- [ ] Loading states and error messages clear
- [ ] Matches iOS and Android design guidelines
