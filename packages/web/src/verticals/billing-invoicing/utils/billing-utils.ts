import type { InvoiceStatus } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const getInvoiceStatusColor = (status: InvoiceStatus): string => {
  const colors: Record<InvoiceStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    SENT: 'bg-blue-100 text-blue-800',
    SUBMITTED: 'bg-indigo-100 text-indigo-800',
    PARTIALLY_PAID: 'bg-orange-100 text-orange-800',
    PAID: 'bg-green-100 text-green-800',
    PAST_DUE: 'bg-red-100 text-red-800',
    DISPUTED: 'bg-purple-100 text-purple-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    VOIDED: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getInvoiceStatusLabel = (status: InvoiceStatus): string => {
  return status.replace(/_/g, ' ');
};

export const isInvoiceOverdue = (dueDate: string, status: InvoiceStatus): boolean => {
  if (status === 'PAID' || status === 'VOIDED' || status === 'CANCELLED') {
    return false;
  }
  return new Date(dueDate) < new Date();
};

export const calculateInvoiceTotal = (
  lineItems: Array<{ units: number; unitRate: number }>, 
  taxAmount = 0, 
  discountAmount = 0
): number => {
  const subtotal = lineItems.reduce((sum, item) => sum + (item.units * item.unitRate), 0);
  return subtotal + taxAmount - discountAmount;
};
