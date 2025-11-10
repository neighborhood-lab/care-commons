/**
 * Shared exports from @care-commons/core and verticals
 * 
 * This module re-exports types, services, and utilities from the core package
 * for direct use in the mobile app. This maximizes code reuse and ensures
 * consistent domain logic across web and mobile platforms.
 */

// Core types - Base entity and lifecycle (browser-safe)
export type {
  Entity,
  UUID,
  Timestamp,
  SyncMetadata,
  Role,
  Permission,
  UserContext,
  SoftDeletable,
  Auditable,
  Revision,
  LifecycleStatus,
  PaginationParams,
  PaginatedResult,
  Result,
} from '@care-commons/core/browser';

// Core error types (browser-safe)
export {
  AppError,
  UnauthorizedError,
  UnprocessableEntityError,
  TooManyRequestsError,
  ServiceUnavailableError,
  InternalServerError,
  DatabaseError,
} from '@care-commons/core/browser';

// Additional error types from base
export type {
  DomainError,
  ValidationError,
  PermissionError,
  NotFoundError,
  ConflictError,
  AuthenticationError,
} from '@care-commons/core/browser';

// Organization types (browser-safe)
export type {
  Organization,
  OrganizationSettings,
} from '@care-commons/core/browser';

// Note: PermissionService and AuditService are server-only
// Mobile app should use API endpoints for permissions/audit instead

// EVV types - Direct reuse of all EVV domain models
export type {
  // Core EVV entities
  EVVRecord,
  EVVRecordStatus,
  VerificationLevel,
  ComplianceFlag,
  PayorApprovalStatus,
  
  // Location and verification
  ServiceAddress,
  LocationVerification,
  VerificationMethod,
  LocationSource,
  ManualOverride,
  OverrideReasonCode,
  
  // Visit events
  PauseEvent,
  PauseReason,
  ExceptionEvent,
  ExceptionType,
  
  // Attestation and review
  Attestation,
  SupervisorReview,
  
  // Geofencing
  Geofence,
  GeoPoint,
  
  // Time entries
  TimeEntry,
  TimeEntryStatus,
  DeviceInfo,
  
  // Compliance reporting
  EVVComplianceReport,
  ReportPeriod,
  
  // Input types for operations
  ClockInInput,
  ClockOutInput,
  LocationVerificationInput,
  AttestationInput,
  ManualOverrideInput,
  CreateGeofenceInput,
  EVVReportInput,
  
  // Validation results
  GeofenceCheckResult,
  IntegrityCheckResult,
  VerificationResult,
  VerificationIssue,
  
  // Search filters
  EVVRecordSearchFilters,
  TimeEntrySearchFilters,
} from '@care-commons/time-tracking-evv';

// State-specific types
export type {
  StateCode,
  TexasEVVConfig,
  TexasMedicaidProgram,
  TexasClockMethod,
  TexasVMUR,
  TexasVMURReasonCode,
  TexasEVVDataSnapshot,
  FloridaEVVConfig,
  FloridaMedicaidProgram,
  FloridaAggregatorConnection,
  FloridaVerificationMethod,
  FloridaMCORequirements,
  StateEVVRules,
  StateAggregatorSubmission,
  StateEVVException,
  StateExceptionType,
  FloridaEVVException,
} from '@care-commons/time-tracking-evv';

// State-specific helper functions
export {
  getStateEVVRules,
  selectAggregator,
} from '@care-commons/time-tracking-evv';

// EVV Service - Business logic reuse
export {
  EVVService,
  EVVValidator,
  CryptoUtils,
  IntegrationService,
} from '@care-commons/time-tracking-evv';

// Validation schemas (Zod)
// Note: Core package should export validation schemas if available
// For now, we'll create mobile-specific validators that wrap core logic

/**
 * Mobile-specific types and constants
 */

export const MOBILE_APP_VERSION = '0.1.0';
export const MOBILE_BUILD_NUMBER = 1;

export const OFFLINE_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
export const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_UPDATE';
export const GEOFENCE_TASK = 'GEOFENCE_CHECK';

/**
 * Device capability detection
 */
export interface DeviceCapabilities {
  hasGPS: boolean;
  hasCellular: boolean;
  hasWiFi: boolean;
  hasBiometric: boolean;
  hasCamera: boolean;
  batteryLevel: number;
  isOnline: boolean;
  canBackgroundLocation: boolean;
}

/**
 * Offline sync status
 */
export interface SyncStatus {
  lastSyncAt: Date | null;
  pendingRecords: number;
  syncInProgress: boolean;
  syncError: string | null;
  nextSyncAt: Date | null;
}

/**
 * Visit lifecycle for mobile app
 */
export type VisitStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PENDING_SYNC';

// Import types for use in this module
import type { ServiceAddress } from '@care-commons/time-tracking-evv';

export interface MobileVisit {
  id: string; // UUID
  organizationId: string; // UUID
  branchId: string; // UUID
  clientId: string; // UUID
  caregiverId: string; // UUID
  
  // Schedule
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  scheduledDuration: number; // minutes
  
  // Client info
  clientName: string;
  clientAddress: ServiceAddress;
  
  // Service
  serviceTypeCode: string;
  serviceTypeName: string;
  
  // Status
  status: VisitStatus;
  
  // EVV record (if started)
  evvRecordId: string | null; // UUID
  
  // Offline support
  isSynced: boolean;
  lastModifiedAt: Date;
  syncPending: boolean;
}
