import { UUID } from '@care-commons/core';
export interface DatabaseConnection {
    query(text: string, params?: any[]): Promise<{
        rows: any[];
    }>;
}
export interface ClientAccessAuditEntry {
    id?: UUID;
    clientId: UUID;
    accessedBy: UUID;
    accessType: AccessType;
    accessTimestamp: Date;
    accessReason?: string;
    ipAddress?: string;
    userAgent?: string;
    disclosureRecipient?: string;
    disclosureMethod?: DisclosureMethod;
    authorizationReference?: string;
    informationDisclosed?: string;
}
export type AccessType = 'VIEW' | 'UPDATE' | 'CREATE' | 'DELETE' | 'DISCLOSURE' | 'EXPORT' | 'PRINT';
export type DisclosureMethod = 'VERBAL' | 'WRITTEN' | 'ELECTRONIC' | 'FAX' | 'PORTAL';
export interface AuditQuery {
    clientId?: UUID;
    accessedBy?: UUID;
    accessType?: AccessType[];
    startDate?: Date;
    endDate?: Date;
    disclosuresOnly?: boolean;
    limit?: number;
    offset?: number;
}
export interface AuditReport {
    entries: ClientAccessAuditEntry[];
    totalCount: number;
    clientId?: UUID;
    dateRange: {
        start: Date;
        end: Date;
    };
    disclosureCount: number;
    accessCount: number;
}
export declare class ClientAuditService {
    private db;
    constructor(db: DatabaseConnection);
    logAccess(entry: ClientAccessAuditEntry): Promise<UUID>;
    logDisclosure(clientId: UUID, accessedBy: UUID, recipient: string, method: DisclosureMethod, informationDisclosed: string, authorizationRef?: string, reason?: string, ipAddress?: string, userAgent?: string): Promise<UUID>;
    queryAuditLog(query: AuditQuery): Promise<AuditReport>;
    getDisclosureHistory(clientId: UUID, startDate?: Date, endDate?: Date): Promise<ClientAccessAuditEntry[]>;
    getAccessSummary(clientId: UUID, days?: number): Promise<{
        totalAccess: number;
        accessByType: Map<AccessType, number>;
        accessByUser: Map<UUID, number>;
        disclosures: number;
        suspiciousActivity: boolean;
        unusualAccessPatterns: string[];
    }>;
    exportAuditLog(query: AuditQuery): Promise<string>;
    private validateEntry;
    private mapRowToEntry;
}
//# sourceMappingURL=client-audit-service.d.ts.map