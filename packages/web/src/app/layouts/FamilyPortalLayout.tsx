import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Activity, MessageSquare, Bell, Menu, X, LogOut, User } from 'lucide-react';
import { Button } from '@/core/components';

interface FamilyPortalLayoutProps {
  clientName?: string;
  clientPhotoUrl?: string;
  unreadNotifications?: number;
}

export const FamilyPortalLayout: React.FC<FamilyPortalLayoutProps> = ({
  clientName = 'Your Loved One',
  clientPhotoUrl,
  unreadNotifications = 0,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Home', href: '/family-portal', icon: Home, exact: true },
    { name: 'Activity', href: '/family-portal/activity', icon: Activity },
    { name: 'Messages', href: '/family-portal/messages', icon: MessageSquare },
    { name: 'Notifications', href: '/family-portal/notifications', icon: Bell, badge: unreadNotifications },
  ];

  const isActive = (item: typeof navigation[0]) => {
    if (item.exact) {
      return location.pathname === item.href;
    }
    return location.pathname.startsWith(item.href);
  };

  const handleLogout = () => {
    // TODO: Implement logout logic
    navigate('/family-portal/login');
  };

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Client Info */}
            <div className="flex items-center space-x-4">
              {clientPhotoUrl ? (
                <img
                  src={clientPhotoUrl}
                  alt={clientName}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-200"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center ring-2 ring-blue-300">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{clientName}</h1>
                <p className="text-sm text-gray-600">Family Portal</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      relative px-4 py-3 rounded-lg text-sm font-medium transition-colors
                      ${active
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Logout Button (Desktop) */}
            <div className="hidden md:block">
              <Button
                variant="ghost"
                size="md"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      relative flex items-center space-x-3 px-4 py-4 rounded-lg text-base font-medium transition-colors
                      ${active
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      }
                    `}
                  >
                    <Icon className="h-6 w-6" />
                    <span>{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto h-7 w-7 rounded-full bg-red-500 text-white text-sm font-bold flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-4 rounded-lg text-base font-medium text-gray-600 hover:bg-gray-100"
              >
                <LogOut className="h-6 w-6" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Care Commons Family Portal</p>
            <p className="mt-1">
              <Link to="/family-portal/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              {' · '}
              <Link to="/family-portal/help" className="text-blue-600 hover:underline">
                Help & Support
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
