# [STATE NAME] Compliance Test Scenarios

**State Code**: [XX]  
**Last Updated**: [YYYY-MM-DD]  
**Test Coverage**: [XX]%

## Overview

This document contains comprehensive test scenarios for [STATE] regulatory compliance requirements. Every requirement documented in [REQUIREMENTS.md](./REQUIREMENTS.md) must have corresponding test scenarios.

---

## 1. Caregiver Credentials

### 1.1 Background Screening

#### Test Case: BS-001 - No Background Check on File
**Requirement**: [Reference to REQUIREMENTS.md section]  
**Priority**: High  
**Type**: Blocking Validation

**Given**: A caregiver with no background check record  
**When**: System attempts to assign caregiver to visit  
**Then**: 
- Assignment is blocked
- Error message displays: "Cannot assign caregiver - no background screening on file"
- Regulation cited: [State Code §X.XXX]
- Remediation: "Complete background screening before assignment"

**Test Data**:
```typescript
const caregiver = {
  id: 'test-caregiver-1',
  background_check_date: null,
  background_check_status: null,
};
```

**Assertion**:
```typescript
expect(result.canAssign).toBe(false);
expect(result.issues).toContainEqual({
  type: '[STATE]_BACKGROUND_MISSING',
  severity: 'BLOCKING',
  regulation: '[State Code §X.XXX]',
});
```

---

#### Test Case: BS-002 - Expired Background Check
**Requirement**: [Reference]  
**Priority**: High  
**Type**: Blocking Validation

**Given**: A caregiver with background check older than [X years]  
**When**: System attempts to assign caregiver to visit  
**Then**: 
- Assignment is blocked
- Error message displays expiration details
- Shows days since expiration

**Test Data**:
```typescript
const caregiver = {
  id: 'test-caregiver-2',
  background_check_date: subDays(new Date(), 730), // 2 years old
  background_check_status: 'CLEAR',
  background_check_expiration: subDays(new Date(), 365), // Expired 1 year ago
};
```

**Assertion**:
```typescript
expect(result.canAssign).toBe(false);
expect(result.issues).toContainEqual({
  type: '[STATE]_BACKGROUND_EXPIRED',
  severity: 'BLOCKING',
  message: expect.stringContaining('expired'),
});
```

---

#### Test Case: BS-003 - Background Check Expiring Soon
**Requirement**: [Reference]  
**Priority**: Medium  
**Type**: Warning

**Given**: A caregiver with background check expiring in 20 days  
**When**: System attempts to assign caregiver to visit  
**Then**: 
- Assignment is allowed
- Warning message displays
- Renewal reminder sent

**Test Data**:
```typescript
const caregiver = {
  id: 'test-caregiver-3',
  background_check_date: subDays(new Date(), 345), // 345 days old
  background_check_status: 'CLEAR',
  background_check_expiration: addDays(new Date(), 20), // Expires in 20 days
};
```

**Assertion**:
```typescript
expect(result.canAssign).toBe(true);
expect(result.issues).toContainEqual({
  type: '[STATE]_BACKGROUND_EXPIRING_SOON',
  severity: 'WARNING',
  message: expect.stringContaining('expires in 20 days'),
});
```

---

#### Test Case: BS-004 - Valid Background Check
**Requirement**: [Reference]  
**Priority**: High  
**Type**: Acceptance

**Given**: A caregiver with current, clear background check  
**When**: System attempts to assign caregiver to visit  
**Then**: 
- Assignment is allowed
- No blocking issues
- May have informational notices

**Test Data**:
```typescript
const caregiver = {
  id: 'test-caregiver-4',
  background_check_date: subDays(new Date(), 90), // 90 days old
  background_check_status: 'CLEAR',
  background_check_expiration: addDays(new Date(), 275), // 275 days remaining
};
```

**Assertion**:
```typescript
expect(result.canAssign).toBe(true);
expect(result.issues.filter(i => i.severity === 'BLOCKING')).toHaveLength(0);
```

---

#### Test Case: BS-005 - Background Check with Issues
**Requirement**: [Reference]  
**Priority**: High  
**Type**: Blocking Validation

**Given**: A caregiver with issues on background check  
**When**: System attempts to assign caregiver to visit  
**Then**: 
- Assignment is permanently blocked
- Cannot be overridden by supervisor
- Requires compliance review

**Test Data**:
```typescript
const caregiver = {
  id: 'test-caregiver-5',
  background_check_date: new Date(),
  background_check_status: 'ISSUES',
  background_check_notes: 'Disqualifying offense found',
};
```

**Assertion**:
```typescript
expect(result.canAssign).toBe(false);
expect(result.issues[0].canBeOverridden).toBe(false);
expect(result.issues[0].requiresComplianceReview).toBe(true);
```

---

#### Test Case: BS-006 - Pending Background Check
**Requirement**: [Reference]  
**Priority**: High  
**Type**: Blocking Validation

**Given**: A caregiver with pending background check  
**When**: System attempts to assign caregiver to visit  
**Then**: 
- Assignment is blocked
- Can be assigned once results received
- Pending status displayed

**Test Data**:
```typescript
const caregiver = {
  id: 'test-caregiver-6',
  background_check_date: subDays(new Date(), 5),
  background_check_status: 'PENDING',
};
```

**Assertion**:
```typescript
expect(result.canAssign).toBe(false);
expect(result.issues).toContainEqual({
  type: '[STATE]_BACKGROUND_PENDING',
  severity: 'BLOCKING',
  message: 'Background check results pending',
});
```

---

### 1.2 Professional Licensure

#### Test Case: LIC-001 - Active License
**Requirement**: [Reference]  
**Priority**: High  
**Type**: Acceptance

**Given**: An RN with active, current license  
**When**: System assigns RN to skilled nursing visit  
**Then**: 
- Assignment is allowed
- License verified
- No blocking issues

---

#### Test Case: LIC-002 - Expired License
**Requirement**: [Reference]  
**Priority**: High  
**Type**: Blocking Validation

**Given**: An RN with expired license  
**When**: System attempts to assign RN to visit  
**Then**: 
- Assignment is blocked for all visits
- Error shows license expiration date
- Remediation: Renew license

---

#### Test Case: LIC-003 - Role Mismatch
**Requirement**: [Reference]  
**Priority**: High  
**Type**: Blocking Validation

**Given**: An LPN assigned to RN-only task (IV therapy)  
**When**: System attempts to create visit  
**Then**: 
- Assignment is blocked
- Error: "Task requires RN license, caregiver is LPN"
- Suggests qualified alternatives

---

#### Test Case: LIC-004 - Out-of-State License Without Reciprocity
**Requirement**: [Reference]  
**Priority**: High  
**Type**: Blocking Validation

**Given**: A caregiver with license from non-reciprocal state  
**When**: System attempts to assign to visit in [THIS STATE]  
**Then**: 
- Assignment is blocked
- Error: "License from [OTHER STATE] not valid in [THIS STATE]"
- Remediation: Obtain [THIS STATE] license or reciprocity

---

### 1.3 Registry Checks

#### Test Case: REG-001 - Clear on All Registries
**Given**: Caregiver clear on all required registries  
**Then**: Assignment allowed

#### Test Case: REG-002 - Listed on Abuse Registry
**Given**: Caregiver listed on abuse/neglect registry  
**Then**: Permanent block, cannot be overridden

#### Test Case: REG-003 - Expired Registry Check
**Given**: Registry check older than required frequency  
**Then**: Block until re-verified

#### Test Case: REG-004 - Name Change Verification
**Given**: Caregiver with recent name change  
**Then**: Require verification under both names

---

## 2. Client Authorization

### 2.1 Service Authorization

#### Test Case: AUTH-001 - Valid Authorization
**Given**: Client with active authorization covering service  
**When**: Schedule visit within authorization dates and units  
**Then**: Visit creation allowed

#### Test Case: AUTH-002 - Expired Authorization
**Given**: Client with expired authorization  
**When**: Attempt to schedule visit  
**Then**: 
- Visit creation blocked
- Error: "Authorization expired on [DATE]"
- Suggest contacting payor for renewal

#### Test Case: AUTH-003 - Exceeding Authorized Units
**Given**: Client with 100 authorized hours, 95 already used  
**When**: Attempt to schedule 10-hour visit  
**Then**: 
- Visit creation blocked
- Error: "Would exceed authorized units (5 hours remaining)"
- Suggest requesting additional authorization

#### Test Case: AUTH-004 - Authorization Near Limit (Warning)
**Given**: Client with authorization at 90% utilization  
**When**: View client dashboard  
**Then**: 
- Warning displayed
- "Authorization 90% consumed - request renewal"
- Auto-notification to care coordinator

#### Test Case: AUTH-005 - Non-Authorized Service
**Given**: Client authorized for personal care only  
**When**: Attempt to schedule skilled nursing visit  
**Then**: 
- Visit creation blocked
- Error: "Skilled nursing not authorized"
- List authorized services

---

### 2.2 Plan of Care

#### Test Case: POC-001 - Current Plan of Care
**Given**: Client with plan of care reviewed within required timeframe  
**Then**: Service delivery allowed

#### Test Case: POC-002 - Plan of Care Review Due
**Given**: Client with plan of care due for review in 5 days  
**Then**: 
- Warning displayed
- Service still allowed
- Alert sent to supervisor

#### Test Case: POC-003 - Plan of Care Overdue
**Given**: Client with plan of care overdue for review  
**Then**: 
- Service blocked
- Error: "Plan of care review overdue by [X] days"
- Must complete review before continuing service

#### Test Case: POC-004 - Expired Physician Orders
**Given**: Client with physician orders expired  
**Then**: 
- Service blocked
- Require new physician signature
- Cannot override

---

## 3. Visit Documentation

### 3.1 Required Documentation

#### Test Case: DOC-001 - Complete Documentation
**Given**: Visit with all required fields completed  
**Then**: Visit can be marked complete

#### Test Case: DOC-002 - Missing Required Field
**Given**: Visit missing required documentation field  
**When**: Attempt to mark visit complete  
**Then**: 
- Completion blocked
- List missing required fields
- Highlight fields in UI

#### Test Case: DOC-003 - Late Documentation
**Given**: Visit completed 48 hours ago without documentation  
**When**: Attempt to complete documentation now  
**Then**: 
- Documentation allowed with supervisor approval
- Late documentation flag set
- Supervisor notification sent
- Reason required

#### Test Case: DOC-004 - Visit Notes Quality Check
**Given**: Visit notes with blocked phrase "Client fine"  
**When**: Submit documentation  
**Then**: 
- Warning displayed
- Suggest more specific description
- May require supervisor review

---

## 4. Electronic Visit Verification (EVV)

### 4.1 Geofence Compliance

#### Test Case: EVV-001 - Clock-In Inside Geofence
**Given**: Caregiver at client's address (within geofence)  
**When**: Clock in to visit  
**Then**: 
- Clock-in accepted
- Location verified
- GPS coordinates logged

**Test Data**:
```typescript
const clientLocation = { lat: 40.7128, lng: -74.0060 }; // NYC example
const geofence = { radius: 100, tolerance: 50 }; // 150m total
const clockInLocation = { lat: 40.7129, lng: -74.0061 }; // ~12m away
```

**Assertion**:
```typescript
expect(result.locationVerified).toBe(true);
expect(result.distanceFromGeofence).toBeLessThan(150);
```

---

#### Test Case: EVV-002 - Clock-In Outside Geofence
**Given**: Caregiver 300m from client's address  
**When**: Attempt to clock in  
**Then**: 
- Clock-in blocked
- Error: "You are 300m from service location"
- Show map with current position and geofence
- Allow supervisor override with reason

**Test Data**:
```typescript
const clientLocation = { lat: 40.7128, lng: -74.0060 };
const geofence = { radius: 100, tolerance: 50 };
const clockInLocation = { lat: 40.7155, lng: -74.0060 }; // ~300m north
```

**Assertion**:
```typescript
expect(result.locationVerified).toBe(false);
expect(result.issues).toContainEqual({
  type: 'GEOFENCE_VIOLATION',
  severity: 'BLOCKING',
  distance: expect.toBeGreaterThan(250),
});
```

---

#### Test Case: EVV-003 - Clock-In Within Tolerance
**Given**: Caregiver 140m from client's address (within tolerance)  
**When**: Clock in  
**Then**: 
- Clock-in accepted with warning
- "You are near the edge of the geofence"
- GPS accuracy checked

**Test Data**:
```typescript
const clockInLocation = { lat: 40.7141, lng: -74.0060 }; // ~145m north
const gpsAccuracy = 20; // meters
const effectiveTolerance = 150; // base 100 + tolerance 50
```

**Assertion**:
```typescript
expect(result.locationVerified).toBe(true);
expect(result.issues).toContainEqual({
  type: 'GEOFENCE_EDGE_WARNING',
  severity: 'WARNING',
});
```

---

### 4.2 Grace Periods

#### Test Case: EVV-004 - Clock-In Within Grace Period
**Given**: Visit scheduled for 10:00 AM, grace period 10 minutes  
**When**: Clock in at 10:08 AM  
**Then**: 
- Clock-in accepted
- No late flag
- Grace period noted in record

**Test Data**:
```typescript
const scheduledStart = new Date('2025-11-05T10:00:00');
const clockInTime = new Date('2025-11-05T10:08:00');
const gracePeriodMinutes = 10;
```

**Assertion**:
```typescript
expect(result.accepted).toBe(true);
expect(result.withinGracePeriod).toBe(true);
expect(result.lateFlag).toBe(false);
```

---

#### Test Case: EVV-005 - Clock-In Outside Grace Period
**Given**: Visit scheduled for 10:00 AM, grace period 10 minutes  
**When**: Clock in at 10:15 AM  
**Then**: 
- Clock-in accepted with late flag
- Reason required
- Supervisor notification
- May affect billing

**Test Data**:
```typescript
const scheduledStart = new Date('2025-11-05T10:00:00');
const clockInTime = new Date('2025-11-05T10:15:00');
const gracePeriodMinutes = 10;
```

**Assertion**:
```typescript
expect(result.accepted).toBe(true);
expect(result.withinGracePeriod).toBe(false);
expect(result.lateFlag).toBe(true);
expect(result.requiresExplanation).toBe(true);
```

---

### 4.3 Manual Overrides

#### Test Case: EVV-006 - Valid Override Scenario
**Given**: GPS malfunction in rural area  
**When**: Supervisor approves manual override  
**Then**: 
- Override accepted
- Reason logged
- Supervisor approval documented
- Audit trail complete

**Test Data**:
```typescript
const override = {
  reason: 'GPS_MALFUNCTION',
  explanation: 'Client in rural area, known GPS dead zone',
  approvedBy: 'supervisor-123',
  approvalDate: new Date(),
  documentation: 'screenshot-of-gps-error.png',
};
```

**Assertion**:
```typescript
expect(result.overrideApproved).toBe(true);
expect(result.auditTrail).toContain('supervisor-123');
expect(result.submittedToAggregator).toBe(true);
```

---

#### Test Case: EVV-007 - Invalid Override Attempt
**Given**: Repeated override requests for same caregiver  
**When**: Supervisor attempts to approve 10th override this month  
**Then**: 
- Warning displayed
- "Excessive overrides - possible fraud pattern"
- Compliance review required
- May still approve with justification

---

### 4.4 Aggregator Submission

#### Test Case: EVV-008 - Successful Aggregator Submission
**Given**: Complete EVV record with all six data elements  
**When**: Submit to state aggregator  
**Then**: 
- Submission accepted
- Confirmation ID received
- Status updated to SUBMITTED
- Timestamp logged

---

#### Test Case: EVV-009 - Aggregator Submission Failure
**Given**: Network error during submission  
**When**: Attempt to submit to aggregator  
**Then**: 
- Retry with exponential backoff
- Queue for batch submission
- Alert if fails after retries
- Do not block caregiver from other visits

---

#### Test Case: EVV-010 - Aggregator Rejection
**Given**: EVV record missing required field for aggregator  
**When**: Submit to aggregator  
**Then**: 
- Submission rejected
- Error message from aggregator logged
- Flag visit for correction
- Notify supervisor

---

## 5. Data Retention

#### Test Case: RET-001 - Data Within Retention Period
**Given**: Visit record from 2 years ago (retention: 6 years)  
**Then**: Data accessible, cannot be permanently deleted

#### Test Case: RET-002 - Data Beyond Retention Period
**Given**: Visit record from 8 years ago (retention: 6 years)  
**Then**: Eligible for permanent deletion, archive first

#### Test Case: RET-003 - Soft Delete
**Given**: Request to delete recent visit record  
**Then**: Soft delete only, mark as deleted but retain data

---

## 6. Privacy & Security

#### Test Case: SEC-001 - Role-Based Access
**Given**: Field staff trying to access billing data  
**Then**: Access denied, insufficient permissions

#### Test Case: SEC-002 - Audit Trail
**Given**: Supervisor accessing client PHI  
**Then**: Access logged with timestamp, user, and reason

#### Test Case: SEC-003 - Field-Level Permissions
**Given**: User viewing client record  
**Then**: SSN/Medicaid ID masked based on role permissions

---

## Edge Cases

### Edge Case 1: Multiple State Operations
**Scenario**: Agency operates in [STATE] and neighboring state  
**Test**: Ensure correct state rules applied based on service location  
**Expected**: [STATE] rules for [STATE] visits, other state rules for other visits

### Edge Case 2: State Border Proximity
**Scenario**: Client address near state border, GPS places visit in wrong state  
**Test**: Geofence validation against state boundaries  
**Expected**: Warning if coordinates outside state, require verification

### Edge Case 3: Daylight Saving Time
**Scenario**: Clock-in during DST transition  
**Test**: Ensure timestamps handled correctly  
**Expected**: UTC timestamps, local display adjusted, no duplicate/missing hours

### Edge Case 4: Leap Year
**Scenario**: Credential expiration calculation on Feb 29  
**Test**: Ensure expiration dates calculated correctly  
**Expected**: Correct expiration even in leap years

### Edge Case 5: Name Changes
**Scenario**: Caregiver name change due to marriage  
**Test**: Background check verification under both names  
**Expected**: Re-verification required, both names checked

---

## Performance Tests

### Performance Test 1: Bulk Validation
**Scenario**: Validate 100 caregivers for assignments simultaneously  
**Expected**: Complete in <1 second  
**Acceptance**: Each validation <10ms

### Performance Test 2: Aggregator Batch Submission
**Scenario**: Submit 1000 EVV records to aggregator  
**Expected**: Complete in <30 seconds  
**Acceptance**: No timeouts, all records queued

### Performance Test 3: Real-Time Clock-In
**Scenario**: 50 caregivers clocking in simultaneously at 9:00 AM  
**Expected**: All clock-ins processed in <5 seconds  
**Acceptance**: No failed clock-ins due to load

---

## Integration Tests

### Integration Test 1: End-to-End Visit Workflow
**Scenario**: Create visit → assign caregiver → clock in → provide service → clock out → document → submit EVV  
**Expected**: All compliance checks pass, EVV submitted successfully

### Integration Test 2: Multi-State Agency
**Scenario**: Agency with offices in 3 states, validate correct rules per state  
**Expected**: State-specific validators applied correctly

---

## Regression Tests

These tests must pass after ANY code change:

- [ ] All background check scenarios
- [ ] All licensure scenarios
- [ ] All authorization scenarios
- [ ] All geofence scenarios
- [ ] All grace period scenarios
- [ ] All manual override scenarios
- [ ] All aggregator submission scenarios

---

## Test Coverage Requirements

- **Critical Paths**: 100% coverage required
- **Blocking Validations**: 100% coverage required
- **Edge Cases**: 80% coverage minimum
- **Performance Tests**: Must run in CI/CD
- **Integration Tests**: Must run before deployment

---

## Test Data Management

### Test Caregivers
- `test-caregiver-valid`: All credentials current
- `test-caregiver-expired-bg`: Expired background check
- `test-caregiver-no-license`: Missing licensure
- `test-caregiver-abuse-registry`: Listed on abuse registry

### Test Clients
- `test-client-valid-auth`: Current authorization
- `test-client-expired-auth`: Expired authorization
- `test-client-near-limit`: Authorization 95% consumed
- `test-client-no-poc`: Missing plan of care

### Test Visits
- `test-visit-standard`: Standard personal care visit
- `test-visit-skilled`: Skilled nursing visit
- `test-visit-rural`: Rural location (GPS challenges)
- `test-visit-urban`: Urban location (multi-story building)

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
