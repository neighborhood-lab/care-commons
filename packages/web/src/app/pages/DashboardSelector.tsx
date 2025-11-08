import React from 'react';
import { useAuth } from '@/core/hooks';
import { Dashboard } from './Dashboard';
import { FamilyDashboard } from './FamilyDashboard';

/**
 * Smart component that selects which dashboard to show based on user role
 */
export const DashboardSelector: React.FC = () => {
  const { user } = useAuth();

  // Check if user has FAMILY role
  const isFamilyUser = user?.roles?.includes('FAMILY');

  // Debug logging to verify user roles
  console.log('[DashboardSelector] User:', user?.email, 'Roles:', user?.roles, 'isFamilyUser:', isFamilyUser);

  if (isFamilyUser) {
    return <FamilyDashboard />;
  }

  return <Dashboard />;
};
