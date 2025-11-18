/**
 * Usage Limit Enforcement Middleware
 * 
 * Enforces subscription plan limits for clients, caregivers, and visits.
 * Prevents operations when limits are exceeded.
 */

import { Request, Response, NextFunction } from 'express';
import { Database } from '../db/connection.js';
import { BillingRepository } from '../repository/billing-repository.js';
import { UUID } from '../types/base.js';

export interface UsageLimitCheckResult {
  allowed: boolean;
  limitType?: 'clients' | 'caregivers' | 'visits';
  currentCount?: number;
  limit?: number;
  message?: string;
}

/**
 * Resource types that can be limited
 */
export type LimitedResource = 'client' | 'caregiver' | 'visit';

/**
 * Usage Limit Middleware
 * 
 * Checks if the organization has exceeded their subscription limits
 * before allowing create operations.
 */
export class UsageLimitMiddleware {
  private billingRepo: BillingRepository;
  
  constructor(private db: Database) {
    this.billingRepo = new BillingRepository(db);
  }
  
  /**
   * Create middleware for limiting client creation
   */
  limitClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.checkLimit(req, res, next, 'client');
  };
  
  /**
   * Create middleware for limiting caregiver creation
   */
  limitCaregivers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.checkLimit(req, res, next, 'caregiver');
  };
  
  /**
   * Create middleware for limiting visit creation
   */
  limitVisits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.checkLimit(req, res, next, 'visit');
  };
  
  /**
   * Check if resource creation is allowed based on subscription limits
   */
  private async checkLimit(
    req: Request,
    res: Response,
    next: NextFunction,
    resourceType: LimitedResource
  ): Promise<void> {
    try {
      // Get organization ID from authenticated user
      const organizationId = req.user?.organizationId;
      
      if (organizationId === undefined) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }
      
      // Check if billing tables exist
      const tablesExist = await this.billingRepo.checkTableExists();
      if (!tablesExist) {
        // No billing limits enforced yet
        next();
        return;
      }
      
      // Get subscription
      const subscription = await this.billingRepo.getSubscriptionByOrganization(organizationId);
      if (subscription === null) {
        // No subscription - allow for now (grace period)
        console.warn(`[UsageLimit] Organization ${organizationId} has no subscription but operation allowed`);
        next();
        return;
      }
      
      // Check if subscription is active
      if (subscription.status !== 'active' && subscription.status !== 'trialing') {
        res.status(402).json({
          success: false,
          error: 'Subscription is not active',
          code: 'SUBSCRIPTION_INACTIVE',
          details: {
            status: subscription.status,
            message: this.getStatusMessage(subscription.status),
          },
        });
        return;
      }
      
      // Get current usage
      const result = await this.checkResourceLimit(organizationId, resourceType, subscription);
      
      if (!result.allowed) {
        res.status(403).json({
          success: false,
          error: result.message ?? 'Usage limit exceeded',
          code: 'USAGE_LIMIT_EXCEEDED',
          details: {
            limitType: result.limitType,
            currentCount: result.currentCount,
            limit: result.limit,
            planName: subscription.planName,
          },
        });
        return;
      }
      
      // Limit not exceeded, continue
      next();
    } catch (error) {
      console.error('[UsageLimit] Error checking usage limits:', error);
      // Don't block on errors - fail open for better UX
      next();
    }
  }
  
  /**
   * Check if a specific resource can be created
   */
  private async checkResourceLimit(
    organizationId: UUID,
    resourceType: LimitedResource,
    subscription: { clientLimit: number; caregiverLimit: number; visitLimit: number | null }
  ): Promise<UsageLimitCheckResult> {
    let currentCount: number;
    let limit: number | null;
    let limitType: 'clients' | 'caregivers' | 'visits';
    
    switch (resourceType) {
      case 'client':
        currentCount = await this.getClientCount(organizationId);
        limit = subscription.clientLimit;
        limitType = 'clients';
        break;
      
      case 'caregiver':
        currentCount = await this.getCaregiverCount(organizationId);
        limit = subscription.caregiverLimit;
        limitType = 'caregivers';
        break;
      
      case 'visit':
        currentCount = await this.getVisitCount(organizationId);
        limit = subscription.visitLimit;
        limitType = 'visits';
        break;
    }
    
    // If no limit (null), allow unlimited
    if (limit === null) {
      return { allowed: true };
    }
    
    // Check if adding one more would exceed limit
    if (currentCount >= limit) {
      return {
        allowed: false,
        limitType,
        currentCount,
        limit,
        message: `You have reached your ${limitType} limit (${currentCount}/${limit}). Please upgrade your plan to add more.`,
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * Get current client count for organization
   */
  private async getClientCount(organizationId: UUID): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM clients
      WHERE organization_id = $1
        AND deleted_at IS NULL
    `;
    
    const result = await this.db.query<{ count: string }>(query, [organizationId]);
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }
  
  /**
   * Get current caregiver count for organization
   */
  private async getCaregiverCount(organizationId: UUID): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM users
      WHERE organization_id = $1
        AND deleted_at IS NULL
        AND roles && ARRAY['CAREGIVER']::text[]
    `;
    
    const result = await this.db.query<{ count: string }>(query, [organizationId]);
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }
  
  /**
   * Get current visit count for organization (current billing period)
   */
  private async getVisitCount(organizationId: UUID): Promise<number> {
    // Get current billing period from subscription
    const subscription = await this.billingRepo.getSubscriptionByOrganization(organizationId);
    if (subscription === null) {
      return 0;
    }
    
    const query = `
      SELECT COUNT(*) as count
      FROM visits
      WHERE organization_id = $1
        AND scheduled_start_time >= $2
        AND scheduled_start_time < $3
        AND deleted_at IS NULL
    `;
    
    const result = await this.db.query<{ count: string }>(query, [
      organizationId,
      subscription.currentPeriodStart,
      subscription.currentPeriodEnd,
    ]);
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }
  
  /**
   * Get user-friendly message for subscription status
   */
  private getStatusMessage(status: string): string {
    switch (status) {
      case 'incomplete':
        return 'Your subscription setup is incomplete. Please complete payment setup.';
      case 'incomplete_expired':
        return 'Your subscription setup has expired. Please contact support.';
      case 'past_due':
        return 'Your subscription payment is past due. Please update your payment method.';
      case 'canceled':
        return 'Your subscription has been canceled.';
      case 'unpaid':
        return 'Your subscription is unpaid. Please update your payment method.';
      case 'paused':
        return 'Your subscription is paused.';
      default:
        return 'Your subscription is not active.';
    }
  }
  
  /**
   * Get current usage statistics for an organization
   */
  async getUsageStats(organizationId: UUID): Promise<{
    clients: { current: number; limit: number | null };
    caregivers: { current: number; limit: number | null };
    visits: { current: number; limit: number | null };
    planName: string;
    status: string;
  } | null> {
    const subscription = await this.billingRepo.getSubscriptionByOrganization(organizationId);
    if (subscription === null) {
      return null;
    }
    
    const [clientCount, caregiverCount, visitCount] = await Promise.all([
      this.getClientCount(organizationId),
      this.getCaregiverCount(organizationId),
      this.getVisitCount(organizationId),
    ]);
    
    return {
      clients: {
        current: clientCount,
        limit: subscription.clientLimit,
      },
      caregivers: {
        current: caregiverCount,
        limit: subscription.caregiverLimit,
      },
      visits: {
        current: visitCount,
        limit: subscription.visitLimit,
      },
      planName: subscription.planName,
      status: subscription.status,
    };
  }
}

/**
 * Factory function to create usage limit middleware
 */
export function createUsageLimitMiddleware(db: Database): UsageLimitMiddleware {
  return new UsageLimitMiddleware(db);
}
