/**
 * Role-based routing utilities
 * Provides centralized role-to-dashboard mapping for consistent routing
 */

import type { Role } from '../types/auth';

/**
 * Dashboard routes for each role
 */
export const ROLE_DASHBOARDS: Record<Role, string> = {
  SUPER_ADMIN: '/admin',
  ORG_ADMIN: '/admin',
  BRANCH_ADMIN: '/admin',
  ADMIN: '/admin',
  COORDINATOR: '/analytics/coordinator',
  SCHEDULER: '/scheduling',
  CAREGIVER: '/tasks',
  FAMILY: '/family-portal',
  CLIENT: '/family-portal',
  BILLING: '/billing',
  HR: '/caregivers',
  AUDITOR: '/quality-assurance',
  READ_ONLY: '/analytics/reports',
  NURSE: '/clients',
  CLINICAL: '/clients',
  NURSE_RN: '/clients',
  NURSE_LPN: '/clients',
};

/**
 * Get the appropriate dashboard route for a user based on their roles
 * Uses priority-based role detection
 */
export function getDashboardRoute(roles: Role[]): string {
  // Priority order for role-based routing
  const rolePriority: Role[] = [
    'FAMILY',           // Family portal is highest priority
    'CLIENT',           // Client portal
    'SUPER_ADMIN',      // Then admin roles
    'ORG_ADMIN',
    'BRANCH_ADMIN',
    'ADMIN',
    'NURSE',            // Clinical roles
    'CLINICAL',
    'NURSE_RN',
    'NURSE_LPN',
    'COORDINATOR',      // Operational roles
    'SCHEDULER',
    'CAREGIVER',
    'BILLING',          // Specialized roles
    'HR',
    'AUDITOR',
    'READ_ONLY',
  ];

  // Find the highest priority role
  for (const role of rolePriority) {
    if (roles.includes(role)) {
      return ROLE_DASHBOARDS[role];
    }
  }

  // Default to home if no specific role found
  return '/';
}

/**
 * Check if a user should be redirected based on their role and current path
 */
export function shouldRedirect(roles: Role[], currentPath: string): boolean {
  // Don't redirect if on login page
  if (currentPath === '/login') {
    return false;
  }

  // Family users should only access family portal
  if (roles.includes('FAMILY') || roles.includes('CLIENT')) {
    return !currentPath.startsWith('/family-portal');
  }

  // Non-family users should not access family portal
  if (currentPath.startsWith('/family-portal')) {
    return !roles.includes('FAMILY') && !roles.includes('CLIENT');
  }

  return false;
}

/**
 * Get a user-friendly role label
 */
export function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    SUPER_ADMIN: 'Super Administrator',
    ORG_ADMIN: 'Organization Administrator',
    BRANCH_ADMIN: 'Branch Administrator',
    ADMIN: 'Administrator',
    COORDINATOR: 'Care Coordinator',
    SCHEDULER: 'Scheduler',
    CAREGIVER: 'Caregiver',
    FAMILY: 'Family Member',
    CLIENT: 'Client',
    BILLING: 'Billing Specialist',
    HR: 'Human Resources',
    AUDITOR: 'Auditor',
    READ_ONLY: 'Read-Only User',
    NURSE: 'Nurse',
    CLINICAL: 'Clinical Staff',
    NURSE_RN: 'Registered Nurse',
    NURSE_LPN: 'Licensed Practical Nurse',
  };

  return labels[role] || role;
}

/**
 * Get the primary role to display for a user
 * Returns the highest priority role
 */
export function getPrimaryRole(roles: Role[]): Role | null {
  const rolePriority: Role[] = [
    'SUPER_ADMIN',
    'ORG_ADMIN',
    'BRANCH_ADMIN',
    'ADMIN',
    'NURSE_RN',
    'NURSE_LPN',
    'NURSE',
    'CLINICAL',
    'COORDINATOR',
    'SCHEDULER',
    'HR',
    'BILLING',
    'AUDITOR',
    'CAREGIVER',
    'FAMILY',
    'CLIENT',
    'READ_ONLY',
  ];

  for (const role of rolePriority) {
    if (roles.includes(role)) {
      return role;
    }
  }

  return roles[0] || null;
}
