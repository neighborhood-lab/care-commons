/**
 * Onboarding Routes
 * 
 * API endpoints for organization onboarding and go-live checklist management.
 */

import { Router, Request, Response } from 'express';
import {
  Database,
  OnboardingService,
  AuthMiddleware,
  ValidationError,
  NotFoundError,
} from '@folkcare/core';

export function createOnboardingRouter(db: Database): Router {
  const router = Router();
  const onboardingService = new OnboardingService(db);
  const authMiddleware = new AuthMiddleware(db);

  /**
   * @openapi
   * /api/onboarding:
   *   get:
   *     tags:
   *       - Onboarding
   *     summary: Get onboarding progress
   *     description: Retrieve the onboarding progress for the current user's organization
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Onboarding progress retrieved successfully
   *       401:
   *         description: Not authenticated
   *       404:
   *         description: Onboarding not initialized
   */
  router.get('/',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.user!.organizationId;
        const progress = await onboardingService.getOnboardingProgress(organizationId);

        res.json({
          success: true,
          data: {
            progress,
            categorySummary: onboardingService.getCategorySummary(progress),
          },
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          res.status(404).json({
            success: false,
            error: error.message,
            code: 'ONBOARDING_NOT_FOUND',
          });
          return;
        }

        console.error('[Onboarding] Get progress error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get onboarding progress',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/onboarding/initialize:
   *   post:
   *     tags:
   *       - Onboarding
   *     summary: Initialize onboarding
   *     description: Initialize onboarding progress for a new organization
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - stateCode
   *             properties:
   *               stateCode:
   *                 type: string
   *                 description: Two-letter state code
   *                 example: TX
   *     responses:
   *       201:
   *         description: Onboarding initialized successfully
   *       400:
   *         description: Invalid request
   *       401:
   *         description: Not authenticated
   */
  router.post('/initialize',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { stateCode } = req.body;
        const organizationId = req.user!.organizationId;
        const userId = req.user!.userId;

        if (stateCode === undefined || stateCode === null || typeof stateCode !== 'string' || stateCode.length !== 2) {
          res.status(400).json({
            success: false,
            error: 'Valid 2-letter state code is required',
            code: 'INVALID_STATE_CODE',
          });
          return;
        }

        const progress = await onboardingService.initializeOnboarding(
          organizationId,
          stateCode.toUpperCase(),
          userId
        );

        res.status(201).json({
          success: true,
          data: {
            progress,
            categorySummary: onboardingService.getCategorySummary(progress),
          },
        });
      } catch (error) {
        console.error('[Onboarding] Initialize error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to initialize onboarding',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/onboarding/steps/{stepId}:
   *   patch:
   *     tags:
   *       - Onboarding
   *     summary: Update step status
   *     description: Update the status of an onboarding wizard step
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: stepId
   *         required: true
   *         schema:
   *           type: string
   *         description: Step identifier
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [not_started, in_progress, completed, skipped]
   *               metadata:
   *                 type: object
   *     responses:
   *       200:
   *         description: Step updated successfully
   *       400:
   *         description: Invalid request
   *       401:
   *         description: Not authenticated
   *       404:
   *         description: Onboarding not found
   */
  router.patch('/steps/:stepId',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const stepId = req.params['stepId'];
        if (stepId === undefined || stepId === '') {
          res.status(400).json({
            success: false,
            error: 'Step ID is required',
            code: 'MISSING_STEP_ID',
          });
          return;
        }

        const { status, metadata } = req.body;
        const organizationId = req.user!.organizationId;
        const userId = req.user!.userId;

        const validStatuses = ['not_started', 'in_progress', 'completed', 'skipped'];
        if (status === undefined || status === null || !validStatuses.includes(status)) {
          res.status(400).json({
            success: false,
            error: 'Valid status is required (not_started, in_progress, completed, skipped)',
            code: 'INVALID_STATUS',
          });
          return;
        }

        // Validate stepId is a valid OnboardingStepId
        const validStepIds = [
          'email_verified', 'services_configured', 'payors_added', 'evv_configured',
          'first_caregiver', 'first_client', 'test_visit', 'team_invited'
        ];
        if (!validStepIds.includes(stepId)) {
          res.status(400).json({
            success: false,
            error: 'Invalid step ID',
            code: 'INVALID_STEP_ID',
          });
          return;
        }

        const progress = await onboardingService.updateStep(
          organizationId,
          { stepId: stepId as import('@folkcare/core').OnboardingStepId, status, metadata },
          userId
        );

        res.json({
          success: true,
          data: {
            progress,
            categorySummary: onboardingService.getCategorySummary(progress),
          },
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          res.status(400).json({
            success: false,
            error: error.message,
            code: error.code,
          });
          return;
        }

        if (error instanceof NotFoundError) {
          res.status(404).json({
            success: false,
            error: error.message,
            code: 'NOT_FOUND',
          });
          return;
        }

        console.error('[Onboarding] Update step error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update step',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/onboarding/checklist/{itemId}:
   *   patch:
   *     tags:
   *       - Onboarding
   *     summary: Update checklist item
   *     description: Update the status of a go-live checklist item
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: itemId
   *         required: true
   *         schema:
   *           type: string
   *         description: Checklist item identifier
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [not_started, in_progress, completed, skipped]
   *     responses:
   *       200:
   *         description: Checklist item updated successfully
   *       400:
   *         description: Invalid request
   *       401:
   *         description: Not authenticated
   *       404:
   *         description: Item not found
   */
  router.patch('/checklist/:itemId',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const itemId = req.params['itemId'];
        if (itemId === undefined || itemId === '') {
          res.status(400).json({
            success: false,
            error: 'Item ID is required',
            code: 'MISSING_ITEM_ID',
          });
          return;
        }

        const { status } = req.body;
        const organizationId = req.user!.organizationId;
        const userId = req.user!.userId;

        const validChecklistStatuses = ['not_started', 'in_progress', 'completed', 'skipped'];
        if (status === undefined || status === null || !validChecklistStatuses.includes(status)) {
          res.status(400).json({
            success: false,
            error: 'Valid status is required',
            code: 'INVALID_STATUS',
          });
          return;
        }

        const progress = await onboardingService.updateChecklistItem(
          organizationId,
          { itemId, status },
          userId
        );

        res.json({
          success: true,
          data: {
            progress,
            categorySummary: onboardingService.getCategorySummary(progress),
          },
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          res.status(400).json({
            success: false,
            error: error.message,
            code: error.code,
          });
          return;
        }

        if (error instanceof NotFoundError) {
          res.status(404).json({
            success: false,
            error: error.message,
            code: 'NOT_FOUND',
          });
          return;
        }

        console.error('[Onboarding] Update checklist item error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update checklist item',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/onboarding/verify:
   *   post:
   *     tags:
   *       - Onboarding
   *     summary: Run auto-verification
   *     description: Run automatic verification checks for all auto-verifiable items
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Verification completed
   *       401:
   *         description: Not authenticated
   *       404:
   *         description: Onboarding not found
   */
  router.post('/verify',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.user!.organizationId;
        const userId = req.user!.userId;

        const progress = await onboardingService.runAutoVerification(organizationId, userId);

        res.json({
          success: true,
          data: {
            progress,
            categorySummary: onboardingService.getCategorySummary(progress),
          },
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          res.status(404).json({
            success: false,
            error: error.message,
            code: 'NOT_FOUND',
          });
          return;
        }

        console.error('[Onboarding] Verify error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to run verification',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/onboarding/go-live:
   *   post:
   *     tags:
   *       - Onboarding
   *     summary: Approve go-live
   *     description: Mark the organization as ready to go live (requires all required items complete)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Go-live approved
   *       400:
   *         description: Required items incomplete
   *       401:
   *         description: Not authenticated
   *       404:
   *         description: Onboarding not found
   */
  router.post('/go-live',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const organizationId = req.user!.organizationId;
        const userId = req.user!.userId;

        const progress = await onboardingService.approveGoLive(organizationId, userId);

        res.json({
          success: true,
          data: {
            progress,
            categorySummary: onboardingService.getCategorySummary(progress),
            message: 'Congratulations! Your organization is now live.',
          },
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          res.status(400).json({
            success: false,
            error: error.message,
            code: error.code,
            context: error.context,
          });
          return;
        }

        if (error instanceof NotFoundError) {
          res.status(404).json({
            success: false,
            error: error.message,
            code: 'NOT_FOUND',
          });
          return;
        }

        console.error('[Onboarding] Go-live error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to approve go-live',
        });
      }
    }
  );

  return router;
}
