import type { InvoiceStatus } from '../types';
import { createStatusColorGetter, formatStatusLabel } from '@/core/utils';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const getInvoiceStatusColor = createStatusColorGetter<InvoiceStatus>();

export const getInvoiceStatusLabel = formatStatusLabel;

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
