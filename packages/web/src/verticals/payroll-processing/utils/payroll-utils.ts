import type { PayPeriodStatus, PayRunStatus, PayStubStatus } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatHours = (hours: number): string => {
  return `${hours.toFixed(2)} hrs`;
};

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

export const getPayPeriodStatusColor = (status: PayPeriodStatus): string => {
  const colors: Record<PayPeriodStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    OPEN: 'bg-blue-100 text-blue-800',
    LOCKED: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    PENDING_APPROVAL: 'bg-orange-100 text-orange-800',
    APPROVED: 'bg-indigo-100 text-indigo-800',
    PAID: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getPayRunStatusColor = (status: PayRunStatus): string => {
  const colors: Record<PayRunStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    CALCULATING: 'bg-blue-100 text-blue-800',
    CALCULATED: 'bg-blue-100 text-blue-800',
    PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
    PENDING_APPROVAL: 'bg-orange-100 text-orange-800',
    APPROVED: 'bg-indigo-100 text-indigo-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    PROCESSED: 'bg-purple-100 text-purple-800',
    FUNDED: 'bg-teal-100 text-teal-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getPayStubStatusColor = (status: PayStubStatus): string => {
  const colors: Record<PayStubStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    CALCULATED: 'bg-blue-100 text-blue-800',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-indigo-100 text-indigo-800',
    PAYMENT_PENDING: 'bg-orange-100 text-orange-800',
    PAID: 'bg-green-100 text-green-800',
    VOID: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};
