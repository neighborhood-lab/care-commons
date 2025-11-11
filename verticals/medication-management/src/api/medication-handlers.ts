/**
 * Medication API Handlers
 *
 * Express request handlers for medication management and administration
 */

import type { Request, Response } from 'express';
import { MedicationService } from '../service/medication-service.js';
import type { UserContext, Role } from '@care-commons/core';
import { ValidationError, PermissionError, NotFoundError } from '@care-commons/core';
import {
  createMedicationSchema,
  updateMedicationSchema,
  recordAdministrationSchema,
} from '../validation/medication-validator.js';
import { ZodError } from 'zod';

/**
 * Type guard to check if error is a known domain error
 */
function isDomainError(
  error: unknown
): error is ValidationError | PermissionError | NotFoundError {
  return (
    error instanceof ValidationError ||
    error instanceof PermissionError ||
    error instanceof NotFoundError
  );
}

/**
 * Handle errors consistently across all handlers
 */
function handleError(error: unknown, res: Response, operation: string): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: error.issues,
    });
  } else if (isDomainError(error)) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message, details: error.context });
    } else if (error instanceof PermissionError) {
      res.status(403).json({ error: error.message });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    }
  } else if (error instanceof Error) {
    console.error(`Error ${operation}:`, error);
    res.status(500).json({ error: error.message });
  } else {
    console.error(`Error ${operation}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Extract user context from request
 * In production, this would extract from JWT or session
 */
function getUserContext(req: Request): UserContext {
  const branchId = req.header('X-Branch-Id');
  return {
    userId: req.header('X-User-Id') || 'system',
    organizationId: req.header('X-Organization-Id') || '',
    branchIds: branchId ? [branchId] : [],
    roles: (req.header('X-User-Roles') || 'CAREGIVER').split(',') as Role[],
    permissions: (req.header('X-User-Permissions') || '').split(',').filter(Boolean),
  };
}

/**
 * Create API handlers for medications
 */
export function createMedicationHandlers(service: MedicationService) {
  return {
    /**
     * GET /api/clients/:clientId/medications
     * Get all medications for a client
     */
    getClientMedications: async (req: Request, res: Response): Promise<void> => {
      try {
        const context = getUserContext(req);
        const { clientId } = req.params;

        if (!clientId) {
          res.status(400).json({ error: 'clientId parameter is required' });
          return;
        }

        const medications = await service.getClientActiveMedicationsWithStatus(
          clientId,
          context
        );

        res.json(medications);
      } catch (error) {
        handleError(error, res, 'fetching client medications');
      }
    },

    /**
     * POST /api/medications
     * Create a new medication order
     */
    createMedication: async (req: Request, res: Response): Promise<void> => {
      try {
        const context = getUserContext(req);
        const input = createMedicationSchema.parse(req.body);

        const medication = await service.createMedication(input, context);

        res.status(201).json(medication);
      } catch (error) {
        handleError(error, res, 'creating medication');
      }
    },

    /**
     * GET /api/medications/:medicationId
     * Get a specific medication
     */
    getMedication: async (req: Request, res: Response): Promise<void> => {
      try {
        const context = getUserContext(req);
        const { medicationId } = req.params;

        if (!medicationId) {
          res.status(400).json({ error: 'medicationId parameter is required' });
          return;
        }

        const medication = await service.getMedication(medicationId, context);

        res.json(medication);
      } catch (error) {
        handleError(error, res, 'fetching medication');
      }
    },

    /**
     * PATCH /api/medications/:medicationId
     * Update a medication
     */
    updateMedication: async (req: Request, res: Response): Promise<void> => {
      try {
        const context = getUserContext(req);
        const { medicationId } = req.params;

        if (!medicationId) {
          res.status(400).json({ error: 'medicationId parameter is required' });
          return;
        }

        const input = updateMedicationSchema.parse(req.body);

        const medication = await service.updateMedication(medicationId, input, context);

        res.json(medication);
      } catch (error) {
        handleError(error, res, 'updating medication');
      }
    },

    /**
     * POST /api/medications/:medicationId/discontinue
     * Discontinue a medication
     */
    discontinueMedication: async (req: Request, res: Response): Promise<void> => {
      try {
        const context = getUserContext(req);
        const { medicationId } = req.params;

        if (!medicationId) {
          res.status(400).json({ error: 'medicationId parameter is required' });
          return;
        }

        const medication = await service.discontinueMedication(medicationId, context);

        res.json(medication);
      } catch (error) {
        handleError(error, res, 'discontinuing medication');
      }
    },

    /**
     * POST /api/medications/:medicationId/administer
     * Record a medication administration
     */
    recordAdministration: async (req: Request, res: Response): Promise<void> => {
      try {
        const context = getUserContext(req);
        const { medicationId } = req.params;

        const input = recordAdministrationSchema.parse({
          ...req.body,
          medicationId, // Ensure medicationId from URL is used
        });

        const administration = await service.recordAdministration(input, context);

        res.status(201).json(administration);
      } catch (error) {
        handleError(error, res, 'recording medication administration');
      }
    },

    /**
     * GET /api/medications/:medicationId/administrations
     * Get administration history for a medication
     */
    getMedicationAdministrations: async (req: Request, res: Response): Promise<void> => {
      try {
        const context = getUserContext(req);
        const { medicationId } = req.params;

        if (!medicationId) {
          res.status(400).json({ error: 'medicationId parameter is required' });
          return;
        }

        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

        const administrations = await service.getMedicationAdministrations(
          medicationId,
          context,
          limit
        );

        res.json(administrations);
      } catch (error) {
        handleError(error, res, 'fetching medication administrations');
      }
    },

    /**
     * GET /api/clients/:clientId/administrations
     * Get administration history for a client within a date range
     */
    getClientAdministrations: async (req: Request, res: Response): Promise<void> => {
      try {
        const context = getUserContext(req);
        const { clientId } = req.params;
        const { startDate, endDate } = req.query;

        if (!clientId) {
          res.status(400).json({ error: 'clientId parameter is required' });
          return;
        }

        if (!startDate || !endDate) {
          res.status(400).json({ error: 'startDate and endDate are required' });
          return;
        }

        const administrations = await service.getClientAdministrations(
          clientId,
          startDate as string,
          endDate as string,
          context
        );

        res.json(administrations);
      } catch (error) {
        handleError(error, res, 'fetching client administrations');
      }
    },
  };
}
