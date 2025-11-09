# TX/FL Implementation Status

## Overview
This document tracks the implementation status of Texas and Florida state-specific requirements for the Scheduling & Visit Management and Time Tracking & EVV verticals.

**Last Updated:** 2024-01-25

---

## ✅ Completed Work

### 1. State-Specific Type Definitions
**Location:** `verticals/time-tracking-evv/src/types/state-specific.ts`

Comprehensive type definitions for TX/FL EVV requirements:
- ✅ Texas EVV configuration (`TexasEVVConfig`)
- ✅ Texas Medicaid program types (`TexasMedicaidProgram`)
- ✅ Texas clock methods (`TexasClockMethod`)
- ✅ Texas VMUR (Visit Maintenance Unlock Request) system
- ✅ Florida EVV configuration with multi-aggregator support
- ✅ Florida Medicaid programs (`FloridaMedicaidProgram`)
- ✅ Florida MCO-specific requirements
- ✅ State-specific validation rules helpers
- ✅ Aggregator submission tracking

### 2. EVV Revision & Audit Trail System
**Location:** `verticals/time-tracking-evv/src/types/evv-revisions.ts`

Immutable audit trail implementation per TX/FL compliance:
- ✅ `EVVRevision` type for tracking all record changes
- ✅ `EVVOriginalData` for immutable baseline storage
- ✅ `EVVAuditTrail` for complete change history
- ✅ `EVVAccessLog` for HIPAA-compliant access tracking
- ✅ `EVVRevisionRequest` for approval workflows
- ✅ `EVVExceptionQueueItem` for anomaly management
- ✅ Revision types covering all correction scenarios
- ✅ Approval workflow types

### 3. Database Migrations
**Location:** `packages/core/migrations/010_state_specific_evv.sql`

Production-ready database schema:
- ✅ `evv_state_config` - State-specific EVV configuration per organization
- ✅ `evv_revisions` - Append-only audit trail with integrity chain
- ✅ `evv_original_data` - Immutable baseline data (never modified)
- ✅ `evv_access_log` - HIPAA-compliant access tracking
- ✅ `texas_vmur` - Texas Visit Maintenance Unlock Requests
- ✅ `state_aggregator_submissions` - Aggregator submission tracking
- ✅ `evv_exception_queue` - Exception queue with SLA tracking
- ✅ Comprehensive indexes for performance
- ✅ Triggers for auto-increment revision numbers
- ✅ Foreign key constraints for data integrity

### 4. Provider Interface Definitions
**Location:** `verticals/time-tracking-evv/src/interfaces/visit-provider.ts`

Clean integration contracts:
- ✅ `IVisitProvider` - Visit data fetching from scheduling vertical
- ✅ `IClientProvider` - Client demographic data
- ✅ `ICaregiverProvider` - Caregiver credential/authorization checking
- ✅ `EVVVisitData` - Complete visit data contract
- ✅ Authorization validation methods
- ✅ Visit status synchronization methods

---

## ✅ Recently Completed

### 1. EVV Service Integration
**Location:** `verticals/time-tracking-evv/src/service/evv-service.ts`

**Current State:** ✅ **PRODUCTION READY** - All provider interfaces fully wired with real database queries (lines 87-93)

**Completion Date:** November 6, 2025

**Implementation Details:**
```typescript
// Real provider integration (COMPLETED):
const visitData = await this.visitProvider.getVisitForEVV(input.visitId);
const client = await this.clientProvider.getClientForEVV(visitData.clientId);
const caregiver = await this.caregiverProvider.getCaregiverForEVV(input.caregiverId);

// Validate caregiver authorization with real credential checks
const authCheck = await this.caregiverProvider.canProvideService(
  input.caregiverId,
  visitData.serviceTypeCode,
  visitData.clientId
);

if (!authCheck.authorized) {
  throw new ValidationError(
    `Caregiver not authorized to provide service: ${authCheck.reason}`,
    { missingCredentials: authCheck.missingCredentials }
  );
}
```

**Implemented Features:**
1. ✅ Real visit data from scheduling vertical (`IVisitProvider`)
2. ✅ Real client data from client demographics (`IClientProvider`)
3. ✅ Real caregiver data from caregiver staff (`ICaregiverProvider`)
4. ✅ Database-backed authorization validation
5. ✅ Comprehensive error handling (NotFoundError for missing records)
6. ✅ Full test coverage with regression protection

**Verification:** See `verticals/time-tracking-evv/TASK-0000-COMPLETION.md` for detailed completion report

## 🚧 In Progress / Needs Implementation

### 1. Schedule Service Integration
**Location:** `verticals/scheduling-visits/src/service/schedule-service.ts`

**Current State:** Service contains mocked client address (lines 566-576)

**Required Actions:**
```typescript
// REPLACE: getClientAddress method
private async getClientAddress(clientId: UUID): Promise<any> {
  // TODO: Integrate with client demographics service
  // For now, return placeholder
  return {
    line1: '123 Main St', // MOCKED
    city: 'Springfield', // MOCKED
    state: 'IL', // MOCKED
    postalCode: '62701', // MOCKED
    country: 'US',
  };
}

// Should become:
private async getClientAddress(clientId: UUID): Promise<VisitAddress> {
  const client = await this.clientProvider.getClientForScheduling(clientId);
  
  if (!client.serviceAddress) {
    throw new ValidationError('Client has no service address configured');
  }
  
  // Validate address is geocoded
  if (!client.serviceAddress.latitude || !client.serviceAddress.longitude) {
    throw new ValidationError(
      'Client address must be geocoded before scheduling visits'
    );
  }
  
  return client.serviceAddress;
}
```

### 2. State-Specific Validation Enhancement
**Location:** `verticals/time-tracking-evv/src/validation/evv-validator.ts`

**Required Additions:**
```typescript
/**
 * Validate state-specific EVV requirements
 */
validateStateRequirements(
  evvRecord: EVVRecord,
  stateConfig: TexasEVVConfig | FloridaEVVConfig
): VerificationResult {
  // Texas-specific
  if (stateConfig.state === 'TX') {
    // Validate clock method is allowed
    // Validate GPS required for mobile
    // Validate grace period rules
    // Validate VMUR requirements if applicable
  }
  
  // Florida-specific
  if (stateConfig.state === 'FL') {
    // Validate aggregator selection
    // Validate MCO-specific requirements
    // Validate submission windows
  }
}

/**
 * Validate geographic requirements with state tolerance
 */
validateGeographicWithStateTolerance(
  location: LocationVerification,
  geofence: Geofence,
  stateRules: StateEVVRules
): GeofenceCheckResult {
  // Apply state-specific tolerance
  const effectiveRadius = geofence.radiusMeters + stateRules.geoFenceTolerance;
  
  // State-specific accuracy requirements
  if (location.accuracy > stateRules.minimumGPSAccuracy) {
    // Flag as requiring manual review
  }
  
  // ... implementation
}
```

### 3. Plan-of-Care Authorization Validation
**Location:** `verticals/scheduling-visits/src/service/schedule-service.ts`

**Required Implementation:**
```typescript
/**
 * Validate visit aligns with authorized plan-of-care
 */
private async validatePlanOfCareAuthorization(
  input: CreateVisitInput
): Promise<void> {
  // Fetch active care plan for client
  const carePlan = await this.carePlanProvider.getActiveCarePlan(input.clientId);
  
  if (!carePlan) {
    throw new ValidationError('No active care plan found for client');
  }
  
  // Validate service type is authorized
  const authorizedService = carePlan.authorizedServices.find(
    s => s.serviceTypeId === input.serviceTypeId
  );
  
  if (!authorizedService) {
    throw new ValidationError(
      `Service type ${input.serviceTypeName} is not authorized in care plan`
    );
  }
  
  // Validate within authorization dates
  const now = new Date();
  if (authorizedService.startDate > now || authorizedService.endDate < now) {
    throw new ValidationError('Service authorization is not currently valid');
  }
  
  // Validate units available
  if (authorizedService.unitsUsed >= authorizedService.unitsAuthorized) {
    throw new ValidationError('All authorized service units have been used');
  }
  
  // State-specific validations (TX/FL)
  await this.validateStateAuthorizationRules(
    input,
    carePlan,
    authorizedService
  );
}
```

### 4. EVV Aggregator Integration Layer
**Location:** `verticals/time-tracking-evv/src/services/aggregator-service.ts` (NEW FILE NEEDED)

**Required Implementation:**
```typescript
export class AggregatorService {
  /**
   * Submit EVV record to state aggregator
   */
  async submitToAggregator(
    evvRecord: EVVRecord,
    stateConfig: TexasEVVConfig | FloridaEVVConfig
  ): Promise<StateAggregatorSubmission> {
    // Select correct aggregator
    const aggregatorId = selectAggregator(
      stateConfig.state,
      stateConfig,
      evvRecord.payerId,
      evvRecord.mcoId
    );
    
    // Format payload per aggregator requirements
    const payload = this.formatForAggregator(evvRecord, stateConfig);
    
    // Submit via HTTP/API
    const response = await this.httpClient.post(
      stateConfig.aggregatorSubmissionEndpoint,
      payload,
      { headers: this.getAuthHeaders(stateConfig) }
    );
    
    // Track submission
    return await this.repository.createSubmission({
      evvRecordId: evvRecord.id,
      aggregatorId,
      payload,
      response,
      // ... tracking data
    });
  }
  
  /**
   * Handle aggregator webhook callbacks
   */
  async handleAggregatorCallback(
    submissionId: UUID,
    status: 'ACCEPTED' | 'REJECTED',
    response: unknown
  ): Promise<void> {
    // Update submission status
    // Create exception if rejected
    // Notify stakeholders
  }
}
```

---

## 📋 Key Integration Points Summary

### Vertical Dependencies

```
time-tracking-evv
├── REQUIRES: Visit data from scheduling-visits
│   └── Interface: IVisitProvider
├── REQUIRES: Client data from client-demographics
│   └── Interface: IClientProvider
├── REQUIRES: Caregiver data from caregiver-staff
│   └── Interface: ICaregiverProvider
└── REQUIRES: Care plan data from care-plans-tasks
    └── Interface: ICarePlanProvider (needs creation)

scheduling-visits
├── REQUIRES: Client address from client-demographics
│   └── Method: getClientForScheduling()
├── REQUIRES: Care plan authorization from care-plans-tasks
│   └── Method: getActiveCarePlan()
└── REQUIRES: Caregiver credentials from caregiver-staff
    └── Method: canProvideService()
```

### External System Dependencies

```
EVV Aggregators
├── Texas: HHAeXchange (mandatory)
│   ├── Submit EVV data
│   ├── Receive confirmation
│   └── Handle VMURs
└── Florida: Multi-aggregator
    ├── HHAeXchange
    ├── Netsmart/Tellus
    ├── iConnect
    └── Route by payer/MCO

Geocoding Service
└── Validate and geocode client addresses
    └── Required before visit scheduling

State Registry APIs
├── Texas HHSC APIs
│   ├── Employee Misconduct Registry
│   └── Nurse Aide Registry
└── Florida AHCA APIs
    └── Level 2 Background Screening
```

---

## 🎯 Recommended Implementation Order

### Phase 1: Core Integration (High Priority)
1. **Implement IVisitProvider** in scheduling-visits
   - Create concrete implementation
   - Remove mocked visit data from EVV service
   
2. **Implement IClientProvider** in client-demographics
   - Fetch client data for EVV
   - Fetch client address for scheduling
   
3. **Implement ICaregiverProvider** in caregiver-staff
   - Validate credentials and authorizations
   - Check background screening status

### Phase 2: State-Specific Validation (High Priority)
4. **Add state-specific validation to EVVValidator**
   - Geographic tolerance by state
   - Clock method validation
   - Grace period checks
   
5. **Implement plan-of-care authorization validation**
   - Create ICarePlanProvider interface
   - Validate visits against authorized services
   - Check authorization dates and units

### Phase 3: Aggregator Integration (Medium Priority)
6. **Create AggregatorService**
   - HHAeXchange integration (TX mandatory, FL optional)
   - Multi-aggregator routing for FL
   - Webhook callback handling
   
7. **Implement VMUR workflow** (Texas-specific)
   - Create request approval UI
   - Track corrections
   - Submit to aggregator

### Phase 4: Exception Queue & Reporting (Medium Priority)
8. **Build exception queue UI**
   - Dashboard for exceptions
   - Assignment workflow
   - Resolution tracking
   
9. **Create compliance reports**
   - State-specific reporting formats
   - Export to aggregator formats
   - Audit trail reports

---

## 🧪 Testing Requirements

### Unit Tests Needed
- [ ] State-specific validation logic
- [ ] Geofence tolerance calculations
- [ ] Revision integrity chain validation
- [ ] VMUR reason code validation
- [ ] Aggregator payload formatting

### Integration Tests Needed
- [ ] Complete clock-in/out workflow
- [ ] Multi-aggregator routing (FL)
- [ ] VMUR approval workflow (TX)
- [ ] Exception queue processing
- [ ] State-specific validation

### End-to-End Tests Needed
- [ ] Full visit lifecycle (TX scenario)
- [ ] Full visit lifecycle (FL scenario)
- [ ] EVV anomaly detection and resolution
- [ ] Aggregator submission and callback
- [ ] Compliance report generation

---

## 📦 Seed Data Requirements

### Texas Scenario
- Organization with TX state config
- Clients with TX Medicaid IDs
- STAR+PLUS program configuration
- Caregivers with TX registry clearances
- Visits with GPS-based EVV
- Sample VMUR corrections

### Florida Scenario
- Organization with FL state config
- Clients with FL Medicaid IDs
- SMMC LTC program configuration
- Caregivers with Level 2 screening clearances
- Multi-aggregator setup
- MCO-specific requirements

---

## ⚠️ Critical Compliance Notes

### Texas Specifics
1. **MANDATORY** GPS for mobile visits per HHSC policy
2. **MANDATORY** VMUR for corrections after 30 days
3. **MANDATORY** HHAeXchange aggregator submission
4. Grace periods: 10 min clock-in, 10 min clock-out
5. Geofence tolerance: 100m base + 50m GPS accuracy
6. Data retention: Minimum 6 years

### Florida Specifics
1. **FLEXIBLE** EVV vendor choice (open model)
2. **REQUIRED** Six Cures Act data elements
3. **REQUIRED** Multi-aggregator support for MCOs
4. Grace periods: 15 min clock-in, 15 min clock-out  
5. Geofence tolerance: 150m base + 100m GPS accuracy
6. Data retention: Minimum 6 years

---

## 📚 Reference Documentation

### Texas
- HHSC EVV Policy Handbook
- HHAeXchange Provider Portal Guide
- 26 TAC §§558 (HCSSA licensing)
- Texas Medicaid Provider Agreement

### Florida
- AHCA EVV Program Requirements
- Florida Statute 400.487 (home health services)
- Chapter 59A-8 (home health licensing)
- SMMC and MMA program specifications

---

## 🔄 Version History

| Date | Version | Changes |
|------|---------|---------|
| 2024-01-25 | 1.0 | Initial implementation status document |

