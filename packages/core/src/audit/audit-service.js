"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const uuid_1 = require("uuid");
class AuditService {
    constructor(database) {
        this.database = database;
    }
    async logEvent(context, event) {
        const eventId = (0, uuid_1.v4)();
        const timestamp = new Date();
        const query = `
      INSERT INTO audit_events (
        event_id, timestamp, user_id, organization_id, event_type,
        resource, resource_id, action, result, metadata, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;
        await this.database.query(query, [
            eventId,
            timestamp,
            context.userId,
            context.organizationId,
            event.eventType,
            event.resource,
            event.resourceId,
            event.action,
            event.result,
            JSON.stringify(event.metadata || {}),
            event.ipAddress,
            event.userAgent,
        ]);
    }
    async logDataAccess(context, resource, resourceId, action, metadata) {
        await this.logEvent(context, {
            eventType: 'DATA_ACCESS',
            resource,
            resourceId,
            action,
            result: 'SUCCESS',
            metadata,
        });
    }
    async logDataModification(context, resource, resourceId, action, metadata) {
        await this.logEvent(context, {
            eventType: 'DATA_MODIFICATION',
            resource,
            resourceId,
            action,
            result: 'SUCCESS',
            metadata,
        });
    }
    async logSecurityEvent(context, action, result, metadata) {
        await this.logEvent(context, {
            eventType: 'SECURITY',
            resource: 'SECURITY',
            resourceId: context.userId,
            action,
            result,
            metadata,
        });
    }
    async getAuditTrail(resourceType, resourceId, limit = 100) {
        const query = `
      SELECT * FROM audit_events
      WHERE resource = $1 AND resource_id = $2
      ORDER BY timestamp DESC
      LIMIT $3
    `;
        const result = await this.database.query(query, [
            resourceType,
            resourceId,
            limit,
        ]);
        return result.rows.map((row) => ({
            eventId: row.event_id,
            timestamp: row.timestamp,
            userId: row.user_id,
            organizationId: row.organization_id,
            eventType: row.event_type,
            resource: row.resource,
            resourceId: row.resource_id,
            action: row.action,
            result: row.result,
            metadata: JSON.parse(row.metadata || '{}'),
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
        }));
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=audit-service.js.map