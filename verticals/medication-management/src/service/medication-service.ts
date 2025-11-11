/**
 * Medication Service - Business logic for medication management
 *
 * Handles:
 * - Medication CRUD operations
 * - Administration recording and tracking
 * - Compliance checks (refills, overdue doses)
 * - State-specific medication administration rules
 */

import type { Database, UserContext } from '@care-commons/core';
import { MedicationRepository, MedicationAdministrationRepository } from '../repository/medication-repository.js';
import type {
  Medication,
  MedicationAdministration,
  MedicationStatus,
  MedicationWithStatus,
  CreateMedicationInput,
  UpdateMedicationInput,
  RecordAdministrationInput,
} from '../types/medication.js';

export class MedicationService {
  private medicationRepo: MedicationRepository;
  private administrationRepo: MedicationAdministrationRepository;

  constructor(database: Database) {
    this.medicationRepo = new MedicationRepository(database);
    this.administrationRepo = new MedicationAdministrationRepository(database);
  }

  /**
   * Create a new medication order
   */
  async createMedication(
    input: CreateMedicationInput,
    context: UserContext
  ): Promise<Medication> {
    // Validate dates
    const startDate = new Date(input.startDate);
    const prescribedDate = new Date(input.prescribedDate);

    if (startDate < prescribedDate) {
      throw new Error('Start date cannot be before prescribed date');
    }

    if (input.endDate) {
      const endDate = new Date(input.endDate);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
    }

    const medication: Partial<Medication> = {
      organizationId: context.organizationId,
      clientId: input.clientId,
      medicationName: input.medicationName,
      genericName: input.genericName,
      dosage: input.dosage,
      route: input.route,
      frequency: input.frequency,
      instructions: input.instructions,
      prescribedBy: input.prescribedBy,
      prescribedDate: new Date(input.prescribedDate),
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      status: input.status || 'ACTIVE',
      refillsRemaining: input.refillsRemaining,
      sideEffects: input.sideEffects,
      warnings: input.warnings,
    };

    return this.medicationRepo.create(medication, context);
  }

  /**
   * Update an existing medication
   */
  async updateMedication(
    medicationId: string,
    input: UpdateMedicationInput,
    context: UserContext
  ): Promise<Medication> {
    // Validate date changes if provided
    if (input.startDate && input.prescribedDate) {
      const startDate = new Date(input.startDate);
      const prescribedDate = new Date(input.prescribedDate);
      if (startDate < prescribedDate) {
        throw new Error('Start date cannot be before prescribed date');
      }
    }

    if (input.endDate && input.startDate) {
      const endDate = new Date(input.endDate);
      const startDate = new Date(input.startDate);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
    }

    // Convert string dates to Date objects
    const updates: Partial<Medication> = {
      medicationName: input.medicationName,
      genericName: input.genericName,
      dosage: input.dosage,
      route: input.route,
      frequency: input.frequency,
      instructions: input.instructions,
      prescribedBy: input.prescribedBy,
      prescribedDate: input.prescribedDate ? new Date(input.prescribedDate) : undefined,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      status: input.status,
      refillsRemaining: input.refillsRemaining,
      sideEffects: input.sideEffects,
      warnings: input.warnings,
    };

    return this.medicationRepo.update(medicationId, updates, context);
  }

  /**
   * Discontinue a medication (soft status change)
   */
  async discontinueMedication(
    medicationId: string,
    context: UserContext
  ): Promise<Medication> {
    const now = new Date();
    return this.medicationRepo.update(
      medicationId,
      { status: 'DISCONTINUED', endDate: now },
      context
    );
  }

  /**
   * Get a medication by ID
   */
  async getMedication(medicationId: string, _context: UserContext): Promise<Medication> {
    const medication = await this.medicationRepo.findById(medicationId);
    if (!medication) {
      throw new Error(`Medication not found: ${medicationId}`);
    }
    return medication;
  }

  /**
   * Get all medications for a client
   */
  async getClientMedications(
    clientId: string,
    context: UserContext,
    status?: MedicationStatus
  ): Promise<Medication[]> {
    return this.medicationRepo.findByClientId(clientId, context, status);
  }

  /**
   * Get all active medications for a client with status information
   */
  async getClientActiveMedicationsWithStatus(
    clientId: string,
    context: UserContext
  ): Promise<MedicationWithStatus[]> {
    return this.medicationRepo.findActiveWithStatus(clientId, context);
  }

  /**
   * Record a medication administration
   */
  async recordAdministration(
    input: RecordAdministrationInput,
    context: UserContext
  ): Promise<MedicationAdministration> {
    // Validate that the medication exists and is active
    const medication = await this.medicationRepo.findById(input.medicationId);

    if (!medication) {
      throw new Error(`Medication not found: ${input.medicationId}`);
    }

    if (medication.status !== 'ACTIVE') {
      throw new Error(`Cannot administer medication with status: ${medication.status}`);
    }

    // Validate client ID matches
    if (medication.clientId !== input.clientId) {
      throw new Error('Client ID does not match medication record');
    }

    // Validate administration timestamp is not in the future
    const administeredAt = input.administeredAt ? new Date(input.administeredAt) : new Date();
    if (administeredAt > new Date()) {
      throw new Error('Administration time cannot be in the future');
    }

    // Validate refusal/hold reasons
    if (input.status === 'REFUSED' && !input.refusalReason) {
      throw new Error('Refusal reason is required when status is REFUSED');
    }

    if (input.status === 'HELD' && !input.holdReason) {
      throw new Error('Hold reason is required when status is HELD');
    }

    return this.administrationRepo.create(input, context);
  }

  /**
   * Get administration history for a medication
   */
  async getMedicationAdministrations(
    medicationId: string,
    context: UserContext,
    limit = 50
  ): Promise<MedicationAdministration[]> {
    return this.administrationRepo.findByMedicationId(medicationId, context, limit);
  }

  /**
   * Get administration history for a client within a date range
   */
  async getClientAdministrations(
    clientId: string,
    startDate: string,
    endDate: string,
    context: UserContext
  ): Promise<MedicationAdministration[]> {
    return this.administrationRepo.findByClientIdAndDateRange(
      clientId,
      startDate,
      endDate,
      context
    );
  }

  /**
   * Get the last administration for a medication
   */
  async getLastAdministration(
    medicationId: string,
    context: UserContext
  ): Promise<MedicationAdministration | null> {
    return this.administrationRepo.getLastAdministration(medicationId, context);
  }

  /**
   * Check if a medication needs a refill (business logic)
   */
  needsRefill(medication: Medication): boolean {
    // Needs refill if less than 2 refills remaining
    if (medication.refillsRemaining === undefined) return false;
    return medication.refillsRemaining < 2;
  }

  /**
   * Decrement refills remaining (called by external process when refill is filled)
   */
  async decrementRefills(medicationId: string, context: UserContext): Promise<Medication> {
    const medication = await this.medicationRepo.findById(medicationId);

    if (!medication) {
      throw new Error(`Medication not found: ${medicationId}`);
    }

    if (medication.refillsRemaining === undefined || medication.refillsRemaining === null) {
      throw new Error('Medication does not track refills');
    }

    if (medication.refillsRemaining <= 0) {
      throw new Error('No refills remaining');
    }

    return this.medicationRepo.update(
      medicationId,
      { refillsRemaining: medication.refillsRemaining - 1 },
      context
    );
  }
}
