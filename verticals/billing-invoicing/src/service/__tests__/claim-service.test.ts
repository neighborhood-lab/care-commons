/**
 * Unit tests for ClaimService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClaimService } from '../claim-service';

describe('ClaimService', () => {
  let service: ClaimService;
  let mockPool: any;
  let mockRepository: any;
  let mockBillableConversionService: any;
  let mockPayerProvider: any;
  let mockClientProvider: any;
  let mockAgencyProvider: any;

  beforeEach(() => {
    mockPool = {
      connect: vi.fn(),
    };

    mockRepository = {
      createClaim: vi.fn(),
      createClaimLineItem: vi.fn(),
      getClaim: vi.fn(),
      getClaimLineItems: vi.fn(),
      getClaimCountForMonth: vi.fn(),
    };

    mockBillableConversionService = {
      convertVisitsToBillables: vi.fn(),
    };

    mockPayerProvider = {
      getPayer: vi.fn(),
    };

    mockClientProvider = {
      getClient: vi.fn(),
    };

    mockAgencyProvider = {
      getAgency: vi.fn(),
    };

    service = new ClaimService(
      mockPool,
      mockRepository,
      mockBillableConversionService,
      mockPayerProvider,
      mockClientProvider,
      mockAgencyProvider
    );
  });

  describe('generateEDI837P', () => {
    it('should generate valid EDI 837P with required segments', async () => {
      const mockClaim = {
        id: 'claim-1',
        claimNumber: 'CLM2025010001',
        payerId: 'payer-1',
        clientId: 'client-1',
        submittedDate: new Date('2025-01-01'),
      };

      const mockLineItems = [
        {
          id: 'line-1',
          serviceDate: new Date('2025-01-01'),
          serviceCode: 'T1019',
          chargeAmount: 100,
          units: 4,
          modifiers: [],
        },
      ];

      const mockPayer = {
        id: 'payer-1',
        payerName: 'Test Insurance',
        payer_id: '12345',
        nationalPayerId: '12345',
      };

      const mockClient = {
        id: 'client-1',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        memberId: 'MEM123',
        address: {
          line1: '123 Main St',
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
        },
      };

      const mockAgency = {
        id: 'agency-1',
        name: 'Test Agency',
        npi: '1234567890',
        taxId: '12-3456789',
        address: {
          line1: '456 Agency St',
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
        },
      };

      mockRepository.getClaim.mockResolvedValue(mockClaim);
      mockRepository.getClaimLineItems.mockResolvedValue(mockLineItems);
      mockPayerProvider.getPayer.mockResolvedValue(mockPayer);
      mockClientProvider.getClient.mockResolvedValue(mockClient);
      mockAgencyProvider.getAgency.mockResolvedValue(mockAgency);

      const edi = await service.generateEDI837P('claim-1' as any);

      // Check for required segments
      expect(edi).toContain('ISA*');
      expect(edi).toContain('GS*');
      expect(edi).toContain('ST*837*');
      expect(edi).toContain('BHT*');
      expect(edi).toContain('CLM*');
      expect(edi).toContain('SE*');
      expect(edi).toContain('GE*');
      expect(edi).toContain('IEA*');
    });
  });
});
