import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Grid, List } from 'lucide-react';
import { Button, LoadingSpinner, EmptyState, ErrorMessage } from '@/core/components';
import { usePermissions } from '@/core/hooks';
import { useInvoices, useBillingSummary } from '../hooks';
import { InvoiceCard, InvoiceSearch, BillingSummaryCard } from '../components';
import type { BillingSearchFilters } from '../types';

export const InvoiceList: React.FC = () => {
  const { can } = usePermissions();
  const [filters, setFilters] = useState<BillingSearchFilters>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { data: invoiceData, isLoading, error, refetch } = useInvoices(filters);
  const { data: summary } = useBillingSummary(filters);

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
        message={(error as Error).message || 'Failed to load invoices'}
        retry={refetch}
      />
    );
  }

  const invoices = invoiceData?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Invoicing</h1>
          <p className="text-gray-600 mt-1">
            {invoiceData?.total || 0} total invoices
          </p>
        </div>
        <div className="flex gap-2">
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
          {can('billing:write') && (
            <Link to="/billing/new">
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                New Invoice
              </Button>
            </Link>
          )}
        </div>
      </div>

      {summary && <BillingSummaryCard summary={summary} />}

      <InvoiceSearch filters={filters} onFiltersChange={setFilters} />

      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices found"
          description="Get started by creating your first invoice."
          action={
            can('billing:write') ? (
              <Link to="/billing/new">
                <Button leftIcon={<Plus className="h-4 w-4" />}>
                  Create Invoice
                </Button>
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
          {invoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      )}
    </div>
  );
};
