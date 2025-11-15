# Texas EVV Compliance Features

**Implemented:** 2025-11-14
**Status:** Complete ✅
**Scope:** Texas HHSC Electronic Visit Verification (EVV) Requirements

---

## Overview

This document describes the Texas-specific EVV compliance features added to the Care Commons platform. These features ensure full compliance with Texas Health and Human Services Commission (HHSC) EVV requirements for Medicaid home and community-based services.

---

## Features Implemented

### 1. Texas Geofence Validation Service

**File:** `src/service/texas-geofence-validator.ts`

Implements Texas HHSC geofence validation with 100m base radius + GPS accuracy allowance.

#### Key Features:
- **Base radius**: 100 meters (HHSC standard)
- **GPS accuracy allowance**: Effective radius = base radius + GPS accuracy
- **Three compliance levels**:
  - `COMPLIANT`: Within 100m base radius
  - `WARNING`: Beyond base but within GPS accuracy allowance
  - `VIOLATION`: Beyond all allowances
- **Strict mode**: Enforces GPS accuracy ≤100m requirement
- **Haversine formula**: Accurate distance calculation between GPS coordinates

#### Validation Types:
1. **WITHIN_BASE_RADIUS** - Fully compliant (≤100m)
2. **WITHIN_ACCURACY_ALLOWANCE** - Acceptable with warning (100m < distance ≤ effective radius)
3. **OUTSIDE_GEOFENCE** - Violation (distance > effective radius)
4. **GPS_ACCURACY_EXCEEDED** - GPS accuracy > 100m (requires exception)

#### Example Usage:
```typescript
import { createTexasGeofenceValidator } from '@care-commons/time-tracking-evv';

const validator = createTexasGeofenceValidator();

const result = validator.validate(
  { latitude: 30.2683, longitude: -97.7431, accuracy: 30 }, // Actual location
  { latitude: 30.2672, longitude: -97.7431 }                // Expected location
);

// Result:
// {
//   isValid: true,
//   validationType: 'WITHIN_ACCURACY_ALLOWANCE',
//   distanceMeters: 120,
//   effectiveRadiusMeters: 130,
//   complianceLevel: 'WARNING',
//   message: 'Location is 20m beyond base geofence but within GPS accuracy allowance...'
// }
```

---

### 2. Six Required EVV Elements Validator

**File:** `src/service/six-elements-validator.ts`

Validates compliance with federal and Texas EVV requirements for the six mandatory data elements.

#### Six Required Elements:
1. **WHO provides** - Caregiver identification (employee ID, NPI for Texas)
2. **WHO receives** - Client identification (Medicaid ID for Texas)
3. **WHAT** - Service type code
4. **WHEN (date)** - Service date
5. **WHERE** - Service location (GPS coordinates required for Texas)
6. **WHEN (time) & HOW LONG** - Clock-in/out times and duration

#### Federal vs Texas Requirements:

| Element | Federal Requirement | Texas Enhancement |
|---------|---------------------|-------------------|
| Client ID | Required | + Medicaid ID required |
| Caregiver ID | Required | + NPI (National Provider Identifier) required |
| Service Location | Address or coordinates | GPS coordinates + verification method required |
| GPS Verification | Not specified | Method must be documented |
| Completed Visit | Optional | Clock-out can be pending |

#### Example Usage:
```typescript
import { createTexasValidator } from '@care-commons/time-tracking-evv';

const validator = createTexasValidator();

const result = validator.validate({
  serviceTypeCode: 'T1019',
  clientId: 'client-123',
  clientMedicaidId: 'TX-MED-12345',
  caregiverId: 'caregiver-456',
  caregiverEmployeeId: 'EMP-789',
  caregiverNPI: '1234567890',
  serviceDate: new Date('2025-11-14'),
  serviceLocationLatitude: 30.2672,
  serviceLocationLongitude: -97.7431,
  locationVerificationMethod: 'GPS',
  clockInTime: new Date('2025-11-14T09:00:00Z'),
  clockOutTime: new Date('2025-11-14T13:00:00Z'),
});

// Result:
// {
//   isValid: true,
//   allElementsPresent: true,
//   federalCompliant: true,
//   texasCompliant: true,
//   complianceLevel: 'COMPLIANT'
// }
```

---

### 3. Texas EVV Compliance Service

**File:** `src/service/texas-evv-compliance.ts`

Comprehensive compliance checking service that integrates geofence validation, six elements validation, and grace period rules.

#### Features:
- **Integrated validation**: Combines geofence, elements, and grace period checks
- **10-minute grace period**: Allows clock-in/out within 10 minutes of scheduled time
- **Compliance flags**: Detailed flags for each violation type
- **VMUR detection**: Identifies when Visit Maintenance Unlock Request is required
- **Actionable recommendations**: Provides specific next steps

#### Compliance Flags:
```typescript
type TexasComplianceFlag =
  | 'COMPLIANT'             // Fully compliant
  | 'GEOFENCE_WARNING'      // Location warning
  | 'GEOFENCE_VIOLATION'    // Location violation
  | 'GPS_ACCURACY_EXCEEDED' // GPS accuracy > 100m
  | 'MISSING_ELEMENTS'      // Missing required elements
  | 'GRACE_PERIOD_VIOLATION' // Clock time outside grace period
  | 'INCOMPLETE_VISIT'      // Missing clock-out
  | 'REQUIRES_VMUR'         // Requires VMUR workflow
  | 'REQUIRES_SUPERVISOR'   // Requires supervisor review
  | 'AGGREGATOR_READY';     // Ready for HHAeXchange submission
```

#### Example Usage:
```typescript
import { createTexasComplianceService } from '@care-commons/time-tracking-evv';

const complianceService = createTexasComplianceService();

const result = complianceService.validateCompliance(
  evvRecord,
  scheduledStartTime,
  scheduledEndTime,
  expectedLocation
);

// Result includes:
// - Overall compliance level (COMPLIANT / WARNING / NON_COMPLIANT)
// - Detailed geofence validation results
// - Six elements validation results
// - Grace period validation results
// - Compliance flags
// - Summary message
// - Actionable recommendations
```

---

## Demo Scenarios

**File:** `packages/core/scripts/seed-texas-evv-scenarios.ts`

Three demo scenarios showcasing Texas EVV compliance features:

### Scenario 1: Compliant Visit
- **Client**: Maria Johnson
- **Caregiver**: Sarah Williams
- **Location**: Perfect (0m from expected location)
- **GPS Accuracy**: 15m (excellent)
- **Clock Times**: Exactly on schedule
- **Result**: ✅ COMPLIANT - Ready for aggregator submission

### Scenario 2: Geofence Warning
- **Client**: Robert Martinez
- **Caregiver**: Michael Davis
- **Location**: 120m from expected location
- **GPS Accuracy**: 30m (effective radius = 130m)
- **Distance < Effective Radius**: ⚠️ WARNING - Acceptable with review
- **Result**: Submittable with supervisor notification

### Scenario 3: VMUR Required
- **Client**: Linda Thompson
- **Caregiver**: Jennifer Garcia
- **Issue**: Forgot to clock out
- **Record Age**: 35 days old (>30 days)
- **Result**: 🔧 VMUR workflow required for correction

#### Running Demo Scenarios:
```bash
npm run db:seed:texas-evv-scenarios
```

---

## Test Coverage

Comprehensive test suites ensure reliability and compliance:

### 1. Geofence Validator Tests
**File:** `src/service/__tests__/texas-geofence-validator.test.ts`

- ✅ 50+ test cases
- ✅ All three demo scenarios
- ✅ Edge cases (boundary conditions, invalid inputs)
- ✅ Real-world scenarios (urban canyon, rural GPS, mobile accuracy)

### 2. Six Elements Validator Tests
**File:** `src/service/__tests__/six-elements-validator.test.ts`

- ✅ 40+ test cases
- ✅ Federal vs Texas requirements
- ✅ Missing elements detection
- ✅ Invalid data handling
- ✅ Compliance level classification

### 3. Texas Compliance Service Tests
**File:** `src/service/__tests__/texas-evv-compliance.test.ts`

- ✅ 30+ integration test cases
- ✅ All three demo scenarios
- ✅ Multiple violation scenarios
- ✅ Grace period validation
- ✅ Configuration customization

#### Running Tests:
```bash
npm test -- time-tracking-evv
```

---

## Integration Points

### Existing EVV Infrastructure

The new Texas compliance features integrate seamlessly with existing EVV infrastructure:

#### 1. Texas EVV Provider
**File:** `src/providers/texas-evv-provider.ts`

- ✅ Already implements HHAeXchange aggregator submission
- ✅ Already implements VMUR workflow
- ✅ Enhanced with new compliance validators

#### 2. VMUR Service
**File:** `src/service/vmur-service.ts`

- ✅ Complete VMUR (Visit Maintenance Unlock Request) workflow
- ✅ 30-day immutability enforcement
- ✅ Supervisor approval process
- ✅ Aggregator resubmission

#### 3. HHAeXchange Aggregator
**File:** `src/aggregators/hhaeexchange-aggregator.ts`

- ✅ Complete HHAeXchange API integration
- ✅ Texas-specific validation
- ✅ GPS accuracy enforcement (≤100m)
- ✅ Six elements validation

---

## API Integration

### New Exports

All Texas compliance services are exported from the main package:

```typescript
// Geofence Validation
export {
  TexasGeofenceValidator,
  createTexasGeofenceValidator,
  type GeofenceValidationResult,
  type LocationCoordinates,
} from './service/texas-geofence-validator';

// Six Elements Validation
export {
  SixElementsValidator,
  createFederalValidator,
  createTexasValidator,
  type SixElementsValidationResult,
  type EVVDataInput,
} from './service/six-elements-validator';

// Comprehensive Compliance
export {
  TexasEVVComplianceService,
  createTexasComplianceService,
  type TexasComplianceResult,
} from './service/texas-evv-compliance';
```

### Example API Handler (Future)

```typescript
import { createTexasComplianceService } from '@care-commons/time-tracking-evv';
import type { Request, Response } from 'express';

const complianceService = createTexasComplianceService();

export async function validateEVVCompliance(req: Request, res: Response) {
  const { evvRecordId } = req.params;

  // Fetch EVV record and visit details
  const evvRecord = await evvRepository.findById(evvRecordId);
  const visit = await visitRepository.findById(evvRecord.visitId);
  const client = await clientRepository.findById(visit.clientId);

  // Validate Texas compliance
  const result = complianceService.validateCompliance(
    evvRecord,
    visit.scheduledStart,
    visit.scheduledEnd,
    {
      latitude: client.primaryAddress.latitude,
      longitude: client.primaryAddress.longitude,
    }
  );

  return res.json({
    isCompliant: result.isCompliant,
    complianceLevel: result.complianceLevel,
    flags: result.flags,
    summary: result.summary,
    recommendations: result.recommendations,
    details: {
      geofence: result.geofenceValidation,
      elements: result.elementsValidation,
      gracePeriod: result.gracePeriodValidation,
    },
  });
}
```

---

## Compliance Documentation

### Texas HHSC References

This implementation is based on:

- **26 TAC §558** - Texas Administrative Code (Electronic Visit Verification)
- **HHSC EVV Policy Handbook v3.2**
- **21st Century Cures Act § 12006** (Federal EVV Requirements)
- **42 CFR § 440.387** (Federal EVV Regulations)

### Key Requirements Implemented

✅ **Geofence Validation**
- 100m base radius (HHSC standard)
- GPS accuracy allowance
- Distance calculation using Haversine formula

✅ **Six Required Elements**
- Type of service (WHAT)
- Individual receiving service (WHO receives)
- Individual providing service (WHO provides)
- Date of service (WHEN - date)
- Location of service (WHERE)
- Time begins and ends (WHEN - time & HOW LONG)

✅ **Texas Enhancements**
- Medicaid ID required
- NPI (National Provider Identifier) required
- GPS coordinates required
- Location verification method documented

✅ **Grace Period**
- 10-minute window before/after scheduled time
- Early/late grace period handling
- Violation detection

✅ **VMUR Workflow**
- 30-day immutability period
- Supervisor approval required
- Aggregator resubmission
- Expiration tracking (30 days)

✅ **HHAeXchange Integration**
- Mock aggregator for demo
- Real API integration ready
- Payload formatting per HHSC specs

---

## Configuration

### Default Texas Configuration

```typescript
const DEFAULT_TEXAS_CONFIG = {
  geofenceBaseRadius: 100,        // meters
  maxGPSAccuracy: 100,            // meters
  gracePeriodMinutes: 10,         // minutes
  strictGPSAccuracy: true,        // enforce 100m limit
  requireCompletedVisit: false,   // allow in-progress visits
  accuracyAllowanceMultiplier: 1.0 // full GPS accuracy as allowance
};
```

### Customization Example

```typescript
// More lenient configuration for rural areas
const ruralConfig = createTexasComplianceService({
  gracePeriodMinutes: 15,         // 15-minute grace period
  strictGPSAccuracy: false,       // allow > 100m accuracy
});

// Strict configuration for audits
const auditConfig = createTexasComplianceService({
  gracePeriodMinutes: 5,          // 5-minute grace period
  requireCompletedVisit: true,    // require clock-out
  strictGPSAccuracy: true,        // enforce 100m limit
});
```

---

## Next Steps

### Recommended Enhancements

1. **API Handlers** - Create REST endpoints for Texas compliance validation
2. **Dashboard Widgets** - Visualize compliance levels and warnings
3. **Automated Alerts** - Notify supervisors of violations in real-time
4. **Batch Validation** - Validate multiple visits for reporting
5. **Compliance Reports** - Generate compliance reports for audits
6. **Real-time Monitoring** - Monitor geofence compliance during visit
7. **Mobile App Integration** - Provide real-time feedback to caregivers

### Production Readiness

- ✅ Comprehensive test coverage (120+ test cases)
- ✅ Full TypeScript type safety
- ✅ Detailed documentation
- ✅ Demo scenarios for testing
- ✅ Integration with existing EVV infrastructure
- ⏳ Build configuration needs fixing (pre-existing issue)
- ⏳ API endpoints need creation
- ⏳ Production HHAeXchange credentials needed

---

## Support

For questions or issues regarding Texas EVV compliance features:

1. Review this documentation
2. Check test files for examples
3. Review HHSC EVV Policy Handbook
4. Consult Texas HHSC technical support

---

**Version:** 1.0
**Last Updated:** 2025-11-14
**Maintainer:** Care Commons Engineering Team
