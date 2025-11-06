# Task 0012: Expand State-Specific Compliance for All 7 States

**Priority**: 🟡 MEDIUM
**Phase**: Phase 2 - Feature Completeness
**Estimated Effort**: 10-12 hours

## Context

The platform supports 7 states (TX, FL, OH, PA, GA, NC, AZ) with EVV compliance, but state-specific business logic is primarily implemented for TX and FL. The other 5 states need equivalent implementation.

## Current State

- ✅ **Texas (TX)**: Fully implemented with HHAeXchange, VMUR, specific visit rules
- ✅ **Florida (FL)**: Multi-aggregator support, MCO-specific rules
- ⚠️ **Ohio, Pennsylvania, Georgia, North Carolina, Arizona**: Schema exists but business logic incomplete

## Task

### 1. Research State-Specific Requirements

**Document requirements for each state**:

**Ohio (OH)**:
- EVV aggregator: Sandata
- Required data elements: Service type, member ID, provider ID, times, location
- Geofencing rules: Within 1 mile radius
- Visit tolerance: ±15 minutes
- Special rules: Home health vs. waiver services differences

**Pennsylvania (PA)**:
- EVV aggregator: Sandata
- Required data elements: Standard EVV + service authorization
- Geofencing rules: Within 0.5 mile radius (stricter)
- Visit tolerance: ±10 minutes
- Special rules: Requires prior authorization verification

**Georgia (GA)**:
- EVV aggregator: Tellus
- Required data elements: Standard EVV + Medicaid ID
- Geofencing rules: Within 1 mile radius
- Visit tolerance: ±15 minutes
- Special rules: Different rules for CFC vs. HCBS waiver

**North Carolina (NC)**:
- EVV aggregator: Sandata
- Required data elements: Standard EVV + service definition code
- Geofencing rules: Within 1 mile radius
- Visit tolerance: ±20 minutes
- Special rules: Innovations waiver specific requirements

**Arizona (AZ)**:
- EVV aggregator: Sandata
- Required data elements: Standard EVV + AHCCCS ID
- Geofencing rules: Within 1 mile radius
- Visit tolerance: ±15 minutes
- Special rules: DDD vs. ALTCS program differences

### 2. Implement State-Specific Services

**File**: `verticals/time-tracking-evv/src/services/state-compliance/`

Create state-specific service files:

```typescript
// ohio-compliance.service.ts
export class OhioComplianceService {
  validateVisit(visit: Visit): ValidationResult {
    // Ohio-specific validation rules
    // - Check Sandata required fields
    // - Validate geofence (1 mile)
    // - Verify service type for home health vs waiver
    // - Check visit tolerance (±15 minutes)
  }

  formatForAggregator(evvData: EVVData): SandataFormat {
    // Format for Sandata Ohio submission
  }

  checkAuthorization(clientId: string, serviceType: string): Promise<boolean> {
    // Verify service authorization for Ohio Medicaid
  }
}

// pennsylvania-compliance.service.ts
export class PennsylvaniaComplianceService {
  validateVisit(visit: Visit): ValidationResult {
    // PA-specific validation (stricter geofence, prior auth check)
  }

  formatForAggregator(evvData: EVVData): SandataFormat {
    // Format for Sandata PA submission
  }

  verifyPriorAuthorization(clientId: string, serviceType: string): Promise<boolean> {
    // PA requires prior authorization verification
  }
}

// georgia-compliance.service.ts
export class GeorgiaComplianceService {
  validateVisit(visit: Visit): ValidationResult {
    // GA-specific validation
  }

  formatForAggregator(evvData: EVVData): TellusFormat {
    // Format for Tellus aggregator (different from Sandata)
  }

  determineProgram(clientId: string): Promise<'CFC' | 'HCBS'> {
    // Determine if client is CFC or HCBS waiver
  }
}

// Similar for NC and AZ...
```

### 3. Create State Compliance Factory

**File**: `verticals/time-tracking-evv/src/services/state-compliance/factory.ts`

```typescript
import { OhioComplianceService } from './ohio-compliance.service';
import { PennsylvaniaComplianceService } from './pennsylvania-compliance.service';
import { GeorgiaComplianceService } from './georgia-compliance.service';
// ... imports for NC, AZ

export class StateComplianceFactory {
  private static instances = new Map<string, any>();

  static getService(state: string) {
    if (!this.instances.has(state)) {
      const service = this.createService(state);
      this.instances.set(state, service);
    }
    return this.instances.get(state);
  }

  private static createService(state: string) {
    switch (state) {
      case 'TX':
        return new TexasComplianceService();
      case 'FL':
        return new FloridaComplianceService();
      case 'OH':
        return new OhioComplianceService();
      case 'PA':
        return new PennsylvaniaComplianceService();
      case 'GA':
        return new GeorgiaComplianceService();
      case 'NC':
        return new NorthCarolinaComplianceService();
      case 'AZ':
        return new ArizonaComplianceService();
      default:
        throw new Error(`Unsupported state: ${state}`);
    }
  }
}
```

### 4. Update EVV Service to Use State-Specific Logic

**File**: `verticals/time-tracking-evv/src/services/evv.service.ts`

```typescript
import { StateComplianceFactory } from './state-compliance/factory';

export class EVVService {
  async validateCheckIn(visitId: string, gpsCoords: GPSCoordinates): Promise<ValidationResult> {
    const visit = await this.getVisit(visitId);
    const client = await this.getClient(visit.clientId);

    // Get state-specific compliance service
    const complianceService = StateComplianceFactory.getService(client.state);

    // Use state-specific validation
    const validationResult = complianceService.validateVisit(visit);

    // Check geofencing with state-specific radius
    const geofenceResult = complianceService.validateGeofence(
      gpsCoords,
      visit.clientAddress,
      visit
    );

    return {
      valid: validationResult.valid && geofenceResult.valid,
      errors: [...validationResult.errors, ...geofenceResult.errors]
    };
  }

  async submitToAggregator(evvData: EVVData): Promise<void> {
    const client = await this.getClient(evvData.clientId);
    const complianceService = StateComplianceFactory.getService(client.state);

    // Format using state-specific formatter
    const formattedData = complianceService.formatForAggregator(evvData);

    // Submit to appropriate aggregator
    await complianceService.submitToAggregator(formattedData);
  }
}
```

### 5. Add State-Specific Configuration

**File**: `verticals/time-tracking-evv/src/config/state-config.ts`

```typescript
export interface StateEVVConfig {
  state: string;
  stateName: string;
  aggregator: 'Sandata' | 'HHAeXchange' | 'Tellus';
  geofenceRadius: number; // miles
  visitTolerance: number; // minutes
  requiresPriorAuth: boolean;
  requiredFields: string[];
  specialRules: Record<string, any>;
}

export const STATE_CONFIGS: Record<string, StateEVVConfig> = {
  TX: {
    state: 'TX',
    stateName: 'Texas',
    aggregator: 'HHAeXchange',
    geofenceRadius: 1.0,
    visitTolerance: 15,
    requiresPriorAuth: true,
    requiredFields: ['memberID', 'providerID', 'serviceType', 'times', 'location', 'VMUR'],
    specialRules: { hasVMUR: true }
  },
  FL: {
    state: 'FL',
    stateName: 'Florida',
    aggregator: 'HHAeXchange', // or Sandata depending on MCO
    geofenceRadius: 1.0,
    visitTolerance: 15,
    requiresPriorAuth: true,
    requiredFields: ['memberID', 'providerID', 'serviceType', 'times', 'location', 'MCO'],
    specialRules: { multiAggregator: true }
  },
  OH: {
    state: 'OH',
    stateName: 'Ohio',
    aggregator: 'Sandata',
    geofenceRadius: 1.0,
    visitTolerance: 15,
    requiresPriorAuth: false,
    requiredFields: ['memberID', 'providerID', 'serviceType', 'times', 'location'],
    specialRules: { homeHealthVsWaiver: true }
  },
  PA: {
    state: 'PA',
    stateName: 'Pennsylvania',
    aggregator: 'Sandata',
    geofenceRadius: 0.5, // Stricter
    visitTolerance: 10, // Stricter
    requiresPriorAuth: true,
    requiredFields: ['memberID', 'providerID', 'serviceType', 'times', 'location', 'authNumber'],
    specialRules: { strictGeofence: true }
  },
  GA: {
    state: 'GA',
    stateName: 'Georgia',
    aggregator: 'Tellus',
    geofenceRadius: 1.0,
    visitTolerance: 15,
    requiresPriorAuth: false,
    requiredFields: ['memberID', 'providerID', 'serviceType', 'times', 'location', 'medicaidID'],
    specialRules: { cfcVsHCBS: true }
  },
  NC: {
    state: 'NC',
    stateName: 'North Carolina',
    aggregator: 'Sandata',
    geofenceRadius: 1.0,
    visitTolerance: 20,
    requiresPriorAuth: false,
    requiredFields: ['memberID', 'providerID', 'serviceType', 'times', 'location', 'serviceDefCode'],
    specialRules: { innovationsWaiver: true }
  },
  AZ: {
    state: 'AZ',
    stateName: 'Arizona',
    aggregator: 'Sandata',
    geofenceRadius: 1.0,
    visitTolerance: 15,
    requiresPriorAuth: false,
    requiredFields: ['memberID', 'providerID', 'serviceType', 'times', 'location', 'ahcccsID'],
    specialRules: { dddVsALTCS: true }
  }
};
```

### 6. Create State-Specific Tests

**File**: `verticals/time-tracking-evv/src/services/state-compliance/__tests__/`

Create test files for each state:
- `ohio-compliance.test.ts`
- `pennsylvania-compliance.test.ts`
- `georgia-compliance.test.ts`
- `north-carolina-compliance.test.ts`
- `arizona-compliance.test.ts`

Test scenarios:
- Geofence validation with state-specific radius
- Visit tolerance validation
- Required field validation
- Aggregator format validation
- Prior authorization checks (where applicable)

### 7. Update Documentation

**Create state-specific compliance docs**:

- `docs/compliance/ohio-evv-requirements.md`
- `docs/compliance/pennsylvania-evv-requirements.md`
- `docs/compliance/georgia-evv-requirements.md`
- `docs/compliance/north-carolina-evv-requirements.md`
- `docs/compliance/arizona-evv-requirements.md`

Each doc should include:
- State Medicaid program overview
- EVV aggregator details and API documentation
- Required data elements
- Geofencing and tolerance rules
- Special requirements and edge cases
- Testing checklist

### 8. Add State Selection in UI

**Frontend updates**:

When creating a client or organization:
- State dropdown prominently displayed
- Show state-specific requirements when selected
- Display which aggregator will be used
- Show geofence radius and tolerance

## Acceptance Criteria

- [ ] State-specific services implemented for OH, PA, GA, NC, AZ
- [ ] State compliance factory working
- [ ] EVV service uses state-specific logic
- [ ] State configuration file complete
- [ ] Geofencing works with state-specific radii
- [ ] Visit tolerance validated per state
- [ ] Prior authorization checks (PA)
- [ ] Aggregator formatting for Sandata and Tellus
- [ ] Tests for all 5 states (>70% coverage)
- [ ] Documentation for each state
- [ ] UI shows state-specific rules
- [ ] Works end-to-end for all states

## Testing

For each state:
1. Create test client in that state
2. Create test visit
3. Attempt check-in with GPS
4. Verify geofence validation uses correct radius
5. Verify required fields enforced
6. Test aggregator submission format
7. Verify state-specific special rules

## Reference

- **Sandata API**: https://www.sandata.com/
- **Tellus Health**: https://www.tellushealth.com/
- **State Medicaid Programs**:
  - Ohio: https://medicaid.ohio.gov/
  - Pennsylvania: https://www.dhs.pa.gov/
  - Georgia: https://medicaid.georgia.gov/
  - North Carolina: https://medicaid.ncdhhs.gov/
  - Arizona: https://www.azahcccs.gov/

## Future Enhancements

- Support for additional states (CA, NY, IL, etc.)
- Real-time aggregator status monitoring
- Automated compliance reporting per state
- State-specific rate schedules
