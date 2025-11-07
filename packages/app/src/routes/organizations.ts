/**
 * Organization Management Routes
 * 
 * Handles multi-tenant organization registration and team invitations
 */

import { Router, Request, Response } from 'express';
import {
  OrganizationService,
  Database,
  CreateOrganizationRequest,
  CreateInviteRequest,
  AcceptInviteRequest,
  ValidationError,
  ConflictError,
  NotFoundError,
  AuthMiddleware,
} from '@care-commons/core';

export function createOrganizationRouter(db: Database): Router {
  const router = Router();
  const organizationService = new OrganizationService(db);
  const authMiddleware = new AuthMiddleware(db);

  /**
   * @openapi
   * /api/organizations/register:
   *   post:
   *     tags:
   *       - Organizations
   *     summary: Register new organization
   *     description: Register a new organization with initial admin user
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - adminEmail
   *               - adminPassword
   *             properties:
   *               name:
   *                 type: string
   *                 description: Organization name
   *                 example: Acme Home Care
   *               adminEmail:
   *                 type: string
   *                 format: email
   *                 description: Admin user email
   *                 example: admin@acmehomecare.com
   *               adminPassword:
   *                 type: string
   *                 format: password
   *                 description: Admin user password
   *               adminFirstName:
   *                 type: string
   *                 description: Admin first name
   *               adminLastName:
   *                 type: string
   *                 description: Admin last name
   *     responses:
   *       201:
   *         description: Organization registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     organization:
   *                       type: object
   *                     adminUserId:
   *                       type: string
   *                       format: uuid
   *       400:
   *         description: Invalid input
   *       409:
   *         description: Organization or email already exists
   *       500:
   *         description: Server error
   */
  router.post('/organizations/register', async (req: Request, res: Response): Promise<void> => {
    try {
      const request: CreateOrganizationRequest = req.body;

      const result = await organizationService.registerOrganization(request);

      res.status(201).json({
        success: true,
        data: {
          organization: result.organization,
          adminUserId: result.adminUserId,
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

      if (error instanceof ConflictError) {
        res.status(409).json({
          success: false,
          error: error.message,
          code: error.code,
        });
        return;
      }

      console.error('Organization registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to register organization',
      });
    }
  });

  /**
   * @openapi
   * /api/organizations/{id}:
   *   get:
   *     tags:
   *       - Organizations
   *     summary: Get organization by ID
   *     description: Retrieve organization details by unique identifier
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Organization UUID
   *     responses:
   *       200:
   *         description: Organization found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *       401:
   *         description: Not authenticated
   *       404:
   *         description: Organization not found
   *       500:
   *         description: Server error
   */
  router.get('/organizations/:id', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params['id'];
      if (id === undefined || id.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
        return;
      }

      const organization = await organizationService.getOrganizationById(id);

      res.json({
        success: true,
        data: organization,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message,
          code: error.code,
        });
        return;
      }

      console.error('Get organization error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve organization',
      });
    }
  });

  /**
   * POST /api/organizations/:id/invitations
   * Create a new team member invitation
   */
  router.post('/organizations/:id/invitations', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = req.params['id'];
      if (organizationId === undefined || organizationId.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
        return;
      }
      
      const request: CreateInviteRequest = req.body;
      
      // Extract from authenticated user session
      // In production, this would come from JWT or session middleware
      const userId = req.headers['x-user-id'];
      const createdBy = typeof userId === 'string' ? userId : 'admin-001';

      const invitation = await organizationService.createInvitation(
        organizationId,
        request,
        createdBy
      );

      res.status(201).json({
        success: true,
        data: invitation,
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

      if (error instanceof ConflictError) {
        res.status(409).json({
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
          code: error.code,
        });
        return;
      }

      console.error('Create invitation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create invitation',
      });
    }
  });

  /**
   * GET /api/organizations/:id/invitations
   * List all invitations for an organization
   */
  router.get('/organizations/:id/invitations', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = req.params['id'];
      if (organizationId === undefined || organizationId.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
        return;
      }

      const invitations = await organizationService.getOrganizationInvitations(
        organizationId
      );

      res.json({
        success: true,
        data: invitations,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message,
          code: error.code,
        });
        return;
      }

      console.error('Get invitations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve invitations',
      });
    }
  });

  /**
   * GET /api/invitations/:token
   * Get invitation details for validation
   */
  router.get('/invitations/:token', async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.params['token'];
      if (token === undefined || token.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invitation token is required',
        });
        return;
      }

      const details = await organizationService.getInvitationDetails(token);

      res.json({
        success: true,
        data: details,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message,
          code: error.code,
        });
        return;
      }

      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: error.code,
        });
        return;
      }

      console.error('Get invitation details error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve invitation details',
      });
    }
  });

  /**
   * POST /api/invitations/accept
   * Accept an invitation and create user account
   */
  router.post('/invitations/accept', async (req: Request, res: Response): Promise<void> => {
    try {
      const request: AcceptInviteRequest = req.body;

      const userId = await organizationService.acceptInvitation(request);

      res.status(201).json({
        success: true,
        data: {
          userId,
          message: 'Invitation accepted successfully',
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
          code: error.code,
        });
        return;
      }

      console.error('Accept invitation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to accept invitation',
      });
    }
  });

  /**
   * DELETE /api/invitations/:token
   * Revoke an invitation
   */
  router.delete('/invitations/:token', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.params['token'];
      if (token === undefined || token.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invitation token is required',
        });
        return;
      }
      
      // Extract from authenticated user session
      // In production, this would come from JWT or session middleware
      const userId = req.headers['x-user-id'];
      const revokedBy = typeof userId === 'string' ? userId : 'admin-001';

      await organizationService.revokeInvitation(token, revokedBy);

      res.json({
        success: true,
        message: 'Invitation revoked successfully',
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message,
          code: error.code,
        });
        return;
      }

      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: error.code,
        });
        return;
      }

      console.error('Revoke invitation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to revoke invitation',
      });
    }
  });

  return router;
}
