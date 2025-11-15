/**
 * ProtectedRoute - Route wrapper with authentication and permission checking
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, usePermissions } from '../hooks';
import { getDashboardRoute } from '../utils/role-routing';
import type { Role } from '../types/auth';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Required permission to access this route
   */
  permission?: string;
  /**
   * Required permissions (all must be satisfied)
   */
  permissions?: string[];
  /**
   * Required role to access this route
   */
  requiredRole?: Role;
  /**
   * Required roles (at least one must be satisfied)
   */
  requiredRoles?: Role[];
  /**
   * Redirect path if permission check fails
   */
  fallbackPath?: string;
}

/**
 * ProtectedRoute component
 * Handles authentication and permission-based access control
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  permissions,
  requiredRole,
  requiredRoles,
  fallbackPath,
}) => {
  const { isAuthenticated, user } = useAuth();
  const { can, canAll, hasRole, hasAnyRole } = usePermissions();
  const location = useLocation();

  // Check authentication
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check single permission
  if (permission && !can(permission)) {
    const redirect = fallbackPath || getDashboardRoute(user.roles);
    return <Navigate to={redirect} replace />;
  }

  // Check multiple permissions (all required)
  if (permissions && !canAll(permissions)) {
    const redirect = fallbackPath || getDashboardRoute(user.roles);
    return <Navigate to={redirect} replace />;
  }

  // Check single required role
  if (requiredRole && !hasRole(requiredRole)) {
    const redirect = fallbackPath || getDashboardRoute(user.roles);
    return <Navigate to={redirect} replace />;
  }

  // Check multiple required roles (at least one)
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    const redirect = fallbackPath || getDashboardRoute(user.roles);
    return <Navigate to={redirect} replace />;
  }

  // All checks passed
  return <>{children}</>;
};

/**
 * FamilyProtectedRoute - Route wrapper for family portal
 */
export const FamilyProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect non-family users to their appropriate dashboard
  if (!user.roles.includes('FAMILY') && !user.roles.includes('CLIENT')) {
    return <Navigate to={getDashboardRoute(user.roles)} replace />;
  }

  return <>{children}</>;
};

/**
 * PublicRoute - Route wrapper for public pages (redirects if authenticated)
 */
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardRoute(user.roles)} replace />;
  }

  return <>{children}</>;
};
