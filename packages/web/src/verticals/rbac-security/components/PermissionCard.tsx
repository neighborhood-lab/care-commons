import React from 'react';
import type { Permission } from '../types';

interface PermissionCardProps {
  permission: Permission;
  onClick?: (permission: Permission) => void;
}

/**
 * Permission Card Component
 */
export const PermissionCard: React.FC<PermissionCardProps> = ({ permission, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(permission);
    }
  };

  const getActionBadge = (action: string) => {
    const badges: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      READ: 'bg-blue-100 text-blue-800',
      UPDATE: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
      APPROVE: 'bg-purple-100 text-purple-800',
      EXECUTE: 'bg-indigo-100 text-indigo-800',
      MANAGE: 'bg-orange-100 text-orange-800',
    };
    return badges[action] || 'bg-gray-100 text-gray-800';
  };

  const getScopeBadge = (scope: string) => {
    const badges: Record<string, string> = {
      GLOBAL: 'bg-red-100 text-red-800',
      ORGANIZATION: 'bg-purple-100 text-purple-800',
      DEPARTMENT: 'bg-blue-100 text-blue-800',
      TEAM: 'bg-green-100 text-green-800',
      INDIVIDUAL: 'bg-gray-100 text-gray-800',
    };
    return badges[scope] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div
      onClick={handleClick}
      className={`border rounded-lg p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{permission.name}</h3>
            {permission.isSystem && (
              <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                System
              </span>
            )}
          </div>
          <code className="text-xs text-gray-500 mt-1 block">{permission.code}</code>
          {permission.description && (
            <p className="text-sm text-gray-600 mt-2">{permission.description}</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-1 rounded text-xs font-medium ${getActionBadge(permission.action)}`}>
          {permission.action}
        </span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getScopeBadge(permission.scope)}`}>
          {permission.scope}
        </span>
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
          {permission.resource.replace(/_/g, ' ')}
        </span>
        {permission.conditions && permission.conditions.length > 0 && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
            {permission.conditions.length} conditions
          </span>
        )}
      </div>
    </div>
  );
};
