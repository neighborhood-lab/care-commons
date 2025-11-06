import type { ApiClient } from '@/core/services';
import type { PaginatedResult, SearchParams } from '@/core/types';
import type {
  Role,
  Permission,
  UserRole,
  SecurityAuditLog,
  PermissionCheckResult,
  CreateRoleInput,
  UpdateRoleInput,
  CreatePermissionInput,
  AssignRoleInput,
  CheckPermissionInput,
  RoleSearchFilters,
  PermissionSearchFilters,
  SecurityAuditSearchFilters,
} from '../types';

/**
 * RBAC API Service interface
 */
export interface RBACApiService {
  // Role operations
  getRoles(filters?: RoleSearchFilters & SearchParams): Promise<PaginatedResult<Role>>;
  getRoleById(id: string): Promise<Role>;
  createRole(input: CreateRoleInput): Promise<Role>;
  updateRole(id: string, input: UpdateRoleInput): Promise<Role>;
  deleteRole(id: string): Promise<void>;

  // Permission operations
  getPermissions(filters?: PermissionSearchFilters & SearchParams): Promise<PaginatedResult<Permission>>;
  getPermissionById(id: string): Promise<Permission>;
  createPermission(input: CreatePermissionInput): Promise<Permission>;

  // User role operations
  getUserRoles(userId: string): Promise<UserRole[]>;
  assignRole(userId: string, input: AssignRoleInput): Promise<UserRole>;
  revokeRole(userId: string, roleId: string): Promise<void>;

  // Permission checking
  checkPermission(input: CheckPermissionInput): Promise<PermissionCheckResult>;

  // Audit logs
  getAuditLogs(filters?: SecurityAuditSearchFilters & SearchParams): Promise<PaginatedResult<SecurityAuditLog>>;
  getUserAuditLogs(userId: string, params?: SearchParams): Promise<PaginatedResult<SecurityAuditLog>>;
  getFailedLogins(hours?: number, params?: SearchParams): Promise<PaginatedResult<SecurityAuditLog>>;
  getSuspiciousActivity(params?: SearchParams): Promise<PaginatedResult<SecurityAuditLog>>;
}

/**
 * Create RBAC API service
 */
export const createRBACApiService = (apiClient: ApiClient): RBACApiService => {
  return {
    // ========================================================================
    // ROLE OPERATIONS
    // ========================================================================

    async getRoles(filters?: RoleSearchFilters & SearchParams): Promise<PaginatedResult<Role>> {
      const params = new URLSearchParams();

      if (filters?.query) params.append('query', filters.query);
      if (filters?.type) {
        for (const t of filters.type) params.append('type', t);
      }
      if (filters?.organizationId) params.append('organizationId', filters.organizationId);
      if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
      if (filters?.isSystem !== undefined) params.append('isSystem', String(filters.isSystem));
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      return apiClient.get<PaginatedResult<Role>>(
        `/api/roles${params.toString() ? `?${params.toString()}` : ''}`
      );
    },

    async getRoleById(id: string): Promise<Role> {
      return apiClient.get<Role>(`/api/roles/${id}`);
    },

    async createRole(input: CreateRoleInput): Promise<Role> {
      return apiClient.post<Role>('/api/roles', input);
    },

    async updateRole(id: string, input: UpdateRoleInput): Promise<Role> {
      return apiClient.patch<Role>(`/api/roles/${id}`, input);
    },

    async deleteRole(id: string): Promise<void> {
      await apiClient.delete(`/api/roles/${id}`);
    },

    // ========================================================================
    // PERMISSION OPERATIONS
    // ========================================================================

    async getPermissions(filters?: PermissionSearchFilters & SearchParams): Promise<PaginatedResult<Permission>> {
      const params = new URLSearchParams();

      if (filters?.query) params.append('query', filters.query);
      if (filters?.resource) {
        for (const r of filters.resource) params.append('resource', r);
      }
      if (filters?.action) {
        for (const a of filters.action) params.append('action', a);
      }
      if (filters?.scope) {
        for (const s of filters.scope) params.append('scope', s);
      }
      if (filters?.isSystem !== undefined) params.append('isSystem', String(filters.isSystem));
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      return apiClient.get<PaginatedResult<Permission>>(
        `/api/permissions${params.toString() ? `?${params.toString()}` : ''}`
      );
    },

    async getPermissionById(id: string): Promise<Permission> {
      return apiClient.get<Permission>(`/api/permissions/${id}`);
    },

    async createPermission(input: CreatePermissionInput): Promise<Permission> {
      return apiClient.post<Permission>('/api/permissions', input);
    },

    // ========================================================================
    // USER ROLE OPERATIONS
    // ========================================================================

    async getUserRoles(userId: string): Promise<UserRole[]> {
      const response = await apiClient.get<{ data: UserRole[] }>(`/api/users/${userId}/roles`);
      return response.data;
    },

    async assignRole(userId: string, input: AssignRoleInput): Promise<UserRole> {
      return apiClient.post<UserRole>(`/api/users/${userId}/roles`, input);
    },

    async revokeRole(userId: string, roleId: string): Promise<void> {
      await apiClient.delete(`/api/users/${userId}/roles/${roleId}`);
    },

    // ========================================================================
    // PERMISSION CHECKING
    // ========================================================================

    async checkPermission(input: CheckPermissionInput): Promise<PermissionCheckResult> {
      const response = await apiClient.post<{ data: PermissionCheckResult }>('/api/permissions/check', input);
      return response.data;
    },

    // ========================================================================
    // AUDIT LOGS
    // ========================================================================

    async getAuditLogs(filters?: SecurityAuditSearchFilters & SearchParams): Promise<PaginatedResult<SecurityAuditLog>> {
      const params = new URLSearchParams();

      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.organizationId) params.append('organizationId', filters.organizationId);
      if (filters?.action) {
        for (const a of filters.action) params.append('action', a);
      }
      if (filters?.resource) {
        for (const r of filters.resource) params.append('resource', r);
      }
      if (filters?.success !== undefined) params.append('success', String(filters.success));
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.ipAddress) params.append('ipAddress', filters.ipAddress);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      return apiClient.get<PaginatedResult<SecurityAuditLog>>(
        `/api/audit-logs${params.toString() ? `?${params.toString()}` : ''}`
      );
    },

    async getUserAuditLogs(userId: string, params?: SearchParams): Promise<PaginatedResult<SecurityAuditLog>> {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize));
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      return apiClient.get<PaginatedResult<SecurityAuditLog>>(
        `/api/users/${userId}/audit-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );
    },

    async getFailedLogins(hours: number = 24, params?: SearchParams): Promise<PaginatedResult<SecurityAuditLog>> {
      const queryParams = new URLSearchParams();

      queryParams.append('hours', String(hours));
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize));
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      return apiClient.get<PaginatedResult<SecurityAuditLog>>(
        `/api/audit-logs/failed-logins?${queryParams.toString()}`
      );
    },

    async getSuspiciousActivity(params?: SearchParams): Promise<PaginatedResult<SecurityAuditLog>> {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize));
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      return apiClient.get<PaginatedResult<SecurityAuditLog>>(
        `/api/audit-logs/suspicious${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );
    },
  };
};
