/**
 * @care-commons/core - Compliance Reporting Types
 *
 * Types for automated state-specific compliance reporting:
 * - Report templates and generation
 * - Scheduling and automation
 * - Multi-format exports (PDF, CSV, XML)
 * - Submission tracking and audit trail
 */

import type { Entity, SoftDeletable, StateCode, UUID, Timestamp } from './base.js';

/**
 * Supported states for compliance reporting
 */
export type ComplianceStateCode = 'TX' | 'FL' | 'OH' | 'PA' | 'GA' | 'NC' | 'AZ';

/**
 * Types of compliance reports
 */
export type ReportType =
  | 'EVV_VISIT_LOGS'
  | 'CAREGIVER_TRAINING'
  | 'CLIENT_CARE_PLANS'
  | 'INCIDENT_REPORTS'
  | 'QA_AUDITS'
  | 'SERVICE_AUTHORIZATION'
  | 'BILLING_SUMMARY';

/**
 * Report generation frequency
 */
export type ReportFrequency =
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'ANNUALLY'
  | 'ON_DEMAND';

/**
 * Export format types
 */
export type ExportFormat = 'PDF' | 'CSV' | 'XML' | 'JSON' | 'XLSX';

/**
 * Report generation methods
 */
export type GenerationMethod = 'SCHEDULED' | 'MANUAL' | 'API';

/**
 * Report validation status
 */
export type ValidationStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'WARNING';

/**
 * Report lifecycle status
 */
export type ReportStatus = 'DRAFT' | 'VALIDATED' | 'SUBMITTED' | 'FAILED' | 'ARCHIVED';

/**
 * Submission methods
 */
export type SubmissionMethod = 'EMAIL' | 'API' | 'SFTP' | 'PORTAL' | 'MANUAL';

/**
 * Submission status tracking
 */
export type SubmissionStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'FAILED'
  | 'RETRYING';

/**
 * Delivery methods for scheduled reports
 */
export type DeliveryMethod = 'EMAIL' | 'API' | 'SFTP' | 'MANUAL';

/**
 * Date range calculation types
 */
export type DateRangeType =
  | 'PREVIOUS_PERIOD'
  | 'CUSTOM'
  | 'YEAR_TO_DATE'
  | 'MONTH_TO_DATE'
  | 'QUARTER_TO_DATE';

/**
 * Audit event categories
 */
export type AuditEventCategory =
  | 'GENERATION'
  | 'VALIDATION'
  | 'EXPORT'
  | 'SUBMISSION'
  | 'APPROVAL'
  | 'MODIFICATION'
  | 'ACCESS'
  | 'DELETION';

/**
 * Actor types for audit trail
 */
export type ActorType = 'USER' | 'SYSTEM' | 'EXTERNAL_API' | 'SCHEDULED_JOB';

/**
 * Validation rule structure
 */
export interface ValidationRule {
  field: string;
  rule: string;
  value?: unknown;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

/**
 * Validation result for a single field
 */
export interface FieldValidationResult {
  field: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Complete validation results
 */
export interface ValidationResults {
  isValid: boolean;
  errors: FieldValidationResult[];
  warnings: FieldValidationResult[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    validationTimestamp: Timestamp;
  };
}

/**
 * Report data summary
 */
export interface ReportDataSummary {
  recordCount: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  categories?: Record<string, number>;
  totals?: Record<string, number>;
  additionalMetrics?: Record<string, unknown>;
}

/**
 * File metadata for generated exports
 */
export interface GeneratedFileInfo {
  format: ExportFormat;
  filename: string;
  path: string;
  sizeBytes: number;
  hash: string;
  generatedAt: Timestamp;
  mimeType: string;
}

/**
 * Delivery configuration for scheduled reports
 */
export interface DeliveryConfig {
  emailAddresses?: string[];
  apiEndpoint?: string;
  apiHeaders?: Record<string, string>;
  sftpHost?: string;
  sftpPath?: string;
  sftpCredentials?: {
    username: string;
    passwordEnvVar: string; // Reference to env var, not the actual password
  };
}

/**
 * Compliance Report Template
 *
 * Defines the structure and requirements for state-specific compliance reports
 */
export interface ComplianceReportTemplate extends Entity {
  templateName: string;
  templateCode: string;
  description: string | null;

  // State-specific
  stateCode: ComplianceStateCode;
  reportType: ReportType;
  regulatoryAgency: string;
  regulationReference: string | null;

  // Format and structure
  requiredFields: string[];
  validationRules: Record<string, unknown>;
  exportFormats: ExportFormat[];
  templateContent: string | null;
  metadataSchema: Record<string, unknown>;

  // Scheduling defaults
  defaultFrequency: ReportFrequency;
  defaultDayOfMonth: number | null;
  defaultQuarterEndOffsetDays: number | null;

  // Versioning
  version: number;
  effectiveDate: Timestamp;
  expirationDate: Timestamp | null;
  isActive: boolean;
}

/**
 * Scheduled Compliance Report
 *
 * Configuration for automatically generating compliance reports on a schedule
 */
export interface ScheduledComplianceReport extends Entity, SoftDeletable {
  templateId: UUID;

  // Organization scope
  organizationId: UUID;
  branchId: UUID | null; // null = all branches

  // Schedule configuration
  scheduleName: string;
  frequency: ReportFrequency;
  dayOfMonth: number | null;
  dayOfWeek: number | null; // 0-6, 0=Sunday
  monthOfYear: number | null; // 1-12
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null;
  timeOfDay: string; // HH:MM:SS format

  // Date range parameters
  dateRangeType: DateRangeType;
  lookbackDays: number | null;

  // Export configuration
  exportFormats: ExportFormat[];
  autoSubmit: boolean;
  deliveryMethod: DeliveryMethod;
  deliveryConfig: DeliveryConfig;

  // Status
  isEnabled: boolean;
  lastRunAt: Timestamp | null;
  nextRunAt: Timestamp | null;
  lastGeneratedReportId: UUID | null;
}

/**
 * Generated Compliance Report
 *
 * A specific instance of a compliance report that has been generated
 */
export interface GeneratedComplianceReport extends Entity, SoftDeletable {
  templateId: UUID;
  scheduledReportId: UUID | null;

  // Organization scope
  organizationId: UUID;
  branchId: UUID | null;

  // Report metadata
  reportTitle: string;
  reportNumber: string | null;
  stateCode: ComplianceStateCode;
  reportType: ReportType;

  // Reporting period
  periodStartDate: Date;
  periodEndDate: Date;
  reportingPeriod: string | null; // e.g., "2024-Q3", "2024-11"

  // Generation details
  generatedAt: Timestamp;
  generatedBy: UUID;
  generationMethod: GenerationMethod;

  // Data summary
  recordCount: number;
  dataSummary: ReportDataSummary;
  filterCriteria: Record<string, unknown>;

  // Validation
  validationStatus: ValidationStatus;
  validationResults: ValidationResults | null;
  validatedAt: Timestamp | null;
  validatedBy: UUID | null;

  // File storage
  fileStoragePath: string | null;
  generatedFiles: Record<string, GeneratedFileInfo>;
  fileSizeBytes: number | null;
  fileHash: string | null;

  // Status
  status: ReportStatus;
  statusNotes: string | null;
  finalizedAt: Timestamp | null;
  finalizedBy: UUID | null;
}

/**
 * Compliance Report Submission
 *
 * Tracks the submission of reports to regulatory agencies
 */
export interface ComplianceReportSubmission extends Entity {
  reportId: UUID;

  // Submission details
  submittedAt: Timestamp;
  submittedBy: UUID;
  submissionMethod: SubmissionMethod;
  submissionFormat: ExportFormat;

  // Destination
  regulatoryAgency: string;
  destinationEmail: string | null;
  destinationApiEndpoint: string | null;
  destinationSftpPath: string | null;

  // Submission tracking
  submissionReferenceNumber: string | null;
  confirmationNumber: string | null;
  submissionMetadata: Record<string, unknown>;

  // Status
  status: SubmissionStatus;
  statusMessage: string | null;
  statusUpdatedAt: Timestamp;

  // Response tracking
  acknowledgedAt: Timestamp | null;
  acknowledgmentReference: string | null;
  responseData: Record<string, unknown>;

  // Retry logic
  attemptNumber: number;
  maxAttempts: number;
  nextRetryAt: Timestamp | null;
}

/**
 * Compliance Report Audit Trail
 *
 * Complete audit trail for all compliance reporting operations
 */
export interface ComplianceReportAuditTrail {
  id: UUID;

  // Reference to report
  reportId: UUID;
  submissionId: UUID | null;

  // Event details
  eventTimestamp: Timestamp;
  eventType: string;
  eventCategory: AuditEventCategory;
  eventDescription: string;

  // Actor
  userId: UUID | null;
  actorType: ActorType;
  actorName: string | null;

  // Context
  eventData: Record<string, unknown>;
  beforeState: Record<string, unknown>;
  afterState: Record<string, unknown>;

  // IP and session tracking
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: UUID | null;

  // Audit metadata
  createdAt: Timestamp;
}

/**
 * Report generation request parameters
 */
export interface GenerateReportRequest {
  templateId: UUID;
  organizationId: UUID;
  branchId?: UUID;
  periodStartDate: Date;
  periodEndDate: Date;
  exportFormats: ExportFormat[];
  filterCriteria?: Record<string, unknown>;
  autoSubmit?: boolean;
}

/**
 * Report query filters
 */
export interface ReportQueryFilters {
  organizationId?: UUID;
  branchId?: UUID;
  stateCode?: ComplianceStateCode;
  reportType?: ReportType;
  status?: ReportStatus;
  periodStart?: Date;
  periodEnd?: Date;
  generatedAfter?: Timestamp;
  generatedBefore?: Timestamp;
}

/**
 * Schedule creation/update parameters
 */
export interface ScheduleReportParams {
  templateId: UUID;
  organizationId: UUID;
  branchId?: UUID;
  scheduleName: string;
  frequency: ReportFrequency;
  exportFormats: ExportFormat[];
  deliveryMethod: DeliveryMethod;
  deliveryConfig: DeliveryConfig;
  dateRangeType?: DateRangeType;
  dayOfMonth?: number;
  dayOfWeek?: number;
  timeOfDay?: string;
}

/**
 * Report submission parameters
 */
export interface SubmitReportParams {
  reportId: UUID;
  submissionMethod: SubmissionMethod;
  submissionFormat: ExportFormat;
  regulatoryAgency: string;
  destination: {
    email?: string;
    apiEndpoint?: string;
    sftpPath?: string;
  };
}
