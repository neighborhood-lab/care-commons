/**
 * Referral API Handlers
 *
 * HTTP request handlers for referral endpoints
 */

import type { Request, Response } from 'express';
import type { ReferralService } from '../service/referral-service.js';

export class ReferralHandlers {
  constructor(private service: ReferralService) {}

  createReferral = async (req: Request, res: Response): Promise<void> => {
    try {
      const referral = await this.service.createReferral(req.body);
      res.status(201).json(referral);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  getReferral = async (req: Request, res: Response): Promise<void> => {
    try {
      const referral = await this.service.getReferralById(req.params.id);
      if (!referral) {
        res.status(404).json({ error: 'Referral not found' });
        return;
      }
      res.json(referral);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  searchReferrals = async (req: Request, res: Response): Promise<void> => {
    try {
      const referrals = await this.service.searchReferrals(req.query);
      res.json(referrals);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  updateReferralStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, reason } = req.body;
      const referral = await this.service.updateReferralStatus(
        req.params.id,
        status,
        reason
      );
      res.json(referral);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  assignReferral = async (req: Request, res: Response): Promise<void> => {
    try {
      const { assignedTo } = req.body;
      const referral = await this.service.assignReferral(req.params.id, assignedTo);
      res.json(referral);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  convertToIntake = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.convertToIntake(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  getReferralMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.params;
      const metrics = await this.service.getReferralMetrics(organizationId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };
}
