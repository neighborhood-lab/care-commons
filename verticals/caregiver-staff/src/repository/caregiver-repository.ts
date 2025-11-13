/**
 * Caregiver repository - data access layer
 */

import { Repository, Database, UserContext, PaginatedResult } from '@care-commons/core';
import { Caregiver, CaregiverSearchFilters, ComplianceStatus, Gender, ContactMethod, EmploymentType, EmploymentStatus, CaregiverRole, CaregiverStatus } from '../types/caregiver';

export class CaregiverRepository extends Repository<Caregiver> {
  constructor(database: Database) {
    super({
      tableName: 'caregivers',
      database,
      enableAudit: true,
      enableSoftDelete: true,
    });
  }

  /**
   * Map database row to Caregiver entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): Caregiver {
    const entity: Caregiver = {
      id: row['id'] as string,
      organizationId: row['organization_id'] as string,
      branchIds: (row['branch_ids'] as string[]) || [],
      primaryBranchId: row['primary_branch_id'] as string,
      employeeNumber: row['employee_number'] as string,
      firstName: row['first_name'] as string,
      lastName: row['last_name'] as string,
      dateOfBirth: row['date_of_birth'] as Date,
      primaryPhone: JSON.parse(row['primary_phone'] as string),
      primaryAddress: JSON.parse(row['primary_address'] as string),
      emergencyContacts: JSON.parse((row['emergency_contacts'] as string) || '[]'),
      email: row['email'] as string,
      preferredContactMethod: row['preferred_contact_method'] as ContactMethod,
      employmentType: row['employment_type'] as EmploymentType,
      employmentStatus: row['employment_status'] as EmploymentStatus,
      hireDate: row['hire_date'] as Date,
      role: row['role'] as CaregiverRole,
      permissions: (row['permissions'] as string[]) || [],
      credentials: JSON.parse((row['credentials'] as string) || '[]'),
      training: JSON.parse((row['training'] as string) || '[]'),
      skills: JSON.parse((row['skills'] as string) || '[]'),
      specializations: (row['specializations'] as string[]) || [],
      availability: JSON.parse(row['availability'] as string),
      payRate: JSON.parse(row['pay_rate'] as string),
      complianceStatus: row['compliance_status'] as ComplianceStatus,
      preferredClients: (row['preferred_clients'] as string[]) || [],
      restrictedClients: (row['restricted_clients'] as string[]) || [],
      status: row['status'] as CaregiverStatus,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as string,
      version: row['version'] as number,
      deletedAt: row['deleted_at'] as Date | null,
      deletedBy: row['deleted_by'] as string | null,
    };

    // Handle optional properties properly for exactOptionalPropertyTypes
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

    const alternatePhone = row['alternate_phone'] as string | undefined;
    if (alternatePhone !== undefined) entity.alternatePhone = JSON.parse(alternatePhone);

    const preferredContactMethod = row['preferred_contact_method'] as ContactMethod | undefined;
    if (preferredContactMethod !== undefined) entity.preferredContactMethod = preferredContactMethod;

    const communicationPreferences = row['communication_preferences'] as string | undefined;
    if (communicationPreferences !== undefined) entity.communicationPreferences = JSON.parse(communicationPreferences);

    const language = row['language'] as string | undefined;
    if (language !== undefined) entity.language = language;

    const languages = row['languages'] as string[] | undefined;
    if (languages !== undefined) entity.languages = languages;

    const ethnicity = row['ethnicity'] as string | undefined;
    if (ethnicity !== undefined) entity.ethnicity = ethnicity;

    const race = row['race'] as string[] | undefined;
    if (race !== undefined) entity.race = race;

    const mailingAddress = row['mailing_address'] as string | undefined;
    if (mailingAddress !== undefined) entity.mailingAddress = JSON.parse(mailingAddress);

    const terminationDate = row['termination_date'] as Date | undefined;
    if (terminationDate !== undefined) entity.terminationDate = terminationDate;

    const terminationReason = row['termination_reason'] as string | undefined;
    if (terminationReason !== undefined) entity.terminationReason = terminationReason;

    const rehireEligible = row['rehire_eligible'] as boolean | undefined;
    if (rehireEligible !== undefined) entity.rehireEligible = rehireEligible;

    const supervisorId = row['supervisor_id'] as string | undefined;
    if (supervisorId !== undefined) entity.supervisorId = supervisorId;

    const backgroundCheck = row['background_check'] as string | undefined;
    if (backgroundCheck !== undefined) entity.backgroundCheck = JSON.parse(backgroundCheck);

    const drugScreening = row['drug_screening'] as string | undefined;
    if (drugScreening !== undefined) entity.drugScreening = JSON.parse(drugScreening);

    const healthScreening = row['health_screening'] as string | undefined;
    if (healthScreening !== undefined) entity.healthScreening = JSON.parse(healthScreening);

    const workPreferences = row['work_preferences'] as string | undefined;
    if (workPreferences !== undefined) entity.workPreferences = JSON.parse(workPreferences);

    const maxHoursPerWeek = row['max_hours_per_week'] as number | undefined;
    if (maxHoursPerWeek !== undefined) entity.maxHoursPerWeek = maxHoursPerWeek;

    const minHoursPerWeek = row['min_hours_per_week'] as number | undefined;
    if (minHoursPerWeek !== undefined) entity.minHoursPerWeek = minHoursPerWeek;

    const willingToTravel = row['willing_to_travel'] as boolean | undefined;
    if (willingToTravel !== undefined) entity.willingToTravel = willingToTravel;

    const maxTravelDistance = row['max_travel_distance'] as number | undefined;
    if (maxTravelDistance !== undefined) entity.maxTravelDistance = maxTravelDistance;

    const alternatePayRates = row['alternate_pay_rates'] as string | undefined;
    if (alternatePayRates !== undefined) entity.alternatePayRates = JSON.parse(alternatePayRates);

    const payrollInfo = row['payroll_info'] as string | undefined;
    if (payrollInfo !== undefined) entity.payrollInfo = JSON.parse(payrollInfo);

    const performanceRating = row['performance_rating'] as number | undefined;
    if (performanceRating !== undefined) entity.performanceRating = performanceRating;

    const lastReviewDate = row['last_review_date'] as Date | undefined;
    if (lastReviewDate !== undefined) entity.lastReviewDate = lastReviewDate;

    const nextReviewDate = row['next_review_date'] as Date | undefined;
    if (nextReviewDate !== undefined) entity.nextReviewDate = nextReviewDate;

    const lastComplianceCheck = row['last_compliance_check'] as Date | undefined;
    if (lastComplianceCheck !== undefined) entity.lastComplianceCheck = lastComplianceCheck;

    const reliabilityScore = row['reliability_score'] as number | undefined;
    if (reliabilityScore !== undefined) entity.reliabilityScore = reliabilityScore;

    const statusReason = row['status_reason'] as string | undefined;
    if (statusReason !== undefined) entity.statusReason = statusReason;

    const documents = row['documents'] as string | undefined;
    if (documents !== undefined) entity.documents = JSON.parse(documents);

    const notes = row['notes'] as string | undefined;
    if (notes !== undefined) entity.notes = notes;

    const customFields = row['custom_fields'] as string | undefined;
    if (customFields !== undefined) entity.customFields = JSON.parse(customFields);

    return entity;
  }

  /**
   * Map Caregiver entity to database row
   */
  protected mapEntityToRow(entity: Partial<Caregiver>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.branchIds !== undefined) row['branch_ids'] = entity.branchIds;
    if (entity.primaryBranchId !== undefined) row['primary_branch_id'] = entity.primaryBranchId;
    if (entity.employeeNumber !== undefined) row['employee_number'] = entity.employeeNumber;
    if (entity.firstName !== undefined) row['first_name'] = entity.firstName;
    if (entity.middleName !== undefined) row['middle_name'] = entity.middleName;
    if (entity.lastName !== undefined) row['last_name'] = entity.lastName;
    if (entity.preferredName !== undefined) row['preferred_name'] = entity.preferredName;
    if (entity.dateOfBirth !== undefined) row['date_of_birth'] = entity.dateOfBirth;
    if (entity.ssn !== undefined) row['ssn'] = entity.ssn;
    if (entity.gender !== undefined) row['gender'] = entity.gender;
    if (entity.pronouns !== undefined) row['pronouns'] = entity.pronouns;
    if (entity.primaryPhone !== undefined) row['primary_phone'] = JSON.stringify(entity.primaryPhone);
    if (entity.alternatePhone !== undefined) row['alternate_phone'] = JSON.stringify(entity.alternatePhone);
    if (entity.email !== undefined) row['email'] = entity.email;
    if (entity.preferredContactMethod !== undefined) row['preferred_contact_method'] = entity.preferredContactMethod;
    if (entity.communicationPreferences !== undefined) row['communication_preferences'] = JSON.stringify(entity.communicationPreferences);
    if (entity.language !== undefined) row['language'] = entity.language;
    if (entity.languages !== undefined) row['languages'] = entity.languages;
    if (entity.ethnicity !== undefined) row['ethnicity'] = entity.ethnicity;
    if (entity.race !== undefined) row['race'] = entity.race;
    if (entity.primaryAddress !== undefined) row['primary_address'] = JSON.stringify(entity.primaryAddress);
    if (entity.mailingAddress !== undefined) row['mailing_address'] = JSON.stringify(entity.mailingAddress);
    if (entity.emergencyContacts !== undefined) row['emergency_contacts'] = JSON.stringify(entity.emergencyContacts);
    if (entity.employmentType !== undefined) row['employment_type'] = entity.employmentType;
    if (entity.employmentStatus !== undefined) row['employment_status'] = entity.employmentStatus;
    if (entity.hireDate !== undefined) row['hire_date'] = entity.hireDate;
    if (entity.terminationDate !== undefined) row['termination_date'] = entity.terminationDate;
    if (entity.terminationReason !== undefined) row['termination_reason'] = entity.terminationReason;
    if (entity.rehireEligible !== undefined) row['rehire_eligible'] = entity.rehireEligible;
    if (entity.role !== undefined) row['role'] = entity.role;
    if (entity.permissions !== undefined) row['permissions'] = entity.permissions;
    if (entity.supervisorId !== undefined) row['supervisor_id'] = entity.supervisorId;
    if (entity.credentials !== undefined) row['credentials'] = JSON.stringify(entity.credentials);
    if (entity.backgroundCheck !== undefined) row['background_check'] = JSON.stringify(entity.backgroundCheck);
    if (entity.drugScreening !== undefined) row['drug_screening'] = JSON.stringify(entity.drugScreening);
    if (entity.healthScreening !== undefined) row['health_screening'] = JSON.stringify(entity.healthScreening);
    if (entity.training !== undefined) row['training'] = JSON.stringify(entity.training);
    if (entity.skills !== undefined) row['skills'] = JSON.stringify(entity.skills);
    if (entity.specializations !== undefined) row['specializations'] = entity.specializations;
    if (entity.availability !== undefined) row['availability'] = JSON.stringify(entity.availability);
    if (entity.workPreferences !== undefined) row['work_preferences'] = JSON.stringify(entity.workPreferences);
    if (entity.maxHoursPerWeek !== undefined) row['max_hours_per_week'] = entity.maxHoursPerWeek;
    if (entity.minHoursPerWeek !== undefined) row['min_hours_per_week'] = entity.minHoursPerWeek;
    if (entity.willingToTravel !== undefined) row['willing_to_travel'] = entity.willingToTravel;
    if (entity.maxTravelDistance !== undefined) row['max_travel_distance'] = entity.maxTravelDistance;
    if (entity.payRate !== undefined) row['pay_rate'] = JSON.stringify(entity.payRate);
    if (entity.alternatePayRates !== undefined) row['alternate_pay_rates'] = JSON.stringify(entity.alternatePayRates);
    if (entity.payrollInfo !== undefined) row['payroll_info'] = JSON.stringify(entity.payrollInfo);
    if (entity.performanceRating !== undefined) row['performance_rating'] = entity.performanceRating;
    if (entity.lastReviewDate !== undefined) row['last_review_date'] = entity.lastReviewDate;
    if (entity.nextReviewDate !== undefined) row['next_review_date'] = entity.nextReviewDate;
    if (entity.complianceStatus !== undefined) row['compliance_status'] = entity.complianceStatus;
    if (entity.lastComplianceCheck !== undefined) row['last_compliance_check'] = entity.lastComplianceCheck;
    if (entity.reliabilityScore !== undefined) row['reliability_score'] = entity.reliabilityScore;
    if (entity.preferredClients !== undefined) row['preferred_clients'] = entity.preferredClients;
    if (entity.restrictedClients !== undefined) row['restricted_clients'] = entity.restrictedClients;
    if (entity.status !== undefined) row['status'] = entity.status;
    if (entity.statusReason !== undefined) row['status_reason'] = entity.statusReason;
    if (entity.documents !== undefined) row['documents'] = JSON.stringify(entity.documents);
    if (entity.notes !== undefined) row['notes'] = entity.notes;
    if (entity.customFields !== undefined) row['custom_fields'] = JSON.stringify(entity.customFields);

    return row;
  }

  /**
   * Find caregiver by email
   * 
   * Used to link authenticated users to their caregiver profile.
   * This is a temporary solution. Once user_id field is added to caregivers table,
   * this method should be refactored to use direct user_id lookup for better performance.
   * 
   * @param email - Email address to search for (case-insensitive)
   * @returns Caregiver profile if found, null otherwise
   */
  async findByEmail(email: string): Promise<Caregiver | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE LOWER(email) = LOWER($1)
        AND deleted_at IS NULL
    `;

    const result = await this.database.query(query, [email]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]!);
  }

  /**
   * Find caregiver by employee number
   */
  async findByEmployeeNumber(
    employeeNumber: string,
    organizationId: string
  ): Promise<Caregiver | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE employee_number = $1 
        AND organization_id = $2
        AND deleted_at IS NULL
    `;

    const result = await this.database.query(query, [employeeNumber, organizationId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]!);
  }

  /**
   * Search caregivers with filters
   */
  async search(
    filters: CaregiverSearchFilters,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResult<Caregiver>> {
    const whereClauses: string[] = ['deleted_at IS NULL'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.query) {
      whereClauses.push(`(
        first_name ILIKE $${paramIndex} OR 
        last_name ILIKE $${paramIndex} OR 
        employee_number ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.query}%`);
      paramIndex++;
    }

    if (filters.organizationId) {
      whereClauses.push(`organization_id = $${paramIndex}`);
      params.push(filters.organizationId);
      paramIndex++;
    }

    if (filters.branchId) {
      whereClauses.push(`$${paramIndex} = ANY(branch_ids)`);
      params.push(filters.branchId);
      paramIndex++;
    }

    if (filters.status && filters.status.length > 0) {
      whereClauses.push(`status = ANY($${paramIndex})`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.role && filters.role.length > 0) {
      whereClauses.push(`role = ANY($${paramIndex})`);
      params.push(filters.role);
      paramIndex++;
    }

    if (filters.employmentType && filters.employmentType.length > 0) {
      whereClauses.push(`employment_type = ANY($${paramIndex})`);
      params.push(filters.employmentType);
      paramIndex++;
    }

    if (filters.complianceStatus && filters.complianceStatus.length > 0) {
      whereClauses.push(`compliance_status = ANY($${paramIndex})`);
      params.push(filters.complianceStatus);
      paramIndex++;
    }

    if (filters.skills && filters.skills.length > 0) {
      whereClauses.push(`skills::jsonb @> $${paramIndex}::jsonb`);
      params.push(JSON.stringify(filters.skills.map(skill => ({ name: skill }))));
      paramIndex++;
    }

    if (filters.languages && filters.languages.length > 0) {
      whereClauses.push(`languages && $${paramIndex}`);
      params.push(filters.languages);
      paramIndex++;
    }

    if (filters.city) {
      whereClauses.push(`primary_address::jsonb->>'city' ILIKE $${paramIndex}`);
      params.push(`%${filters.city}%`);
      paramIndex++;
    }

    if (filters.state) {
      whereClauses.push(`primary_address::jsonb->>'state' = $${paramIndex}`);
      params.push(filters.state);
      paramIndex++;
    }

    if (filters.credentialExpiring) {
      whereClauses.push(`
        credentials::jsonb @> '[{"status": "ACTIVE"}]'::jsonb
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(credentials) AS cred
          WHERE (cred->>'expirationDate')::date <= CURRENT_DATE + INTERVAL '30 days'
        )
      `);
    }

    const whereClause = whereClauses.join(' AND ');

    // Count total
    const countQuery = `SELECT COUNT(*) FROM ${this.tableName} WHERE ${whereClause}`;
    const countResult = await this.database.query(countQuery, params);
    const total = parseInt(String(countResult.rows[0]!['count']));

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
   * Find caregivers by branch
   */
  async findByBranch(branchId: string, activeOnly: boolean = true): Promise<Caregiver[]> {
    const statusFilter = activeOnly ? "AND status = 'ACTIVE'" : '';
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE $1 = ANY(branch_ids)
        AND deleted_at IS NULL
        ${statusFilter}
      ORDER BY last_name, first_name
    `;

    const result = await this.database.query(query, [branchId]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find caregivers by supervisor
   */
  async findBySupervisor(supervisorId: string): Promise<Caregiver[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE supervisor_id = $1
        AND deleted_at IS NULL
        AND status IN ('ACTIVE', 'ON_LEAVE')
      ORDER BY last_name, first_name
    `;

    const result = await this.database.query(query, [supervisorId]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find caregivers with expiring credentials
   */
  async findWithExpiringCredentials(
    organizationId: string,
    daysUntilExpiration: number = 30
  ): Promise<Caregiver[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE organization_id = $1
        AND deleted_at IS NULL
        AND status = 'ACTIVE'
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(credentials) AS cred
          WHERE cred->>'status' = 'ACTIVE'
            AND (cred->>'expirationDate')::date <= CURRENT_DATE + $2 * INTERVAL '1 day'
            AND (cred->>'expirationDate')::date >= CURRENT_DATE
        )
      ORDER BY last_name, first_name
    `;

    const result = await this.database.query(query, [organizationId, daysUntilExpiration]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find caregivers by compliance status
   */
  async findByComplianceStatus(
    organizationId: string,
    complianceStatus: string[]
  ): Promise<Caregiver[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE organization_id = $1
        AND deleted_at IS NULL
        AND compliance_status = ANY($2)
      ORDER BY compliance_status DESC, last_name, first_name
    `;

    const result = await this.database.query(query, [organizationId, complianceStatus]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find available caregivers for a specific day and time
   */
  async findAvailableForShift(
    organizationId: string,
    branchId: string,
    dayOfWeek: string
  ): Promise<Caregiver[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE organization_id = $1
        AND $2 = ANY(branch_ids)
        AND deleted_at IS NULL
        AND status = 'ACTIVE'
        AND compliance_status = 'COMPLIANT'
        AND availability::jsonb->>$3 IS NOT NULL
      ORDER BY reliability_score DESC NULLS LAST, last_name, first_name
    `;

    const result = await this.database.query(query, [
      organizationId,
      branchId,
      dayOfWeek.toLowerCase(),
    ]);

    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Update compliance status
   */
  async updateComplianceStatus(
    caregiverId: string,
    complianceStatus: string,
    context: UserContext
  ): Promise<Caregiver> {
    return this.update(
      caregiverId,
      {
        complianceStatus: complianceStatus as ComplianceStatus,
        lastComplianceCheck: new Date(),
      },
      context
    );
  }

  /**
   * Generate next employee number
   */
  async generateEmployeeNumber(organizationId: string): Promise<string> {
    const query = `
      SELECT employee_number FROM ${this.tableName}
      WHERE organization_id = $1
        AND employee_number ~ '^[0-9]+$'
      ORDER BY CAST(employee_number AS INTEGER) DESC
      LIMIT 1
    `;

    const result = await this.database.query(query, [organizationId]);

    if (result.rows.length === 0) {
      return '1001'; // Start at 1001
    }

    const lastNumber = parseInt(String(result.rows[0]!['employee_number']));
    return (lastNumber + 1).toString();
  }

  /**
   * Create service authorization for caregiver
   */
  async createServiceAuthorization(data: {
    caregiverId: string;
    serviceTypeCode: string;
    serviceTypeName: string;
    authorizationSource?: string;
    effectiveDate: Date;
    expirationDate?: Date;
    notes?: string;
  }, context: UserContext): Promise<string> {
    const query = `
      INSERT INTO caregiver_service_authorizations (
        caregiver_id, service_type_code, service_type_name,
        authorization_source, effective_date, expiration_date,
        notes, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const result = await this.database.query(query, [
      data.caregiverId,
      data.serviceTypeCode,
      data.serviceTypeName,
      data.authorizationSource || 'MANUAL',
      data.effectiveDate,
      data.expirationDate || null,
      data.notes || null,
      context.userId,
      context.userId
    ]);

    return result.rows[0]!['id'] as string;
  }

  /**
   * Get service authorizations for caregiver
   */
  async getServiceAuthorizations(caregiverId: string): Promise<ServiceAuthorization[]> {
    const query = `
      SELECT * FROM caregiver_service_authorizations
      WHERE caregiver_id = $1
      ORDER BY service_type_code
    `;

    const result = await this.database.query(query, [caregiverId]);
    return result.rows.map(row => ({
      id: row['id'] as string,
      caregiverId: row['caregiver_id'] as string,
      serviceTypeCode: row['service_type_code'] as string,
      serviceTypeName: row['service_type_name'] as string,
      authorizationSource: row['authorization_source'] as string,
      effectiveDate: row['effective_date'] as Date,
      expirationDate: row['expiration_date'] as Date | null,
      status: row['status'] as 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED',
      notes: row['notes'] as string | null,
      createdAt: row['created_at'] as Date,
      updatedAt: row['updated_at'] as Date
    }));
  }

  /**
   * Create state screening record
   */
  async createStateScreening(data: {
    caregiverId: string;
    stateCode: string;
    screeningType: string;
    initiatedBy: string;
    initiatedAt: Date;
  }): Promise<string> {
    const query = `
      INSERT INTO caregiver_state_screenings (
        caregiver_id, state_code, screening_type,
        initiation_date, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const result = await this.database.query(query, [
      data.caregiverId,
      data.stateCode,
      data.screeningType,
      data.initiatedAt,
      data.initiatedBy,
      data.initiatedBy
    ]);

    return result.rows[0]!['id'] as string;
  }

  /**
   * Update state screening record
   */
  async updateStateScreening(
    screeningId: string,
    updates: {
      status?: string;
      completionDate?: Date;
      expirationDate?: Date;
      confirmationNumber?: string;
      clearanceNumber?: string;
      results?: Record<string, unknown>;
      notes?: string;
    },
    context: UserContext
  ): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.completionDate !== undefined) {
      fields.push(`completion_date = $${paramIndex++}`);
      values.push(updates.completionDate);
    }
    if (updates.expirationDate !== undefined) {
      fields.push(`expiration_date = $${paramIndex++}`);
      values.push(updates.expirationDate);
    }
    if (updates.confirmationNumber !== undefined) {
      fields.push(`confirmation_number = $${paramIndex++}`);
      values.push(updates.confirmationNumber);
    }
    if (updates.clearanceNumber !== undefined) {
      fields.push(`clearance_number = $${paramIndex++}`);
      values.push(updates.clearanceNumber);
    }
    if (updates.results !== undefined) {
      fields.push(`results = $${paramIndex++}`);
      values.push(JSON.stringify(updates.results));
    }
    if (updates.notes !== undefined) {
      fields.push(`notes = $${paramIndex++}`);
      values.push(updates.notes);
    }

    fields.push(`updated_by = $${paramIndex++}`);
    values.push(context.userId);

    values.push(screeningId);

    const query = `
      UPDATE caregiver_state_screenings
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
    `;

    await this.database.query(query, values);
  }

  /**
   * Get state screenings for caregiver
   */
  async getStateScreenings(caregiverId: string): Promise<StateScreening[]> {
    const query = `
      SELECT * FROM caregiver_state_screenings
      WHERE caregiver_id = $1
      ORDER BY initiation_date DESC
    `;

    const result = await this.database.query(query, [caregiverId]);
    return result.rows.map(row => ({
      id: row['id'] as string,
      caregiverId: row['caregiver_id'] as string,
      stateCode: row['state_code'] as string,
      screeningType: row['screening_type'] as string,
      status: row['status'] as string,
      initiationDate: row['initiation_date'] as Date,
      completionDate: row['completion_date'] as Date | null,
      expirationDate: row['expiration_date'] as Date | null,
      confirmationNumber: row['confirmation_number'] as string | null,
      clearanceNumber: row['clearance_number'] as string | null,
      results: row['results'] ? JSON.parse(row['results'] as string) : null,
      notes: row['notes'] as string | null,
      createdAt: row['created_at'] as Date,
      updatedAt: row['updated_at'] as Date
    }));
  }
}

interface ServiceAuthorization {
  id: string;
  caregiverId: string;
  serviceTypeCode: string;
  serviceTypeName: string;
  authorizationSource: string;
  effectiveDate: Date;
  expirationDate: Date | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface StateScreening {
  id: string;
  caregiverId: string;
  stateCode: string;
  screeningType: string;
  status: string;
  initiationDate: Date;
  completionDate: Date | null;
  expirationDate: Date | null;
  confirmationNumber: string | null;
  clearanceNumber: string | null;
  results: Record<string, unknown> | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
