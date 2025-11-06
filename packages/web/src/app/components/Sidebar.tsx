import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  Calendar,
  ClipboardList,
  CheckSquare,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  X,
  Plus,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/core/utils';
import { useAuth, usePermissions } from '@/core/hooks';
import { Button } from '@/core/components';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <Home className="h-5 w-5" /> },
  {
    label: 'Clients',
    path: '/clients',
    icon: <Users className="h-5 w-5" />,
    permission: 'clients:read',
  },
  {
    label: 'Caregivers',
    path: '/caregivers',
    icon: <Users className="h-5 w-5" />,
    permission: 'caregivers:read',
  },
  {
    label: 'Scheduling',
    path: '/scheduling',
    icon: <Calendar className="h-5 w-5" />,
    permission: 'visits:read',
  },
  {
    label: 'Care Plans',
    path: '/care-plans',
    icon: <ClipboardList className="h-5 w-5" />,
    permission: 'care_plans:read',
  },
  {
    label: 'Create Care Plan',
    path: '/care-plans/new',
    icon: <Plus className="h-5 w-5" />,
    permission: 'care_plans:create',
  },
  {
    label: 'Tasks',
    path: '/tasks',
    icon: <CheckSquare className="h-5 w-5" />,
    permission: 'tasks:read',
  },
  {
    label: 'Time Tracking',
    path: '/time-tracking',
    icon: <FileText className="h-5 w-5" />,
    permission: 'evv:read',
  },
  {
    label: 'Billing',
    path: '/billing',
    icon: <DollarSign className="h-5 w-5" />,
    permission: 'billing:read',
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    label: 'Admin',
    path: '/admin',
    icon: <Settings className="h-5 w-5" />,
    permission: 'admin:access',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const { can } = usePermissions();

  const filteredNavItems = navItems.filter(
    (item) => !item.permission || can(item.permission)
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200',
          'transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Close button (mobile only) */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 lg:hidden">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-3 space-y-1">
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )
              }
            >
              <Settings className="h-5 w-5" />
              Settings
            </NavLink>
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 w-full transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
