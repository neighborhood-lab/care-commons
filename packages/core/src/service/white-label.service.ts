/**
 * @care-commons/core - White Label Service
 *
 * Business logic for multi-agency white-labeling
 */

import { Database } from '../db/connection';
import { UUID, UserContext } from '../types/base';
import {
  OrganizationBranding,
  UpdateBrandingRequest,
  OrganizationSubscription,
  UpdateSubscriptionRequest,
  SubscriptionPlanTier,
  SuperAdminDashboardStats,
  OrganizationDetail,
} from '../types/white-label';
import { BrandingRepository } from '../repository/branding-repository';
import { SubscriptionRepository } from '../repository/subscription-repository';
import { UsageMetricsRepository } from '../repository/usage-metrics-repository';
import { OrganizationRepository } from '../repository/organization-repository';

export class WhiteLabelService {
  private brandingRepo: BrandingRepository;
  private subscriptionRepo: SubscriptionRepository;
  private metricsRepo: UsageMetricsRepository;
  private orgRepo: OrganizationRepository;

  constructor(private db: Database) {
    this.brandingRepo = new BrandingRepository(db);
    this.subscriptionRepo = new SubscriptionRepository(db);
    this.metricsRepo = new UsageMetricsRepository(db);
    this.orgRepo = new OrganizationRepository(db);
  }

  // ====== Branding Management ======

  /**
   * Get branding for an organization (or create default if not exists)
   */
  async getBranding(
    organizationId: UUID,
    context: UserContext
  ): Promise<OrganizationBranding> {
    this.validateOrganizationAccess(organizationId, context);

    let branding = await this.brandingRepo.getBrandingByOrganizationId(organizationId);

    // Create default branding if it doesn't exist
    if (!branding) {
      branding = await this.brandingRepo.createBranding(organizationId, context.userId);
    }

    return branding;
  }

  /**
   * Get branding by custom domain (for domain-based tenant resolution)
   */
  async getBrandingByDomain(domain: string): Promise<OrganizationBranding | null> {
    return this.brandingRepo.getBrandingByCustomDomain(domain);
  }

  /**
   * Update organization branding
   */
  async updateBranding(
    organizationId: UUID,
    updates: UpdateBrandingRequest,
    context: UserContext
  ): Promise<OrganizationBranding> {
    this.validateOrganizationAccess(organizationId, context);

    // Validate subscription allows white-labeling
    const subscription = await this.subscriptionRepo.getSubscriptionByOrganizationId(
      organizationId
    );

    if (subscription && !subscription.whiteLabelingEnabled) {
      throw new Error('White-labeling is not enabled for your subscription plan');
    }

    // Validate custom domain if being set
    if (updates.customDomain !== undefined) {
      if (subscription && !subscription.customDomainEnabled) {
        throw new Error('Custom domains are not enabled for your subscription plan');
      }

      // Check if domain is already in use
      if (updates.customDomain) {
        const existingBranding = await this.brandingRepo.getBrandingByCustomDomain(
          updates.customDomain
        );
        if (existingBranding && existingBranding.organizationId !== organizationId) {
          throw new Error('Custom domain is already in use by another organization');
        }
      }
    }

    // Ensure branding exists
    let branding = await this.brandingRepo.getBrandingByOrganizationId(organizationId);
    if (!branding) {
      branding = await this.brandingRepo.createBranding(organizationId, context.userId);
    }

    return this.brandingRepo.updateBranding(organizationId, updates, context.userId);
  }

  /**
   * Verify custom domain ownership (called after DNS verification)
   */
  async verifyCustomDomain(
    organizationId: UUID,
    context: UserContext
  ): Promise<void> {
    this.validateOrganizationAccess(organizationId, context);

    await this.brandingRepo.verifyCustomDomain(organizationId, context.userId);
  }

  // ====== Subscription Management ======

  /**
   * Get subscription for an organization
   */
  async getSubscription(
    organizationId: UUID,
    context: UserContext
  ): Promise<OrganizationSubscription | null> {
    this.validateOrganizationAccess(organizationId, context);

    return this.subscriptionRepo.getSubscriptionByOrganizationId(organizationId);
  }

  /**
   * Create subscription for a new organization
   */
  async createSubscription(
    organizationId: UUID,
    planTier: SubscriptionPlanTier,
    context: UserContext
  ): Promise<OrganizationSubscription> {
    this.validateOrganizationAccess(organizationId, context);

    // Check if subscription already exists
    const existing = await this.subscriptionRepo.getSubscriptionByOrganizationId(
      organizationId
    );

    if (existing) {
      throw new Error('Subscription already exists for this organization');
    }

    return this.subscriptionRepo.createSubscription(organizationId, planTier, context.userId);
  }

  /**
   * Update subscription (upgrade/downgrade plan)
   */
  async updateSubscription(
    organizationId: UUID,
    updates: UpdateSubscriptionRequest,
    context: UserContext
  ): Promise<OrganizationSubscription> {
    this.validateOrganizationAccess(organizationId, context);

    return this.subscriptionRepo.updateSubscription(organizationId, updates, context.userId);
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    organizationId: UUID,
    reason: string,
    context: UserContext
  ): Promise<void> {
    this.validateOrganizationAccess(organizationId, context);

    await this.subscriptionRepo.cancelSubscription(organizationId, reason, context.userId);
  }

  /**
   * Check if organization has exceeded subscription limits
   */
  async checkSubscriptionLimits(organizationId: UUID): Promise<{
    withinLimits: boolean;
    violations: string[];
  }> {
    const subscription = await this.subscriptionRepo.getSubscriptionByOrganizationId(
      organizationId
    );

    if (!subscription) {
      return { withinLimits: true, violations: [] };
    }

    const violations: string[] = [];

    // Get current usage
    const metrics = await this.metricsRepo.getLatestMetricsByOrganization(organizationId);

    if (metrics) {
      if (subscription.maxUsers !== null && metrics.totalUsers > subscription.maxUsers) {
        violations.push(
          `User limit exceeded: ${metrics.totalUsers}/${subscription.maxUsers}`
        );
      }

      if (
        subscription.maxClients !== null &&
        metrics.totalClients > subscription.maxClients
      ) {
        violations.push(
          `Client limit exceeded: ${metrics.totalClients}/${subscription.maxClients}`
        );
      }

      if (
        subscription.maxCaregivers !== null &&
        metrics.totalCaregivers > subscription.maxCaregivers
      ) {
        violations.push(
          `Caregiver limit exceeded: ${metrics.totalCaregivers}/${subscription.maxCaregivers}`
        );
      }
    }

    return {
      withinLimits: violations.length === 0,
      violations,
    };
  }

  // ====== Super Admin Functions ======

  /**
   * Get dashboard statistics for super admin
   */
  async getSuperAdminDashboard(context: UserContext): Promise<SuperAdminDashboardStats> {
    if (!context.roles.includes('SUPER_ADMIN')) {
      throw new Error('Super admin access required');
    }

    // Get all organizations
    const orgsQuery = `
      SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_orgs,
        COUNT(*) FILTER (WHERE status = 'ACTIVE' AND deleted_at IS NULL) as active_orgs
      FROM organizations
    `;

    const orgsResult = await this.db.query<{
      total_orgs: string;
      active_orgs: string;
    }>(orgsQuery, []);

    const totalOrganizations = parseInt(orgsResult.rows[0]?.total_orgs ?? '0');
    const activeOrganizations = parseInt(orgsResult.rows[0]?.active_orgs ?? '0');

    // Get subscription statistics
    const allSubscriptions = await this.subscriptionRepo.getAllSubscriptions();

    const trialOrganizations = allSubscriptions.filter((s) => s.status === 'TRIAL').length;
    const totalUsers = allSubscriptions.reduce((sum, s) => sum + (s.maxUsers ?? 0), 0);

    const totalRevenue = allSubscriptions
      .filter((s) => s.status === 'ACTIVE')
      .reduce((sum, s) => sum + s.monthlyPrice, 0);

    const monthlyRecurringRevenue = allSubscriptions
      .filter((s) => s.status === 'ACTIVE' && s.billingCycle === 'MONTHLY')
      .reduce((sum, s) => sum + s.monthlyPrice, 0);

    const averageRevenuePerOrganization =
      activeOrganizations > 0 ? totalRevenue / activeOrganizations : 0;

    // Count by plan tier
    const organizationsByPlan: Record<SubscriptionPlanTier, number> = {
      FREE: 0,
      BASIC: 0,
      PROFESSIONAL: 0,
      ENTERPRISE: 0,
      CUSTOM: 0,
    };

    for (const sub of allSubscriptions) {
      organizationsByPlan[sub.planTier]++;
    }

    // Recent signups (last 30 days)
    const recentSignupsQuery = `
      SELECT o.id, o.name, o.created_at, s.plan_tier
      FROM organizations o
      LEFT JOIN organization_subscriptions s ON s.organization_id = o.id
      WHERE o.created_at >= NOW() - INTERVAL '30 days'
        AND o.deleted_at IS NULL
      ORDER BY o.created_at DESC
      LIMIT 10
    `;

    const recentResult = await this.db.query<{
      id: string;
      name: string;
      created_at: Date;
      plan_tier: string | null;
    }>(recentSignupsQuery, []);

    const recentSignups = recentResult.rows.map((row) => ({
      organizationId: row.id,
      organizationName: row.name,
      signupDate: row.created_at,
      planTier: (row.plan_tier as SubscriptionPlanTier) ?? 'FREE',
    }));

    // Top organizations by usage
    const topOrgsQuery = `
      SELECT
        o.id,
        o.name,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT c.id) as total_clients,
        COALESCE(s.monthly_price, 0) as total_revenue
      FROM organizations o
      LEFT JOIN users u ON u.organization_id = o.id AND u.deleted_at IS NULL
      LEFT JOIN clients c ON c.organization_id = o.id AND c.deleted_at IS NULL
      LEFT JOIN organization_subscriptions s ON s.organization_id = o.id
      WHERE o.deleted_at IS NULL
      GROUP BY o.id, o.name, s.monthly_price
      ORDER BY total_users DESC, total_clients DESC
      LIMIT 10
    `;

    const topOrgsResult = await this.db.query<{
      id: string;
      name: string;
      total_users: string;
      total_clients: string;
      total_revenue: string;
    }>(topOrgsQuery, []);

    const topOrganizationsByUsage = topOrgsResult.rows.map((row) => ({
      organizationId: row.id,
      organizationName: row.name,
      totalUsers: parseInt(row.total_users),
      totalClients: parseInt(row.total_clients),
      totalRevenue: parseFloat(row.total_revenue),
    }));

    return {
      totalOrganizations,
      activeOrganizations,
      trialOrganizations,
      totalUsers,
      totalRevenue,
      monthlyRecurringRevenue,
      averageRevenuePerOrganization,
      organizationsByPlan,
      recentSignups,
      topOrganizationsByUsage,
    };
  }

  /**
   * Get detailed information about an organization (super admin only)
   */
  async getOrganizationDetail(
    organizationId: UUID,
    context: UserContext
  ): Promise<OrganizationDetail> {
    if (!context.roles.includes('SUPER_ADMIN')) {
      throw new Error('Super admin access required');
    }

    const org = await this.orgRepo.getOrganizationById(organizationId);
    if (!org) {
      throw new Error('Organization not found');
    }

    const subscription = await this.subscriptionRepo.getSubscriptionByOrganizationId(
      organizationId
    );

    const branding = await this.brandingRepo.getBrandingByOrganizationId(organizationId);

    // Get current usage counts
    const usageQuery = `
      SELECT
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT c.id) as total_clients,
        COUNT(DISTINCT cg.id) as total_caregivers,
        COUNT(DISTINCT b.id) as active_branches
      FROM organizations o
      LEFT JOIN users u ON u.organization_id = o.id AND u.deleted_at IS NULL
      LEFT JOIN clients c ON c.organization_id = o.id AND c.deleted_at IS NULL
      LEFT JOIN caregivers cg ON cg.organization_id = o.id AND cg.deleted_at IS NULL
      LEFT JOIN branches b ON b.organization_id = o.id AND b.status = 'ACTIVE' AND b.deleted_at IS NULL
      WHERE o.id = $1
      GROUP BY o.id
    `;

    const usageResult = await this.db.query<{
      total_users: string;
      total_clients: string;
      total_caregivers: string;
      active_branches: string;
    }>(usageQuery, [organizationId]);

    const usage = usageResult.rows[0];

    // Get recent metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentMetrics = await this.metricsRepo.getMetricsByOrganizationDateRange(
      organizationId,
      thirtyDaysAgo,
      new Date()
    );

    return {
      id: org.id,
      name: org.name,
      legalName: org.legalName,
      email: org.email,
      phone: org.phone,
      status: org.status,
      stateCode: org.stateCode,
      createdAt: org.createdAt,
      subscription: subscription ?? null,
      branding: branding ?? null,
      currentUsage: {
        totalUsers: parseInt(usage?.total_users ?? '0'),
        totalClients: parseInt(usage?.total_clients ?? '0'),
        totalCaregivers: parseInt(usage?.total_caregivers ?? '0'),
        activeBranches: parseInt(usage?.active_branches ?? '0'),
      },
      recentMetrics,
    };
  }

  /**
   * Get all organizations (super admin only, with pagination)
   */
  async getAllOrganizations(
    context: UserContext,
    page: number = 1,
    limit: number = 50
  ): Promise<{ organizations: OrganizationDetail[]; total: number }> {
    if (!context.roles.includes('SUPER_ADMIN')) {
      throw new Error('Super admin access required');
    }

    const offset = (page - 1) * limit;

    const query = `
      SELECT id FROM organizations
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await this.db.query<{ id: string }>(query, [limit, offset]);

    const organizations = await Promise.all(
      result.rows.map((row) => this.getOrganizationDetail(row.id, context))
    );

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total FROM organizations WHERE deleted_at IS NULL
    `;

    const countResult = await this.db.query<{ total: string }>(countQuery, []);
    const total = parseInt(countResult.rows[0]?.total ?? '0');

    return { organizations, total };
  }

  // ====== Helpers ======

  private validateOrganizationAccess(organizationId: UUID, context: UserContext): void {
    // SUPER_ADMIN can access any organization
    if (context.roles.includes('SUPER_ADMIN')) {
      return;
    }

    // Regular users can only access their own organization
    if (context.organizationId !== organizationId) {
      throw new Error('Access denied to different organization');
    }
  }
}
