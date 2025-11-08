/**
 * Family Portal Layout
 *
 * Simplified layout for family members with easy navigation
 */

import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useFamilyDashboard, useUnreadNotifications } from '../../verticals/family-engagement/hooks';

export const FamilyPortalLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get current family member ID from session/auth context
  // For now, using a placeholder - in production this would come from auth
  const familyMemberId = sessionStorage.getItem('familyMemberId') || null;

  const { data: dashboard } = useFamilyDashboard(familyMemberId);
  const { data: notifications } = useUnreadNotifications(familyMemberId);

  const unreadCount = notifications?.length || 0;
  const unreadMessages = dashboard?.unreadMessages || 0;

  const handleLogout = () => {
    sessionStorage.removeItem('familyMemberId');
    navigate('/family-portal/login');
  };

  const navigation = [
    { name: 'Home', href: '/family-portal', icon: '🏠' },
    { name: 'Activity', href: '/family-portal/activity', icon: '📋' },
    { name: 'Messages', href: '/family-portal/messages', icon: '💬', badge: unreadMessages },
    { name: 'Notifications', href: '/family-portal/notifications', icon: '🔔', badge: unreadCount },
  ];

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo/Title */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="mr-4 rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
              >
                <span className="text-2xl">☰</span>
              </button>
              <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                Family Portal
              </h1>
            </div>

            {/* Client Info */}
            {dashboard?.client && (
              <div className="flex items-center space-x-3">
                {dashboard.client.photoUrl && (
                  <img
                    src={dashboard.client.photoUrl}
                    alt={dashboard.client.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{dashboard.client.name}</p>
                  <p className="text-xs text-gray-500">Your loved one</p>
                </div>
              </div>
            )}

            {/* Notification Bell & Logout */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/family-portal/notifications"
                className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100"
              >
                <span className="text-2xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden border-t border-gray-200 lg:block">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`relative border-b-2 px-1 py-4 text-base font-medium ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-700 hover:border-gray-300 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                    {item.badge && item.badge > 0 ? (
                      <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </span>
                    {item.badge && item.badge > 0 ? (
                      <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Footer - Privacy Policy */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-gray-600">
            <Link to="/family-portal/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
            {' • '}
            Need help? Contact your care coordinator
          </p>
        </div>
      </footer>
    </div>
  );
};
