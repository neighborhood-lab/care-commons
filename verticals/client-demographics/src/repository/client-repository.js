"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientRepository = void 0;
const core_1 = require("@care-commons/core");
class ClientRepository extends core_1.Repository {
    constructor(database) {
        super({
            tableName: 'clients',
            database,
            enableAudit: true,
            enableSoftDelete: true,
        });
    }
    mapRowToEntity(row) {
        return {
            id: row.id,
            organizationId: row.organization_id,
            branchId: row.branch_id,
            clientNumber: row.client_number,
            firstName: row.first_name,
            middleName: row.middle_name,
            lastName: row.last_name,
            preferredName: row.preferred_name,
            dateOfBirth: row.date_of_birth,
            ssn: row.ssn,
            gender: row.gender,
            pronouns: row.pronouns,
            primaryPhone: row.primary_phone ? JSON.parse(row.primary_phone) : undefined,
            alternatePhone: row.alternate_phone ? JSON.parse(row.alternate_phone) : undefined,
            email: row.email,
            preferredContactMethod: row.preferred_contact_method,
            communicationPreferences: row.communication_preferences
                ? JSON.parse(row.communication_preferences)
                : undefined,
            language: row.language,
            ethnicity: row.ethnicity,
            race: row.race ? JSON.parse(row.race) : undefined,
            maritalStatus: row.marital_status,
            veteranStatus: row.veteran_status,
            primaryAddress: JSON.parse(row.primary_address),
            secondaryAddresses: row.secondary_addresses
                ? JSON.parse(row.secondary_addresses)
                : undefined,
            livingArrangement: row.living_arrangement
                ? JSON.parse(row.living_arrangement)
                : undefined,
            mobilityInfo: row.mobility_info ? JSON.parse(row.mobility_info) : undefined,
            emergencyContacts: JSON.parse(row.emergency_contacts || '[]'),
            authorizedContacts: JSON.parse(row.authorized_contacts || '[]'),
            primaryPhysician: row.primary_physician
                ? JSON.parse(row.primary_physician)
                : undefined,
            pharmacy: row.pharmacy ? JSON.parse(row.pharmacy) : undefined,
            insurance: row.insurance ? JSON.parse(row.insurance) : undefined,
            medicalRecordNumber: row.medical_record_number,
            programs: JSON.parse(row.programs || '[]'),
            serviceEligibility: JSON.parse(row.service_eligibility),
            fundingSources: row.funding_sources ? JSON.parse(row.funding_sources) : undefined,
            riskFlags: JSON.parse(row.risk_flags || '[]'),
            allergies: row.allergies ? JSON.parse(row.allergies) : undefined,
            specialInstructions: row.special_instructions,
            accessInstructions: row.access_instructions,
            status: row.status,
            intakeDate: row.intake_date,
            dischargeDate: row.discharge_date,
            dischargeReason: row.discharge_reason,
            referralSource: row.referral_source,
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
        if (entity.branchId !== undefined)
            row.branch_id = entity.branchId;
        if (entity.clientNumber !== undefined)
            row.client_number = entity.clientNumber;
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
        if (entity.ethnicity !== undefined)
            row.ethnicity = entity.ethnicity;
        if (entity.race !== undefined)
            row.race = JSON.stringify(entity.race);
        if (entity.maritalStatus !== undefined)
            row.marital_status = entity.maritalStatus;
        if (entity.veteranStatus !== undefined)
            row.veteran_status = entity.veteranStatus;
        if (entity.primaryAddress !== undefined)
            row.primary_address = JSON.stringify(entity.primaryAddress);
        if (entity.secondaryAddresses !== undefined)
            row.secondary_addresses = JSON.stringify(entity.secondaryAddresses);
        if (entity.livingArrangement !== undefined)
            row.living_arrangement = JSON.stringify(entity.livingArrangement);
        if (entity.mobilityInfo !== undefined)
            row.mobility_info = JSON.stringify(entity.mobilityInfo);
        if (entity.emergencyContacts !== undefined)
            row.emergency_contacts = JSON.stringify(entity.emergencyContacts);
        if (entity.authorizedContacts !== undefined)
            row.authorized_contacts = JSON.stringify(entity.authorizedContacts);
        if (entity.primaryPhysician !== undefined)
            row.primary_physician = JSON.stringify(entity.primaryPhysician);
        if (entity.pharmacy !== undefined)
            row.pharmacy = JSON.stringify(entity.pharmacy);
        if (entity.insurance !== undefined)
            row.insurance = JSON.stringify(entity.insurance);
        if (entity.medicalRecordNumber !== undefined)
            row.medical_record_number = entity.medicalRecordNumber;
        if (entity.programs !== undefined)
            row.programs = JSON.stringify(entity.programs);
        if (entity.serviceEligibility !== undefined)
            row.service_eligibility = JSON.stringify(entity.serviceEligibility);
        if (entity.fundingSources !== undefined)
            row.funding_sources = JSON.stringify(entity.fundingSources);
        if (entity.riskFlags !== undefined)
            row.risk_flags = JSON.stringify(entity.riskFlags);
        if (entity.allergies !== undefined)
            row.allergies = JSON.stringify(entity.allergies);
        if (entity.specialInstructions !== undefined)
            row.special_instructions = entity.specialInstructions;
        if (entity.accessInstructions !== undefined)
            row.access_instructions = entity.accessInstructions;
        if (entity.status !== undefined)
            row.status = entity.status;
        if (entity.intakeDate !== undefined)
            row.intake_date = entity.intakeDate;
        if (entity.dischargeDate !== undefined)
            row.discharge_date = entity.dischargeDate;
        if (entity.dischargeReason !== undefined)
            row.discharge_reason = entity.dischargeReason;
        if (entity.referralSource !== undefined)
            row.referral_source = entity.referralSource;
        if (entity.notes !== undefined)
            row.notes = entity.notes;
        if (entity.customFields !== undefined)
            row.custom_fields = JSON.stringify(entity.customFields);
        return row;
    }
    async findByClientNumber(clientNumber, organizationId) {
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
        client_number ILIKE $${paramIndex}
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
            whereClauses.push(`branch_id = $${paramIndex}`);
            params.push(filters.branchId);
            paramIndex++;
        }
        if (filters.status && filters.status.length > 0) {
            whereClauses.push(`status = ANY($${paramIndex})`);
            params.push(filters.status);
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
      WHERE branch_id = $1 
        AND deleted_at IS NULL
        ${statusFilter}
      ORDER BY last_name, first_name
    `;
        const result = await this.database.query(query, [branchId]);
        return result.rows.map((row) => this.mapRowToEntity(row));
    }
    async findByRiskType(organizationId, riskType) {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE organization_id = $1
        AND deleted_at IS NULL
        AND risk_flags::jsonb @> $2::jsonb
    `;
        const riskFilter = JSON.stringify([{ type: riskType }]);
        const result = await this.database.query(query, [organizationId, riskFilter]);
        return result.rows.map((row) => this.mapRowToEntity(row));
    }
}
exports.ClientRepository = ClientRepository;
//# sourceMappingURL=client-repository.js.map