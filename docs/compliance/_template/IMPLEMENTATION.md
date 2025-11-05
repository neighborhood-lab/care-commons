# [STATE NAME] Compliance Implementation Guide

**State Code**: [XX]  
**Last Updated**: [YYYY-MM-DD]  
**Implementation Status**: [Not Started / In Progress / Complete]

## Overview

This document describes how Care Commons implements [STATE] regulatory requirements as documented in [REQUIREMENTS.md](./REQUIREMENTS.md).

## Implementation Status

### Caregiver Credentials
- [ ] Background screening validation
- [ ] Professional licensure verification
- [ ] Registry checks automation
- [ ] Credential expiration tracking
- [ ] Automated renewal reminders

### Client Authorization
- [ ] Service authorization tracking
- [ ] Units consumed monitoring
- [ ] Plan of care management
- [ ] Physician order tracking
- [ ] Authorization renewal alerts

### Visit Documentation
- [ ] Required field validation
- [ ] Documentation timeliness checks
- [ ] Quality standards enforcement
- [ ] Supervisor review workflow

### EVV Compliance
- [ ] Six data elements captured
- [ ] State aggregator integration
- [ ] Geofence configuration
- [ ] Grace period enforcement
- [ ] Manual override workflow

### Data Retention
- [ ] Retention policy configuration
- [ ] Automated archival
- [ ] Audit trail preservation

### Privacy & Security
- [ ] HIPAA compliance
- [ ] State-specific privacy rules
- [ ] Field-level permissions
- [ ] Audit logging

---

## Code Structure

### State Compliance Validators

**Location**: `packages/core/src/compliance/[state]/`

```typescript
// packages/core/src/compliance/[state]/credentials.ts
export interface [State]CredentialRequirements {
  backgroundScreening: {
    type: 'LEVEL_1' | 'LEVEL_2' | 'FINGERPRINT';
    frequency: 'ANNUAL' | 'BIENNIAL' | 'AT_HIRE';
    expiration: number; // days
    blockingIssue: boolean;
  };
  
  licensure: {
    required: boolean;
    roles: string[];
    verificationUrl: string;
  };
  
  registryChecks: {
    [registryName: string]: {
      frequency: 'AT_HIRE' | 'ANNUAL';
      blockingIssue: boolean;
      apiEndpoint?: string;
    };
  };
}

export class [State]ComplianceValidator {
  /**
   * Validate caregiver can be assigned to visit
   */
  canAssignToVisit(
    caregiver: Caregiver,
    visit: Visit,
    client: Client
  ): ValidationResult {
    const issues: ComplianceIssue[] = [];
    
    // Implement validation logic based on REQUIREMENTS.md
    
    return {
      canAssign: issues.filter(i => i.severity === 'BLOCKING').length === 0,
      issues,
    };
  }
  
  /**
   * Validate client authorization for service
   */
  validateAuthorization(
    client: Client,
    serviceType: string,
    scheduledDate: Date
  ): ValidationResult {
    // Implementation
  }
  
  /**
   * Validate visit documentation completeness
   */
  validateVisitDocumentation(
    visit: Visit,
    documentation: VisitDocumentation
  ): ValidationResult {
    // Implementation
  }
}
```

---

### EVV State Configuration

**Location**: `verticals/time-tracking-evv/src/config/state-evv-configs.ts`

```typescript
[XX]: {
  state: '[XX]',
  aggregatorType: '[AGGREGATOR_NAME]',
  aggregatorEndpoint: '[API_URL]',
  gracePeriodMinutes: [X],
  geofenceRadiusMeters: [X],
  geofenceToleranceMeters: [X],
  retryPolicy: EXPONENTIAL_BACKOFF,
  statePrograms: [
    '[PROGRAM_1]',
    '[PROGRAM_2]',
  ],
  stateDepartment: '[DEPARTMENT_ABBREV]',
  // State-specific flags
  [specialFlag]: true,
}
```

---

### State-Specific Providers

**Location**: `verticals/time-tracking-evv/src/providers/[state]-evv-provider.ts`

```typescript
/**
 * [STATE] EVV Provider
 * 
 * Implements [state]-specific EVV business logic and aggregator integration.
 */
export class [State]EVVProvider {
  private aggregator: [AggregatorName]Aggregator;
  private validator: [State]ComplianceValidator;
  
  /**
   * Submit EVV record to state aggregator
   */
  async submitToAggregator(evvRecord: EVVRecord): Promise<SubmissionResult> {
    // State-specific submission logic
  }
  
  /**
   * Handle state-specific manual corrections
   */
  async requestCorrection(
    evvRecord: EVVRecord,
    correction: CorrectionRequest
  ): Promise<CorrectionResult> {
    // Implementation (e.g., VMUR for Texas)
  }
}
```

---

## Database Schema Extensions

### State-Specific Fields

Some states require additional data elements beyond the federal EVV requirements.

**Location**: Database migrations in `packages/core/migrations/`

```typescript
// Example: Add state-specific field to caregivers table
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('caregivers', (table) => {
    // [STATE]-specific credential tracking
    table.timestamp('[state]_registry_check_date').nullable();
    table.enum('[state]_registry_status', ['CLEAR', 'LISTED', 'PENDING']).nullable();
    table.string('[state]_specific_credential').nullable();
  });
}
```

### JSONB State Extensions

For flexible state-specific data that doesn't warrant dedicated columns:

```typescript
// Use state_specific_data JSONB field
{
  state: '[XX]',
  additionalFields: {
    [field1]: 'value',
    [field2]: 'value',
  }
}
```

---

## API Endpoints

### State-Specific Endpoints

**Location**: `api/_server/routes/[state]-compliance.ts`

```typescript
/**
 * [STATE] Compliance API
 */

// Validate caregiver credentials
router.post('/api/compliance/[state]/validate-caregiver', async (req, res) => {
  const validator = new [State]ComplianceValidator();
  const result = await validator.canAssignToVisit(...);
  res.json(result);
});

// Check authorization status
router.get('/api/compliance/[state]/authorization/:clientId', async (req, res) => {
  // Implementation
});

// Submit EVV to state aggregator
router.post('/api/evv/[state]/submit', async (req, res) => {
  const provider = new [State]EVVProvider();
  const result = await provider.submitToAggregator(...);
  res.json(result);
});
```

---

## Testing Strategy

### Compliance Test Suite

**Location**: `packages/core/src/compliance/__tests__/[state]/`

```typescript
// [state]-credentials.test.ts
describe('[STATE] Caregiver Credentials', () => {
  const validator = new [State]ComplianceValidator();
  
  describe('Background Screening', () => {
    it('blocks assignment if no background check on file', () => {
      // Test scenario from REQUIREMENTS.md
    });
    
    it('blocks assignment if background check expired', () => {
      // Test scenario
    });
    
    it('allows assignment with valid background check', () => {
      // Test scenario
    });
  });
  
  describe('Professional Licensure', () => {
    // Test scenarios
  });
  
  describe('Registry Checks', () => {
    // Test scenarios
  });
});

// [state]-authorization.test.ts
describe('[STATE] Client Authorization', () => {
  // Test scenarios
});

// [state]-evv.test.ts
describe('[STATE] EVV Compliance', () => {
  // Test scenarios
});
```

---

## Configuration

### Environment Variables

```bash
# [STATE] EVV Aggregator
[STATE]_AGGREGATOR_API_KEY=your_api_key_here
[STATE]_AGGREGATOR_ENDPOINT=https://api.[aggregator].com/[state]/v1
[STATE]_AGGREGATOR_TIMEOUT=30000

# [STATE] Registry Access (if API available)
[STATE]_REGISTRY_API_KEY=your_api_key_here
[STATE]_REGISTRY_ENDPOINT=https://registry.[state].gov/api/v1

# [STATE] Specific Settings
[STATE]_GEOFENCE_RADIUS=100
[STATE]_GRACE_PERIOD_MINUTES=10
```

---

## Deployment Checklist

### Development Environment
- [ ] State configuration added to `state-evv-configs.ts`
- [ ] Compliance validators implemented
- [ ] Unit tests written and passing
- [ ] Integration tests with mock aggregator
- [ ] Documentation complete

### Staging Environment
- [ ] Database migrations applied
- [ ] State-specific seed data loaded
- [ ] API endpoints deployed
- [ ] Aggregator test credentials configured
- [ ] End-to-end testing with test aggregator
- [ ] Performance testing

### Production Environment
- [ ] Production aggregator credentials configured
- [ ] State registry access set up
- [ ] Monitoring and alerts configured
- [ ] Compliance audit trail enabled
- [ ] Data retention policies configured
- [ ] Staff training completed
- [ ] Regulatory approval obtained (if required)

---

## Integration Points

### With Other Verticals

1. **Caregiver & Staff Management** (`verticals/caregiver-staff/`)
   - Credential tracking
   - Licensure verification
   - Registry checks
   - Assignment eligibility

2. **Client & Demographics** (`verticals/client-demographics/`)
   - Authorization tracking
   - Plan of care management
   - Service eligibility
   - Medicaid program enrollment

3. **Scheduling & Visits** (`verticals/scheduling-visits/`)
   - Assignment validation
   - Visit documentation requirements
   - Compliance checks before scheduling

4. **Time Tracking & EVV** (`verticals/time-tracking-evv/`)
   - State aggregator submission
   - Geofence enforcement
   - Manual override workflow
   - Correction requests

5. **Billing & Invoicing** (`verticals/billing-invoicing/`)
   - Authorization verification
   - Unit tracking
   - Claim submission readiness

---

## External Integrations

### State EVV Aggregator

**Integration Type**: REST API  
**Authentication**: API Key  
**Format**: JSON  
**Endpoint**: [See state config]

**Key Operations:**
- Submit visit (real-time or batch)
- Query visit status
- Request correction (if applicable)
- Retrieve aggregator reports

### State Registries

**Integration Type**: Web scraping or API (if available)  
**Update Frequency**: [Daily, weekly, on-demand]

**Registries:**
- [Registry 1]: [Access method]
- [Registry 2]: [Access method]

---

## Monitoring & Alerts

### Key Metrics

- Caregiver credential compliance rate
- Authorization coverage percentage
- EVV submission success rate
- Geofence verification success rate
- Manual override frequency
- Documentation timeliness
- Regulatory violation flags

### Alerts

- Credential expiring in 30 days
- Authorization at 90% utilization
- EVV submission failure
- Geofence violation pattern
- Excessive manual overrides
- Missing required documentation
- Regulatory compliance issue

---

## Support & Maintenance

### Regulatory Updates

**Process:**
1. Monitor state Medicaid website for policy changes
2. Review proposed rule changes during comment period
3. Update REQUIREMENTS.md when regulations change
4. Update validators and tests to match new requirements
5. Update EVV configuration if aggregator changes
6. Deploy updates to production
7. Notify customers of regulatory changes

**Responsibility:**
- Primary: [Name/Role]
- Backup: [Name/Role]

### Issue Escalation

**Level 1: Technical Support**
- Configuration issues
- User training
- Common compliance questions

**Level 2: Compliance Team**
- Interpretation of regulations
- Edge case decisions
- Regulatory violations

**Level 3: Legal/Regulatory Affairs**
- License jeopardy
- State survey findings
- Regulatory enforcement actions

---

## Known Limitations

1. **Registry Integration**: [If no API, manual verification required]
2. **Real-time Validation**: [Any limitations in real-time compliance checks]
3. **Edge Cases**: [Complex scenarios requiring manual review]
4. **Data Delays**: [Aggregator submission delays or batch windows]

---

## Future Enhancements

### Short-term (Next 3 months)
- [ ] [Enhancement 1]
- [ ] [Enhancement 2]

### Medium-term (3-6 months)
- [ ] [Enhancement 1]
- [ ] [Enhancement 2]

### Long-term (6+ months)
- [ ] [Enhancement 1]
- [ ] [Enhancement 2]

---

## Resources

- [REQUIREMENTS.md](./REQUIREMENTS.md) - Regulatory requirements
- [TEST_SCENARIOS.md](./TEST_SCENARIOS.md) - Test cases
- [CHANGELOG.md](./CHANGELOG.md) - Regulation change history

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
