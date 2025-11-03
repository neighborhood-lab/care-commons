/**
 * Tests for ClientService
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientService } from '../../service/client-service';
import { ClientRepository } from '../../repository/client-repository';
import {
  CreateClientInput,
  UpdateClientInput,
  Client,
  ClientStatus,
  RiskType,
} from '../../types/client';
import { UserContext, ValidationError, PermissionError, NotFoundError } from '@care-commons/core';

// Mock UUID for consistent test results
vi.mock('uuid', () => ({
  v4: () => 'mocked-uuid',
}));

// Create a mock for the core module
const mockPermissionService = {
  hasPermission: vi.fn().mockReturnValue(true),
  requirePermission: vi.fn(),
  hasAllPermissions: vi.fn(),
  hasAnyPermission: vi.fn(),
  filterByScope: vi.fn(),
} as any;

vi.mock('@care-commons/core', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    getPermissionService: vi.fn(() => mockPermissionService),
  };
});

describe('ClientService', () => {
  let service: ClientService;
  let mockRepository: ClientRepository;
  let mockUserContext: UserContext;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock ClientRepository
    mockRepository = {
      findById: vi.fn(),
      findByClientNumber: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      search: vi.fn(),
      findByBranch: vi.fn(),
    } as any;

    service = new ClientService(mockRepository);

    mockUserContext = {
      userId: 'user-1',
      roles: ['COORDINATOR'],
      permissions: ['clients:create', 'clients:read', 'clients:update', 'clients:delete'],
      organizationId: 'org-1',
      branchIds: ['branch-1'],
    };
  });

  describe('createClient', () => {
    it.skip('should create a new client successfully', async () => {
      const createInput: CreateClientInput = {
        organizationId: 'org-1',
        branchId: 'branch-1',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        primaryAddress: {
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        },
      };

      const mockClient: Client = {
        id: 'client-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        clientNumber: 'CL-mock-123',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        primaryAddress: {
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        },
        emergencyContacts: [],
        authorizedContacts: [],
        programs: [],
        serviceEligibility: {
          medicaidEligible: false,
          medicareEligible: false,
          veteransBenefits: false,
          longTermCareInsurance: false,
          privatePayOnly: false,
        },
        riskFlags: [],
        status: 'PENDING_INTAKE',
        createdAt: new Date(),
        createdBy: 'user-1',
        updatedAt: new Date(),
        updatedBy: 'user-1',
        version: 1,
        deletedAt: null,
        deletedBy: null,
      };

      // Mock repository methods
      vi.mocked(mockRepository.findByClientNumber).mockResolvedValue(null);
      vi.mocked(mockRepository.create).mockResolvedValue(mockClient);

      const result = await service.createClient(createInput, mockUserContext);

      expect(mockPermissionService.requirePermission).toHaveBeenCalledWith(
        mockUserContext,
        'clients:create'
      );
      expect(mockRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockClient);
    });

    it('should throw ValidationError if client number already exists', async () => {
      const createInput: CreateClientInput = {
        organizationId: 'org-1',
        branchId: 'branch-1',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        primaryAddress: {
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        },
      };

      // Mock repository to return a client (indicating duplicate)
      vi.mocked(mockRepository.findByClientNumber).mockResolvedValue({
        id: 'existing-client',
        organizationId: 'org-1',
        branchId: 'branch-1',
        clientNumber: 'CL-mock-123',
        firstName: 'Existing',
        lastName: 'Client',
        dateOfBirth: new Date('1980-01-01'),
        primaryAddress: {
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        },
        emergencyContacts: [],
        authorizedContacts: [],
        programs: [],
        serviceEligibility: {
          medicaidEligible: false,
          medicareEligible: false,
          veteransBenefits: false,
          longTermCareInsurance: false,
          privatePayOnly: false,
        },
        riskFlags: [],
        status: 'ACTIVE',
        createdAt: new Date(),
        createdBy: 'user-1',
        updatedAt: new Date(),
        updatedBy: 'user-1',
        version: 1,
        deletedAt: null,
        deletedBy: null,
      } as Client);

      await expect(service.createClient(createInput, mockUserContext)).rejects.toThrow(
        ValidationError
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if input is invalid', async () => {
      const invalidInput: CreateClientInput = {
        organizationId: 'invalid-uuid', // Invalid UUID
        branchId: 'branch-1',
        firstName: '', // Empty first name
        lastName: 'Doe',
        dateOfBirth: new Date('2050-01-01'), // Future date
        primaryAddress: {
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        },
      };

      await expect(service.createClient(invalidInput, mockUserContext)).rejects.toThrow(
        ValidationError
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getClientById', () => {
    it('should get client by ID successfully', async () => {
      const mockClient: Client = {
        id: 'client-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        clientNumber: 'CL-001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        primaryAddress: {
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        },
        emergencyContacts: [],
        authorizedContacts: [],
        programs: [],
        serviceEligibility: {
          medicaidEligible: false,
          medicareEligible: false,
          veteransBenefits: false,
          longTermCareInsurance: false,
          privatePayOnly: false,
        },
        riskFlags: [],
        status: 'ACTIVE',
        createdAt: new Date(),
        createdBy: 'user-1',
        updatedAt: new Date(),
        updatedBy: 'user-1',
        version: 1,
        deletedAt: null,
        deletedBy: null,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(mockClient);

      const result = await service.getClientById('client-1', mockUserContext);

      expect(mockPermissionService.requirePermission).toHaveBeenCalledWith(
        mockUserContext,
        'clients:read'
      );
      expect(mockRepository.findById).toHaveBeenCalledWith('client-1');
      expect(result).toEqual(mockClient);
    });

    it('should throw NotFoundError if client not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(service.getClientById('non-existent', mockUserContext)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw PermissionError if no organizational access', async () => {
      const mockClient: Client = {
        id: 'client-1',
        organizationId: 'different-org',
        branchId: 'different-branch',
        clientNumber: 'CL-001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        primaryAddress: {
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        },
        emergencyContacts: [],
        authorizedContacts: [],
        programs: [],
        serviceEligibility: {
          medicaidEligible: false,
          medicareEligible: false,
          veteransBenefits: false,
          longTermCareInsurance: false,
          privatePayOnly: false,
        },
        riskFlags: [],
        status: 'ACTIVE',
        createdAt: new Date(),
        createdBy: 'user-1',
        updatedAt: new Date(),
        updatedBy: 'user-1',
        version: 1,
        deletedAt: null,
        deletedBy: null,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(mockClient);

      await expect(service.getClientById('client-1', mockUserContext)).rejects.toThrow(
        PermissionError
      );
    });
  });

  describe('getClientByNumber', () => {
    it('should get client by client number successfully', async () => {
      const mockClient: Client = {
        id: 'client-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        clientNumber: 'CL-001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        primaryAddress: {
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        },
        emergencyContacts: [],
        authorizedContacts: [],
        programs: [],
        serviceEligibility: {
          medicaidEligible: false,
          medicareEligible: false,
          veteransBenefits: false,
          longTermCareInsurance: false,
          privatePayOnly: false,
        },
        riskFlags: [],
        status: 'ACTIVE',
        createdAt: new Date(),
        createdBy: 'user-1',
        updatedAt: new Date(),
        updatedBy: 'user-1',
        version: 1,
        deletedAt: null,
        deletedBy: null,
      };

      vi.mocked(mockRepository.findByClientNumber).mockResolvedValue(mockClient);

      const result = await service.getClientByNumber('CL-001', 'org-1', mockUserContext);

      expect(mockPermissionService.requirePermission).toHaveBeenCalledWith(
        mockUserContext,
        'clients:read'
      );
      expect(mockRepository.findByClientNumber).toHaveBeenCalledWith('CL-001', 'org-1');
      expect(result).toEqual(mockClient);
    });

    it('should throw NotFoundError if client not found', async () => {
      vi.mocked(mockRepository.findByClientNumber).mockResolvedValue(null);

      await expect(service.getClientByNumber('CL-999', 'org-1', mockUserContext)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('updateClient', () => {
    it('should update client successfully', async () => {
      const mockClient: Client = {
        id: 'client-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        clientNumber: 'CL-001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        primaryAddress: {
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        },
        emergencyContacts: [],
        authorizedContacts: [],
        programs: [],
        serviceEligibility: {
          medicaidEligible: false,
          medicareEligible: false,
          veteransBenefits: false,
          longTermCareInsurance: false,
          privatePayOnly: false,
        },
        riskFlags: [],
        status: 'ACTIVE',
        createdAt: new Date(),
        createdBy: 'user-1',
        updatedAt: new Date(),
        updatedBy: 'user-1',
        version: 1,
        deletedAt: null,
        deletedBy: null,
      };

      const updates: UpdateClientInput = { firstName: 'Jane' };

      // Mock to return the existing client for the get call
      vi.mocked(mockRepository.findById).mockResolvedValue(mockClient);
      // Mock to return the updated client
      vi.mocked(mockRepository.update).mockResolvedValue({ ...mockClient, firstName: 'Jane' });

      const result = await service.updateClient('client-1', updates, mockUserContext);

      expect(mockPermissionService.requirePermission).toHaveBeenCalledWith(
        mockUserContext,
        'clients:update'
      );
      expect(mockRepository.findById).toHaveBeenCalledWith('client-1');
      expect(mockRepository.update).toHaveBeenCalledWith('client-1', updates, mockUserContext);
      expect(result.firstName).toBe('Jane');
    });

    it('should throw ValidationError if updates are invalid', async () => {
      const mockClient: Client = {
        id: 'client-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        clientNumber: 'CL-001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        primaryAddress: {
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        },
        emergencyContacts: [],
        authorizedContacts: [],
        programs: [],
        serviceEligibility: {
          medicaidEligible: false,
          medicareEligible: false,
          veteransBenefits: false,
          longTermCareInsurance: false,
          privatePayOnly: false,
        },
        riskFlags: [],
        status: 'ACTIVE',
        createdAt: new Date(),
        createdBy: 'user-1',
        updatedAt: new Date(),
        updatedBy: 'user-1',
        version: 1,
        deletedAt: null,
        deletedBy: null,
      };

      // Mock to return the existing client
      vi.mocked(mockRepository.findById).mockResolvedValue(mockClient);

      // Try to update with an invalid value
      const invalidUpdates: UpdateClientInput = {
        firstName: 'x'.repeat(200), // Too long
      };

      await expect(
        service.updateClient('client-1', invalidUpdates, mockUserContext)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteClient', () => {
    it('should delete client successfully', async () => {
      const mockClient: Client = {
        id: 'client-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        clientNumber: 'CL-001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        primaryAddress: {
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        },
        emergencyContacts: [],
        authorizedContacts: [],
        programs: [],
        serviceEligibility: {
          medicaidEligible: false,
          medicareEligible: false,
          veteransBenefits: false,
          longTermCareInsurance: false,
          privatePayOnly: false,
        },
        riskFlags: [],
        status: 'ACTIVE',
        createdAt: new Date(),
        createdBy: 'user-1',
        updatedAt: new Date(),
        updatedBy: 'user-1',
        version: 1,
        deletedAt: null,
        deletedBy: null,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(mockClient);
      vi.mocked(mockRepository.delete).mockResolvedValue();

      await service.deleteClient('client-1', mockUserContext);

      expect(mockPermissionService.requirePermission).toHaveBeenCalledWith(
        mockUserContext,
        'clients:delete'
      );
      expect(mockRepository.findById).toHaveBeenCalledWith('client-1');
      expect(mockRepository.delete).toHaveBeenCalledWith('client-1', mockUserContext);
    });

    it('should throw NotFoundError if client does not exist', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(service.deleteClient('non-existent', mockUserContext)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('searchClients', () => {
    it('should search clients successfully', async () => {
      const mockSearchResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      vi.mocked(mockRepository.search).mockResolvedValue(mockSearchResult);

      const result = await service.searchClients({}, { page: 1, limit: 10 }, mockUserContext);

      expect(mockPermissionService.requirePermission).toHaveBeenCalledWith(
        mockUserContext,
        'clients:read'
      );
      expect(mockRepository.search).toHaveBeenCalled();
      expect(result).toEqual(mockSearchResult);
    });

    it('should apply organizational scope filters for non-SUPER_ADMIN users', async () => {
      const mockSearchResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      vi.mocked(mockRepository.search).mockResolvedValue(mockSearchResult);

      const result = await service.searchClients({}, { page: 1, limit: 10 }, mockUserContext);

      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-1' }),
        expect.anything()
      );
      expect(result).toEqual(mockSearchResult);
    });

    it('should not apply organizational scope filters for SUPER_ADMIN users', async () => {
      const superAdminContext: UserContext = {
        ...mockUserContext,
        roles: ['SUPER_ADMIN'],
      };

      const mockSearchResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      // Mock an empty filter initially
      vi.mocked(mockRepository.search).mockResolvedValue(mockSearchResult);

      const result = await service.searchClients({}, { page: 1, limit: 10 }, superAdminContext);

      expect(result).toEqual(mockSearchResult);
    });
  });

  describe('getClientsByBranch', () => {
    it('should get clients by branch successfully', async () => {
      const mockClients: Client[] = [];

      vi.mocked(mockRepository.findByBranch).mockResolvedValue(mockClients);

      const result = await service.getClientsByBranch('branch-1', mockUserContext);

      expect(mockPermissionService.requirePermission).toHaveBeenCalledWith(
        mockUserContext,
        'clients:read'
      );
      expect(mockRepository.findByBranch).toHaveBeenCalledWith('branch-1', true);
      expect(result).toEqual(mockClients);
    });

    it('should throw PermissionError if no branch access', async () => {
      const contextWithoutBranch: UserContext = {
        ...mockUserContext,
        branchIds: ['other-branch'],
      };

      await expect(service.getClientsByBranch('branch-1', contextWithoutBranch)).rejects.toThrow(
        PermissionError
      );
    });
  });

  describe('Emergency Contact Operations', () => {
    const mockClient: Client = {
      id: 'client-1',
      organizationId: 'org-1',
      branchId: 'branch-1',
      clientNumber: 'CL-001',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1980-01-01'),
      primaryAddress: {
        type: 'HOME',
        line1: '123 Main St',
        city: 'Anytown',
        state: 'ST',
        postalCode: '12345',
        country: 'US',
      },
      emergencyContacts: [],
      authorizedContacts: [],
      programs: [],
      serviceEligibility: {
        medicaidEligible: false,
        medicareEligible: false,
        veteransBenefits: false,
        longTermCareInsurance: false,
        privatePayOnly: false,
      },
      riskFlags: [],
      status: 'ACTIVE',
      createdAt: new Date(),
      createdBy: 'user-1',
      updatedAt: new Date(),
      updatedBy: 'user-1',
      version: 1,
      deletedAt: null,
      deletedBy: null,
    };

    beforeEach(() => {
      vi.mocked(mockRepository.findById).mockResolvedValue(mockClient);
    });

    it('should add an emergency contact', async () => {
      const newContact = {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: {
          number: '555-123-4567',
          type: 'MOBILE' as 'MOBILE' | 'HOME' | 'WORK',
          canReceiveSMS: true,
        },
        isPrimary: true,
        canMakeHealthcareDecisions: true,
      };

      const updatedClient = {
        ...mockClient,
        emergencyContacts: [{ ...newContact, id: 'mocked-uuid' }],
      };

      vi.mocked(mockRepository.update).mockResolvedValue(updatedClient);

      const result = await service.addEmergencyContact('client-1', newContact, mockUserContext);

      expect(mockRepository.update).toHaveBeenCalledWith(
        'client-1',
        {
          emergencyContacts: [{ ...newContact, id: 'mocked-uuid' }],
        },
        mockUserContext
      );
      expect(result.emergencyContacts).toHaveLength(1);
    });

    it('should update an emergency contact', async () => {
      const updatedContact = {
        name: 'Jane Smith',
        relationship: 'Daughter',
      };

      const clientWithContact: Client = {
        ...mockClient,
        emergencyContacts: [
          {
            id: 'contact-1',
            name: 'Jane Doe',
            relationship: 'Spouse',
            phone: {
              number: '555-123-4567',
              type: 'MOBILE' as 'MOBILE' | 'HOME' | 'WORK',
              canReceiveSMS: true,
            },
            isPrimary: true,
            canMakeHealthcareDecisions: true,
          },
        ],
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(clientWithContact);

      const updatedClient: Client = {
        ...clientWithContact,
        emergencyContacts: [
          {
            id: 'contact-1',
            name: 'Jane Smith',
            relationship: 'Daughter',
            phone: {
              number: '555-123-4567',
              type: 'MOBILE' as 'MOBILE' | 'HOME' | 'WORK',
              canReceiveSMS: true,
            },
            isPrimary: true,
            canMakeHealthcareDecisions: true,
          },
        ],
      };

      vi.mocked(mockRepository.update).mockResolvedValue(updatedClient);

      const result = await service.updateEmergencyContact(
        'client-1',
        'contact-1',
        updatedContact,
        mockUserContext
      );

      expect(result.emergencyContacts[0]?.name).toBe('Jane Smith');
      expect(result.emergencyContacts[0]?.relationship).toBe('Daughter');
    });

    it('should remove an emergency contact', async () => {
      const clientWithContact: Client = {
        ...mockClient,
        emergencyContacts: [
          {
            id: 'contact-1',
            name: 'Jane Doe',
            relationship: 'Spouse',
            phone: {
              number: '555-123-4567',
              type: 'MOBILE' as 'MOBILE' | 'HOME' | 'WORK',
              canReceiveSMS: true,
            },
            isPrimary: true,
            canMakeHealthcareDecisions: true,
          },
        ],
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(clientWithContact);

      const updatedClient = {
        ...clientWithContact,
        emergencyContacts: [],
      };

      vi.mocked(mockRepository.update).mockResolvedValue(updatedClient);

      const result = await service.removeEmergencyContact('client-1', 'contact-1', mockUserContext);

      expect(result.emergencyContacts).toHaveLength(0);
    });
  });

  describe('Risk Flag Operations', () => {
    const mockClient: Client = {
      id: 'client-1',
      organizationId: 'org-1',
      branchId: 'branch-1',
      clientNumber: 'CL-001',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1980-01-01'),
      primaryAddress: {
        type: 'HOME',
        line1: '123 Main St',
        city: 'Anytown',
        state: 'ST',
        postalCode: '12345',
        country: 'US',
      },
      emergencyContacts: [],
      authorizedContacts: [],
      programs: [],
      serviceEligibility: {
        medicaidEligible: false,
        medicareEligible: false,
        veteransBenefits: false,
        longTermCareInsurance: false,
        privatePayOnly: false,
      },
      riskFlags: [],
      status: 'ACTIVE',
      createdAt: new Date(),
      createdBy: 'user-1',
      updatedAt: new Date(),
      updatedBy: 'user-1',
      version: 1,
      deletedAt: null,
      deletedBy: null,
    };

    beforeEach(() => {
      vi.mocked(mockRepository.findById).mockResolvedValue(mockClient);
    });

    it('should add a risk flag', async () => {
      const newRiskFlag = {
        type: 'FALL_RISK' as RiskType,
        severity: 'HIGH' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        description: 'History of falls',
        requiresAcknowledgment: true,
        identifiedDate: new Date(),
      };

      const updatedClient = {
        ...mockClient,
        riskFlags: [{ ...newRiskFlag, id: 'mocked-uuid', identifiedDate: expect.any(Date) }],
      };

      vi.mocked(mockRepository.update).mockResolvedValue(updatedClient);

      const result = await service.addRiskFlag('client-1', newRiskFlag, mockUserContext);

      expect(mockRepository.update).toHaveBeenCalledWith(
        'client-1',
        {
          riskFlags: [{ ...newRiskFlag, id: 'mocked-uuid', identifiedDate: expect.any(Date) }],
        },
        mockUserContext
      );
      expect(result.riskFlags).toHaveLength(1);
    });

    it('should resolve a risk flag', async () => {
      const clientWithRisk: Client = {
        ...mockClient,
        riskFlags: [
          {
            id: 'risk-1',
            type: 'FALL_RISK' as RiskType,
            severity: 'HIGH' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
            description: 'History of falls',
            identifiedDate: new Date(),
            requiresAcknowledgment: true,
          },
        ],
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(clientWithRisk);

      const updatedClient = {
        ...clientWithRisk,
        riskFlags: [
          {
            id: 'risk-1',
            type: 'FALL_RISK' as RiskType,
            severity: 'HIGH' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
            description: 'History of falls',
            identifiedDate: new Date(),
            resolvedDate: expect.any(Date),
            requiresAcknowledgment: true,
          },
        ],
      };

      vi.mocked(mockRepository.update).mockResolvedValue(updatedClient);

      const result = await service.resolveRiskFlag('client-1', 'risk-1', mockUserContext);

      expect(result.riskFlags[0]?.resolvedDate).toBeDefined();
    });
  });

  describe('updateClientStatus', () => {
    it.skip('should update client status successfully', async () => {
      const mockClient: Client = {
        id: 'client-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        clientNumber: 'CL-001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        primaryAddress: {
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        },
        emergencyContacts: [],
        authorizedContacts: [],
        programs: [],
        serviceEligibility: {
          medicaidEligible: false,
          medicareEligible: false,
          veteransBenefits: false,
          longTermCareInsurance: false,
          privatePayOnly: false,
        },
        riskFlags: [],
        status: 'ACTIVE',
        createdAt: new Date(),
        createdBy: 'user-1',
        updatedAt: new Date(),
        updatedBy: 'user-1',
        version: 1,
        deletedAt: null,
        deletedBy: null,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(mockClient);

      const updatedClient = {
        ...mockClient,
        status: 'DISCHARGED' as ClientStatus,
        notes: 'Discharged: Moved to assisted living\n\nDischarged: No longer needed services',
      };

      vi.mocked(mockRepository.update).mockResolvedValue(updatedClient);

      const result = await service.updateClientStatus(
        'client-1',
        'DISCHARGED',
        mockUserContext,
        'No longer needed services'
      );

      expect(mockRepository.update).toHaveBeenCalledWith(
        'client-1',
        {
          status: 'DISCHARGED',
          notes: 'Discharged: Moved to assisted living\n\nDischarged: No longer needed services',
        },
        mockUserContext
      );
      expect(result.status).toBe('DISCHARGED');
    });
  });
});
