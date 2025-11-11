/**
 * Incident Reporting Types
 *
 * Comprehensive incident tracking for home healthcare compliance.
 * Supports federal and state-specific reporting requirements.
 */

export type IncidentType =
  | 'FALL'
  | 'MEDICATION_ERROR'
  | 'INJURY'
  | 'ABUSE_ALLEGATION'
  | 'NEGLECT_ALLEGATION'
  | 'EXPLOITATION_ALLEGATION'
  | 'EQUIPMENT_FAILURE'
  | 'EMERGENCY_HOSPITALIZATION'
  | 'DEATH'
  | 'ELOPEMENT'
  | 'BEHAVIORAL_INCIDENT'
  | 'INFECTION'
  | 'PRESSURE_INJURY'
  | 'CLIENT_REFUSAL'
  | 'OTHER';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
  | 'REPORTED'
  | 'UNDER_REVIEW'
  | 'INVESTIGATION_REQUIRED'
  | 'RESOLVED'
  | 'CLOSED';

export type InjurySeverity = 'NONE' | 'MINOR' | 'MODERATE' | 'SEVERE' | 'FATAL';

/**
 * Incident represents a reportable event in home healthcare
 */
export interface Incident {
  id: string;
  organizationId: string;
  clientId: string;
  reportedBy: string; // User ID of caregiver/staff who reported
  incidentType: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  
  // When and where
  occurredAt: Date; // When the incident happened
  discoveredAt: Date; // When it was discovered (may differ from occurred)
  location: string; // e.g., "Client's bedroom", "Kitchen", "Bathroom"
  
  // What happened
  description: string;
  immediateAction: string; // What was done immediately
  
  // People involved
  witnessIds?: string[]; // User IDs of witnesses
  involvedStaffIds?: string[]; // Other staff involved
  
  // Injury details (if applicable)
  injurySeverity?: InjurySeverity;
  injuryDescription?: string;
  medicalAttentionRequired?: boolean;
  medicalAttentionProvided?: string; // Description of medical care
  
  // 911/Emergency services
  emergencyServicesContacted?: boolean;
  emergencyServicesDetails?: string;
  
  // Family notification
  familyNotified?: boolean;
  familyNotifiedAt?: Date;
  familyNotifiedBy?: string; // User ID
  familyNotificationNotes?: string;
  
  // Physician notification
  physicianNotified?: boolean;
  physicianNotifiedAt?: Date;
  physicianNotifiedBy?: string; // User ID
  physicianOrders?: string;
  
  // State/regulatory notification
  stateReportingRequired?: boolean;
  stateReportedAt?: Date;
  stateReportedBy?: string; // User ID
  stateReportNumber?: string;
  stateAgency?: string;
  
  // Investigation
  investigationRequired?: boolean;
  investigationStartedAt?: Date;
  investigationCompletedAt?: Date;
  investigationFindings?: string;
  
  // Prevention
  preventativeMeasures?: string;
  policyChangesRecommended?: string;
  
  // Follow-up
  followUpRequired?: boolean;
  followUpCompletedAt?: Date;
  followUpNotes?: string;
  
  // Attachments
  attachmentUrls?: string[]; // Photos, documents, etc.
  
  // Resolution
  resolutionNotes?: string;
  resolvedAt?: Date;
  resolvedBy?: string; // User ID
  closedAt?: Date;
  closedBy?: string; // User ID
  
  // Audit trail
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  version: number;
}

/**
 * Input for creating a new incident report
 */
export interface CreateIncidentInput {
  clientId: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  occurredAt: string;
  discoveredAt?: string;
  location: string;
  description: string;
  immediateAction: string;
  witnessIds?: string[];
  involvedStaffIds?: string[];
  injurySeverity?: InjurySeverity;
  injuryDescription?: string;
  medicalAttentionRequired?: boolean;
  medicalAttentionProvided?: string;
  emergencyServicesContacted?: boolean;
  emergencyServicesDetails?: string;
  familyNotified?: boolean;
  familyNotifiedAt?: string;
  familyNotificationNotes?: string;
  physicianNotified?: boolean;
  physicianNotifiedAt?: string;
  physicianOrders?: string;
}

/**
 * Input for updating an incident report
 */
export interface UpdateIncidentInput {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  description?: string;
  immediateAction?: string;
  injurySeverity?: InjurySeverity;
  injuryDescription?: string;
  medicalAttentionRequired?: boolean;
  medicalAttentionProvided?: string;
  emergencyServicesContacted?: boolean;
  emergencyServicesDetails?: string;
  familyNotified?: boolean;
  familyNotifiedAt?: string;
  familyNotificationNotes?: string;
  physicianNotified?: boolean;
  physicianNotifiedAt?: string;
  physicianOrders?: string;
  stateReportingRequired?: boolean;
  stateReportedAt?: string;
  stateReportNumber?: string;
  stateAgency?: string;
  investigationRequired?: boolean;
  investigationStartedAt?: string;
  investigationCompletedAt?: string;
  investigationFindings?: string;
  preventativeMeasures?: string;
  policyChangesRecommended?: string;
  followUpRequired?: boolean;
  followUpCompletedAt?: string;
  followUpNotes?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  closedAt?: string;
}

/**
 * Search filters for incidents
 */
export interface IncidentSearchFilters {
  clientId?: string;
  incidentType?: IncidentType;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  startDate?: string;
  endDate?: string;
  reportedBy?: string;
  stateReportingRequired?: boolean;
  investigationRequired?: boolean;
}

/**
 * Incident summary statistics
 */
export interface IncidentStatistics {
  totalIncidents: number;
  byType: Record<IncidentType, number>;
  bySeverity: Record<IncidentSeverity, number>;
  byStatus: Record<IncidentStatus, number>;
  requireStateReporting: number;
  requireInvestigation: number;
  averageResolutionTime?: number; // In hours
}
