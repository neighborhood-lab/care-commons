/**
 * Shift Matching API Routes
 *
 * Provides RESTful endpoints for:
 * - Open shift management
 * - Match discovery and proposal management
 * - Caregiver self-service
 * - Analytics and reporting
 */

import { Router } from 'express';
import { Database, AuthMiddleware } from '@care-commons/core';
import { ShiftMatchingHandlers } from '@care-commons/shift-matching';
import { Pool } from 'pg';

export function createShiftMatchingRouter(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);

  // Get the underlying connection pool for shift matching handlers
  const pool = (db as unknown as { pool: Pool }).pool;
  const handlers = new ShiftMatchingHandlers(pool);

  // All shift matching routes require authentication
  router.use(authMiddleware.requireAuth);

  // ================================================================
  // OPEN SHIFTS
  // ================================================================

  /**
   * GET /api/shift-matching/open-shifts
   * Search for open shifts
   */
  router.get('/open-shifts', async (req, res, next) => {
    try {
      const filters = {
        organizationId: req.user?.organizationId,
        clientId: req.query.clientId !== undefined ? (req.query.clientId as string) : undefined,
        dateFrom: req.query.dateFrom !== undefined ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo !== undefined ? new Date(req.query.dateTo as string) : undefined,
        priority: req.query.priority !== undefined ? [req.query.priority as string] : undefined,
        matchingStatus: req.query.matchingStatus !== undefined ? [req.query.matchingStatus as string] : undefined,
        isUrgent: req.query.isUrgent === 'true',
        serviceTypeId: req.query.serviceTypeId !== undefined ? (req.query.serviceTypeId as string) : undefined,
      };

      const pagination = {
        page: parseInt(req.query.page as string) !== 0 ? parseInt(req.query.page as string) : 1,
        limit: parseInt(req.query.limit as string) !== 0 ? parseInt(req.query.limit as string) : 20,
        sortBy: (req.query.sortBy as string) !== '' ? (req.query.sortBy as string) : 'scheduled_date',
        sortOrder: ((req.query.sortOrder as string) === 'asc' || (req.query.sortOrder as string) === 'desc') ? (req.query.sortOrder as 'asc' | 'desc') : 'asc',
      };

      const result = await handlers.searchOpenShifts(filters, pagination, req.user!);

      res.json({
        items: result.items,
        total: result.total,
        hasMore: result.hasMore,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/shift-matching/open-shifts/:id
   * Get a specific open shift
   */
  router.get('/open-shifts/:id', async (req, res, next) => {
    try {
      const shift = await handlers.getOpenShift(req.params.id, req.user!);

      if (shift === null || shift === undefined) {
        return res.status(404).json({ error: 'Open shift not found' });
      }

      res.json(shift);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/shift-matching/open-shifts/:id/match
   * Run matching algorithm for an open shift
   */
  router.post('/open-shifts/:id/match', async (req, res, next) => {
    try {
      const input = {
        openShiftId: req.params.id,
        configurationId: req.body.configurationId,
        maxCandidates: req.body.maxCandidates,
        autoPropose: req.body.autoPropose ?? false,
      };

      const result = await handlers.matchOpenShift(req.params.id, input, req.user!);

      res.json({
        items: result.candidates,
        total: result.candidates.length,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/shift-matching/open-shifts/:id/candidates
   * Get match candidates for an open shift
   */
  router.get('/open-shifts/:id/candidates', async (req, res, next) => {
    try {
      const input = {
        openShiftId: req.params.id,
        autoPropose: false,
      };

      const result = await handlers.matchOpenShift(req.params.id, input, req.user!);

      res.json({
        items: result.candidates,
        total: result.candidates.length,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/shift-matching/open-shifts/:id/proposals
   * Get all proposals for an open shift
   */
  router.get('/open-shifts/:id/proposals', async (req, res, next) => {
    try {
      const proposals = await handlers.getProposalsForShift(req.params.id, req.user!);
      res.json(proposals);
    } catch (error) {
      next(error);
    }
  });

  // ================================================================
  // PROPOSALS
  // ================================================================

  /**
   * GET /api/shift-matching/proposals
   * Search proposals
   */
  router.get('/proposals', async (req, res, next) => {
    try {
      const filters = {
        organizationId: req.user?.organizationId,
        caregiverId: req.query.caregiverId !== undefined ? (req.query.caregiverId as string) : undefined,
        openShiftId: req.query.openShiftId !== undefined ? (req.query.openShiftId as string) : undefined,
        proposalStatus: req.query.proposalStatus !== undefined ? [req.query.proposalStatus as string] : undefined,
        proposedDateFrom: req.query.dateFrom !== undefined ? new Date(req.query.dateFrom as string) : undefined,
        proposedDateTo: req.query.dateTo !== undefined ? new Date(req.query.dateTo as string) : undefined,
        matchQuality: req.query.matchQuality !== undefined ? [req.query.matchQuality as string] : undefined,
      };

      const pagination = {
        page: parseInt(req.query.page as string) !== 0 ? parseInt(req.query.page as string) : 1,
        limit: parseInt(req.query.limit as string) !== 0 ? parseInt(req.query.limit as string) : 20,
        sortBy: (req.query.sortBy as string) !== '' ? (req.query.sortBy as string) : 'proposed_at',
        sortOrder: ((req.query.sortOrder as string) === 'asc' || (req.query.sortOrder as string) === 'desc') ? (req.query.sortOrder as 'asc' | 'desc') : 'desc',
      };

      const result = await handlers.searchProposals(filters, pagination, req.user!);

      res.json({
        items: result.items,
        total: result.total,
        hasMore: result.hasMore,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/shift-matching/proposals
   * Create a proposal (manual assignment)
   */
  router.post('/proposals', async (req, res, next) => {
    try {
      const input = {
        openShiftId: req.body.openShiftId,
        caregiverId: req.body.caregiverId,
        proposalMethod: 'MANUAL' as const,
        sendNotification: req.body.sendNotification ?? false,
        notificationMethod: req.body.notificationMethod,
        urgencyFlag: req.body.urgencyFlag ?? false,
        notes: req.body.notes,
      };

      const proposal = await handlers.createManualProposal(input, req.user!);
      res.status(201).json(proposal);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/shift-matching/proposals/:id/respond
   * Respond to a proposal (accept/reject)
   */
  router.post('/proposals/:id/respond', async (req, res, next) => {
    try {
      const input = {
        proposalId: req.params.id,
        accept: req.body.accept,
        rejectionReason: req.body.rejectionReason,
        rejectionCategory: req.body.rejectionCategory,
        responseMethod: req.body.responseMethod,
        notes: req.body.notes,
      };

      const proposal = await handlers.respondToProposal(req.params.id, input, req.user!);
      res.json(proposal);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/shift-matching/proposals/:id/withdraw
   * Withdraw a proposal
   */
  router.post('/proposals/:id/withdraw', async (req, res, next) => {
    try {
      // Implementation would call a handler to withdraw the proposal
      res.status(501).json({ error: 'Not yet implemented' });
    } catch (error) {
      next(error);
    }
  });

  // ================================================================
  // CAREGIVER SELF-SERVICE
  // ================================================================

  /**
   * GET /api/shift-matching/caregiver/available-shifts
   * Get shifts available for current caregiver to claim
   */
  router.get('/caregiver/available-shifts', async (req, res, next) => {
    try {
      const caregiverId = req.user?.caregiverId ?? (req.query.caregiverId as string);

      if (caregiverId === null || caregiverId === undefined || caregiverId === '') {
        return res.status(400).json({ error: 'Caregiver ID is required' });
      }

      const shifts = await handlers.getAvailableShifts(caregiverId, req.user!);
      res.json(shifts);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/shift-matching/caregiver/proposals
   * Get proposals for current caregiver
   */
  router.get('/caregiver/proposals', async (req, res, next) => {
    try {
      const caregiverId = req.user?.caregiverId ?? (req.query.caregiverId as string);

      if (caregiverId === null || caregiverId === undefined || caregiverId === '') {
        return res.status(400).json({ error: 'Caregiver ID is required' });
      }

      const statuses = req.query.statuses as string[] | undefined;
      const proposals = await handlers.getCaregiverProposals(caregiverId, statuses, req.user!);
      res.json(proposals);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/shift-matching/caregiver/shifts/:id/claim
   * Caregiver claims an available shift
   */
  router.post('/caregiver/shifts/:id/claim', async (req, res, next) => {
    try {
      const caregiverId = req.user?.caregiverId ?? req.body.caregiverId;

      if (caregiverId === null || caregiverId === undefined || caregiverId === '') {
        return res.status(400).json({ error: 'Caregiver ID is required' });
      }

      const proposal = await handlers.claimShift(req.params.id, caregiverId, req.user!);
      res.status(201).json(proposal);
    } catch (error) {
      next(error);
    }
  });

  // ================================================================
  // ANALYTICS & METRICS
  // ================================================================

  /**
   * GET /api/shift-matching/metrics
   * Get matching performance metrics
   */
  router.get('/metrics', async (req, res, next) => {
    try {
      const dateFrom = req.query.dateFrom !== undefined
        ? new Date(req.query.dateFrom as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago

      const dateTo = req.query.dateTo !== undefined
        ? new Date(req.query.dateTo as string)
        : new Date();

      const metrics = await handlers.getMatchingMetrics(dateFrom, dateTo, req.user!);
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/shift-matching/analytics/rejection-reasons
   * Get top rejection reasons
   */
  router.get('/analytics/rejection-reasons', async (req, res, next) => {
    try {
      const dateFrom = req.query.dateFrom !== undefined
        ? new Date(req.query.dateFrom as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const dateTo = req.query.dateTo !== undefined
        ? new Date(req.query.dateTo as string)
        : new Date();

      const reasons = await handlers.getTopRejectionReasons(dateFrom, dateTo, req.user!);
      res.json(reasons);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/shift-matching/analytics/caregiver/:id/performance
   * Get caregiver matching performance
   */
  router.get('/analytics/caregiver/:id/performance', async (req, res, next) => {
    try {
      const dateFrom = req.query.dateFrom !== undefined
        ? new Date(req.query.dateFrom as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const dateTo = req.query.dateTo !== undefined
        ? new Date(req.query.dateTo as string)
        : new Date();

      const performance = await handlers.getCaregiverPerformance(
        req.params.id,
        dateFrom,
        dateTo,
        req.user!
      );
      res.json(performance);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
