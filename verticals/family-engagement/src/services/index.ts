/**
 * @care-commons/family-engagement - Service Exports
 */

import type { Database } from '@care-commons/core';
import {
  PermissionService,
  createUserProvider,
  createClientProvider,
  createVisitProvider,
  createCarePlanProvider
} from '@care-commons/core';
import { FamilyEngagementService } from './family-engagement-service.js';
import {
  FamilyMemberRepository,
  NotificationRepository,
  ActivityFeedRepository,
  MessageRepository
} from '../repositories/family-engagement-repository.js';

export * from './family-engagement-service.js';

/**
 * Factory function to create a fully configured FamilyEngagementService
 *
 * @param database - Database connection
 * @returns Configured FamilyEngagementService instance
 *
 * @example
 * ```typescript
 * import { getDatabase } from '@care-commons/core';
 * import { createFamilyEngagementService } from '@care-commons/family-engagement';
 *
 * const db = getDatabase();
 * const service = createFamilyEngagementService(db);
 *
 * // Use the service
 * const dashboard = await service.getFamilyDashboard(familyMemberId, context);
 * ```
 */
export function createFamilyEngagementService(database: Database): FamilyEngagementService {
  // Create repositories
  const familyMemberRepo = new FamilyMemberRepository(database);
  const notificationRepo = new NotificationRepository(database);
  const activityFeedRepo = new ActivityFeedRepository(database);
  const messageRepo = new MessageRepository(database);

  // Create permission service
  const permissionService = new PermissionService();

  // Create providers
  const userProvider = createUserProvider(database);
  const clientProvider = createClientProvider(database);
  const visitProvider = createVisitProvider(database);
  const carePlanProvider = createCarePlanProvider(database);

  // Create and return service with all dependencies
  return new FamilyEngagementService(
    familyMemberRepo,
    notificationRepo,
    activityFeedRepo,
    messageRepo,
    permissionService,
    userProvider,
    clientProvider,
    visitProvider,
    carePlanProvider
  );
}
