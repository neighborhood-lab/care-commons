import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Send, Ban, Edit } from 'lucide-react';
import { Button, LoadingSpinner, ErrorMessage } from '@/core/components';
import { usePermissions } from '@/core/hooks';
import {
  useInvoice,
  useInvoicePayments,
  useSendInvoice,
  useVoidInvoice,
  useDownloadInvoicePdf,
} from '../hooks';
import { formatCurrency, getInvoiceStatusColor } from '../utils';

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const { data: invoice, isLoading, error } = useInvoice(id);
  const { data: payments } = useInvoicePayments(id);
  const sendInvoice = useSendInvoice();
  const voidInvoice = useVoidInvoice();
  const downloadPdf = useDownloadInvoicePdf();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !invoice) {
    return <ErrorMessage message="Failed to load invoice" retry={() => navigate('/billing')} />;
  }

  const statusColor = getInvoiceStatusColor(invoice.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/billing')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoiceNumber}</h1>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${statusColor}`}
            >
              {invoice.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => downloadPdf.mutate(invoice.id)}
            leftIcon={<Download className="h-4 w-4" />}
            disabled={downloadPdf.isPending}
          >
            Download PDF
          </Button>
          {can('billing:write') && invoice.status === 'DRAFT' && (
            <>
              <Button
                variant="outline"
                onClick={() => navigate(`/billing/${invoice.id}/edit`)}
                leftIcon={<Edit className="h-4 w-4" />}
              >
                Edit
              </Button>
              <Button
                onClick={() => sendInvoice.mutate(invoice.id)}
                leftIcon={<Send className="h-4 w-4" />}
                disabled={sendInvoice.isPending}
              >
                Send Invoice
              </Button>
            </>
          )}
          {can('billing:write') && invoice.status !== 'VOIDED' && invoice.status !== 'PAID' && (
            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm('Are you sure you want to void this invoice?')) {
                  voidInvoice.mutate(invoice.id);
                }
              }}
              leftIcon={<Ban className="h-4 w-4" />}
              disabled={voidInvoice.isPending}
            >
              Void
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Payer</h3>
            <p className="text-lg font-semibold">{invoice.payerName}</p>
            <p className="text-sm text-gray-500">{invoice.payerType.replace(/_/g, ' ')}</p>
          </div>

          {invoice.clientName && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Client</h3>
              <p className="text-lg font-semibold">{invoice.clientName}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Invoice Date</h3>
            <p className="text-lg">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Due Date</h3>
            <p className="text-lg">{new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Period</h3>
            <p className="text-lg">
              {new Date(invoice.periodStart).toLocaleDateString()} -{' '}
              {new Date(invoice.periodEnd).toLocaleDateString()}
            </p>
          </div>

          {invoice.submittedDate && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Submitted Date</h3>
              <p className="text-lg">{new Date(invoice.submittedDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">Line Items</h3>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Service</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Units</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Rate</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoice.lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{item.serviceDescription}</p>
                      <p className="text-sm text-gray-500">{item.serviceCode}</p>
                      {item.clientName && (
                        <p className="text-xs text-gray-400">{item.clientName}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(item.serviceDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.units} {item.unitType.toLowerCase()}
                  </td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.unitRate)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2">
              <tr>
                <td colSpan={4} className="px-4 py-2 text-right font-medium">
                  Subtotal:
                </td>
                <td className="px-4 py-2 text-right">{formatCurrency(invoice.subtotal)}</td>
              </tr>
              {invoice.taxAmount > 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-right">
                    Tax:
                  </td>
                  <td className="px-4 py-2 text-right">{formatCurrency(invoice.taxAmount)}</td>
                </tr>
              )}
              {invoice.discountAmount > 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-right">
                    Discount:
                  </td>
                  <td className="px-4 py-2 text-right text-red-600">
                    -{formatCurrency(invoice.discountAmount)}
                  </td>
                </tr>
              )}
              {invoice.adjustmentAmount !== 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-right">
                    Adjustments:
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatCurrency(invoice.adjustmentAmount)}
                  </td>
                </tr>
              )}
              <tr className="text-lg font-bold">
                <td colSpan={4} className="px-4 py-3 text-right">
                  Total:
                </td>
                <td className="px-4 py-3 text-right">{formatCurrency(invoice.totalAmount)}</td>
              </tr>
              {invoice.paidAmount > 0 && (
                <>
                  <tr className="text-green-600">
                    <td colSpan={4} className="px-4 py-2 text-right">
                      Amount Paid:
                    </td>
                    <td className="px-4 py-2 text-right">-{formatCurrency(invoice.paidAmount)}</td>
                  </tr>
                  <tr className="text-lg font-bold text-red-600">
                    <td colSpan={4} className="px-4 py-3 text-right">
                      Balance Due:
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(invoice.balanceDue)}</td>
                  </tr>
                </>
              )}
            </tfoot>
          </table>
        </div>

        {invoice.notes && (
          <div className="pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
            <p className="text-gray-700">{invoice.notes}</p>
          </div>
        )}

        {payments && payments.length > 0 && (
          <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Payment History</h3>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm text-gray-500">
                      {payment.paymentMethod.replace(/_/g, ' ')} •{' '}
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </p>
                    {payment.referenceNumber && (
                      <p className="text-xs text-gray-400">Ref: {payment.referenceNumber}</p>
                    )}
                  </div>
                  <span className="text-sm text-gray-600">{payment.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
