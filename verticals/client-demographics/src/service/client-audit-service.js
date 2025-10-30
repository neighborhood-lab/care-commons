"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientAuditService = void 0;
class ClientAuditService {
    constructor(db) {
        this.db = db;
    }
    async logAccess(entry) {
        this.validateEntry(entry);
        const result = await this.db.query(`INSERT INTO client_access_audit (
        client_id,
        accessed_by,
        access_type,
        access_timestamp,
        access_reason,
        ip_address,
        user_agent,
        disclosure_recipient,
        disclosure_method,
        authorization_reference,
        information_disclosed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`, [
            entry.clientId,
            entry.accessedBy,
            entry.accessType,
            entry.accessTimestamp || new Date(),
            entry.accessReason,
            entry.ipAddress,
            entry.userAgent,
            entry.disclosureRecipient,
            entry.disclosureMethod,
            entry.authorizationReference,
            entry.informationDisclosed,
        ]);
        return result.rows[0].id;
    }
    async logDisclosure(clientId, accessedBy, recipient, method, informationDisclosed, authorizationRef, reason, ipAddress, userAgent) {
        return this.logAccess({
            clientId,
            accessedBy,
            accessType: 'DISCLOSURE',
            accessTimestamp: new Date(),
            accessReason: reason,
            ipAddress,
            userAgent,
            disclosureRecipient: recipient,
            disclosureMethod: method,
            authorizationReference: authorizationRef,
            informationDisclosed,
        });
    }
    async queryAuditLog(query) {
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        if (query.clientId) {
            conditions.push(`client_id = $${paramIndex++}`);
            params.push(query.clientId);
        }
        if (query.accessedBy) {
            conditions.push(`accessed_by = $${paramIndex++}`);
            params.push(query.accessedBy);
        }
        if (query.accessType && query.accessType.length > 0) {
            conditions.push(`access_type = ANY($${paramIndex++})`);
            params.push(query.accessType);
        }
        if (query.startDate) {
            conditions.push(`access_timestamp >= $${paramIndex++}`);
            params.push(query.startDate);
        }
        if (query.endDate) {
            conditions.push(`access_timestamp <= $${paramIndex++}`);
            params.push(query.endDate);
        }
        if (query.disclosuresOnly) {
            conditions.push(`access_type = 'DISCLOSURE'`);
        }
        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';
        const countResult = await this.db.query(`SELECT COUNT(*) as total FROM client_access_audit ${whereClause}`, params);
        const totalCount = parseInt(countResult.rows[0].total, 10);
        const limit = query.limit || 100;
        const offset = query.offset || 0;
        const entriesResult = await this.db.query(`SELECT * FROM client_access_audit ${whereClause}
       ORDER BY access_timestamp DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`, [...params, limit, offset]);
        const disclosureResult = await this.db.query(`SELECT COUNT(*) as count FROM client_access_audit 
       ${whereClause}${whereClause ? ' AND' : 'WHERE'} access_type = 'DISCLOSURE'`, params);
        const disclosureCount = parseInt(disclosureResult.rows[0].count, 10);
        return {
            entries: entriesResult.rows.map(this.mapRowToEntry),
            totalCount,
            clientId: query.clientId,
            dateRange: {
                start: query.startDate || new Date(0),
                end: query.endDate || new Date(),
            },
            disclosureCount,
            accessCount: totalCount - disclosureCount,
        };
    }
    async getDisclosureHistory(clientId, startDate, endDate) {
        const sixYearsAgo = new Date();
        sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);
        const report = await this.queryAuditLog({
            clientId,
            accessType: ['DISCLOSURE'],
            startDate: startDate || sixYearsAgo,
            endDate: endDate || new Date(),
            limit: 1000,
        });
        return report.entries;
    }
    async getAccessSummary(clientId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const report = await this.queryAuditLog({
            clientId,
            startDate,
            limit: 10000,
        });
        const accessByType = new Map();
        const accessByUser = new Map();
        for (const entry of report.entries) {
            const typeCount = accessByType.get(entry.accessType) || 0;
            accessByType.set(entry.accessType, typeCount + 1);
            const userCount = accessByUser.get(entry.accessedBy) || 0;
            accessByUser.set(entry.accessedBy, userCount + 1);
        }
        const unusualPatterns = [];
        for (const [userId, count] of accessByUser.entries()) {
            if (count > 50) {
                unusualPatterns.push(`User ${userId} accessed record ${count} times in ${days} days`);
            }
        }
        const afterHoursAccess = report.entries.filter((entry) => {
            const hour = entry.accessTimestamp.getHours();
            return hour < 6 || hour > 22;
        });
        if (afterHoursAccess.length > 5) {
            unusualPatterns.push(`${afterHoursAccess.length} access events outside normal hours`);
        }
        return {
            totalAccess: report.totalCount,
            accessByType,
            accessByUser,
            disclosures: report.disclosureCount,
            suspiciousActivity: unusualPatterns.length > 0,
            unusualAccessPatterns: unusualPatterns,
        };
    }
    async exportAuditLog(query) {
        const report = await this.queryAuditLog({ ...query, limit: 100000 });
        const headers = [
            'Timestamp',
            'Client ID',
            'Accessed By',
            'Access Type',
            'Reason',
            'IP Address',
            'Disclosure Recipient',
            'Disclosure Method',
            'Authorization',
            'Information Disclosed',
        ];
        const rows = report.entries.map((entry) => [
            entry.accessTimestamp.toISOString(),
            entry.clientId,
            entry.accessedBy,
            entry.accessType,
            entry.accessReason || '',
            entry.ipAddress || '',
            entry.disclosureRecipient || '',
            entry.disclosureMethod || '',
            entry.authorizationReference || '',
            entry.informationDisclosed || '',
        ]);
        const csv = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');
        await this.logAccess({
            clientId: query.clientId || '00000000-0000-0000-0000-000000000000',
            accessedBy: 'SYSTEM',
            accessType: 'EXPORT',
            accessTimestamp: new Date(),
            accessReason: 'Audit log export for compliance reporting',
        });
        return csv;
    }
    validateEntry(entry) {
        if (!entry.clientId) {
            throw new Error('Client ID is required for audit log');
        }
        if (!entry.accessedBy) {
            throw new Error('Accessed by user ID is required for audit log');
        }
        if (!entry.accessType) {
            throw new Error('Access type is required for audit log');
        }
        if (entry.accessType === 'DISCLOSURE') {
            if (!entry.disclosureRecipient) {
                throw new Error('Disclosure recipient is required for DISCLOSURE type');
            }
            if (!entry.disclosureMethod) {
                throw new Error('Disclosure method is required for DISCLOSURE type');
            }
            if (!entry.informationDisclosed) {
                throw new Error('Information disclosed is required for DISCLOSURE type');
            }
        }
    }
    mapRowToEntry(row) {
        return {
            id: row.id,
            clientId: row.client_id,
            accessedBy: row.accessed_by,
            accessType: row.access_type,
            accessTimestamp: row.access_timestamp,
            accessReason: row.access_reason,
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
            disclosureRecipient: row.disclosure_recipient,
            disclosureMethod: row.disclosure_method,
            authorizationReference: row.authorization_reference,
            informationDisclosed: row.information_disclosed,
        };
    }
}
exports.ClientAuditService = ClientAuditService;
//# sourceMappingURL=client-audit-service.js.map