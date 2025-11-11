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

// Repositories
export { MedicationRepository, MedicationAdministrationRepository } from './repository/medication-repository.js';

// Services
export { MedicationService } from './service/medication-service.js';

// Validation
export {
  medicationRouteSchema,
  medicationStatusSchema,
  administrationStatusSchema,
  createMedicationSchema,
  updateMedicationSchema,
  recordAdministrationSchema,
} from './validation/medication-validator.js';

// API Handlers
export { createMedicationHandlers } from './api/medication-handlers.js';
