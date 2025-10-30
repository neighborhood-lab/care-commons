"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const audit_service_1 = require("../../audit/audit-service");
const vitest_1 = require("vitest");
const createMockUserContext = (overrides = {}) => ({
    userId: 'test-user-id',
    roles: ['COORDINATOR'],
    permissions: ['clients:read', 'clients:write'],
    organizationId: 'test-org-id',
    branchIds: ['test-branch-id'],
    ...overrides,
});
vitest_1.vi.mock('../../db/connection');
vitest_1.vi.mock('uuid', () => ({
    v4: vitest_1.vi.fn(() => 'test-audit-event-id'),
}));
(0, vitest_1.describe)('AuditService', () => {
    let auditService;
    let mockDatabase;
    let mockUserContext;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockDatabase = {
            query: vitest_1.vi.fn(),
            getClient: vitest_1.vi.fn(),
            transaction: vitest_1.vi.fn(),
            close: vitest_1.vi.fn(),
            healthCheck: vitest_1.vi.fn(),
        };
        auditService = new audit_service_1.AuditService(mockDatabase);
        mockUserContext = createMockUserContext();
    });
    (0, vitest_1.describe)('Event Logging', () => {
        (0, vitest_1.it)('should log a generic audit event successfully', async () => {
            const eventData = {
                eventType: 'DATA_ACCESS',
                resource: 'clients',
                resourceId: 'client-123',
                action: 'READ',
                result: 'SUCCESS',
                metadata: { ip: '192.168.1.1' },
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
            };
            const mockResult = {
                rows: [],
                rowCount: 1,
                command: 'INSERT',
                oid: 0,
                fields: [],
            };
            mockDatabase.query.mockResolvedValue(mockResult);
            await auditService.logEvent(mockUserContext, eventData);
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('INSERT INTO audit_events'), [
                'test-audit-event-id',
                vitest_1.expect.any(Date),
                mockUserContext.userId,
                mockUserContext.organizationId,
                'DATA_ACCESS',
                'clients',
                'client-123',
                'READ',
                'SUCCESS',
                JSON.stringify({ ip: '192.168.1.1' }),
                '192.168.1.1',
                'Mozilla/5.0',
            ]);
        });
        (0, vitest_1.it)('should log event with minimal required data', async () => {
            const eventData = {
                eventType: 'SECURITY',
                resource: 'auth',
                resourceId: 'session-123',
                action: 'LOGIN',
                result: 'SUCCESS',
            };
            const mockResult = { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
            mockDatabase.query.mockResolvedValue(mockResult);
            await auditService.logEvent(mockUserContext, eventData);
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('INSERT INTO audit_events'), [
                'test-audit-event-id',
                vitest_1.expect.any(Date),
                mockUserContext.userId,
                mockUserContext.organizationId,
                'SECURITY',
                'auth',
                'session-123',
                'LOGIN',
                'SUCCESS',
                JSON.stringify({}),
                undefined,
                undefined,
            ]);
        });
    });
    (0, vitest_1.describe)('Data Access Logging', () => {
        (0, vitest_1.it)('should log successful data access', async () => {
            const mockResult = { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
            mockDatabase.query.mockResolvedValue(mockResult);
            await auditService.logDataAccess(mockUserContext, 'clients', 'client-123', 'READ', { query: 'search by name' });
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('INSERT INTO audit_events'), [
                'test-audit-event-id',
                vitest_1.expect.any(Date),
                mockUserContext.userId,
                mockUserContext.organizationId,
                'DATA_ACCESS',
                'clients',
                'client-123',
                'READ',
                'SUCCESS',
                JSON.stringify({ query: 'search by name' }),
                undefined,
                undefined,
            ]);
        });
        (0, vitest_1.it)('should log search data access', async () => {
            const mockResult = { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
            mockDatabase.query.mockResolvedValue(mockResult);
            await auditService.logDataAccess(mockUserContext, 'caregivers', 'caregiver-456', 'SEARCH', { filters: { active: true } });
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('INSERT INTO audit_events'), vitest_1.expect.arrayContaining([
                vitest_1.expect.any(String),
                vitest_1.expect.any(Date),
                mockUserContext.userId,
                mockUserContext.organizationId,
                'DATA_ACCESS',
                'caregivers',
                'caregiver-456',
                'SEARCH',
                'SUCCESS',
                JSON.stringify({ filters: { active: true } }),
                undefined,
                undefined,
            ]));
        });
    });
    (0, vitest_1.describe)('Data Modification Logging', () => {
        (0, vitest_1.it)('should log data creation', async () => {
            const mockResult = { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
            mockDatabase.query.mockResolvedValue(mockResult);
            await auditService.logDataModification(mockUserContext, 'visits', 'visit-789', 'CREATE', { duration: 120 });
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('INSERT INTO audit_events'), [
                'test-audit-event-id',
                vitest_1.expect.any(Date),
                mockUserContext.userId,
                mockUserContext.organizationId,
                'DATA_MODIFICATION',
                'visits',
                'visit-789',
                'CREATE',
                'SUCCESS',
                JSON.stringify({ duration: 120 }),
                undefined,
                undefined,
            ]);
        });
        (0, vitest_1.it)('should log data update', async () => {
            const mockResult = { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
            mockDatabase.query.mockResolvedValue(mockResult);
            await auditService.logDataModification(mockUserContext, 'care_plans', 'plan-456', 'UPDATE', { changes: ['status', 'assigned_caregiver'] });
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('INSERT INTO audit_events'), vitest_1.expect.arrayContaining([
                vitest_1.expect.any(String),
                vitest_1.expect.any(Date),
                mockUserContext.userId,
                mockUserContext.organizationId,
                'DATA_MODIFICATION',
                'care_plans',
                'plan-456',
                'UPDATE',
                'SUCCESS',
                JSON.stringify({ changes: ['status', 'assigned_caregiver'] }),
                undefined,
                undefined,
            ]));
        });
        (0, vitest_1.it)('should log data deletion', async () => {
            const mockResult = { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
            mockDatabase.query.mockResolvedValue(mockResult);
            await auditService.logDataModification(mockUserContext, 'notes', 'note-123', 'DELETE', { reason: 'client request' });
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('INSERT INTO audit_events'), vitest_1.expect.arrayContaining([
                vitest_1.expect.any(String),
                vitest_1.expect.any(Date),
                mockUserContext.userId,
                mockUserContext.organizationId,
                'DATA_MODIFICATION',
                'notes',
                'note-123',
                'DELETE',
                'SUCCESS',
                JSON.stringify({ reason: 'client request' }),
                undefined,
                undefined,
            ]));
        });
    });
    (0, vitest_1.describe)('Security Event Logging', () => {
        (0, vitest_1.it)('should log successful security event', async () => {
            const mockResult = { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
            mockDatabase.query.mockResolvedValue(mockResult);
            await auditService.logSecurityEvent(mockUserContext, 'PASSWORD_CHANGE', 'SUCCESS', { method: 'self_service' });
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('INSERT INTO audit_events'), [
                'test-audit-event-id',
                vitest_1.expect.any(Date),
                mockUserContext.userId,
                mockUserContext.organizationId,
                'SECURITY',
                'SECURITY',
                mockUserContext.userId,
                'PASSWORD_CHANGE',
                'SUCCESS',
                JSON.stringify({ method: 'self_service' }),
                undefined,
                undefined,
            ]);
        });
        (0, vitest_1.it)('should log failed security event', async () => {
            const mockResult = { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
            mockDatabase.query.mockResolvedValue(mockResult);
            await auditService.logSecurityEvent(mockUserContext, 'LOGIN_FAILED', 'FAILURE', { reason: 'invalid_password', attempts: 3 });
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('INSERT INTO audit_events'), [
                'test-audit-event-id',
                vitest_1.expect.any(Date),
                mockUserContext.userId,
                mockUserContext.organizationId,
                'SECURITY',
                'SECURITY',
                mockUserContext.userId,
                'LOGIN_FAILED',
                'FAILURE',
                JSON.stringify({ reason: 'invalid_password', attempts: 3 }),
                undefined,
                undefined,
            ]);
        });
    });
    (0, vitest_1.describe)('Audit Trail Retrieval', () => {
        (0, vitest_1.it)('should get audit trail for a resource', async () => {
            const mockEvents = [
                {
                    event_id: 'event-1',
                    timestamp: new Date('2023-01-01T10:00:00Z'),
                    user_id: 'user-1',
                    organization_id: 'org-1',
                    event_type: 'DATA_ACCESS',
                    resource: 'clients',
                    resource_id: 'client-123',
                    action: 'READ',
                    result: 'SUCCESS',
                    metadata: '{"query":"search"}',
                    ip_address: '192.168.1.1',
                    user_agent: 'Mozilla/5.0',
                },
                {
                    event_id: 'event-2',
                    timestamp: new Date('2023-01-01T10:05:00Z'),
                    user_id: 'user-2',
                    organization_id: 'org-1',
                    event_type: 'DATA_MODIFICATION',
                    resource: 'clients',
                    resource_id: 'client-123',
                    action: 'UPDATE',
                    result: 'SUCCESS',
                    metadata: '{"changes":["status"]}',
                    ip_address: '192.168.1.1',
                    user_agent: 'Mozilla/5.0',
                },
            ];
            const mockResult = { rows: mockEvents, rowCount: 2, command: 'SELECT', oid: 0, fields: [] };
            mockDatabase.query.mockResolvedValue(mockResult);
            const trail = await auditService.getAuditTrail('clients', 'client-123');
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledWith(`
      SELECT * FROM audit_events
      WHERE resource = $1 AND resource_id = $2
      ORDER BY timestamp DESC
      LIMIT $3
    `, ['clients', 'client-123', 100]);
            (0, vitest_1.expect)(trail).toEqual([
                {
                    eventId: 'event-1',
                    timestamp: new Date('2023-01-01T10:00:00Z'),
                    userId: 'user-1',
                    organizationId: 'org-1',
                    eventType: 'DATA_ACCESS',
                    resource: 'clients',
                    resourceId: 'client-123',
                    action: 'READ',
                    result: 'SUCCESS',
                    metadata: { query: 'search' },
                    ipAddress: '192.168.1.1',
                    userAgent: 'Mozilla/5.0',
                },
                {
                    eventId: 'event-2',
                    timestamp: new Date('2023-01-01T10:05:00Z'),
                    userId: 'user-2',
                    organizationId: 'org-1',
                    eventType: 'DATA_MODIFICATION',
                    resource: 'clients',
                    resourceId: 'client-123',
                    action: 'UPDATE',
                    result: 'SUCCESS',
                    metadata: { changes: ['status'] },
                    ipAddress: '192.168.1.1',
                    userAgent: 'Mozilla/5.0',
                },
            ]);
        });
        (0, vitest_1.it)('should use custom limit for audit trail', async () => {
            const mockResult = { rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] };
            mockDatabase.query.mockResolvedValue(mockResult);
            await auditService.getAuditTrail('visits', 'visit-123', 50);
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledWith(`
      SELECT * FROM audit_events
      WHERE resource = $1 AND resource_id = $2
      ORDER BY timestamp DESC
      LIMIT $3
    `, ['visits', 'visit-123', 50]);
        });
        (0, vitest_1.it)('should use default limit when not specified', async () => {
            const mockResult = { rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] };
            mockDatabase.query.mockResolvedValue(mockResult);
            await auditService.getAuditTrail('notes', 'note-456');
            (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledWith(`
      SELECT * FROM audit_events
      WHERE resource = $1 AND resource_id = $2
      ORDER BY timestamp DESC
      LIMIT $3
    `, ['notes', 'note-456', 100]);
        });
        (0, vitest_1.it)('should handle empty metadata in audit trail', async () => {
            const mockEvents = [
                {
                    event_id: 'event-1',
                    metadata: null,
                },
            ];
            const mockResult = { rows: mockEvents, rowCount: 1, command: 'SELECT', oid: 0, fields: [] };
            mockDatabase.query.mockResolvedValue(mockResult);
            const trail = await auditService.getAuditTrail('test', 'test-123');
            (0, vitest_1.expect)(trail[0].metadata).toEqual({});
        });
    });
    (0, vitest_1.describe)('Event Types', () => {
        (0, vitest_1.it)('should handle all audit event types', async () => {
            const eventTypes = [
                'AUTHENTICATION',
                'AUTHORIZATION',
                'DATA_ACCESS',
                'DATA_MODIFICATION',
                'CONFIGURATION',
                'SECURITY',
                'COMPLIANCE',
            ];
            const mockResult = { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
            mockDatabase.query.mockResolvedValue(mockResult);
            for (const eventType of eventTypes) {
                await auditService.logEvent(mockUserContext, {
                    eventType,
                    resource: 'test',
                    resourceId: 'test-123',
                    action: 'TEST',
                    result: 'SUCCESS',
                });
                (0, vitest_1.expect)(mockDatabase.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('INSERT INTO audit_events'), vitest_1.expect.arrayContaining([
                    vitest_1.expect.any(String),
                    vitest_1.expect.any(Date),
                    mockUserContext.userId,
                    mockUserContext.organizationId,
                    eventType,
                    'test',
                    'test-123',
                    'TEST',
                    'SUCCESS',
                    JSON.stringify({}),
                    undefined,
                    undefined,
                ]));
            }
        });
    });
});
//# sourceMappingURL=audit-service.test.js.map