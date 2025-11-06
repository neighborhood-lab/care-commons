// Frontend types for incident and risk reporting (simplified from backend)
export type IncidentType =
  | 'FALL'
  | 'MEDICATION_ERROR'
  | 'INJURY'
  | 'BEHAVIORAL'
  | 'ABUSE_ALLEGATION'
  | 'THEFT_LOSS'
  | 'ELOPEMENT'
  | 'EQUIPMENT_FAILURE'
  | 'ENVIRONMENTAL_HAZARD'
  | 'NEAR_MISS'
  | 'CAREGIVER_INJURY'
  | 'COMMUNICATION_FAILURE'
  | 'MEDICAL_EMERGENCY'
  | 'PRIVACY_BREACH'
  | 'OTHER';

export type IncidentSeverity =
  | 'MINOR'
  | 'MODERATE'
  | 'SERIOUS'
  | 'CRITICAL'
  | 'CATASTROPHIC';

export type IncidentStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PENDING_ACTION'
  | 'RESOLVED'
  | 'CLOSED';

export type IncidentLocation =
  | 'CLIENT_HOME'
  | 'COMMUNITY'
  | 'FACILITY'
  | 'TRANSPORTATION'
  | 'OTHER';

export type RiskType =
  | 'FALL_RISK'
  | 'ELOPEMENT_RISK'
  | 'MEDICATION_RISK'
  | 'SKIN_INTEGRITY'
  | 'NUTRITION_HYDRATION'
  | 'BEHAVIORAL_RISK'
  | 'INFECTION_RISK'
  | 'SAFETY_RISK'
  | 'ABUSE_NEGLECT'
  | 'ENVIRONMENTAL'
  | 'EQUIPMENT'
  | 'OTHER';

export type RiskLevel =
  | 'LOW'
  | 'MODERATE'
  | 'HIGH'
  | 'CRITICAL';

export type RiskAssessmentStatus =
  | 'ACTIVE'
  | 'SUPERSEDED'
  | 'ARCHIVED';

export type InvestigationStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'PENDING_REVIEW'
  | 'COMPLETED'
  | 'CLOSED';

export type CorrectiveActionType =
  | 'POLICY_UPDATE'
  | 'TRAINING'
  | 'PROCESS_CHANGE'
  | 'EQUIPMENT_UPGRADE'
  | 'ENVIRONMENTAL_MODIFICATION'
  | 'STAFFING_CHANGE'
  | 'SUPERVISION_INCREASE'
  | 'DISCIPLINARY_ACTION'
  | 'OTHER';

export type CorrectiveActionStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'VERIFIED'
  | 'CLOSED'
  | 'CANCELLED';

export interface IncidentReport {
  id: string;
  incidentNumber: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  occurredAt: string;
  discoveredAt: string;
  location: IncidentLocation;
  locationDetails: string;
  clientId: string;
  clientName?: string;
  reportedBy: string;
  reportedByName: string;
  reportedAt: string;
  description: string;
  immediateActions: string;
  clientImpact?: string;
  injuryOccurred: boolean;
  injuryDescription?: string;
  medicalAttentionRequired: boolean;
  medicalAttentionDetails?: string;
  hospitalTransport: boolean;
  hospitalName?: string;
  familyNotified: boolean;
  familyNotifiedAt?: string | null;
  physicianNotified: boolean;
  regulatoryReportingRequired: boolean;
  investigationRequired: boolean;
  photoUrls?: string[];
  documentUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RiskAssessment {
  id: string;
  assessmentNumber: string;
  clientId: string;
  clientName?: string;
  riskType: RiskType;
  riskLevel: RiskLevel;
  status: RiskAssessmentStatus;
  assessmentDate: string;
  assessedBy: string;
  assessedByName: string;
  assessedByTitle: string;
  riskFactors: RiskFactor[];
  currentInterventions: string[];
  recommendedInterventions: string[];
  assessmentTool?: string;
  scoreValue?: number;
  nextReviewDue: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiskFactor {
  factorId: string;
  factorName: string;
  category: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH';
  description: string;
  identifiedDate: string;
  stillPresent: boolean;
}

export interface Investigation {
  id: string;
  investigationNumber: string;
  incidentReportId: string;
  incidentNumber: string;
  status: InvestigationStatus;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  assignedTo: string;
  assignedToName: string;
  assignedAt: string;
  startedAt?: string | null;
  dueDate: string;
  findings?: string;
  outcome?: string;
  recommendations?: string[];
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CorrectiveAction {
  id: string;
  actionNumber: string;
  actionType: CorrectiveActionType;
  description: string;
  rationale: string;
  assignedTo: string;
  assignedToName: string;
  targetStartDate: string;
  targetCompletionDate: string;
  actualStartDate?: string | null;
  actualCompletionDate?: string | null;
  status: CorrectiveActionStatus;
  progress: number;
  incidentReportId?: string;
  investigationId?: string;
  effectivenessRating?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiskDashboard {
  organizationId: string;
  branchId?: string;
  asOfDate: string;
  activeRisksTotal: number;
  criticalRisks: number;
  highRisks: number;
  moderateRisks: number;
  lowRisks: number;
  newIncidentsLast30Days: number;
  openInvestigations: number;
  pendingCorrectiveActions: number;
  overdueActions: number;
  incidentTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  topIncidentTypes: Array<{ type: IncidentType; count: number }>;
  topRiskTypes: Array<{ type: RiskType; count: number }>;
}

// Input types
export interface CreateIncidentReportInput {
  incidentType: IncidentType;
  severity: IncidentSeverity;
  occurredAt: string;
  discoveredAt: string;
  location: IncidentLocation;
  locationDetails: string;
  clientId: string;
  description: string;
  immediateActions: string;
  clientImpact?: string;
  injuryOccurred: boolean;
  injuryDescription?: string;
  medicalAttentionRequired: boolean;
  medicalAttentionDetails?: string;
  hospitalTransport: boolean;
  hospitalName?: string;
  witnessIds?: string[];
  photoUrls?: string[];
  documentUrls?: string[];
}

export interface CreateRiskAssessmentInput {
  clientId: string;
  riskType: RiskType;
  riskLevel: RiskLevel;
  assessmentDate: string;
  riskFactors: Omit<RiskFactor, 'factorId'>[];
  contributingFactors?: string;
  assessmentTool?: string;
  scoreValue?: number;
  scoreInterpretation?: string;
  currentInterventions: string[];
  recommendedInterventions: string[];
  nextReviewDue: string;
}

export interface CreateCorrectiveActionInput {
  incidentReportId?: string;
  investigationId?: string;
  riskAssessmentId?: string;
  actionType: CorrectiveActionType;
  description: string;
  rationale: string;
  assignedTo: string;
  targetStartDate: string;
  targetCompletionDate: string;
  implementationPlan?: string;
  resourcesRequired?: string;
  budgetImpact?: number;
}

export interface IncidentReportSearchFilters {
  query?: string;
  clientId?: string;
  organizationId?: string;
  branchId?: string;
  status?: IncidentStatus[];
  severity?: IncidentSeverity[];
  incidentType?: IncidentType[];
  dateFrom?: string;
  dateTo?: string;
  reportedBy?: string;
}

export interface RiskAssessmentSearchFilters {
  query?: string;
  clientId?: string;
  organizationId?: string;
  branchId?: string;
  riskType?: RiskType[];
  riskLevel?: RiskLevel[];
  status?: RiskAssessmentStatus[];
  overdueReview?: boolean;
}
