"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaregiverRepository = void 0;
const core_1 = require("@care-commons/core");
class CaregiverRepository extends core_1.Repository {
    constructor(database) {
        super({
            tableName: 'caregivers',
            database,
            enableAudit: true,
            enableSoftDelete: true,
        });
    }
    mapRowToEntity(row) {
        return {
            id: row.id,
            organizationId: row.organization_id,
            branchIds: row.branch_ids || [],
            primaryBranchId: row.primary_branch_id,
            employeeNumber: row.employee_number,
            firstName: row.first_name,
            middleName: row.middle_name,
            lastName: row.last_name,
            preferredName: row.preferred_name,
            dateOfBirth: row.date_of_birth,
            ssn: row.ssn,
            gender: row.gender,
            pronouns: row.pronouns,
            primaryPhone: JSON.parse(row.primary_phone),
            alternatePhone: row.alternate_phone ? JSON.parse(row.alternate_phone) : undefined,
            email: row.email,
            preferredContactMethod: row.preferred_contact_method,
            communicationPreferences: row.communication_preferences
                ? JSON.parse(row.communication_preferences)
                : undefined,
            language: row.language,
            languages: row.languages || [],
            ethnicity: row.ethnicity,
            race: row.race || [],
            primaryAddress: JSON.parse(row.primary_address),
            mailingAddress: row.mailing_address ? JSON.parse(row.mailing_address) : undefined,
            emergencyContacts: JSON.parse(row.emergency_contacts || '[]'),
            employmentType: row.employment_type,
            employmentStatus: row.employment_status,
            hireDate: row.hire_date,
            terminationDate: row.termination_date,
            terminationReason: row.termination_reason,
            rehireEligible: row.rehire_eligible,
            role: row.role,
            permissions: row.permissions || [],
            supervisorId: row.supervisor_id,
            credentials: JSON.parse(row.credentials || '[]'),
            backgroundCheck: row.background_check ? JSON.parse(row.background_check) : undefined,
            drugScreening: row.drug_screening ? JSON.parse(row.drug_screening) : undefined,
            healthScreening: row.health_screening ? JSON.parse(row.health_screening) : undefined,
            training: JSON.parse(row.training || '[]'),
            skills: JSON.parse(row.skills || '[]'),
            specializations: row.specializations || [],
            availability: JSON.parse(row.availability),
            workPreferences: row.work_preferences ? JSON.parse(row.work_preferences) : undefined,
            maxHoursPerWeek: row.max_hours_per_week,
            minHoursPerWeek: row.min_hours_per_week,
            willingToTravel: row.willing_to_travel,
            maxTravelDistance: row.max_travel_distance,
            payRate: JSON.parse(row.pay_rate),
            alternatePayRates: row.alternate_pay_rates ? JSON.parse(row.alternate_pay_rates) : undefined,
            payrollInfo: row.payroll_info ? JSON.parse(row.payroll_info) : undefined,
            performanceRating: row.performance_rating,
            lastReviewDate: row.last_review_date,
            nextReviewDate: row.next_review_date,
            complianceStatus: row.compliance_status,
            lastComplianceCheck: row.last_compliance_check,
            reliabilityScore: row.reliability_score,
            preferredClients: row.preferred_clients || [],
            restrictedClients: row.restricted_clients || [],
            status: row.status,
            statusReason: row.status_reason,
            documents: row.documents ? JSON.parse(row.documents) : undefined,
            notes: row.notes,
            customFields: row.custom_fields ? JSON.parse(row.custom_fields) : undefined,
            createdAt: row.created_at,
            createdBy: row.created_by,
            updatedAt: row.updated_at,
            updatedBy: row.updated_by,
            version: row.version,
            deletedAt: row.deleted_at,
            deletedBy: row.deleted_by,
        };
    }
    mapEntityToRow(entity) {
        const row = {};
        if (entity.organizationId !== undefined)
            row.organization_id = entity.organizationId;
        if (entity.branchIds !== undefined)
            row.branch_ids = entity.branchIds;
        if (entity.primaryBranchId !== undefined)
            row.primary_branch_id = entity.primaryBranchId;
        if (entity.employeeNumber !== undefined)
            row.employee_number = entity.employeeNumber;
        if (entity.firstName !== undefined)
            row.first_name = entity.firstName;
        if (entity.middleName !== undefined)
            row.middle_name = entity.middleName;
        if (entity.lastName !== undefined)
            row.last_name = entity.lastName;
        if (entity.preferredName !== undefined)
            row.preferred_name = entity.preferredName;
        if (entity.dateOfBirth !== undefined)
            row.date_of_birth = entity.dateOfBirth;
        if (entity.ssn !== undefined)
            row.ssn = entity.ssn;
        if (entity.gender !== undefined)
            row.gender = entity.gender;
        if (entity.pronouns !== undefined)
            row.pronouns = entity.pronouns;
        if (entity.primaryPhone !== undefined)
            row.primary_phone = JSON.stringify(entity.primaryPhone);
        if (entity.alternatePhone !== undefined)
            row.alternate_phone = JSON.stringify(entity.alternatePhone);
        if (entity.email !== undefined)
            row.email = entity.email;
        if (entity.preferredContactMethod !== undefined)
            row.preferred_contact_method = entity.preferredContactMethod;
        if (entity.communicationPreferences !== undefined)
            row.communication_preferences = JSON.stringify(entity.communicationPreferences);
        if (entity.language !== undefined)
            row.language = entity.language;
        if (entity.languages !== undefined)
            row.languages = entity.languages;
        if (entity.ethnicity !== undefined)
            row.ethnicity = entity.ethnicity;
        if (entity.race !== undefined)
            row.race = entity.race;
        if (entity.primaryAddress !== undefined)
            row.primary_address = JSON.stringify(entity.primaryAddress);
        if (entity.mailingAddress !== undefined)
            row.mailing_address = JSON.stringify(entity.mailingAddress);
        if (entity.emergencyContacts !== undefined)
            row.emergency_contacts = JSON.stringify(entity.emergencyContacts);
        if (entity.employmentType !== undefined)
            row.employment_type = entity.employmentType;
        if (entity.employmentStatus !== undefined)
            row.employment_status = entity.employmentStatus;
        if (entity.hireDate !== undefined)
            row.hire_date = entity.hireDate;
        if (entity.terminationDate !== undefined)
            row.termination_date = entity.terminationDate;
        if (entity.terminationReason !== undefined)
            row.termination_reason = entity.terminationReason;
        if (entity.rehireEligible !== undefined)
            row.rehire_eligible = entity.rehireEligible;
        if (entity.role !== undefined)
            row.role = entity.role;
        if (entity.permissions !== undefined)
            row.permissions = entity.permissions;
        if (entity.supervisorId !== undefined)
            row.supervisor_id = entity.supervisorId;
        if (entity.credentials !== undefined)
            row.credentials = JSON.stringify(entity.credentials);
        if (entity.backgroundCheck !== undefined)
            row.background_check = JSON.stringify(entity.backgroundCheck);
        if (entity.drugScreening !== undefined)
            row.drug_screening = JSON.stringify(entity.drugScreening);
        if (entity.healthScreening !== undefined)
            row.health_screening = JSON.stringify(entity.healthScreening);
        if (entity.training !== undefined)
            row.training = JSON.stringify(entity.training);
        if (entity.skills !== undefined)
            row.skills = JSON.stringify(entity.skills);
        if (entity.specializations !== undefined)
            row.specializations = entity.specializations;
        if (entity.availability !== undefined)
            row.availability = JSON.stringify(entity.availability);
        if (entity.workPreferences !== undefined)
            row.work_preferences = JSON.stringify(entity.workPreferences);
        if (entity.maxHoursPerWeek !== undefined)
            row.max_hours_per_week = entity.maxHoursPerWeek;
        if (entity.minHoursPerWeek !== undefined)
            row.min_hours_per_week = entity.minHoursPerWeek;
        if (entity.willingToTravel !== undefined)
            row.willing_to_travel = entity.willingToTravel;
        if (entity.maxTravelDistance !== undefined)
            row.max_travel_distance = entity.maxTravelDistance;
        if (entity.payRate !== undefined)
            row.pay_rate = JSON.stringify(entity.payRate);
        if (entity.alternatePayRates !== undefined)
            row.alternate_pay_rates = JSON.stringify(entity.alternatePayRates);
        if (entity.payrollInfo !== undefined)
            row.payroll_info = JSON.stringify(entity.payrollInfo);
        if (entity.performanceRating !== undefined)
            row.performance_rating = entity.performanceRating;
        if (entity.lastReviewDate !== undefined)
            row.last_review_date = entity.lastReviewDate;
        if (entity.nextReviewDate !== undefined)
            row.next_review_date = entity.nextReviewDate;
        if (entity.complianceStatus !== undefined)
            row.compliance_status = entity.complianceStatus;
        if (entity.lastComplianceCheck !== undefined)
            row.last_compliance_check = entity.lastComplianceCheck;
        if (entity.reliabilityScore !== undefined)
            row.reliability_score = entity.reliabilityScore;
        if (entity.preferredClients !== undefined)
            row.preferred_clients = entity.preferredClients;
        if (entity.restrictedClients !== undefined)
            row.restricted_clients = entity.restrictedClients;
        if (entity.status !== undefined)
            row.status = entity.status;
        if (entity.statusReason !== undefined)
            row.status_reason = entity.statusReason;
        if (entity.documents !== undefined)
            row.documents = JSON.stringify(entity.documents);
        if (entity.notes !== undefined)
            row.notes = entity.notes;
        if (entity.customFields !== undefined)
            row.custom_fields = JSON.stringify(entity.customFields);
        return row;
    }
    async findByEmployeeNumber(employeeNumber, organizationId) {
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
        return this.mapRowToEntity(result.rows[0]);
    }
    async search(filters, pagination) {
        const whereClauses = ['deleted_at IS NULL'];
        const params = [];
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
        const countQuery = `SELECT COUNT(*) FROM ${this.tableName} WHERE ${whereClause}`;
        const countResult = await this.database.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);
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
    async findByBranch(branchId, activeOnly = true) {
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
    async findBySupervisor(supervisorId) {
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
    async findWithExpiringCredentials(organizationId, daysUntilExpiration = 30) {
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
    async findByComplianceStatus(organizationId, complianceStatus) {
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
    async findAvailableForShift(organizationId, branchId, dayOfWeek, shiftStart, shiftEnd) {
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
    async updateComplianceStatus(caregiverId, complianceStatus, context) {
        return this.update(caregiverId, {
            complianceStatus: complianceStatus,
            lastComplianceCheck: new Date(),
        }, context);
    }
    async generateEmployeeNumber(organizationId) {
        const query = `
      SELECT employee_number FROM ${this.tableName}
      WHERE organization_id = $1
        AND employee_number ~ '^[0-9]+$'
      ORDER BY CAST(employee_number AS INTEGER) DESC
      LIMIT 1
    `;
        const result = await this.database.query(query, [organizationId]);
        if (result.rows.length === 0) {
            return '1001';
        }
        const lastNumber = parseInt(result.rows[0].employee_number);
        return (lastNumber + 1).toString();
    }
}
exports.CaregiverRepository = CaregiverRepository;
//# sourceMappingURL=caregiver-repository.js.map