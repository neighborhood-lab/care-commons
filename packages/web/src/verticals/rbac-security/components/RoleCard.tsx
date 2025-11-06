import React from 'react';
import type { Role } from '../types';

interface RoleCardProps {
  role: Role;
  onClick?: (role: Role) => void;
}

/**
 * Role Card Component
 */
export const RoleCard: React.FC<RoleCardProps> = ({ role, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(role);
    }
  };

  const getRoleTypeBadge = (type: string) => {
    const badges: Record<string, string> = {
      SYSTEM_ADMIN: 'bg-red-100 text-red-800',
      ORGANIZATION_ADMIN: 'bg-purple-100 text-purple-800',
      MANAGER: 'bg-blue-100 text-blue-800',
      SUPERVISOR: 'bg-indigo-100 text-indigo-800',
      COORDINATOR: 'bg-green-100 text-green-800',
      CAREGIVER: 'bg-teal-100 text-teal-800',
      BILLING_STAFF: 'bg-yellow-100 text-yellow-800',
      SCHEDULER: 'bg-orange-100 text-orange-800',
      VIEWER: 'bg-gray-100 text-gray-800',
      CUSTOM: 'bg-pink-100 text-pink-800',
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div
      onClick={handleClick}
      className={`border rounded-lg p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{role.name}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleTypeBadge(role.type)}`}>
              {role.type.replace(/_/g, ' ')}
            </span>
          </div>
          {role.description && (
            <p className="text-sm text-gray-600 mt-1">{role.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {role.isSystem && (
            <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">
              System
            </span>
          )}
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              role.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {role.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
        <span>{role.permissions.length} permissions</span>
        {role.organizationId && <span>Organization-specific</span>}
      </div>
    </div>
  );
};
