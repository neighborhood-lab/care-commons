import type { Request, Response } from 'express';
import { IncidentService } from '../service/incident-service.js';
import type { UserContext, Role } from '@care-commons/core';
import { createIncidentSchema, updateIncidentSchema } from '../validation/incident-validator.js';
import { ZodError } from 'zod';

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

function handleError(error: unknown, res: Response, operation: string): void {
  if (error instanceof ZodError) {
    res.status(400).json({ error: 'Validation error', details: error.issues });
  } else if (error instanceof Error) {
    console.error(`Error ${operation}:`, error);
    res.status(500).json({ error: error.message });
  } else {
    console.error(`Error ${operation}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function createIncidentHandlers(service: IncidentService) {
  return {
    createIncident: async (req: Request, res: Response): Promise<void> => {
      try {
        const context = getUserContext(req);
        const input = createIncidentSchema.parse(req.body);
        const incident = await service.createIncident(input, context);
        res.status(201).json(incident);
      } catch (error) {
        handleError(error, res, 'creating incident');
      }
    },

    getIncident: async (req: Request, res: Response): Promise<void> => {
      try {
        const { incidentId } = req.params;
        if (!incidentId) {
          res.status(400).json({ error: 'incidentId parameter is required' });
          return;
        }
        const incident = await service.getIncident(incidentId);
        if (!incident) {
          res.status(404).json({ error: 'Incident not found' });
          return;
        }
        res.json(incident);
      } catch (error) {
        handleError(error, res, 'fetching incident');
      }
    },

    updateIncident: async (req: Request, res: Response): Promise<void> => {
      try {
        const context = getUserContext(req);
        const { incidentId } = req.params;
        if (!incidentId) {
          res.status(400).json({ error: 'incidentId parameter is required' });
          return;
        }
        const input = updateIncidentSchema.parse(req.body);
        const incident = await service.updateIncident(incidentId, input, context);
        res.json(incident);
      } catch (error) {
        handleError(error, res, 'updating incident');
      }
    },

    searchIncidents: async (req: Request, res: Response): Promise<void> => {
      try {
        const context = getUserContext(req);
        const filters = {
          clientId: req.query.clientId as string | undefined,
          incidentType: req.query.incidentType as any,
          severity: req.query.severity as any,
          status: req.query.status as any,
          startDate: req.query.startDate as string | undefined,
          endDate: req.query.endDate as string | undefined,
          reportedBy: req.query.reportedBy as string | undefined,
          stateReportingRequired: req.query.stateReportingRequired === 'true' ? true : undefined,
          investigationRequired: req.query.investigationRequired === 'true' ? true : undefined,
        };
        const incidents = await service.searchIncidents(filters, context);
        res.json(incidents);
      } catch (error) {
        handleError(error, res, 'searching incidents');
      }
    },
  };
}
