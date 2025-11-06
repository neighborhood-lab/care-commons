import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { useAuth } from '@/core/hooks';
import { Button } from '@/core/components';

export interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="bg-black border-b border-neutral-800 sticky top-0 z-40">
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
          <h1 className="text-xl font-bold text-neutral-50">Neighborhood Lab</h1>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-neutral-100">{user?.name}</p>
              <p className="text-xs text-neutral-400">{user?.roles[0]}</p>
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
