# Multi-State Compliance System

## Overview

This directory contains the multi-state compliance validation system for Care Commons. The system ensures that caregiver assignments comply with state-specific home healthcare regulations for **Ohio (OH)**, **Texas (TX)**, and **Florida (FL)**.

## Quick Start

```typescript
import { ValidatorFactory } from './validator-factory.js';
import { CaregiverCredentials, VisitDetails, ClientDetails } from './types/index.js';

// Get validator for a specific state
const validator = ValidatorFactory.getValidator('OH');

// Validate caregiver can be assigned to visit
const result = await validator.canAssignToVisit(caregiver, visit, client);

if (!result.canProceed) {
  console.log('Assignment blocked by compliance issues:');
  result.issues
    .filter(i => i.severity === 'BLOCKING')
    .forEach(issue => console.log(`- ${issue.message}`));
}
```

## Architecture

### Core Components

```
compliance/
├── base-validator.ts          # Base validator with common logic
├── validator-factory.ts       # Factory for getting state validators
├── state-registry.ts          # Centralized state configuration
├── types/                     # Type definitions and interfaces
│   └── index.ts
├── ohio/                      # Ohio-specific implementation
│   ├── validator.ts
│   └── __tests__/
│       └── validator.test.ts
├── texas/                     # Texas-specific implementation
│   ├── validator.ts
│   └── __tests__/
│       └── validator.test.ts
└── florida/                   # Florida-specific implementation
    ├── validator.ts
    └── __tests__/
        └── validator.test.ts
```

### Design Patterns

- **Strategy Pattern**: State-specific validators implement `StateComplianceValidator` interface
- **Factory Pattern**: `ValidatorFactory` creates appropriate validator based on state code
- **Template Method**: `BaseComplianceValidator` defines common validation flow
- **Registry Pattern**: `STATE_REGISTRY` centralizes state configurations

## Supported States

| State | Code | Strictness | Background Check Cycle | EVV Aggregator | Free EVV | Test Coverage |
|-------|------|------------|------------------------|----------------|----------|---------------|
| **Ohio** | OH | MODERATE | 5 years | Sandata | ✅ Yes | 15 tests |
| **Texas** | TX | STRICT | 2 years | HHAeXchange | ❌ No | 10 tests |
| **Florida** | FL | LENIENT | 5 years | Multi-aggregator | ❌ No | 13 tests |

### State Characteristics

#### Ohio (OH)
- **Strictness**: Moderate
- **Key Features**:
  - FREE Sandata EVV aggregator (major cost advantage)
  - FBI+BCI fingerprint background check (5-year cycle)
  - STNA registry for CNAs (2-year certification)
  - HHA 75-hour training + annual competency
  - RN supervision: 14 days (new clients), 60 days (established)
- **Regulations**: Ohio Revised Code §173.27, §3721.30, §5164.34; OAC 3701-18-03, 5160-12-03, 5160-58-01

#### Texas (TX)
- **Strictness**: STRICT (toughest state in US)
- **Key Features**:
  - HHAeXchange mandatory EVV aggregator
  - Employee Misconduct Registry (PERMANENT disqualification if listed)
  - 2-year background check cycle (shortest in US)
  - VMUR 30-day correction window for EVV
  - STAR+PLUS emergency plan requirement
- **Regulations**: Texas Human Resources Code §40.053, §32.00131, §250.006; 26 TAC §558

#### Florida (FL)
- **Strictness**: LENIENT (most flexible)
- **Key Features**:
  - Multi-aggregator support (HHAeXchange, Tellus, iConnect)
  - Level 2 background screening (5-year cycle)
  - HIV/AIDS training mandatory
  - Most lenient geofencing (250m total tolerance)
  - 15-minute grace periods (most lenient)
- **Regulations**: Florida Statutes Chapter 400, 409, 435; Florida Administrative Code 59A-8

## Validation Flow

### 1. Base Validator Checks

Common validations applied to ALL states:

```typescript
// In BaseComplianceValidator.canAssignToVisit()
1. Background Screening
   - Missing: BLOCKING
   - Pending: BLOCKING
   - Issues found: BLOCKING
   - Expired: BLOCKING
   - Expiring soon (within warning days): WARNING

2. Professional Licensure
   - No license for visit state: BLOCKING
   - Inactive license: BLOCKING
   - Expired license: BLOCKING
   - Expiring soon: WARNING

3. Registry Checks
   - Missing check: BLOCKING
   - Listed on registry: BLOCKING
   - Pending results: BLOCKING
   - Expired check: BLOCKING
   - Expiring soon: WARNING
```

### 2. State-Specific Validator Checks

Each state validator extends base checks with state-specific requirements:

#### Ohio Validator (`OhioComplianceValidator`)
```typescript
// In validateStateSpecificCredentials()
1. FBI+BCI Background Check
   - Must be fingerprint-based (not name-based)
   - 5-year expiration cycle
   - Status must be CLEAR

2. STNA Registry (for CNAs)
   - Must have STNA number
   - Status must be ACTIVE
   - 2-year certification renewal
   - 12 hours CE per 2-year cycle
   - Must work 24 months within 5-year period

3. HHA Training
   - 75-hour training completion
   - Annual competency check
   - 12 hours in-service annually

4. RN Supervision
   - New clients: 14-day frequency
   - Established clients: 60-day frequency
```

#### Texas Validator (`TexasComplianceValidator`)
```typescript
// In validateStateSpecificCredentials()
1. Employee Misconduct Registry (EMR)
   - PERMANENT disqualification if listed
   - Annual verification required

2. Nurse Aide Registry (NAR)
   - Required for CNAs
   - Must be ACTIVE status

3. HHSC Orientation
   - Mandatory for all caregivers
   - One-time requirement

4. EVV Enrollment
   - Must be enrolled in HHAeXchange
   - Required for EVV-mandated services

5. STAR+PLUS Emergency Plan
   - Required for STAR+PLUS clients
   - Must be current (updated annually)
```

#### Florida Validator (`FloridaComplianceValidator`)
```typescript
// In validateStateSpecificCredentials()
1. Level 2 Background Screening
   - 5-year cycle
   - Status must be CLEARED
   - AHCA screening ID required

2. Professional Licensure
   - Must have active FL license
   - Verified through FL Board of Nursing

3. HIV/AIDS Training
   - Mandatory one-time training
   - Per Florida Administrative Code 59A-8.0095

4. RN Supervision Assignment
   - Required for skilled services
   - On-site visits every 60 days

5. Plan of Care Review
   - 60 or 90-day review frequency
   - Physician signature required
```

### 3. Result Determination

```typescript
// In createFailureResult() helper
const blockingIssues = issues.filter(i => i.severity === 'BLOCKING');
return {
  canProceed: blockingIssues.length === 0,  // TRUE if only WARNINGs
  issues,  // All issues (BLOCKING + WARNING)
};
```

**Key Rule**: Assignment can proceed if there are ONLY `WARNING` severity issues. Any `BLOCKING` issues prevent assignment.

## Compliance Issue Types

### Severity Levels

| Severity | Description | Can Assign? | Example |
|----------|-------------|-------------|---------|
| `BLOCKING` | Critical compliance violation | ❌ No | Expired license, missing background check |
| `WARNING` | Non-critical issue, needs attention | ✅ Yes | Credential expiring soon, registry check due |
| `INFO` | Informational notice | ✅ Yes | Reminder to schedule training |

### Issue Categories

```typescript
type ComplianceCategory =
  | 'CAREGIVER_CREDENTIALS'    // Background, licenses, registries
  | 'CLIENT_AUTHORIZATION'     // Service auth, plan of care
  | 'VISIT_DOCUMENTATION'      // Visit notes, signatures
  | 'EVV_COMPLIANCE'           // Electronic visit verification
  | 'DATA_RETENTION'           // Records retention
  | 'PRIVACY_SECURITY'         // HIPAA, data security
  | 'QUALITY_STANDARDS'        // Quality metrics
  | 'INCIDENT_REPORTING';      // Incidents, complaints
```

### Issue Structure

```typescript
interface ComplianceIssue {
  type: string;                    // e.g., 'OH_FBI_BCI_EXPIRED'
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  category: ComplianceCategory;
  message: string;                 // Human-readable explanation
  regulation: string;              // Statutory citation
  remediation: string;             // How to fix
  canBeOverridden: boolean;        // Can compliance officer override?
  requiresComplianceReview?: boolean;  // Needs manual review?
  metadata?: Record<string, unknown>;  // Additional context
}
```

## Testing

### Test Coverage

- **Base Validator**: 12 tests
- **Ohio Validator**: 15 tests
- **Texas Validator**: 10 tests
- **Florida Validator**: 13 tests
- **Total**: 50 tests

### Running Tests

```bash
# Run all compliance tests
npm test src/compliance

# Run state-specific tests
npm test src/compliance/ohio/__tests__/validator.test.ts
npm test src/compliance/texas/__tests__/validator.test.ts
npm test src/compliance/florida/__tests__/validator.test.ts

# Run with coverage
npm test -- --coverage src/compliance
```

### Test Scenarios

Each state has comprehensive test scenarios covering:

1. **Background Screening**
   - Missing, pending, issues, expired, expiring soon
   - Wrong type (name-based vs fingerprint)

2. **Licensure**
   - Missing, inactive, expired, expiring soon
   - Wrong state, wrong role

3. **Registry Checks**
   - Missing, listed, pending, expired, expiring soon
   - State-specific registries (STNA, NAR, EMR)

4. **State-Specific Requirements**
   - Training and competency
   - Supervision frequencies
   - Authorization requirements

5. **Edge Cases**
   - Multiple issues simultaneously
   - Grace periods and tolerances
   - Override scenarios

## State-Specific Data Structures

### Ohio (OH)

```typescript
interface OhioCredentials {
  backgroundCheck?: {
    type: 'FBI_BCI';
    checkDate: Date;
    expirationDate: Date;
    bciTrackingNumber: string;
    status: 'CLEAR' | 'PENDING' | 'ISSUES' | 'EXPIRED';
  };
  stnaNumber?: string;
  stnaStatus?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  stnaCertificationExpiration?: Date;
  hhaTrainingCompletion?: Date;
  hhaCompetencyStatus?: 'PASSED' | 'FAILED' | 'PENDING';
  lastCompetencyCheck?: Date;
}

interface OhioClientData {
  mcoName?: string;
  lastRNSupervisionVisit?: Date;
  isNewClient?: boolean;
  odmProviderNumber?: string;
}
```

### Texas (TX)

```typescript
interface TexasCredentials {
  emrCheckDate?: Date;
  emrStatus?: 'CLEAR' | 'PENDING' | 'LISTED';
  narNumber?: string;
  narStatus?: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  hhscOrientationCompleted?: boolean;
  evvEnrollmentStatus?: 'ACTIVE' | 'PENDING' | 'INACTIVE';
}

interface TexasClientData {
  medicaidProgram?: string;  // 'STAR_PLUS', etc.
  emergencyPlanOnFile?: boolean;
  authorizedServices?: Array<{
    serviceCode: string;
    authorizedUnits: number;
    usedUnits: number;
    requiresEVV: boolean;
  }>;
}
```

### Florida (FL)

```typescript
interface FloridaCredentials {
  level2ScreeningDate?: Date;
  level2ScreeningExpiration?: Date;
  level2ScreeningStatus?: 'CLEARED' | 'PENDING' | 'DISQUALIFIED';
  level2ScreeningId?: string;
  hivAidsTrainingCompleted?: boolean;
  medicaidProviderId?: string;
}

interface FloridaClientData {
  mcoName?: string;
  mcoProgram?: 'LTC' | 'MMA';
  pocNextReviewDue?: Date;
  lastRNSupervisoryVisit?: Date;
  preferredAggregator?: 'HHAEEXCHANGE' | 'TELLUS' | 'ICONNECT';
}
```

## EVV Integration

Each state has specific EVV (Electronic Visit Verification) requirements:

### State EVV Configurations

```typescript
// From verticals/time-tracking-evv/src/config/state-evv-configs.ts

OH: {
  aggregatorType: 'SANDATA',
  aggregatorFree: true,              // FREE for Ohio providers!
  geofenceRadiusMeters: 125,
  geofenceToleranceMeters: 75,       // 200m total
  gracePeriodMinutes: 10,
}

TX: {
  aggregatorType: 'HHAEEXCHANGE',
  aggregatorFree: false,
  geofenceRadiusMeters: 100,
  geofenceToleranceMeters: 50,       // 150m total (strict)
  gracePeriodMinutes: 10,
  requiresVMUR: true,                // Visit Maintenance Unlock Request
  vmurWindowDays: 30,
}

FL: {
  aggregatorType: 'MULTI',
  aggregatorFree: false,
  geofenceRadiusMeters: 150,
  geofenceToleranceMeters: 100,      // 250m total (lenient)
  gracePeriodMinutes: 15,
  multiAggregatorSupport: true,
}
```

## Adding a New State

To add support for a new state:

1. **Create State Validator** (`src/compliance/{state}/validator.ts`):
   ```typescript
   export class NewStateComplianceValidator extends BaseComplianceValidator {
     readonly state: StateCode = 'NS';

     protected readonly credentialConfig: StateCredentialConfig = { /* config */ };
     protected readonly authorizationConfig: StateAuthorizationConfig = { /* config */ };

     protected override async validateStateSpecificCredentials(
       caregiver: CaregiverCredentials,
       visit: VisitDetails,
       client: ClientDetails
     ): Promise<ComplianceIssue[]> {
       // State-specific validation logic
     }
   }
   ```

2. **Add State Types** (extend `CaregiverCredentials` and `ClientDetails`):
   ```typescript
   interface NewStateCredentials {
     // State-specific credential fields
   }

   interface NewStateClientData {
     // State-specific client fields
   }
   ```

3. **Register State** (`src/compliance/state-registry.ts`):
   ```typescript
   NS: {
     code: 'NS',
     name: 'New State',
     evvAggregator: 'AggregatorName',
     strictness: 'MODERATE',
     backgroundCheckCycle: 'EVERY_5_YEARS',
     // ... other config
   }
   ```

4. **Create Tests** (`src/compliance/{state}/__tests__/validator.test.ts`):
   - Cover all state-specific validations
   - Test BLOCKING and WARNING scenarios
   - Include edge cases

5. **Update EVV Config** (`verticals/time-tracking-evv/src/config/state-evv-configs.ts`):
   ```typescript
   NS: {
     state: 'NS',
     aggregatorType: 'VENDOR',
     geofenceRadiusMeters: 125,
     // ... other EVV settings
   }
   ```

## Regulatory References

### Ohio
- [Ohio Revised Code §173.27](https://codes.ohio.gov/ohio-revised-code/section-173.27) - Background Screening
- [Ohio Revised Code §3721.30](https://codes.ohio.gov/ohio-revised-code/section-3721.30) - Nurse Aide Registry
- [Ohio Administrative Code 5160-58-01](http://codes.ohio.gov/oac/5160-58-01) - Personal Care Aide Standards
- [Ohio Sandata EVV](https://medicaid.ohio.gov/providers-partners/providers/electronic-visit-verification-evv)

### Texas
- [Texas Human Resources Code §40.053](https://statutes.capitol.texas.gov/Docs/HR/htm/HR.40.htm#40.053) - Employee Misconduct Registry
- [26 TAC §558](https://www.sos.texas.gov/texreg/index.shtml) - HHSC Home Health Rules
- [Texas EVV Requirements](https://www.hhs.texas.gov/providers/long-term-care-providers/electronic-visit-verification-evv)

### Florida
- [Florida Statutes Chapter 400](http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Title=-%3E2024-%3EChapter%20400) - Home Health Agencies
- [Florida Administrative Code 59A-8](https://www.flrules.org/gateway/ChapterHome.asp?Chapter=59A-8) - Home Health Regulations
- [Florida EVV](https://ahca.myflorida.com/medicaid/Policy_and_Quality/Quality/Electronic_Visit_Verification.shtml)

## Troubleshooting

### Common Issues

**Issue**: `canProceed` is `false` but test expects `true`
- **Cause**: Test has BLOCKING issues present
- **Solution**: Check test data includes all required credentials (background screening, licenses, registry checks)

**Issue**: Expected issue type not found
- **Cause**: Date calculations off or wrong issue being generated
- **Solution**: Verify test dates are within warning/expiration thresholds

**Issue**: Validator not found for state
- **Cause**: State not registered in `STATE_REGISTRY`
- **Solution**: Add state to `state-registry.ts` and implement validator

## Performance

- **Average validation time**: < 10ms per assignment
- **Test suite execution**: ~2 seconds (50 tests)
- **Memory usage**: Minimal (validators are stateless singletons)

## Contributing

When contributing to compliance validators:

1. **Follow regulatory documentation exactly** - cite specific statutes/regulations
2. **Write comprehensive tests** - cover all validation scenarios
3. **Document state-specific quirks** - explain unusual requirements
4. **Use consistent naming** - follow `{STATE}_{CHECK_TYPE}_{STATUS}` pattern for issue types
5. **Keep validators focused** - one validator per state, delegate common logic to base

## License

Copyright © 2025 Care Commons. All rights reserved.
