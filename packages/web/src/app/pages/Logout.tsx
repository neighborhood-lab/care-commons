import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/core/hooks';

/**
 * Logout Page
 * Clears authentication state and redirects to login
 */
export const Logout: React.FC = () => {
  const { logout } = useAuth();

  // Clear auth state on mount
  React.useEffect(() => {
    logout();
  }, [logout]);

  // Redirect to login
  return <Navigate to="/login" replace />;
};
