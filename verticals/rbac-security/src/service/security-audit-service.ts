import {
  UserContext,
  UUID,
  PaginationParams,
  PaginatedResult,
  getPermissionService,
} from '@care-commons/core';
import { RBACRepository } from '../repository/rbac-repository';
import type {
  SecurityAuditLog,
  SecurityAction,
  ResourceType,
  SecurityAuditSearchFilters,
} from '../types/role';

/**
 * Input for logging security events
 */
export interface LogSecurityEventInput {
  userId?: UUID;
  organizationId?: UUID;
  action: SecurityAction;
  resource: ResourceType;
  resourceId?: UUID;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Service for security audit logging
 */
export class SecurityAuditService {
  private repository: RBACRepository;
  private permissionService = getPermissionService();

  constructor(repository: RBACRepository) {
    this.repository = repository;
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(input: LogSecurityEventInput): Promise<SecurityAuditLog> {
    const log = await this.repository.createAuditLog({
      userId: input.userId,
      organizationId: input.organizationId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      success: input.success,
      failureReason: input.failureReason,
      metadata: input.metadata,
      timestamp: new Date().toISOString(),
    });

    return log;
  }

  /**
   * Log a login attempt
   */
  async logLogin(userId: UUID, organizationId: UUID, success: boolean, ipAddress?: string, userAgent?: string, failureReason?: string): Promise<void> {
    await this.logSecurityEvent({
      userId,
      organizationId,
      action: success ? 'LOGIN' : 'LOGIN_FAILED',
      resource: 'USERS',
      resourceId: userId,
      ipAddress,
      userAgent,
      success,
      failureReason,
    });
  }

  /**
   * Log a logout
   */
  async logLogout(userId: UUID, organizationId: UUID, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logSecurityEvent({
      userId,
      organizationId,
      action: 'LOGOUT',
      resource: 'USERS',
      resourceId: userId,
      ipAddress,
      userAgent,
      success: true,
    });
  }

  /**
   * Log an access denied event
   */
  async logAccessDenied(
    userId: UUID,
    organizationId: UUID,
    resource: ResourceType,
    resourceId: UUID,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      organizationId,
      action: 'ACCESS_DENIED',
      resource,
      resourceId,
      ipAddress,
      userAgent,
      success: false,
      failureReason: reason,
    });
  }

  /**
   * Log a data export event
   */
  async logDataExport(
    userId: UUID,
    organizationId: UUID,
    resource: ResourceType,
    metadata: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      organizationId,
      action: 'DATA_EXPORT',
      resource,
      ipAddress,
      userAgent,
      success: true,
      metadata,
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    userId: UUID | undefined,
    organizationId: UUID | undefined,
    resource: ResourceType,
    reason: string,
    metadata: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      organizationId,
      action: 'SUSPICIOUS_ACTIVITY',
      resource,
      ipAddress,
      userAgent,
      success: false,
      failureReason: reason,
      metadata,
    });
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(
    filters: SecurityAuditSearchFilters,
    pagination: PaginationParams,
    context: UserContext
  ): Promise<PaginatedResult<SecurityAuditLog>> {
    this.permissionService.requirePermission(context, 'audit_logs:read');

    // Filter by organization if not system admin
    if (!this.permissionService.hasPermission(context, 'system:admin')) {
      filters.organizationId = context.organizationId;
    }

    return this.repository.searchAuditLogs(filters, pagination);
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(
    userId: UUID,
    pagination: PaginationParams,
    context: UserContext
  ): Promise<PaginatedResult<SecurityAuditLog>> {
    this.permissionService.requirePermission(context, 'audit_logs:read');

    return this.repository.searchAuditLogs(
      { userId, organizationId: context.organizationId },
      pagination
    );
  }

  /**
   * Get recent failed login attempts
   */
  async getRecentFailedLogins(
    hours: number,
    pagination: PaginationParams,
    context: UserContext
  ): Promise<PaginatedResult<SecurityAuditLog>> {
    this.permissionService.requirePermission(context, 'audit_logs:read');

    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    return this.repository.searchAuditLogs(
      {
        action: ['LOGIN_FAILED'],
        success: false,
        startDate,
        organizationId: context.organizationId,
      },
      pagination
    );
  }

  /**
   * Get suspicious activity logs
   */
  async getSuspiciousActivity(
    pagination: PaginationParams,
    context: UserContext
  ): Promise<PaginatedResult<SecurityAuditLog>> {
    this.permissionService.requirePermission(context, 'audit_logs:read');

    return this.repository.searchAuditLogs(
      {
        action: ['SUSPICIOUS_ACTIVITY'],
        organizationId: context.organizationId,
      },
      pagination
    );
  }
}
