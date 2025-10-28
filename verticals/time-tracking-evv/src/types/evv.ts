/**
 * Time Tracking & Electronic Visit Verification (EVV) domain model
 * 
 * Accurate timing and location evidence of visits — clock-in/out, geofenced 
 * verification, offline capture with sync, integrity measures against 
 * falsification, and compliance-grade retention.
 * 
 * Key concepts:
 * - Time Entry: Recorded clock-in/out events with verification
 * - Location Verification: GPS-based proof of presence at client location
 * - Geofence: Virtual boundary around client address
 * - EVV Record: Compliance-grade record of visit timing and location
 * - Integrity Check: Validation of authenticity and tamper detection
 * - Sync Conflict: Resolution when offline data conflicts with server
 */

import {
  Entity,
  UUID,
  Timestamp,
  SyncMetadata,
} from '@care-commons/core';

/**
 * EVV Record - Complete compliance record for a visit
 * 
 * Immutable record capturing all required EVV data elements per
 * federal and state regulations (21st Century Cures Act).
 */
export interface EVVRecord extends Entity {
  // Visit identification
  visitId: UUID;
  organizationId: UUID;
  branchId: UUID;
  clientId: UUID;
  caregiverId: UUID;

  // Required EVV data elements (federal minimum)
  // 1. Type of service performed
  serviceTypeCode: string;
  serviceTypeName: string;
  
  // 2. Individual receiving the service
  clientName: string; // Encrypted at rest
  clientMedicaidId?: string; // Encrypted at rest
  
  // 3. Individual providing the service
  caregiverName: string;
  caregiverEmployeeId: string;
  caregiverNationalProviderId?: string; // NPI number
  
  // 4. Date of service
  serviceDate: Date;
  
  // 5. Location of service delivery
  serviceAddress: ServiceAddress;
  
  // 6. Time service begins and ends
  clockInTime: Timestamp;
  clockOutTime: Timestamp | null; // Null if visit still in progress
  totalDuration?: number; // Calculated minutes
  
  // Location verification
  clockInVerification: LocationVerification;
  clockOutVerification?: LocationVerification;
  midVisitChecks?: LocationVerification[]; // Additional checks during visit
  
  // Additional tracking
  pauseEvents?: PauseEvent[]; // If visit was paused/resumed
  exceptionEvents?: ExceptionEvent[]; // Exceptions during visit
  
  // Integrity and compliance
  recordStatus: EVVRecordStatus;
  verificationLevel: VerificationLevel;
  complianceFlags: ComplianceFlag[];
  integrityHash: string; // Cryptographic hash of core data
  integrityChecksum: string; // Additional tamper detection
  
  // Audit and sync
  recordedAt: Timestamp; // When record was created
  recordedBy: UUID;
  syncMetadata: SyncMetadata;
  submittedToPayor?: Timestamp; // When submitted for billing
  payorApprovalStatus?: PayorApprovalStatus;
  
  // State-specific fields (extensible)
  stateSpecificData?: Record<string, unknown>;
  
  // Attestation
  caregiverAttestation?: Attestation;
  clientAttestation?: Attestation;
  supervisorReview?: SupervisorReview;
}

export type EVVRecordStatus =
  | 'PENDING' // Clock-in recorded, awaiting clock-out
  | 'COMPLETE' // Both clock-in and clock-out recorded
  | 'SUBMITTED' // Submitted to payor/billing
  | 'APPROVED' // Approved by payor
  | 'REJECTED' // Rejected by payor
  | 'DISPUTED' // Under dispute/investigation
  | 'AMENDED' // Corrected/amended after initial submission
  | 'VOIDED'; // Cancelled/voided

export type VerificationLevel =
  | 'FULL' // GPS + geofence + device verification
  | 'PARTIAL' // Some verification elements missing
  | 'MANUAL' // Manual verification by supervisor
  | 'PHONE' // Phone-based verification
  | 'EXCEPTION'; // Exception process used

export type ComplianceFlag =
  | 'COMPLIANT' // Fully compliant
  | 'GEOFENCE_VIOLATION' // Outside geofence
  | 'TIME_GAP' // Unexplained gap in time
  | 'DEVICE_SUSPICIOUS' // Device anomaly detected
  | 'LOCATION_SUSPICIOUS' // Location anomaly detected
  | 'DUPLICATE_ENTRY' // Possible duplicate
  | 'MISSING_SIGNATURE' // Required signature missing
  | 'LATE_SUBMISSION' // Submitted after deadline
  | 'MANUAL_OVERRIDE' // Manual supervisor override
  | 'AMENDED'; // Record has been amended

export type PayorApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DENIED'
  | 'PENDING_INFO' // Pending additional information
  | 'APPEALED';

/**
 * Service Address - Where service was delivered
 */
export interface ServiceAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  
  // Geocoded location
  latitude: number;
  longitude: number;
  geofenceRadius: number; // Acceptable radius in meters
  
  // Verification
  addressVerified: boolean;
  addressVerifiedAt?: Timestamp;
  addressVerifiedBy?: UUID;
}

/**
 * Location Verification - GPS proof of presence
 * 
 * Captures device location with accuracy and integrity checks.
 */
export interface LocationVerification {
  // Core location data
  latitude: number;
  longitude: number;
  accuracy: number; // Accuracy in meters
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number; // Direction of travel (0-360)
  speed?: number; // Speed in m/s
  
  // Timestamp
  timestamp: Timestamp;
  timestampSource: 'DEVICE' | 'NETWORK' | 'GPS';
  
  // Geofence verification
  isWithinGeofence: boolean;
  distanceFromAddress: number; // Distance in meters
  geofencePassed: boolean;
  
  // Device information
  deviceId: string; // Unique device identifier
  deviceModel?: string;
  deviceOS?: string;
  appVersion?: string;
  
  // Method and integrity
  method: VerificationMethod;
  locationSource: LocationSource;
  mockLocationDetected: boolean; // GPS spoofing detection
  vpnDetected?: boolean;
  
  // Network information (helps detect fraud)
  ipAddress?: string;
  cellTowerId?: string;
  wifiSSID?: string; // Hashed for privacy
  wifiBSSID?: string; // Hashed for privacy
  
  // Additional verification
  photoUrl?: string; // Optional photo at clock-in/out
  photoHash?: string; // Hash of photo for integrity
  biometricVerified?: boolean;
  biometricMethod?: 'FINGERPRINT' | 'FACE' | 'VOICE';
  
  // Compliance
  verificationPassed: boolean;
  verificationFailureReasons?: string[];
  manualOverride?: ManualOverride;
}

export type VerificationMethod =
  | 'GPS' // Standard GPS
  | 'NETWORK' // Network-based location
  | 'WIFI' // WiFi triangulation
  | 'CELL' // Cellular tower
  | 'PHONE' // Phone verification line
  | 'FACIAL' // Facial recognition
  | 'BIOMETRIC' // Fingerprint/other biometric
  | 'MANUAL' // Manual entry by supervisor
  | 'EXCEPTION'; // Exception process

export type LocationSource =
  | 'GPS_SATELLITE'
  | 'NETWORK_PROVIDER'
  | 'WIFI_TRIANGULATION'
  | 'CELL_TOWER'
  | 'FUSED' // Multiple sources combined
  | 'MANUAL_ENTRY';

/**
 * Manual Override - When supervisor manually approves
 */
export interface ManualOverride {
  overrideBy: UUID;
  overrideAt: Timestamp;
  reason: string;
  reasonCode: OverrideReasonCode;
  supervisorName: string;
  supervisorTitle: string;
  approvalAuthority: string; // What authority allows this override
  notes?: string;
}

export type OverrideReasonCode =
  | 'GPS_UNAVAILABLE' // No GPS signal available
  | 'DEVICE_MALFUNCTION' // Device hardware issue
  | 'CLIENT_LOCATION_CHANGE' // Service at different location
  | 'EMERGENCY' // Emergency circumstances
  | 'RURAL_AREA' // Poor signal in rural area
  | 'WEATHER' // Weather interference
  | 'TECHNICAL_ISSUE' // App/system technical problem
  | 'TRAINING' // Training/onboarding exception
  | 'OTHER';

/**
 * Pause Event - Visit temporarily paused
 */
export interface PauseEvent {
  id: UUID;
  pausedAt: Timestamp;
  resumedAt: Timestamp | null;
  duration?: number; // Minutes
  reason: PauseReason;
  reasonDetails?: string;
  location?: LocationVerification;
  isPaid: boolean; // Whether this time is billable
}

export type PauseReason =
  | 'BREAK' // Scheduled break
  | 'MEAL' // Meal break
  | 'CLIENT_REQUEST' // Client requested pause
  | 'EMERGENCY' // Emergency interruption
  | 'ERRAND' // Running errand for client
  | 'TECHNICAL' // Technical issue
  | 'OTHER';

/**
 * Exception Event - Anomaly during visit
 */
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

export type ExceptionType =
  | 'GEOFENCE_EXIT' // Left geofence during visit
  | 'GPS_LOST' // Lost GPS signal
  | 'DEVICE_OFFLINE' // Device went offline
  | 'TIME_ANOMALY' // Time jump detected
  | 'DUPLICATE_CLOCK_IN' // Multiple clock-ins detected
  | 'MISSED_CLOCK_OUT' // Failed to clock out
  | 'EARLY_DEPARTURE' // Left much earlier than scheduled
  | 'EXTENDED_VISIT' // Visit much longer than scheduled
  | 'LOCATION_JUMP' // Impossible location change
  | 'DEVICE_CHANGE' // Device changed mid-visit
  | 'SUSPICIOUS_PATTERN' // Suspicious behavior pattern
  | 'CLIENT_UNAVAILABLE' // Client not present
  | 'SAFETY_CONCERN'; // Safety issue reported

/**
 * Attestation - Digital signature/affirmation
 */
export interface Attestation {
  attestedBy: UUID;
  attestedByName: string;
  attestedAt: Timestamp;
  attestationType: 'SIGNATURE' | 'PIN' | 'BIOMETRIC' | 'VERBAL';
  signatureData?: string; // Base64 encoded signature image
  signatureHash?: string;
  statement: string; // What they're attesting to
  ipAddress?: string;
  deviceId?: string;
  witnessedBy?: UUID; // If witnessed by supervisor
}

/**
 * Supervisor Review - Manual review of EVV record
 */
export interface SupervisorReview {
  reviewedBy: UUID;
  reviewedByName: string;
  reviewedAt: Timestamp;
  reviewStatus: 'APPROVED' | 'REJECTED' | 'PENDING_INFO';
  findings?: string;
  corrections?: string[];
  notes?: string;
}

/**
 * Geofence - Virtual boundary around service location
 */
export interface Geofence extends Entity {
  organizationId: UUID;
  clientId: UUID;
  addressId: UUID;
  
  // Center point
  centerLatitude: number;
  centerLongitude: number;
  
  // Radius
  radiusMeters: number;
  radiusType: 'STANDARD' | 'EXPANDED' | 'CUSTOM';
  
  // Shape (for advanced geofences)
  shape: 'CIRCLE' | 'POLYGON';
  polygonPoints?: GeoPoint[]; // For polygon geofences
  
  // Settings
  isActive: boolean;
  allowedVariance?: number; // Additional meters for soft boundary
  
  // Calibration
  calibratedAt?: Timestamp;
  calibratedBy?: UUID;
  calibrationMethod?: 'AUTO' | 'MANUAL';
  calibrationNotes?: string;
  
  // Performance
  verificationCount: number;
  successfulVerifications: number;
  failedVerifications: number;
  averageAccuracy?: number; // Average GPS accuracy at this location
  
  // Status
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * Time Entry - Individual clock-in or clock-out event
 * 
 * Separate from EVV Record for granular tracking.
 */
export interface TimeEntry extends Entity {
  visitId: UUID;
  evvRecordId?: UUID; // Linked after EVV record created
  organizationId: UUID;
  caregiverId: UUID;
  clientId: UUID;
  
  // Entry details
  entryType: 'CLOCK_IN' | 'CLOCK_OUT' | 'PAUSE' | 'RESUME' | 'CHECK_IN';
  entryTimestamp: Timestamp;
  
  // Location
  location: LocationVerification;
  
  // Device
  deviceId: string;
  deviceInfo: DeviceInfo;
  
  // Integrity
  integrityHash: string;
  serverReceivedAt: Timestamp;
  
  // Sync (for offline)
  syncMetadata: SyncMetadata;
  offlineRecorded: boolean;
  offlineRecordedAt?: Timestamp;
  
  // Status
  status: TimeEntryStatus;
  verificationPassed: boolean;
  verificationIssues?: string[];
  manualOverride?: ManualOverride;
}

export type TimeEntryStatus =
  | 'PENDING' // Awaiting processing
  | 'VERIFIED' // Passed all verification
  | 'FLAGGED' // Has verification issues
  | 'OVERRIDDEN' // Manually approved despite issues
  | 'REJECTED' // Rejected as invalid
  | 'SYNCED'; // Successfully synced to server

export interface DeviceInfo {
  deviceId: string;
  deviceModel: string;
  deviceOS: string;
  osVersion: string;
  appVersion: string;
  batteryLevel?: number;
  networkType?: 'WIFI' | '4G' | '5G' | 'ETHERNET' | 'OFFLINE';
  isRooted?: boolean; // Android root detection
  isJailbroken?: boolean; // iOS jailbreak detection
}

/**
 * EVV Compliance Report - Summary for regulatory reporting
 */
export interface EVVComplianceReport extends Entity {
  organizationId: UUID;
  branchId?: UUID;
  
  // Report period
  reportPeriod: ReportPeriod;
  startDate: Date;
  endDate: Date;
  
  // Statistics
  totalVisits: number;
  compliantVisits: number;
  partiallyCompliantVisits: number;
  nonCompliantVisits: number;
  complianceRate: number; // Percentage
  
  // Verification methods
  verificationMethodBreakdown: Record<VerificationMethod, number>;
  
  // Issues
  geofenceViolations: number;
  lateSubmissions: number;
  manualOverrides: number;
  deviceAnomalies: number;
  
  // State-specific
  stateRequirements?: string[];
  stateComplianceMetrics?: Record<string, unknown>;
  
  // Generation
  generatedAt: Timestamp;
  generatedBy: UUID;
  reportStatus: 'DRAFT' | 'FINAL' | 'SUBMITTED';
  
  // Export
  exportedAt?: Timestamp;
  exportFormat?: 'PDF' | 'CSV' | 'XML' | 'HL7' | 'STATE_SPECIFIC';
  exportUrl?: string;
}

export interface ReportPeriod {
  type: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM';
  year: number;
  month?: number; // 1-12
  week?: number; // 1-53
  quarter?: number; // 1-4
}

/**
 * Input types for operations
 */

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

/**
 * Validation and calculation utilities
 */

export interface GeofenceCheckResult {
  isWithinGeofence: boolean;
  distanceFromCenter: number; // meters
  distanceFromAddress: number; // meters
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

/**
 * Search and filter types
 */

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
