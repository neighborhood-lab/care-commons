import { Database } from '../db/connection';
import { UserContext, Timestamp } from '../types/base';
export interface AuditEvent {
    eventId: string;
    timestamp: Timestamp;
    userId: string;
    organizationId: string;
    eventType: AuditEventType;
    resource: string;
    resourceId: string;
    action: string;
    result: 'SUCCESS' | 'FAILURE';
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}
export type AuditEventType = 'AUTHENTICATION' | 'AUTHORIZATION' | 'DATA_ACCESS' | 'DATA_MODIFICATION' | 'CONFIGURATION' | 'SECURITY' | 'COMPLIANCE';
export declare class AuditService {
    private database;
    constructor(database: Database);
    logEvent(context: UserContext, event: Omit<AuditEvent, 'eventId' | 'timestamp' | 'userId' | 'organizationId'>): Promise<void>;
    logDataAccess(context: UserContext, resource: string, resourceId: string, action: 'READ' | 'SEARCH', metadata?: Record<string, unknown>): Promise<void>;
    logDataModification(context: UserContext, resource: string, resourceId: string, action: 'CREATE' | 'UPDATE' | 'DELETE', metadata?: Record<string, unknown>): Promise<void>;
    logSecurityEvent(context: UserContext, action: string, result: 'SUCCESS' | 'FAILURE', metadata?: Record<string, unknown>): Promise<void>;
    getAuditTrail(resourceType: string, resourceId: string, limit?: number): Promise<AuditEvent[]>;
}
//# sourceMappingURL=audit-service.d.ts.map