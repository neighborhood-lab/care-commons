import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/hooks';
import { getDashboardRoute } from '@/core/utils';

/**
 * Smart component that redirects to the appropriate dashboard based on user role
 * This component should only be rendered at the root path "/"
 */
export const DashboardSelector: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const dashboardRoute = getDashboardRoute(user.roles);
      // Only redirect if not already at root
      if (window.location.pathname === '/') {
        navigate(dashboardRoute, { replace: true });
      }
    }
  }, [user, navigate]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );
};
