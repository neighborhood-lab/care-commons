import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Grid, List } from 'lucide-react';
import { Button, LoadingSpinner, EmptyState, ErrorMessage } from '@/core/components';
import { usePermissions } from '@/core/hooks';
import { usePayRuns, usePayrollSummary } from '../hooks';
import { PayRunCard, PayRunSearch, PayrollSummaryCard } from '../components';
import type { PayRunSearchFilters } from '../types';

export const PayRunList: React.FC = () => {
  const { can } = usePermissions();
  const [filters, setFilters] = useState<PayRunSearchFilters>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { data: payRunData, isLoading, error, refetch } = usePayRuns(filters);
  const { data: summary } = usePayrollSummary();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={(error as Error).message || 'Failed to load pay runs'}
        retry={refetch}
      />
    );
  }

  const payRuns = payRunData?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Processing</h1>
          <p className="text-gray-600 mt-1">{payRunData?.total || 0} total pay runs</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              aria-label="Grid view"
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              aria-label="List view"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
          {can('payroll:write') && (
            <Link to="/payroll/runs/new">
              <Button leftIcon={<Plus className="h-4 w-4" />}>New Pay Run</Button>
            </Link>
          )}
        </div>
      </div>

      {summary && <PayrollSummaryCard summary={summary} />}

      <PayRunSearch filters={filters} onFiltersChange={setFilters} />

      {payRuns.length === 0 ? (
        <EmptyState
          title="No pay runs found"
          description="Get started by creating your first pay run."
          action={
            can('payroll:write') ? (
              <Link to="/payroll/runs/new">
                <Button leftIcon={<Plus className="h-4 w-4" />}>Create Pay Run</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {payRuns.map((payRun) => (
            <PayRunCard key={payRun.id} payRun={payRun} compact={viewMode === 'list'} />
          ))}
        </div>
      )}
    </div>
  );
};
