/**
 * Legacy FamilyDashboard - redirects to family portal
 * This file exists for backward compatibility with DashboardSelector
 * Family users should use /family-portal route instead
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const FamilyDashboard: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to family portal
    navigate('/family-portal', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to family portal...</p>
      </div>
    </div>
  );
};
