/**
 * Tests for ClientRepository
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientRepository } from '../../repository/client-repository';
import { Client, ClientStatus } from '../../types/client';

interface MockDatabase {
  query: ReturnType<typeof vi.fn>;
  getClient: ReturnType<typeof vi.fn>;
  transaction: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  healthCheck: ReturnType<typeof vi.fn>;
  pool: unknown;
}

describe('ClientRepository', () => {
  let repository: ClientRepository;
  let mockDatabase: MockDatabase;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock database
    mockDatabase = {
      query: vi.fn(),
      getClient: vi.fn(),
      transaction: vi.fn(),
      close: vi.fn(),
      healthCheck: vi.fn(),
    } as any;

    repository = new ClientRepository(mockDatabase as any);
  });

  describe('mapRowToEntity', () => {
    it('should map database row to Client entity', () => {
      const mockRow = {
        id: 'test-id',
        organization_id: 'org-1',
        branch_id: 'branch-1',
        client_number: 'CL-001',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: new Date('1980-01-01'),
        primary_address: JSON.stringify({
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        }),
        emergency_contacts: JSON.stringify([]),
        authorized_contacts: JSON.stringify([]),
        programs: JSON.stringify([]),
        service_eligibility: JSON.stringify({
          medicaidEligible: false,
          medicareEligible: false,
          veteransBenefits: false,
          longTermCareInsurance: false,
          privatePayOnly: false,
        }),
        risk_flags: JSON.stringify([]),
        status: 'ACTIVE',
        created_at: new Date(),
        created_by: 'user-1',
        updated_at: new Date(),
        updated_by: 'user-1',
        version: 1,
        deleted_at: null,
        deleted_by: null,
      };

      const result = (repository as any).mapRowToEntity(mockRow);

      expect(result.id).toBe('test-id');
      expect(result.organizationId).toBe('org-1');
      expect(result.branchId).toBe('branch-1');
      expect(result.clientNumber).toBe('CL-001');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.dateOfBirth).toEqual(new Date('1980-01-01'));
      expect(result.primaryAddress).toEqual({
        type: 'HOME',
        line1: '123 Main St',
        city: 'Anytown',
        state: 'ST',
        postalCode: '12345',
        country: 'US',
      });
      expect(result.status).toBe('ACTIVE');
    });

    it('should handle optional properties correctly', () => {
      const mockRow = {
        id: 'test-id',
        organization_id: 'org-1',
        branch_id: 'branch-1',
        client_number: 'CL-001',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: new Date('1980-01-01'),
        primary_address: JSON.stringify({
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        }),
        emergency_contacts: JSON.stringify([]),
        authorized_contacts: JSON.stringify([]),
        programs: JSON.stringify([]),
        service_eligibility: JSON.stringify({
          medicaidEligible: false,
          medicareEligible: false,
          veteransBenefits: false,
          longTermCareInsurance: false,
          privatePayOnly: false,
        }),
        risk_flags: JSON.stringify([]),
        status: 'ACTIVE',
        created_at: new Date(),
        created_by: 'user-1',
        updated_at: new Date(),
        updated_by: 'user-1',
        version: 1,
        deleted_at: null,
        deleted_by: null,
        middle_name: 'Marie',
        preferred_name: 'Johnny',
        gender: 'MALE',
        primary_phone: JSON.stringify({
          number: '555-123-4567',
          type: 'MOBILE',
          canReceiveSMS: true,
        }),
        email: 'john@example.com',
      };

      const result = (repository as any).mapRowToEntity(mockRow);

      expect(result.middleName).toBe('Marie');
      expect(result.preferredName).toBe('Johnny');
      expect(result.gender).toBe('MALE');
      expect(result.primaryPhone).toEqual({
        number: '555-123-4567',
        type: 'MOBILE',
        canReceiveSMS: true,
      });
      expect(result.email).toBe('john@example.com');
    });
  });

  describe('mapEntityToRow', () => {
    it('should map Client entity to database row', () => {
      const client: Partial<Client> = {
        id: 'test-id',
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

      const result = (repository as any).mapEntityToRow(client);

      expect(result['organization_id']).toBe('org-1');
      expect(result['branch_id']).toBe('branch-1');
      expect(result['client_number']).toBe('CL-001');
      expect(result['first_name']).toBe('John');
      expect(result['last_name']).toBe('Doe');
      expect(result['date_of_birth']).toEqual(new Date('1980-01-01'));
      expect(result['primary_address']).toBe(JSON.stringify({
        type: 'HOME',
        line1: '123 Main St',
        city: 'Anytown',
        state: 'ST',
        postalCode: '12345',
        country: 'US',
      }));
      expect(result['status']).toBe('ACTIVE');
    });

    it('should handle optional properties correctly', () => {
      const client: Partial<Client> = {
        firstName: 'John',
        middleName: 'Marie',
        preferredName: 'Johnny',
        gender: 'MALE',
        primaryPhone: {
          number: '555-123-4567',
          type: 'MOBILE',
          canReceiveSMS: true,
        },
        email: 'john@example.com',
      };

      const result = (repository as any).mapEntityToRow(client);

      expect(result['first_name']).toBe('John');
      expect(result['middle_name']).toBe('Marie');
      expect(result['preferred_name']).toBe('Johnny');
      expect(result['gender']).toBe('MALE');
      expect(result['primary_phone']).toBe(JSON.stringify({
        number: '555-123-4567',
        type: 'MOBILE',
        canReceiveSMS: true,
      }));
      expect(result['email']).toBe('john@example.com');
    });
  });

  describe('findByClientNumber', () => {
    it.skip('should find client by client number successfully', async () => {
      const mockClient = {
        id: 'test-id',
        client_number: 'CL-001',
        organization_id: 'org-1',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: new Date('1980-01-01'),
        primary_address: JSON.stringify({
          type: 'HOME',
          line1: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US',
        }),
        emergency_contacts: JSON.stringify([]),
        authorized_contacts: JSON.stringify([]),
        programs: JSON.stringify([]),
        service_eligibility: JSON.stringify({
          medicaidEligible: false,
          medicareEligible: false,
          veteransBenefits: false,
          longTermCareInsurance: false,
          privatePayOnly: false,
        }),
        risk_flags: JSON.stringify([]),
        status: 'ACTIVE',
        created_at: new Date(),
        created_by: 'user-1',
        updated_at: new Date(),
        updated_by: 'user-1',
        version: 1,
        deleted_at: null,
        deleted_by: null,
      };

      const mockResult = {
        rows: [mockClient],
        rowCount: 1,
        command: 'SELECT' as const,
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      const result = await repository.findByClientNumber('CL-001', 'org-1');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('client_number = $1 AND organization_id = $2'),
        ['CL-001', 'org-1']
      );
      expect(result).toBeDefined();
      expect(result?.clientNumber).toBe('CL-001');
    });

    it('should return null when client not found', async () => {
      const mockResult = {
        rows: [],
        rowCount: 0,
        command: 'SELECT' as const,
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      const result = await repository.findByClientNumber('CL-001', 'org-1');

      expect(result).toBeNull();
    });
  });

  describe('search', () => {
    it('should search clients with filters', async () => {
      const mockResult = {
        rows: [{
          id: 'test-id',
          client_number: 'CL-001',
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: new Date('1980-01-01'),
          primary_address: JSON.stringify({
            type: 'HOME',
            line1: '123 Main St',
            city: 'Anytown',
            state: 'ST',
            postalCode: '12345',
            country: 'US',
          }),
          emergency_contacts: JSON.stringify([]),
          authorized_contacts: JSON.stringify([]),
          programs: JSON.stringify([]),
          service_eligibility: JSON.stringify({
            medicaidEligible: false,
            medicareEligible: false,
            veteransBenefits: false,
            longTermCareInsurance: false,
            privatePayOnly: false,
          }),
          risk_flags: JSON.stringify([]),
          status: 'ACTIVE',
          created_at: new Date(),
          created_by: 'user-1',
          updated_at: new Date(),
          updated_by: 'user-1',
          version: 1,
          deleted_at: null,
          deleted_by: null,
        }],
        rowCount: 1,
        command: 'SELECT' as const,
        oid: 0,
        fields: [],
      };

      const countResult = {
        rows: [{ count: '1' }],
        rowCount: 1,
        command: 'SELECT' as const,
        oid: 0,
        fields: [],
      };

      mockDatabase.query
        .mockResolvedValueOnce(countResult) // First call for count
        .mockResolvedValueOnce(mockResult); // Second call for data

      const filters = { query: 'John', status: ['ACTIVE' as ClientStatus] };
      const pagination = { page: 1, limit: 10 };

      const result = await repository.search(filters, pagination);

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should throw error when count query returns no rows', async () => {
      const countResult = {
        rows: [],
        rowCount: 0,
        command: 'SELECT' as const,
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(countResult);

      const filters = { query: 'John', status: ['ACTIVE' as ClientStatus] };
      const pagination = { page: 1, limit: 10 };

      await expect(repository.search(filters, pagination)).rejects.toThrow('Count query returned no rows');
    });

    it('should search with city filter', async () => {
      const mockResult = {
        rows: [],
        rowCount: 0,
        command: 'SELECT' as const,
        oid: 0,
        fields: [],
      };

      const countResult = {
        rows: [{ count: '0' }],
        rowCount: 1,
        command: 'SELECT' as const,
        oid: 0,
        fields: [],
      };

      mockDatabase.query
        .mockResolvedValueOnce(countResult) // First call for count
        .mockResolvedValueOnce(mockResult); // Second call for data

      const filters = { city: 'Springfield' };
      const pagination = { page: 1, limit: 10 };

      await repository.search(filters, pagination);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining("primary_address::jsonb->>'city' ILIKE $"),
        expect.arrayContaining(['%Springfield%'])
      );
    });

    it('should search with state filter', async () => {
      const mockResult = {
        rows: [],
        rowCount: 0,
        command: 'SELECT' as const,
        oid: 0,
        fields: [],
      };

      const countResult = {
        rows: [{ count: '0' }],
        rowCount: 1,
        command: 'SELECT' as const,
        oid: 0,
        fields: [],
      };

      mockDatabase.query
        .mockResolvedValueOnce(countResult) // First call for count
        .mockResolvedValueOnce(mockResult); // Second call for data

      const filters = { state: 'IL' };
      const pagination = { page: 1, limit: 10 };

      await repository.search(filters, pagination);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining("primary_address::jsonb->>'state' = $"),
        expect.arrayContaining(['IL'])
      );
    });
  });

  describe('findByBranch', () => {
    it('should find clients by branch', async () => {
      const mockResult = {
        rows: [{
          id: 'test-id',
          client_number: 'CL-001',
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: new Date('1980-01-01'),
          primary_address: JSON.stringify({
            type: 'HOME',
            line1: '123 Main St',
            city: 'Anytown',
            state: 'ST',
            postalCode: '12345',
            country: 'US',
          }),
          emergency_contacts: JSON.stringify([]),
          authorized_contacts: JSON.stringify([]),
          programs: JSON.stringify([]),
          service_eligibility: JSON.stringify({
            medicaidEligible: false,
            medicareEligible: false,
            veteransBenefits: false,
            longTermCareInsurance: false,
            privatePayOnly: false,
          }),
          risk_flags: JSON.stringify([]),
          status: 'ACTIVE',
          created_at: new Date(),
          created_by: 'user-1',
          updated_at: new Date(),
          updated_by: 'user-1',
          version: 1,
          deleted_at: null,
          deleted_by: null,
        }],
        rowCount: 1,
        command: 'SELECT' as const,
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      const result = await repository.findByBranch('branch-1');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('branch_id = $1'),
        ['branch-1']
      );
      expect(result).toHaveLength(1);
    });

    it('should find all clients by branch regardless of status', async () => {
      const mockResult = {
        rows: [],
        rowCount: 0,
        command: 'SELECT' as const,
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      const result = await repository.findByBranch('branch-1', false);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('branch_id = $1'),
        ['branch-1']
      );
      expect(result).toHaveLength(0);
    });
  });
});