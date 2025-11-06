import type { PayPeriodStatus, PayRunStatus, PayStubStatus } from '../types';
import { createStatusColorGetter } from '@/core/utils';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatHours = (hours: number): string => {
  return `${hours.toFixed(2)} hrs`;
};

export const getPayPeriodStatusColor = createStatusColorGetter<PayPeriodStatus>({
  CLOSED: 'bg-gray-100 text-gray-800',
});

export const getPayRunStatusColor = createStatusColorGetter<PayRunStatus>();

export const getPayStubStatusColor = createStatusColorGetter<PayStubStatus>({
  VOID: 'bg-red-100 text-red-800',
  PAYMENT_PENDING: 'bg-orange-100 text-orange-800',
});
