/**
 * Payroll Dashboard
 *
 * Main dashboard for payroll management
 * Shows current pay period, recent periods, and quick actions
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PayrollSummaryCard } from '../components/PayrollSummaryCard';

interface PayPeriod {
  id: string;
  periodNumber: number;
  periodYear: number;
  periodType: string;
  startDate: string;
  endDate: string;
  payDate: string;
  status: string;
  totalCaregivers?: number;
  totalHours?: number;
  totalGrossPay?: number;
  totalNetPay?: number;
}

/**
 * Fetch current pay period
 */
async function fetchCurrentPeriod(organizationId: string): Promise<PayPeriod | null> {
  const response = await fetch(`/api/payroll/current-period?organizationId=${organizationId}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch current pay period');
  }
  const data = await response.json();
  return data.data;
}

/**
 * Fetch recent pay periods
 */
async function fetchRecentPeriods(organizationId: string, limit: number = 5): Promise<PayPeriod[]> {
  const response = await fetch(`/api/payroll/periods?organizationId=${organizationId}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch recent pay periods');
  }
  const data = await response.json();
  return data.data;
}

/**
 * Payroll Dashboard Component
 */
export const PayrollDashboard: React.FC = () => {
  // Get organization ID from context or header
  // For now, using a mock value - in production this would come from auth context
  const organizationId = 'org-123'; // TODO: Get from auth context

  const { data: currentPeriod, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['payroll', 'current-period', organizationId],
    queryFn: () => fetchCurrentPeriod(organizationId),
  });

  const { data: recentPeriods = [], isLoading: isLoadingRecent } = useQuery({
    queryKey: ['payroll', 'periods', organizationId],
    queryFn: () => fetchRecentPeriods(organizationId, 5),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
        <Link
          to="/admin/payroll/periods/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create New Period
        </Link>
      </div>

      {/* Current Period Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Pay Period</h2>
        {isLoadingCurrent ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : currentPeriod ? (
          <div className="bg-white rounded-lg shadow">
            <PayPeriodCard period={currentPeriod} isCurrent />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500">No active pay period. Create a new period to get started.</p>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            title="Manage Timesheets"
            description="Review and approve caregiver timesheets"
            link="/admin/payroll/timesheets"
            icon="📋"
          />
          <QuickActionCard
            title="Run Payroll"
            description="Process payroll for current period"
            link="/admin/payroll/pay-runs/new"
            icon="💰"
          />
          <QuickActionCard
            title="View Pay Stubs"
            description="Access pay stubs and download PDFs"
            link="/admin/payroll/pay-stubs"
            icon="📄"
          />
        </div>
      </section>

      {/* Recent Pay Periods */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Pay Periods</h2>
        {isLoadingRecent ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ) : recentPeriods.length > 0 ? (
          <div className="space-y-4">
            {recentPeriods.map((period) => (
              <PayPeriodCard key={period.id} period={period} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500">No pay periods found.</p>
          </div>
        )}
      </section>

      {/* Summary Statistics */}
      {currentPeriod && currentPeriod.totalGrossPay && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
          <PayrollSummaryCard
            summary={{
              totalEmployees: currentPeriod.totalCaregivers || 0,
              totalCaregivers: currentPeriod.totalCaregivers || 0,
              totalHours: currentPeriod.totalHours || 0,
              totalGrossPay: currentPeriod.totalGrossPay || 0,
              totalTaxWithheld: 0,
              pendingApprovals: 0,
              upcomingPayDate: currentPeriod.payDate,
              recentPayRuns: {
                total: 0,
                completed: 0,
                failed: 0,
              },
              ytdTotals: {
                grossPay: 0,
                netPay: 0,
                taxWithheld: 0,
              },
            }}
          />
        </section>
      )}
    </div>
  );
};

/**
 * Pay Period Card Component
 */
interface PayPeriodCardProps {
  period: PayPeriod;
  isCurrent?: boolean;
}

const PayPeriodCard: React.FC<PayPeriodCardProps> = ({ period, isCurrent = false }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    OPEN: 'bg-green-100 text-green-800',
    LOCKED: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-purple-100 text-purple-800',
    PAID: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${isCurrent ? 'border-2 border-blue-500' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Pay Period #{period.periodNumber} - {period.periodYear}
          </h3>
          <p className="text-sm text-gray-600">
            {formatDate(period.startDate)} - {formatDate(period.endDate)}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[period.status] || statusColors.DRAFT}`}>
          {period.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Pay Date</p>
          <p className="text-sm font-medium text-gray-900">{formatDate(period.payDate)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Period Type</p>
          <p className="text-sm font-medium text-gray-900">{period.periodType.replace('_', ' ')}</p>
        </div>
      </div>

      {period.totalGrossPay !== undefined && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500">Caregivers</p>
            <p className="text-sm font-medium text-gray-900">{period.totalCaregivers || 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Hours</p>
            <p className="text-sm font-medium text-gray-900">{(period.totalHours || 0).toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Gross Pay</p>
            <p className="text-sm font-medium text-gray-900">
              ${(period.totalGrossPay || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Link
          to={`/admin/payroll/periods/${period.id}`}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          View Details
        </Link>
        {period.status === 'OPEN' && (
          <Link
            to={`/admin/payroll/timesheets?periodId=${period.id}`}
            className="px-3 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            View Timesheets
          </Link>
        )}
      </div>
    </div>
  );
};

/**
 * Quick Action Card Component
 */
interface QuickActionCardProps {
  title: string;
  description: string;
  link: string;
  icon: string;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ title, description, link, icon }) => {
  return (
    <Link to={link} className="block">
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
};

export default PayrollDashboard;
