/**
 * Transparency service - activity tracking and audit logging
 */

import {
  UserContext,
  PermissionError,
  PaginatedResult,
} from '@care-commons/core';
import { getPermissionService } from '@care-commons/core';
import {
  ActivityFeedEntry,
  AccessLogEntry,
  CreateActivityFeedEntryRequest,
  CreateAccessLogEntryRequest,
  ActivityFeedFilterOptions,
  AccessLogFilterOptions,
  HipaaDisclosureReport,
  ActivitySummary,
  ActivityFeedEntryWithDetails,
  FamilyTransparencyDashboard,
} from '../types/transparency.js';
import {
  ActivityFeedRepository,
  AccessLogRepository,
} from '../repository/transparency-repository.js';

export class TransparencyService {
  private activityFeedRepository: ActivityFeedRepository;
  private accessLogRepository: AccessLogRepository;
  private permissionService = getPermissionService();

  constructor(
    activityFeedRepository: ActivityFeedRepository,
    accessLogRepository: AccessLogRepository
  ) {
    this.activityFeedRepository = activityFeedRepository;
    this.accessLogRepository = accessLogRepository;
  }

  /**
   * Log activity to feed
   */
  async logActivity(
    request: CreateActivityFeedEntryRequest,
    context: UserContext
  ): Promise<ActivityFeedEntry> {
    const entry: Partial<ActivityFeedEntry> = {
      organizationId: request.organizationId,
      actorId: request.actorId || context.userId,
      actorType: request.actorType || 'USER',
      action: request.action,
      actionCategory: request.actionCategory,
      resourceType: request.resourceType,
      resourceId: request.resourceId,
      resourceDisplayName: request.resourceDisplayName,
      careRecipientId: request.careRecipientId,
      details: request.details || {},
      changes: request.changes,
      visibleToFamily: request.visibleToFamily || false,
      visibilityLevel: request.visibilityLevel || 'INTERNAL',
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      metadata: request.metadata || {},
    };

    return this.activityFeedRepository.create(entry, context);
  }

  /**
   * Get activity feed
   */
  async getActivityFeed(
    filters: ActivityFeedFilterOptions,
    context: UserContext
  ): Promise<PaginatedResult<ActivityFeedEntry>> {
    this.permissionService.requirePermission(context, 'activity:read');

    // Enforce organization scope
    filters.organizationId = context.organizationId;

    return this.activityFeedRepository.findByFilters(filters);
  }

  /**
   * Get activity feed for family member
   */
  async getActivityFeedForFamily(
    careRecipientId: string,
    context: UserContext
  ): Promise<PaginatedResult<ActivityFeedEntry>> {
    // Family members can only see activities visible to family
    const filters: ActivityFeedFilterOptions = {
      organizationId: context.organizationId,
      careRecipientId,
      visibleToFamilyOnly: true,
    };

    return this.activityFeedRepository.findByFilters(filters);
  }

  /**
   * Log access (HIPAA compliance)
   */
  async logAccess(
    request: CreateAccessLogEntryRequest,
    context: UserContext
  ): Promise<AccessLogEntry> {
    const entry: Partial<AccessLogEntry> = {
      organizationId: request.organizationId,
      userId: request.userId,
      userType: request.userType,
      userDisplayName: request.userDisplayName,
      resourceType: request.resourceType,
      resourceId: request.resourceId,
      resourceDisplayName: request.resourceDisplayName,
      accessedAt: new Date(),
      accessMethod: request.accessMethod,
      action: request.action,
      purpose: request.purpose,
      authorizationType: request.authorizationType,
      careRecipientId: request.careRecipientId,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      metadata: request.metadata || {},
      isPatientAccess: request.isPatientAccess || false,
      isEmergencyAccess: request.isEmergencyAccess || false,
      requiresDisclosure: request.requiresDisclosure !== false, // Default true
    };

    return this.accessLogRepository.create(entry, context);
  }

  /**
   * Get access logs
   */
  async getAccessLogs(
    filters: AccessLogFilterOptions,
    context: UserContext
  ): Promise<PaginatedResult<AccessLogEntry>> {
    this.permissionService.requirePermission(context, 'audit:read');

    // Enforce organization scope
    filters.organizationId = context.organizationId;

    return this.accessLogRepository.findByFilters(filters);
  }

  /**
   * Generate HIPAA disclosure report (§164.528)
   */
  async generateHipaaDisclosureReport(
    careRecipientId: string,
    startDate: Date,
    endDate: Date,
    context: UserContext
  ): Promise<HipaaDisclosureReport> {
    this.permissionService.requirePermission(context, 'audit:read');

    const logs = await this.accessLogRepository.getHipaaDisclosureReport(
      careRecipientId,
      startDate,
      endDate
    );

    return {
      careRecipientId,
      careRecipientName: 'Care Recipient', // TODO: Fetch from client service
      reportPeriodStart: startDate,
      reportPeriodEnd: endDate,
      disclosures: logs.map((log) => ({
        accessedAt: log.accessedAt,
        accessedBy: log.userDisplayName || log.userId,
        userType: log.userType,
        resourceType: log.resourceType,
        resourceName: log.resourceDisplayName || log.resourceId,
        action: log.action,
        purpose: log.purpose,
        authorizationType: log.authorizationType,
      })),
      totalDisclosures: logs.length,
    };
  }

  /**
   * Get activity summary
   */
  async getActivitySummary(
    organizationId: string,
    careRecipientId: string | undefined,
    context: UserContext
  ): Promise<ActivitySummary> {
    this.permissionService.requirePermission(context, 'activity:read');

    const filters: ActivityFeedFilterOptions = {
      organizationId,
      careRecipientId,
      limit: 10,
    };

    const activities = await this.activityFeedRepository.findByFilters(filters);

    // Count by category
    const byCategory = activities.items.reduce((acc, activity) => {
      acc[activity.actionCategory] = (acc[activity.actionCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get top actors
    const actorCounts = new Map<string, { name: string; count: number }>();
    activities.items.forEach((activity) => {
      if (activity.actorId) {
        const current = actorCounts.get(activity.actorId);
        if (current) {
          current.count++;
        } else {
          actorCounts.set(activity.actorId, {
            name: activity.actorId, // TODO: Fetch actual name
            count: 1,
          });
        }
      }
    });

    const topActors = Array.from(actorCounts.entries())
      .map(([id, data]) => ({
        actorId: id,
        actorName: data.name,
        activityCount: data.count,
      }))
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, 5);

    return {
      totalActivities: activities.total,
      activitiesByCategory: byCategory as any,
      recentActivities: activities.items as ActivityFeedEntryWithDetails[],
      topActors,
    };
  }

  /**
   * Get family transparency dashboard
   */
  async getFamilyDashboard(
    careRecipientId: string,
    context: UserContext
  ): Promise<FamilyTransparencyDashboard> {
    // Get recent activities
    const activities = await this.getActivityFeedForFamily(
      careRecipientId,
      context
    );

    // TODO: Integrate with visit and task services to get real counts
    // For now, return structure with placeholder data
    return {
      careRecipientId,
      careRecipientName: 'Care Recipient', // TODO: Fetch from client service
      recentActivities: activities.items as ActivityFeedEntryWithDetails[],
      visitSummary: {
        totalVisits: 0,
        completedVisits: 0,
        upcomingVisits: 0,
        lastVisitDate: undefined,
      },
      taskSummary: {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
      },
      unreadMessages: 0,
      recentIncidents: 0,
    };
  }

  /**
   * Track resource view (creates both activity and access log)
   */
  async trackResourceView(
    resourceType: string,
    resourceId: string,
    resourceDisplayName: string | undefined,
    careRecipientId: string | undefined,
    context: UserContext
  ): Promise<void> {
    // Log to activity feed
    await this.logActivity(
      {
        organizationId: context.organizationId,
        action: 'VIEWED',
        actionCategory: 'ACCESS',
        resourceType,
        resourceId,
        resourceDisplayName,
        careRecipientId,
        visibleToFamily: false,
        visibilityLevel: 'INTERNAL',
      },
      context
    );

    // Log to access logs (HIPAA compliance)
    await this.logAccess(
      {
        organizationId: context.organizationId,
        userId: context.userId,
        userType: 'STAFF', // TODO: Determine from context
        resourceType,
        resourceId,
        resourceDisplayName,
        accessMethod: 'WEB', // TODO: Determine from request
        action: 'VIEW',
        careRecipientId,
      },
      context
    );
  }

  /**
   * Track resource modification (creates activity log with changes)
   */
  async trackResourceModification(
    resourceType: string,
    resourceId: string,
    resourceDisplayName: string | undefined,
    changes: Record<string, any>,
    careRecipientId: string | undefined,
    context: UserContext,
    visibleToFamily = false
  ): Promise<void> {
    await this.logActivity(
      {
        organizationId: context.organizationId,
        action: 'UPDATED',
        actionCategory: this.getCategoryForResourceType(resourceType),
        resourceType,
        resourceId,
        resourceDisplayName,
        careRecipientId,
        changes,
        visibleToFamily,
        visibilityLevel: visibleToFamily ? 'FAMILY' : 'STAFF',
      },
      context
    );

    // Log to access logs
    await this.logAccess(
      {
        organizationId: context.organizationId,
        userId: context.userId,
        userType: 'STAFF',
        resourceType,
        resourceId,
        resourceDisplayName,
        accessMethod: 'WEB',
        action: 'MODIFY',
        careRecipientId,
      },
      context
    );
  }

  /**
   * Get category for resource type
   */
  private getCategoryForResourceType(resourceType: string): any {
    const mapping: Record<string, string> = {
      CARE_PLAN: 'CARE',
      VISIT: 'VISIT',
      TASK: 'TASK',
      MESSAGE: 'MESSAGE',
      DOCUMENT: 'DOCUMENT',
      FAMILY: 'FAMILY',
      SCHEDULE: 'SCHEDULE',
      MEDICATION: 'MEDICATION',
      INCIDENT_REPORT: 'INCIDENT',
    };

    return mapping[resourceType] || 'SYSTEM';
  }
}
