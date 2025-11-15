/**
 * Client Portal Routes
 *
 * Express router configuration for client portal endpoints
 */

import { Router } from 'express';
import type { Database } from '@care-commons/core';
import { requireAuth } from '@care-commons/core';
import { ClientPortalHandlers } from './client-portal-handlers';
import { ClientPortalService } from '../service/client-portal-service';
import {
  ClientPortalAccessRepository,
  VisitRatingRepository,
  ScheduleChangeRequestRepository,
  VideoCallSessionRepository,
  CarePlanAccessLogRepository,
} from '../repository/client-portal-repository';

export function createClientPortalRoutes(db: Database): Router {
  const router = Router();

  // Initialize repositories
  const portalAccessRepo = new ClientPortalAccessRepository(db);
  const visitRatingRepo = new VisitRatingRepository(db);
  const scheduleRequestRepo = new ScheduleChangeRequestRepository(db);
  const videoCallRepo = new VideoCallSessionRepository(db);
  const carePlanAccessLogRepo = new CarePlanAccessLogRepository(db);

  // Initialize service
  const service = new ClientPortalService(
    portalAccessRepo,
    visitRatingRepo,
    scheduleRequestRepo,
    videoCallRepo,
    carePlanAccessLogRepo
  );

  // Initialize handlers
  const handlers = new ClientPortalHandlers(service);

  // ============================================================================
  // Portal Access Routes
  // ============================================================================

  // Invite client to portal (requires auth)
  router.post('/invite', requireAuth, handlers.inviteClient);

  // Activate portal access (public - no auth required)
  router.post('/activate', handlers.activatePortal);

  // Get portal access
  router.get('/access/:clientId', requireAuth, handlers.getPortalAccess);

  // Update accessibility preferences
  router.patch('/access/:clientId/accessibility', requireAuth, handlers.updateAccessibilityPreferences);

  // Update notification preferences
  router.patch('/access/:clientId/notifications', requireAuth, handlers.updateNotificationPreferences);

  // ============================================================================
  // Visit Rating Routes
  // ============================================================================

  // Create visit rating
  router.post('/clients/:clientId/ratings', requireAuth, handlers.createVisitRating);

  // Get visit ratings for a client
  router.get('/clients/:clientId/ratings', requireAuth, handlers.getClientVisitRatings);

  // Search visit ratings
  router.get('/ratings', requireAuth, handlers.searchVisitRatings);

  // ============================================================================
  // Schedule Change Request Routes
  // ============================================================================

  // Create schedule change request
  router.post('/clients/:clientId/schedule-requests', requireAuth, handlers.createScheduleChangeRequest);

  // Get pending schedule change requests
  router.get('/clients/:clientId/schedule-requests/pending', requireAuth, handlers.getPendingScheduleRequests);

  // Review schedule change request (coordinator)
  router.patch('/schedule-requests/:requestId/review', requireAuth, handlers.reviewScheduleChangeRequest);

  // Search schedule change requests
  router.get('/schedule-requests', requireAuth, handlers.searchScheduleChangeRequests);

  // ============================================================================
  // Video Call Session Routes
  // ============================================================================

  // Schedule video call
  router.post('/clients/:clientId/video-calls', requireAuth, handlers.scheduleVideoCall);

  // Get upcoming video calls
  router.get('/clients/:clientId/video-calls/upcoming', requireAuth, handlers.getUpcomingVideoCalls);

  // Rate video call
  router.patch('/video-calls/:sessionId/rate', requireAuth, handlers.rateVideoCall);

  // ============================================================================
  // Dashboard Route
  // ============================================================================

  // Get client dashboard
  router.get('/clients/:clientId/dashboard', requireAuth, handlers.getClientDashboard);

  return router;
}
