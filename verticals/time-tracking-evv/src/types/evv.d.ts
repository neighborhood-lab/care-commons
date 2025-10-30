import { Entity, UUID, Timestamp, SyncMetadata } from '@care-commons/core';
export interface EVVRecord extends Entity {
    visitId: UUID;
    organizationId: UUID;
    branchId: UUID;
    clientId: UUID;
    caregiverId: UUID;
    serviceTypeCode: string;
    serviceTypeName: string;
    clientName: string;
    clientMedicaidId?: string;
    caregiverName: string;
    caregiverEmployeeId: string;
    caregiverNationalProviderId?: string;
    serviceDate: Date;
    serviceAddress: ServiceAddress;
    clockInTime: Timestamp;
    clockOutTime: Timestamp | null;
    totalDuration?: number;
    clockInVerification: LocationVerification;
    clockOutVerification?: LocationVerification;
    midVisitChecks?: LocationVerification[];
    pauseEvents?: PauseEvent[];
    exceptionEvents?: ExceptionEvent[];
    recordStatus: EVVRecordStatus;
    verificationLevel: VerificationLevel;
    complianceFlags: ComplianceFlag[];
    integrityHash: string;
    integrityChecksum: string;
    recordedAt: Timestamp;
    recordedBy: UUID;
    syncMetadata: SyncMetadata;
    submittedToPayor?: Timestamp;
    payorApprovalStatus?: PayorApprovalStatus;
    stateSpecificData?: Record<string, unknown>;
    caregiverAttestation?: Attestation;
    clientAttestation?: Attestation;
    supervisorReview?: SupervisorReview;
}
export type EVVRecordStatus = 'PENDING' | 'COMPLETE' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'DISPUTED' | 'AMENDED' | 'VOIDED';
export type VerificationLevel = 'FULL' | 'PARTIAL' | 'MANUAL' | 'PHONE' | 'EXCEPTION';
export type ComplianceFlag = 'COMPLIANT' | 'GEOFENCE_VIOLATION' | 'TIME_GAP' | 'DEVICE_SUSPICIOUS' | 'LOCATION_SUSPICIOUS' | 'DUPLICATE_ENTRY' | 'MISSING_SIGNATURE' | 'LATE_SUBMISSION' | 'MANUAL_OVERRIDE' | 'AMENDED';
export type PayorApprovalStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'PENDING_INFO' | 'APPEALED';
export interface ServiceAddress {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
    geofenceRadius: number;
    addressVerified: boolean;
    addressVerifiedAt?: Timestamp;
    addressVerifiedBy?: UUID;
}
export interface LocationVerification {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    altitudeAccuracy?: number;
    heading?: number;
    speed?: number;
    timestamp: Timestamp;
    timestampSource: 'DEVICE' | 'NETWORK' | 'GPS';
    isWithinGeofence: boolean;
    distanceFromAddress: number;
    geofencePassed: boolean;
    deviceId: string;
    deviceModel?: string;
    deviceOS?: string;
    appVersion?: string;
    method: VerificationMethod;
    locationSource: LocationSource;
    mockLocationDetected: boolean;
    vpnDetected?: boolean;
    ipAddress?: string;
    cellTowerId?: string;
    wifiSSID?: string;
    wifiBSSID?: string;
    photoUrl?: string;
    photoHash?: string;
    biometricVerified?: boolean;
    biometricMethod?: 'FINGERPRINT' | 'FACE' | 'VOICE';
    verificationPassed: boolean;
    verificationFailureReasons?: string[];
    manualOverride?: ManualOverride;
}
export type VerificationMethod = 'GPS' | 'NETWORK' | 'WIFI' | 'CELL' | 'PHONE' | 'FACIAL' | 'BIOMETRIC' | 'MANUAL' | 'EXCEPTION';
export type LocationSource = 'GPS_SATELLITE' | 'NETWORK_PROVIDER' | 'WIFI_TRIANGULATION' | 'CELL_TOWER' | 'FUSED' | 'MANUAL_ENTRY';
export interface ManualOverride {
    overrideBy: UUID;
    overrideAt: Timestamp;
    reason: string;
    reasonCode: OverrideReasonCode;
    supervisorName: string;
    supervisorTitle: string;
    approvalAuthority: string;
    notes?: string;
}
export type OverrideReasonCode = 'GPS_UNAVAILABLE' | 'DEVICE_MALFUNCTION' | 'CLIENT_LOCATION_CHANGE' | 'EMERGENCY' | 'RURAL_AREA' | 'WEATHER' | 'TECHNICAL_ISSUE' | 'TRAINING' | 'OTHER';
export interface PauseEvent {
    id: UUID;
    pausedAt: Timestamp;
    resumedAt: Timestamp | null;
    duration?: number;
    reason: PauseReason;
    reasonDetails?: string;
    location?: LocationVerification;
    isPaid: boolean;
}
export type PauseReason = 'BREAK' | 'MEAL' | 'CLIENT_REQUEST' | 'EMERGENCY' | 'ERRAND' | 'TECHNICAL' | 'OTHER';
export interface ExceptionEvent {
    id: UUID;
    occurredAt: Timestamp;
    exceptionType: ExceptionType;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    detectedBy: 'SYSTEM' | 'CAREGIVER' | 'SUPERVISOR' | 'CLIENT';
    automatic: boolean;
    resolution?: string;
    resolvedAt?: Timestamp;
    resolvedBy?: UUID;
}
export type ExceptionType = 'GEOFENCE_EXIT' | 'GPS_LOST' | 'DEVICE_OFFLINE' | 'TIME_ANOMALY' | 'DUPLICATE_CLOCK_IN' | 'MISSED_CLOCK_OUT' | 'EARLY_DEPARTURE' | 'EXTENDED_VISIT' | 'LOCATION_JUMP' | 'DEVICE_CHANGE' | 'SUSPICIOUS_PATTERN' | 'CLIENT_UNAVAILABLE' | 'SAFETY_CONCERN';
export interface Attestation {
    attestedBy: UUID;
    attestedByName: string;
    attestedAt: Timestamp;
    attestationType: 'SIGNATURE' | 'PIN' | 'BIOMETRIC' | 'VERBAL';
    signatureData?: string;
    signatureHash?: string;
    statement: string;
    ipAddress?: string;
    deviceId?: string;
    witnessedBy?: UUID;
}
export interface SupervisorReview {
    reviewedBy: UUID;
    reviewedByName: string;
    reviewedAt: Timestamp;
    reviewStatus: 'APPROVED' | 'REJECTED' | 'PENDING_INFO';
    findings?: string;
    corrections?: string[];
    notes?: string;
}
export interface Geofence extends Entity {
    organizationId: UUID;
    clientId: UUID;
    addressId: UUID;
    centerLatitude: number;
    centerLongitude: number;
    radiusMeters: number;
    radiusType: 'STANDARD' | 'EXPANDED' | 'CUSTOM';
    shape: 'CIRCLE' | 'POLYGON';
    polygonPoints?: GeoPoint[];
    isActive: boolean;
    allowedVariance?: number;
    calibratedAt?: Timestamp;
    calibratedBy?: UUID;
    calibrationMethod?: 'AUTO' | 'MANUAL';
    calibrationNotes?: string;
    verificationCount: number;
    successfulVerifications: number;
    failedVerifications: number;
    averageAccuracy?: number;
    status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
}
export interface GeoPoint {
    latitude: number;
    longitude: number;
}
export interface TimeEntry extends Entity {
    visitId: UUID;
    evvRecordId?: UUID;
    organizationId: UUID;
    caregiverId: UUID;
    clientId: UUID;
    entryType: 'CLOCK_IN' | 'CLOCK_OUT' | 'PAUSE' | 'RESUME' | 'CHECK_IN';
    entryTimestamp: Timestamp;
    location: LocationVerification;
    deviceId: string;
    deviceInfo: DeviceInfo;
    integrityHash: string;
    serverReceivedAt: Timestamp;
    syncMetadata: SyncMetadata;
    offlineRecorded: boolean;
    offlineRecordedAt?: Timestamp;
    status: TimeEntryStatus;
    verificationPassed: boolean;
    verificationIssues?: string[];
    manualOverride?: ManualOverride;
}
export type TimeEntryStatus = 'PENDING' | 'VERIFIED' | 'FLAGGED' | 'OVERRIDDEN' | 'REJECTED' | 'SYNCED';
export interface DeviceInfo {
    deviceId: string;
    deviceModel: string;
    deviceOS: string;
    osVersion: string;
    appVersion: string;
    batteryLevel?: number;
    networkType?: 'WIFI' | '4G' | '5G' | 'ETHERNET' | 'OFFLINE';
    isRooted?: boolean;
    isJailbroken?: boolean;
}
export interface EVVComplianceReport extends Entity {
    organizationId: UUID;
    branchId?: UUID;
    reportPeriod: ReportPeriod;
    startDate: Date;
    endDate: Date;
    totalVisits: number;
    compliantVisits: number;
    partiallyCompliantVisits: number;
    nonCompliantVisits: number;
    complianceRate: number;
    verificationMethodBreakdown: Record<VerificationMethod, number>;
    geofenceViolations: number;
    lateSubmissions: number;
    manualOverrides: number;
    deviceAnomalies: number;
    stateRequirements?: string[];
    stateComplianceMetrics?: Record<string, unknown>;
    generatedAt: Timestamp;
    generatedBy: UUID;
    reportStatus: 'DRAFT' | 'FINAL' | 'SUBMITTED';
    exportedAt?: Timestamp;
    exportFormat?: 'PDF' | 'CSV' | 'XML' | 'HL7' | 'STATE_SPECIFIC';
    exportUrl?: string;
}
export interface ReportPeriod {
    type: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM';
    year: number;
    month?: number;
    week?: number;
    quarter?: number;
}
export interface ClockInInput {
    visitId: UUID;
    caregiverId: UUID;
    location: LocationVerificationInput;
    deviceInfo: DeviceInfo;
    clientPresent?: boolean;
    notes?: string;
}
export interface ClockOutInput {
    visitId: UUID;
    evvRecordId: UUID;
    caregiverId: UUID;
    location: LocationVerificationInput;
    deviceInfo: DeviceInfo;
    completionNotes?: string;
    tasksCompleted?: number;
    tasksTotal?: number;
    clientSignature?: AttestationInput;
}
export interface LocationVerificationInput {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    timestamp: Timestamp;
    method: VerificationMethod;
    mockLocationDetected: boolean;
    ipAddress?: string;
    photoUrl?: string;
    biometricVerified?: boolean;
    biometricMethod?: 'FINGERPRINT' | 'FACE' | 'VOICE';
}
export interface AttestationInput {
    attestedByName: string;
    attestationType: 'SIGNATURE' | 'PIN' | 'BIOMETRIC' | 'VERBAL';
    signatureData?: string;
    statement: string;
}
export interface ManualOverrideInput {
    timeEntryId: UUID;
    reason: string;
    reasonCode: OverrideReasonCode;
    supervisorName: string;
    supervisorTitle: string;
    approvalAuthority: string;
    notes?: string;
}
export interface CreateGeofenceInput {
    organizationId: UUID;
    clientId: UUID;
    addressId: UUID;
    centerLatitude: number;
    centerLongitude: number;
    radiusMeters: number;
    radiusType?: 'STANDARD' | 'EXPANDED' | 'CUSTOM';
    shape?: 'CIRCLE' | 'POLYGON';
    polygonPoints?: GeoPoint[];
}
export interface EVVReportInput {
    organizationId: UUID;
    branchId?: UUID;
    startDate: Date;
    endDate: Date;
    reportPeriod: ReportPeriod;
    includeStateMetrics?: boolean;
}
export interface GeofenceCheckResult {
    isWithinGeofence: boolean;
    distanceFromCenter: number;
    distanceFromAddress: number;
    accuracy: number;
    requiresManualReview: boolean;
    reason?: string;
}
export interface IntegrityCheckResult {
    isValid: boolean;
    hashMatch: boolean;
    checksumMatch: boolean;
    tamperDetected: boolean;
    issues?: string[];
}
export interface VerificationResult {
    passed: boolean;
    verificationLevel: VerificationLevel;
    complianceFlags: ComplianceFlag[];
    issues: VerificationIssue[];
    requiresSupervisorReview: boolean;
}
export interface VerificationIssue {
    issueType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    canBeOverridden: boolean;
    requiresSupervisor: boolean;
}
export interface EVVRecordSearchFilters {
    organizationId?: UUID;
    branchId?: UUID;
    clientId?: UUID;
    caregiverId?: UUID;
    visitId?: UUID;
    startDate?: Date;
    endDate?: Date;
    status?: EVVRecordStatus[];
    verificationLevel?: VerificationLevel[];
    hasComplianceFlags?: boolean;
    complianceFlags?: ComplianceFlag[];
    submittedToPayor?: boolean;
    payorApprovalStatus?: PayorApprovalStatus[];
}
export interface TimeEntrySearchFilters {
    organizationId?: UUID;
    caregiverId?: UUID;
    visitId?: UUID;
    entryType?: ('CLOCK_IN' | 'CLOCK_OUT' | 'PAUSE' | 'RESUME' | 'CHECK_IN')[];
    startDate?: Date;
    endDate?: Date;
    status?: TimeEntryStatus[];
    verificationPassed?: boolean;
    offlineRecorded?: boolean;
}
//# sourceMappingURL=evv.d.ts.map