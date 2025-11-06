/**
 * Client Address Provider
 *
 * Provides client address data to the scheduling service
 * with caching for performance optimization.
 */

import { UUID, NotFoundError } from '@care-commons/core';
import { IClientAddressProvider } from '../service/schedule-service';
import type { ClientService } from '../../../client-demographics/src/service/client-service';
import type { UserContext } from '@care-commons/core';

/**
 * Cache entry for client addresses
 */
interface CachedAddress {
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
    geofenceRadius?: number;
  };
  cachedAt: number;
}

/**
 * Default cache TTL: 5 minutes
 * Addresses don't change frequently, so caching improves performance
 */
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Default geofence radius in meters for EVV validation
 * Can be overridden per client if stored in their address data
 */
const DEFAULT_GEOFENCE_RADIUS = 100;

/**
 * ClientAddressProvider implementation
 *
 * Fetches client addresses from the client-demographics service
 * with in-memory caching to reduce database queries.
 *
 * Caching Strategy:
 * - In-memory cache with configurable TTL (default 5 minutes)
 * - Cache invalidation on manual clear
 * - Future: Can be replaced with Redis for multi-instance deployments
 *
 * Address Selection Priority:
 * 1. Primary address (if type is 'HOME')
 * 2. First secondary address with type 'HOME'
 * 3. Any primary address regardless of type
 * 4. Throw error if no address found
 */
export class ClientAddressProvider implements IClientAddressProvider {
  private cache: Map<UUID, CachedAddress> = new Map();
  private cacheTTL: number;
  private systemContext: UserContext;

  constructor(
    private clientService: ClientService,
    systemContext: UserContext,
    cacheTTL: number = DEFAULT_CACHE_TTL_MS
  ) {
    this.cacheTTL = cacheTTL;
    this.systemContext = systemContext;
  }

  /**
   * Get client address with caching
   */
  async getClientAddress(clientId: UUID): Promise<{
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
    geofenceRadius?: number;
  }> {
    // Check cache first
    const cached = this.getFromCache(clientId);
    if (cached) {
      return cached;
    }

    // Fetch from client service
    const client = await this.clientService.getClientById(clientId, this.systemContext);
    if (!client) {
      throw new NotFoundError(`Client not found: ${clientId}`);
    }

    // Select the appropriate address
    let selectedAddress = client.primaryAddress;

    // Prefer HOME type addresses
    if (selectedAddress.type !== 'HOME' && client.secondaryAddresses) {
      const homeAddress = client.secondaryAddresses.find(addr => addr.type === 'HOME');
      if (homeAddress) {
        selectedAddress = homeAddress;
      }
    }

    if (!selectedAddress) {
      throw new NotFoundError(`No address found for client: ${clientId}`);
    }

    // Transform to the expected format
    const address = {
      line1: selectedAddress.line1,
      line2: selectedAddress.line2,
      city: selectedAddress.city,
      state: selectedAddress.state,
      postalCode: selectedAddress.postalCode,
      country: selectedAddress.country,
      latitude: selectedAddress.latitude,
      longitude: selectedAddress.longitude,
      geofenceRadius: DEFAULT_GEOFENCE_RADIUS, // Could be enhanced to store per-client
    };

    // Cache the result
    this.addToCache(clientId, address);

    return address;
  }

  /**
   * Get address from cache if not expired
   */
  private getFromCache(clientId: UUID): CachedAddress['address'] | null {
    const cached = this.cache.get(clientId);
    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.cachedAt;
    if (age > this.cacheTTL) {
      // Expired, remove from cache
      this.cache.delete(clientId);
      return null;
    }

    return cached.address;
  }

  /**
   * Add address to cache
   */
  private addToCache(clientId: UUID, address: CachedAddress['address']): void {
    this.cache.set(clientId, {
      address,
      cachedAt: Date.now(),
    });
  }

  /**
   * Invalidate cache for a specific client
   * Should be called when a client's address is updated
   */
  invalidateClient(clientId: UUID): void {
    this.cache.delete(clientId);
  }

  /**
   * Clear entire cache
   * Useful for testing or when bulk address updates occur
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics (useful for monitoring)
   */
  getCacheStats(): { size: number; ttl: number } {
    return {
      size: this.cache.size,
      ttl: this.cacheTTL,
    };
  }
}
