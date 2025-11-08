/**
 * Super Admin Routes
 *
 * Management endpoints for platform super administrators
 */

import { Router, Request, Response } from 'express';
import {
  WhiteLabelService,
  Database,
  AuthMiddleware,
  UpdateBrandingRequest,
  UpdateSubscriptionRequest,
  UserContext,
  TokenPayload,
} from '@care-commons/core';

// Helper to convert TokenPayload to UserContext
function toUserContext(tokenPayload: TokenPayload): UserContext {
  return {
    userId: tokenPayload.userId,
    roles: tokenPayload.roles,
    permissions: tokenPayload.permissions,
    organizationId: tokenPayload.organizationId,
    branchIds: [],
  };
}

export function createSuperAdminRouter(db: Database): Router {
  const router = Router();
  const whiteLabelService = new WhiteLabelService(db);
  const authMiddleware = new AuthMiddleware(db);

  // All super admin routes require authentication and SUPER_ADMIN role
  router.use(authMiddleware.requireAuth);
  router.use(authMiddleware.requireSuperAdmin);

  /**
   * @openapi
   * /api/super-admin/dashboard:
   *   get:
   *     tags:
   *       - Super Admin
   *     summary: Get super admin dashboard statistics
   *     description: Get platform-wide statistics and metrics
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Dashboard statistics
   *       403:
   *         description: Super admin access required
   */
  router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await whiteLabelService.getSuperAdminDashboard(toUserContext(req.user!));

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Super admin dashboard error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard',
      });
    }
  });

  /**
   * @openapi
   * /api/super-admin/organizations:
   *   get:
   *     tags:
   *       - Super Admin
   *     summary: List all organizations
   *     description: Get paginated list of all organizations
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *     responses:
   *       200:
   *         description: List of organizations
   */
  router.get('/organizations', async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) > 0 ? parseInt(req.query.page as string) : 1;
      const limit = parseInt(req.query.limit as string) > 0 ? parseInt(req.query.limit as string) : 50;

      const result = await whiteLabelService.getAllOrganizations(toUserContext(req.user!), page, limit);

      res.json({
        success: true,
        data: result.organizations,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      console.error('List organizations error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list organizations',
      });
    }
  });

  /**
   * @openapi
   * /api/super-admin/organizations/{organizationId}:
   *   get:
   *     tags:
   *       - Super Admin
   *     summary: Get organization details
   *     description: Get detailed information about a specific organization
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: organizationId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Organization details
   *       404:
   *         description: Organization not found
   */
  router.get('/organizations/:organizationId', async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = req.params.organizationId!;

      const detail = await whiteLabelService.getOrganizationDetail(
        organizationId,
        toUserContext(req.user!)
      );

      res.json({
        success: true,
        data: detail,
      });
    } catch (error) {
      console.error('Get organization detail error:', error);
      const statusCode =
        error instanceof Error && error.message.includes('not found') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get organization details',
      });
    }
  });

  /**
   * @openapi
   * /api/super-admin/organizations/{organizationId}/branding:
   *   put:
   *     tags:
   *       - Super Admin
   *     summary: Update organization branding (super admin)
   *     description: Update any organization's branding as super admin
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: organizationId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Branding updated
   */
  router.put(
    '/organizations/:organizationId/branding',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.params.organizationId!;
        const updates: UpdateBrandingRequest = req.body;

        const branding = await whiteLabelService.updateBranding(
          organizationId,
          updates,
          toUserContext(req.user!)
        );

        res.json({
          success: true,
          data: branding,
        });
      } catch (error) {
        console.error('Update branding error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update branding',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/super-admin/organizations/{organizationId}/subscription:
   *   put:
   *     tags:
   *       - Super Admin
   *     summary: Update organization subscription (super admin)
   *     description: Update any organization's subscription as super admin
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: organizationId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Subscription updated
   */
  router.put(
    '/organizations/:organizationId/subscription',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.params.organizationId!;
        const updates: UpdateSubscriptionRequest = req.body;

        const subscription = await whiteLabelService.updateSubscription(
          organizationId,
          updates,
          toUserContext(req.user!)
        );

        res.json({
          success: true,
          data: subscription,
        });
      } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update subscription',
        });
      }
    }
  );

  return router;
}
