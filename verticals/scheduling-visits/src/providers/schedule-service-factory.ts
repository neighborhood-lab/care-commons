/**
 * Schedule Service Factory
 *
 * Provides factory functions for creating properly-wired ScheduleService instances
 * with all required dependencies (client address provider, credential compliance, etc.)
 *
 * This eliminates the need to manually wire up dependencies and ensures
 * consistent configuration across the application.
 */

import type { Pool } from 'pg';
import type { UserContext } from '@care-commons/core';
import { ScheduleService, ICredentialComplianceProvider } from '../service/schedule-service.js';
import { ScheduleRepository } from '../repository/schedule-repository.js';
import { ClientAddressProvider } from './client-address-provider.js';
import { ClientServiceAdapter } from './client-service-adapter.js';
import type { ClientService } from '@care-commons/client-demographics';

/**
 * Factory configuration options
 */
export interface ScheduleServiceFactoryOptions {
  /** Database connection pool */
  pool: Pool;

  /** Client service from client-demographics vertical */
  clientService: ClientService;

  /** System user context for internal operations */
  systemContext: UserContext;

  /** Cache TTL for client addresses (default: 5 minutes) */
  addressCacheTTL?: number;

  /** 
   * Credential compliance provider from caregiver-staff vertical
   * When provided, caregiver assignments will be validated against
   * credential expiration and compliance status
   */
  credentialProvider?: ICredentialComplianceProvider;
}

/**
 * Create a fully-wired ScheduleService with client address provider
 *
 * Example usage:
 * ```typescript
 * import { createScheduleService } from '@care-commons/scheduling-visits';
 * import { ClientService } from '@care-commons/client-demographics';
 *
 * const clientService = new ClientService(clientRepository);
 *
 * const scheduleService = createScheduleService({
 *   pool: dbPool,
 *   clientService,
 *   systemContext: {
 *     userId: 'system',
 *     organizationId: 'system',
 *     branchIds: [],
 *     roles: ['SUPER_ADMIN'],
 *     permissions: [],
 *   },
 * });
 *
 * // Now schedule service has real client address lookups
 * const visits = await scheduleService.generateScheduleFromPattern(options, userContext);
 * ```
 *
 * @param options Factory configuration
 * @returns Fully-configured ScheduleService instance
 */
export function createScheduleService(
  options: ScheduleServiceFactoryOptions
): ScheduleService {
  const { pool, clientService, systemContext, addressCacheTTL, credentialProvider } = options;

  // Create the repository
  const repository = new ScheduleRepository(pool);

  // Wrap client service with adapter to match IClientService interface
  const clientServiceAdapter = new ClientServiceAdapter(clientService);

  // Create client address provider with caching
  const clientAddressProvider = new ClientAddressProvider(
    clientServiceAdapter,
    systemContext,
    addressCacheTTL
  );

  // Create the schedule service
  const scheduleService = new ScheduleService(repository, clientAddressProvider);

  // Wire up credential compliance provider if provided
  // This enables compliance checking before caregiver assignment
  if (credentialProvider) {
    scheduleService.setCredentialProvider(credentialProvider);
  }

  return scheduleService;
}

/**
 * Create a ScheduleService without client address provider
 *
 * This should only be used for testing or in scenarios where
 * address lookups are not needed. Production code should use
 * createScheduleService() with a proper client service.
 *
 * @param pool Database connection pool
 * @returns ScheduleService without address provider (will throw errors on address lookups)
 */
export function createScheduleServiceWithoutAddresses(
  pool: Pool
): ScheduleService {
  const repository = new ScheduleRepository(pool);
  return new ScheduleService(repository);
}
