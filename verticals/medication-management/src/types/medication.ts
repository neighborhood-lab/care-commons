/**
 * Medication Management Types
 *
 * Core domain types for medication tracking and administration.
 * Supports:
 * - Medication orders with prescriber information
 * - Multiple routes of administration
 * - State-specific compliance tracking
 * - Medication administration records (MAR)
 * - Refusal and hold tracking
 */

export type MedicationRoute = 'ORAL' | 'TOPICAL' | 'INJECTION' | 'INHALATION' | 'OTHER';

export type MedicationStatus = 'ACTIVE' | 'DISCONTINUED' | 'ON_HOLD';

export type AdministrationStatus = 'GIVEN' | 'REFUSED' | 'HELD' | 'MISSED';

/**
 * Medication represents a medication order for a client
 */
export interface Medication {
  id: string;
  organizationId: string;
  clientId: string;
  medicationName: string;
  genericName?: string;
  dosage: string; // e.g., "10mg", "2 tablets", "5ml"
  route: MedicationRoute;
  frequency: string; // e.g., "BID" (twice daily), "TID" (three times daily), "QD" (once daily)
  instructions?: string; // Special instructions, e.g., "Take with food"
  prescribedBy: string; // Prescriber name (physician, NP, etc.)
  prescribedDate: Date; // Prescription date
  startDate: Date; // Start date
  endDate?: Date; // End date (null = ongoing)
  status: MedicationStatus;
  refillsRemaining?: number;
  sideEffects?: string[]; // Common side effects to monitor
  warnings?: string[]; // Important warnings (e.g., "Do not take with grapefruit")
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  updatedBy: string; // User ID
  version: number; // Required by Entity interface
}

/**
 * MedicationAdministration represents a single administration event (MAR entry)
 */
export interface MedicationAdministration {
  id: string;
  organizationId: string;
  medicationId: string;
  clientId: string;
  administeredBy: string; // User ID of caregiver
  administeredAt: Date; // Administration timestamp
  scheduledFor?: Date; // Scheduled timestamp (if scheduled)
  dosageGiven: string; // Actual dosage administered
  route: MedicationRoute; // Actual route used
  status: AdministrationStatus;
  notes?: string; // Administration notes
  refusalReason?: string; // If status = REFUSED
  holdReason?: string; // If status = HELD
  witnessedBy?: string; // User ID (for controlled substances)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating a new medication order
 */
export interface CreateMedicationInput {
  clientId: string;
  medicationName: string;
  genericName?: string;
  dosage: string;
  route: MedicationRoute;
  frequency: string;
  instructions?: string;
  prescribedBy: string;
  prescribedDate: string;
  startDate: string;
  endDate?: string;
  status?: MedicationStatus;
  refillsRemaining?: number;
  sideEffects?: string[];
  warnings?: string[];
}

/**
 * Input type for updating an existing medication
 */
export interface UpdateMedicationInput {
  medicationName?: string;
  genericName?: string;
  dosage?: string;
  route?: MedicationRoute;
  frequency?: string;
  instructions?: string;
  prescribedBy?: string;
  prescribedDate?: string;
  startDate?: string;
  endDate?: string;
  status?: MedicationStatus;
  refillsRemaining?: number;
  sideEffects?: string[];
  warnings?: string[];
}

/**
 * Input type for recording medication administration
 */
export interface RecordAdministrationInput {
  medicationId: string;
  clientId: string;
  administeredAt?: string; // Defaults to now
  scheduledFor?: string;
  dosageGiven: string;
  route: MedicationRoute;
  status: AdministrationStatus;
  notes?: string;
  refusalReason?: string;
  holdReason?: string;
  witnessedBy?: string;
}

/**
 * Medication with computed fields for UI display
 */
export interface MedicationWithStatus extends Medication {
  lastAdministered?: Date; // Last administration timestamp
  nextScheduledTime?: Date; // Next scheduled timestamp
  isOverdue?: boolean;
  needsRefill?: boolean;
}
