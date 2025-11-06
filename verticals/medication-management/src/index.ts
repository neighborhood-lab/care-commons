/**
 * Medication Management Vertical
 *
 * This vertical provides comprehensive medication management functionality including:
 * - Medication records and prescriptions
 * - Medication administration tracking
 * - Medication allergies
 * - Adherence reporting
 */

// Types
export * from './types/medication.js';

// Repository
export { MedicationRepository } from './repository/medication-repository.js';

// Service
export { MedicationService } from './service/medication-service.js';

// Validation
export * from './validation/medication-validator.js';

// API Handlers
export { MedicationHandlers, createMedicationRouter } from './api/medication-handlers.js';

// Utils
export * from './utils/medication-utils.js';
