import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRole, useDeleteRole } from '../hooks';

/**
 * Role Detail Page
 */
export const RoleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: role, isLoading, error } = useRole(id!);
  const deleteRole = useDeleteRole();

  const handleEdit = () => {
    navigate(`/rbac/roles/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      await deleteRole.mutateAsync(id!);
      navigate('/rbac/roles');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading role...</p>
        </div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">Error loading role: {(error as Error)?.message || 'Role not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{role.name}</h1>
            <p className="text-gray-600 mt-2">{role.description || 'No description'}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Edit
            </button>
            {!role.isSystem && (
              <button
                onClick={handleDelete}
                disabled={deleteRole.isPending}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteRole.isPending ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Role Information</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{role.type.replace(/_/g, ' ')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    role.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {role.isActive ? 'Active' : 'Inactive'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">System Role</dt>
              <dd className="mt-1 text-sm text-gray-900">{role.isSystem ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Permissions</dt>
              <dd className="mt-1 text-sm text-gray-900">{role.permissions.length}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(role.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(role.updatedAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Permissions ({role.permissions.length})</h2>
          <div className="text-sm text-gray-600">
            {role.permissions.length === 0 ? (
              <p>No permissions assigned to this role</p>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {role.permissions.map((permissionId) => (
                  <li key={permissionId}>{permissionId}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
