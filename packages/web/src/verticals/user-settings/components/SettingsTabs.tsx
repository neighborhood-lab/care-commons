/**
 * Settings Tabs Component
 *
 * Tab navigation for different settings sections.
 */

import { NavLink } from 'react-router-dom';
import { User, Settings as SettingsIcon, Shield } from 'lucide-react';

interface Tab {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
}

const tabs: Tab[] = [
  {
    id: 'account',
    name: 'Account',
    icon: User,
    to: '/settings/account',
  },
  {
    id: 'preferences',
    name: 'Preferences',
    icon: SettingsIcon,
    to: '/settings/preferences',
  },
  {
    id: 'security',
    name: 'Security',
    icon: Shield,
    to: '/settings/security',
  },
];

export const SettingsTabs = () => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.to}
            className={({ isActive }) =>
              `group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium ${
                isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`
            }
          >
            <tab.icon
              className={`-ml-0.5 mr-2 h-5 w-5`}
              aria-hidden="true"
            />
            {tab.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
