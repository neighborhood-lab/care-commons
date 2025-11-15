import React from 'react';
import { Menu, Bell, User, Shield } from 'lucide-react';
import { useAuth } from '@/core/hooks';
import { Button } from '@/core/components';
import { getPrimaryRole, getRoleLabel } from '@/core/utils/role-routing';

export interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();

  const primaryRole = user ? getPrimaryRole(user.roles) : null;
  const roleLabel = primaryRole ? getRoleLabel(primaryRole) : 'User';

  // Determine role badge color
  const getRoleBadgeColor = (role: string | null) => {
    if (!role) return 'bg-gray-100 text-gray-600';
    
    const adminRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN', 'ADMIN'];
    const clinicalRoles = ['NURSE', 'CLINICAL', 'NURSE_RN', 'NURSE_LPN'];
    const coordinatorRoles = ['COORDINATOR', 'SCHEDULER'];
    
    if (adminRoles.includes(role)) return 'bg-purple-100 text-purple-700';
    if (clinicalRoles.includes(role)) return 'bg-teal-100 text-teal-700';
    if (coordinatorRoles.includes(role)) return 'bg-blue-100 text-blue-700';
    if (role === 'CAREGIVER') return 'bg-green-100 text-green-700';
    if (role === 'FAMILY' || role === 'CLIENT') return 'bg-pink-100 text-pink-700';
    
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold text-primary-600">Care Commons</h1>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <div className="flex items-center gap-1 justify-end">
                <Shield className="h-3 w-3 text-gray-400" />
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRoleBadgeColor(
                    primaryRole
                  )}`}
                >
                  {roleLabel}
                </span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
              <User className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
