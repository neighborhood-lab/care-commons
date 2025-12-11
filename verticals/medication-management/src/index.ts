/**
 * Medication Management Vertical - Main Entry Point
 *
 * Server-side exports including database access
 */

// Types
export type {
  Medication,
  MedicationAdministration,
  MedicationRoute,
  MedicationStatus,
  AdministrationStatus,
  CreateMedicationInput,
  UpdateMedicationInput,
  RecordAdministrationInput,
  MedicationWithStatus,
} from './types/medication.js';

// Interaction Service Types
export type {
  MedicationInteractionRequest,
  MedicationInteractionResult,
  DrugInteraction,
  AllergyAlert,
  ConditionAlert,
  InteractionSeverity,
} from './service/medication-interaction-service.js';

// Repositories
export { MedicationRepository, MedicationAdministrationRepository } from './repository/medication-repository.js';

// Services
export { MedicationService } from './service/medication-service.js';
export { MedicationInteractionService } from './service/medication-interaction-service.js';
export { MedicationReconciliationService } from './service/medication-reconciliation-service.js';
export type {
  InformationSource,
  ReconciliationStatus,
  AdherenceAssessment,
  ReconciliationItemStatus,
  MedicationReconciliation,
  ReconciliationItem,
  StartReconciliationInput,
  AddReconciliationItemInput,
  CompleteReconciliationInput,
  SignReconciliationInput,
  ReconciliationSummary,
} from './service/medication-reconciliation-service.js';

// Validation
export {
  medicationRouteSchema,
  medicationStatusSchema,
  administrationStatusSchema,
  createMedicationSchema,
  updateMedicationSchema,
  recordAdministrationSchema,
  checkInteractionsSchema,
} from './validation/medication-validator.js';

// API Handlers
export { createMedicationHandlers } from './api/medication-handlers.js';
export { createMedicationReconciliationRoutes } from './api/medication-reconciliation-routes.js';
