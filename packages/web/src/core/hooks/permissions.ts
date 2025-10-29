import { useAuth } from './auth';

export interface UsePermissionsReturn {
  can: (permission: string) => boolean;
  canAny: (permissions: string[]) => boolean;
  canAll: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

export const usePermissions = (): UsePermissionsReturn => {
  const { user } = useAuth();

  const can = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const canAny = (permissions: string[]): boolean => {
    if (!user) return false;
    return permissions.some((permission) => user.permissions.includes(permission));
  };

  const canAll = (permissions: string[]): boolean => {
    if (!user) return false;
    return permissions.every((permission) => user.permissions.includes(permission));
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles.includes(role as any);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.some((role) => user.roles.includes(role as any));
  };

  return {
    can,
    canAny,
    canAll,
    hasRole,
    hasAnyRole,
  };
};
