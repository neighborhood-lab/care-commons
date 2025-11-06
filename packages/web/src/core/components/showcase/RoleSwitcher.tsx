/**
 * Role Switcher Component
 *
 * Allows switching between different user roles in showcase mode.
 */

import React from 'react';
import { Users } from 'lucide-react';
import { useApiProvider } from '../../providers';
import { ShowcaseApiProvider } from '../../providers/showcase-api-provider';

const ROLES = [
  { id: 'ADMIN', label: 'Admin' },
  { id: 'COORDINATOR', label: 'Care Coordinator' },
  { id: 'CAREGIVER', label: 'Caregiver' },
  { id: 'BILLING', label: 'Billing Manager' },
];

export const RoleSwitcher: React.FC = () => {
  const provider = useApiProvider();
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentRole, setCurrentRole] = React.useState('COORDINATOR');

  if (!(provider instanceof ShowcaseApiProvider)) {
    return null; // Only show in showcase mode
  }

  const handleRoleSwitch = (roleId: string) => {
    provider.switchRole(roleId);
    setCurrentRole(roleId);
    setIsOpen(false);
    // Reload the page to reflect the new role
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        title="Switch Role"
      >
        <Users className="h-4 w-4" />
        <span className="text-sm font-medium">
          {ROLES.find(r => r.id === currentRole)?.label || 'Care Coordinator'}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-2">
              {ROLES.map(role => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSwitch(role.id)}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors ${
                    currentRole === role.id ? 'bg-gray-900 text-white' : 'text-gray-700'
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
