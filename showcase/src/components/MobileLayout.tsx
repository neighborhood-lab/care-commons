import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Calendar,
  CheckSquare,
  User,
  ArrowLeft,
  Menu,
  Users,
  FileText,
} from 'lucide-react';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  showBack = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const navigationItems = [
    { path: '/mobile', icon: Home, label: 'Home' },
    { path: '/mobile/visits', icon: Calendar, label: 'Visits' },
    { path: '/mobile/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/mobile/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (path: string) => {
    if (path === '/mobile') {
      return location.pathname === '/mobile';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Phone Frame */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-900" style={{ height: '844px' }}>
        {/* Status Bar */}
        <div className="bg-gray-900 text-white px-6 py-2 flex justify-between items-center text-xs">
          <span>9:41</span>
          <div className="flex gap-1">
            <div className="w-4 h-3 border border-white rounded-sm"></div>
            <div className="w-4 h-3 border border-white rounded-sm"></div>
            <div className="w-4 h-3 border border-white rounded-sm bg-white"></div>
          </div>
        </div>

        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
          ) : (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900">
            {title || 'Care Commons'}
          </h1>
          <div className="w-9"></div>
        </div>

        {/* Menu Overlay */}
        {menuOpen && (
          <div
            className="absolute inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMenuOpen(false)}
          >
            <div
              className="bg-white w-64 h-full shadow-xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                <p className="text-sm text-gray-600">Caregiver App</p>
              </div>
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
                <div className="border-t border-gray-200 my-4"></div>
                <Link
                  to="/mobile/clients"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive('/mobile/clients')
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span className="font-medium">My Clients</span>
                </Link>
                <Link
                  to="/mobile/care-plans"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive('/mobile/care-plans')
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">Care Plans</span>
                </Link>
                <div className="border-t border-gray-200 my-4"></div>
                <Link
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="font-medium">Back to Showcase</span>
                </Link>
              </nav>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="overflow-y-auto bg-gray-50" style={{ height: 'calc(844px - 100px)' }}>
          {children}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2">
          <div className="flex justify-around items-center">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                    active
                      ? 'text-purple-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${active ? 'text-purple-600' : ''}`} />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
