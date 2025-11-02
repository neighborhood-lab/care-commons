/**
 * Tests for ClientHandlers
 */

import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { Request, Response } from 'express';
import { UserContext } from '@care-commons/core';
import { ClientHandlers } from '../../api/client-handlers';
import { ClientService } from '../../service/client-service';

interface MockRequest extends Request {
  userContext?: UserContext;
}

interface MockResponse extends Response {
  json: Mock;
  status: Mock;
}

interface MockClientService {
  createClient: Mock;
  getClientById: Mock;
  getClientByNumber: Mock;
  updateClient: Mock;
  deleteClient: Mock;
  searchClients: Mock;
  addEmergencyContact: Mock;
  updateEmergencyContact: Mock;
  removeEmergencyContact: Mock;
  addRiskFlag: Mock;
  resolveRiskFlag: Mock;
  updateClientStatus: Mock;
  getClientsByBranch: Mock;
}

describe('ClientHandlers', () => {
  let handlers: ClientHandlers;
  let mockClientService: MockClientService;
  let mockReq: MockRequest;
  let mockRes: MockResponse;
  let mockNext: Mock;

  const mockUserContext: UserContext = {
    userId: 'user-1',
    roles: ['COORDINATOR'],
    permissions: ['clients:create', 'clients:read', 'clients:update', 'clients:delete'],
    organizationId: 'org-1',
    branchIds: ['branch-1'],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockClientService = {
      createClient: vi.fn(),
      getClientById: vi.fn(),
      getClientByNumber: vi.fn(),
      updateClient: vi.fn(),
      deleteClient: vi.fn(),
      searchClients: vi.fn(),
      addEmergencyContact: vi.fn(),
      updateEmergencyContact: vi.fn(),
      removeEmergencyContact: vi.fn(),
      addRiskFlag: vi.fn(),
      resolveRiskFlag: vi.fn(),
      updateClientStatus: vi.fn(),
      getClientsByBranch: vi.fn(),
    };

    handlers = new ClientHandlers(mockClientService as unknown as ClientService);

    mockReq = {
      params: {},
      query: {},
      body: {},
    } as MockRequest;

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as MockResponse;

    mockNext = vi.fn();
  });

  describe('listClients', () => {
    it.skip('should list clients with default pagination', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.query = {};

      const mockSearchResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      mockClientService.searchClients.mockResolvedValue(mockSearchResult);

      await handlers.listClients(mockReq, mockRes, mockNext);

      const calledFilters = mockClientService.searchClients.mock.calls[0]?.[0];
      expect(calledFilters).toHaveProperty('organizationId', mockUserContext.organizationId);
      expect(mockClientService.searchClients).toHaveBeenCalledWith(
        expect.any(Object),
        { page: 1, limit: 20 },
        mockUserContext
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockSearchResult,
      });
    });

    it('should list clients with query parameters', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.query = {
        q: 'john',
        status: 'ACTIVE,PENDING_INTAKE',
        city: 'Springfield',
        state: 'IL',
        page: '2',
        limit: '50',
      };

      const mockSearchResult = {
        items: [],
        total: 0,
        page: 2,
        limit: 50,
        totalPages: 0,
      };

      mockClientService.searchClients.mockResolvedValue(mockSearchResult);

      await handlers.listClients(mockReq, mockRes, mockNext);

      const calledFilters = mockClientService.searchClients.mock.calls[0]?.[0];
      expect(calledFilters.query).toBe('john');
      expect(calledFilters.status).toEqual(['ACTIVE', 'PENDING_INTAKE']);
      expect(calledFilters.city).toBe('Springfield');
      expect(calledFilters.state).toBe('IL');
      expect(mockClientService.searchClients).toHaveBeenCalledWith(
        expect.any(Object),
        { page: 2, limit: 50 },
        mockUserContext
      );
    });

    it('should handle age range filters', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.query = {
        minAge: '18',
        maxAge: '65',
      };

      const mockSearchResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      mockClientService.searchClients.mockResolvedValue(mockSearchResult);

      await handlers.listClients(mockReq, mockRes, mockNext);

      const calledFilters = mockClientService.searchClients.mock.calls[0]?.[0];
      expect(calledFilters.minAge).toBe(18);
      expect(calledFilters.maxAge).toBe(65);
      expect(mockClientService.searchClients).toHaveBeenCalledWith(
        expect.any(Object),
        { page: 1, limit: 20 },
        mockUserContext
      );
    });
  });

  describe('getClient', () => {
    it('should get client by ID successfully', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.params = { id: 'client-1' };

      const mockClient = {
        id: 'client-1',
        firstName: 'John',
        lastName: 'Doe',
        status: 'ACTIVE',
      };

      mockClientService.getClientById.mockResolvedValue(mockClient);

      await handlers.getClient(mockReq, mockRes, mockNext);

      expect(mockClientService.getClientById).toHaveBeenCalledWith('client-1', mockUserContext);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockClient,
      });
    });

    it('should return 400 for missing client ID', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.params = {};

      await handlers.getClient(mockReq, mockRes, mockNext);

      expect(mockClientService.getClientById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Client ID is required',
      });
    });
  });

  describe('getClientByNumber', () => {
    it('should get client by number successfully', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.params = { clientNumber: 'CL-001' };
      mockReq.query = { organizationId: 'org-1' };

      const mockClient = {
        id: 'client-1',
        clientNumber: 'CL-001',
        firstName: 'John',
        lastName: 'Doe',
        status: 'ACTIVE',
      };

      mockClientService.getClientByNumber.mockResolvedValue(mockClient);

      await handlers.getClientByNumber(mockReq, mockRes, mockNext);

      expect(mockClientService.getClientByNumber).toHaveBeenCalledWith(
        'CL-001',
        'org-1',
        mockUserContext
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockClient,
      });
    });

    it('should use context organization ID if not in query', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.params = { clientNumber: 'CL-001' };
      mockReq.query = {};

      const mockClient = {
        id: 'client-1',
        clientNumber: 'CL-001',
        firstName: 'John',
        lastName: 'Doe',
        status: 'ACTIVE',
      };

      mockClientService.getClientByNumber.mockResolvedValue(mockClient);

      await handlers.getClientByNumber(mockReq, mockRes, mockNext);

      expect(mockClientService.getClientByNumber).toHaveBeenCalledWith(
        'CL-001',
        'org-1', // Using context org ID
        mockUserContext
      );
    });
  });

  describe('createClient', () => {
    it('should create client successfully', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.body = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
      };

      const mockClient = {
        id: 'client-1',
        firstName: 'John',
        lastName: 'Doe',
        status: 'PENDING_INTAKE',
      };

      mockClientService.createClient.mockResolvedValue(mockClient);

      await handlers.createClient(mockReq, mockRes, mockNext);

      expect(mockClientService.createClient).toHaveBeenCalledWith(
        mockReq.body,
        mockUserContext
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockClient,
        message: 'Client created successfully',
      });
    });
  });

  describe('updateClient', () => {
    it('should update client successfully', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.params = { id: 'client-1' };
      mockReq.body = { firstName: 'Jane' };

      const mockClient = {
        id: 'client-1',
        firstName: 'Jane',
        lastName: 'Doe',
        status: 'ACTIVE',
      };

      mockClientService.updateClient.mockResolvedValue(mockClient);

      await handlers.updateClient(mockReq, mockRes, mockNext);

      expect(mockClientService.updateClient).toHaveBeenCalledWith(
        'client-1',
        { firstName: 'Jane' },
        mockUserContext
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockClient,
        message: 'Client updated successfully',
      });
    });

    it('should return 400 for missing client ID', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.params = {};
      mockReq.body = { firstName: 'Jane' };

      await handlers.updateClient(mockReq, mockRes, mockNext);

      expect(mockClientService.updateClient).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Client ID is required',
      });
    });
  });

  describe('deleteClient', () => {
    it('should delete client successfully', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.params = { id: 'client-1' };

      mockClientService.deleteClient.mockResolvedValue(undefined);

      await handlers.deleteClient(mockReq, mockRes, mockNext);

      expect(mockClientService.deleteClient).toHaveBeenCalledWith('client-1', mockUserContext);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Client deleted successfully',
      });
    });
  });

  describe('Emergency Contact Operations', () => {
    beforeEach(() => {
      mockReq.userContext = mockUserContext;
    });

    it('should add emergency contact', async () => {
      mockReq.params = { id: 'client-1' };
      mockReq.body = {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: { number: '555-123-4567', type: 'MOBILE', canReceiveSMS: true },
        isPrimary: true,
        canMakeHealthcareDecisions: true,
      };

      const mockClient = {
        id: 'client-1',
        emergencyContacts: [mockReq.body],
      };

      mockClientService.addEmergencyContact.mockResolvedValue(mockClient);

      await handlers.addEmergencyContact(mockReq, mockRes, mockNext);

      expect(mockClientService.addEmergencyContact).toHaveBeenCalledWith(
        'client-1',
        mockReq.body,
        mockUserContext
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockClient,
        message: 'Emergency contact added successfully',
      });
    });

    it('should update emergency contact', async () => {
      mockReq.params = { id: 'client-1', contactId: 'contact-1' };
      mockReq.body = { name: 'Updated Name' };

      const mockClient = {
        id: 'client-1',
        emergencyContacts: [{ id: 'contact-1', name: 'Updated Name' }],
      };

      mockClientService.updateEmergencyContact.mockResolvedValue(mockClient);

      await handlers.updateEmergencyContact(mockReq, mockRes, mockNext);

      expect(mockClientService.updateEmergencyContact).toHaveBeenCalledWith(
        'client-1',
        'contact-1',
        { name: 'Updated Name' },
        mockUserContext
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockClient,
        message: 'Emergency contact updated successfully',
      });
    });

    it('should remove emergency contact', async () => {
      mockReq.params = { id: 'client-1', contactId: 'contact-1' };

      const mockClient = {
        id: 'client-1',
        emergencyContacts: [],
      };

      mockClientService.removeEmergencyContact.mockResolvedValue(mockClient);

      await handlers.removeEmergencyContact(mockReq, mockRes, mockNext);

      expect(mockClientService.removeEmergencyContact).toHaveBeenCalledWith(
        'client-1',
        'contact-1',
        mockUserContext
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockClient,
        message: 'Emergency contact removed successfully',
      });
    });
  });

  describe('Risk Flag Operations', () => {
    beforeEach(() => {
      mockReq.userContext = mockUserContext;
    });

    it('should add risk flag', async () => {
      mockReq.params = { id: 'client-1' };
      mockReq.body = {
        type: 'FALL_RISK',
        severity: 'HIGH',
        description: 'History of falls',
        requiresAcknowledgment: true,
      };

      const mockClient = {
        id: 'client-1',
        riskFlags: [mockReq.body],
      };

      mockClientService.addRiskFlag.mockResolvedValue(mockClient);

      await handlers.addRiskFlag(mockReq, mockRes, mockNext);

      expect(mockClientService.addRiskFlag).toHaveBeenCalledWith(
        'client-1',
        mockReq.body,
        mockUserContext
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockClient,
        message: 'Risk flag added successfully',
      });
    });

    it('should resolve risk flag', async () => {
      mockReq.params = { id: 'client-1', flagId: 'flag-1' };

      const mockClient = {
        id: 'client-1',
        riskFlags: [],
      };

      mockClientService.resolveRiskFlag.mockResolvedValue(mockClient);

      await handlers.resolveRiskFlag(mockReq, mockRes, mockNext);

      expect(mockClientService.resolveRiskFlag).toHaveBeenCalledWith(
        'client-1',
        'flag-1',
        mockUserContext
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockClient,
        message: 'Risk flag resolved successfully',
      });
    });
  });

  describe('updateClientStatus', () => {
    it('should update client status', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.params = { id: 'client-1' };
      mockReq.body = { status: 'DISCHARGED', reason: 'Moved to assisted living' };

      const mockClient = {
        id: 'client-1',
        status: 'DISCHARGED',
      };

      mockClientService.updateClientStatus.mockResolvedValue(mockClient);

      await handlers.updateClientStatus(mockReq, mockRes, mockNext);

      expect(mockClientService.updateClientStatus).toHaveBeenCalledWith(
        'client-1',
        'DISCHARGED',
        mockUserContext,
        'Moved to assisted living'
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockClient,
        message: 'Client status updated to DISCHARGED',
      });
    });
  });

  describe('getClientSummary', () => {
    it('should get client summary', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.params = { id: 'client-1' };

      const mockClient = {
        id: 'client-1',
        clientNumber: 'CL-001',
        firstName: 'John',
        lastName: 'Doe',
        preferredName: 'Johnny',
        dateOfBirth: new Date('1980-01-01'),
        gender: 'MALE',
        status: 'ACTIVE',
        primaryPhone: { number: '555-123-4567', type: 'MOBILE', canReceiveSMS: true },
        emergencyContacts: [{
          id: 'contact-1',
          name: 'Jane Doe',
          isPrimary: true,
          relationship: 'Spouse',
          phone: { number: '555-987-6543', type: 'HOME', canReceiveSMS: false },
        }],
        riskFlags: [
          { id: 'flag-1', severity: 'CRITICAL', resolvedDate: null, type: 'FALL_RISK' },
          { id: 'flag-2', severity: 'HIGH', resolvedDate: new Date(), type: 'WANDERING' },
        ],
        primaryAddress: {
          line1: '123 Main St',
          city: 'Springfield',
          state: 'IL',
        },
        programs: [
          { id: 'prog-1', programName: 'Personal Care', status: 'ACTIVE' },
          { id: 'prog-2', programName: 'Respite Care', status: 'INACTIVE' },
        ],
        allergies: [],
        specialInstructions: 'No special instructions',
        accessInstructions: 'Access via front door',
      };

      mockClientService.getClientById.mockResolvedValue(mockClient);

      await handlers.getClientSummary(mockReq, mockRes, mockNext);

      expect(mockClientService.getClientById).toHaveBeenCalledWith('client-1', mockUserContext);
      const expectedData = mockRes.json.mock.calls[0]?.[0]?.data;
      expect(expectedData.id).toBe('client-1');
      expect(expectedData.clientNumber).toBe('CL-001');
      expect(expectedData.fullName).toBe('John Doe');
      expect(expectedData.preferredName).toBe('Johnny');
      expect(expectedData.age).toBeGreaterThanOrEqual(40); // Person born in 1980 should be at least 40 in 2024
      expect(expectedData.gender).toBe('MALE');
      expect(expectedData.status).toBe('ACTIVE');
      expect(expectedData.primaryPhone).toBe('555-123-4567');
      expect(expectedData.primaryContact).toEqual({
        id: 'contact-1',
        name: 'Jane Doe',
        isPrimary: true,
        relationship: 'Spouse',
        phone: { number: '555-987-6543', type: 'HOME', canReceiveSMS: false },
      });
      expect(expectedData.activeRiskFlags).toBe(1); // Only the unresolved risk flag
      expect(expectedData.criticalRiskFlags).toEqual([{ id: 'flag-1', severity: 'CRITICAL', resolvedDate: null, type: 'FALL_RISK' }]);
      expect(expectedData.address).toEqual({
        line1: '123 Main St',
        city: 'Springfield',
        state: 'IL',
      });
      expect(expectedData.programs).toEqual([{ id: 'prog-1', programName: 'Personal Care', status: 'ACTIVE' }]);
      expect(expectedData.hasAllergies).toBe(false);
      expect(expectedData.specialInstructions).toBe('No special instructions');
      expect(expectedData.accessInstructions).toBe('Access via front door');
    });
  });

  describe('getClientsByBranch', () => {
    it('should get clients by branch', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.params = { branchId: 'branch-1' };

      const mockClients = [
        { id: 'client-1', firstName: 'John', lastName: 'Doe', status: 'ACTIVE' },
        { id: 'client-2', firstName: 'Jane', lastName: 'Smith', status: 'ACTIVE' },
      ];

      mockClientService.getClientsByBranch.mockResolvedValue(mockClients);

      await handlers.getClientsByBranch(mockReq, mockRes, mockNext);

      expect(mockClientService.getClientsByBranch).toHaveBeenCalledWith(
        'branch-1',
        mockUserContext,
        true // activeOnly default
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockClients,
        count: 2,
      });
    });

    it('should get clients by branch with activeOnly parameter', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.params = { branchId: 'branch-1' };
      mockReq.query = { activeOnly: 'false' };

      const mockClients: never[] = [];

      mockClientService.getClientsByBranch.mockResolvedValue(mockClients);

      await handlers.getClientsByBranch(mockReq, mockRes, mockNext);

      expect(mockClientService.getClientsByBranch).toHaveBeenCalledWith(
        'branch-1',
        mockUserContext,
        false
      );
    });
  });

  describe('bulkImportClients', () => {
    it.skip('should bulk import clients successfully', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.body = {
        clients: [
          {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: new Date('1980-01-01'),
          },
          {
            firstName: 'Jane',
            lastName: 'Smith',
            dateOfBirth: new Date('1985-05-15'),
          },
        ],
      };

      const mockClient1 = { id: 'client-1', clientNumber: 'CL-001' };
      const mockClient2 = { id: 'client-2', clientNumber: 'CL-002' };

      mockClientService.createClient
        .mockResolvedValueOnce(mockClient1)
        .mockResolvedValueOnce(mockClient2);

      await handlers.bulkImportClients(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Imported 2 clients, 0 failed',
        })
      );
      const callData = mockRes.json.mock.calls[0]?.[0]?.data;
      expect(callData.successful).toHaveLength(2);
      expect(callData.failed).toHaveLength(0);
    });

    it.skip('should handle failed imports during bulk import', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.body = {
        clients: [
          {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: new Date('1980-01-01'),
          },
          {
            firstName: 'Jane',
            lastName: 'Smith',
            // Missing required dateOfBirth - will cause validation error
          },
        ],
      };

      const mockClient1 = { id: 'client-1', clientNumber: 'CL-001' };

      mockClientService.createClient
        .mockResolvedValueOnce(mockClient1)
        .mockRejectedValueOnce(new Error('Validation failed'));

      await handlers.bulkImportClients(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Imported 1 clients, 1 failed',
        })
      );
      const callData = mockRes.json.mock.calls[0]?.[0]?.data;
      expect(callData.successful).toHaveLength(1);
      expect(callData.failed).toHaveLength(1);
      expect(callData.failed[0]).toEqual(
        expect.objectContaining({
          clientData: {
            firstName: 'Jane',
            lastName: 'Smith',
          },
        })
      );
    });

    it('should return error for invalid input', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.body = {
        clients: 'invalid-clients-data', // Not an array
      };

      await handlers.bulkImportClients(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid input: expected array of clients',
      });
    });
  });

  describe('getClientAuditTrail', () => {
    it.skip('should throw error for unimplemented audit trail retrieval', async () => {
      mockReq.userContext = mockUserContext;

      // Since this handler throws synchronously, we need to wrap the call in a function
      await expect(() => handlers.getClientAuditTrail(mockReq, mockRes, mockNext))
        .rejects
        .toThrow('Audit trail retrieval not yet implemented');
    });
  });

  describe('getDashboardStats', () => {
    it('should get dashboard statistics', async () => {
      mockReq.userContext = mockUserContext;
      mockReq.query = { branchId: 'branch-1' };

      const mockClients = [
        { id: 'client-1', status: 'ACTIVE', riskFlags: [] },
        { id: 'client-2', status: 'PENDING_INTAKE', riskFlags: [] },
        { id: 'client-3', status: 'ACTIVE', riskFlags: [
          { id: 'flag-1', severity: 'CRITICAL', resolvedDate: null, type: 'FALL_RISK' }
        ]},
      ];

      const mockSearchResult = {
        items: mockClients,
        total: 3,
        page: 1,
        limit: 10000,
        totalPages: 1,
      };

      mockClientService.searchClients.mockResolvedValue(mockSearchResult);

      await handlers.getDashboardStats(mockReq, mockRes, mockNext);

      expect(mockClientService.searchClients).toHaveBeenCalledWith(
        { organizationId: 'org-1', branchId: 'branch-1' },
        { page: 1, limit: 10000 },
        mockUserContext
      );

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          total: 3,
          byStatus: {
            inquiry: 0,
            pendingIntake: 1,
            active: 2,
            inactive: 0,
            onHold: 0,
            discharged: 0,
            deceased: 0,
          },
          highRiskCount: 1,
          newThisMonth: expect.any(Number), // Number varies based on current month
        },
      });
    });
  });
});