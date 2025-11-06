import React, { useState } from 'react';
import { Plus, Lock, Unlock, Play } from 'lucide-react';
import { Button, LoadingSpinner, EmptyState, ErrorMessage, Card } from '@/core/components';
import { usePermissions } from '@/core/hooks';
import { usePayPeriods, useCreatePayRun } from '../hooks';
import { formatDate, formatCurrency } from '../utils';
import type { PayrollSearchFilters, PayPeriod } from '../types';

export const PayPeriodManagement: React.FC = () => {
  const { can } = usePermissions();
  const [filters, setFilters] = useState<PayrollSearchFilters>({});

  const { data: payPeriodData, isLoading, error, refetch } = usePayPeriods(filters);
  const createPayRun = useCreatePayRun();

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
        message={(error as Error).message || 'Failed to load pay periods'}
        retry={refetch}
      />
    );
  }

  const payPeriods = payPeriodData?.items || [];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      OPEN: 'bg-blue-100 text-blue-800',
      LOCKED: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-purple-100 text-purple-800',
      APPROVED: 'bg-green-100 text-green-800',
      PAID: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleProcessPayroll = async (payPeriod: PayPeriod) => {
    if (!payPeriod.organizationId) return;

    const confirmed = window.confirm(
      `Process payroll for pay period ${formatDate(payPeriod.startDate)} - ${formatDate(payPeriod.endDate)}?`
    );

    if (confirmed) {
      createPayRun.mutate({
        organizationId: payPeriod.organizationId,
        payPeriodId: payPeriod.id,
        runType: 'REGULAR',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pay Period Management</h1>
          <p className="text-gray-600 mt-1">
            {payPeriodData?.total || 0} pay periods
          </p>
        </div>
        {can('payroll:write') && (
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Create Pay Period
          </Button>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.status || ''}
              onChange={(e) =>
                setFilters({ ...filters, status: (e.target.value || undefined) as PayrollSearchFilters['status'] })
              }
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="OPEN">Open</option>
              <option value="LOCKED">Locked</option>
              <option value="PROCESSING">Processing</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.year || ''}
              onChange={(e) =>
                setFilters({ ...filters, year: e.target.value ? parseInt(e.target.value) : undefined })
              }
            >
              <option value="">All Years</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Period Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.periodType || ''}
              onChange={(e) =>
                setFilters({ ...filters, periodType: (e.target.value || undefined) as PayrollSearchFilters['periodType'] })
              }
            >
              <option value="">All Types</option>
              <option value="WEEKLY">Weekly</option>
              <option value="BI_WEEKLY">Bi-Weekly</option>
              <option value="SEMI_MONTHLY">Semi-Monthly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => setFilters({})}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {payPeriods.length === 0 ? (
        <EmptyState
          title="No pay periods found"
          description="Create your first pay period to get started with payroll processing."
          action={
            can('payroll:write') ? (
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                Create Pay Period
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {payPeriods.map((period) => (
            <Card key={period.id} className="hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {formatDate(period.startDate)} - {formatDate(period.endDate)}
                      </h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(period.status)}`}>
                        {period.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <label className="text-xs text-gray-500">Pay Date</label>
                        <p className="text-sm font-medium">{formatDate(period.payDate)}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Period Type</label>
                        <p className="text-sm font-medium">{period.periodType.replace(/_/g, ' ')}</p>
                      </div>
                      {period.totalCaregivers !== undefined && (
                        <div>
                          <label className="text-xs text-gray-500">Caregivers</label>
                          <p className="text-sm font-medium">{period.totalCaregivers}</p>
                        </div>
                      )}
                      {period.totalGrossPay !== undefined && (
                        <div>
                          <label className="text-xs text-gray-500">Total Gross Pay</label>
                          <p className="text-sm font-medium">{formatCurrency(period.totalGrossPay)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {can('payroll:write') && (
                    <div className="flex gap-2 ml-4">
                      {period.status === 'OPEN' && (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Lock className="h-4 w-4" />}
                        >
                          Lock
                        </Button>
                      )}
                      {period.status === 'LOCKED' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Unlock className="h-4 w-4" />}
                          >
                            Unlock
                          </Button>
                          <Button
                            size="sm"
                            leftIcon={<Play className="h-4 w-4" />}
                            onClick={() => handleProcessPayroll(period)}
                            disabled={createPayRun.isPending}
                          >
                            Process
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
