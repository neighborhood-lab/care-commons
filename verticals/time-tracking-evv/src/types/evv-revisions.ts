/**
 * EVV Revision and Audit Trail System
 * 
 * Implements immutable original timestamp storage with comprehensive revision
 * logging per TX/FL requirements. Original data is never modified; all changes
 * are tracked in an append-only audit trail.
 */

import { UUID, Timestamp } from '@care-commons/core';
import { EVVRecord, LocationVerification } from './evv';
import { TexasVMURReasonCode } from './state-specific';

/**
 * EVV Revision Record
 * 
 * Captures every modification to an EVV record after initial creation.
 * Original data remains immutable in evv_records table.
 */
export interface EVVRevision {
  id: UUID;
  evvRecordId: UUID;
  visitId: UUID;
  organizationId: UUID;
  
  // Revision metadata
  revisionNumber: number; // Sequence number starting at 1
  revisionType: EVVRevisionType;
  revisionReason: string;
  revisionReasonCode?: TexasVMURReasonCode | string; // State-specific codes
  
  // Who made the change
  revisedBy: UUID;
  revisedByName: string;
  revisedByRole: string;
  revisedAt: Timestamp;
  
  // What changed
  fieldPath: string; // JSON path to changed field, e.g., "clockOutTime" or "clockInVerification.latitude"
  originalValue: unknown; // Original value before change
  newValue: unknown; // New value after change
  
  // Why it was changed
  justification: string;
  supportingDocuments?: string[]; // URLs or IDs of supporting docs
  
  // Approval workflow (if required)
  requiresApproval: boolean;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'DENIED';
  approvedBy?: UUID;
  approvedByName?: string;
  approvedAt?: Timestamp;
  denialReason?: string;
  
  // Aggregator notification
  aggregatorNotified: boolean;
  aggregatorNotifiedAt?: Timestamp;
  aggregatorConfirmation?: string;
  resubmissionRequired: boolean;
  resubmittedAt?: Timestamp;
  
  // Integrity
  revisionHash: string; // Hash of revision data for tamper detection
  previousRevisionHash?: string; // Chain revisions together
  
  // Compliance flags
  complianceNotes?: string;
  complianceReviewed: boolean;
  complianceReviewedBy?: UUID;
  complianceReviewedAt?: Timestamp;
}

/**
 * Types of revisions that can be made
 */
export type EVVRevisionType =
  // Time corrections
  | 'CLOCK_IN_TIME_CORRECTION' // Adjust clock-in timestamp
  | 'CLOCK_OUT_TIME_CORRECTION' // Adjust clock-out timestamp
  | 'DURATION_RECALCULATION' // Recalculate visit duration
  
  // Location corrections
  | 'CLOCK_IN_LOCATION_CORRECTION' // Adjust clock-in coordinates
  | 'CLOCK_OUT_LOCATION_CORRECTION' // Adjust clock-out coordinates
  | 'LOCATION_MANUAL_OVERRIDE' // Override location verification failure
  
  // Verification method changes
  | 'VERIFICATION_METHOD_CHANGE' // Change GPS to phone, etc.
  | 'MANUAL_VERIFICATION_APPLIED' // Apply manual verification
  
  // Status changes
  | 'STATUS_CORRECTION' // Change record status
  | 'COMPLIANCE_FLAG_ADDITION' // Add compliance flag
  | 'COMPLIANCE_FLAG_REMOVAL' // Remove compliance flag
  
  // Data additions
  | 'SIGNATURE_ADDED' // Add missing signature
  | 'ATTESTATION_ADDED' // Add missing attestation
  | 'NOTES_ADDED' // Add completion notes
  
  // Corrections
  | 'CAREGIVER_CORRECTION' // Fix wrong caregiver assignment
  | 'CLIENT_CORRECTION' // Fix wrong client
  | 'SERVICE_TYPE_CORRECTION' // Fix service type code
  
  // Administrative
  | 'VOID_RECORD' // Void/cancel record
  | 'UNVOID_RECORD' // Restore voided record
  | 'DUPLICATE_REMOVAL' // Mark as duplicate
  
  // State-specific
  | 'TX_VMUR_CORRECTION' // Texas VMUR correction
  | 'FL_MCO_CORRECTION'; // Florida MCO-required correction

/**
 * Complete audit trail for an EVV record
 */
export interface EVVAuditTrail {
  evvRecordId: UUID;
  visitId: UUID;
  organizationId: UUID;
  
  // Original immutable data
  originalData: EVVOriginalData;
  originalDataLocked: boolean;
  originalDataLockedAt?: Timestamp;
  
  // Revision history (append-only)
  revisions: EVVRevision[];
  revisionCount: number;
  lastRevisedAt?: Timestamp;
  
  // Current effective data (original + all approved revisions)
  currentData: Partial<EVVRecord>;
  
  // Integrity chain
  integrityChainValid: boolean;
  lastIntegrityCheck: Timestamp;
  
  // Access log
  accessLog: EVVAccessLogEntry[];
}

/**
 * Original immutable EVV data
 * 
 * This data is captured at the moment of clock-in/out and NEVER modified.
 * Any corrections are tracked separately in the revision log.
 */
export interface EVVOriginalData {
  // Core timing (immutable)
  originalClockInTime: Timestamp;
  originalClockOutTime?: Timestamp;
  originalDuration?: number;
  
  // Core location (immutable)
  originalClockInLocation: LocationVerification;
  originalClockOutLocation?: LocationVerification;
  
  // Device and method (immutable)
  originalClockInDevice: string;
  originalClockOutDevice?: string;
  originalVerificationMethod: string;
  
  // Captured at creation
  capturedAt: Timestamp;
  capturedBy: UUID;
  capturedViaDevice: string;
  capturedViaApp: string;
  
  // Integrity
  originalIntegrityHash: string;
  originalChecksum: string;
  
  // Lock mechanism
  lockedForEditing: boolean;
  lockReason?: string;
  lockedAt?: Timestamp;
  lockedBy?: UUID;
}

/**
 * Access log entry for audit compliance
 */
export interface EVVAccessLogEntry {
  id: UUID;
  evvRecordId: UUID;
  
  accessedAt: Timestamp;
  accessedBy: UUID;
  accessedByName: string;
  accessedByRole: string;
  accessedByIP?: string;
  
  accessType: EVVAccessType;
  accessReason?: string;
  
  // What was accessed
  fieldsAccessed?: string[];
  searchFilters?: Record<string, unknown>;
  
  // Export/download tracking
  exportFormat?: 'PDF' | 'CSV' | 'JSON' | 'HL7' | 'STATE_FORMAT';
  exportDestination?: string;
}

export type EVVAccessType =
  | 'VIEW' // Read-only view
  | 'EDIT' // Modification attempt
  | 'EXPORT' // Downloaded/exported
  | 'PRINT' // Printed
  | 'AUDIT_REVIEW' // Reviewed for audit
  | 'AGGREGATOR_SUBMISSION' // Submitted to aggregator
  | 'SUPERVISOR_REVIEW' // Supervisor review
  | 'COMPLIANCE_CHECK'; // Compliance check

/**
 * Revision Request (for approval workflows)
 */
export interface EVVRevisionRequest {
  id: UUID;
  evvRecordId: UUID;
  visitId: UUID;
  organizationId: UUID;
  
  // Requested changes
  requestedChanges: EVVRevisionChange[];
  requestReason: string;
  requestReasonCode?: string;
  requestJustification: string;
  
  // Requester info
  requestedBy: UUID;
  requestedByName: string;
  requestedByRole: string;
  requestedAt: Timestamp;
  
  // Approval workflow
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED' | 'EXPIRED';
  requiresSupervisorApproval: boolean;
  requiresComplianceApproval: boolean;
  
  // Approvers
  supervisorApproval?: ApprovalAction;
  complianceApproval?: ApprovalAction;
  
  // Implementation
  implementedAt?: Timestamp;
  implementedBy?: UUID;
  implementationNotes?: string;
  
  // Expiration
  expiresAt: Timestamp;
  
  // State-specific
  stateSpecificData?: Record<string, unknown>; // e.g., Texas VMUR data
}

/**
 * Individual change within a revision request
 */
export interface EVVRevisionChange {
  fieldPath: string;
  currentValue: unknown;
  proposedValue: unknown;
  changeReason: string;
}

/**
 * Approval action
 */
export interface ApprovalAction {
  approvedBy: UUID;
  approvedByName: string;
  approvedAt: Timestamp;
  decision: 'APPROVED' | 'DENIED';
  comments?: string;
  conditions?: string[]; // Conditions for approval
}

/**
 * Exception queue item for EVV anomalies
 * 
 * System that surfaces EVV records requiring review/action.
 */
export interface EVVExceptionQueueItem {
  id: UUID;
  evvRecordId: UUID;
  visitId: UUID;
  organizationId: UUID;
  branchId: UUID;
  
  // Exception details
  exceptionType: string;
  exceptionCode: string;
  exceptionSeverity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  exceptionDescription: string;
  
  // What's wrong
  issues: EVVIssue[];
  issueCount: number;
  
  // Detection
  detectedAt: Timestamp;
  detectedBy: 'SYSTEM' | 'AGGREGATOR' | 'SUPERVISOR' | 'AUDIT';
  detectionMethod?: string;
  
  // Assignment
  assignedTo?: UUID;
  assignedToRole?: string;
  assignedAt?: Timestamp;
  
  // Resolution
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  
  dueDate?: Timestamp;
  slaDeadline?: Timestamp; // Service level agreement deadline
  
  resolutionMethod?: 'REVISION' | 'OVERRIDE' | 'RESUBMISSION' | 'WAIVER' | 'NO_ACTION';
  resolvedAt?: Timestamp;
  resolvedBy?: UUID;
  resolutionNotes?: string;
  
  // Escalation
  escalatedAt?: Timestamp;
  escalatedTo?: UUID;
  escalationReason?: string;
  
  // Tracking
  viewedAt?: Timestamp;
  viewedBy?: UUID;
  notificationsent: boolean;
  notificationSentAt?: Timestamp;
}

/**
 * Individual issue within an exception
 */
export interface EVVIssue {
  issueType: string;
  issueCode: string;
  issueSeverity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  issueDescription: string;
  
  // Field affected
  affectedField?: string;
  currentValue?: unknown;
  expectedValue?: unknown;
  
  // Resolution
  canBeAutoResolved: boolean;
  requiresSupervisorReview: boolean;
  requiresRevision: boolean;
  suggestedAction?: string;
  
  // State-specific
  stateSpecificCode?: string;
  stateSpecificRules?: string[];
}

/**
 * Helper functions for revision management
 */

/**
 * Create a revision record
 */
export interface CreateEVVRevisionInput {
  evvRecordId: UUID;
  visitId: UUID;
  organizationId: UUID;
  revisionType: EVVRevisionType;
  fieldPath: string;
  originalValue: unknown;
  newValue: unknown;
  revisionReason: string;
  revisionReasonCode?: string;
  justification: string;
  revisedBy: UUID;
  revisedByName: string;
  revisedByRole: string;
  requiresApproval?: boolean;
  supportingDocuments?: string[];
}

/**
 * Query filters for exception queue
 */
export interface EVVExceptionQueueFilters {
  organizationId?: UUID;
  branchId?: UUID;
  assignedTo?: UUID;
  status?: ('OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED' | 'CLOSED')[];
  severity?: ('INFO' | 'WARNING' | 'ERROR' | 'CRITICAL')[];
  priority?: ('LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')[];
  exceptionType?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  onlyOverdue?: boolean;
  onlyUnassigned?: boolean;
}

/**
 * Statistics for exception queue
 */
export interface EVVExceptionQueueStats {
  organizationId: UUID;
  periodStart: Date;
  periodEnd: Date;
  
  totalExceptions: number;
  openExceptions: number;
  inProgressExceptions: number;
  resolvedExceptions: number;
  escalatedExceptions: number;
  
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  
  averageResolutionTimeHours: number;
  overdueCount: number;
  slaBreachCount: number;
  
  topIssues: Array<{ issueType: string; count: number }>;
}
