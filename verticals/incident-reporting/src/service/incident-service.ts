/**
 * Incident Service - Business logic for incident management
 */

import type { Database, UserContext } from '@care-commons/core';
import { IncidentRepository } from '../repository/incident-repository.js';
import type {
  Incident,
  CreateIncidentInput,
  UpdateIncidentInput,
  IncidentSearchFilters,
} from '../types/incident.js';

export class IncidentService {
  private repository: IncidentRepository;

  constructor(database: Database) {
    this.repository = new IncidentRepository(database);
  }

  async createIncident(input: CreateIncidentInput, context: UserContext): Promise<Incident> {
    const incident: Partial<Incident> = {
      organizationId: context.organizationId!,
      clientId: input.clientId,
      reportedBy: context.userId,
      incidentType: input.incidentType,
      severity: input.severity,
      occurredAt: new Date(input.occurredAt),
      discoveredAt: input.discoveredAt ? new Date(input.discoveredAt) : new Date(input.occurredAt),
      location: input.location,
      description: input.description,
      immediateAction: input.immediateAction,
      witnessIds: input.witnessIds,
      involvedStaffIds: input.involvedStaffIds,
      injurySeverity: input.injurySeverity,
      injuryDescription: input.injuryDescription,
      medicalAttentionRequired: input.medicalAttentionRequired,
      medicalAttentionProvided: input.medicalAttentionProvided,
      emergencyServicesContacted: input.emergencyServicesContacted,
      emergencyServicesDetails: input.emergencyServicesDetails,
      familyNotified: input.familyNotified,
      familyNotifiedAt: input.familyNotifiedAt ? new Date(input.familyNotifiedAt) : undefined,
      familyNotificationNotes: input.familyNotificationNotes,
      physicianNotified: input.physicianNotified,
      physicianNotifiedAt: input.physicianNotifiedAt ? new Date(input.physicianNotifiedAt) : undefined,
      physicianOrders: input.physicianOrders,
      status: 'REPORTED',
    };

    return this.repository.create(incident, context);
  }

  async updateIncident(
    incidentId: string,
    input: UpdateIncidentInput,
    context: UserContext
  ): Promise<Incident> {
    // Build updates object, converting date strings to Date objects
    const updates: Partial<Incident> = {
      status: input.status,
      severity: input.severity,
      description: input.description,
      immediateAction: input.immediateAction,
      injurySeverity: input.injurySeverity,
      injuryDescription: input.injuryDescription,
      medicalAttentionRequired: input.medicalAttentionRequired,
      medicalAttentionProvided: input.medicalAttentionProvided,
      emergencyServicesContacted: input.emergencyServicesContacted,
      emergencyServicesDetails: input.emergencyServicesDetails,
      familyNotified: input.familyNotified,
      familyNotifiedAt: input.familyNotifiedAt ? new Date(input.familyNotifiedAt) : undefined,
      familyNotificationNotes: input.familyNotificationNotes,
      physicianNotified: input.physicianNotified,
      physicianNotifiedAt: input.physicianNotifiedAt ? new Date(input.physicianNotifiedAt) : undefined,
      physicianOrders: input.physicianOrders,
      stateReportingRequired: input.stateReportingRequired,
      stateReportedAt: input.stateReportedAt ? new Date(input.stateReportedAt) : undefined,
      stateReportNumber: input.stateReportNumber,
      stateAgency: input.stateAgency,
      investigationRequired: input.investigationRequired,
      investigationStartedAt: input.investigationStartedAt ? new Date(input.investigationStartedAt) : undefined,
      investigationCompletedAt: input.investigationCompletedAt ? new Date(input.investigationCompletedAt) : undefined,
      investigationFindings: input.investigationFindings,
      preventativeMeasures: input.preventativeMeasures,
      policyChangesRecommended: input.policyChangesRecommended,
      followUpRequired: input.followUpRequired,
      followUpCompletedAt: input.followUpCompletedAt ? new Date(input.followUpCompletedAt) : undefined,
      followUpNotes: input.followUpNotes,
      resolutionNotes: input.resolutionNotes,
      resolvedAt: input.resolvedAt ? new Date(input.resolvedAt) : undefined,
      resolvedBy: input.resolvedAt ? context.userId : undefined,
      closedAt: input.closedAt ? new Date(input.closedAt) : undefined,
      closedBy: input.closedAt ? context.userId : undefined,
    };

    // Remove undefined values
    Object.keys(updates).forEach((key) => {
      if (updates[key as keyof Partial<Incident>] === undefined) {
        delete updates[key as keyof Partial<Incident>];
      }
    });

    return this.repository.update(incidentId, updates, context);
  }

  async getIncident(incidentId: string): Promise<Incident | null> {
    return this.repository.findById(incidentId);
  }

  async searchIncidents(filters: IncidentSearchFilters, context: UserContext): Promise<Incident[]> {
    return this.repository.search(filters, context);
  }
}
