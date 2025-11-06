/**
 * Frontend types for RBAC & Security vertical
 */

export type RoleType =
  | 'SYSTEM_ADMIN'
  | 'ORGANIZATION_ADMIN'
  | 'MANAGER'
  | 'SUPERVISOR'
  | 'COORDINATOR'
  | 'CAREGIVER'
  | 'BILLING_STAFF'
  | 'SCHEDULER'
  | 'VIEWER'
  | 'CUSTOM';

export type PermissionScope =
  | 'GLOBAL'
  | 'ORGANIZATION'
  | 'DEPARTMENT'
  | 'TEAM'
  | 'INDIVIDUAL';

export type PermissionAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'EXECUTE'
  | 'MANAGE';

export type ResourceType =
  | 'CLIENTS'
  | 'CAREGIVERS'
  | 'CARE_PLANS'
  | 'TASKS'
  | 'VISITS'
  | 'SCHEDULES'
  | 'SHIFTS'
  | 'TIME_TRACKING'
  | 'BILLING'
  | 'INVOICES'
  | 'PAYROLL'
  | 'REPORTS'
  | 'ANALYTICS'
  | 'USERS'
  | 'ROLES'
  | 'PERMISSIONS'
  | 'ORGANIZATIONS'
  | 'SETTINGS'
  | 'AUDIT_LOGS';

export type SecurityAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | 'ROLE_ASSIGNED'
  | 'ROLE_REVOKED'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_REVOKED'
  | 'ACCESS_DENIED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'DATA_EXPORT'
  | 'SETTINGS_CHANGED';

export interface PermissionCondition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'NOT_IN' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN';
  value: string | string[] | number | boolean;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  resource: ResourceType;
  action: PermissionAction;
  scope: PermissionScope;
  conditions?: PermissionCondition[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  type: RoleType;
  description?: string;
  organizationId?: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  organizationId?: string;
  departmentId?: string;
  teamId?: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityAuditLog {
  id: string;
  userId?: string;
  organizationId?: string;
  action: SecurityAction;
  resource: ResourceType;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionCheckResult {
  granted: boolean;
  reason?: string;
  permissions: Permission[];
}

// Input types

export interface CreateRoleInput {
  name: string;
  type: RoleType;
  description?: string;
  organizationId?: string;
  permissions: string[];
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreatePermissionInput {
  code: string;
  name: string;
  description?: string;
  resource: ResourceType;
  action: PermissionAction;
  scope: PermissionScope;
  conditions?: PermissionCondition[];
}

export interface AssignRoleInput {
  roleId: string;
  organizationId?: string;
  departmentId?: string;
  teamId?: string;
  expiresAt?: string;
}

export interface CheckPermissionInput {
  userId: string;
  permissionCode: string;
  resourceId?: string;
  context?: Record<string, unknown>;
}

// Search filters

export interface RoleSearchFilters {
  query?: string;
  type?: RoleType[];
  organizationId?: string;
  isActive?: boolean;
  isSystem?: boolean;
}

export interface PermissionSearchFilters {
  query?: string;
  resource?: ResourceType[];
  action?: PermissionAction[];
  scope?: PermissionScope[];
  isSystem?: boolean;
}

export interface SecurityAuditSearchFilters {
  userId?: string;
  organizationId?: string;
  action?: SecurityAction[];
  resource?: ResourceType[];
  success?: boolean;
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
}
