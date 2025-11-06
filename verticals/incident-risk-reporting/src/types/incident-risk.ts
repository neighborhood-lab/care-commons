/**
 * @care-commons/incident-risk-reporting - Type Definitions
 *
 * Incident & Risk Reporting Platform
 *
 * Types for incident reporting, risk assessment, investigation tracking,
 * corrective actions, and regulatory compliance for home care incidents.
 */

import type { Entity, UUID, Timestamp } from '@care-commons/core';

// ============================================================================
// Incident Types
// ============================================================================

/**
 * Type of incident that occurred
 */
export type IncidentType =
  | 'FALL' // Client fall
  | 'MEDICATION_ERROR' // Medication administration error
  | 'INJURY' // Physical injury to client
  | 'BEHAVIORAL' // Behavioral incident
  | 'ABUSE_ALLEGATION' // Alleged abuse or neglect
  | 'THEFT_LOSS' // Theft or loss of property
  | 'ELOPEMENT' // Client left facility/home unsupervised
  | 'EQUIPMENT_FAILURE' // Medical equipment malfunction
  | 'ENVIRONMENTAL_HAZARD' // Unsafe environment
  | 'NEAR_MISS' // Incident that almost occurred
  | 'CAREGIVER_INJURY' // Injury to caregiver/staff
  | 'COMMUNICATION_FAILURE' // Missed communication
  | 'MEDICAL_EMERGENCY' // Emergency medical situation
  | 'PRIVACY_BREACH' // HIPAA or privacy violation
  | 'OTHER'; // Other type of incident

/**
 * Severity level of incident
 */
export type IncidentSeverity =
  | 'MINOR' // No injury, minimal impact
  | 'MODERATE' // Minor injury, moderate impact
  | 'SERIOUS' // Serious injury or significant impact
  | 'CRITICAL' // Life-threatening or severe impact
  | 'CATASTROPHIC'; // Death or permanent disability

/**
 * Current status of incident report
 */
export type IncidentStatus =
  | 'DRAFT' // Being drafted
  | 'SUBMITTED' // Submitted for review
  | 'UNDER_REVIEW' // Being investigated
  | 'PENDING_ACTION' // Awaiting corrective action
  | 'RESOLVED' // Incident resolved
  | 'CLOSED'; // Final closure with documentation

/**
 * Location where incident occurred
 */
export type IncidentLocation =
  | 'CLIENT_HOME' // Client's residence
  | 'COMMUNITY' // Out in community
  | 'FACILITY' // Care facility
  | 'TRANSPORTATION' // During transport
  | 'OTHER';

/**
 * Main incident report record
 */
export interface IncidentReport extends Entity {
  // Basic information
  incidentNumber: string; // Unique incident tracking number
  incidentType: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;

  // When and where
  occurredAt: Timestamp;
  discoveredAt: Timestamp;
  location: IncidentLocation;
  locationDetails: string;

  // Who was involved
  clientId: UUID;
  reportedBy: UUID; // Staff member who reported
  reportedByName: string;
  reportedAt: Timestamp;
  witnessIds?: UUID[];

  // What happened
  description: string;
  immediateActions: string; // Actions taken immediately
  clientImpact?: string; // Impact on client

  // Injuries or outcomes
  injuryOccurred: boolean;
  injuryDescription?: string;
  medicalAttentionRequired: boolean;
  medicalAttentionDetails?: string;
  hospitalTransport: boolean;
  hospitalName?: string;

  // Notifications
  familyNotified: boolean;
  familyNotifiedAt?: Timestamp | null;
  familyNotifiedBy?: UUID;
  physicianNotified: boolean;
  physicianNotifiedAt?: Timestamp | null;
  regulatoryReportingRequired: boolean;
  regulatoryAgencies?: string[];

  // Investigation
  investigationRequired: boolean;
  investigationAssignedTo?: UUID;
  investigationStartedAt?: Timestamp | null;
  investigationCompletedAt?: Timestamp | null;

  // Attachments
  photoUrls?: string[];
  documentUrls?: string[];

  // Follow-up
  followUpRequired: boolean;
  followUpNotes?: string;

  // Closure
  closedAt?: Timestamp | null;
  closedBy?: UUID;
  closureNotes?: string;

  // Organization context
  organizationId: UUID;
  branchId: UUID;
}

// ============================================================================
// Risk Assessment Types
// ============================================================================

/**
 * Type of risk being assessed
 */
export type RiskType =
  | 'FALL_RISK' // Risk of falling
  | 'ELOPEMENT_RISK' // Risk of wandering/elopement
  | 'MEDICATION_RISK' // Medication management risk
  | 'SKIN_INTEGRITY' // Pressure ulcer risk
  | 'NUTRITION_HYDRATION' // Malnutrition/dehydration risk
  | 'BEHAVIORAL_RISK' // Behavioral health risk
  | 'INFECTION_RISK' // Infection control risk
  | 'SAFETY_RISK' // General safety concerns
  | 'ABUSE_NEGLECT' // Risk of abuse or neglect
  | 'ENVIRONMENTAL' // Environmental hazards
  | 'EQUIPMENT' // Equipment-related risks
  | 'OTHER';

/**
 * Risk level rating
 */
export type RiskLevel =
  | 'LOW' // Minimal risk, standard precautions
  | 'MODERATE' // Some risk, enhanced monitoring
  | 'HIGH' // Significant risk, active intervention
  | 'CRITICAL'; // Severe risk, immediate action required

/**
 * Status of risk assessment
 */
export type RiskAssessmentStatus =
  | 'ACTIVE' // Current assessment in use
  | 'SUPERSEDED' // Replaced by newer assessment
  | 'ARCHIVED'; // Historical record

/**
 * Risk assessment for a client
 */
export interface RiskAssessment extends Entity {
  // Basic information
  assessmentNumber: string;
  clientId: UUID;
  riskType: RiskType;
  riskLevel: RiskLevel;
  status: RiskAssessmentStatus;

  // Assessment details
  assessmentDate: Timestamp;
  assessedBy: UUID;
  assessedByName: string;
  assessedByTitle: string;

  // Risk factors identified
  riskFactors: RiskFactor[];
  contributingFactors?: string;

  // Scoring (if using standardized tool)
  assessmentTool?: string; // e.g., "Morse Fall Scale", "Braden Scale"
  scoreValue?: number;
  scoreInterpretation?: string;

  // Current interventions
  currentInterventions: string[];
  interventionEffectiveness?: string;

  // Recommendations
  recommendedInterventions: string[];
  recommendedFrequency?: string; // How often to reassess

  // Review schedule
  nextReviewDue: Timestamp;
  reviewedAt?: Timestamp | null;
  reviewedBy?: UUID;

  // Outcome tracking
  incidentsRelated: UUID[]; // Related incident report IDs
  mitigationSuccess: boolean;

  // Organization context
  organizationId: UUID;
  branchId: UUID;
}

/**
 * Individual risk factor identified
 */
export interface RiskFactor {
  factorId: string;
  factorName: string;
  category: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH';
  description: string;
  identifiedDate: Timestamp;
  stillPresent: boolean;
}

// ============================================================================
// Investigation Types
// ============================================================================

/**
 * Status of investigation
 */
export type InvestigationStatus =
  | 'NOT_STARTED' // Assigned but not started
  | 'IN_PROGRESS' // Active investigation
  | 'PENDING_REVIEW' // Awaiting management review
  | 'COMPLETED' // Investigation complete
  | 'CLOSED'; // Final closure

/**
 * Investigation outcome
 */
export type InvestigationOutcome =
  | 'SUBSTANTIATED' // Incident confirmed as reported
  | 'UNSUBSTANTIATED' // Could not confirm incident
  | 'INCONCLUSIVE' // Insufficient evidence
  | 'FALSE_REPORT' // Determined to be false
  | 'ADMINISTRATIVE_ERROR'; // Error in documentation/process

/**
 * Investigation of an incident
 */
export interface Investigation extends Entity {
  // Related incident
  incidentReportId: UUID;
  incidentNumber: string;

  // Investigation details
  investigationNumber: string;
  status: InvestigationStatus;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  // Assignment
  assignedTo: UUID;
  assignedToName: string;
  assignedAt: Timestamp;
  startedAt?: Timestamp | null;
  dueDate: Timestamp;

  // Investigation process
  methodsUsed: string[]; // e.g., ["Interviews", "Document Review", "Site Visit"]
  interviewsConducted: Interview[];
  evidenceCollected: Evidence[];
  timelineReconstructions?: TimelineEvent[];

  // Findings
  findings?: string;
  rootCauses?: RootCause[];
  contributingFactors?: string[];
  outcome?: InvestigationOutcome;

  // Recommendations
  recommendations?: string[];
  correctiveActionsRequired: boolean;

  // Completion
  completedAt?: Timestamp | null;
  reviewedBy?: UUID;
  reviewedAt?: Timestamp | null;
  approvedBy?: UUID;
  approvedAt?: Timestamp | null;

  // Documentation
  reportDocumentUrl?: string;
  attachmentUrls?: string[];

  // Organization context
  organizationId: UUID;
  branchId: UUID;
}

/**
 * Interview conducted during investigation
 */
export interface Interview {
  interviewId: string;
  interviewedPersonId?: UUID;
  interviewedPersonName: string;
  personType: 'STAFF' | 'CLIENT' | 'FAMILY' | 'WITNESS' | 'OTHER';
  conductedAt: Timestamp;
  conductedBy: UUID;
  summary: string;
  recordingUrl?: string;
  transcriptUrl?: string;
}

/**
 * Evidence collected during investigation
 */
export interface Evidence {
  evidenceId: string;
  evidenceType: 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'PHYSICAL' | 'TESTIMONY' | 'OTHER';
  description: string;
  collectedAt: Timestamp;
  collectedBy: UUID;
  fileUrls?: string[];
  chainOfCustody?: string;
}

/**
 * Timeline event reconstruction
 */
export interface TimelineEvent {
  eventId: string;
  occurredAt: Timestamp;
  description: string;
  source: string; // How this was determined
  confidence: 'CONFIRMED' | 'PROBABLE' | 'POSSIBLE';
}

/**
 * Root cause identified
 */
export interface RootCause {
  causeId: string;
  category: 'HUMAN_ERROR' | 'PROCESS_FAILURE' | 'EQUIPMENT' | 'ENVIRONMENTAL' | 'COMMUNICATION' | 'TRAINING' | 'OTHER';
  description: string;
  severity: 'MINOR' | 'MODERATE' | 'MAJOR';
  preventable: boolean;
}

// ============================================================================
// Corrective Action Types
// ============================================================================

/**
 * Type of corrective action
 */
export type CorrectiveActionType =
  | 'POLICY_UPDATE' // Update policies or procedures
  | 'TRAINING' // Additional training required
  | 'PROCESS_CHANGE' // Change in operational process
  | 'EQUIPMENT_UPGRADE' // Equipment changes
  | 'ENVIRONMENTAL_MODIFICATION' // Physical environment changes
  | 'STAFFING_CHANGE' // Staffing adjustments
  | 'SUPERVISION_INCREASE' // Enhanced supervision
  | 'DISCIPLINARY_ACTION' // Staff disciplinary action
  | 'OTHER';

/**
 * Status of corrective action
 */
export type CorrectiveActionStatus =
  | 'PLANNED' // Action planned
  | 'IN_PROGRESS' // Being implemented
  | 'COMPLETED' // Implementation complete
  | 'VERIFIED' // Effectiveness verified
  | 'CLOSED' // Action closed
  | 'CANCELLED'; // Action cancelled

/**
 * Corrective action plan
 */
export interface CorrectiveAction extends Entity {
  // Related records
  incidentReportId?: UUID;
  investigationId?: UUID;
  riskAssessmentId?: UUID;

  // Action details
  actionNumber: string;
  actionType: CorrectiveActionType;
  description: string;
  rationale: string; // Why this action is needed

  // Assignment
  assignedTo: UUID;
  assignedToName: string;
  assignedAt: Timestamp;

  // Timeline
  targetStartDate: Timestamp;
  targetCompletionDate: Timestamp;
  actualStartDate?: Timestamp | null;
  actualCompletionDate?: Timestamp | null;

  // Status
  status: CorrectiveActionStatus;
  progress: number; // Percentage (0-100)

  // Implementation
  implementationPlan?: string;
  resourcesRequired?: string;
  budgetImpact?: number;

  // Verification
  verificationMethod?: string;
  verifiedBy?: UUID;
  verifiedAt?: Timestamp | null;
  verificationNotes?: string;
  effectivenessRating?: 'INEFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'EFFECTIVE' | 'HIGHLY_EFFECTIVE';

  // Follow-up
  followUpRequired: boolean;
  followUpDate?: Timestamp | null;

  // Documentation
  documentUrls?: string[];

  // Organization context
  organizationId: UUID;
  branchId: UUID;
}

// ============================================================================
// Regulatory Reporting Types
// ============================================================================

/**
 * Regulatory agency requiring notification
 */
export type RegulatoryAgency =
  | 'STATE_HEALTH_DEPT' // State Department of Health
  | 'OMBUDSMAN' // Long-term care ombudsman
  | 'APS' // Adult Protective Services
  | 'CPS' // Child Protective Services
  | 'LAW_ENFORCEMENT' // Police/Sheriff
  | 'OSHA' // Occupational Safety and Health
  | 'CMS' // Centers for Medicare & Medicaid
  | 'OTHER';

/**
 * Status of regulatory report
 */
export type RegulatoryReportStatus =
  | 'REQUIRED' // Report required, not yet submitted
  | 'SUBMITTED' // Report submitted
  | 'ACKNOWLEDGED' // Agency acknowledged receipt
  | 'UNDER_REVIEW' // Agency reviewing
  | 'FOLLOW_UP_REQUIRED' // Additional info requested
  | 'CLOSED' // Agency closed review
  | 'NOT_REQUIRED'; // Determined not required

/**
 * Regulatory report filed
 */
export interface RegulatoryReport extends Entity {
  // Related incident
  incidentReportId: UUID;
  incidentNumber: string;

  // Agency information
  agency: RegulatoryAgency;
  agencyName: string;
  reportingRequirement: string; // Legal basis for reporting

  // Timing requirements
  reportingDeadline: Timestamp;
  submittedAt?: Timestamp | null;
  acknowledgedAt?: Timestamp | null;

  // Report details
  reportNumber?: string; // Agency-assigned number
  reportMethod: 'PHONE' | 'FAX' | 'EMAIL' | 'ONLINE_PORTAL' | 'MAIL';
  status: RegulatoryReportStatus;

  // Content
  submittedBy: UUID;
  submittedByName: string;
  reportContent: string;
  attachmentUrls?: string[];

  // Agency response
  agencyResponse?: string;
  agencyCaseNumber?: string;
  followUpRequired: boolean;
  followUpDetails?: string;

  // Closure
  closedAt?: Timestamp | null;
  closureNotes?: string;

  // Organization context
  organizationId: UUID;
  branchId: UUID;
}

// ============================================================================
// Analytics & Trending Types
// ============================================================================

/**
 * Incident trend analysis
 */
export interface IncidentTrend {
  periodStart: Timestamp;
  periodEnd: Timestamp;
  totalIncidents: number;
  byType: Record<IncidentType, number>;
  bySeverity: Record<IncidentSeverity, number>;
  byLocation: Record<IncidentLocation, number>;
  monthOverMonthChange: number; // Percentage change
  topRiskAreas: string[];
}

/**
 * Risk dashboard summary
 */
export interface RiskDashboard {
  organizationId: UUID;
  branchId?: UUID;
  asOfDate: Timestamp;

  // Active risks
  activeRisksTotal: number;
  criticalRisks: number;
  highRisks: number;
  moderateRisks: number;
  lowRisks: number;

  // Recent activity
  newIncidentsLast30Days: number;
  openInvestigations: number;
  pendingCorrectiveActions: number;
  overdueActions: number;

  // Trends
  incidentTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  topIncidentTypes: Array<{ type: IncidentType; count: number }>;
  topRiskTypes: Array<{ type: RiskType; count: number }>;
}

// ============================================================================
// Service Layer Input/Output Types
// ============================================================================

/**
 * Input for creating incident report
 */
export interface CreateIncidentReportInput {
  incidentType: IncidentType;
  severity: IncidentSeverity;
  occurredAt: Timestamp;
  discoveredAt: Timestamp;
  location: IncidentLocation;
  locationDetails: string;
  clientId: UUID;
  description: string;
  immediateActions: string;
  clientImpact?: string;
  injuryOccurred: boolean;
  injuryDescription?: string;
  medicalAttentionRequired: boolean;
  medicalAttentionDetails?: string;
  hospitalTransport: boolean;
  hospitalName?: string;
  witnessIds?: UUID[];
  photoUrls?: string[];
  documentUrls?: string[];
}

/**
 * Input for creating risk assessment
 */
export interface CreateRiskAssessmentInput {
  clientId: UUID;
  riskType: RiskType;
  riskLevel: RiskLevel;
  assessmentDate: Timestamp;
  riskFactors: Omit<RiskFactor, 'factorId'>[];
  contributingFactors?: string;
  assessmentTool?: string;
  scoreValue?: number;
  scoreInterpretation?: string;
  currentInterventions: string[];
  recommendedInterventions: string[];
  nextReviewDue: Timestamp;
}

/**
 * Input for starting investigation
 */
export interface StartInvestigationInput {
  incidentReportId: UUID;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  assignedTo: UUID;
  dueDate: Timestamp;
  methodsUsed: string[];
}

/**
 * Input for creating corrective action
 */
export interface CreateCorrectiveActionInput {
  incidentReportId?: UUID;
  investigationId?: UUID;
  riskAssessmentId?: UUID;
  actionType: CorrectiveActionType;
  description: string;
  rationale: string;
  assignedTo: UUID;
  targetStartDate: Timestamp;
  targetCompletionDate: Timestamp;
  implementationPlan?: string;
  resourcesRequired?: string;
  budgetImpact?: number;
}

/**
 * Input for submitting regulatory report
 */
export interface SubmitRegulatoryReportInput {
  incidentReportId: UUID;
  agency: RegulatoryAgency;
  agencyName: string;
  reportingRequirement: string;
  reportingDeadline: Timestamp;
  reportMethod: 'PHONE' | 'FAX' | 'EMAIL' | 'ONLINE_PORTAL' | 'MAIL';
  reportContent: string;
  attachmentUrls?: string[];
}
