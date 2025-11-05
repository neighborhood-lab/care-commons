import React, { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  ClipboardList,
  CheckSquare,
  UserCheck,
  Calendar,
  FileText,
  Info,
  ExternalLink,
  LayoutDashboard,
} from 'lucide-react';
import { RoleSwitcher } from './RoleSwitcher';

interface ShowcaseLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const navigation = [
  { name: 'Overview', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Care Plans', href: '/care-plans', icon: ClipboardList },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Caregivers', href: '/caregivers', icon: UserCheck },
  { name: 'Shift Matching', href: '/shifts', icon: Calendar },
  { name: 'Billing', href: '/billing', icon: FileText },
];

export const ShowcaseLayout: React.FC<ShowcaseLayoutProps> = ({
  children,
  title,
  description
}) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              <p className="text-sm font-medium">
                Interactive Showcase - All data is stored in your browser
              </p>
            </div>
            <a
              href="https://care-commons.vercel.app/login"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition-colors"
            >
              Full Demo
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Care Commons
              </h1>
              <p className="text-sm text-gray-500">Showcase Edition</p>
            </div>
            <RoleSwitcher />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors whitespace-nowrap
                    ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Page Header */}
      {title && (
        <div className="bg-white border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p className="mb-2">
              This is a <strong>showcase demo</strong> running entirely in your browser with mock data.
            </p>
            <p>
              For the full experience with real backend integration, visit the{' '}
              <a
                href="https://care-commons.vercel.app/login"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                end-to-end demo
              </a>
              .
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
