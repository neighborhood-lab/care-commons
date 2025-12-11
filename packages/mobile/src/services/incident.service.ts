/**
 * Incident Reporting Service
 *
 * Manages incident reports with full workflow support.
 * Features:
 * - Create and submit incident reports
 * - Track follow-up requirements
 * - Document resolutions
 * - Coordinator notifications (mock for now)
 * - Offline-first with AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const INCIDENTS_KEY = '@folkcare_incidents';
const INCIDENT_DRAFTS_KEY = '@folkcare_incident_drafts';

export type IncidentType =
  | 'fall'
  | 'injury'
  | 'medication_error'
  | 'behavioral'
  | 'equipment_failure'
  | 'property_damage'
  | 'missing_items'
  | 'abuse_neglect'
  | 'emergency_911'
  | 'other';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type InjurySeverity = 'none' | 'minor' | 'moderate' | 'severe' | 'life_threatening';
export type IncidentStatus = 'submitted' | 'under_review' | 'follow_up_required' | 'resolved' | 'closed';

export interface IncidentLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface IncidentReport {
  id: string;
  visitId: string;
  clientId: string;
  clientName: string;
  caregiverId: string;
  caregiverName: string;
  organizationId: string;

  // Incident details
  incidentType: IncidentType;
  description: string;
  occurredAt: string;
  reportedAt: string;
  location: IncidentLocation;

  // Injury info
  injurySeverity: InjurySeverity;
  injuryLocation?: string;
  injuryDescription?: string;

  // Actions and witnesses
  actionsTaken: string[];
  witnessName?: string;
  witnessPhone?: string;
  witnessStatement?: string;

  // Documentation
  photoUris: string[];
  voiceNoteUri?: string;

  // Notifications
  familyNotified: boolean;
  familyNotifiedAt?: string;
  emergencyServicesContacted: boolean;
  coordinatorNotified: boolean;
  coordinatorNotifiedAt?: string;

  // Workflow status
  status: IncidentStatus;
  severity: IncidentSeverity;
  followUpRequired: boolean;
  followUpDueDate?: string;
  followUpNotes?: string;

  // Resolution
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  preventiveMeasures?: string;

  // Sync status
  isSynced: boolean;
  syncPending: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentDraft {
  id: string;
  visitId: string;
  clientId: string;
  clientName: string;
  data: Partial<IncidentReport>;
  lastSavedAt: string;
}

/**
 * Calculate incident severity based on type and injury
 */
function calculateSeverity(type: IncidentType, injurySeverity: InjurySeverity): IncidentSeverity {
  // Critical severity for specific types
  if (type === 'abuse_neglect' || type === 'emergency_911') {
    return 'critical';
  }

  // Severity based on injury
  if (injurySeverity === 'life_threatening') {
    return 'critical';
  }
  if (injurySeverity === 'severe') {
    return 'high';
  }
  if (injurySeverity === 'moderate') {
    return 'medium';
  }

  // Default severity by type
  const typeSeverity: Record<IncidentType, IncidentSeverity> = {
    fall: 'medium',
    injury: 'medium',
    medication_error: 'high',
    behavioral: 'medium',
    equipment_failure: 'low',
    property_damage: 'low',
    missing_items: 'low',
    abuse_neglect: 'critical',
    emergency_911: 'critical',
    other: 'low',
  };

  return typeSeverity[type];
}

export class IncidentService {
  private currentUserId = 'caregiver_1'; // Mock current user
  private currentUserName = 'Maria Garcia';
  private organizationId = 'org_1';

  /**
   * Get all incident reports
   */
  async getAllIncidents(): Promise<IncidentReport[]> {
    const stored = await AsyncStorage.getItem(INCIDENTS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  }

  /**
   * Get incidents by status
   */
  async getIncidentsByStatus(status: IncidentStatus): Promise<IncidentReport[]> {
    const all = await this.getAllIncidents();
    return all.filter((i) => i.status === status);
  }

  /**
   * Get incidents requiring follow-up
   */
  async getFollowUpRequired(): Promise<IncidentReport[]> {
    const all = await this.getAllIncidents();
    return all.filter((i) => i.followUpRequired && i.status !== 'resolved' && i.status !== 'closed');
  }

  /**
   * Get incidents for a specific visit
   */
  async getIncidentsForVisit(visitId: string): Promise<IncidentReport[]> {
    const all = await this.getAllIncidents();
    return all.filter((i) => i.visitId === visitId);
  }

  /**
   * Get incidents for a specific client
   */
  async getIncidentsForClient(clientId: string): Promise<IncidentReport[]> {
    const all = await this.getAllIncidents();
    return all.filter((i) => i.clientId === clientId);
  }

  /**
   * Submit a new incident report
   */
  async submitIncident(data: {
    visitId: string;
    clientId: string;
    clientName: string;
    incidentType: IncidentType;
    description: string;
    occurredAt: string;
    location: IncidentLocation;
    injurySeverity: InjurySeverity;
    injuryLocation?: string;
    injuryDescription?: string;
    actionsTaken: string[];
    witnessName?: string;
    witnessPhone?: string;
    witnessStatement?: string;
    photoUris: string[];
    voiceNoteUri?: string;
    familyNotified: boolean;
    emergencyServicesContacted: boolean;
    followUpRequired: boolean;
    followUpNotes?: string;
  }): Promise<IncidentReport> {
    const now = new Date().toISOString();
    const severity = calculateSeverity(data.incidentType, data.injurySeverity);

    // Determine follow-up due date based on severity
    let followUpDueDate: string | undefined;
    if (data.followUpRequired) {
      const dueDate = new Date();
      switch (severity) {
        case 'critical':
          dueDate.setHours(dueDate.getHours() + 4); // 4 hours for critical
          break;
        case 'high':
          dueDate.setHours(dueDate.getHours() + 24); // 24 hours for high
          break;
        case 'medium':
          dueDate.setDate(dueDate.getDate() + 2); // 2 days for medium
          break;
        default:
          dueDate.setDate(dueDate.getDate() + 7); // 7 days for low
      }
      followUpDueDate = dueDate.toISOString();
    }

    const incident: IncidentReport = {
      id: `incident_${Date.now()}`,
      visitId: data.visitId,
      clientId: data.clientId,
      clientName: data.clientName,
      caregiverId: this.currentUserId,
      caregiverName: this.currentUserName,
      organizationId: this.organizationId,

      incidentType: data.incidentType,
      description: data.description,
      occurredAt: data.occurredAt,
      reportedAt: now,
      location: data.location,

      injurySeverity: data.injurySeverity,
      injuryLocation: data.injuryLocation,
      injuryDescription: data.injuryDescription,

      actionsTaken: data.actionsTaken,
      witnessName: data.witnessName,
      witnessPhone: data.witnessPhone,
      witnessStatement: data.witnessStatement,

      photoUris: data.photoUris,
      voiceNoteUri: data.voiceNoteUri,

      familyNotified: data.familyNotified,
      familyNotifiedAt: data.familyNotified ? now : undefined,
      emergencyServicesContacted: data.emergencyServicesContacted,
      coordinatorNotified: true, // Auto-notify coordinator
      coordinatorNotifiedAt: now,

      status: data.followUpRequired ? 'follow_up_required' : 'submitted',
      severity,
      followUpRequired: data.followUpRequired,
      followUpDueDate,
      followUpNotes: data.followUpNotes,

      isSynced: false,
      syncPending: true,
      createdAt: now,
      updatedAt: now,
    };

    const incidents = await this.getAllIncidents();
    incidents.unshift(incident);
    await AsyncStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents));

    // Clear any draft for this visit
    await this.deleteDraft(data.visitId);

    return incident;
  }

  /**
   * Update incident status
   */
  async updateStatus(incidentId: string, status: IncidentStatus): Promise<boolean> {
    const incidents = await this.getAllIncidents();
    const index = incidents.findIndex((i) => i.id === incidentId);

    if (index === -1) return false;

    incidents[index].status = status;
    incidents[index].updatedAt = new Date().toISOString();
    incidents[index].syncPending = true;

    await AsyncStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents));
    return true;
  }

  /**
   * Document resolution for an incident
   */
  async documentResolution(
    incidentId: string,
    resolutionNotes: string,
    preventiveMeasures?: string
  ): Promise<boolean> {
    const incidents = await this.getAllIncidents();
    const index = incidents.findIndex((i) => i.id === incidentId);

    if (index === -1) return false;

    const now = new Date().toISOString();
    incidents[index].status = 'resolved';
    incidents[index].resolvedAt = now;
    incidents[index].resolvedBy = this.currentUserName;
    incidents[index].resolutionNotes = resolutionNotes;
    incidents[index].preventiveMeasures = preventiveMeasures;
    incidents[index].updatedAt = now;
    incidents[index].syncPending = true;

    await AsyncStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents));
    return true;
  }

  /**
   * Add follow-up notes to an incident
   */
  async addFollowUpNotes(incidentId: string, notes: string): Promise<boolean> {
    const incidents = await this.getAllIncidents();
    const index = incidents.findIndex((i) => i.id === incidentId);

    if (index === -1) return false;

    const existing = incidents[index].followUpNotes || '';
    incidents[index].followUpNotes = existing
      ? `${existing}\n\n[${new Date().toLocaleString()}] ${notes}`
      : `[${new Date().toLocaleString()}] ${notes}`;
    incidents[index].updatedAt = new Date().toISOString();
    incidents[index].syncPending = true;

    await AsyncStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents));
    return true;
  }

  /**
   * Save incident draft
   */
  async saveDraft(visitId: string, clientId: string, clientName: string, data: Partial<IncidentReport>): Promise<void> {
    const drafts = await this.getAllDrafts();
    const existingIndex = drafts.findIndex((d) => d.visitId === visitId);

    const draft: IncidentDraft = {
      id: `draft_${visitId}`,
      visitId,
      clientId,
      clientName,
      data,
      lastSavedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      drafts[existingIndex] = draft;
    } else {
      drafts.push(draft);
    }

    await AsyncStorage.setItem(INCIDENT_DRAFTS_KEY, JSON.stringify(drafts));
  }

  /**
   * Get all drafts
   */
  async getAllDrafts(): Promise<IncidentDraft[]> {
    const stored = await AsyncStorage.getItem(INCIDENT_DRAFTS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  }

  /**
   * Get draft for a visit
   */
  async getDraft(visitId: string): Promise<IncidentDraft | null> {
    const drafts = await this.getAllDrafts();
    return drafts.find((d) => d.visitId === visitId) || null;
  }

  /**
   * Delete a draft
   */
  async deleteDraft(visitId: string): Promise<void> {
    const drafts = await this.getAllDrafts();
    const filtered = drafts.filter((d) => d.visitId !== visitId);
    await AsyncStorage.setItem(INCIDENT_DRAFTS_KEY, JSON.stringify(filtered));
  }

  /**
   * Get incident type info
   */
  getIncidentTypeInfo(type: IncidentType): { label: string; icon: string; color: string } {
    const info: Record<IncidentType, { label: string; icon: string; color: string }> = {
      fall: { label: 'Fall', icon: '🤕', color: '#F59E0B' },
      injury: { label: 'Injury', icon: '🩹', color: '#EF4444' },
      medication_error: { label: 'Medication Error', icon: '💊', color: '#DC2626' },
      behavioral: { label: 'Behavioral Issue', icon: '😤', color: '#8B5CF6' },
      equipment_failure: { label: 'Equipment Failure', icon: '🔧', color: '#6B7280' },
      property_damage: { label: 'Property Damage', icon: '🔨', color: '#78716C' },
      missing_items: { label: 'Missing Items', icon: '🔍', color: '#64748B' },
      abuse_neglect: { label: 'Abuse/Neglect', icon: '⚠️', color: '#991B1B' },
      emergency_911: { label: 'Emergency (911)', icon: '🚑', color: '#B91C1C' },
      other: { label: 'Other', icon: '📋', color: '#6B7280' },
    };
    return info[type];
  }

  /**
   * Get severity info
   */
  getSeverityInfo(severity: IncidentSeverity): { label: string; color: string } {
    const info: Record<IncidentSeverity, { label: string; color: string }> = {
      low: { label: 'Low', color: '#10B981' },
      medium: { label: 'Medium', color: '#F59E0B' },
      high: { label: 'High', color: '#EF4444' },
      critical: { label: 'Critical', color: '#991B1B' },
    };
    return info[severity];
  }

  /**
   * Get status info
   */
  getStatusInfo(status: IncidentStatus): { label: string; color: string } {
    const info: Record<IncidentStatus, { label: string; color: string }> = {
      submitted: { label: 'Submitted', color: '#3B82F6' },
      under_review: { label: 'Under Review', color: '#8B5CF6' },
      follow_up_required: { label: 'Follow-up Required', color: '#F59E0B' },
      resolved: { label: 'Resolved', color: '#10B981' },
      closed: { label: 'Closed', color: '#6B7280' },
    };
    return info[status];
  }

  /**
   * Check if incident requires mandatory reporting
   */
  requiresMandatoryReporting(type: IncidentType): boolean {
    return type === 'abuse_neglect';
  }

  /**
   * Get all incident types
   */
  getAllIncidentTypes(): IncidentType[] {
    return [
      'fall',
      'injury',
      'medication_error',
      'behavioral',
      'equipment_failure',
      'property_damage',
      'missing_items',
      'abuse_neglect',
      'emergency_911',
      'other',
    ];
  }

  /**
   * Clear all data (for testing)
   */
  async clearAllData(): Promise<void> {
    await AsyncStorage.removeItem(INCIDENTS_KEY);
    await AsyncStorage.removeItem(INCIDENT_DRAFTS_KEY);
  }
}

export const incidentService = new IncidentService();
