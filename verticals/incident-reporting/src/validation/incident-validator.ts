import { z } from 'zod';

export const incidentTypeSchema = z.enum([
  'FALL', 'MEDICATION_ERROR', 'INJURY', 'ABUSE_ALLEGATION', 'NEGLECT_ALLEGATION',
  'EXPLOITATION_ALLEGATION', 'EQUIPMENT_FAILURE', 'EMERGENCY_HOSPITALIZATION',
  'DEATH', 'ELOPEMENT', 'BEHAVIORAL_INCIDENT', 'INFECTION', 'PRESSURE_INJURY',
  'CLIENT_REFUSAL', 'OTHER'
]);

export const incidentSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const incidentStatusSchema = z.enum(['REPORTED', 'UNDER_REVIEW', 'INVESTIGATION_REQUIRED', 'RESOLVED', 'CLOSED']);
export const injurySeveritySchema = z.enum(['NONE', 'MINOR', 'MODERATE', 'SEVERE', 'FATAL']);

export const createIncidentSchema = z.object({
  clientId: z.string().uuid(),
  incidentType: incidentTypeSchema,
  severity: incidentSeveritySchema,
  occurredAt: z.string().datetime(),
  discoveredAt: z.string().datetime().optional(),
  location: z.string().min(1).max(200),
  description: z.string().min(10),
  immediateAction: z.string().min(1),
  witnessIds: z.array(z.string().uuid()).optional(),
  involvedStaffIds: z.array(z.string().uuid()).optional(),
  injurySeverity: injurySeveritySchema.optional(),
  injuryDescription: z.string().optional(),
  medicalAttentionRequired: z.boolean().optional(),
  medicalAttentionProvided: z.string().optional(),
  emergencyServicesContacted: z.boolean().optional(),
  emergencyServicesDetails: z.string().optional(),
  familyNotified: z.boolean().optional(),
  familyNotifiedAt: z.string().datetime().optional(),
  familyNotificationNotes: z.string().optional(),
  physicianNotified: z.boolean().optional(),
  physicianNotifiedAt: z.string().datetime().optional(),
  physicianOrders: z.string().optional(),
});

export const updateIncidentSchema = z.object({
  status: incidentStatusSchema.optional(),
  severity: incidentSeveritySchema.optional(),
  description: z.string().min(10).optional(),
  immediateAction: z.string().min(1).optional(),
  injurySeverity: injurySeveritySchema.optional(),
  injuryDescription: z.string().optional(),
  medicalAttentionRequired: z.boolean().optional(),
  medicalAttentionProvided: z.string().optional(),
  emergencyServicesContacted: z.boolean().optional(),
  emergencyServicesDetails: z.string().optional(),
  familyNotified: z.boolean().optional(),
  familyNotifiedAt: z.string().datetime().optional(),
  familyNotificationNotes: z.string().optional(),
  physicianNotified: z.boolean().optional(),
  physicianNotifiedAt: z.string().datetime().optional(),
  physicianOrders: z.string().optional(),
  stateReportingRequired: z.boolean().optional(),
  stateReportedAt: z.string().datetime().optional(),
  stateReportNumber: z.string().max(100).optional(),
  stateAgency: z.string().max(200).optional(),
  investigationRequired: z.boolean().optional(),
  investigationStartedAt: z.string().datetime().optional(),
  investigationCompletedAt: z.string().datetime().optional(),
  investigationFindings: z.string().optional(),
  preventativeMeasures: z.string().optional(),
  policyChangesRecommended: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  followUpCompletedAt: z.string().datetime().optional(),
  followUpNotes: z.string().optional(),
  resolutionNotes: z.string().optional(),
  resolvedAt: z.string().datetime().optional(),
  closedAt: z.string().datetime().optional(),
});
