import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Grid, List, Filter } from 'lucide-react';
import { Button, LoadingSpinner, EmptyState, ErrorMessage } from '@/core/components';
import { usePermissions } from '@/core/hooks';
import { usePayStubs } from '../hooks';
import { PayStubCard } from '../components';
import type { PayStubSearchFilters } from '../types';

export const PayStubList: React.FC = () => {
  const { can } = usePermissions();
  const [filters, setFilters] = useState<PayStubSearchFilters>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const { data: payStubData, isLoading, error, refetch } = usePayStubs(filters);

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
        message={(error as Error).message || 'Failed to load pay stubs'}
        retry={refetch}
      />
    );
  }

  const payStubs = payStubData?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pay Stubs</h1>
          <p className="text-gray-600 mt-1">
            {payStubData?.total || 0} total pay stubs
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Filters
          </Button>
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${
                viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
              aria-label="Grid view"
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${
                viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
              aria-label="List view"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={filters.status || ''}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value || undefined })
                }
              >
                <option value="">All Statuses</option>
                <option value="CALCULATED">Calculated</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
                <option value="VOID">Void</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={filters.paymentMethod || ''}
                onChange={(e) =>
                  setFilters({ ...filters, paymentMethod: e.target.value || undefined })
                }
              >
                <option value="">All Methods</option>
                <option value="DIRECT_DEPOSIT">Direct Deposit</option>
                <option value="CHECK">Check</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={filters.startDate || ''}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value || undefined })
                }
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setFilters({})}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {payStubs.length === 0 ? (
        <EmptyState
          title="No pay stubs found"
          description="Pay stubs will appear here once payroll is processed."
        />
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {payStubs.map((payStub) => (
            <PayStubCard
              key={payStub.id}
              payStub={payStub}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      )}
    </div>
  );
};
