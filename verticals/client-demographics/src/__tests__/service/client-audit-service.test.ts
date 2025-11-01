/**
 * Tests for ClientAuditService
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientAuditService, ClientAccessAuditEntry, AuditQuery, DisclosureMethod } from '../../service/client-audit-service';

interface MockDatabaseConnection {
  query: ReturnType<typeof vi.fn>;
}

describe('ClientAuditService', () => {
  let service: ClientAuditService;
  let mockDb: MockDatabaseConnection;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      query: vi.fn(),
    } as MockDatabaseConnection;

    service = new ClientAuditService(mockDb as any);
  });

  describe('logAccess', () => {
    it('should log client record access successfully', async () => {
      const mockEntry: ClientAccessAuditEntry = {
        clientId: 'client-1',
        accessedBy: 'user-1',
        accessType: 'VIEW',
        accessTimestamp: new Date(),
      };

      const mockResult = {
        rows: [{ id: 'audit-1' }],
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await service.logAccess(mockEntry);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO client_access_audit'),
        expect.arrayContaining([
          'client-1',
          'user-1',
          'VIEW',
          expect.any(Date),
        ])
      );
      expect(result).toBe('audit-1');
    });

    it('should throw error when required fields are missing', async () => {
      const invalidEntry: ClientAccessAuditEntry = {
        clientId: undefined as any, // Missing clientId
        accessedBy: 'user-1',
        accessType: 'VIEW',
        accessTimestamp: new Date(),
      };

      await expect(service.logAccess(invalidEntry)).rejects.toThrow('Client ID is required for audit log');
    });

    it('should throw error when disclosure type is missing required fields', async () => {
      const invalidEntry: ClientAccessAuditEntry = {
        clientId: 'client-1',
        accessedBy: 'user-1',
        accessType: 'DISCLOSURE',
        accessTimestamp: new Date(),
        // Missing required disclosure fields
      };

      await expect(service.logAccess(invalidEntry)).rejects.toThrow('Disclosure recipient is required for DISCLOSURE type');
    });
  });

  describe('logDisclosure', () => {
    it('should log disclosure of client information successfully', async () => {
      const mockResult = {
        rows: [{ id: 'disclosure-1' }],
      };

      mockDb.query.mockResolvedValue(mockResult);

      const result = await service.logDisclosure(
        'client-1',
        'user-1',
        'Doctor Smith',
        'VERBAL' as DisclosureMethod,
        'Medical records'
      );

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO client_access_audit'),
        expect.arrayContaining([
          'client-1',
          'user-1',
          'DISCLOSURE',
          expect.any(Date),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          'Doctor Smith',
          'VERBAL',
          expect.anything(),
          'Medical records'
        ])
      );
      expect(result).toBe('disclosure-1');
    });
  });

  describe('queryAuditLog', () => {
    it('should query audit logs with filters', async () => {
      const mockQuery: AuditQuery = {
        clientId: 'client-1',
        accessType: ['VIEW', 'UPDATE'],
      };

      const mockCountResult = {
        rows: [{ total: '5' }],
      };

      const mockEntriesResult = {
        rows: [
          {
            id: 'audit-1',
            client_id: 'client-1',
            accessed_by: 'user-1',
            access_type: 'VIEW',
            access_timestamp: new Date(),
          }
        ],
      };

      const mockDisclosureResult = {
        rows: [{ count: '0' }],
      };

      mockDb.query
        .mockResolvedValueOnce(mockCountResult) // Count query
        .mockResolvedValueOnce(mockEntriesResult) // Entries query
        .mockResolvedValueOnce(mockDisclosureResult); // Disclosure count

      const result = await service.queryAuditLog(mockQuery);

      expect(result.entries).toHaveLength(1);
      expect(result.totalCount).toBe(5);
      expect(result.disclosureCount).toBe(0);
      expect(result.accessCount).toBe(5);
    });

    it('should query audit logs with date range', async () => {
      const mockQuery: AuditQuery = {
        clientId: 'client-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const mockCountResult = {
        rows: [{ total: '1' }],
      };

      const mockEntriesResult = {
        rows: [
          {
            id: 'audit-1',
            client_id: 'client-1',
            accessed_by: 'user-1',
            access_type: 'VIEW',
            access_timestamp: new Date(),
          }
        ],
      };

      const mockDisclosureResult = {
        rows: [{ count: '0' }],
      };

      mockDb.query
        .mockResolvedValueOnce(mockCountResult) // Count query
        .mockResolvedValueOnce(mockEntriesResult) // Entries query
        .mockResolvedValueOnce(mockDisclosureResult); // Disclosure count

      const result = await service.queryAuditLog(mockQuery);

      expect(result.entries).toHaveLength(1);
      expect(result.dateRange.start).toEqual(new Date('2024-01-01'));
      expect(result.dateRange.end).toEqual(new Date('2024-12-31'));
    });
  });

  describe('getDisclosureHistory', () => {
    it('should get disclosure history for a client', async () => {
      const sixYearsAgo = new Date();
      sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);

      const mockQueryResult = {
        entries: [],
        totalCount: 0,
        dateRange: { start: sixYearsAgo, end: new Date() },
        disclosureCount: 0,
        accessCount: 0,
      };

      vi.spyOn(service, 'queryAuditLog').mockResolvedValue(mockQueryResult);

      const result = await service.getDisclosureHistory('client-1');

      expect(service.queryAuditLog).toHaveBeenCalledWith({
        clientId: 'client-1',
        accessType: ['DISCLOSURE'],
        startDate: sixYearsAgo,
        endDate: new Date(),
        limit: 1000,
      });
      expect(result).toEqual([]);
    });
  });

  describe('getAccessSummary', () => {
    it('should get access summary for a client', async () => {
      const mockReport = {
        entries: [
          {
            id: 'audit-1',
            clientId: 'client-1',
            accessedBy: 'user-1',
            accessType: 'VIEW',
            accessTimestamp: new Date(),
          },
          {
            id: 'audit-2',
            clientId: 'client-1',
            accessedBy: 'user-1',
            accessType: 'DISCLOSURE',
            accessTimestamp: new Date(),
          },
        ],
        totalCount: 2,
        dateRange: { start: new Date(), end: new Date() },
        disclosureCount: 1,
        accessCount: 1,
      };

      vi.spyOn(service, 'queryAuditLog').mockResolvedValue(mockReport);

      const result = await service.getAccessSummary('client-1', 30);

      expect(result.totalAccess).toBe(2);
      expect(result.accessByType.get('VIEW')).toBe(1);
      expect(result.accessByType.get('DISCLOSURE')).toBe(1);
      expect(result.accessByUser.get('user-1')).toBe(2);
      expect(result.disclosures).toBe(1);
      expect(result.suspiciousActivity).toBe(false);
    });

    it('should detect suspicious activity', async () => {
      // Create a report with many access events from a single user
      const manyEntries = Array(60).fill(0).map((_, i) => ({
        id: `audit-${i}`,
        clientId: 'client-1',
        accessedBy: 'user-1',
        accessType: 'VIEW',
        accessTimestamp: new Date(),
      }));

      const mockReport = {
        entries: manyEntries,
        totalCount: 60,
        dateRange: { start: new Date(), end: new Date() },
        disclosureCount: 0,
        accessCount: 60,
      };

      vi.spyOn(service, 'queryAuditLog').mockResolvedValue(mockReport);

      const result = await service.getAccessSummary('client-1', 30);

      expect(result.suspiciousActivity).toBe(true);
      expect(result.unusualAccessPatterns).toContain('User user-1 accessed record 60 times in 30 days');
    });
  });

  describe('exportAuditLog', () => {
    it('should export audit log to CSV format', async () => {
      const mockReport = {
        entries: [
          {
            id: 'audit-1',
            clientId: 'client-1',
            accessedBy: 'user-1',
            accessType: 'VIEW',
            accessTimestamp: new Date('2024-01-01T10:00:00.000Z'),
            accessReason: 'Routine check',
            ipAddress: '192.168.1.1',
            disclosureRecipient: null,
            disclosureMethod: null,
            authorizationReference: null,
            informationDisclosed: null,
          }
        ],
        totalCount: 1,
        dateRange: { start: new Date(), end: new Date() },
        disclosureCount: 0,
        accessCount: 1,
      };

      vi.spyOn(service, 'queryAuditLog').mockResolvedValue(mockReport);
      vi.spyOn(service, 'logAccess').mockResolvedValue('log-id');

      const result = await service.exportAuditLog({});

      expect(result).toContain('Timestamp,Client ID,Accessed By,Access Type,Reason,IP Address,Disclosure Recipient,Disclosure Method,Authorization,Information Disclosed');
      expect(result).toContain('"2024-01-01T10:00:00.000Z","client-1","user-1","VIEW","Routine check","192.168.1.1","","","",""');
      
      // Check that the export itself was logged
      expect(service.logAccess).toHaveBeenCalledWith({
        clientId: '00000000-0000-0000-0000-000000000000',
        accessedBy: 'SYSTEM',
        accessType: 'EXPORT',
        accessTimestamp: expect.any(Date),
        accessReason: 'Audit log export for compliance reporting',
      });
    });
  });

  describe('validateEntry', () => {
    it('should validate audit entry successfully', async () => {
      const validEntry: ClientAccessAuditEntry = {
        clientId: 'client-1',
        accessedBy: 'user-1',
        accessType: 'VIEW',
        accessTimestamp: new Date(),
      };

      expect(() => {
        (service as any).validateEntry(validEntry);
      }).not.toThrow();
    });
  });

  describe('mapRowToEntry', () => {
    it('should map database row to audit entry', () => {
      const mockRow = {
        id: 'audit-1',
        client_id: 'client-1',
        accessed_by: 'user-1',
        access_type: 'VIEW',
        access_timestamp: new Date(),
        access_reason: 'Routine check',
        ip_address: '192.168.1.1',
      };

      const result = (service as any).mapRowToEntry(mockRow);

      expect(result.id).toBe('audit-1');
      expect(result.clientId).toBe('client-1');
      expect(result.accessedBy).toBe('user-1');
      expect(result.accessType).toBe('VIEW');
      expect(result.accessTimestamp).toEqual(new Date());
      expect(result.accessReason).toBe('Routine check');
      expect(result.ipAddress).toBe('192.168.1.1');
    });

    it('should handle null values in optional fields', () => {
      const mockRow = {
        id: 'audit-1',
        client_id: 'client-1',
        accessed_by: 'user-1',
        access_type: 'VIEW',
        access_timestamp: new Date(),
        // Optional fields are null
        access_reason: null,
        ip_address: null,
        user_agent: null,
        disclosure_recipient: null,
        disclosure_method: null,
        authorization_reference: null,
        information_disclosed: null,
      };

      const result = (service as any).mapRowToEntry(mockRow);

      expect(result.id).toBe('audit-1');
      expect(result.clientId).toBe('client-1');
      expect(result.accessedBy).toBe('user-1');
      expect(result.accessType).toBe('VIEW');
      expect(result.accessTimestamp).toEqual(new Date());
      // Optional fields should not be set if they are null
      expect(result.accessReason).toBeUndefined();
      expect(result.ipAddress).toBeUndefined();
    });
  });
});