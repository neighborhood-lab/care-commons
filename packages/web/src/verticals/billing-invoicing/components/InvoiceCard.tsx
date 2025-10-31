import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Invoice } from '../types';
import { formatCurrency, getInvoiceStatusColor, isInvoiceOverdue } from '../utils';

interface InvoiceCardProps {
  invoice: Invoice;
  compact?: boolean;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, compact = false }) => {
  const statusColor = getInvoiceStatusColor(invoice.status);
  const overdue = isInvoiceOverdue(invoice.dueDate, invoice.status);

  return (
    <Link
      to={`/billing/${invoice.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-gray-400" />
            <span className="font-semibold text-gray-900">
              {invoice.invoiceNumber}
            </span>
            {overdue && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
          {invoice.clientName && (
            <p className="text-sm text-gray-600">{invoice.clientName}</p>
          )}
          <p className="text-sm text-gray-500">{invoice.payerName}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {invoice.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Issue Date:
          </span>
          <span className="font-medium">{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Due Date:
          </span>
          <span className={`font-medium ${overdue ? 'text-red-600' : ''}`}>
            {new Date(invoice.dueDate).toLocaleDateString()}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            Total Amount:
          </span>
          <span className="font-bold text-lg">{formatCurrency(invoice.totalAmount)}</span>
        </div>
        {invoice.balanceDue > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Balance Due:</span>
            <span className="font-semibold">{formatCurrency(invoice.balanceDue)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          {formatDistanceToNow(new Date(invoice.createdAt), { addSuffix: true })}
        </span>
        <span className="text-xs text-gray-500">
          {invoice.lineItems.length} {invoice.lineItems.length === 1 ? 'item' : 'items'}
        </span>
      </div>
    </Link>
  );
};
