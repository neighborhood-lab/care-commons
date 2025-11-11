/**
 * Incident Repository - Data access layer
 */

import { Repository, Database, UserContext } from '@care-commons/core';
import type {
  Incident,
  IncidentSearchFilters,
} from '../types/incident.js';

export class IncidentRepository extends Repository<Incident> {
  constructor(database: Database) {
    super({
      tableName: 'incidents',
      database,
      enableAudit: true,
      enableSoftDelete: false,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): Incident {
    return {
      id: row['id'] as string,
      organizationId: row['organization_id'] as string,
      clientId: row['client_id'] as string,
      reportedBy: row['reported_by'] as string,
      incidentType: row['incident_type'] as Incident['incidentType'],
      severity: row['severity'] as Incident['severity'],
      status: row['status'] as Incident['status'],
      occurredAt: row['occurred_at'] as Date,
      discoveredAt: row['discovered_at'] as Date,
      location: row['location'] as string,
      description: row['description'] as string,
      immediateAction: row['immediate_action'] as string,
      witnessIds: row['witness_ids'] as string[] | undefined,
      involvedStaffIds: row['involved_staff_ids'] as string[] | undefined,
      injurySeverity: row['injury_severity'] as Incident['injurySeverity'] | undefined,
      injuryDescription: row['injury_description'] as string | undefined,
      medicalAttentionRequired: row['medical_attention_required'] as boolean | undefined,
      medicalAttentionProvided: row['medical_attention_provided'] as string | undefined,
      emergencyServicesContacted: row['emergency_services_contacted'] as boolean | undefined,
      emergencyServicesDetails: row['emergency_services_details'] as string | undefined,
      familyNotified: row['family_notified'] as boolean | undefined,
      familyNotifiedAt: row['family_notified_at'] as Date | undefined,
      familyNotifiedBy: row['family_notified_by'] as string | undefined,
      familyNotificationNotes: row['family_notification_notes'] as string | undefined,
      physicianNotified: row['physician_notified'] as boolean | undefined,
      physicianNotifiedAt: row['physician_notified_at'] as Date | undefined,
      physicianNotifiedBy: row['physician_notified_by'] as string | undefined,
      physicianOrders: row['physician_orders'] as string | undefined,
      stateReportingRequired: row['state_reporting_required'] as boolean | undefined,
      stateReportedAt: row['state_reported_at'] as Date | undefined,
      stateReportedBy: row['state_reported_by'] as string | undefined,
      stateReportNumber: row['state_report_number'] as string | undefined,
      stateAgency: row['state_agency'] as string | undefined,
      investigationRequired: row['investigation_required'] as boolean | undefined,
      investigationStartedAt: row['investigation_started_at'] as Date | undefined,
      investigationCompletedAt: row['investigation_completed_at'] as Date | undefined,
      investigationFindings: row['investigation_findings'] as string | undefined,
      preventativeMeasures: row['preventative_measures'] as string | undefined,
      policyChangesRecommended: row['policy_changes_recommended'] as string | undefined,
      followUpRequired: row['follow_up_required'] as boolean | undefined,
      followUpCompletedAt: row['follow_up_completed_at'] as Date | undefined,
      followUpNotes: row['follow_up_notes'] as string | undefined,
      attachmentUrls: row['attachment_urls'] as string[] | undefined,
      resolutionNotes: row['resolution_notes'] as string | undefined,
      resolvedAt: row['resolved_at'] as Date | undefined,
      resolvedBy: row['resolved_by'] as string | undefined,
      closedAt: row['closed_at'] as Date | undefined,
      closedBy: row['closed_by'] as string | undefined,
      createdAt: row['created_at'] as Date,
      updatedAt: row['updated_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedBy: row['updated_by'] as string,
      version: row['version'] as number,
    };
  }

  protected mapEntityToRow(entity: Partial<Incident>): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    if (entity.organizationId) row['organization_id'] = entity.organizationId;
    if (entity.clientId) row['client_id'] = entity.clientId;
    if (entity.reportedBy) row['reported_by'] = entity.reportedBy;
    if (entity.incidentType) row['incident_type'] = entity.incidentType;
    if (entity.severity) row['severity'] = entity.severity;
    if (entity.status) row['status'] = entity.status;
    if (entity.occurredAt) row['occurred_at'] = entity.occurredAt;
    if (entity.discoveredAt) row['discovered_at'] = entity.discoveredAt;
    if (entity.location) row['location'] = entity.location;
    if (entity.description) row['description'] = entity.description;
    if (entity.immediateAction) row['immediate_action'] = entity.immediateAction;
    if (entity.witnessIds) row['witness_ids'] = entity.witnessIds;
    if (entity.involvedStaffIds) row['involved_staff_ids'] = entity.involvedStaffIds;
    if (entity.injurySeverity !== undefined) row['injury_severity'] = entity.injurySeverity;
    if (entity.injuryDescription !== undefined) row['injury_description'] = entity.injuryDescription;
    if (entity.medicalAttentionRequired !== undefined) row['medical_attention_required'] = entity.medicalAttentionRequired;
    if (entity.medicalAttentionProvided !== undefined) row['medical_attention_provided'] = entity.medicalAttentionProvided;
    if (entity.emergencyServicesContacted !== undefined) row['emergency_services_contacted'] = entity.emergencyServicesContacted;
    if (entity.emergencyServicesDetails !== undefined) row['emergency_services_details'] = entity.emergencyServicesDetails;
    if (entity.familyNotified !== undefined) row['family_notified'] = entity.familyNotified;
    if (entity.familyNotifiedAt !== undefined) row['family_notified_at'] = entity.familyNotifiedAt;
    if (entity.familyNotifiedBy !== undefined) row['family_notified_by'] = entity.familyNotifiedBy;
    if (entity.familyNotificationNotes !== undefined) row['family_notification_notes'] = entity.familyNotificationNotes;
    if (entity.physicianNotified !== undefined) row['physician_notified'] = entity.physicianNotified;
    if (entity.physicianNotifiedAt !== undefined) row['physician_notified_at'] = entity.physicianNotifiedAt;
    if (entity.physicianNotifiedBy !== undefined) row['physician_notified_by'] = entity.physicianNotifiedBy;
    if (entity.physicianOrders !== undefined) row['physician_orders'] = entity.physicianOrders;
    if (entity.stateReportingRequired !== undefined) row['state_reporting_required'] = entity.stateReportingRequired;
    if (entity.stateReportedAt !== undefined) row['state_reported_at'] = entity.stateReportedAt;
    if (entity.stateReportedBy !== undefined) row['state_reported_by'] = entity.stateReportedBy;
    if (entity.stateReportNumber !== undefined) row['state_report_number'] = entity.stateReportNumber;
    if (entity.stateAgency !== undefined) row['state_agency'] = entity.stateAgency;
    if (entity.investigationRequired !== undefined) row['investigation_required'] = entity.investigationRequired;
    if (entity.investigationStartedAt !== undefined) row['investigation_started_at'] = entity.investigationStartedAt;
    if (entity.investigationCompletedAt !== undefined) row['investigation_completed_at'] = entity.investigationCompletedAt;
    if (entity.investigationFindings !== undefined) row['investigation_findings'] = entity.investigationFindings;
    if (entity.preventativeMeasures !== undefined) row['preventative_measures'] = entity.preventativeMeasures;
    if (entity.policyChangesRecommended !== undefined) row['policy_changes_recommended'] = entity.policyChangesRecommended;
    if (entity.followUpRequired !== undefined) row['follow_up_required'] = entity.followUpRequired;
    if (entity.followUpCompletedAt !== undefined) row['follow_up_completed_at'] = entity.followUpCompletedAt;
    if (entity.followUpNotes !== undefined) row['follow_up_notes'] = entity.followUpNotes;
    if (entity.attachmentUrls) row['attachment_urls'] = entity.attachmentUrls;
    if (entity.resolutionNotes !== undefined) row['resolution_notes'] = entity.resolutionNotes;
    if (entity.resolvedAt !== undefined) row['resolved_at'] = entity.resolvedAt;
    if (entity.resolvedBy !== undefined) row['resolved_by'] = entity.resolvedBy;
    if (entity.closedAt !== undefined) row['closed_at'] = entity.closedAt;
    if (entity.closedBy !== undefined) row['closed_by'] = entity.closedBy;
    return row;
  }

  async search(filters: IncidentSearchFilters, context: UserContext): Promise<Incident[]> {
    let query = `SELECT * FROM ${this.tableName} WHERE organization_id = $1`;
    const params: unknown[] = [context.organizationId];
    let paramIndex = 2;

    if (filters.clientId) {
      query += ` AND client_id = $${paramIndex++}`;
      params.push(filters.clientId);
    }
    if (filters.incidentType) {
      query += ` AND incident_type = $${paramIndex++}`;
      params.push(filters.incidentType);
    }
    if (filters.severity) {
      query += ` AND severity = $${paramIndex++}`;
      params.push(filters.severity);
    }
    if (filters.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }
    if (filters.startDate) {
      query += ` AND occurred_at >= $${paramIndex++}`;
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ` AND occurred_at <= $${paramIndex++}`;
      params.push(filters.endDate);
    }
    if (filters.reportedBy) {
      query += ` AND reported_by = $${paramIndex++}`;
      params.push(filters.reportedBy);
    }
    if (filters.stateReportingRequired !== undefined) {
      query += ` AND state_reporting_required = $${paramIndex++}`;
      params.push(filters.stateReportingRequired);
    }
    if (filters.investigationRequired !== undefined) {
      query += ` AND investigation_required = $${paramIndex++}`;
      params.push(filters.investigationRequired);
    }

    query += ' ORDER BY occurred_at DESC';

    const result = await this.database.query(query, params);
    return result.rows.map((row: Record<string, unknown>) => this.mapRowToEntity(row));
  }
}
