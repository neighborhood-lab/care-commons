/**
 * Client repository - data access layer
 */

import { Repository, Database, PaginatedResult } from '@care-commons/core';
import { Client, ClientSearchFilters, Gender, ContactMethod, MaritalStatus, ClientStatus } from '../types/client';

export class ClientRepository extends Repository<Client> {
  constructor(database: Database) {
    super({
      tableName: 'clients',
      database,
      enableAudit: true,
      enableSoftDelete: true,
    });
  }

  /**
   * Map database row to Client entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): Client {
    const entity: Client = this.mapRequiredFields(row);
    this.mapOptionalPersonalFields(row, entity);
    this.mapOptionalContactFields(row, entity);
    this.mapOptionalMedicalFields(row, entity);
    this.mapOptionalAdministrativeFields(row, entity);
    return entity;
  }

  /**
   * Parse JSON field that might already be an object (from JSONB columns)
   */
  private parseJsonField<T = unknown>(value: unknown, defaultValue?: T): T | unknown {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    // If it's already an object, return it
    if (typeof value === 'object') {
      return value as T;
    }
    // If it's a string, parse it
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }

  /**
   * Map required client fields from database row
   */
  private mapRequiredFields(row: Record<string, unknown>): Client {
    return {
      id: row['id'] as string,
      organizationId: row['organization_id'] as string,
      branchId: row['branch_id'] as string,
      clientNumber: row['client_number'] as string,
      firstName: row['first_name'] as string,
      lastName: row['last_name'] as string,
      dateOfBirth: row['date_of_birth'] as Date,
      primaryAddress: this.parseJsonField(row['primary_address']) as Client['primaryAddress'],
      emergencyContacts: this.parseJsonField(row['emergency_contacts']) as Client['emergencyContacts'],
      authorizedContacts: this.parseJsonField(row['authorized_contacts']) as Client['authorizedContacts'],
      programs: this.parseJsonField(row['programs']) as Client['programs'],
      serviceEligibility: this.parseJsonField(row['service_eligibility']) as Client['serviceEligibility'],
      riskFlags: this.parseJsonField(row['risk_flags']) as Client['riskFlags'],
      status: row['status'] as ClientStatus,
      isDemoData: row['is_demo_data'] as boolean | undefined,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as string,
      version: row['version'] as number,
      deletedAt: row['deleted_at'] as Date | null,
      deletedBy: row['deleted_by'] as string | null,
    };
  }

  /**
   * Map optional personal and demographic fields
   */
  private mapOptionalPersonalFields(row: Record<string, unknown>, entity: Client): void {
    const middleName = row['middle_name'] as string | undefined;
    if (middleName !== undefined) entity.middleName = middleName;

    const preferredName = row['preferred_name'] as string | undefined;
    if (preferredName !== undefined) entity.preferredName = preferredName;

    const ssn = row['ssn'] as string | undefined;
    if (ssn !== undefined) entity.ssn = ssn;

    const gender = row['gender'] as Gender | undefined;
    if (gender !== undefined) entity.gender = gender;

    const pronouns = row['pronouns'] as string | undefined;
    if (pronouns !== undefined) entity.pronouns = pronouns;

    const language = row['language'] as string | undefined;
    if (language !== undefined) entity.language = language;

    const ethnicity = row['ethnicity'] as string | undefined;
    if (ethnicity !== undefined) entity.ethnicity = ethnicity;

    const race = row['race'];
    if (race !== undefined && race !== null) {
      entity.race = this.parseJsonField(race) as typeof entity.race;
    }

    const maritalStatus = row['marital_status'] as MaritalStatus | undefined;
    if (maritalStatus !== undefined) entity.maritalStatus = maritalStatus;

    const veteranStatus = row['veteran_status'] as boolean | undefined;
    if (veteranStatus !== undefined) entity.veteranStatus = veteranStatus;
  }

  /**
   * Map optional contact fields
   */
  private mapOptionalContactFields(row: Record<string, unknown>, entity: Client): void {
    const primaryPhone = row['primary_phone'];
    if (primaryPhone !== undefined && primaryPhone !== null) {
      entity.primaryPhone = this.parseJsonField(primaryPhone) as typeof entity.primaryPhone;
    }

    const alternatePhone = row['alternate_phone'];
    if (alternatePhone !== undefined && alternatePhone !== null) {
      entity.alternatePhone = this.parseJsonField(alternatePhone) as typeof entity.alternatePhone;
    }

    const email = row['email'] as string | undefined;
    if (email !== undefined) entity.email = email;

    const preferredContactMethod = row['preferred_contact_method'] as ContactMethod | undefined;
    if (preferredContactMethod !== undefined) entity.preferredContactMethod = preferredContactMethod;

    const communicationPreferences = row['communication_preferences'];
    if (communicationPreferences !== undefined && communicationPreferences !== null) {
      entity.communicationPreferences = this.parseJsonField(communicationPreferences) as typeof entity.communicationPreferences;
    }

    const secondaryAddresses = row['secondary_addresses'];
    if (secondaryAddresses !== undefined && secondaryAddresses !== null) {
      entity.secondaryAddresses = this.parseJsonField(secondaryAddresses) as typeof entity.secondaryAddresses;
    }

    const livingArrangement = row['living_arrangement'];
    if (livingArrangement !== undefined && livingArrangement !== null) {
      entity.livingArrangement = this.parseJsonField(livingArrangement) as typeof entity.livingArrangement;
    }

    const mobilityInfo = row['mobility_info'];
    if (mobilityInfo !== undefined && mobilityInfo !== null) {
      entity.mobilityInfo = this.parseJsonField(mobilityInfo) as typeof entity.mobilityInfo;
    }

    const accessInstructions = row['access_instructions'] as string | undefined;
    if (accessInstructions !== undefined) entity.accessInstructions = accessInstructions;
  }

  /**
   * Map optional medical fields
   */
  private mapOptionalMedicalFields(row: Record<string, unknown>, entity: Client): void {
    const primaryPhysician = row['primary_physician'];
    if (primaryPhysician !== undefined && primaryPhysician !== null) {
      entity.primaryPhysician = this.parseJsonField(primaryPhysician) as typeof entity.primaryPhysician;
    }

    const pharmacy = row['pharmacy'];
    if (pharmacy !== undefined && pharmacy !== null) {
      entity.pharmacy = this.parseJsonField(pharmacy) as typeof entity.pharmacy;
    }

    const insurance = row['insurance'];
    if (insurance !== undefined && insurance !== null) {
      entity.insurance = this.parseJsonField(insurance) as typeof entity.insurance;
    }

    const medicalRecordNumber = row['medical_record_number'] as string | undefined;
    if (medicalRecordNumber !== undefined) entity.medicalRecordNumber = medicalRecordNumber;

    const fundingSources = row['funding_sources'];
    if (fundingSources !== undefined && fundingSources !== null) {
      entity.fundingSources = this.parseJsonField(fundingSources) as typeof entity.fundingSources;
    }

    const allergies = row['allergies'];
    if (allergies !== undefined && allergies !== null) {
      entity.allergies = this.parseJsonField(allergies) as typeof entity.allergies;
    }

    const specialInstructions = row['special_instructions'] as string | undefined;
    if (specialInstructions !== undefined) entity.specialInstructions = specialInstructions;
  }

  /**
   * Map optional administrative and status fields
   */
  private mapOptionalAdministrativeFields(row: Record<string, unknown>, entity: Client): void {
    const intakeDate = row['intake_date'] as Date | undefined;
    if (intakeDate !== undefined) entity.intakeDate = intakeDate;

    const dischargeDate = row['discharge_date'] as Date | undefined;
    if (dischargeDate !== undefined) entity.dischargeDate = dischargeDate;

    const dischargeReason = row['discharge_reason'] as string | undefined;
    if (dischargeReason !== undefined) entity.dischargeReason = dischargeReason;

    const referralSource = row['referral_source'] as string | undefined;
    if (referralSource !== undefined) entity.referralSource = referralSource;

    const notes = row['notes'] as string | undefined;
    if (notes !== undefined) entity.notes = notes;

    const customFields = row['custom_fields'];
    if (customFields !== undefined && customFields !== null) {
      entity.customFields = this.parseJsonField(customFields) as typeof entity.customFields;
    }
  }

  /**
   * Map Client entity to database row
   */
  protected mapEntityToRow(entity: Partial<Client>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    this.mapBasicFields(entity, row);
    this.mapContactFields(entity, row);
    this.mapDemographicFields(entity, row);
    this.mapAddressFields(entity, row);
    this.mapMedicalFields(entity, row);
    this.mapProgramFields(entity, row);
    this.mapStatusFields(entity, row);

    return row;
  }

  /**
   * Map basic identification fields
   */
  private mapBasicFields(entity: Partial<Client>, row: Record<string, unknown>): void {
    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.branchId !== undefined) row['branch_id'] = entity.branchId;
    if (entity.clientNumber !== undefined) row['client_number'] = entity.clientNumber;
    if (entity.firstName !== undefined) row['first_name'] = entity.firstName;
    if (entity.middleName !== undefined) row['middle_name'] = entity.middleName;
    if (entity.lastName !== undefined) row['last_name'] = entity.lastName;
    if (entity.preferredName !== undefined) row['preferred_name'] = entity.preferredName;
    if (entity.dateOfBirth !== undefined) row['date_of_birth'] = entity.dateOfBirth;
    if (entity.ssn !== undefined) row['ssn'] = entity.ssn;
  }

  /**
   * Map contact and communication fields
   */
  private mapContactFields(entity: Partial<Client>, row: Record<string, unknown>): void {
    if (entity.primaryPhone !== undefined)
      row['primary_phone'] = JSON.stringify(entity.primaryPhone);
    if (entity.alternatePhone !== undefined)
      row['alternate_phone'] = JSON.stringify(entity.alternatePhone);
    if (entity.email !== undefined) row['email'] = entity.email;
    if (entity.preferredContactMethod !== undefined)
      row['preferred_contact_method'] = entity.preferredContactMethod;
    if (entity.communicationPreferences !== undefined)
      row['communication_preferences'] = JSON.stringify(entity.communicationPreferences);
    if (entity.emergencyContacts !== undefined)
      row['emergency_contacts'] = JSON.stringify(entity.emergencyContacts);
    if (entity.authorizedContacts !== undefined)
      row['authorized_contacts'] = JSON.stringify(entity.authorizedContacts);
  }

  /**
   * Map demographic fields
   */
  private mapDemographicFields(entity: Partial<Client>, row: Record<string, unknown>): void {
    if (entity.gender !== undefined) row['gender'] = entity.gender;
    if (entity.pronouns !== undefined) row['pronouns'] = entity.pronouns;
    if (entity.language !== undefined) row['language'] = entity.language;
    if (entity.ethnicity !== undefined) row['ethnicity'] = entity.ethnicity;
    if (entity.race !== undefined) row['race'] = JSON.stringify(entity.race);
    if (entity.maritalStatus !== undefined) row['marital_status'] = entity.maritalStatus;
    if (entity.veteranStatus !== undefined) row['veteran_status'] = entity.veteranStatus;
  }

  /**
   * Map address and living situation fields
   */
  private mapAddressFields(entity: Partial<Client>, row: Record<string, unknown>): void {
    if (entity.primaryAddress !== undefined)
      row['primary_address'] = JSON.stringify(entity.primaryAddress);
    if (entity.secondaryAddresses !== undefined)
      row['secondary_addresses'] = JSON.stringify(entity.secondaryAddresses);
    if (entity.livingArrangement !== undefined)
      row['living_arrangement'] = JSON.stringify(entity.livingArrangement);
    if (entity.mobilityInfo !== undefined)
      row['mobility_info'] = JSON.stringify(entity.mobilityInfo);
    if (entity.accessInstructions !== undefined)
      row['access_instructions'] = entity.accessInstructions;
  }

  /**
   * Map medical and health-related fields
   */
  private mapMedicalFields(entity: Partial<Client>, row: Record<string, unknown>): void {
    if (entity.primaryPhysician !== undefined)
      row['primary_physician'] = JSON.stringify(entity.primaryPhysician);
    if (entity.pharmacy !== undefined) row['pharmacy'] = JSON.stringify(entity.pharmacy);
    if (entity.insurance !== undefined) row['insurance'] = JSON.stringify(entity.insurance);
    if (entity.medicalRecordNumber !== undefined)
      row['medical_record_number'] = entity.medicalRecordNumber;
    if (entity.allergies !== undefined) row['allergies'] = JSON.stringify(entity.allergies);
    if (entity.riskFlags !== undefined) row['risk_flags'] = JSON.stringify(entity.riskFlags);
    if (entity.specialInstructions !== undefined)
      row['special_instructions'] = entity.specialInstructions;
  }

  /**
   * Map program and service fields
   */
  private mapProgramFields(entity: Partial<Client>, row: Record<string, unknown>): void {
    if (entity.programs !== undefined) row['programs'] = JSON.stringify(entity.programs);
    if (entity.serviceEligibility !== undefined)
      row['service_eligibility'] = JSON.stringify(entity.serviceEligibility);
    if (entity.fundingSources !== undefined)
      row['funding_sources'] = JSON.stringify(entity.fundingSources);
  }

  /**
   * Map status and administrative fields
   */
  private mapStatusFields(entity: Partial<Client>, row: Record<string, unknown>): void {
    if (entity.status !== undefined) row['status'] = entity.status;
    if (entity.intakeDate !== undefined) row['intake_date'] = entity.intakeDate;
    if (entity.dischargeDate !== undefined) row['discharge_date'] = entity.dischargeDate;
    if (entity.dischargeReason !== undefined) row['discharge_reason'] = entity.dischargeReason;
    if (entity.referralSource !== undefined) row['referral_source'] = entity.referralSource;
    if (entity.notes !== undefined) row['notes'] = entity.notes;
    if (entity.customFields !== undefined)
      row['custom_fields'] = JSON.stringify(entity.customFields);
  }

  /**
   * Find client by client number
   */
  async findByClientNumber(
    clientNumber: string,
    organizationId: string
  ): Promise<Client | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE client_number = $1 
        AND organization_id = $2
        AND deleted_at IS NULL
    `;

    const result = await this.database.query(query, [clientNumber, organizationId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0] as Record<string, unknown>);
  }

  /**
   * Search clients with filters
   */
  async search(
    filters: ClientSearchFilters,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResult<Client>> {
    const whereClauses: string[] = ['deleted_at IS NULL'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (typeof filters.query === 'string' && filters.query !== '') {
      whereClauses.push(`(
        first_name ILIKE $${paramIndex} OR 
        last_name ILIKE $${paramIndex} OR 
        client_number ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.query}%`);
      paramIndex++;
    }

    if (typeof filters.organizationId === 'string' && filters.organizationId !== '') {
      whereClauses.push(`organization_id = $${paramIndex}`);
      params.push(filters.organizationId);
      paramIndex++;
    }

    if (typeof filters.branchId === 'string' && filters.branchId !== '') {
      whereClauses.push(`branch_id = $${paramIndex}`);
      params.push(filters.branchId);
      paramIndex++;
    }

    if (filters.status !== null && filters.status !== undefined && filters.status.length > 0) {
      whereClauses.push(`status = ANY($${paramIndex})`);
      params.push(filters.status);
      paramIndex++;
    }

    if (typeof filters.city === 'string' && filters.city !== '') {
      whereClauses.push(`primary_address::jsonb->>'city' ILIKE $${paramIndex}`);
      params.push(`%${filters.city}%`);
      paramIndex++;
    }

    if (typeof filters.state === 'string' && filters.state !== '') {
      whereClauses.push(`primary_address::jsonb->>'state' = $${paramIndex}`);
      params.push(filters.state);
      paramIndex++;
    }

    const whereClause = whereClauses.join(' AND ');

    // Count total
    const countQuery = `SELECT COUNT(*) FROM ${this.tableName} WHERE ${whereClause}`;
    const countResult = await this.database.query(countQuery, params);
    const countRow = countResult.rows[0];
    if (!countRow) {
      throw new Error('Count query returned no rows');
    }
    const total = parseInt(String(countRow['count']));

    // Get paginated results
    const offset = (pagination.page - 1) * pagination.limit;
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE ${whereClause}
      ORDER BY last_name, first_name
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await this.database.query(query, [
      ...params,
      pagination.limit,
      offset,
    ]);

    const items = result.rows.map((row) => this.mapRowToEntity(row));

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * Get clients by branch
   */
  async findByBranch(branchId: string, activeOnly: boolean = true): Promise<Client[]> {
    const statusFilter = activeOnly ? "AND status = 'ACTIVE'" : '';
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE branch_id = $1 
        AND deleted_at IS NULL
        ${statusFilter}
      ORDER BY last_name, first_name
    `;

    const result = await this.database.query(query, [branchId]);

    return result.rows.map((row) => this.mapRowToEntity(row));
  }
}
