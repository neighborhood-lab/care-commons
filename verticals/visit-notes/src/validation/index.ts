/**
 * Visit Notes Validation Schemas
 *
 * Zod schemas for runtime validation of visit notes and templates.
 */

import { z } from 'zod';

/**
 * Enums
 */

export const visitNoteTypeSchema = z.enum([
  'GENERAL',
  'CLINICAL',
  'INCIDENT',
  'TASK',
]);

export const clientMoodSchema = z.enum([
  'EXCELLENT',
  'GOOD',
  'FAIR',
  'POOR',
  'DISTRESSED',
  'UNRESPONSIVE',
]);

export const incidentSeveritySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);

export const signerRelationshipSchema = z.enum([
  'SELF',
  'SPOUSE',
  'CHILD',
  'PARENT',
  'SIBLING',
  'LEGAL_GUARDIAN',
  'POWER_OF_ATTORNEY',
  'OTHER',
]);

export const templateCategorySchema = z.enum([
  'GENERAL',
  'INCIDENT',
  'MEDICATION',
  'BEHAVIORAL',
  'SAFETY',
  'REFUSAL',
  'EMERGENCY',
  'ASSESSMENT',
  'ADL',
  'COMMUNICATION',
  'OTHER',
]);

/**
 * Template Prompts
 */

export const templatePromptSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(200),
  type: z.enum(['text', 'textarea', 'select', 'checkbox', 'radio']),
  placeholder: z.string().max(500).optional(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  defaultValue: z.union([z.string(), z.boolean()]).optional(),
});

/**
 * Signature Data
 */

export const signatureDataSchema = z.object({
  signatureData: z.string().min(1), // Base64 encoded
  signatureUrl: z.string().url().max(500).optional(),
  signedAt: z.coerce.date(),
  signerName: z.string().max(200).optional(),
  signerRelationship: signerRelationshipSchema.optional(),
  device: z.string().max(200).optional(),
  ipAddress: z.string().max(45).optional(), // IPv4 or IPv6
});

/**
 * Create Visit Note
 */

export const createVisitNoteSchema = z.object({
  visitId: z.string().uuid(),
  evvRecordId: z.string().uuid().optional(),
  organizationId: z.string().uuid(),
  caregiverId: z.string().uuid(),
  noteType: visitNoteTypeSchema.optional().default('GENERAL'),
  noteText: z.string().min(1).max(50000),
  noteHtml: z.string().max(100000).optional(),
  templateId: z.string().uuid().optional(),
  activitiesPerformed: z.array(z.string().max(200)).optional(),
  clientMood: clientMoodSchema.optional(),
  clientConditionNotes: z.string().max(5000).optional(),
  isIncident: z.boolean().optional().default(false),
  incidentSeverity: incidentSeveritySchema.optional(),
  incidentDescription: z.string().max(10000).optional(),
  isVoiceNote: z.boolean().optional().default(false),
  audioFileUri: z.string().url().max(500).optional(),
  transcriptionConfidence: z.number().min(0).max(1).optional(),
  requiresSignature: z.boolean().optional().default(false),
}).refine(
  (data) => {
    // If incident, require incident severity and description
    if (data.isIncident) {
      return data.incidentSeverity !== undefined && data.incidentDescription !== undefined;
    }
    return true;
  },
  {
    message: 'Incident notes require severity and description',
    path: ['isIncident'],
  }
).refine(
  (data) => {
    // If voice note, require audio URI
    if (data.isVoiceNote) {
      return data.audioFileUri !== undefined;
    }
    return true;
  },
  {
    message: 'Voice notes require audio file URI',
    path: ['isVoiceNote'],
  }
);

export type CreateVisitNoteInput = z.infer<typeof createVisitNoteSchema>;

/**
 * Update Visit Note
 */

export const updateVisitNoteSchema = z.object({
  noteText: z.string().min(1).max(50000).optional(),
  noteHtml: z.string().max(100000).optional(),
  activitiesPerformed: z.array(z.string().max(200)).optional(),
  clientMood: clientMoodSchema.optional(),
  clientConditionNotes: z.string().max(5000).optional(),
  incidentSeverity: incidentSeveritySchema.optional(),
  incidentDescription: z.string().max(10000).optional(),
});

export type UpdateVisitNoteInput = z.infer<typeof updateVisitNoteSchema>;

/**
 * Add Signature
 */

export const addSignatureSchema = z.object({
  noteId: z.string().uuid(),
  signatureType: z.enum(['caregiver', 'client', 'supervisor']),
  signatureData: z.string().min(1), // Base64 encoded image
  signatureUrl: z.string().url().max(500).optional(),
  signerName: z.string().max(200).optional(),
  signerRelationship: signerRelationshipSchema.optional(),
  supervisorComments: z.string().max(5000).optional(),
  device: z.string().max(200).optional(),
  ipAddress: z.string().max(45).optional(),
}).refine(
  (data) => {
    // Client signatures require signer name and relationship
    if (data.signatureType === 'client') {
      return data.signerName !== undefined && data.signerRelationship !== undefined;
    }
    return true;
  },
  {
    message: 'Client signatures require signer name and relationship',
    path: ['signatureType'],
  }
);

export type AddSignatureInput = z.infer<typeof addSignatureSchema>;

/**
 * Create Note Template
 */

export const createNoteTemplateSchema = z.object({
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: templateCategorySchema,
  templateText: z.string().min(1).max(50000),
  templateHtml: z.string().max(100000).optional(),
  prompts: z.array(templatePromptSchema).optional(),
  defaultActivities: z.array(z.string().max(200)).optional(),
  requiresSignature: z.boolean().optional().default(false),
  requiresIncidentFlag: z.boolean().optional().default(false),
  requiresSupervisorReview: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export type CreateNoteTemplateInput = z.infer<typeof createNoteTemplateSchema>;

/**
 * Update Note Template
 */

export const updateNoteTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  category: templateCategorySchema.optional(),
  templateText: z.string().min(1).max(50000).optional(),
  templateHtml: z.string().max(100000).optional(),
  prompts: z.array(templatePromptSchema).optional(),
  defaultActivities: z.array(z.string().max(200)).optional(),
  requiresSignature: z.boolean().optional(),
  requiresIncidentFlag: z.boolean().optional(),
  requiresSupervisorReview: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type UpdateNoteTemplateInput = z.infer<typeof updateNoteTemplateSchema>;

/**
 * Search Filters
 */

export const visitNoteSearchFiltersSchema = z.object({
  visitId: z.string().uuid().optional(),
  visitIds: z.array(z.string().uuid()).optional(),
  caregiverId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  noteType: z.array(visitNoteTypeSchema).optional(),
  isIncident: z.boolean().optional(),
  incidentSeverity: z.array(incidentSeveritySchema).optional(),
  isLocked: z.boolean().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  requiresSignature: z.boolean().optional(),
  caregiverSigned: z.boolean().optional(),
  clientSigned: z.boolean().optional(),
  syncPending: z.boolean().optional(),
});

export type VisitNoteSearchFilters = z.infer<typeof visitNoteSearchFiltersSchema>;

export const templateSearchFiltersSchema = z.object({
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  category: z.array(templateCategorySchema).optional(),
  isActive: z.boolean().optional(),
  isSystemTemplate: z.boolean().optional(),
});

export type TemplateSearchFilters = z.infer<typeof templateSearchFiltersSchema>;
