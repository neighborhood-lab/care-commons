/**
 * ClientProvider Tests
 * 
 * Tests for the ClientProvider implementation that fetches client demographic
 * data for EVV compliance operations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientProvider, createClientProvider } from '../client-provider';
import { NotFoundError } from '@care-commons/core';
import type { Database } from '@care-commons/core';

describe('ClientProvider', () => {
  let clientProvider: ClientProvider;
  let mockDatabase: Database;

  beforeEach(() => {
    mockDatabase = {
      query: vi.fn(),
    } as unknown as Database;
    clientProvider = new ClientProvider(mockDatabase);
  });

  describe('getClientForEVV', () => {
    it('should fetch and format client data successfully', async () => {
      const mockClientData = {
        id: 'client-123',
        first_name: 'John',
        middle_name: 'Michael',
        last_name: 'Doe',
        date_of_birth: '1950-01-15',
        primary_address: JSON.stringify({
          line1: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
        }),
        service_eligibility: JSON.stringify({
          medicaid: {
            memberId: 'TX-123456789',
            programName: 'TX STAR+PLUS',
            programType: 'WAIVER',
          },
        }),
        primary_phone: JSON.stringify({
          number: '512-555-1234',
          type: 'MOBILE',
        }),
        email: 'john.doe@example.com',
      };

      (mockDatabase.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [mockClientData],
      });

      const result = await clientProvider.getClientForEVV('client-123' as any);

      expect(result).toEqual({
        id: 'client-123',
        name: 'John Michael Doe',
        medicaidId: 'TX-123456789',
        dateOfBirth: new Date('1950-01-15'),
        stateCode: 'TX',
        stateMedicaidProgram: 'TX STAR+PLUS',
        primaryPhone: '512-555-1234',
        email: 'john.doe@example.com',
      });

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['client-123']
      );
    });

    it('should handle client without middle name', async () => {
      const mockClientData = {
        id: 'client-456',
        first_name: 'Jane',
        middle_name: null,
        last_name: 'Smith',
        date_of_birth: '1960-05-20',
        primary_address: JSON.stringify({
          state: 'FL',
        }),
        service_eligibility: JSON.stringify({}),
        primary_phone: null,
        email: null,
      };

      (mockDatabase.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [mockClientData],
      });

      const result = await clientProvider.getClientForEVV('client-456' as any);

      expect(result.name).toBe('Jane Smith');
      expect(result.medicaidId).toBeUndefined();
      expect(result.primaryPhone).toBeUndefined();
      expect(result.email).toBeUndefined();
    });

    it('should handle alternate service eligibility formats', async () => {
      const mockClientData = {
        id: 'client-789',
        first_name: 'Bob',
        last_name: 'Johnson',
        date_of_birth: '1945-12-25',
        primary_address: JSON.stringify({ state: 'CA' }),
        service_eligibility: JSON.stringify({
          medicaidId: 'CA-987654321', // Alternate format
        }),
        primary_phone: null,
        email: null,
      };

      (mockDatabase.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [mockClientData],
      });

      const result = await clientProvider.getClientForEVV('client-789' as any);

      expect(result.medicaidId).toBe('CA-987654321');
    });

    it('should handle JSONB fields that are already parsed', async () => {
      const mockClientData = {
        id: 'client-999',
        first_name: 'Alice',
        last_name: 'Williams',
        date_of_birth: '1955-03-10',
        primary_address: { state: 'NY' }, // Already parsed
        service_eligibility: { medicaidId: 'NY-111222333' }, // Already parsed
        primary_phone: { number: '212-555-9999' }, // Already parsed
        email: 'alice@example.com',
      };

      (mockDatabase.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [mockClientData],
      });

      const result = await clientProvider.getClientForEVV('client-999' as any);

      expect(result.stateCode).toBe('NY');
      expect(result.medicaidId).toBe('NY-111222333');
      expect(result.primaryPhone).toBe('212-555-9999');
    });

    it('should default to UNKNOWN state when address is missing state', async () => {
      const mockClientData = {
        id: 'client-000',
        first_name: 'Test',
        last_name: 'User',
        date_of_birth: '1970-01-01',
        primary_address: JSON.stringify({ city: 'Unknown' }),
        service_eligibility: JSON.stringify({}),
        primary_phone: null,
        email: null,
      };

      (mockDatabase.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [mockClientData],
      });

      const result = await clientProvider.getClientForEVV('client-000' as any);

      expect(result.stateCode).toBe('UNKNOWN');
    });

    it('should extract program type when program name is not available', async () => {
      const mockClientData = {
        id: 'client-888',
        first_name: 'Mary',
        last_name: 'Brown',
        date_of_birth: '1965-07-15',
        primary_address: JSON.stringify({ state: 'FL' }),
        service_eligibility: JSON.stringify({
          medicaid: {
            memberId: 'FL-555666777',
            programType: 'MANAGED_CARE', // No programName
          },
        }),
        primary_phone: null,
        email: null,
      };

      (mockDatabase.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [mockClientData],
      });

      const result = await clientProvider.getClientForEVV('client-888' as any);

      expect(result.stateMedicaidProgram).toBe('MANAGED_CARE');
    });

    it('should throw NotFoundError when client does not exist', async () => {
      (mockDatabase.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [],
      });

      await expect(
        clientProvider.getClientForEVV('nonexistent-client' as any)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError with correct context', async () => {
      (mockDatabase.query as ReturnType<typeof vi.fn>).mockResolvedValue({
        rows: [],
      });

      try {
        await clientProvider.getClientForEVV('missing-123' as any);
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect((error as NotFoundError).message).toContain('Client not found');
      }
    });

    it('should handle database query errors', async () => {
      (mockDatabase.query as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        clientProvider.getClientForEVV('client-123' as any)
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('Factory Function', () => {
    it('should create ClientProvider instance via factory', () => {
      const provider = createClientProvider(mockDatabase);
      
      expect(provider).toBeInstanceOf(ClientProvider);
      expect(provider).toHaveProperty('getClientForEVV');
    });
  });
});
