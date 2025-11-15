/**
 * Tests for role-routing utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getDashboardRoute,
  shouldRedirect,
  getRoleLabel,
  getPrimaryRole,
  ROLE_DASHBOARDS,
} from '../role-routing';
import type { Role } from '../../types/auth';

describe('role-routing utilities', () => {
  describe('getDashboardRoute', () => {
    it('should return family portal for FAMILY role', () => {
      const result = getDashboardRoute(['FAMILY']);
      expect(result).toBe('/family-portal');
    });

    it('should return family portal for CLIENT role', () => {
      const result = getDashboardRoute(['CLIENT']);
      expect(result).toBe('/family-portal');
    });

    it('should prioritize FAMILY over other roles', () => {
      const result = getDashboardRoute(['SUPER_ADMIN', 'FAMILY']);
      expect(result).toBe('/family-portal');
    });

    it('should return admin dashboard for SUPER_ADMIN', () => {
      const result = getDashboardRoute(['SUPER_ADMIN']);
      expect(result).toBe('/admin');
    });

    it('should return admin dashboard for ORG_ADMIN', () => {
      const result = getDashboardRoute(['ORG_ADMIN']);
      expect(result).toBe('/admin');
    });

    it('should return admin dashboard for BRANCH_ADMIN', () => {
      const result = getDashboardRoute(['BRANCH_ADMIN']);
      expect(result).toBe('/admin');
    });

    it('should return admin dashboard for ADMIN', () => {
      const result = getDashboardRoute(['ADMIN']);
      expect(result).toBe('/admin');
    });

    it('should return coordinator dashboard for COORDINATOR', () => {
      const result = getDashboardRoute(['COORDINATOR']);
      expect(result).toBe('/analytics/coordinator');
    });

    it('should return scheduling for SCHEDULER', () => {
      const result = getDashboardRoute(['SCHEDULER']);
      expect(result).toBe('/scheduling');
    });

    it('should return tasks for CAREGIVER', () => {
      const result = getDashboardRoute(['CAREGIVER']);
      expect(result).toBe('/tasks');
    });

    it('should return clients dashboard for NURSE', () => {
      const result = getDashboardRoute(['NURSE']);
      expect(result).toBe('/clients');
    });

    it('should return clients dashboard for NURSE_RN', () => {
      const result = getDashboardRoute(['NURSE_RN']);
      expect(result).toBe('/clients');
    });

    it('should return clients dashboard for NURSE_LPN', () => {
      const result = getDashboardRoute(['NURSE_LPN']);
      expect(result).toBe('/clients');
    });

    it('should return billing dashboard for BILLING', () => {
      const result = getDashboardRoute(['BILLING']);
      expect(result).toBe('/billing');
    });

    it('should return caregivers for HR', () => {
      const result = getDashboardRoute(['HR']);
      expect(result).toBe('/caregivers');
    });

    it('should return QA dashboard for AUDITOR', () => {
      const result = getDashboardRoute(['AUDITOR']);
      expect(result).toBe('/quality-assurance');
    });

    it('should return reports for READ_ONLY', () => {
      const result = getDashboardRoute(['READ_ONLY']);
      expect(result).toBe('/analytics/reports');
    });

    it('should prioritize admin over coordinator', () => {
      const result = getDashboardRoute(['COORDINATOR', 'SUPER_ADMIN']);
      expect(result).toBe('/admin');
    });

    it('should prioritize nurse over caregiver', () => {
      const result = getDashboardRoute(['CAREGIVER', 'NURSE']);
      expect(result).toBe('/clients');
    });

    it('should return root path for empty roles array', () => {
      const result = getDashboardRoute([]);
      expect(result).toBe('/');
    });

    it('should return root path for unknown roles', () => {
      const result = getDashboardRoute(['UNKNOWN' as Role]);
      expect(result).toBe('/');
    });
  });

  describe('shouldRedirect', () => {
    it('should not redirect from login page', () => {
      const result = shouldRedirect(['FAMILY'], '/login');
      expect(result).toBe(false);
    });

    it('should redirect family users away from non-family-portal routes', () => {
      const result = shouldRedirect(['FAMILY'], '/admin');
      expect(result).toBe(true);
    });

    it('should not redirect family users on family-portal routes', () => {
      const result = shouldRedirect(['FAMILY'], '/family-portal');
      expect(result).toBe(false);
    });

    it('should redirect client users away from non-family-portal routes', () => {
      const result = shouldRedirect(['CLIENT'], '/clients');
      expect(result).toBe(true);
    });

    it('should not redirect client users on family-portal routes', () => {
      const result = shouldRedirect(['CLIENT'], '/family-portal/messages');
      expect(result).toBe(false);
    });

    it('should redirect non-family users away from family-portal', () => {
      const result = shouldRedirect(['SUPER_ADMIN'], '/family-portal');
      expect(result).toBe(true);
    });

    it('should not redirect non-family users on regular routes', () => {
      const result = shouldRedirect(['SUPER_ADMIN'], '/admin');
      expect(result).toBe(false);
    });

    it('should not redirect caregivers on regular routes', () => {
      const result = shouldRedirect(['CAREGIVER'], '/tasks');
      expect(result).toBe(false);
    });
  });

  describe('getRoleLabel', () => {
    it('should return correct label for SUPER_ADMIN', () => {
      expect(getRoleLabel('SUPER_ADMIN')).toBe('Super Administrator');
    });

    it('should return correct label for ORG_ADMIN', () => {
      expect(getRoleLabel('ORG_ADMIN')).toBe('Organization Administrator');
    });

    it('should return correct label for BRANCH_ADMIN', () => {
      expect(getRoleLabel('BRANCH_ADMIN')).toBe('Branch Administrator');
    });

    it('should return correct label for COORDINATOR', () => {
      expect(getRoleLabel('COORDINATOR')).toBe('Care Coordinator');
    });

    it('should return correct label for CAREGIVER', () => {
      expect(getRoleLabel('CAREGIVER')).toBe('Caregiver');
    });

    it('should return correct label for FAMILY', () => {
      expect(getRoleLabel('FAMILY')).toBe('Family Member');
    });

    it('should return correct label for NURSE_RN', () => {
      expect(getRoleLabel('NURSE_RN')).toBe('Registered Nurse');
    });

    it('should return correct label for NURSE_LPN', () => {
      expect(getRoleLabel('NURSE_LPN')).toBe('Licensed Practical Nurse');
    });

    it('should return correct label for BILLING', () => {
      expect(getRoleLabel('BILLING')).toBe('Billing Specialist');
    });

    it('should return correct label for AUDITOR', () => {
      expect(getRoleLabel('AUDITOR')).toBe('Auditor');
    });
  });

  describe('getPrimaryRole', () => {
    it('should return SUPER_ADMIN as highest priority', () => {
      const result = getPrimaryRole(['CAREGIVER', 'SUPER_ADMIN', 'COORDINATOR']);
      expect(result).toBe('SUPER_ADMIN');
    });

    it('should return ORG_ADMIN when no SUPER_ADMIN', () => {
      const result = getPrimaryRole(['CAREGIVER', 'ORG_ADMIN', 'COORDINATOR']);
      expect(result).toBe('ORG_ADMIN');
    });

    it('should return NURSE_RN over CAREGIVER', () => {
      const result = getPrimaryRole(['CAREGIVER', 'NURSE_RN']);
      expect(result).toBe('NURSE_RN');
    });

    it('should return COORDINATOR over CAREGIVER', () => {
      const result = getPrimaryRole(['CAREGIVER', 'COORDINATOR']);
      expect(result).toBe('COORDINATOR');
    });

    it('should return CAREGIVER over FAMILY', () => {
      const result = getPrimaryRole(['FAMILY', 'CAREGIVER']);
      expect(result).toBe('CAREGIVER');
    });

    it('should return first role if no priority matches', () => {
      const result = getPrimaryRole(['FAMILY']);
      expect(result).toBe('FAMILY');
    });

    it('should return null for empty roles array', () => {
      const result = getPrimaryRole([]);
      expect(result).toBe(null);
    });
  });

  describe('ROLE_DASHBOARDS', () => {
    it('should have a dashboard route for all roles', () => {
      const allRoles: Role[] = [
        'SUPER_ADMIN',
        'ORG_ADMIN',
        'BRANCH_ADMIN',
        'ADMIN',
        'COORDINATOR',
        'SCHEDULER',
        'CAREGIVER',
        'FAMILY',
        'CLIENT',
        'BILLING',
        'HR',
        'AUDITOR',
        'READ_ONLY',
        'NURSE',
        'CLINICAL',
        'NURSE_RN',
        'NURSE_LPN',
      ];

      allRoles.forEach((role) => {
        expect(ROLE_DASHBOARDS[role]).toBeDefined();
        expect(typeof ROLE_DASHBOARDS[role]).toBe('string');
        expect(ROLE_DASHBOARDS[role].startsWith('/')).toBe(true);
      });
    });
  });
});
