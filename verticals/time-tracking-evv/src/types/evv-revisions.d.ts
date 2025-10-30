import { UUID, Timestamp } from '@care-commons/core';
import { EVVRecord, LocationVerification } from './evv';
import { TexasVMURReasonCode } from './state-specific';
export interface EVVRevision {
    id: UUID;
    evvRecordId: UUID;
    visitId: UUID;
    organizationId: UUID;
    revisionNumber: number;
    revisionType: EVVRevisionType;
    revisionReason: string;
    revisionReasonCode?: TexasVMURReasonCode | string;
    revisedBy: UUID;
    revisedByName: string;
    revisedByRole: string;
    revisedAt: Timestamp;
    fieldPath: string;
    originalValue: unknown;
    newValue: unknown;
    justification: string;
    supportingDocuments?: string[];
    requiresApproval: boolean;
    approvalStatus?: 'PENDING' | 'APPROVED' | 'DENIED';
    approvedBy?: UUID;
    approvedByName?: string;
    approvedAt?: Timestamp;
    denialReason?: string;
    aggregatorNotified: boolean;
    aggregatorNotifiedAt?: Timestamp;
    aggregatorConfirmation?: string;
    resubmissionRequired: boolean;
    resubmittedAt?: Timestamp;
    revisionHash: string;
    previousRevisionHash?: string;
    complianceNotes?: string;
    complianceReviewed: boolean;
    complianceReviewedBy?: UUID;
    complianceReviewedAt?: Timestamp;
}
export type EVVRevisionType = 'CLOCK_IN_TIME_CORRECTION' | 'CLOCK_OUT_TIME_CORRECTION' | 'DURATION_RECALCULATION' | 'CLOCK_IN_LOCATION_CORRECTION' | 'CLOCK_OUT_LOCATION_CORRECTION' | 'LOCATION_MANUAL_OVERRIDE' | 'VERIFICATION_METHOD_CHANGE' | 'MANUAL_VERIFICATION_APPLIED' | 'STATUS_CORRECTION' | 'COMPLIANCE_FLAG_ADDITION' | 'COMPLIANCE_FLAG_REMOVAL' | 'SIGNATURE_ADDED' | 'ATTESTATION_ADDED' | 'NOTES_ADDED' | 'CAREGIVER_CORRECTION' | 'CLIENT_CORRECTION' | 'SERVICE_TYPE_CORRECTION' | 'VOID_RECORD' | 'UNVOID_RECORD' | 'DUPLICATE_REMOVAL' | 'TX_VMUR_CORRECTION' | 'FL_MCO_CORRECTION';
export interface EVVAuditTrail {
    evvRecordId: UUID;
    visitId: UUID;
    organizationId: UUID;
    originalData: EVVOriginalData;
    originalDataLocked: boolean;
    originalDataLockedAt?: Timestamp;
    revisions: EVVRevision[];
    revisionCount: number;
    lastRevisedAt?: Timestamp;
    currentData: Partial<EVVRecord>;
    integrityChainValid: boolean;
    lastIntegrityCheck: Timestamp;
    accessLog: EVVAccessLogEntry[];
}
export interface EVVOriginalData {
    originalClockInTime: Timestamp;
    originalClockOutTime?: Timestamp;
    originalDuration?: number;
    originalClockInLocation: LocationVerification;
    originalClockOutLocation?: LocationVerification;
    originalClockInDevice: string;
    originalClockOutDevice?: string;
    originalVerificationMethod: string;
    capturedAt: Timestamp;
    capturedBy: UUID;
    capturedViaDevice: string;
    capturedViaApp: string;
    originalIntegrityHash: string;
    originalChecksum: string;
    lockedForEditing: boolean;
    lockReason?: string;
    lockedAt?: Timestamp;
    lockedBy?: UUID;
}
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
    fieldsAccessed?: string[];
    searchFilters?: Record<string, unknown>;
    exportFormat?: 'PDF' | 'CSV' | 'JSON' | 'HL7' | 'STATE_FORMAT';
    exportDestination?: string;
}
export type EVVAccessType = 'VIEW' | 'EDIT' | 'EXPORT' | 'PRINT' | 'AUDIT_REVIEW' | 'AGGREGATOR_SUBMISSION' | 'SUPERVISOR_REVIEW' | 'COMPLIANCE_CHECK';
export interface EVVRevisionRequest {
    id: UUID;
    evvRecordId: UUID;
    visitId: UUID;
    organizationId: UUID;
    requestedChanges: EVVRevisionChange[];
    requestReason: string;
    requestReasonCode?: string;
    requestJustification: string;
    requestedBy: UUID;
    requestedByName: string;
    requestedByRole: string;
    requestedAt: Timestamp;
    status: 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED' | 'EXPIRED';
    requiresSupervisorApproval: boolean;
    requiresComplianceApproval: boolean;
    supervisorApproval?: ApprovalAction;
    complianceApproval?: ApprovalAction;
    implementedAt?: Timestamp;
    implementedBy?: UUID;
    implementationNotes?: string;
    expiresAt: Timestamp;
    stateSpecificData?: Record<string, unknown>;
}
export interface EVVRevisionChange {
    fieldPath: string;
    currentValue: unknown;
    proposedValue: unknown;
    changeReason: string;
}
export interface ApprovalAction {
    approvedBy: UUID;
    approvedByName: string;
    approvedAt: Timestamp;
    decision: 'APPROVED' | 'DENIED';
    comments?: string;
    conditions?: string[];
}
export interface EVVExceptionQueueItem {
    id: UUID;
    evvRecordId: UUID;
    visitId: UUID;
    organizationId: UUID;
    branchId: UUID;
    exceptionType: string;
    exceptionCode: string;
    exceptionSeverity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    exceptionDescription: string;
    issues: EVVIssue[];
    issueCount: number;
    detectedAt: Timestamp;
    detectedBy: 'SYSTEM' | 'AGGREGATOR' | 'SUPERVISOR' | 'AUDIT';
    detectionMethod?: string;
    assignedTo?: UUID;
    assignedToRole?: string;
    assignedAt?: Timestamp;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: Timestamp;
    slaDeadline?: Timestamp;
    resolutionMethod?: 'REVISION' | 'OVERRIDE' | 'RESUBMISSION' | 'WAIVER' | 'NO_ACTION';
    resolvedAt?: Timestamp;
    resolvedBy?: UUID;
    resolutionNotes?: string;
    escalatedAt?: Timestamp;
    escalatedTo?: UUID;
    escalationReason?: string;
    viewedAt?: Timestamp;
    viewedBy?: UUID;
    notificationsent: boolean;
    notificationSentAt?: Timestamp;
}
export interface EVVIssue {
    issueType: string;
    issueCode: string;
    issueSeverity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    issueDescription: string;
    affectedField?: string;
    currentValue?: unknown;
    expectedValue?: unknown;
    canBeAutoResolved: boolean;
    requiresSupervisorReview: boolean;
    requiresRevision: boolean;
    suggestedAction?: string;
    stateSpecificCode?: string;
    stateSpecificRules?: string[];
}
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
    topIssues: Array<{
        issueType: string;
        count: number;
    }>;
}
//# sourceMappingURL=evv-revisions.d.ts.map