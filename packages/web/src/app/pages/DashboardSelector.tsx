import React from 'react';
import { useAuth } from '@/core/hooks';
import { Dashboard } from './Dashboard';
import { FamilyDashboard } from './FamilyDashboard';
import { AdministratorDashboard } from './AdministratorDashboard';
import { CoordinatorDashboard } from './CoordinatorDashboard';
import { CaregiverDashboard } from './CaregiverDashboard';
import { NurseDashboard } from './NurseDashboard';

/**
 * Smart component that selects which dashboard to show based on user role
 */
export const DashboardSelector: React.FC = () => {
  const { user } = useAuth();

  // Get user roles
  const roles = user?.roles || [];

  // Priority-based role detection
  // 1. Family portal (highest priority for family members)
  if (roles.includes('FAMILY')) {
    return <FamilyDashboard />;
  }

  // 2. Administrative roles
  if (
    roles.includes('SUPER_ADMIN') ||
    roles.includes('ORG_ADMIN') ||
    roles.includes('BRANCH_ADMIN')
  ) {
    return <AdministratorDashboard />;
  }

  // 3. Nurse/Clinical roles
  if (
    roles.includes('NURSE') ||
    roles.includes('CLINICAL') ||
    roles.includes('NURSE_RN') ||
    roles.includes('NURSE_LPN')
  ) {
    return <NurseDashboard />;
  }

  // 4. Coordinator role
  if (roles.includes('COORDINATOR')) {
    return <CoordinatorDashboard />;
  }

  // 5. Caregiver role
  if (roles.includes('CAREGIVER')) {
    return <CaregiverDashboard />;
  }

  // 6. Default dashboard for other roles
  return <Dashboard />;
};
