import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks';
import { PermissionCard } from '../components';
import type { PermissionSearchFilters } from '../types';

/**
 * Permission List Page
 */
export const PermissionList: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<PermissionSearchFilters>({});
  const { data, isLoading, error } = usePermissions(filters);

  const handlePermissionClick = (permissionId: string) => {
    navigate(`/rbac/permissions/${permissionId}`);
  };

  const handleCreatePermission = () => {
    navigate('/rbac/permissions/new');
  };

  const handleSearch = (query: string) => {
    setFilters({ ...filters, query });
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">Error loading permissions: {(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Permissions</h1>
          <button
            onClick={handleCreatePermission}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Create Permission
          </button>
        </div>
        <p className="text-gray-600 mt-2">Manage system permissions</p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search permissions..."
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading permissions...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((permission) => (
            <PermissionCard
              key={permission.id}
              permission={permission}
              onClick={() => handlePermissionClick(permission.id)}
            />
          ))}
        </div>
      )}

      {!isLoading && data?.items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No permissions found</p>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setFilters({ ...filters, page })}
              className={`px-4 py-2 rounded ${
                page === (filters.page || 1) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
