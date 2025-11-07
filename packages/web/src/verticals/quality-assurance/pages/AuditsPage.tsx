/**
 * Audits List Page
 *
 * List all audits with filtering and search capabilities
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter } from 'lucide-react';
import { Button, LoadingSpinner, Card } from '@/core/components';
import { useAudits } from '../hooks';
import { AuditCard } from '../components';
import type { AuditStatus } from '../types';

export const AuditsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<AuditStatus | ''>('');
  const { data: auditsResult, isLoading, error } = useAudits({
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
        <p className="text-red-600">Failed to load audits</p>
        <p className="text-sm text-gray-600 mt-2">{(error as Error).message}</p>
      </div>
    );
  }

  const audits = auditsResult?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audits</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage and track quality assurance audits
          </p>
        </div>
        <Link to="/audits/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Audit
          </Button>
        </Link>
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
              onChange={(e) => setStatusFilter(e.target.value as AuditStatus | '')}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="FINDINGS_REVIEW">Findings Review</option>
              <option value="CORRECTIVE_ACTIONS">Corrective Actions</option>
              <option value="COMPLETED">Completed</option>
              <option value="APPROVED">Approved</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Audits Grid */}
      {audits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {audits.map((audit) => (
            <AuditCard key={audit.id} audit={audit} />
          ))}
        </div>
      ) : (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-600">No audits found</p>
            <p className="text-sm text-gray-500 mt-1">
              Create your first audit to get started
            </p>
            <Link to="/audits/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                New Audit
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
};
