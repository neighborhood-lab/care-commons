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
  UserCog,
  Clock,
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

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/', icon: <Home className="h-5 w-5" /> },
    ],
  },
  {
    label: 'People',
    items: [
      {
        label: 'Clients',
        path: '/clients',
        icon: <Users className="h-5 w-5" />,
        permission: 'clients:read',
      },
      {
        label: 'Caregivers',
        path: '/caregivers',
        icon: <UserCog className="h-5 w-5" />,
        permission: 'caregivers:read',
      },
    ],
  },
  {
    label: 'Care Management',
    items: [
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
        label: 'Tasks',
        path: '/tasks',
        icon: <CheckSquare className="h-5 w-5" />,
        permission: 'tasks:read',
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'Time Tracking',
        path: '/time-tracking',
        icon: <Clock className="h-5 w-5" />,
        permission: 'evv:read',
      },
      {
        label: 'Billing',
        path: '/billing',
        icon: <DollarSign className="h-5 w-5" />,
        permission: 'billing:read',
      },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const { can } = usePermissions();

  const filterGroupItems = (group: NavGroup): NavGroup => {
    return {
      ...group,
      items: group.items.filter((item) => !item.permission || can(item.permission)),
    };
  };

  const visibleGroups = navGroups
    .map(filterGroupItems)
    .filter((group) => group.items.length > 0);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200',
          'transform transition-transform duration-300 ease-out lg:translate-x-0 shadow-xl lg:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Close button (mobile only) */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 lg:hidden">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close menu">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
            {visibleGroups.map((group, groupIndex) => (
              <div key={group.label} className={groupIndex > 0 ? 'mt-6' : ''}>
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                          'hover:translate-x-1',
                          isActive
                            ? 'bg-primary-50 text-primary-700 shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100'
                        )
                      }
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}

            {/* Quick Actions */}
            {can('care_plans:create') && (
              <div className="mt-6">
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Quick Actions
                </h3>
                <NavLink
                  to="/care-plans/new"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:translate-x-1 bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
                >
                  <Plus className="h-5 w-5" />
                  <span>New Care Plan</span>
                </NavLink>
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-3 space-y-1 bg-gray-50">
            {can('admin:access') && (
              <NavLink
                to="/admin"
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )
                }
              >
                <Settings className="h-5 w-5" />
                <span>Admin</span>
              </NavLink>
            )}
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )
              }
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </NavLink>
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 w-full transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
