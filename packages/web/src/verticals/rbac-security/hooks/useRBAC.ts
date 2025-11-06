import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useApiClient } from '@/core/hooks';
import { createRBACApiService } from '../services/rbac-api';
import type { SearchParams } from '@/core/types';
import type {
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
 * Hook to get RBAC API service
 */
export const useRBACApi = () => {
  const apiClient = useApiClient();
  return useMemo(() => createRBACApiService(apiClient), [apiClient]);
};

// ============================================================================
// ROLE HOOKS
// ============================================================================

/**
 * Hook to get roles
 */
export const useRoles = (filters?: RoleSearchFilters & SearchParams) => {
  const rbacApi = useRBACApi();

  return useQuery({
    queryKey: ['roles', filters],
    queryFn: () => rbacApi.getRoles(filters),
  });
};

/**
 * Hook to get a single role by ID
 */
export const useRole = (id: string) => {
  const rbacApi = useRBACApi();

  return useQuery({
    queryKey: ['roles', id],
    queryFn: () => rbacApi.getRoleById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a role
 */
export const useCreateRole = () => {
  const rbacApi = useRBACApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRoleInput) => rbacApi.createRole(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create role');
    },
  });
};

/**
 * Hook to update a role
 */
export const useUpdateRole = () => {
  const rbacApi = useRBACApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRoleInput }) =>
      rbacApi.updateRole(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', id] });
      toast.success('Role updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update role');
    },
  });
};

/**
 * Hook to delete a role
 */
export const useDeleteRole = () => {
  const rbacApi = useRBACApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rbacApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete role');
    },
  });
};

// ============================================================================
// PERMISSION HOOKS
// ============================================================================

/**
 * Hook to get permissions
 */
export const usePermissions = (filters?: PermissionSearchFilters & SearchParams) => {
  const rbacApi = useRBACApi();

  return useQuery({
    queryKey: ['permissions', filters],
    queryFn: () => rbacApi.getPermissions(filters),
  });
};

/**
 * Hook to get a single permission by ID
 */
export const usePermission = (id: string) => {
  const rbacApi = useRBACApi();

  return useQuery({
    queryKey: ['permissions', id],
    queryFn: () => rbacApi.getPermissionById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a permission
 */
export const useCreatePermission = () => {
  const rbacApi = useRBACApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePermissionInput) => rbacApi.createPermission(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('Permission created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create permission');
    },
  });
};

// ============================================================================
// USER ROLE HOOKS
// ============================================================================

/**
 * Hook to get user roles
 */
export const useUserRoles = (userId: string) => {
  const rbacApi = useRBACApi();

  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: () => rbacApi.getUserRoles(userId),
    enabled: !!userId,
  });
};

/**
 * Hook to assign a role to a user
 */
export const useAssignRole = () => {
  const rbacApi = useRBACApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: AssignRoleInput }) =>
      rbacApi.assignRole(userId, input),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-roles', userId] });
      toast.success('Role assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign role');
    },
  });
};

/**
 * Hook to revoke a role from a user
 */
export const useRevokeRole = () => {
  const rbacApi = useRBACApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      rbacApi.revokeRole(userId, roleId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-roles', userId] });
      toast.success('Role revoked successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to revoke role');
    },
  });
};

// ============================================================================
// PERMISSION CHECKING HOOKS
// ============================================================================

/**
 * Hook to check if a user has a permission
 */
export const useCheckPermission = (input: CheckPermissionInput) => {
  const rbacApi = useRBACApi();

  return useQuery({
    queryKey: ['permission-check', input],
    queryFn: () => rbacApi.checkPermission(input),
    enabled: !!input.userId && !!input.permissionCode,
  });
};

// ============================================================================
// AUDIT LOG HOOKS
// ============================================================================

/**
 * Hook to get audit logs
 */
export const useAuditLogs = (filters?: SecurityAuditSearchFilters & SearchParams) => {
  const rbacApi = useRBACApi();

  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => rbacApi.getAuditLogs(filters),
  });
};

/**
 * Hook to get user audit logs
 */
export const useUserAuditLogs = (userId: string, params?: SearchParams) => {
  const rbacApi = useRBACApi();

  return useQuery({
    queryKey: ['audit-logs', 'user', userId, params],
    queryFn: () => rbacApi.getUserAuditLogs(userId, params),
    enabled: !!userId,
  });
};

/**
 * Hook to get failed login attempts
 */
export const useFailedLogins = (hours: number = 24, params?: SearchParams) => {
  const rbacApi = useRBACApi();

  return useQuery({
    queryKey: ['audit-logs', 'failed-logins', hours, params],
    queryFn: () => rbacApi.getFailedLogins(hours, params),
  });
};

/**
 * Hook to get suspicious activity
 */
export const useSuspiciousActivity = (params?: SearchParams) => {
  const rbacApi = useRBACApi();

  return useQuery({
    queryKey: ['audit-logs', 'suspicious', params],
    queryFn: () => rbacApi.getSuspiciousActivity(params),
  });
};
