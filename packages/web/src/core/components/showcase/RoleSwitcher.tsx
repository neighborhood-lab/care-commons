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
  { id: 'ADMIN', label: 'Admin', description: 'Full system access' },
  { id: 'COORDINATOR', label: 'Care Coordinator', description: 'Manage clients and care plans' },
  { id: 'CAREGIVER', label: 'Caregiver', description: 'View assignments and log time' },
  { id: 'BILLING', label: 'Billing Manager', description: 'Manage billing and payroll' },
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
        className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        title="Switch Role"
      >
        <Users className="h-4 w-4" />
        <span className="text-sm font-medium">
          {ROLES.find(r => r.id === currentRole)?.label || 'Switch Role'}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Switch Role</h3>
              <p className="text-xs text-gray-600 mt-1">View the app from different perspectives</p>
            </div>
            <div className="p-2">
              {ROLES.map(role => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSwitch(role.id)}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors ${
                    currentRole === role.id ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                  }`}
                >
                  <div className="font-medium">{role.label}</div>
                  <div className="text-xs text-gray-600">{role.description}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
