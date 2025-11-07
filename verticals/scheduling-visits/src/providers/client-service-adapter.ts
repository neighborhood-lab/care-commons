/**
 * Client Service Adapter
 *
 * Adapts the ClientService from client-demographics to work with
 * the IClientService interface required by ClientAddressProvider.
 *
 * This adapter:
 * - Handles error-to-null conversion (NotFoundError → null)
 * - Maps Client type to ClientWithAddress interface
 * - Provides a bridge between verticals without tight coupling
 */

import type { UUID, UserContext } from '@care-commons/core';
import type { IClientService } from './client-address-provider';
import type { ClientService, Client } from '@care-commons/client-demographics';

/**
 * Adapter that wraps ClientService to conform to IClientService interface
 *
 * Usage:
 * ```typescript
 * import { ClientService } from '@care-commons/client-demographics';
 * import { ClientServiceAdapter } from './client-service-adapter';
 *
 * const clientService = new ClientService(clientRepository);
 * const adapter = new ClientServiceAdapter(clientService);
 * const addressProvider = new ClientAddressProvider(adapter, systemContext);
 * ```
 */
export class ClientServiceAdapter implements IClientService {
  constructor(private clientService: ClientService) {}

  /**
   * Get client by ID, returning null if not found
   *
   * Maps the full Client object from client-demographics to the minimal
   * ClientWithAddress interface needed for address resolution.
   *
   * @param id Client UUID
   * @param context User context for authorization
   * @returns Client with address data, or null if not found
   */
  async getClientById(
    id: string,
    context: UserContext
  ): Promise<{
    id: UUID;
    primaryAddress: {
      type: 'HOME' | 'BILLING' | 'TEMPORARY';
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      latitude?: number;
      longitude?: number;
    };
    secondaryAddresses?: Array<{
      type: 'HOME' | 'BILLING' | 'TEMPORARY';
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      latitude?: number;
      longitude?: number;
    }>;
  } | null> {
    try {
      const client: Client = await this.clientService.getClientById(id, context);

      // Map Client to ClientWithAddress
      // The types are already compatible, but we explicitly map for clarity
      return {
        id: client.id,
        primaryAddress: client.primaryAddress,
        secondaryAddresses: client.secondaryAddresses,
      };
    } catch (error) {
      // Convert NotFoundError to null return
      // This matches the IClientService contract
      if (error && typeof error === 'object' && 'name' in error && error.name === 'NotFoundError') {
        return null;
      }

      // Re-throw other errors (permission errors, validation errors, etc.)
      throw error;
    }
  }
}
