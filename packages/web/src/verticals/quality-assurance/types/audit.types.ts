/**
 * Quality Assurance & Audits - Frontend Type Definitions
 *
 * Type definitions for audit management, findings, and corrective actions
 */

// ============================================================================
// Audit Types & Core Entities
// ============================================================================

export type AuditType =
  | 'COMPLIANCE'
  | 'QUALITY'
  | 'SAFETY'
  | 'DOCUMENTATION'
  | 'FINANCIAL'
  | 'MEDICATION'
  | 'INFECTION_CONTROL'
  | 'TRAINING'
  | 'INTERNAL'
  | 'EXTERNAL';

export type AuditStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'FINDINGS_REVIEW'
  | 'CORRECTIVE_ACTIONS'
  | 'COMPLETED'
  | 'APPROVED'
  | 'ARCHIVED';

export type AuditScope =
  | 'ORGANIZATION'
  | 'BRANCH'
  | 'DEPARTMENT'
  | 'CAREGIVER'
  | 'CLIENT'
  | 'PROCESS';

export type AuditPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Audit {
  id: string;
  auditNumber: string;
  title: string;
  description: string;
  auditType: AuditType;
  status: AuditStatus;
  priority: AuditPriority;
  scope: AuditScope;
  scopeEntityId?: string;
  scopeEntityName?: string;
  scheduledStartDate: string;
  scheduledEndDate: string;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  leadAuditorId: string;
  leadAuditorName: string;
  auditorIds: string[];
  standardsReference?: string;
  auditCriteria?: string[];
  templateId?: string;
  totalFindings: number;
  criticalFindings: number;
  majorFindings: number;
  minorFindings: number;
  complianceScore?: number;
  overallRating?: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'NEEDS_IMPROVEMENT' | 'UNSATISFACTORY';
  executiveSummary?: string;
  recommendations?: string;
  attachmentUrls?: string[];
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  requiresFollowUp: boolean;
  followUpDate?: string | null;
  followUpAuditId?: string | null;
  organizationId: string;
  branchId?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
}

// ============================================================================
// Audit Finding Types
// ============================================================================

export type FindingSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'OBSERVATION';

export type FindingStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'VERIFIED'
  | 'CLOSED'
  | 'DEFERRED';

export type FindingCategory =
  | 'DOCUMENTATION'
  | 'TRAINING'
  | 'POLICY_PROCEDURE'
  | 'SAFETY'
  | 'QUALITY_OF_CARE'
  | 'INFECTION_CONTROL'
  | 'MEDICATION'
  | 'EQUIPMENT'
  | 'STAFFING'
  | 'COMMUNICATION'
  | 'FINANCIAL'
  | 'REGULATORY'
  | 'OTHER';

export interface AuditFinding {
  id: string;
  auditId: string;
  findingNumber: string;
  title: string;
  description: string;
  category: FindingCategory;
  severity: FindingSeverity;
  status: FindingStatus;
  standardReference?: string;
  regulatoryRequirement?: string;
  evidenceDescription?: string;
  evidenceUrls?: string[];
  observedBy: string;
  observedByName: string;
  observedAt: string;
  locationDescription?: string;
  affectedEntity?: 'CAREGIVER' | 'CLIENT' | 'PROCESS' | 'DOCUMENTATION' | 'EQUIPMENT';
  affectedEntityId?: string;
  affectedEntityName?: string;
  potentialImpact?: string;
  actualImpact?: string;
  requiredCorrectiveAction: string;
  recommendedTimeframe?: string;
  targetResolutionDate?: string | null;
  actualResolutionDate?: string | null;
  resolutionDescription?: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  requiresFollowUp: boolean;
  followUpNotes?: string;
  organizationId: string;
  branchId?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
}

// ============================================================================
// Corrective Action Types
// ============================================================================

export type CorrectiveActionStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'IMPLEMENTED'
  | 'VERIFIED'
  | 'CLOSED'
  | 'INEFFECTIVE'
  | 'CANCELLED';

export type CorrectiveActionType =
  | 'IMMEDIATE'
  | 'SHORT_TERM'
  | 'LONG_TERM'
  | 'PREVENTIVE';

export interface ProgressUpdate {
  updateDate: string;
  updatedBy: string;
  updatedByName: string;
  progressNote: string;
  completionPercentage: number;
  issuesEncountered?: string;
  nextSteps?: string;
}

export interface CorrectiveAction {
  id: string;
  findingId: string;
  auditId: string;
  actionNumber: string;
  title: string;
  description: string;
  actionType: CorrectiveActionType;
  status: CorrectiveActionStatus;
  rootCause?: string;
  contributingFactors?: string[];
  specificActions: string[];
  responsiblePersonId: string;
  responsiblePersonName: string;
  targetCompletionDate: string;
  actualCompletionDate?: string | null;
  resourcesRequired?: string;
  estimatedCost?: number;
  actualCost?: number;
  monitoringPlan?: string;
  successCriteria?: string[];
  verificationMethod?: string;
  progressUpdates?: ProgressUpdate[];
  completionPercentage: number;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  verificationNotes?: string;
  effectivenessRating?: 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'INEFFECTIVE';
  attachmentUrls?: string[];
  organizationId: string;
  branchId?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
}

// ============================================================================
// Audit Template Types
// ============================================================================

export interface AuditChecklistItem {
  itemId: string;
  question: string;
  guidance?: string;
  standardReference?: string;
  responseType: 'YES_NO' | 'YES_NO_NA' | 'COMPLIANT_NONCOMPLIANT' | 'RATING' | 'TEXT';
  isMandatory: boolean;
  requiresEvidence: boolean;
  orderIndex: number;
  weight?: number;
}

export interface AuditChecklistSection {
  sectionId: string;
  title: string;
  description?: string;
  orderIndex: number;
  items: AuditChecklistItem[];
  weightPercentage?: number;
}

export interface AuditTemplate {
  id: string;
  templateName: string;
  description: string;
  auditType: AuditType;
  applicableScope: AuditScope[];
  standardsReference?: string;
  templateVersion: string;
  effectiveDate: string;
  expiryDate?: string | null;
  checklistSections: AuditChecklistSection[];
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: string | null;
  organizationId: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
}

export interface AuditChecklistResponse {
  id: string;
  auditId: string;
  templateId: string;
  sectionId: string;
  itemId: string;
  response: string;
  notes?: string;
  evidenceUrls?: string[];
  respondedBy: string;
  respondedByName: string;
  respondedAt: string;
  findingId?: string | null;
  organizationId: string;
}

// ============================================================================
// Summary and Dashboard Types
// ============================================================================

export interface AuditSummary {
  id: string;
  auditNumber: string;
  title: string;
  auditType: AuditType;
  status: AuditStatus;
  priority: AuditPriority;
  scheduledStartDate: string;
  scheduledEndDate: string;
  leadAuditorName: string;
  totalFindings: number;
  criticalFindings: number;
  complianceScore?: number;
  overallRating?: string;
}

export interface AuditDetail extends Audit {
  findings: AuditFinding[];
  correctiveActions: CorrectiveAction[];
  checklistResponses?: AuditChecklistResponse[];
}

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

export interface AuditDashboard {
  upcomingAudits: AuditSummary[];
  inProgressAudits: AuditSummary[];
  recentlyCompleted: AuditSummary[];
  criticalFindings: AuditFinding[];
  overdueCorrectiveActions: CorrectiveAction[];
  statistics: AuditStatistics;
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateAuditInput {
  title: string;
  description: string;
  auditType: AuditType;
  priority: AuditPriority;
  scope: AuditScope;
  scopeEntityId?: string;
  scopeEntityName?: string;
  scheduledStartDate: string;
  scheduledEndDate: string;
  leadAuditorId: string;
  auditorIds?: string[];
  standardsReference?: string;
  auditCriteria?: string[];
  templateId?: string;
}

export interface UpdateAuditInput {
  title?: string;
  description?: string;
  status?: AuditStatus;
  priority?: AuditPriority;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  executiveSummary?: string;
  recommendations?: string;
  complianceScore?: number;
  overallRating?: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'NEEDS_IMPROVEMENT' | 'UNSATISFACTORY';
}

export interface CreateAuditFindingInput {
  auditId: string;
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
  affectedEntityId?: string;
  affectedEntityName?: string;
  potentialImpact?: string;
  requiredCorrectiveAction: string;
  recommendedTimeframe?: string;
  targetResolutionDate?: string;
}

export interface CreateCorrectiveActionInput {
  findingId: string;
  auditId: string;
  title: string;
  description: string;
  actionType: CorrectiveActionType;
  rootCause?: string;
  contributingFactors?: string[];
  specificActions: string[];
  responsiblePersonId: string;
  targetCompletionDate: string;
  resourcesRequired?: string;
  estimatedCost?: number;
  monitoringPlan?: string;
  successCriteria?: string[];
  verificationMethod?: string;
}

export interface UpdateCorrectiveActionProgressInput {
  progressNote: string;
  completionPercentage: number;
  issuesEncountered?: string;
  nextSteps?: string;
}
