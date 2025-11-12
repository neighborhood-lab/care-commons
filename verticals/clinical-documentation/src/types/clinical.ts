/**
 * Clinical Documentation Types
 * 
 * Visit notes, vital signs, assessments for skilled nursing and home health.
 * Supports Medicare/Medicaid documentation requirements.
 */

import type { Entity, SoftDeletable, UUID, Timestamp } from '@care-commons/core';

/**
 * Visit Note - Clinical documentation for a visit
 * 
 * Supports structured and free-text documentation.
 * Must be signed by licensed clinical staff (RN, LVN, PT, OT, ST).
 */
export interface VisitNote extends Entity, SoftDeletable {
  visitId: UUID;
  organizationId: UUID;
  branchId: UUID;
  clientId: UUID;
  caregiverId: UUID;
  
  // Note metadata
  noteType: VisitNoteType;
  serviceDate: Date;
  documentedAt: Timestamp;
  
  // Clinical content
  subjectiveNotes?: string; // Patient's reported symptoms, concerns
  objectiveNotes?: string; // Observable findings, measurements
  assessment?: string; // Clinical judgment, diagnosis
  plan?: string; // Care plan, interventions, follow-up
  
  // SOAP alternative - free text
  narrativeNote?: string; // Free-form clinical narrative
  
  // Structured data
  interventionsPerformed?: string[]; // List of interventions/tasks
  patientResponse?: PatientResponse;
  safetyIncidents?: boolean;
  incidentDescription?: string;
  
  // Clinical staff signature
  signedBy: UUID; // User ID of clinical staff
  signedByName: string;
  signedByCredentials: string; // RN, LVN, PT, OT, ST
  signedAt: Timestamp;
  
  // Supervision (if required)
  supervisedBy?: UUID;
  supervisedByName?: string;
  supervisedByCredentials?: string;
  supervisedAt?: Timestamp;
  
  // Status
  status: DocumentationStatus;
  
  // Compliance & audit
  requiresCoSign: boolean; // LVN notes require RN co-signature in some states
  coSignedBy?: UUID;
  coSignedByName?: string;
  coSignedAt?: Timestamp;
  
  // Amendment history
  amendmentReason?: string;
  amendedAt?: Timestamp;
  amendedBy?: UUID;
  originalNoteId?: UUID; // If this is an amendment
  
  // Metadata
  isEncrypted: boolean; // HIPAA field-level encryption flag
  encryptedFields?: string[]; // Fields that are encrypted
}

export type VisitNoteType =
  | 'SKILLED_NURSING' // RN visit note
  | 'HOME_HEALTH_AIDE' // HHA visit note
  | 'PHYSICAL_THERAPY' // PT visit note
  | 'OCCUPATIONAL_THERAPY' // OT visit note
  | 'SPEECH_THERAPY' // ST visit note
  | 'SOCIAL_WORK' // MSW visit note
  | 'SUPERVISION' // Supervisory visit
  | 'DISCHARGE_SUMMARY'; // Final visit summary

export type PatientResponse =
  | 'TOLERATED_WELL' // Patient tolerated interventions well
  | 'MILD_DISCOMFORT' // Mild discomfort noted
  | 'MODERATE_DISTRESS' // Moderate distress, adjusted approach
  | 'SEVERE_REACTION' // Severe reaction, discontinued intervention
  | 'UNABLE_TO_ASSESS'; // Patient unable to communicate response

export type DocumentationStatus =
  | 'DRAFT' // In progress
  | 'PENDING_SIGNATURE' // Awaiting clinical staff signature
  | 'SIGNED' // Signed by clinical staff
  | 'PENDING_COSIGN' // Awaiting co-signature
  | 'FINALIZED' // Complete and signed
  | 'AMENDED' // Note was amended (original preserved)
  | 'LOCKED'; // Locked per retention policy (cannot edit)

/**
 * Input types for creating/updating visit notes
 */
export interface CreateVisitNoteInput {
  visitId: UUID;
  organizationId: UUID;
  branchId: UUID;
  clientId: UUID;
  caregiverId: UUID;
  noteType: VisitNoteType;
  serviceDate: Date;
  subjectiveNotes?: string;
  objectiveNotes?: string;
  assessment?: string;
  plan?: string;
  narrativeNote?: string;
  interventionsPerformed?: string[];
  patientResponse?: PatientResponse;
  safetyIncidents?: boolean;
  incidentDescription?: string;
  signedByCredentials: string;
  requiresCoSign?: boolean;
}

export interface UpdateVisitNoteInput {
  id: UUID;
  subjectiveNotes?: string;
  objectiveNotes?: string;
  assessment?: string;
  plan?: string;
  narrativeNote?: string;
  interventionsPerformed?: string[];
  patientResponse?: PatientResponse;
  safetyIncidents?: boolean;
  incidentDescription?: string;
}

export interface SignVisitNoteInput {
  noteId: UUID;
  signedBy: UUID;
  signedByName: string;
  signedByCredentials: string;
}

export interface CoSignVisitNoteInput {
  noteId: UUID;
  coSignedBy: UUID;
  coSignedByName: string;
  coSignedByCredentials: string;
}

/**
 * Search and filtering
 */
export interface VisitNoteSearchFilters {
  organizationId: UUID;
  branchId?: UUID;
  clientId?: UUID;
  caregiverId?: UUID;
  noteType?: VisitNoteType;
  status?: DocumentationStatus;
  serviceDateFrom?: Date;
  serviceDateTo?: Date;
  requiresCoSign?: boolean;
  signedBy?: UUID;
}
