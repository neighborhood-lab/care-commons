/**
 * @care-commons/quality-assurance-audits - Type Definitions
 *
 * Quality Assurance & Audits - Compliance, Quality, and Safety Auditing
 *
 * Types for audit management, findings, corrective actions, and compliance
 * tracking to ensure quality standards and regulatory requirements are met.
 */

import type { Entity, UUID, Timestamp } from '@care-commons/core';

// ============================================================================
// Audit Types & Core Entities
// ============================================================================

/**
 * Type of audit being conducted
 */
export type AuditType =
  | 'COMPLIANCE' // Regulatory compliance audit
  | 'QUALITY' // Quality of care audit
  | 'SAFETY' // Safety protocols audit
  | 'DOCUMENTATION' // Documentation review audit
  | 'FINANCIAL' // Financial/billing audit
  | 'MEDICATION' // Medication management audit
  | 'INFECTION_CONTROL' // Infection control audit
  | 'TRAINING' // Staff training compliance audit
  | 'INTERNAL' // Internal quality review
  | 'EXTERNAL'; // External agency audit

/**
 * Current status of the audit
 */
export type AuditStatus =
  | 'DRAFT' // Audit being planned
  | 'SCHEDULED' // Audit scheduled
  | 'IN_PROGRESS' // Audit in progress
  | 'FINDINGS_REVIEW' // Reviewing findings
  | 'CORRECTIVE_ACTIONS' // Implementing corrective actions
  | 'COMPLETED' // Audit completed
  | 'APPROVED' // Audit approved by management
  | 'ARCHIVED'; // Archived for record-keeping

/**
 * Scope of the audit
 */
export type AuditScope =
  | 'ORGANIZATION' // Entire organization
  | 'BRANCH' // Specific branch/location
  | 'DEPARTMENT' // Specific department
  | 'CAREGIVER' // Individual caregiver
  | 'CLIENT' // Individual client
  | 'PROCESS'; // Specific process/procedure

/**
 * Priority level of the audit
 */
export type AuditPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

/**
 * Main audit entity
 */
export interface Audit extends Entity {
  // Basic information
  auditNumber: string; // Unique audit reference number (e.g., "AUD-2024-001")
  title: string;
  description: string;
  auditType: AuditType;
  status: AuditStatus;
  priority: AuditPriority;

  // Scope
  scope: AuditScope;
  scopeEntityId?: UUID; // ID of the entity being audited (branch, caregiver, etc.)
  scopeEntityName?: string; // Name for display

  // Scheduling
  scheduledStartDate: Timestamp;
  scheduledEndDate: Timestamp;
  actualStartDate?: Timestamp | null;
  actualEndDate?: Timestamp | null;

  // Audit team
  leadAuditorId: UUID;
  leadAuditorName: string;
  auditorIds: UUID[]; // Additional auditors

  // Standards & criteria
  standardsReference?: string; // Reference to regulatory standards (e.g., "CMS 42 CFR 484")
  auditCriteria?: string[]; // Specific criteria being evaluated
  templateId?: UUID; // Reference to audit template if used

  // Results summary
  totalFindings: number;
  criticalFindings: number;
  majorFindings: number;
  minorFindings: number;
  complianceScore?: number; // Percentage (0-100)
  overallRating?: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'NEEDS_IMPROVEMENT' | 'UNSATISFACTORY';

  // Documentation
  executiveSummary?: string;
  recommendations?: string;
  attachmentUrls?: string[]; // Supporting documents

  // Approval & sign-off
  reviewedBy?: UUID | null;
  reviewedAt?: Timestamp | null;
  approvedBy?: UUID | null;
  approvedAt?: Timestamp | null;

  // Follow-up
  requiresFollowUp: boolean;
  followUpDate?: Timestamp | null;
  followUpAuditId?: UUID | null; // Link to follow-up audit

  // Context
  organizationId: UUID;
  branchId?: UUID;
}

// ============================================================================
// Audit Finding Types
// ============================================================================

/**
 * Severity level of a finding
 */
export type FindingSeverity =
  | 'CRITICAL' // Immediate risk to safety or severe non-compliance
  | 'MAJOR' // Significant issue requiring prompt attention
  | 'MINOR' // Low-impact issue
  | 'OBSERVATION'; // Note for improvement, not a deficiency

/**
 * Status of a finding
 */
export type FindingStatus =
  | 'OPEN' // Finding identified, not yet addressed
  | 'IN_PROGRESS' // Corrective action in progress
  | 'RESOLVED' // Issue resolved
  | 'VERIFIED' // Resolution verified
  | 'CLOSED' // Finding closed
  | 'DEFERRED'; // Addressed in future audit

/**
 * Category of finding
 */
export type FindingCategory =
  | 'DOCUMENTATION' // Documentation issues
  | 'TRAINING' // Training deficiencies
  | 'POLICY_PROCEDURE' // Policy/procedure violations
  | 'SAFETY' // Safety concerns
  | 'QUALITY_OF_CARE' // Care quality issues
  | 'INFECTION_CONTROL' // Infection control
  | 'MEDICATION' // Medication management
  | 'EQUIPMENT' // Equipment issues
  | 'STAFFING' // Staffing concerns
  | 'COMMUNICATION' // Communication issues
  | 'FINANCIAL' // Financial/billing issues
  | 'REGULATORY' // Regulatory compliance
  | 'OTHER';

/**
 * Individual audit finding or deficiency
 */
export interface AuditFinding extends Entity {
  auditId: UUID;

  // Finding details
  findingNumber: string; // E.g., "F-001"
  title: string;
  description: string;
  category: FindingCategory;
  severity: FindingSeverity;
  status: FindingStatus;

  // Compliance reference
  standardReference?: string; // Specific regulation or standard violated
  regulatoryRequirement?: string; // Exact requirement text

  // Evidence
  evidenceDescription?: string;
  evidenceUrls?: string[]; // Photos, documents, etc.
  observedBy: UUID;
  observedByName: string;
  observedAt: Timestamp;

  // Location/context
  locationDescription?: string;
  affectedEntity?: 'CAREGIVER' | 'CLIENT' | 'PROCESS' | 'DOCUMENTATION' | 'EQUIPMENT';
  affectedEntityId?: UUID;
  affectedEntityName?: string;

  // Impact
  potentialImpact?: string; // Description of potential consequences
  actualImpact?: string; // Description of actual harm/impact

  // Resolution
  requiredCorrectiveAction: string;
  recommendedTimeframe?: string; // e.g., "Within 24 hours", "Within 30 days"
  targetResolutionDate?: Timestamp | null;
  actualResolutionDate?: Timestamp | null;
  resolutionDescription?: string;
  verifiedBy?: UUID | null;
  verifiedAt?: Timestamp | null;

  // Follow-up
  requiresFollowUp: boolean;
  followUpNotes?: string;

  organizationId: UUID;
  branchId?: UUID;
}

// ============================================================================
// Corrective Action Types
// ============================================================================

/**
 * Status of corrective action
 */
export type CorrectiveActionStatus =
  | 'PLANNED' // Action planned but not started
  | 'IN_PROGRESS' // Action being implemented
  | 'IMPLEMENTED' // Action completed
  | 'VERIFIED' // Effectiveness verified
  | 'CLOSED' // Action closed
  | 'INEFFECTIVE' // Action did not resolve issue
  | 'CANCELLED'; // Action cancelled

/**
 * Type of corrective action
 */
export type CorrectiveActionType =
  | 'IMMEDIATE' // Immediate correction
  | 'SHORT_TERM' // Short-term fix
  | 'LONG_TERM' // Long-term systemic improvement
  | 'PREVENTIVE'; // Preventive measure

/**
 * Corrective action plan and implementation
 */
export interface CorrectiveAction extends Entity {
  findingId: UUID;
  auditId: UUID;

  // Action details
  actionNumber: string; // E.g., "CA-001"
  title: string;
  description: string;
  actionType: CorrectiveActionType;
  status: CorrectiveActionStatus;

  // Root cause analysis
  rootCause?: string;
  contributingFactors?: string[];

  // Implementation plan
  specificActions: string[]; // Step-by-step actions
  responsiblePersonId: UUID;
  responsiblePersonName: string;
  targetCompletionDate: Timestamp;
  actualCompletionDate?: Timestamp | null;

  // Resources required
  resourcesRequired?: string; // Budget, staff time, equipment, etc.
  estimatedCost?: number;
  actualCost?: number;

  // Monitoring
  monitoringPlan?: string; // How effectiveness will be monitored
  successCriteria?: string[]; // How to measure success
  verificationMethod?: string; // How completion will be verified

  // Progress tracking
  progressUpdates?: ProgressUpdate[];
  completionPercentage: number; // 0-100

  // Verification
  verifiedBy?: UUID | null;
  verifiedAt?: Timestamp | null;
  verificationNotes?: string;
  effectivenessRating?: 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'INEFFECTIVE';

  // Documentation
  attachmentUrls?: string[];

  organizationId: UUID;
  branchId?: UUID;
}

/**
 * Progress update for corrective action
 */
export interface ProgressUpdate {
  updateDate: Timestamp;
  updatedBy: UUID;
  updatedByName: string;
  progressNote: string;
  completionPercentage: number;
  issuesEncountered?: string;
  nextSteps?: string;
}

// ============================================================================
// Audit Template Types
// ============================================================================

/**
 * Reusable audit template for standardized audits
 */
export interface AuditTemplate extends Entity {
  // Template details
  templateName: string;
  description: string;
  auditType: AuditType;
  applicableScope: AuditScope[];

  // Standards & criteria
  standardsReference?: string;
  templateVersion: string; // Template version
  effectiveDate: Timestamp;
  expiryDate?: Timestamp | null;

  // Checklist items
  checklistSections: AuditChecklistSection[];

  // Metadata
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: Timestamp | null;

  organizationId: UUID;
}

/**
 * Section within an audit checklist
 */
export interface AuditChecklistSection {
  sectionId: string;
  title: string;
  description?: string;
  orderIndex: number;
  items: AuditChecklistItem[];
  weightPercentage?: number; // Weight for scoring
}

/**
 * Individual checklist item
 */
export interface AuditChecklistItem {
  itemId: string;
  question: string;
  guidance?: string; // Guidance for auditor
  standardReference?: string;
  responseType: 'YES_NO' | 'YES_NO_NA' | 'COMPLIANT_NONCOMPLIANT' | 'RATING' | 'TEXT';
  isMandatory: boolean;
  requiresEvidence: boolean;
  orderIndex: number;
  weight?: number; // Point value for scoring
}

/**
 * Completed checklist response
 */
export interface AuditChecklistResponse extends Entity {
  auditId: UUID;
  templateId: UUID;
  sectionId: string;
  itemId: string;

  // Response
  response: string; // YES, NO, NA, COMPLIANT, NON_COMPLIANT, or numeric rating
  notes?: string;
  evidenceUrls?: string[];

  // Metadata
  respondedBy: UUID;
  respondedByName: string;
  respondedAt: Timestamp;

  // Related finding
  findingId?: UUID | null; // If response indicates non-compliance

  organizationId: UUID;
}

// ============================================================================
// Service Layer Input/Output Types
// ============================================================================

/**
 * Input for creating a new audit
 */
export interface CreateAuditInput {
  title: string;
  description: string;
  auditType: AuditType;
  priority: AuditPriority;
  scope: AuditScope;
  scopeEntityId?: UUID;
  scopeEntityName?: string;
  scheduledStartDate: Timestamp;
  scheduledEndDate: Timestamp;
  leadAuditorId: UUID;
  auditorIds?: UUID[];
  standardsReference?: string;
  auditCriteria?: string[];
  templateId?: UUID;
}

/**
 * Input for updating audit
 */
export interface UpdateAuditInput {
  title?: string;
  description?: string;
  status?: AuditStatus;
  priority?: AuditPriority;
  scheduledStartDate?: Timestamp;
  scheduledEndDate?: Timestamp;
  actualStartDate?: Timestamp;
  actualEndDate?: Timestamp;
  executiveSummary?: string;
  recommendations?: string;
  complianceScore?: number;
  overallRating?: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'NEEDS_IMPROVEMENT' | 'UNSATISFACTORY';
}

/**
 * Input for creating audit finding
 */
export interface CreateAuditFindingInput {
  auditId: UUID;
  title: string;
  description: string;
  category: FindingCategory;
  severity: FindingSeverity;
  standardReference?: string;
  regulatoryRequirement?: string;
  evidenceDescription?: string;
  evidenceUrls?: string[];
  locationDescription?: string;
  affectedEntity?: 'CAREGIVER' | 'CLIENT' | 'PROCESS' | 'DOCUMENTATION' | 'EQUIPMENT';
  affectedEntityId?: UUID;
  affectedEntityName?: string;
  potentialImpact?: string;
  requiredCorrectiveAction: string;
  recommendedTimeframe?: string;
  targetResolutionDate?: Timestamp;
}

/**
 * Input for creating corrective action
 */
export interface CreateCorrectiveActionInput {
  findingId: UUID;
  auditId: UUID;
  title: string;
  description: string;
  actionType: CorrectiveActionType;
  rootCause?: string;
  contributingFactors?: string[];
  specificActions: string[];
  responsiblePersonId: UUID;
  targetCompletionDate: Timestamp;
  resourcesRequired?: string;
  estimatedCost?: number;
  monitoringPlan?: string;
  successCriteria?: string[];
  verificationMethod?: string;
}

/**
 * Input for updating corrective action progress
 */
export interface UpdateCorrectiveActionProgressInput {
  progressNote: string;
  completionPercentage: number;
  issuesEncountered?: string;
  nextSteps?: string;
}

/**
 * Input for creating audit template
 */
export interface CreateAuditTemplateInput {
  templateName: string;
  description: string;
  auditType: AuditType;
  applicableScope: AuditScope[];
  standardsReference?: string;
  templateVersion: string;
  effectiveDate: Timestamp;
  expiryDate?: Timestamp;
  checklistSections: AuditChecklistSection[];
}

// ============================================================================
// Query Result Types
// ============================================================================

/**
 * Audit summary for list views
 */
export interface AuditSummary {
  id: UUID;
  auditNumber: string;
  title: string;
  auditType: AuditType;
  status: AuditStatus;
  priority: AuditPriority;
  scheduledStartDate: Timestamp;
  scheduledEndDate: Timestamp;
  leadAuditorName: string;
  totalFindings: number;
  criticalFindings: number;
  complianceScore?: number;
  overallRating?: string;
}

/**
 * Audit detail with findings and actions
 */
export interface AuditDetail extends Audit {
  findings: AuditFinding[];
  correctiveActions: CorrectiveAction[];
  checklistResponses?: AuditChecklistResponse[];
}

/**
 * Audit statistics and metrics
 */
export interface AuditStatistics {
  totalAudits: number;
  auditsByStatus: Record<AuditStatus, number>;
  auditsByType: Record<AuditType, number>;
  totalFindings: number;
  findingsBySeverity: Record<FindingSeverity, number>;
  averageComplianceScore: number;
  openCorrectiveActions: number;
  overdueCorrectiveActions: number;
}

/**
 * Dashboard data for audits
 */
export interface AuditDashboard {
  upcomingAudits: AuditSummary[];
  inProgressAudits: AuditSummary[];
  recentlyCompleted: AuditSummary[];
  criticalFindings: AuditFinding[];
  overdueCorrectiveActions: CorrectiveAction[];
  statistics: AuditStatistics;
}
