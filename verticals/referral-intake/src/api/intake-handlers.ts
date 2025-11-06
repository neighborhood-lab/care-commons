/**
 * Intake API Handlers
 *
 * HTTP request handlers for intake endpoints
 */

import type { Request, Response } from 'express';
import type { IntakeService } from '../service/intake-service.js';

export class IntakeHandlers {
  constructor(private service: IntakeService) {}

  createIntake = async (req: Request, res: Response): Promise<void> => {
    try {
      const intake = await this.service.createIntake(req.body);
      res.status(201).json(intake);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  getIntake = async (req: Request, res: Response): Promise<void> => {
    try {
      const intake = await this.service.getIntakeById(req.params.id);
      if (!intake) {
        res.status(404).json({ error: 'Intake not found' });
        return;
      }
      res.json(intake);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  searchIntakes = async (req: Request, res: Response): Promise<void> => {
    try {
      const intakes = await this.service.searchIntakes(req.query);
      res.json(intakes);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  updateIntakeStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, reason } = req.body;
      const intake = await this.service.updateIntakeStatus(
        req.params.id,
        status,
        reason
      );
      res.json(intake);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  progressToNextStage = async (req: Request, res: Response): Promise<void> => {
    try {
      const intake = await this.service.progressToNextStage(req.params.id);
      res.json(intake);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  completeIntake = async (req: Request, res: Response): Promise<void> => {
    try {
      const { clientId } = req.body;
      const intake = await this.service.completeIntake(req.params.id, clientId);
      res.json(intake);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  getIntakeMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.params;
      const metrics = await this.service.getIntakeMetrics(organizationId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getIntakeChecklist = async (req: Request, res: Response): Promise<void> => {
    try {
      const checklist = await this.service.getIntakeChecklist(req.params.id);
      res.json(checklist);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };
}
