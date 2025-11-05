# Texas Compliance Implementation Guide

**State Code**: TX  
**Last Updated**: 2025-11-05  
**Implementation Status**: In Progress

## Overview

This document describes how Care Commons implements Texas regulatory requirements as documented in [REQUIREMENTS.md](./REQUIREMENTS.md).

## Implementation Status

### Caregiver Credentials
- [x] Employee Misconduct Registry validation
- [x] Nurse Aide Registry verification
- [x] Background screening tracking
- [ ] TB testing tracking (planned)
- [ ] Training requirements tracking (planned)

### Client Authorization
- [x] Service authorization tracking
- [x] Units consumed monitoring
- [x] Plan of care management (basic)
- [ ] Physician order tracking (planned)
- [ ] Authorization renewal alerts (planned)

### Visit Documentation
- [ ] Required field validation (planned)
- [ ] Documentation timeliness checks (planned)
- [ ] Quality standards enforcement (planned)
- [ ] Supervisor review workflow (planned)

### EVV Compliance
- [x] Six data elements captured
- [x] HHAeXchange aggregator integration
- [x] Geofence configuration (100m + 50m tolerance)
- [x] Grace period enforcement (10 minutes)
- [x] VMUR workflow implemented

### Data Retention
- [x] 6-year retention policy configured
- [ ] Automated archival (planned)
- [ ] Audit trail preservation (implemented in core)

### Privacy & Security
- [x] HIPAA compliance (role-based permissions)
- [x] Field-level permissions
- [x] Audit logging
- [ ] Texas Medical Records Privacy Act compliance (planned)

---

## Code Structure

### Texas Compliance Validator

**Location**: `packages/core/src/compliance/texas/`

```typescript
// packages/core/src/compliance/texas/credentials.ts
export interface TexasCredentialRequirements {
  employeeMisconductRegistry: {
    frequency: 'ANNUAL';
    expiration: 365; // days
    blockingIssue: true;
    apiEndpoint: 'https://apps.hhs.texas.gov/emr/api/search'; // If available
  };
  
  nurseAideRegistry: {
    appliesTo: ['CNA', 'MEDICATION_AIDE'];
    frequency: 'AT_HIRE_AND_ANNUAL';
    verificationMethod: 'MANUAL_SEARCH'; // No public API
    registryUrl: 'https://vo.hhsc.state.tx.us/datamart/mainMenu.do';
  };
  
  backgroundScreening: {
    level: 'LEVEL_2'; // For vulnerable adults
    frequency: 'BIENNIAL'; // Every 2 years
    components: [
      'CRIMINAL_HISTORY_TX_DPS',
      'FBI_FINGERPRINTS',
      'SEX_OFFENDER_REGISTRY',
      'DFPS_REGISTRY',
      'HHSC_EXCLUSIONS',
      'OIG_EXCLUSIONS'
    ];
  };
  
  tbTesting: {
    frequency: 'ANNUAL';
    acceptableTests: ['SKIN_TEST', 'IGRA_BLOOD_TEST', 'CHEST_XRAY'];
    expiration: 365; // days
  };
  
  training: {
    orientationHours: 16;
    annualInServiceHours: 12;
    requiredTopics: [
      'INFECTION_CONTROL',
      'CLIENT_RIGHTS',
      'EMERGENCY_PROCEDURES',
      'HIPAA_CONFIDENTIALITY',
      'ABUSE_NEGLECT_REPORTING'
    ];
  };
}

export class TexasComplianceValidator extends BaseComplianceValidator {
  readonly state: StateCode = 'TX';
  
  protected readonly credentialConfig: StateCredentialConfig = {
    backgroundScreening: {
      required: true,
      type: 'LEVEL_2',
      frequency: 'BIENNIAL',
      expirationDays: 730,
      warningDays: 60,
    },
    licensure: {
      required: false, // Not all TX caregivers require licensure
      roles: ['RN', 'LVN', 'CNA'],
      verificationFrequency: 'ANNUAL',
    },
    registryChecks: [
      {
        name: 'Employee Misconduct Registry',
        type: 'EMPLOYEE_MISCONDUCT',
        frequency: 'ANNUAL',
        expirationDays: 365,
      },
      {
        name: 'Nurse Aide Registry',
        type: 'NURSE_AIDE',
        frequency: 'ANNUAL',
        expirationDays: 365,
      },
    ],
  };
  
  protected readonly authorizationConfig: StateAuthorizationConfig = {
    required: true,
    warningThreshold: 0.9, // Alert at 90% utilization
    allowOverage: false,
  };
  
  /**
   * Validate caregiver credentials for Texas
   */
  async canAssignToVisit(
    caregiver: CaregiverCredentials,
    visit: VisitDetails,
    client: ClientDetails
  ): Promise<ValidationResult> {
    const issues: ComplianceIssue[] = [];
    
    // Base validation (background, licensure, registries)
    const baseResult = await super.canAssignToVisit(caregiver, visit, client);
    issues.push(...baseResult.issues);
    
    // Texas-specific EMR check
    const emrIssues = this.validateEMR(caregiver);
    issues.push(...emrIssues);
    
    // Texas-specific NAR check (for CNAs)
    const narIssues = this.validateNAR(caregiver, visit);
    issues.push(...narIssues);
    
    // TB testing
    const tbIssues = this.validateTBTesting(caregiver);
    issues.push(...tbIssues);
    
    // Training requirements
    const trainingIssues = this.validateTraining(caregiver);
    issues.push(...trainingIssues);
    
    return issues.length > 0
      ? createFailureResult(issues, 'TX', 'TexasComplianceValidator')
      : createSuccessResult('TX', 'TexasComplianceValidator');
  }
  
  /**
   * Validate Employee Misconduct Registry check
   */
  private validateEMR(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const emrCheck = caregiver.registryChecks.find(
      (check) => check.type === 'EMPLOYEE_MISCONDUCT'
    );
    
    // Missing EMR check
    if (!emrCheck || !emrCheck.checkDate) {
      issues.push({
        type: 'TX_EMR_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'No Employee Misconduct Registry check on file',
        regulation: '26 TAC §558.353',
        remediation: 'Perform EMR search at https://apps.hhs.texas.gov/emr/',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
      return issues;
    }
    
    // Listed on EMR (permanent disqualification)
    if (emrCheck.status === 'LISTED') {
      issues.push({
        type: 'TX_EMR_LISTED',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Caregiver listed on Employee Misconduct Registry - permanent disqualification',
        regulation: 'Texas Human Resources Code §40.053',
        remediation: 'Cannot employ - contact HHSC compliance',
        canBeOverridden: false,
        requiresComplianceReview: true,
      });
      return issues;
    }
    
    // EMR check expired (>365 days)
    const daysSinceCheck = daysSince(emrCheck.checkDate);
    if (daysSinceCheck > 365) {
      issues.push({
        type: 'TX_EMR_EXPIRED',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `EMR check expired ${daysSinceCheck - 365} days ago (annual verification required)`,
        regulation: '26 TAC §558.353',
        remediation: 'Re-verify EMR status within 30 days',
        canBeOverridden: false,
        metadata: { daysSinceCheck, daysOverdue: daysSinceCheck - 365 },
      });
    }
    // Warning: EMR check expiring soon (within 30 days)
    else if (daysSinceCheck > 335) {
      issues.push({
        type: 'TX_EMR_EXPIRING_SOON',
        severity: 'WARNING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `EMR check due for renewal in ${365 - daysSinceCheck} days`,
        regulation: '26 TAC §558.353',
        remediation: 'Schedule EMR re-verification',
        canBeOverridden: true,
        metadata: { daysSinceCheck, daysUntilDue: 365 - daysSinceCheck },
      });
    }
    
    return issues;
  }
  
  /**
   * Validate Nurse Aide Registry (for CNAs only)
   */
  private validateNAR(
    caregiver: CaregiverCredentials,
    visit: VisitDetails
  ): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    
    // Check if this is a CNA or requires CNA certification
    const isCNA = caregiver.licenses.some((license) => license.type === 'CNA');
    const requiresCNA = visit.serviceType.includes('CNA'); // Simplified check
    
    if (!isCNA && !requiresCNA) {
      return issues; // NAR check not required
    }
    
    const narCheck = caregiver.registryChecks.find(
      (check) => check.type === 'NURSE_AIDE'
    );
    
    // Missing NAR check for CNA
    if (!narCheck) {
      issues.push({
        type: 'TX_NAR_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'No Nurse Aide Registry verification for CNA',
        regulation: '26 TAC §558.3',
        remediation: 'Verify NAR status at https://vo.hhsc.state.tx.us/',
        canBeOverridden: false,
      });
      return issues;
    }
    
    // NAR status not active
    if (narCheck.status !== 'CLEAR') {
      issues.push({
        type: 'TX_NAR_INACTIVE',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `Nurse Aide Registry status: ${narCheck.status}`,
        regulation: '26 TAC §558.3',
        remediation: 'Cannot assign CNA tasks - registry status must be Active',
        canBeOverridden: false,
      });
    }
    
    return issues;
  }
  
  /**
   * Validate TB testing
   */
  private validateTBTesting(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const tbData = caregiver.stateSpecificData?.texas?.tbTesting;
    
    if (!tbData || !tbData.testDate) {
      issues.push({
        type: 'TX_TB_TEST_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'No TB test on file',
        regulation: '26 TAC §558.357',
        remediation: 'Complete TB screening (skin test or IGRA blood test)',
        canBeOverridden: false,
      });
      return issues;
    }
    
    const daysSinceTest = daysSince(tbData.testDate);
    if (daysSinceTest > 365) {
      issues.push({
        type: 'TX_TB_TEST_EXPIRED',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `TB test expired ${daysSinceTest - 365} days ago`,
        regulation: '26 TAC §558.357',
        remediation: 'Complete annual TB screening',
        canBeOverridden: false,
        metadata: { daysSinceTest },
      });
    }
    
    return issues;
  }
  
  /**
   * Validate training requirements
   */
  private validateTraining(caregiver: CaregiverCredentials): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const trainingData = caregiver.stateSpecificData?.texas?.training;
    
    // Orientation required
    if (!trainingData || !trainingData.orientationCompletedDate) {
      issues.push({
        type: 'TX_ORIENTATION_MISSING',
        severity: 'BLOCKING',
        category: 'CAREGIVER_CREDENTIALS',
        message: 'Orientation training not completed (16 hours required)',
        regulation: '26 TAC §558.359',
        remediation: 'Complete orientation training before client contact',
        canBeOverridden: false,
      });
      return issues;
    }
    
    // Annual in-service required
    const currentYear = new Date().getFullYear();
    if (
      !trainingData.annualInServiceYear ||
      trainingData.annualInServiceYear < currentYear ||
      trainingData.annualInServiceHours < 12
    ) {
      issues.push({
        type: 'TX_INSERVICE_DUE',
        severity: 'WARNING',
        category: 'CAREGIVER_CREDENTIALS',
        message: `Annual in-service training due (12 hours required for ${currentYear})`,
        regulation: '26 TAC §558.359',
        remediation: 'Complete 12 hours of in-service training',
        canBeOverridden: true,
        metadata: { year: currentYear, hoursCompleted: trainingData.annualInServiceHours || 0 },
      });
    }
    
    return issues;
  }
  
  /**
   * Regulatory citations
   */
  protected getBackgroundRegulation(): string {
    return 'Texas Human Resources Code §250.006';
  }
  
  protected getLicensureRegulation(): string {
    return '26 TAC §558.3';
  }
  
  protected getRegistryRegulation(type: string): string {
    if (type === 'EMPLOYEE_MISCONDUCT') {
      return '26 TAC §558.353';
    }
    if (type === 'NURSE_AIDE') {
      return '26 TAC §558.3';
    }
    return '26 TAC §558';
  }
  
  protected getAuthorizationRegulation(): string {
    return 'Texas Administrative Code Title 1, Part 15';
  }
  
  protected getDocumentationRegulation(): string {
    return '26 TAC §558.363';
  }
  
  protected getPlanOfCareRegulation(): string {
    return '26 TAC §558.363';
  }
}
```

---

### EVV Texas Provider

**Location**: `verticals/time-tracking-evv/src/providers/texas-evv-provider.ts`

```typescript
/**
 * Texas EVV Provider
 * 
 * Implements Texas-specific EVV business logic and HHAeXchange integration.
 */
export class TexasEVVProvider {
  private aggregator: HHAeXchangeAggregator;
  private validator: TexasComplianceValidator;
  
  /**
   * Submit EVV record to HHAeXchange
   */
  async submitToAggregator(evvRecord: EVVRecord): Promise<SubmissionResult> {
    // Validate all required fields present
    if (!this.validateTexasRequirements(evvRecord)) {
      throw new ValidationError('Missing required Texas EVV fields');
    }
    
    // Transform to HHAeXchange format
    const payload = this.transformToHHAeXchangeFormat(evvRecord);
    
    // Submit to aggregator
    const result = await this.aggregator.submitVisit(payload);
    
    // Log submission
    await this.logSubmission(evvRecord.id, result);
    
    return result;
  }
  
  /**
   * Request Visit Maintenance Unlock (VMUR)
   */
  async requestVMUR(
    evvRecord: EVVRecord,
    reason: TexasVMURReasonCode,
    reasonDetails: string,
    requestedBy: string
  ): Promise<VMURResult> {
    // Create VMUR record
    const vmur: TexasVMUR = {
      id: generateUUID(),
      evvRecordId: evvRecord.id,
      visitId: evvRecord.visitId,
      requestedBy,
      requestedByName: await this.getUserName(requestedBy),
      requestedAt: new Date(),
      requestReason: reason,
      requestReasonDetails: reasonDetails,
      approvalStatus: 'PENDING',
      originalData: this.captureSnapshot(evvRecord),
      expiresAt: addDays(new Date(), 30),
    };
    
    // Submit VMUR to HHAeXchange
    const result = await this.aggregator.submitVMUR(vmur);
    
    // Store VMUR record
    await this.vmurRepository.create(vmur);
    
    return result;
  }
  
  /**
   * Validate Texas-specific EVV requirements
   */
  private validateTexasRequirements(evvRecord: EVVRecord): boolean {
    // All 6 federal elements required
    const hasAllElements = 
      evvRecord.serviceType &&
      evvRecord.clientId &&
      evvRecord.caregiverId &&
      evvRecord.serviceDate &&
      evvRecord.locationVerification &&
      evvRecord.clockInTime &&
      evvRecord.clockOutTime;
    
    if (!hasAllElements) return false;
    
    // Texas-specific: MCO code required for managed care
    if (evvRecord.stateSpecificData?.mcoCode === undefined) {
      return false;
    }
    
    // Texas-specific: Authorization number required
    if (!evvRecord.stateSpecificData?.authorizationNumber) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Transform EVV record to HHAeXchange format
   */
  private transformToHHAeXchangeFormat(evvRecord: EVVRecord): HHAeXchangePayload {
    return {
      visitId: evvRecord.visitId,
      serviceType: evvRecord.serviceType,
      clientMedicaidId: evvRecord.clientMedicaidId,
      caregiverEmployeeId: evvRecord.caregiverEmployeeId,
      serviceDate: format(evvRecord.serviceDate, 'yyyy-MM-dd'),
      serviceLocation: {
        latitude: evvRecord.locationVerification.clockInLocation.latitude,
        longitude: evvRecord.locationVerification.clockInLocation.longitude,
        address: evvRecord.serviceAddress,
      },
      clockInTime: evvRecord.clockInTime.toISOString(),
      clockOutTime: evvRecord.clockOutTime?.toISOString(),
      authorizationNumber: evvRecord.stateSpecificData?.authorizationNumber,
      mcoCode: evvRecord.stateSpecificData?.mcoCode,
      programType: evvRecord.stateSpecificData?.programType || 'STAR_PLUS',
    };
  }
}
```

---

### Database Schema Extensions

**Location**: `packages/core/migrations/`

```typescript
// Migration: Add Texas-specific caregiver fields
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('caregivers', (table) => {
    // Employee Misconduct Registry
    table.timestamp('tx_emr_check_date').nullable();
    table.enum('tx_emr_status', ['CLEAR', 'LISTED', 'PENDING']).nullable();
    table.string('tx_emr_documentation').nullable();
    
    // Nurse Aide Registry
    table.string('tx_nar_number').nullable();
    table.timestamp('tx_nar_check_date').nullable();
    table.enum('tx_nar_status', ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED']).nullable();
    table.timestamp('tx_nar_expiration').nullable();
    
    // TB Testing
    table.timestamp('tx_tb_test_date').nullable();
    table.enum('tx_tb_test_type', ['SKIN_TEST', 'IGRA_BLOOD_TEST', 'CHEST_XRAY']).nullable();
    table.enum('tx_tb_test_result', ['NEGATIVE', 'POSITIVE']).nullable();
    
    // Training
    table.timestamp('tx_orientation_completed').nullable();
    table.integer('tx_orientation_hours').nullable();
    table.integer('tx_annual_inservice_year').nullable();
    table.integer('tx_annual_inservice_hours').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('caregivers', (table) => {
    table.dropColumns(
      'tx_emr_check_date',
      'tx_emr_status',
      'tx_emr_documentation',
      'tx_nar_number',
      'tx_nar_check_date',
      'tx_nar_status',
      'tx_nar_expiration',
      'tx_tb_test_date',
      'tx_tb_test_type',
      'tx_tb_test_result',
      'tx_orientation_completed',
      'tx_orientation_hours',
      'tx_annual_inservice_year',
      'tx_annual_inservice_hours'
    );
  });
}
```

---

## Testing Strategy

### Texas Compliance Test Suite

**Location**: `packages/core/src/compliance/__tests__/texas/`

```typescript
// texas-credentials.test.ts
describe('Texas Caregiver Credentials', () => {
  const validator = new TexasComplianceValidator();
  
  describe('Employee Misconduct Registry', () => {
    it('blocks assignment if no EMR check on file', async () => {
      const caregiver = createCaregiver({
        registryChecks: [] // No EMR check
      });
      
      const result = await validator.canAssignToVisit(caregiver, visit, client);
      
      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'TX_EMR_MISSING',
          severity: 'BLOCKING',
          regulation: '26 TAC §558.353',
        })
      );
    });
    
    it('permanently blocks if caregiver listed on EMR', async () => {
      const caregiver = createCaregiver({
        registryChecks: [{
          name: 'Employee Misconduct Registry',
          type: 'EMPLOYEE_MISCONDUCT',
          checkDate: new Date(),
          status: 'LISTED', // RED FLAG
          state: 'TX',
        }]
      });
      
      const result = await validator.canAssignToVisit(caregiver, visit, client);
      
      expect(result.canProceed).toBe(false);
      const emrIssue = result.issues.find(i => i.type === 'TX_EMR_LISTED');
      expect(emrIssue?.canBeOverridden).toBe(false);
      expect(emrIssue?.requiresComplianceReview).toBe(true);
    });
    
    it('blocks assignment if EMR check expired (>365 days)', async () => {
      const caregiver = createCaregiver({
        registryChecks: [{
          name: 'Employee Misconduct Registry',
          type: 'EMPLOYEE_MISCONDUCT',
          checkDate: subDays(new Date(), 400), // 400 days ago
          status: 'CLEAR',
          state: 'TX',
        }]
      });
      
      const result = await validator.canAssignToVisit(caregiver, visit, client);
      
      expect(result.canProceed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'TX_EMR_EXPIRED',
          severity: 'BLOCKING',
        })
      );
    });
  });
  
  // Additional test scenarios from TEST_SCENARIOS.md
});
```

---

## Configuration

### Environment Variables

```bash
# Texas HHAeXchange Aggregator
TX_HHAEEXCHANGE_API_KEY=your_api_key_here
TX_HHAEEXCHANGE_ENDPOINT=https://api.hhaeexchange.com/evv/v2/visits
TX_HHAEEXCHANGE_ENTITY_ID=your_entity_id_here
TX_HHAEEXCHANGE_TIMEOUT=30000

# Texas Geofence Settings
TX_GEOFENCE_RADIUS=100
TX_GEOFENCE_TOLERANCE=50
TX_GRACE_PERIOD_MINUTES=10

# Texas VMUR Settings
TX_VMUR_WINDOW_DAYS=30
TX_VMUR_ENABLED=true
```

---

## Deployment Checklist

### Development Environment
- [x] Texas EVV configuration added
- [x] Compliance validators implemented
- [x] Unit tests written
- [ ] Integration tests with mock HHAeXchange

### Staging Environment
- [ ] Database migrations applied
- [ ] Texas-specific seed data
- [ ] API endpoints deployed
- [ ] HHAeXchange test credentials configured
- [ ] End-to-end testing

### Production Environment
- [ ] Production HHAeXchange credentials configured
- [ ] HHSC registry access set up
- [ ] Monitoring and alerts configured
- [ ] 6-year data retention configured
- [ ] Staff training completed

---

## Known Limitations

1. **EMR/NAR Integration**: No public API available - manual verification required
2. **VMUR Auto-Approval**: HHAeXchange approval is manual, not automated
3. **Multi-State Caregivers**: EMR check only covers Texas offenses

---

## Resources

- [REQUIREMENTS.md](./REQUIREMENTS.md) - Texas regulatory requirements
- [TEST_SCENARIOS.md](./TEST_SCENARIOS.md) - Texas test cases
- [CHANGELOG.md](./CHANGELOG.md) - Texas regulation change history

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
