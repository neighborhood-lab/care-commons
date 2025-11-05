import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShowcaseLayout } from '../components/ShowcaseLayout';
import { useBillingProvider } from '@/core/providers/context';
import { FileText, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

export const BillingPage: React.FC = () => {
  const billingProvider = useBillingProvider();

  const { data, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => billingProvider.getInvoices({}),
  });

  const stats = {
    total: data?.total || 0,
    totalAmount: data?.items.reduce((sum, inv) => sum + inv.totalAmount, 0) || 0,
    paid: data?.items.filter(inv => inv.status === 'PAID').length || 0,
    paidAmount: data?.items.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.totalAmount, 0) || 0,
    pending: data?.items.filter(inv => inv.status === 'PENDING').length || 0,
    pendingAmount: data?.items.filter(inv => inv.status === 'PENDING').reduce((sum, inv) => sum + inv.totalAmount, 0) || 0,
  };

  return (
    <ShowcaseLayout
      title="Billing & Invoicing"
      description="Generate invoices, track payments, and manage billing workflows"
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <p className="text-sm font-medium text-gray-600">Total Invoices</p>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-600" />
            <p className="text-sm font-medium text-gray-600">Total Amount</p>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            ${stats.totalAmount.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Paid</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">
            ${stats.paidAmount.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{stats.paid} invoices</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Pending</p>
          <p className="mt-1 text-2xl font-semibold text-yellow-600">
            ${stats.pendingAmount.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{stats.pending} invoices</p>
        </div>
      </div>

      {/* Invoices List */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-4">
          {data.items.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {invoice.invoiceNumber}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        invoice.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : invoice.status === 'OVERDUE'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Issued: {format(new Date(invoice.issueDate), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                    </span>
                    {invoice.paidDate && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CreditCard className="h-4 w-4" />
                        Paid: {format(new Date(invoice.paidDate), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    ${invoice.totalAmount.toFixed(2)}
                  </p>
                  {invoice.paymentMethod && (
                    <p className="text-xs text-gray-500 mt-1">{invoice.paymentMethod}</p>
                  )}
                </div>
              </div>

              {/* Line Items */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Line Items</h4>
                <div className="space-y-2">
                  {invoice.lineItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <p className="text-gray-900">{item.description}</p>
                        <p className="text-xs text-gray-500">
                          {item.quantity} × ${item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900">
                        ${item.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">${invoice.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">${invoice.totalAmount.toFixed(2)}</span>
                </div>
                {invoice.paidAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 mt-1">
                    <span>Paid</span>
                    <span>${invoice.paidAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ShowcaseLayout>
  );
};
