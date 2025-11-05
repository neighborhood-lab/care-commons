/**
 * Family Contact API Routes
 *
 * REST API endpoints for managing authorized family contacts
 */

import { Router, Request, Response } from 'express';
import { FamilyPortalService } from '../service/family-portal-service.js';
import { Database } from '@care-commons/core';
import {
  CreateFamilyContactInput,
  UpdateFamilyContactInput,
  FamilyContactSearchCriteria,
} from '../types/index.js';

export function createFamilyContactRoutes(database: Database): Router {
  const router = Router();
  const service = new FamilyPortalService(database);

  /**
   * Create a new family contact
   * POST /api/family-contacts
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const input: CreateFamilyContactInput = req.body;
      const context = {
        userId: req.headers['x-user-id'] as string,
        organizationId: req.headers['x-organization-id'] as string,
      };

      const contact = await service.createFamilyContact(input, context);
      res.status(201).json(contact);
    } catch (error) {
      console.error('Error creating family contact:', error);
      res.status(500).json({
        error: 'Failed to create family contact',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Get family contact by ID
   * GET /api/family-contacts/:id
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const context = {
        userId: req.headers['x-user-id'] as string,
        organizationId: req.headers['x-organization-id'] as string,
      };

      const contact = await service.getFamilyContact(req.params.id, context);
      if (!contact) {
        res.status(404).json({ error: 'Family contact not found' });
        return;
      }

      res.json(contact);
    } catch (error) {
      console.error('Error fetching family contact:', error);
      res.status(500).json({
        error: 'Failed to fetch family contact',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Get family contacts for a client
   * GET /api/family-contacts/client/:clientId
   */
  router.get('/client/:clientId', async (req: Request, res: Response) => {
    try {
      const context = {
        userId: req.headers['x-user-id'] as string,
        organizationId: req.headers['x-organization-id'] as string,
      };

      const activeOnly = req.query.activeOnly !== 'false';
      const contacts = await service.getClientFamilyContacts(
        req.params.clientId,
        context,
        activeOnly
      );

      res.json(contacts);
    } catch (error) {
      console.error('Error fetching client family contacts:', error);
      res.status(500).json({
        error: 'Failed to fetch family contacts',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Update family contact
   * PUT /api/family-contacts/:id
   */
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const input: UpdateFamilyContactInput = req.body;
      const context = {
        userId: req.headers['x-user-id'] as string,
        organizationId: req.headers['x-organization-id'] as string,
      };

      const contact = await service.updateFamilyContact(req.params.id, input, context);
      res.json(contact);
    } catch (error) {
      console.error('Error updating family contact:', error);
      res.status(500).json({
        error: 'Failed to update family contact',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Search family contacts
   * POST /api/family-contacts/search
   */
  router.post('/search', async (req: Request, res: Response) => {
    try {
      const criteria: FamilyContactSearchCriteria = req.body.criteria || {};
      const pagination = {
        page: Number.parseInt(req.body.page as string, 10) || 1,
        limit: Number.parseInt(req.body.limit as string, 10) || 20,
        sortBy: req.body.sortBy || 'created_at',
        sortOrder: (req.body.sortOrder || 'desc') as 'asc' | 'desc',
      };

      const context = {
        userId: req.headers['x-user-id'] as string,
        organizationId: req.headers['x-organization-id'] as string,
      };

      const results = await service.searchFamilyContacts(criteria, pagination, context);
      res.json(results);
    } catch (error) {
      console.error('Error searching family contacts:', error);
      res.status(500).json({
        error: 'Failed to search family contacts',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Deactivate family contact
   * POST /api/family-contacts/:id/deactivate
   */
  router.post('/:id/deactivate', async (req: Request, res: Response) => {
    try {
      const reason = req.body.reason || 'Deactivated by administrator';
      const context = {
        userId: req.headers['x-user-id'] as string,
        organizationId: req.headers['x-organization-id'] as string,
      };

      const contact = await service.deactivateFamilyContact(req.params.id, reason, context);
      res.json(contact);
    } catch (error) {
      console.error('Error deactivating family contact:', error);
      res.status(500).json({
        error: 'Failed to deactivate family contact',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Reactivate family contact
   * POST /api/family-contacts/:id/reactivate
   */
  router.post('/:id/reactivate', async (req: Request, res: Response) => {
    try {
      const context = {
        userId: req.headers['x-user-id'] as string,
        organizationId: req.headers['x-organization-id'] as string,
      };

      const contact = await service.reactivateFamilyContact(req.params.id, context);
      res.json(contact);
    } catch (error) {
      console.error('Error reactivating family contact:', error);
      res.status(500).json({
        error: 'Failed to reactivate family contact',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Authenticate with access code (public endpoint)
   * POST /api/family-contacts/auth/access-code
   */
  router.post('/auth/access-code', async (req: Request, res: Response) => {
    try {
      const { accessCode } = req.body;
      if (!accessCode) {
        res.status(400).json({ error: 'Access code is required' });
        return;
      }

      const contact = await service.authenticateWithAccessCode(accessCode);
      if (!contact) {
        res.status(401).json({ error: 'Invalid or expired access code' });
        return;
      }

      res.json(contact);
    } catch (error) {
      console.error('Error authenticating with access code:', error);
      res.status(500).json({
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
