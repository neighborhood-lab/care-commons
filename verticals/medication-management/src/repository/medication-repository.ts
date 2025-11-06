import type { Database, PaginatedResult } from '@care-commons/core';

export interface Pagination {
  page: number;
  limit: number;
}
import { v4 as uuidv4 } from 'uuid';
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
} from '../types/medication.js';

/**
 * Repository for medication data access
 */
export class MedicationRepository {
  constructor(private db: Database) {}

  /**
   * Search medications with filters and pagination
   */
  async searchMedications(
    filters: MedicationSearchFilters,
    pagination: Pagination
  ): Promise<PaginatedResult<Medication>> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.client_id) {
      conditions.push(`client_id = ?`);
      params.push(filters.client_id);
    }

    if (filters.status) {
      conditions.push(`status = ?`);
      params.push(filters.status);
    }

    if (filters.is_prn !== undefined) {
      conditions.push(`is_prn = ?`);
      params.push(filters.is_prn ? 1 : 0);
    }

    if (filters.form) {
      conditions.push(`form = ?`);
      params.push(filters.form);
    }

    if (filters.route) {
      conditions.push(`route = ?`);
      params.push(filters.route);
    }

    if (filters.search) {
      conditions.push(`(name LIKE ? OR generic_name LIKE ?)`);
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (filters.start_date_from) {
      conditions.push(`start_date >= ?`);
      params.push(filters.start_date_from.toISOString());
    }

    if (filters.start_date_to) {
      conditions.push(`start_date <= ?`);
      params.push(filters.start_date_to.toISOString());
    }

    if (filters.prescriber_name) {
      conditions.push(`prescriber_name LIKE ?`);
      params.push(`%${filters.prescriber_name}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching records
    const countQuery = `SELECT COUNT(*) as total FROM medications ${whereClause}`;
    const countResult = await this.db.get<{ total: number }>(countQuery, params);
    const total = countResult?.total || 0;

    // Get paginated results
    const offset = (pagination.page - 1) * pagination.limit;
    const dataQuery = `
      SELECT * FROM medications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const items = await this.db.all<Medication>(dataQuery, [...params, pagination.limit, offset]);

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * Get medication by ID
   */
  async getMedicationById(id: string): Promise<Medication | null> {
    const query = `SELECT * FROM medications WHERE id = ?`;
    const medication = await this.db.get<Medication>(query, [id]);
    return medication || null;
  }

  /**
   * Create a new medication
   */
  async createMedication(input: CreateMedicationInput, createdBy: string): Promise<Medication> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const query = `
      INSERT INTO medications (
        id, client_id, name, generic_name, strength, form, route,
        frequency, frequency_details, dosage, prescriber_name, prescriber_npi,
        prescription_number, indication, instructions, start_date, end_date,
        status, is_prn, prn_reason, pharmacy_name, pharmacy_phone,
        refills_remaining, last_refill_date, notes, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(query, [
      id,
      input.client_id,
      input.name,
      input.generic_name || null,
      input.strength || null,
      input.form,
      input.route,
      input.frequency,
      input.frequency_details || null,
      input.dosage,
      input.prescriber_name || null,
      input.prescriber_npi || null,
      input.prescription_number || null,
      input.indication || null,
      input.instructions || null,
      input.start_date.toISOString(),
      input.end_date?.toISOString() || null,
      'active',
      input.is_prn ? 1 : 0,
      input.prn_reason || null,
      input.pharmacy_name || null,
      input.pharmacy_phone || null,
      input.refills_remaining || null,
      null,
      input.notes || null,
      createdBy,
      now,
      now,
    ]);

    const medication = await this.getMedicationById(id);
    if (!medication) {
      throw new Error('Failed to create medication');
    }
    return medication;
  }

  /**
   * Update a medication
   */
  async updateMedication(
    id: string,
    input: UpdateMedicationInput,
    updatedBy: string
  ): Promise<Medication> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      params.push(input.name);
    }
    if (input.generic_name !== undefined) {
      updates.push('generic_name = ?');
      params.push(input.generic_name);
    }
    if (input.strength !== undefined) {
      updates.push('strength = ?');
      params.push(input.strength);
    }
    if (input.form !== undefined) {
      updates.push('form = ?');
      params.push(input.form);
    }
    if (input.route !== undefined) {
      updates.push('route = ?');
      params.push(input.route);
    }
    if (input.frequency !== undefined) {
      updates.push('frequency = ?');
      params.push(input.frequency);
    }
    if (input.frequency_details !== undefined) {
      updates.push('frequency_details = ?');
      params.push(input.frequency_details);
    }
    if (input.dosage !== undefined) {
      updates.push('dosage = ?');
      params.push(input.dosage);
    }
    if (input.prescriber_name !== undefined) {
      updates.push('prescriber_name = ?');
      params.push(input.prescriber_name);
    }
    if (input.prescriber_npi !== undefined) {
      updates.push('prescriber_npi = ?');
      params.push(input.prescriber_npi);
    }
    if (input.prescription_number !== undefined) {
      updates.push('prescription_number = ?');
      params.push(input.prescription_number);
    }
    if (input.indication !== undefined) {
      updates.push('indication = ?');
      params.push(input.indication);
    }
    if (input.instructions !== undefined) {
      updates.push('instructions = ?');
      params.push(input.instructions);
    }
    if (input.start_date !== undefined) {
      updates.push('start_date = ?');
      params.push(input.start_date.toISOString());
    }
    if (input.end_date !== undefined) {
      updates.push('end_date = ?');
      params.push(input.end_date?.toISOString() || null);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      params.push(input.status);
    }
    if (input.is_prn !== undefined) {
      updates.push('is_prn = ?');
      params.push(input.is_prn ? 1 : 0);
    }
    if (input.prn_reason !== undefined) {
      updates.push('prn_reason = ?');
      params.push(input.prn_reason);
    }
    if (input.pharmacy_name !== undefined) {
      updates.push('pharmacy_name = ?');
      params.push(input.pharmacy_name);
    }
    if (input.pharmacy_phone !== undefined) {
      updates.push('pharmacy_phone = ?');
      params.push(input.pharmacy_phone);
    }
    if (input.refills_remaining !== undefined) {
      updates.push('refills_remaining = ?');
      params.push(input.refills_remaining);
    }
    if (input.notes !== undefined) {
      updates.push('notes = ?');
      params.push(input.notes);
    }

    if (updates.length === 0) {
      const medication = await this.getMedicationById(id);
      if (!medication) {
        throw new Error('Medication not found');
      }
      return medication;
    }

    updates.push('updated_by = ?', 'updated_at = ?');
    params.push(updatedBy, new Date().toISOString());

    const query = `UPDATE medications SET ${updates.join(', ')} WHERE id = ?`;
    params.push(id);

    await this.db.run(query, params);

    const medication = await this.getMedicationById(id);
    if (!medication) {
      throw new Error('Medication not found after update');
    }
    return medication;
  }

  /**
   * Delete a medication
   */
  async deleteMedication(id: string): Promise<void> {
    const query = `DELETE FROM medications WHERE id = ?`;
    await this.db.run(query, [id]);
  }

  /**
   * Get medications for a client
   */
  async getMedicationsByClientId(clientId: string): Promise<Medication[]> {
    const query = `
      SELECT * FROM medications
      WHERE client_id = ? AND status = 'active'
      ORDER BY created_at DESC
    `;
    return this.db.all<Medication>(query, [clientId]);
  }

  // Administration methods

  /**
   * Search medication administration logs
   */
  async searchAdministrations(
    filters: AdministrationSearchFilters,
    pagination: Pagination
  ): Promise<PaginatedResult<MedicationAdministration>> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.client_id) {
      conditions.push(`client_id = ?`);
      params.push(filters.client_id);
    }

    if (filters.medication_id) {
      conditions.push(`medication_id = ?`);
      params.push(filters.medication_id);
    }

    if (filters.status) {
      conditions.push(`status = ?`);
      params.push(filters.status);
    }

    if (filters.scheduled_time_from) {
      conditions.push(`scheduled_time >= ?`);
      params.push(filters.scheduled_time_from.toISOString());
    }

    if (filters.scheduled_time_to) {
      conditions.push(`scheduled_time <= ?`);
      params.push(filters.scheduled_time_to.toISOString());
    }

    if (filters.administered_by) {
      conditions.push(`administered_by = ?`);
      params.push(filters.administered_by);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM medication_administrations ${whereClause}`;
    const countResult = await this.db.get<{ total: number }>(countQuery, params);
    const total = countResult?.total || 0;

    const offset = (pagination.page - 1) * pagination.limit;
    const dataQuery = `
      SELECT * FROM medication_administrations
      ${whereClause}
      ORDER BY scheduled_time DESC
      LIMIT ? OFFSET ?
    `;

    const items = await this.db.all<MedicationAdministration>(dataQuery, [
      ...params,
      pagination.limit,
      offset,
    ]);

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * Record medication administration
   */
  async recordAdministration(
    input: RecordAdministrationInput,
    createdBy: string
  ): Promise<MedicationAdministration> {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Get client_id from medication
    const medication = await this.getMedicationById(input.medication_id);
    if (!medication) {
      throw new Error('Medication not found');
    }

    const query = `
      INSERT INTO medication_administrations (
        id, medication_id, client_id, scheduled_time, administered_time,
        administered_by, status, dosage_given, skip_reason, refuse_reason,
        notes, witnessed_by, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(query, [
      id,
      input.medication_id,
      medication.client_id,
      input.scheduled_time.toISOString(),
      input.administered_time?.toISOString() || null,
      createdBy,
      input.status,
      input.dosage_given || null,
      input.skip_reason || null,
      input.refuse_reason || null,
      input.notes || null,
      input.witnessed_by || null,
      createdBy,
      now,
      now,
    ]);

    const administration = await this.getAdministrationById(id);
    if (!administration) {
      throw new Error('Failed to record administration');
    }
    return administration;
  }

  /**
   * Get administration by ID
   */
  async getAdministrationById(id: string): Promise<MedicationAdministration | null> {
    const query = `SELECT * FROM medication_administrations WHERE id = ?`;
    const administration = await this.db.get<MedicationAdministration>(query, [id]);
    return administration || null;
  }

  // Allergy methods

  /**
   * Search medication allergies
   */
  async searchAllergies(
    filters: AllergySearchFilters,
    pagination: Pagination
  ): Promise<PaginatedResult<MedicationAllergy>> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.client_id) {
      conditions.push(`client_id = ?`);
      params.push(filters.client_id);
    }

    if (filters.is_active !== undefined) {
      conditions.push(`is_active = ?`);
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters.severity) {
      conditions.push(`severity = ?`);
      params.push(filters.severity);
    }

    if (filters.allergen) {
      conditions.push(`allergen LIKE ?`);
      params.push(`%${filters.allergen}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM medication_allergies ${whereClause}`;
    const countResult = await this.db.get<{ total: number }>(countQuery, params);
    const total = countResult?.total || 0;

    const offset = (pagination.page - 1) * pagination.limit;
    const dataQuery = `
      SELECT * FROM medication_allergies
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const items = await this.db.all<MedicationAllergy>(dataQuery, [
      ...params,
      pagination.limit,
      offset,
    ]);

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * Create a medication allergy
   */
  async createAllergy(input: CreateAllergyInput, createdBy: string): Promise<MedicationAllergy> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const query = `
      INSERT INTO medication_allergies (
        id, client_id, allergen, reaction, severity, notes,
        verified_date, verified_by, is_active, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(query, [
      id,
      input.client_id,
      input.allergen,
      input.reaction || null,
      input.severity || null,
      input.notes || null,
      input.verified_date?.toISOString() || null,
      input.verified_by || null,
      1,
      createdBy,
      now,
      now,
    ]);

    const allergy = await this.getAllergyById(id);
    if (!allergy) {
      throw new Error('Failed to create allergy');
    }
    return allergy;
  }

  /**
   * Update a medication allergy
   */
  async updateAllergy(
    id: string,
    input: UpdateAllergyInput,
    updatedBy: string
  ): Promise<MedicationAllergy> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.allergen !== undefined) {
      updates.push('allergen = ?');
      params.push(input.allergen);
    }
    if (input.reaction !== undefined) {
      updates.push('reaction = ?');
      params.push(input.reaction);
    }
    if (input.severity !== undefined) {
      updates.push('severity = ?');
      params.push(input.severity);
    }
    if (input.notes !== undefined) {
      updates.push('notes = ?');
      params.push(input.notes);
    }
    if (input.verified_date !== undefined) {
      updates.push('verified_date = ?');
      params.push(input.verified_date?.toISOString() || null);
    }
    if (input.verified_by !== undefined) {
      updates.push('verified_by = ?');
      params.push(input.verified_by);
    }
    if (input.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(input.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      const allergy = await this.getAllergyById(id);
      if (!allergy) {
        throw new Error('Allergy not found');
      }
      return allergy;
    }

    updates.push('updated_by = ?', 'updated_at = ?');
    params.push(updatedBy, new Date().toISOString());

    const query = `UPDATE medication_allergies SET ${updates.join(', ')} WHERE id = ?`;
    params.push(id);

    await this.db.run(query, params);

    const allergy = await this.getAllergyById(id);
    if (!allergy) {
      throw new Error('Allergy not found after update');
    }
    return allergy;
  }

  /**
   * Get allergy by ID
   */
  async getAllergyById(id: string): Promise<MedicationAllergy | null> {
    const query = `SELECT * FROM medication_allergies WHERE id = ?`;
    const allergy = await this.db.get<MedicationAllergy>(query, [id]);
    return allergy || null;
  }

  /**
   * Get active allergies for a client
   */
  async getActiveAllergiesByClientId(clientId: string): Promise<MedicationAllergy[]> {
    const query = `
      SELECT * FROM medication_allergies
      WHERE client_id = ? AND is_active = 1
      ORDER BY created_at DESC
    `;
    return this.db.all<MedicationAllergy>(query, [clientId]);
  }
}
