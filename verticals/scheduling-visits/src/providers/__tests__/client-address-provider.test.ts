/**
 * ClientAddressProvider Tests
 *
 * Tests for client address fetching, caching, and selection logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientAddressProvider, IClientService } from '../client-address-provider';
import type { UserContext, UUID } from '@care-commons/core';
import { NotFoundError } from '@care-commons/core';

// Mock client service
const mockClientService: IClientService = {
  getClientById: vi.fn(),
};

// Test context
const testContext: UserContext = {
  userId: 'system-user' as UUID,
  organizationId: 'org-123' as UUID,
  branchIds: ['branch-123' as UUID],
  roles: ['SUPER_ADMIN'],
  permissions: ['clients:read'],
};

describe('ClientAddressProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Address Selection Logic', () => {
    it('should return primary HOME address when available', async () => {
      const mockClient = {
        id: 'client-123' as UUID,
        primaryAddress: {
          type: 'HOME' as const,
          line1: '123 Main St',
          line2: 'Apt 4',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'USA',
          latitude: 30.2672,
          longitude: -97.7431,
        },
      };

      mockClientService.getClientById = vi.fn().mockResolvedValue(mockClient);

      const provider = new ClientAddressProvider(
        mockClientService,
        testContext,
        60000
      );

      const address = await provider.getClientAddress('client-123' as UUID);

      expect(address.line1).toBe('123 Main St');
      expect(address.city).toBe('Austin');
      expect(address.state).toBe('TX');
      expect(address.geofenceRadius).toBe(100); // Default geofence
    });

    it('should prefer secondary HOME address over non-HOME primary', async () => {
      const mockClient = {
        id: 'client-456' as UUID,
        primaryAddress: {
          type: 'BILLING' as const,
          line1: 'PO Box 999',
          city: 'Austin',
          state: 'TX',
          postalCode: '78700',
          country: 'USA',
        },
        secondaryAddresses: [{
          type: 'HOME' as const,
          line1: '456 Oak Ave',
          line2: 'Unit B',
          city: 'Austin',
          state: 'TX',
          postalCode: '78702',
          country: 'USA',
          latitude: 30.2500,
          longitude: -97.7300,
        }],
      };

      mockClientService.getClientById = vi.fn().mockResolvedValue(mockClient);

      const provider = new ClientAddressProvider(
        mockClientService,
        testContext
      );

      const address = await provider.getClientAddress('client-456' as UUID);

      expect(address.line1).toBe('456 Oak Ave');
      expect(address.line2).toBe('Unit B');
    });

    it('should use primary address even if not HOME type when no HOME address exists', async () => {
      const mockClient = {
        id: 'client-789' as UUID,
        primaryAddress: {
          type: 'TEMPORARY' as const,
          line1: '789 Pine Rd',
          city: 'Dallas',
          state: 'TX',
          postalCode: '75201',
          country: 'USA',
        },
        secondaryAddresses: [],
      };

      mockClientService.getClientById = vi.fn().mockResolvedValue(mockClient);

      const provider = new ClientAddressProvider(
        mockClientService,
        testContext
      );

      const address = await provider.getClientAddress('client-789' as UUID);

      expect(address.line1).toBe('789 Pine Rd');
      expect(address.city).toBe('Dallas');
    });

    it('should throw error when client not found', async () => {
      mockClientService.getClientById = vi.fn().mockResolvedValue(null);

      const provider = new ClientAddressProvider(
        mockClientService,
        testContext
      );

      await expect(
        provider.getClientAddress('nonexistent' as UUID)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Caching', () => {
    it('should cache addresses after first fetch', async () => {
      const mockClient = {
        id: 'client-cache' as UUID,
        primaryAddress: {
          type: 'HOME' as const,
          line1: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'USA',
        },
      };

      mockClientService.getClientById = vi.fn().mockResolvedValue(mockClient);

      const provider = new ClientAddressProvider(
        mockClientService,
        testContext,
        60000 // 60 second TTL
      );

      // First call - should hit the service
      await provider.getClientAddress('client-cache' as UUID);
      expect(mockClientService.getClientById).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await provider.getClientAddress('client-cache' as UUID);
      expect(mockClientService.getClientById).toHaveBeenCalledTimes(1);

      // Verify cache stats
      const stats = provider.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.ttl).toBe(60000);
    });

    it('should expire cache after TTL', async () => {
      const mockClient = {
        id: 'client-expire' as UUID,
        primaryAddress: {
          type: 'HOME' as const,
          line1: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'USA',
        },
      };

      mockClientService.getClientById = vi.fn().mockResolvedValue(mockClient);

      const provider = new ClientAddressProvider(
        mockClientService,
        testContext,
        100 // 100ms TTL for testing
      );

      // First call
      await provider.getClientAddress('client-expire' as UUID);
      expect(mockClientService.getClientById).toHaveBeenCalledTimes(1);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should fetch again after expiration
      await provider.getClientAddress('client-expire' as UUID);
      expect(mockClientService.getClientById).toHaveBeenCalledTimes(2);
    });

    it('should invalidate specific client from cache', async () => {
      const mockClient = {
        id: 'client-invalidate' as UUID,
        primaryAddress: {
          type: 'HOME' as const,
          line1: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'USA',
        },
      };

      mockClientService.getClientById = vi.fn().mockResolvedValue(mockClient);

      const provider = new ClientAddressProvider(
        mockClientService,
        testContext
      );

      // First call - cache it
      await provider.getClientAddress('client-invalidate' as UUID);
      expect(mockClientService.getClientById).toHaveBeenCalledTimes(1);

      // Invalidate the cache
      provider.invalidateClient('client-invalidate' as UUID);

      // Should fetch again after invalidation
      await provider.getClientAddress('client-invalidate' as UUID);
      expect(mockClientService.getClientById).toHaveBeenCalledTimes(2);
    });

    it('should clear entire cache', async () => {
      mockClientService.getClientById = vi
        .fn()
        .mockResolvedValueOnce({
          id: 'client-1' as UUID,
          primaryAddress: {
            type: 'HOME' as const,
            line1: '123 Main St',
            city: 'Austin',
            state: 'TX',
            postalCode: '78701',
            country: 'USA',
          }
        })
        .mockResolvedValueOnce({
          id: 'client-2' as UUID,
          primaryAddress: {
            type: 'HOME' as const,
            line1: '456 Oak Ave',
            city: 'Dallas',
            state: 'TX',
            postalCode: '75201',
            country: 'USA',
          }
        });

      const provider = new ClientAddressProvider(
        mockClientService,
        testContext
      );

      // Cache two clients
      await provider.getClientAddress('client-1' as UUID);
      await provider.getClientAddress('client-2' as UUID);

      expect(provider.getCacheStats().size).toBe(2);

      // Clear cache
      provider.clearCache();

      expect(provider.getCacheStats().size).toBe(0);
    });
  });

  describe('Geofencing', () => {
    it('should include default geofence radius', async () => {
      const mockClient = {
        id: 'client-geofence' as UUID,
        primaryAddress: {
          type: 'HOME' as const,
          line1: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'USA',
          latitude: 30.2672,
          longitude: -97.7431,
        },
      };

      mockClientService.getClientById = vi.fn().mockResolvedValue(mockClient);

      const provider = new ClientAddressProvider(
        mockClientService,
        testContext
      );

      const address = await provider.getClientAddress('client-geofence' as UUID);

      expect(address.geofenceRadius).toBe(100); // Default radius
    });

    it('should include GPS coordinates when available', async () => {
      const mockClient = {
        id: 'client-gps' as UUID,
        primaryAddress: {
          type: 'HOME' as const,
          line1: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'USA',
          latitude: 30.2672,
          longitude: -97.7431,
        },
      };

      mockClientService.getClientById = vi.fn().mockResolvedValue(mockClient);

      const provider = new ClientAddressProvider(
        mockClientService,
        testContext
      );

      const address = await provider.getClientAddress('client-gps' as UUID);

      expect(address.latitude).toBe(30.2672);
      expect(address.longitude).toBe(-97.7431);
    });
  });
});
