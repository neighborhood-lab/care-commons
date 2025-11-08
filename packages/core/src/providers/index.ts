/**
 * Provider Factory
 *
 * Central factory for creating provider instances.
 * This provides a convenient way to initialize all providers at once.
 */

import { Database } from '../db/connection.js';
import {
  IClientProvider,
  createClientProvider,
} from './client.provider.js';
import {
  ICaregiverProvider,
  createCaregiverProvider,
} from './caregiver.provider.js';
import {
  IVisitProvider,
  createVisitProvider,
} from './visit.provider.js';
import {
  ICarePlanProvider,
  createCarePlanProvider,
} from './care-plan.provider.js';
import {
  IFamilyMemberProvider,
  createFamilyMemberProvider,
} from './family-member.provider.js';
import {
  IUserProvider,
  createUserProvider,
} from './user.provider.js';

// Re-export provider interfaces and factory functions (not concrete classes or data types to avoid conflicts)
export type {
  IClientProvider,
  Client,
  ClientFilters,
} from './client.provider.js';
export { createClientProvider } from './client.provider.js';

export type {
  ICaregiverProvider,
  Caregiver,
  CaregiverFilters,
} from './caregiver.provider.js';
export { createCaregiverProvider } from './caregiver.provider.js';

export type {
  IVisitProvider,
  VisitFilters,
  CreateVisitInput,
  UpdateVisitInput,
} from './visit.provider.js';
export { createVisitProvider } from './visit.provider.js';
// Note: Visit type is not exported to avoid conflict with demo/types.ts

export type {
  ICarePlanProvider,
  CarePlan,
  CarePlanFilters,
  CreateCarePlanInput,
  UpdateCarePlanInput,
} from './care-plan.provider.js';
export { createCarePlanProvider } from './care-plan.provider.js';

export type {
  IFamilyMemberProvider,
  FamilyMember,
  FamilyMemberFilters,
  CreateFamilyMemberInput,
  UpdateFamilyMemberInput,
} from './family-member.provider.js';
export { createFamilyMemberProvider } from './family-member.provider.js';

export type {
  IUserProvider,
} from './user.provider.js';
export { createUserProvider } from './user.provider.js';

/**
 * Container for all provider instances
 */
export interface IProviders {
  client: IClientProvider;
  caregiver: ICaregiverProvider;
  visit: IVisitProvider;
  carePlan: ICarePlanProvider;
  familyMember: IFamilyMemberProvider;
  user: IUserProvider;
}

/**
 * Create all provider instances
 *
 * @param database - Database connection to use for all providers
 * @returns Object containing all provider instances
 *
 * @example
 * ```typescript
 * import { getDatabase } from '@care-commons/core';
 * import { createProviders } from '@care-commons/core/providers';
 *
 * const db = getDatabase();
 * const providers = createProviders(db);
 *
 * // Use providers
 * const client = await providers.client.getClientById(clientId);
 * const visits = await providers.visit.getVisitsByClientId(clientId);
 * ```
 */
export function createProviders(database: Database): IProviders {
  return {
    client: createClientProvider(database),
    caregiver: createCaregiverProvider(database),
    visit: createVisitProvider(database),
    carePlan: createCarePlanProvider(database),
    familyMember: createFamilyMemberProvider(database),
    user: createUserProvider(database),
  };
}

/**
 * Create mock providers for testing
 *
 * Note: This function is provided for documentation purposes.
 * In actual test files, create mocks directly using your testing framework.
 *
 * @example
 * ```typescript
 * // In a Jest test file:
 * const mockProviders: IProviders = {
 *   client: {
 *     getClientById: jest.fn(),
 *     getClientsByIds: jest.fn(),
 *     getClientsByBranch: jest.fn(),
 *     getClientsByOrganization: jest.fn(),
 *   } as unknown as IClientProvider,
 *   caregiver: {
 *     getCaregiverById: jest.fn(),
 *     getCaregiversByIds: jest.fn(),
 *     getCaregiversByBranch: jest.fn(),
 *     getCaregiversByOrganization: jest.fn(),
 *     getAvailableCaregivers: jest.fn(),
 *   } as unknown as ICaregiverProvider,
 *   visit: {
 *     getVisitById: jest.fn(),
 *     getVisitsByIds: jest.fn(),
 *     getVisitsByClientId: jest.fn(),
 *     getVisitsByCaregiverId: jest.fn(),
 *     getVisitsInDateRange: jest.fn(),
 *     createVisit: jest.fn(),
 *     updateVisit: jest.fn(),
 *     deleteVisit: jest.fn(),
 *   } as unknown as IVisitProvider,
 *   carePlan: {
 *     getCarePlanById: jest.fn(),
 *     getCarePlansByClientId: jest.fn(),
 *     getActiveCarePlanForClient: jest.fn(),
 *     createCarePlan: jest.fn(),
 *     updateCarePlan: jest.fn(),
 *     deleteCarePlan: jest.fn(),
 *   } as unknown as ICarePlanProvider,
 *   familyMember: {
 *     getFamilyMemberById: jest.fn(),
 *     getFamilyMembersByClientId: jest.fn(),
 *     getPrimaryContactForClient: jest.fn(),
 *     createFamilyMember: jest.fn(),
 *     updateFamilyMember: jest.fn(),
 *     deleteFamilyMember: jest.fn(),
 *   } as unknown as IFamilyMemberProvider,
 * };
 * ```
 */
