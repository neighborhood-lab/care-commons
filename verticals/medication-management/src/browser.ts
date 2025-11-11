/**
 * Medication Management Vertical - Browser Entry Point
 *
 * Browser-safe exports (no database dependencies)
 */

// Types only
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

// Validation schemas (browser-safe)
export {
  medicationRouteSchema,
  medicationStatusSchema,
  administrationStatusSchema,
  createMedicationSchema,
  updateMedicationSchema,
  recordAdministrationSchema,
} from './validation/medication-validator.js';
