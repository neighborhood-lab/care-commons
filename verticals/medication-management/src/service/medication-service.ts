import type { UserContext, PaginatedResult } from '@care-commons/core';
import type { Pagination } from '../repository/medication-repository.js';
import type {
  Medication,
  MedicationSearchFilters,
  CreateMedicationInput,
  UpdateMedicationInput,
  MedicationAdministration,
  AdministrationSearchFilters,
  RecordAdministrationInput,
  MedicationAllergy,
  AllergySearchFilters,
  CreateAllergyInput,
  UpdateAllergyInput,
  AdministrationReport,
  MedicationWithDetails,
} from '../types/medication.js';
import { MedicationRepository } from '../repository/medication-repository.js';

/**
 * Service for medication management business logic
 */
export class MedicationService {
  constructor(private repository: MedicationRepository) {}

  /**
   * Search medications with filters
   */
  async searchMedications(
    filters: MedicationSearchFilters,
    pagination: Pagination,
    context: UserContext
  ): Promise<PaginatedResult<Medication>> {
    // Apply tenant filtering
    const enrichedFilters = {
      ...filters,
      // Additional context-based filtering could be added here
    };

    return this.repository.searchMedications(enrichedFilters, pagination);
  }

  /**
   * Get medication by ID
   */
  async getMedicationById(id: string, context: UserContext): Promise<Medication | null> {
    const medication = await this.repository.getMedicationById(id);

    if (!medication) {
      return null;
    }

    // Verify access based on context
    // In a real implementation, you'd verify tenant access here

    return medication;
  }

  /**
   * Get medication with related details
   */
  async getMedicationWithDetails(
    id: string,
    context: UserContext
  ): Promise<MedicationWithDetails | null> {
    const medication = await this.getMedicationById(id, context);

    if (!medication) {
      return null;
    }

    // Get upcoming administrations (next 7 days)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingResult = await this.repository.searchAdministrations(
      {
        medication_id: id,
        scheduled_time_from: now,
        scheduled_time_to: nextWeek,
        status: 'pending',
      },
      { page: 1, limit: 10 }
    );

    // Get recent administrations (last 7 days)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentResult = await this.repository.searchAdministrations(
      {
        medication_id: id,
        scheduled_time_from: lastWeek,
        scheduled_time_to: now,
      },
      { page: 1, limit: 10 }
    );

    return {
      ...medication,
      upcoming_administrations: upcomingResult.items,
      recent_administrations: recentResult.items,
    };
  }

  /**
   * Create a new medication
   */
  async createMedication(
    input: CreateMedicationInput,
    context: UserContext
  ): Promise<Medication> {
    // Validate input
    this.validateMedicationInput(input);

    // Check for potential interactions with existing medications
    const existingMedications = await this.repository.getMedicationsByClientId(input.client_id);
    const interactions = this.checkMedicationInteractions(input.name, existingMedications);

    if (interactions.length > 0) {
      // Log interactions warning (in production, this might be returned to the user)
      console.warn('Potential medication interactions detected:', interactions);
    }

    // Check for allergies
    const allergies = await this.repository.getActiveAllergiesByClientId(input.client_id);
    const allergyWarnings = this.checkAllergyConflicts(input.name, input.generic_name, allergies);

    if (allergyWarnings.length > 0) {
      throw new Error(`Allergy conflict detected: ${allergyWarnings.join(', ')}`);
    }

    return this.repository.createMedication(input, context.userId);
  }

  /**
   * Update a medication
   */
  async updateMedication(
    id: string,
    input: UpdateMedicationInput,
    context: UserContext
  ): Promise<Medication> {
    const existing = await this.getMedicationById(id, context);

    if (!existing) {
      throw new Error('Medication not found');
    }

    return this.repository.updateMedication(id, input, context.userId);
  }

  /**
   * Delete a medication
   */
  async deleteMedication(id: string, context: UserContext): Promise<void> {
    const existing = await this.getMedicationById(id, context);

    if (!existing) {
      throw new Error('Medication not found');
    }

    // Instead of hard delete, mark as discontinued
    await this.repository.updateMedication(
      id,
      { status: 'discontinued' },
      context.userId
    );
  }

  /**
   * Get medications for a client
   */
  async getMedicationsByClientId(clientId: string, context: UserContext): Promise<Medication[]> {
    return this.repository.getMedicationsByClientId(clientId);
  }

  // Administration methods

  /**
   * Search medication administration logs
   */
  async searchAdministrations(
    filters: AdministrationSearchFilters,
    pagination: Pagination,
    context: UserContext
  ): Promise<PaginatedResult<MedicationAdministration>> {
    return this.repository.searchAdministrations(filters, pagination);
  }

  /**
   * Record medication administration
   */
  async recordAdministration(
    input: RecordAdministrationInput,
    context: UserContext
  ): Promise<MedicationAdministration> {
    // Validate the medication exists
    const medication = await this.repository.getMedicationById(input.medication_id);

    if (!medication) {
      throw new Error('Medication not found');
    }

    if (medication.status !== 'active') {
      throw new Error('Cannot administer inactive medication');
    }

    // Validate administration status
    if (input.status === 'administered' && !input.administered_time) {
      input.administered_time = new Date();
    }

    if (input.status === 'skipped' && !input.skip_reason) {
      throw new Error('Skip reason is required when medication is skipped');
    }

    if (input.status === 'refused' && !input.refuse_reason) {
      throw new Error('Refuse reason is required when medication is refused');
    }

    return this.repository.recordAdministration(input, context.userId);
  }

  /**
   * Get administration report for a client
   */
  async getAdministrationReport(
    clientId: string,
    periodStart: Date,
    periodEnd: Date,
    context: UserContext
  ): Promise<AdministrationReport> {
    const result = await this.repository.searchAdministrations(
      {
        client_id: clientId,
        scheduled_time_from: periodStart,
        scheduled_time_to: periodEnd,
      },
      { page: 1, limit: 10000 } // Get all for reporting
    );

    const administrations = result.items;

    const total_scheduled = administrations.length;
    const total_administered = administrations.filter((a) => a.status === 'administered').length;
    const total_skipped = administrations.filter((a) => a.status === 'skipped').length;
    const total_refused = administrations.filter((a) => a.status === 'refused').length;
    const total_missed = administrations.filter((a) => a.status === 'missed').length;

    const adherence_rate =
      total_scheduled > 0 ? (total_administered / total_scheduled) * 100 : 0;

    // Group by medication
    const byMedication = new Map<
      string,
      { medication_id: string; scheduled: number; administered: number }
    >();

    for (const admin of administrations) {
      const existing = byMedication.get(admin.medication_id) || {
        medication_id: admin.medication_id,
        scheduled: 0,
        administered: 0,
      };

      existing.scheduled += 1;
      if (admin.status === 'administered') {
        existing.administered += 1;
      }

      byMedication.set(admin.medication_id, existing);
    }

    // Get medication names
    const medicationStats = await Promise.all(
      Array.from(byMedication.values()).map(async (stat) => {
        const medication = await this.repository.getMedicationById(stat.medication_id);
        return {
          medication_id: stat.medication_id,
          medication_name: medication?.name || 'Unknown',
          scheduled: stat.scheduled,
          administered: stat.administered,
          adherence_rate:
            stat.scheduled > 0 ? (stat.administered / stat.scheduled) * 100 : 0,
        };
      })
    );

    return {
      period_start: periodStart,
      period_end: periodEnd,
      total_scheduled,
      total_administered,
      total_skipped,
      total_refused,
      total_missed,
      adherence_rate,
      by_medication: medicationStats,
    };
  }

  // Allergy methods

  /**
   * Search medication allergies
   */
  async searchAllergies(
    filters: AllergySearchFilters,
    pagination: Pagination,
    context: UserContext
  ): Promise<PaginatedResult<MedicationAllergy>> {
    return this.repository.searchAllergies(filters, pagination);
  }

  /**
   * Create a medication allergy
   */
  async createAllergy(input: CreateAllergyInput, context: UserContext): Promise<MedicationAllergy> {
    return this.repository.createAllergy(input, context.userId);
  }

  /**
   * Update a medication allergy
   */
  async updateAllergy(
    id: string,
    input: UpdateAllergyInput,
    context: UserContext
  ): Promise<MedicationAllergy> {
    const existing = await this.repository.getAllergyById(id);

    if (!existing) {
      throw new Error('Allergy not found');
    }

    return this.repository.updateAllergy(id, input, context.userId);
  }

  /**
   * Get active allergies for a client
   */
  async getActiveAllergiesByClientId(
    clientId: string,
    context: UserContext
  ): Promise<MedicationAllergy[]> {
    return this.repository.getActiveAllergiesByClientId(clientId);
  }

  // Private helper methods

  /**
   * Validate medication input
   */
  private validateMedicationInput(input: CreateMedicationInput): void {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Medication name is required');
    }

    if (!input.dosage || input.dosage.trim().length === 0) {
      throw new Error('Dosage is required');
    }

    if (input.is_prn && !input.prn_reason) {
      throw new Error('PRN reason is required for as-needed medications');
    }

    if (input.end_date && input.end_date < input.start_date) {
      throw new Error('End date cannot be before start date');
    }
  }

  /**
   * Check for medication interactions (simplified version)
   */
  private checkMedicationInteractions(
    newMedicationName: string,
    existingMedications: Medication[]
  ): string[] {
    // This is a simplified version. In production, you'd use a drug interaction database
    const interactions: string[] = [];

    // Example: Check for common interactions
    const newMedLower = newMedicationName.toLowerCase();

    for (const existing of existingMedications) {
      const existingLower = existing.name.toLowerCase();

      // Example interaction rules (this would be much more comprehensive in production)
      if (
        (newMedLower.includes('warfarin') && existingLower.includes('aspirin')) ||
        (newMedLower.includes('aspirin') && existingLower.includes('warfarin'))
      ) {
        interactions.push(`Potential interaction between ${newMedicationName} and ${existing.name}`);
      }
    }

    return interactions;
  }

  /**
   * Check for allergy conflicts
   */
  private checkAllergyConflicts(
    medicationName: string,
    genericName: string | undefined,
    allergies: MedicationAllergy[]
  ): string[] {
    const conflicts: string[] = [];

    const medLower = medicationName.toLowerCase();
    const genericLower = genericName?.toLowerCase();

    for (const allergy of allergies) {
      const allergenLower = allergy.allergen.toLowerCase();

      if (
        medLower.includes(allergenLower) ||
        (genericLower && genericLower.includes(allergenLower))
      ) {
        conflicts.push(allergy.allergen);
      }
    }

    return conflicts;
  }
}
