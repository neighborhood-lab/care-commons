/**
 * White-Label Management Routes
 *
 * Handles organization branding, subscriptions, and white-labeling features
 */

import { Router, Request, Response } from 'express';
import {
  WhiteLabelService,
  Database,
  AuthMiddleware,
  UpdateBrandingRequest,
  UpdateSubscriptionRequest,
  SubscriptionPlanTier,
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

export function createWhiteLabelRouter(db: Database): Router {
  const router = Router();
  const whiteLabelService = new WhiteLabelService(db);
  const authMiddleware = new AuthMiddleware(db);

  // ====== Branding Endpoints ======

  /**
   * @openapi
   * /api/organizations/{organizationId}/branding:
   *   get:
   *     tags:
   *       - White Label
   *     summary: Get organization branding
   *     description: Get white-label branding configuration for an organization
   *     parameters:
   *       - in: path
   *         name: organizationId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Branding configuration
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
  router.get(
    '/organizations/:organizationId/branding',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.params.organizationId!;

        const branding = await whiteLabelService.getBranding(organizationId, toUserContext(req.user!));

        res.json({
          success: true,
          data: branding,
        });
      } catch (error) {
        console.error('Get branding error:', error);
        res.status(error instanceof Error && error.message.includes('Access denied') ? 403 : 500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get branding',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/organizations/{organizationId}/branding:
   *   put:
   *     tags:
   *       - White Label
   *     summary: Update organization branding
   *     description: Update white-label branding configuration
   *     parameters:
   *       - in: path
   *         name: organizationId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               logoUrl:
   *                 type: string
   *               primaryColor:
   *                 type: string
   *               brandName:
   *                 type: string
   *               customDomain:
   *                 type: string
   *     responses:
   *       200:
   *         description: Branding updated successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden or subscription doesn't allow white-labeling
   */
  router.put(
    '/organizations/:organizationId/branding',
    authMiddleware.requireAuth,
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
        let statusCode = 500;
        if (error instanceof Error) {
          if (error.message.includes('Access denied') || error.message.includes('not enabled')) {
            statusCode = 403;
          }
        }

        res.status(statusCode).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update branding',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/organizations/{organizationId}/branding/verify-domain:
   *   post:
   *     tags:
   *       - White Label
   *     summary: Verify custom domain
   *     description: Verify ownership of custom domain
   *     parameters:
   *       - in: path
   *         name: organizationId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Domain verified successfully
   *       401:
   *         description: Unauthorized
   */
  router.post(
    '/organizations/:organizationId/branding/verify-domain',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.params.organizationId!;

        await whiteLabelService.verifyCustomDomain(organizationId, toUserContext(req.user!));

        res.json({
          success: true,
          message: 'Domain verified successfully',
        });
      } catch (error) {
        console.error('Verify domain error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to verify domain',
        });
      }
    }
  );

  // ====== Subscription Endpoints ======

  /**
   * @openapi
   * /api/organizations/{organizationId}/subscription:
   *   get:
   *     tags:
   *       - White Label
   *     summary: Get organization subscription
   *     description: Get subscription and billing information
   *     parameters:
   *       - in: path
   *         name: organizationId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Subscription information
   */
  router.get(
    '/organizations/:organizationId/subscription',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.params.organizationId!;

        const subscription = await whiteLabelService.getSubscription(
          organizationId,
          toUserContext(req.user!)
        );

        res.json({
          success: true,
          data: subscription,
        });
      } catch (error) {
        console.error('Get subscription error:', error);
        res.status(error instanceof Error && error.message.includes('Access denied') ? 403 : 500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get subscription',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/organizations/{organizationId}/subscription:
   *   post:
   *     tags:
   *       - White Label
   *     summary: Create organization subscription
   *     description: Create a subscription for an organization
   *     parameters:
   *       - in: path
   *         name: organizationId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - planTier
   *             properties:
   *               planTier:
   *                 type: string
   *                 enum: [FREE, BASIC, PROFESSIONAL, ENTERPRISE, CUSTOM]
   *     responses:
   *       201:
   *         description: Subscription created
   */
  router.post(
    '/organizations/:organizationId/subscription',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.params.organizationId!;
        const { planTier } = req.body as { planTier: SubscriptionPlanTier };

        const subscription = await whiteLabelService.createSubscription(
          organizationId,
          planTier,
          toUserContext(req.user!)
        );

        res.status(201).json({
          success: true,
          data: subscription,
        });
      } catch (error) {
        console.error('Create subscription error:', error);
        res.status(error instanceof Error && error.message.includes('already exists') ? 409 : 500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create subscription',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/organizations/{organizationId}/subscription:
   *   put:
   *     tags:
   *       - White Label
   *     summary: Update subscription
   *     description: Update subscription plan or limits
   *     parameters:
   *       - in: path
   *         name: organizationId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               planTier:
   *                 type: string
   *               billingCycle:
   *                 type: string
   *               maxUsers:
   *                 type: number
   *     responses:
   *       200:
   *         description: Subscription updated
   */
  router.put(
    '/organizations/:organizationId/subscription',
    authMiddleware.requireAuth,
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

  /**
   * @openapi
   * /api/organizations/{organizationId}/subscription/cancel:
   *   post:
   *     tags:
   *       - White Label
   *     summary: Cancel subscription
   *     description: Cancel organization subscription
   *     parameters:
   *       - in: path
   *         name: organizationId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - reason
   *             properties:
   *               reason:
   *                 type: string
   *     responses:
   *       200:
   *         description: Subscription cancelled
   */
  router.post(
    '/organizations/:organizationId/subscription/cancel',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.params.organizationId!;
        const { reason } = req.body as { reason: string };

        await whiteLabelService.cancelSubscription(organizationId, reason, toUserContext(req.user!));

        res.json({
          success: true,
          message: 'Subscription cancelled successfully',
        });
      } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to cancel subscription',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/organizations/{organizationId}/subscription/limits:
   *   get:
   *     tags:
   *       - White Label
   *     summary: Check subscription limits
   *     description: Check if organization is within subscription limits
   *     parameters:
   *       - in: path
   *         name: organizationId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Limit check results
   */
  router.get(
    '/organizations/:organizationId/subscription/limits',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.params.organizationId!;

        const limits = await whiteLabelService.checkSubscriptionLimits(organizationId);

        res.json({
          success: true,
          data: limits,
        });
      } catch (error) {
        console.error('Check limits error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to check limits',
        });
      }
    }
  );

  return router;
}
