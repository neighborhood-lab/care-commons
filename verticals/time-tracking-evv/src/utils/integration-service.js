"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationService = void 0;
const core_1 = require("@care-commons/core");
class IntegrationService {
    constructor(database) {
        this.database = database;
    }
    async getVisitData(visitId) {
        const query = `
      SELECT 
        v.id as visit_id,
        v.organization_id,
        v.branch_id,
        v.client_id,
        v.assigned_caregiver_id,
        v.service_type_code,
        v.service_type_name,
        v.scheduled_date,
        v.scheduled_start_time,
        v.scheduled_end_time,
        v.scheduled_duration,
        v.address,
        c.first_name,
        c.middle_name,
        c.last_name,
        c.primary_address,
        se.medicaid_number
      FROM visits v
      INNER JOIN clients c ON v.client_id = c.id
      LEFT JOIN (
        SELECT client_id, medicaid_number
        FROM clients, 
        jsonb_to_recordset(service_eligibility::jsonb) 
        AS x(medicaid_number text)
        WHERE medicaid_number IS NOT NULL
      ) se ON c.id = se.client_id
      WHERE v.id = $1
    `;
        const result = await this.database.query(query, [visitId]);
        if (!result.rows[0]) {
            throw new core_1.NotFoundError(`Visit ${visitId} not found`);
        }
        const row = result.rows[0];
        const address = typeof row.address === 'string'
            ? JSON.parse(row.address)
            : row.address;
        const nameParts = [row.first_name, row.middle_name, row.last_name].filter(Boolean);
        const clientName = nameParts.join(' ');
        const serviceAddress = address || (typeof row.primary_address === 'string'
            ? JSON.parse(row.primary_address)
            : row.primary_address);
        return {
            visitId: row.visit_id,
            organizationId: row.organization_id,
            branchId: row.branch_id,
            clientId: row.client_id,
            clientName,
            clientMedicaidId: row.medicaid_number,
            caregiverId: row.assigned_caregiver_id,
            serviceTypeCode: row.service_type_code,
            serviceTypeName: row.service_type_name,
            serviceDate: row.scheduled_date,
            scheduledStartTime: this.combineDateTime(row.scheduled_date, row.scheduled_start_time),
            scheduledEndTime: this.combineDateTime(row.scheduled_date, row.scheduled_end_time),
            scheduledDuration: row.scheduled_duration,
            serviceAddress: {
                line1: serviceAddress.line1,
                line2: serviceAddress.line2,
                city: serviceAddress.city,
                state: serviceAddress.state,
                postalCode: serviceAddress.postalCode,
                country: serviceAddress.country || 'US',
                latitude: serviceAddress.latitude || 0,
                longitude: serviceAddress.longitude || 0,
                geofenceRadius: serviceAddress.geofenceRadius || 100,
                addressVerified: serviceAddress.addressVerified || false,
                addressId: this.generateAddressId(serviceAddress),
            },
        };
    }
    async getCaregiverData(caregiverId) {
        const query = `
      SELECT 
        id,
        first_name,
        middle_name,
        last_name,
        employee_number,
        credentials
      FROM caregivers
      WHERE id = $1
    `;
        const result = await this.database.query(query, [caregiverId]);
        if (!result.rows[0]) {
            throw new core_1.NotFoundError(`Caregiver ${caregiverId} not found`);
        }
        const row = result.rows[0];
        const nameParts = [row.first_name, row.middle_name, row.last_name].filter(Boolean);
        const caregiverName = nameParts.join(' ');
        let npi;
        try {
            const credentials = typeof row.credentials === 'string'
                ? JSON.parse(row.credentials)
                : row.credentials;
            if (Array.isArray(credentials)) {
                const npiCred = credentials.find(c => c.type === 'NPI' || c.type === 'PROVIDER_ID');
                if (npiCred) {
                    npi = npiCred.number;
                }
            }
        }
        catch (e) {
        }
        return {
            caregiverId: row.id,
            caregiverName,
            employeeNumber: row.employee_number,
            npi,
        };
    }
    async updateVisitStatus(visitId, status, updatedBy) {
        const query = `
      UPDATE visits
      SET status = $1,
          updated_at = NOW(),
          updated_by = $2
      WHERE id = $3
    `;
        await this.database.query(query, [status, updatedBy, visitId]);
    }
    async updateVisitTiming(visitId, actualStartTime, actualEndTime, actualDuration, updatedBy) {
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (actualStartTime) {
            updates.push(`actual_start_time = $${paramIndex}`);
            values.push(actualStartTime);
            paramIndex++;
        }
        if (actualEndTime) {
            updates.push(`actual_end_time = $${paramIndex}`);
            values.push(actualEndTime);
            paramIndex++;
        }
        if (actualDuration !== undefined) {
            updates.push(`actual_duration = $${paramIndex}`);
            values.push(actualDuration);
            paramIndex++;
        }
        if (updates.length === 0) {
            return;
        }
        updates.push(`updated_at = NOW()`);
        if (updatedBy) {
            updates.push(`updated_by = $${paramIndex}`);
            values.push(updatedBy);
            paramIndex++;
        }
        values.push(visitId);
        const query = `
      UPDATE visits
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `;
        await this.database.query(query, values);
    }
    combineDateTime(date, time) {
        const dateObj = new Date(date);
        const [hours, minutes, seconds] = time.split(':').map(Number);
        dateObj.setHours(hours || 0, minutes || 0, seconds || 0, 0);
        return dateObj;
    }
    generateAddressId(address) {
        const addressString = `${address.line1}|${address.city}|${address.state}|${address.postalCode}`;
        const hash = this.simpleHash(addressString);
        return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
    }
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(32, '0');
    }
}
exports.IntegrationService = IntegrationService;
//# sourceMappingURL=integration-service.js.map