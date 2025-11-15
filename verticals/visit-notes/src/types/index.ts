/**
 * Visit Notes Domain Types
 *
 * Types for visit documentation, templates, and signatures.
 * Supports rich text editing, voice-to-text, and immutability.
 */

import type { Entity, SoftDeletable, UUID, Timestamp } from '@care-commons/core';

/**
 * Visit Note - Caregiver documentation of visit activities
 *
 * Immutable after 24 hours for compliance. Supports rich text,
 * voice-to-text, templates, and digital signatures.
 */
export interface VisitNote extends Entity, SoftDeletable {
  // Foreign keys
  visitId: UUID;
  evvRecordId?: UUID;
  organizationId: UUID;
  caregiverId: UUID;

  // Note details
  noteType: VisitNoteType;
  noteText: string; // Plain text version
  noteHtml?: string; // Rich text HTML version
  templateId?: UUID; // Template used (if any)

  // Activities performed
  activitiesPerformed?: string[]; // Array of activity names/IDs

  // Client assessment
  clientMood?: ClientMood;
  clientConditionNotes?: string;

  // Incident tracking
  isIncident: boolean;
  incidentSeverity?: IncidentSeverity;
  incidentDescription?: string;
  incidentReportedAt?: Timestamp;

  // Voice-to-text
  isVoiceNote: boolean;
  audioFileUri?: string; // S3/storage URL
  transcriptionConfidence?: number; // 0.0 to 1.0

  // Compliance and audit (immutability)
  isLocked: boolean;
  lockedAt?: Timestamp;
  lockedBy?: UUID;
  lockReason?: string;

  // Signature data
  requiresSignature: boolean;

  // Caregiver signature
  caregiverSigned: boolean;
  caregiverSignatureData?: string; // Base64 signature image
  caregiverSignatureUrl?: string; // Permanent URL
  caregiverSignedAt?: Timestamp;
  caregiverSignatureDevice?: string;
  caregiverSignatureIp?: string;

  // Client/family signature
  clientSigned: boolean;
  clientSignatureData?: string;
  clientSignatureUrl?: string;
  clientSignedAt?: Timestamp;
  clientSignerName?: string;
  clientSignerRelationship?: SignerRelationship;
  clientSignatureDevice?: string;
  clientSignatureIp?: string;

  // Supervisor signature
  supervisorSigned: boolean;
  supervisorSignedBy?: UUID;
  supervisorSignatureData?: string;
  supervisorSignatureUrl?: string;
  supervisorSignedAt?: Timestamp;
  supervisorComments?: string;

  // Sync tracking (for mobile offline)
  isSynced: boolean;
  syncPending: boolean;
  syncedAt?: Timestamp;
}

export type VisitNoteType =
  | 'GENERAL'
  | 'CLINICAL'
  | 'INCIDENT'
  | 'TASK';

export type ClientMood =
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'POOR'
  | 'DISTRESSED'
  | 'UNRESPONSIVE';

export type IncidentSeverity =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export type SignerRelationship =
  | 'SELF'
  | 'SPOUSE'
  | 'CHILD'
  | 'PARENT'
  | 'SIBLING'
  | 'LEGAL_GUARDIAN'
  | 'POWER_OF_ATTORNEY'
  | 'OTHER';

/**
 * Visit Note Template - Reusable templates for common scenarios
 */
export interface VisitNoteTemplate extends Entity, SoftDeletable {
  // Organization scope
  organizationId: UUID;
  branchId?: UUID; // Null = org-wide template

  // Template identity
  name: string;
  description?: string;
  category: TemplateCategory;

  // Content (with placeholders)
  templateText: string;
  templateHtml?: string;

  // Structured prompts for guided input
  prompts?: TemplatePrompt[];

  // Pre-filled activities
  defaultActivities?: string[];

  // Requirements
  requiresSignature: boolean;
  requiresIncidentFlag: boolean;
  requiresSupervisorReview: boolean;

  // Usage tracking
  usageCount: number;
  lastUsedAt?: Timestamp;

  // Status
  isActive: boolean;
  isSystemTemplate: boolean; // System vs custom
  sortOrder: number;

  // Version tracking
  version: number;
  previousVersionId?: UUID;
}

export type TemplateCategory =
  | 'GENERAL'
  | 'INCIDENT'
  | 'MEDICATION'
  | 'BEHAVIORAL'
  | 'SAFETY'
  | 'REFUSAL'
  | 'EMERGENCY'
  | 'ASSESSMENT'
  | 'ADL'
  | 'COMMUNICATION'
  | 'OTHER';

export interface TemplatePrompt {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio';
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select/radio
  defaultValue?: string | boolean;
}

/**
 * Signature Data - Digital signature capture
 */
export interface SignatureData {
  signatureData: string; // Base64 encoded image (SVG or PNG)
  signatureUrl?: string; // Permanent storage URL
  signedAt: Timestamp;
  signerName?: string;
  signerRelationship?: SignerRelationship;
  device?: string;
  ipAddress?: string;
}

/**
 * Input types for creating/updating
 */

export interface CreateVisitNoteInput {
  visitId: UUID;
  evvRecordId?: UUID;
  organizationId: UUID;
  caregiverId: UUID;
  noteType?: VisitNoteType;
  noteText: string;
  noteHtml?: string;
  templateId?: UUID;
  activitiesPerformed?: string[];
  clientMood?: ClientMood;
  clientConditionNotes?: string;
  isIncident?: boolean;
  incidentSeverity?: IncidentSeverity;
  incidentDescription?: string;
  isVoiceNote?: boolean;
  audioFileUri?: string;
  transcriptionConfidence?: number;
  requiresSignature?: boolean;
}

export interface UpdateVisitNoteInput {
  noteText?: string;
  noteHtml?: string;
  activitiesPerformed?: string[];
  clientMood?: ClientMood;
  clientConditionNotes?: string;
  incidentSeverity?: IncidentSeverity;
  incidentDescription?: string;
}

export interface AddSignatureInput {
  noteId: UUID;
  signatureType: 'caregiver' | 'client' | 'supervisor';
  signatureData: string; // Base64 encoded
  signatureUrl?: string;
  signerName?: string;
  signerRelationship?: SignerRelationship;
  supervisorComments?: string; // Only for supervisor signatures
  device?: string;
  ipAddress?: string;
}

export interface CreateNoteTemplateInput {
  organizationId: UUID;
  branchId?: UUID;
  name: string;
  description?: string;
  category: TemplateCategory;
  templateText: string;
  templateHtml?: string;
  prompts?: TemplatePrompt[];
  defaultActivities?: string[];
  requiresSignature?: boolean;
  requiresIncidentFlag?: boolean;
  requiresSupervisorReview?: boolean;
  sortOrder?: number;
}

export interface UpdateNoteTemplateInput {
  name?: string;
  description?: string;
  category?: TemplateCategory;
  templateText?: string;
  templateHtml?: string;
  prompts?: TemplatePrompt[];
  defaultActivities?: string[];
  requiresSignature?: boolean;
  requiresIncidentFlag?: boolean;
  requiresSupervisorReview?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

/**
 * Search and filter types
 */

export interface VisitNoteSearchFilters {
  visitId?: UUID;
  visitIds?: UUID[];
  caregiverId?: UUID;
  organizationId?: UUID;
  branchId?: UUID;
  noteType?: VisitNoteType[];
  isIncident?: boolean;
  incidentSeverity?: IncidentSeverity[];
  isLocked?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  requiresSignature?: boolean;
  caregiverSigned?: boolean;
  clientSigned?: boolean;
  syncPending?: boolean;
}

export interface TemplateSearchFilters {
  organizationId?: UUID;
  branchId?: UUID;
  category?: TemplateCategory[];
  isActive?: boolean;
  isSystemTemplate?: boolean;
}

/**
 * Response types with joined data
 */

export interface VisitNoteWithTemplate extends VisitNote {
  template?: VisitNoteTemplate;
}

export interface VisitNoteWithDetails extends VisitNote {
  template?: VisitNoteTemplate;
  caregiverName?: string;
  visitNumber?: string;
  clientName?: string;
}
