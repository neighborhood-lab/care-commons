/**
 * Visit Notes Vertical - Public API
 *
 * Rich text visit notes with templates, voice-to-text, and digital signatures.
 */

// Types
export type {
  VisitNote,
  VisitNoteType,
  ClientMood,
  IncidentSeverity,
  SignerRelationship,
  VisitNoteTemplate,
  TemplateCategory,
  TemplatePrompt,
  SignatureData,
  CreateVisitNoteInput,
  UpdateVisitNoteInput,
  AddSignatureInput,
  CreateNoteTemplateInput,
  UpdateNoteTemplateInput,
  VisitNoteSearchFilters,
  TemplateSearchFilters,
  VisitNoteWithTemplate,
  VisitNoteWithDetails,
} from './types/index.js';

// Validation
export {
  visitNoteTypeSchema,
  clientMoodSchema,
  incidentSeveritySchema,
  signerRelationshipSchema,
  templateCategorySchema,
  templatePromptSchema,
  signatureDataSchema,
  createVisitNoteSchema,
  updateVisitNoteSchema,
  addSignatureSchema,
  createNoteTemplateSchema,
  updateNoteTemplateSchema,
  visitNoteSearchFiltersSchema,
  templateSearchFiltersSchema,
} from './validation/index.js';

// Repositories
export { NoteTemplateRepository } from './repository/note-template-repository.js';
export { VisitNoteRepository } from './repository/visit-note-repository.js';
