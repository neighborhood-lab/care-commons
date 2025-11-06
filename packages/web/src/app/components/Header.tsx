import React from 'react';
import { Menu, Bell, User, Plus, UserPlus, Users, ClipboardList, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/hooks';
import { usePermissions } from '@/core/hooks/permissions';
import { Button, Dropdown, DropdownItem } from '@/core/components';

export interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const quickActions: DropdownItem[] = [
    {
      label: 'Create Client',
      icon: <UserPlus className="h-5 w-5" />,
      onClick: () => navigate('/clients/new'),
      hidden: !can('clients:create')
    },
    {
      label: 'Create Caregiver',
      icon: <Users className="h-5 w-5" />,
      onClick: () => navigate('/caregivers/new'),
      hidden: !can('caregivers:create')
    },
    {
      label: 'Create Care Plan',
      icon: <ClipboardList className="h-5 w-5" />,
      onClick: () => navigate('/care-plans/new'),
      hidden: !can('care_plans:create')
    },
    {
      label: 'Schedule Visit',
      icon: <Calendar className="h-5 w-5" />,
      onClick: () => navigate('/scheduling'),
      hidden: !can('visits:create')
    }
  ];

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
          <Dropdown
            trigger={
              <Button variant="primary" size="sm" className="gap-2">
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">Quick Actions</span>
              </Button>
            }
            items={quickActions}
          />
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.roles[0]}</p>
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
