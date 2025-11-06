/**
 * Corrective Actions Page
 *
 * List and manage corrective actions with filtering
 */

import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { LoadingSpinner, Card } from '@/core/components';
import { useCorrectiveActions } from '../hooks';
import { CorrectiveActionCard } from '../components';
import type { CorrectiveActionStatus } from '../types';

export const CorrectiveActionsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<CorrectiveActionStatus | ''>('');
  const { data: actionsResult, isLoading, error } = useCorrectiveActions({
    status: statusFilter || undefined,
    pageSize: 50,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load corrective actions</p>
        <p className="text-sm text-gray-600 mt-2">{(error as Error).message}</p>
      </div>
    );
  }

  const actions = actionsResult?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Corrective Actions</h1>
        <p className="text-sm text-gray-600 mt-1">
          Track and manage corrective actions from audit findings
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CorrectiveActionStatus | '')}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="PLANNED">Planned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IMPLEMENTED">Implemented</option>
              <option value="VERIFIED">Verified</option>
              <option value="CLOSED">Closed</option>
              <option value="INEFFECTIVE">Ineffective</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Corrective Actions Grid */}
      {actions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => (
            <CorrectiveActionCard key={action.id} action={action} />
          ))}
        </div>
      ) : (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-600">No corrective actions found</p>
            <p className="text-sm text-gray-500 mt-1">
              Corrective actions are created from audit findings
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
