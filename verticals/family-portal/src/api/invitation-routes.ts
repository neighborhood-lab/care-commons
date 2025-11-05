/**
 * Family Portal Invitation Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import type { FamilyInvitationService } from '../service/index.js';
import { createInvitationSchema, acceptInvitationSchema } from '../validation/index.js';

export function createInvitationRoutes(invitationService: FamilyInvitationService): Router {
  const router = Router();

  /**
   * POST /api/family-portal/invitations
   * Create a new invitation (staff only)
   */
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = (req as any).userContext;
      if (!context) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const input = createInvitationSchema.parse(req.body);
      const invitation = await invitationService.createInvitation(input, context);

      res.status(201).json({
        success: true,
        data: invitation,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/family-portal/invitations/verify/:token
   * Verify invitation token
   */
  router.get('/verify/:token', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      const invitation = await invitationService.getInvitationByToken(token);

      if (!invitation) {
        return res.status(404).json({
          success: false,
          error: 'Invalid or expired invitation',
        });
      }

      // Return safe invitation details (no sensitive data)
      res.json({
        success: true,
        data: {
          email: invitation.email,
          proposedAccessLevel: invitation.proposedAccessLevel,
          expiresAt: invitation.expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/family-portal/invitations/accept
   * Accept invitation and create account
   */
  router.post('/accept', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = acceptInvitationSchema.parse(req.body);
      const result = await invitationService.acceptInvitation(input);

      res.json({
        success: true,
        message: 'Invitation accepted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/family-portal/invitations/client/:clientId
   * Get invitations for a client (staff only)
   */
  router.get('/client/:clientId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = (req as any).userContext;
      if (!context) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { clientId } = req.params;
      const invitations = await invitationService.getClientInvitations(clientId);

      res.json({
        success: true,
        data: invitations,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/family-portal/invitations/:id/revoke
   * Revoke an invitation (staff only)
   */
  router.post('/:id/revoke', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = (req as any).userContext;
      if (!context) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      await invitationService.revokeInvitation(id, context);

      res.json({
        success: true,
        message: 'Invitation revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/family-portal/invitations/:id/resend
   * Resend an invitation (staff only)
   */
  router.post('/:id/resend', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = (req as any).userContext;
      if (!context) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      const invitation = await invitationService.resendInvitation(id, context);

      res.json({
        success: true,
        data: invitation,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
