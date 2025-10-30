import { UUID, Timestamp } from '@care-commons/core';
export type StateCode = 'TX' | 'FL';
export interface TexasEVVConfig {
    state: 'TX';
    aggregatorType: 'HHAEEXCHANGE' | 'PROPRIETARY_SYSTEM_OPERATOR';
    aggregatorEntityId: string;
    aggregatorSubmissionEndpoint: string;
    aggregatorApiKey?: string;
    programType: TexasMedicaidProgram;
    allowedClockMethods: TexasClockMethod[];
    requiresGPSForMobile: boolean;
    geoPerimeterTolerance: number;
    clockInGracePeriodMinutes: number;
    clockOutGracePeriodMinutes: number;
    lateClockInThresholdMinutes: number;
    vmurEnabled: boolean;
    vmurApprovalRequired: boolean;
    vmurReasonCodesRequired: boolean;
}
export type TexasMedicaidProgram = 'STAR_PLUS' | 'STAR_KIDS' | 'STAR_HEALTH' | 'COMMUNITY_FIRST_CHOICE' | 'PRIMARY_HOME_CARE' | 'PAS' | 'HAB' | 'CDS' | 'CLASS' | 'DBMD';
export type TexasClockMethod = 'MOBILE_GPS' | 'FIXED_TELEPHONY' | 'FIXED_BIOMETRIC' | 'MOBILE_TELEPHONY' | 'ALTERNATE_METHOD';
export interface TexasVMUR {
    id: UUID;
    evvRecordId: UUID;
    visitId: UUID;
    requestedBy: UUID;
    requestedByName: string;
    requestedAt: Timestamp;
    requestReason: TexasVMURReasonCode;
    requestReasonDetails: string;
    approvalStatus: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED';
    approvedBy?: UUID;
    approvedByName?: string;
    approvedAt?: Timestamp;
    denialReason?: string;
    originalData: TexasEVVDataSnapshot;
    correctedData: TexasEVVDataSnapshot;
    changesSummary: string[];
    submittedToAggregator: boolean;
    aggregatorConfirmation?: string;
    submittedAt?: Timestamp;
    expiresAt: Timestamp;
    complianceNotes?: string;
}
export type TexasVMURReasonCode = 'DEVICE_MALFUNCTION' | 'GPS_UNAVAILABLE' | 'NETWORK_OUTAGE' | 'APP_ERROR' | 'SYSTEM_DOWNTIME' | 'RURAL_POOR_SIGNAL' | 'SERVICE_LOCATION_CHANGE' | 'EMERGENCY_EVACUATION' | 'HOSPITAL_TRANSPORT' | 'FORGOT_TO_CLOCK' | 'TRAINING_NEW_STAFF' | 'INCORRECT_CLOCK_TIME' | 'DUPLICATE_ENTRY' | 'OTHER_APPROVED';
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
export interface FloridaEVVConfig {
    state: 'FL';
    aggregators: FloridaAggregatorConnection[];
    defaultAggregator: string;
    programType: FloridaMedicaidProgram;
    requiredDataElements: 'CURES_ACT_MINIMUM' | 'AHCA_ENHANCED';
    allowedVerificationMethods: FloridaVerificationMethod[];
    mcoRequirements?: FloridaMCORequirements;
    geoPerimeterTolerance: number;
    allowTelephonyFallback: boolean;
    submissionDeadlineDays: number;
    lateSubmissionGracePeriodDays: number;
}
export type FloridaMedicaidProgram = 'SMMC_LTC' | 'SMMC_MMA' | 'FFS_MEDICAID' | 'DOEA_HOMECARE' | 'APD_WAIVER' | 'PACE' | 'PRIVATE_DUTY_NURSING';
export interface FloridaAggregatorConnection {
    id: string;
    name: string;
    type: 'HHAEEXCHANGE' | 'NETSMART_TELLUS' | 'ICONNECT' | 'OTHER';
    endpoint: string;
    apiKey?: string;
    isActive: boolean;
    assignedPayers: string[];
    assignedMCOs: string[];
    batchSubmission: boolean;
    realTimeSubmission: boolean;
    maxBatchSize?: number;
}
export type FloridaVerificationMethod = 'MOBILE_GPS' | 'TELEPHONY_IVR' | 'BIOMETRIC_FIXED' | 'BIOMETRIC_MOBILE' | 'MANUAL_SUPERVISOR';
export interface FloridaMCORequirements {
    mcoName: string;
    mcoId: string;
    requiresClientSignature: boolean;
    requiresTaskDocumentation: boolean;
    requiresPhotoVerification: boolean;
    billingInterfaceType: 'ELECTRONIC_837' | 'PORTAL_UPLOAD' | 'BATCH_FILE' | 'API';
    billingSubmissionEndpoint?: string;
    requiresPriorAuth: boolean;
    authorizationValidationEndpoint?: string;
}
export interface StateEVVRules {
    state: StateCode;
    geoFenceRadius: number;
    geoFenceTolerance: number;
    geoFenceToleranceReason?: string;
    maxClockInEarlyMinutes: number;
    maxClockOutLateMinutes: number;
    overtimeThresholdMinutes: number;
    minimumGPSAccuracy: number;
    requiresBiometric: boolean;
    requiresPhoto: boolean;
    requiresClientAttestation: boolean;
    allowManualOverride: boolean;
    manualOverrideRequiresSupervisor: boolean;
    manualOverrideReasonCodesRequired: string[];
    retentionYears: number;
    immutableAfterDays: number;
}
export interface StateAggregatorSubmission {
    id: UUID;
    state: StateCode;
    evvRecordId: UUID;
    aggregatorId: string;
    aggregatorType: string;
    submissionPayload: Record<string, unknown>;
    submissionFormat: 'JSON' | 'XML' | 'HL7' | 'PROPRIETARY';
    submittedAt: Timestamp;
    submittedBy: UUID;
    submissionStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PARTIAL' | 'RETRY';
    aggregatorResponse?: Record<string, unknown>;
    aggregatorConfirmationId?: string;
    aggregatorReceivedAt?: Timestamp;
    errorCode?: string;
    errorMessage?: string;
    errorDetails?: Record<string, unknown>;
    retryCount: number;
    maxRetries: number;
    nextRetryAt?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface StateEVVException {
    id: UUID;
    state: StateCode;
    evvRecordId: UUID;
    visitId: UUID;
    exceptionType: StateExceptionType;
    exceptionCode: string;
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    description: string;
    detectedAt: Timestamp;
    detectedBy: 'SYSTEM' | 'AGGREGATOR' | 'SUPERVISOR' | 'AUDIT';
    requiresAction: boolean;
    actionRequired?: string;
    actionDeadline?: Timestamp;
    resolvedAt?: Timestamp;
    resolvedBy?: UUID;
    resolutionNotes?: string;
    resolutionMethod?: 'VMUR' | 'OVERRIDE' | 'RESUBMISSION' | 'WAIVER';
    stateSpecificData?: TexasVMUR | FloridaEVVException;
}
export type StateExceptionType = 'GEOFENCE_VIOLATION' | 'GPS_ACCURACY_LOW' | 'LOCATION_JUMP' | 'MOCK_LOCATION_DETECTED' | 'CLOCK_IN_TOO_EARLY' | 'CLOCK_IN_TOO_LATE' | 'CLOCK_OUT_TOO_LATE' | 'VISIT_DURATION_ANOMALY' | 'TIME_GAP_DETECTED' | 'DEVICE_SECURITY_ISSUE' | 'OFFLINE_SYNC_CONFLICT' | 'INTEGRITY_HASH_MISMATCH' | 'DUPLICATE_SUBMISSION' | 'MISSING_SIGNATURE' | 'MISSING_TASK_DOCUMENTATION' | 'AUTHORIZATION_MISMATCH' | 'LATE_SUBMISSION' | 'AGGREGATOR_REJECTION';
export interface FloridaEVVException {
    mcoName?: string;
    mcoExceptionCode?: string;
    billingInterfaceIssue?: boolean;
    authorizationValidationFailed?: boolean;
}
export declare function getStateEVVRules(state: StateCode): StateEVVRules;
export declare function selectAggregator(state: StateCode, config: TexasEVVConfig | FloridaEVVConfig, payerId?: string, mcoId?: string): string;
//# sourceMappingURL=state-specific.d.ts.map