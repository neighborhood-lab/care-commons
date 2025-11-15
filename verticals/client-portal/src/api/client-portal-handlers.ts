/**
 * Client Portal API Handlers
 *
 * Express route handlers for client portal endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@care-commons/core';
import type { ClientPortalService } from '../service/client-portal-service';
import {
  inviteClientToPortalSchema,
  activatePortalAccessSchema,
  createVisitRatingSchema,
  createScheduleChangeRequestSchema,
  reviewScheduleChangeRequestSchema,
  scheduleVideoCallSchema,
  rateVideoCallSchema,
  updateAccessibilityPreferencesSchema,
  updateNotificationPreferencesSchema,
  visitRatingFiltersSchema,
  scheduleChangeRequestFiltersSchema,
  videoCallSessionFiltersSchema,
  paginationSchema,
  uuidSchema,
} from '../validation/index';

export class ClientPortalHandlers {
  constructor(private service: ClientPortalService) {}

  // ============================================================================
  // Portal Access Endpoints
  // ============================================================================

  /**
   * POST /api/client-portal/invite
   * Invite a client to the portal
   */
  inviteClient = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = inviteClientToPortalSchema.parse(req.body);
    const context = req.userContext!;

    const portalAccess = await this.service.inviteClientToPortal(input, context);

    res.status(201).json(portalAccess);
  });

  /**
   * POST /api/client-portal/activate
   * Activate portal access with invitation code
   * Public endpoint (no auth required)
   */
  activatePortal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = activatePortalAccessSchema.parse(req.body);

    const result = await this.service.activatePortalAccess(input);

    res.status(200).json(result);
  });

  /**
   * GET /api/client-portal/access/:clientId
   * Get portal access for a client
   */
  getPortalAccess = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const clientId = uuidSchema.parse(req.params['clientId']);
    const context = req.userContext!;

    const portalAccess = await this.service.getPortalAccess(clientId, context);

    res.status(200).json(portalAccess);
  });

  /**
   * PATCH /api/client-portal/access/:clientId/accessibility
   * Update accessibility preferences
   */
  updateAccessibilityPreferences = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const clientId = uuidSchema.parse(req.params['clientId']);
    const input = updateAccessibilityPreferencesSchema.parse(req.body);
    const context = req.userContext!;

    const portalAccess = await this.service.updateAccessibilityPreferences(clientId, input, context);

    res.status(200).json(portalAccess);
  });

  /**
   * PATCH /api/client-portal/access/:clientId/notifications
   * Update notification preferences
   */
  updateNotificationPreferences = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const clientId = uuidSchema.parse(req.params['clientId']);
    const input = updateNotificationPreferencesSchema.parse(req.body);
    const context = req.userContext!;

    const portalAccess = await this.service.updateNotificationPreferences(clientId, input, context);

    res.status(200).json(portalAccess);
  });

  // ============================================================================
  // Visit Rating Endpoints
  // ============================================================================

  /**
   * POST /api/client-portal/clients/:clientId/ratings
   * Create a visit rating
   */
  createVisitRating = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const clientId = uuidSchema.parse(req.params['clientId']);
    const input = createVisitRatingSchema.parse(req.body);
    const context = req.userContext!;

    const rating = await this.service.createVisitRating(clientId, input, context);

    res.status(201).json(rating);
  });

  /**
   * GET /api/client-portal/clients/:clientId/ratings
   * Get visit ratings for a client
   */
  getClientVisitRatings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const clientId = uuidSchema.parse(req.params['clientId']);
    const pagination = paginationSchema.parse(req.query);
    const context = req.userContext!;

    const result = await this.service.getClientVisitRatings(clientId, pagination, context);

    res.status(200).json(result);
  });

  /**
   * GET /api/client-portal/ratings
   * Search visit ratings
   */
  searchVisitRatings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters = visitRatingFiltersSchema.parse(req.query);
    const pagination = paginationSchema.parse(req.query);
    const context = req.userContext!;

    const result = await this.service.searchVisitRatings(filters, pagination, context);

    res.status(200).json(result);
  });

  // ============================================================================
  // Schedule Change Request Endpoints
  // ============================================================================

  /**
   * POST /api/client-portal/clients/:clientId/schedule-requests
   * Create a schedule change request
   */
  createScheduleChangeRequest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const clientId = uuidSchema.parse(req.params['clientId']);
    const input = createScheduleChangeRequestSchema.parse(req.body);
    const context = req.userContext!;

    const request = await this.service.createScheduleChangeRequest(clientId, input, context);

    res.status(201).json(request);
  });

  /**
   * GET /api/client-portal/clients/:clientId/schedule-requests/pending
   * Get pending schedule change requests for a client
   */
  getPendingScheduleRequests = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const clientId = uuidSchema.parse(req.params['clientId']);
    const context = req.userContext!;

    const requests = await this.service.getPendingScheduleRequests(clientId, context);

    res.status(200).json(requests);
  });

  /**
   * PATCH /api/client-portal/schedule-requests/:requestId/review
   * Review a schedule change request (coordinator)
   */
  reviewScheduleChangeRequest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const requestId = uuidSchema.parse(req.params['requestId']);
    const input = reviewScheduleChangeRequestSchema.parse(req.body);
    const context = req.userContext!;

    const request = await this.service.reviewScheduleChangeRequest(requestId, input, context);

    res.status(200).json(request);
  });

  /**
   * GET /api/client-portal/schedule-requests
   * Search schedule change requests
   */
  searchScheduleChangeRequests = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters = scheduleChangeRequestFiltersSchema.parse(req.query);
    const pagination = paginationSchema.parse(req.query);
    const context = req.userContext!;

    const result = await this.service.searchScheduleChangeRequests(filters, pagination, context);

    res.status(200).json(result);
  });

  // ============================================================================
  // Video Call Session Endpoints
  // ============================================================================

  /**
   * POST /api/client-portal/clients/:clientId/video-calls
   * Schedule a video call
   */
  scheduleVideoCall = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const clientId = uuidSchema.parse(req.params['clientId']);
    const input = scheduleVideoCallSchema.parse(req.body);
    const context = req.userContext!;

    const session = await this.service.scheduleVideoCall(clientId, input, context);

    res.status(201).json(session);
  });

  /**
   * GET /api/client-portal/clients/:clientId/video-calls/upcoming
   * Get upcoming video calls for a client
   */
  getUpcomingVideoCalls = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const clientId = uuidSchema.parse(req.params['clientId']);
    const context = req.userContext!;

    const sessions = await this.service.getUpcomingVideoCalls(clientId, context);

    res.status(200).json(sessions);
  });

  /**
   * PATCH /api/client-portal/video-calls/:sessionId/rate
   * Rate a completed video call
   */
  rateVideoCall = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const sessionId = uuidSchema.parse(req.params['sessionId']);
    const input = rateVideoCallSchema.parse(req.body);
    const context = req.userContext!;

    const session = await this.service.rateVideoCall(sessionId, input, context);

    res.status(200).json(session);
  });

  // ============================================================================
  // Dashboard Endpoint
  // ============================================================================

  /**
   * GET /api/client-portal/clients/:clientId/dashboard
   * Get client portal dashboard data
   */
  getClientDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const clientId = uuidSchema.parse(req.params['clientId']);
    const context = req.userContext!;

    const dashboard = await this.service.getClientDashboard(clientId, context);

    res.status(200).json(dashboard);
  });
}
