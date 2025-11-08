import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, Filter, Search } from 'lucide-react';
import { Button, LoadingSpinner, EmptyState, ErrorMessage, Card } from '@/core/components';
import { usePermissions } from '@/core/hooks';
import { usePayStubs, useDownloadPayStubPdf } from '../hooks';
import { formatCurrency, formatDate } from '../utils';
import type { PayStubSearchFilters, PayStubStatus, PaymentMethod } from '../types';

export const PayStubsPage: React.FC = () => {
  const { can } = usePermissions();
  const [filters, setFilters] = useState<PayStubSearchFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: payStubData, isLoading, error, refetch } = usePayStubs(filters);
  const downloadPdf = useDownloadPayStubPdf();

  const handleFilterChange = (key: keyof PayStubSearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const getStatusColor = (status: PayStubStatus) => {
    const colors: Record<PayStubStatus, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      CALCULATED: 'bg-yellow-100 text-yellow-800',
      PENDING_APPROVAL: 'bg-orange-100 text-orange-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      PAYMENT_PENDING: 'bg-purple-100 text-purple-800',
      PAID: 'bg-green-100 text-green-800',
      VOID: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentMethodBadge = (method: PaymentMethod) => {
    const badges: Record<PaymentMethod, { color: string; label: string }> = {
      DIRECT_DEPOSIT: { color: 'bg-green-100 text-green-800', label: 'Direct Deposit' },
      CHECK: { color: 'bg-blue-100 text-blue-800', label: 'Check' },
      CASH: { color: 'bg-yellow-100 text-yellow-800', label: 'Cash' },
      PAYCARD: { color: 'bg-purple-100 text-purple-800', label: 'Pay Card' },
      WIRE: { color: 'bg-indigo-100 text-indigo-800', label: 'Wire Transfer' },
    };
    const badge = badges[method] || { color: 'bg-gray-100 text-gray-800', label: method };
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

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

  const payStubs = payStubData?.items ?? [];
  const filteredPayStubs = searchTerm
    ? payStubs.filter(stub =>
        stub.caregiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stub.caregiverEmployeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stub.stubNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : payStubs;

  // Calculate totals
  const totals = filteredPayStubs.reduce(
    (acc, stub) => ({
      count: acc.count + 1,
      hours: acc.hours + stub.totalHours,
      grossPay: acc.grossPay + stub.currentGrossPay,
      taxes: acc.taxes + stub.totalTaxWithheld,
      deductions: acc.deductions + stub.totalOtherDeductions,
      netPay: acc.netPay + stub.currentNetPay,
    }),
    { count: 0, hours: 0, grossPay: 0, taxes: 0, deductions: 0, netPay: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pay Stubs</h1>
          <p className="text-gray-600 mt-1">
            View and manage all pay stubs
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<Filter className="h-4 w-4" />}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Total Stubs</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totals.count}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Total Hours</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {totals.hours.toFixed(0)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Gross Pay</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(totals.grossPay)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Taxes</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {formatCurrency(totals.taxes)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Net Pay</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(totals.netPay)}
            </p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={filters.status ?? ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="CALCULATED">Calculated</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PAYMENT_PENDING">Payment Pending</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={filters.paymentMethod ?? ''}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                >
                  <option value="">All Methods</option>
                  <option value="DIRECT_DEPOSIT">Direct Deposit</option>
                  <option value="CHECK">Check</option>
                  <option value="CASH">Cash</option>
                  <option value="PAYCARD">Pay Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={filters.startDate ?? ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={filters.endDate ?? ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search */}
      <Card>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by caregiver name, employee ID, or stub number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Pay Stubs List */}
      {filteredPayStubs.length === 0 ? (
        <EmptyState
          title="No pay stubs found"
          description="No pay stubs match your search criteria."
        />
      ) : (
        <div className="space-y-3">
          {filteredPayStubs.map((payStub) => (
            <Card key={payStub.id} className="hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {payStub.caregiverName}
                      </h3>
                      <span className="text-sm text-gray-500">
                        #{payStub.caregiverEmployeeId}
                      </span>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payStub.status)}`}>
                        {payStub.status.replace(/_/g, ' ')}
                      </span>
                      {getPaymentMethodBadge(payStub.paymentMethod)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div>
                        <label className="text-xs text-gray-500">Pay Period</label>
                        <p className="text-sm font-medium">
                          {formatDate(payStub.payPeriodStartDate)} - {formatDate(payStub.payPeriodEndDate)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Pay Date</label>
                        <p className="text-sm font-medium">{formatDate(payStub.payDate)}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Hours</label>
                        <p className="text-sm font-medium">{payStub.totalHours.toFixed(2)}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Gross Pay</label>
                        <p className="text-sm font-medium">{formatCurrency(payStub.currentGrossPay)}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Deductions</label>
                        <p className="text-sm font-medium text-red-600">
                          -{formatCurrency(payStub.totalTaxWithheld + payStub.totalOtherDeductions)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Net Pay</label>
                        <p className="text-sm font-medium text-green-600">
                          {formatCurrency(payStub.currentNetPay)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {can('payroll:read') && (
                      <>
                        <Link to={`/payroll/stubs/${payStub.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Eye className="h-4 w-4" />}
                          >
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Download className="h-4 w-4" />}
                          onClick={() => downloadPdf.mutate(payStub.id)}
                          disabled={downloadPdf.isPending}
                        >
                          PDF
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
