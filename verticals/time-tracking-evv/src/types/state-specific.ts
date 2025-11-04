/**
 * State-Specific EVV Requirements
 * 
 * Texas and Florida have distinct EVV compliance requirements beyond the
 * federal 21st Century Cures Act baseline.
 */

import { UUID, Timestamp } from '@care-commons/core';

/**
 * State Codes - All states with EVV mandates
 */
export type StateCode = 'TX' | 'FL' | 'OH' | 'PA' | 'GA' | 'NC' | 'AZ';

/**
 * =============================================================================
 * TEXAS-SPECIFIC TYPES
 * =============================================================================
 */

/**
 * Texas EVV Aggregator System (HHAeXchange / TMHP)
 * 
 * Texas operates a mandatory aggregator model. All EVV data must flow through
 * the HHSC-approved aggregator for Medicaid claims matching.
 */
export interface TexasEVVConfig {
  state: 'TX';
  
  // Aggregator configuration
  aggregatorType: 'HHAEEXCHANGE' | 'PROPRIETARY_SYSTEM_OPERATOR';
  aggregatorEntityId: string; // HHSC-assigned Entity ID
  aggregatorSubmissionEndpoint: string;
  aggregatorApiKey?: string;
  
  // Texas program types
  programType: TexasMedicaidProgram;
  
  // Clock method requirements
  allowedClockMethods: TexasClockMethod[];
  requiresGPSForMobile: boolean; // Mandatory for mobile visits
  geoPerimeterTolerance: number; // Meters, typically 100m baseline + allowance
  
  // Grace period rules
  clockInGracePeriodMinutes: number; // Minutes before scheduled start
  clockOutGracePeriodMinutes: number; // Minutes after scheduled end
  lateClockInThresholdMinutes: number; // When late flag triggers
  
  // Visit maintenance
  vmurEnabled: boolean; // Visit Maintenance Unlock Request
  vmurApprovalRequired: boolean;
  vmurReasonCodesRequired: boolean;
}

/**
 * Texas Medicaid Programs requiring EVV
 */
export type TexasMedicaidProgram =
  | 'STAR_PLUS' // Managed care for adults with disabilities
  | 'STAR_KIDS' // Managed care for children with disabilities
  | 'STAR_HEALTH' // Foster care Medicaid
  | 'COMMUNITY_FIRST_CHOICE' // CFC attendant services
  | 'PRIMARY_HOME_CARE' // PHC traditional Medicaid
  | 'PAS' // Personal Assistance Services
  | 'HAB' // Habilitation services
  | 'CDS' // Consumer Directed Services
  | 'CLASS' // Community Living Assistance and Support Services
  | 'DBMD' // Deaf-Blind with Multiple Disabilities;

/**
 * Texas HHSC Clock Methods
 */
export type TexasClockMethod =
  | 'MOBILE_GPS' // Mobile app with GPS (preferred)
  | 'FIXED_TELEPHONY' // Client landline IVR
  | 'FIXED_BIOMETRIC' // Fixed device with biometric
  | 'MOBILE_TELEPHONY' // Mobile phone verification
  | 'ALTERNATE_METHOD'; // Exception, requires justification

/**
 * Texas Visit Maintenance Unlock Request (VMUR)
 * 
 * Required when correcting EVV data after initial submission.
 * Strict audit trail and reason code requirements per HHSC policy.
 */
export interface TexasVMUR {
  id: UUID;
  evvRecordId: UUID;
  visitId: UUID;
  
  // Request details
  requestedBy: UUID;
  requestedByName: string;
  requestedAt: Timestamp;
  requestReason: TexasVMURReasonCode;
  requestReasonDetails: string;
  
  // Approval workflow
  approvalStatus: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED';
  approvedBy?: UUID;
  approvedByName?: string;
  approvedAt?: Timestamp;
  denialReason?: string;
  
  // Original vs corrected data
  originalData: TexasEVVDataSnapshot;
  correctedData: TexasEVVDataSnapshot;
  changesSummary: string[];
  
  // Submission tracking
  submittedToAggregator: boolean;
  aggregatorConfirmation?: string;
  submittedAt?: Timestamp;
  
  // Compliance
  expiresAt: Timestamp; // VMURs expire if not completed
  complianceNotes?: string;
}

/**
 * Texas HHSC VMUR Reason Codes
 * 
 * Per HHSC EVV Policy Handbook, specific reason codes must be used
 * for all visit data corrections.
 */
export type TexasVMURReasonCode =
  // Technical issues
  | 'DEVICE_MALFUNCTION' // Device hardware/software failure
  | 'GPS_UNAVAILABLE' // No GPS signal available
  | 'NETWORK_OUTAGE' // Internet/cellular outage
  | 'APP_ERROR' // Application error or crash
  | 'SYSTEM_DOWNTIME' // EVV system unavailable
  
  // Location exceptions
  | 'RURAL_POOR_SIGNAL' // Rural area with poor GPS/cellular
  | 'SERVICE_LOCATION_CHANGE' // Service at alternate location
  | 'EMERGENCY_EVACUATION' // Emergency/disaster evacuation
  | 'HOSPITAL_TRANSPORT' // Service during hospital transport
  
  // Operational
  | 'FORGOT_TO_CLOCK' // Attendant forgot to clock in/out
  | 'TRAINING_NEW_STAFF' // New staff training period
  | 'INCORRECT_CLOCK_TIME' // Wrong time entered
  | 'DUPLICATE_ENTRY' // Duplicate clock entry error
  
  // Other
  | 'OTHER_APPROVED'; // Other reason, requires detailed explanation

/**
 * Snapshot of EVV data for VMUR audit trail
 */
export interface TexasEVVDataSnapshot {
  clockInTime: Timestamp;
  clockOutTime?: Timestamp;
  clockInLatitude?: number;
  clockInLongitude?: number;
  clockOutLatitude?: number;
  clockOutLongitude?: number;
  clockMethod: TexasClockMethod;
  totalDuration?: number;
}

/**
 * =============================================================================
 * FLORIDA-SPECIFIC TYPES
 * =============================================================================
 */

/**
 * Florida EVV Configuration (Open Model)
 * 
 * Florida allows agencies to choose their own EVV vendor, but data must
 * integrate with AHCA-designated aggregators. Multi-aggregator support
 * required for different payers/MCOs.
 */
export interface FloridaEVVConfig {
  state: 'FL';
  
  // Multi-aggregator support
  aggregators: FloridaAggregatorConnection[];
  defaultAggregator: string; // Primary aggregator ID
  
  // Program types
  programType: FloridaMedicaidProgram;
  
  // Verification requirements
  requiredDataElements: 'CURES_ACT_MINIMUM' | 'AHCA_ENHANCED';
  allowedVerificationMethods: FloridaVerificationMethod[];
  
  // MCO-specific settings
  mcoRequirements?: FloridaMCORequirements;
  
  // Geographic validation
  geoPerimeterTolerance: number; // Meters, often more lenient than TX
  allowTelephonyFallback: boolean; // Phone verification as backup
  
  // Submission windows
  submissionDeadlineDays: number; // Days to submit after service
  lateSubmissionGracePeriodDays: number;
}

/**
 * Florida Medicaid Programs
 */
export type FloridaMedicaidProgram =
  | 'SMMC_LTC' // Statewide Medicaid Managed Care Long-Term Care
  | 'SMMC_MMA' // Statewide Medicaid Managed Care Managed Medical Assistance
  | 'FFS_MEDICAID' // Fee-For-Service Medicaid
  | 'DOEA_HOMECARE' // Department of Elder Affairs home care
  | 'APD_WAIVER' // Agency for Persons with Disabilities waiver
  | 'PACE' // Program of All-Inclusive Care for the Elderly
  | 'PRIVATE_DUTY_NURSING'; // Private duty nursing services

/**
 * Florida Aggregator Connection
 */
export interface FloridaAggregatorConnection {
  id: string;
  name: string;
  type: 'HHAEEXCHANGE' | 'NETSMART_TELLUS' | 'ICONNECT' | 'OTHER';
  endpoint: string;
  apiKey?: string;
  isActive: boolean;
  
  // Payer/MCO mappings
  assignedPayers: string[]; // Which payers route through this aggregator
  assignedMCOs: string[]; // Which MCOs route through this aggregator
  
  // Submission settings
  batchSubmission: boolean;
  realTimeSubmission: boolean;
  maxBatchSize?: number;
}

/**
 * Florida Verification Methods
 */
export type FloridaVerificationMethod =
  | 'MOBILE_GPS' // Mobile GPS (most common)
  | 'TELEPHONY_IVR' // Telephone IVR system
  | 'BIOMETRIC_FIXED' // Fixed biometric device
  | 'BIOMETRIC_MOBILE' // Mobile biometric verification
  | 'MANUAL_SUPERVISOR'; // Manual supervisor verification

/**
 * Florida MCO-Specific Requirements
 * 
 * Different Managed Care Organizations may have additional requirements
 * beyond state minimums.
 */
export interface FloridaMCORequirements {
  mcoName: string;
  mcoId: string;
  
  // Additional data elements
  requiresClientSignature: boolean;
  requiresTaskDocumentation: boolean;
  requiresPhotoVerification: boolean;
  
  // Billing interface
  billingInterfaceType: 'ELECTRONIC_837' | 'PORTAL_UPLOAD' | 'BATCH_FILE' | 'API';
  billingSubmissionEndpoint?: string;
  
  // Service authorization
  requiresPriorAuth: boolean;
  authorizationValidationEndpoint?: string;
}

/**
 * =============================================================================
 * SHARED STATE-SPECIFIC FUNCTIONALITY
 * =============================================================================
 */

/**
 * State-Specific EVV Validation Rules
 */
export interface StateEVVRules {
  state: StateCode;
  
  // Geographic validation
  geoFenceRadius: number; // Base radius in meters
  geoFenceTolerance: number; // Additional tolerance in meters
  geoFenceToleranceReason?: string; // Why tolerance is applied
  
  // Timing rules
  maxClockInEarlyMinutes: number; // How early can clock in
  maxClockOutLateMinutes: number; // How late can clock out
  overtimeThresholdMinutes: number; // When overtime rules apply
  
  // Verification requirements
  minimumGPSAccuracy: number; // Meters
  requiresBiometric: boolean;
  requiresPhoto: boolean;
  requiresClientAttestation: boolean;
  
  // Exception handling
  allowManualOverride: boolean;
  manualOverrideRequiresSupervisor: boolean;
  manualOverrideReasonCodesRequired: string[];
  
  // Data retention
  retentionYears: number; // Minimum retention period
  immutableAfterDays: number; // Days after which record becomes immutable
}

/**
 * State-Specific Aggregator Submission
 */
export interface StateAggregatorSubmission {
  id: UUID;
  state: StateCode;
  evvRecordId: UUID;
  aggregatorId: string;
  aggregatorType: string;
  
  // Submission data
  submissionPayload: Record<string, unknown>; // State-specific format
  submissionFormat: 'JSON' | 'XML' | 'HL7' | 'PROPRIETARY';
  submittedAt: Timestamp;
  submittedBy: UUID;
  
  // Response tracking
  submissionStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PARTIAL' | 'RETRY';
  aggregatorResponse?: Record<string, unknown>;
  aggregatorConfirmationId?: string;
  aggregatorReceivedAt?: Timestamp;
  
  // Error handling
  errorCode?: string;
  errorMessage?: string;
  errorDetails?: Record<string, unknown>;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Timestamp;
  
  // Audit
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * State-Specific Exception Event
 */
export interface StateEVVException {
  id: UUID;
  state: StateCode;
  evvRecordId: UUID;
  visitId: UUID;
  
  exceptionType: StateExceptionType;
  exceptionCode: string; // State-specific code
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  
  description: string;
  detectedAt: Timestamp;
  detectedBy: 'SYSTEM' | 'AGGREGATOR' | 'SUPERVISOR' | 'AUDIT';
  
  // Resolution
  requiresAction: boolean;
  actionRequired?: string;
  actionDeadline?: Timestamp;
  
  resolvedAt?: Timestamp;
  resolvedBy?: UUID;
  resolutionNotes?: string;
  resolutionMethod?: 'VMUR' | 'OVERRIDE' | 'RESUBMISSION' | 'WAIVER';
  
  // State-specific data
  stateSpecificData?: TexasVMUR | FloridaEVVException;
}

export type StateExceptionType =
  // Geographic
  | 'GEOFENCE_VIOLATION'
  | 'GPS_ACCURACY_LOW'
  | 'LOCATION_JUMP' // Impossible distance in time
  | 'MOCK_LOCATION_DETECTED'
  
  // Timing
  | 'CLOCK_IN_TOO_EARLY'
  | 'CLOCK_IN_TOO_LATE'
  | 'CLOCK_OUT_TOO_LATE'
  | 'VISIT_DURATION_ANOMALY'
  | 'TIME_GAP_DETECTED'
  
  // Technical
  | 'DEVICE_SECURITY_ISSUE' // Rooted/jailbroken
  | 'OFFLINE_SYNC_CONFLICT'
  | 'INTEGRITY_HASH_MISMATCH'
  | 'DUPLICATE_SUBMISSION'
  
  // Compliance
  | 'MISSING_SIGNATURE'
  | 'MISSING_TASK_DOCUMENTATION'
  | 'AUTHORIZATION_MISMATCH'
  | 'LATE_SUBMISSION'
  | 'AGGREGATOR_REJECTION';

/**
 * Florida-Specific Exception (beyond base)
 */
export interface FloridaEVVException {
  mcoName?: string;
  mcoExceptionCode?: string;
  billingInterfaceIssue?: boolean;
  authorizationValidationFailed?: boolean;
}

/**
 * =============================================================================
 * STATE-SPECIFIC CONFIGURATION HELPERS
 * =============================================================================
 */

/**
 * Get state-specific EVV rules
 */
export function getStateEVVRules(state: StateCode): StateEVVRules {
  switch (state) {
    case 'TX':
      return {
        state: 'TX',
        geoFenceRadius: 100, // Base 100m per HHSC guidance
        geoFenceTolerance: 50, // Additional 50m for GPS accuracy
        geoFenceToleranceReason: 'HHSC EVV Policy allows tolerance for GPS accuracy',
        maxClockInEarlyMinutes: 10,
        maxClockOutLateMinutes: 10,
        overtimeThresholdMinutes: 15,
        minimumGPSAccuracy: 100, // Meters
        requiresBiometric: false,
        requiresPhoto: false,
        requiresClientAttestation: false,
        allowManualOverride: true,
        manualOverrideRequiresSupervisor: true,
        manualOverrideReasonCodesRequired: [
          'DEVICE_MALFUNCTION',
          'GPS_UNAVAILABLE',
          'SERVICE_LOCATION_CHANGE',
          'EMERGENCY',
          'RURAL_POOR_SIGNAL',
          'OTHER_APPROVED',
        ],
        retentionYears: 6, // HHSC minimum
        immutableAfterDays: 30, // After 30 days, requires VMUR
      };
      
    case 'FL':
      return {
        state: 'FL',
        geoFenceRadius: 150, // Florida typically more lenient
        geoFenceTolerance: 100, // Larger tolerance
        geoFenceToleranceReason: 'AHCA allows larger tolerance for diverse geography',
        maxClockInEarlyMinutes: 15,
        maxClockOutLateMinutes: 15,
        overtimeThresholdMinutes: 20,
        minimumGPSAccuracy: 150, // Meters
        requiresBiometric: false, // Depends on MCO
        requiresPhoto: false, // Depends on MCO
        requiresClientAttestation: false, // Depends on MCO
        allowManualOverride: true,
        manualOverrideRequiresSupervisor: true,
        manualOverrideReasonCodesRequired: [
          'GPS_UNAVAILABLE',
          'DEVICE_MALFUNCTION',
          'CLIENT_LOCATION_CHANGE',
          'EMERGENCY',
          'TECHNICAL_ISSUE',
          'OTHER',
        ],
        retentionYears: 6, // AHCA minimum
        immutableAfterDays: 45, // More lenient correction window
      };
      
    case 'OH':
      return {
        state: 'OH',
        geoFenceRadius: 125, // Ohio Dept of Medicaid standard
        geoFenceTolerance: 75, // Moderate tolerance
        geoFenceToleranceReason: 'ODM allows reasonable GPS accuracy variance',
        maxClockInEarlyMinutes: 10,
        maxClockOutLateMinutes: 10,
        overtimeThresholdMinutes: 15,
        minimumGPSAccuracy: 125, // Meters
        requiresBiometric: false,
        requiresPhoto: false,
        requiresClientAttestation: false,
        allowManualOverride: true,
        manualOverrideRequiresSupervisor: true,
        manualOverrideReasonCodesRequired: [
          'GPS_UNAVAILABLE',
          'DEVICE_MALFUNCTION',
          'EMERGENCY',
          'TECHNICAL_ISSUE',
          'OTHER',
        ],
        retentionYears: 6, // Federal minimum
        immutableAfterDays: 30,
      };
      
    case 'PA':
      return {
        state: 'PA',
        geoFenceRadius: 100, // Pennsylvania DHS requirement
        geoFenceTolerance: 50, // Conservative tolerance
        geoFenceToleranceReason: 'DHS EVV standards allow GPS accuracy variance',
        maxClockInEarlyMinutes: 15,
        maxClockOutLateMinutes: 15,
        overtimeThresholdMinutes: 15,
        minimumGPSAccuracy: 100, // Meters
        requiresBiometric: false,
        requiresPhoto: false,
        requiresClientAttestation: false,
        allowManualOverride: true,
        manualOverrideRequiresSupervisor: true,
        manualOverrideReasonCodesRequired: [
          'GPS_UNAVAILABLE',
          'DEVICE_MALFUNCTION',
          'RURAL_AREA',
          'EMERGENCY',
          'OTHER',
        ],
        retentionYears: 7, // PA requires 7 years
        immutableAfterDays: 35,
      };
      
    case 'GA':
      return {
        state: 'GA',
        geoFenceRadius: 150, // Georgia DCH - most lenient
        geoFenceTolerance: 100, // Generous tolerance
        geoFenceToleranceReason: 'DCH allows larger variance for rural areas',
        maxClockInEarlyMinutes: 15,
        maxClockOutLateMinutes: 15,
        overtimeThresholdMinutes: 20,
        minimumGPSAccuracy: 150, // Meters
        requiresBiometric: false,
        requiresPhoto: false,
        requiresClientAttestation: false,
        allowManualOverride: true,
        manualOverrideRequiresSupervisor: true,
        manualOverrideReasonCodesRequired: [
          'GPS_UNAVAILABLE',
          'DEVICE_MALFUNCTION',
          'RURAL_AREA',
          'CLIENT_LOCATION_CHANGE',
          'EMERGENCY',
          'OTHER',
        ],
        retentionYears: 6,
        immutableAfterDays: 45, // Lenient correction window
      };
      
    case 'NC':
      return {
        state: 'NC',
        geoFenceRadius: 120, // North Carolina DHHS
        geoFenceTolerance: 60, // Moderate tolerance
        geoFenceToleranceReason: 'DHHS allows moderate GPS variance',
        maxClockInEarlyMinutes: 10,
        maxClockOutLateMinutes: 10,
        overtimeThresholdMinutes: 15,
        minimumGPSAccuracy: 120, // Meters
        requiresBiometric: false,
        requiresPhoto: false,
        requiresClientAttestation: false,
        allowManualOverride: true,
        manualOverrideRequiresSupervisor: true,
        manualOverrideReasonCodesRequired: [
          'GPS_UNAVAILABLE',
          'DEVICE_MALFUNCTION',
          'EMERGENCY',
          'RURAL_AREA',
          'OTHER',
        ],
        retentionYears: 6,
        immutableAfterDays: 30,
      };
      
    case 'AZ':
      return {
        state: 'AZ',
        geoFenceRadius: 100, // Arizona AHCCCS standard
        geoFenceTolerance: 50, // Conservative
        geoFenceToleranceReason: 'AHCCCS EVV policy GPS tolerance',
        maxClockInEarlyMinutes: 10,
        maxClockOutLateMinutes: 10,
        overtimeThresholdMinutes: 15,
        minimumGPSAccuracy: 100, // Meters
        requiresBiometric: false,
        requiresPhoto: false,
        requiresClientAttestation: false,
        allowManualOverride: true,
        manualOverrideRequiresSupervisor: true,
        manualOverrideReasonCodesRequired: [
          'GPS_UNAVAILABLE',
          'DEVICE_MALFUNCTION',
          'EMERGENCY',
          'RURAL_AREA',
          'OTHER',
        ],
        retentionYears: 6,
        immutableAfterDays: 30,
      };
      
    default:
      throw new Error(`Unsupported state: ${state}`);
  }
}

/**
 * Determine which aggregator to use for a visit
 */
export function selectAggregator(
  state: StateCode,
  config: TexasEVVConfig | FloridaEVVConfig,
  payerId?: string,
  mcoId?: string
): string {
  if (state === 'TX') {
    // Texas has single mandatory aggregator
    return (config as TexasEVVConfig).aggregatorEntityId;
  }
  
  if (state === 'FL') {
    const flConfig = config as FloridaEVVConfig;
    
    // Match aggregator by payer or MCO
    if (payerId || mcoId) {
      const matchedAgg = flConfig.aggregators.find(agg =>
        agg.isActive &&
        (payerId && agg.assignedPayers.includes(payerId) ||
         mcoId && agg.assignedMCOs.includes(mcoId))
      );
      
      if (matchedAgg) {
        return matchedAgg.id;
      }
    }
    
    // Fall back to default
    return flConfig.defaultAggregator;
  }
  
  throw new Error(`Unsupported state: ${state}`);
}
