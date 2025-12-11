/**
 * Clinical Documentation Module
 *
 * Exports types, services, and repository for clinical visit notes.
 */

// Types
export * from './types/clinical.js';

// Service
export { ClinicalService } from './service/clinical-service.js';

// Repository
export { ClinicalRepository } from './repository/clinical-repository.js';

// Clinical Handoffs (SBAR, I-PASS)
export { ClinicalHandoffService } from './service/clinical-handoff-service.js';
export type {
  HandoffType,
  HandoffStatus,
  HandoffUrgency,
  SBARContent,
  IPassContent,
  ClinicalHandoff,
  CreateHandoffInput,
  AcknowledgeHandoffInput,
  DeclineHandoffInput,
  HandoffSummary,
} from './service/clinical-handoff-service.js';
export { createHandoffRoutes } from './api/handoff-routes.js';
