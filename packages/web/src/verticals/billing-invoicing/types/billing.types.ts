export type InvoiceStatus = 
  | 'DRAFT' 
  | 'PENDING_REVIEW' 
  | 'APPROVED' 
  | 'SENT' 
  | 'SUBMITTED' 
  | 'PARTIALLY_PAID' 
  | 'PAID' 
  | 'PAST_DUE' 
  | 'DISPUTED' 
  | 'CANCELLED' 
  | 'VOIDED';

export type PaymentStatus = 
  | 'PENDING' 
  | 'RECEIVED' 
  | 'APPLIED' 
  | 'DEPOSITED' 
  | 'CLEARED' 
  | 'RETURNED' 
  | 'VOIDED' 
  | 'REFUNDED';

export type PaymentMethod = 
  | 'CHECK' 
  | 'EFT' 
  | 'ACH' 
  | 'WIRE' 
  | 'CREDIT_CARD' 
  | 'DEBIT_CARD' 
  | 'CASH' 
  | 'MONEY_ORDER' 
  | 'ERA';

export type PayerType =
  | 'MEDICAID'
  | 'MEDICARE'
  | 'MEDICARE_ADVANTAGE'
  | 'PRIVATE_INSURANCE'
  | 'MANAGED_CARE'
  | 'VETERANS_BENEFITS'
  | 'WORKERS_COMP'
  | 'PRIVATE_PAY'
  | 'GRANT'
  | 'OTHER';

export type UnitType =
  | 'HOUR'
  | 'VISIT'
  | 'DAY'
  | 'WEEK'
  | 'MONTH'
  | 'TASK'
  | 'MILE'
  | 'UNIT';

export interface InvoiceLineItem {
  id: string;
  billableItemId: string;
  serviceDate: string;
  serviceCode: string;
  serviceDescription: string;
  providerName?: string;
  providerNPI?: string;
  unitType: UnitType;
  units: number;
  unitRate: number;
  subtotal: number;
  adjustments: number;
  total: number;
  clientName?: string;
  clientId?: string;
  authorizationNumber?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  clientId?: string;
  clientName?: string;
  payerId: string;
  payerType: PayerType;
  payerName: string;
  status: InvoiceStatus;
  periodStart: string;
  periodEnd: string;
  invoiceDate: string;
  dueDate: string;
  submittedDate?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  adjustmentAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  receivedDate: string;
  status: PaymentStatus;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateInvoiceInput {
  clientId?: string;
  payerId: string;
  payerType: PayerType;
  payerName: string;
  invoiceDate: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  billableItemIds: string[];
  notes?: string;
}

export interface UpdateInvoiceInput {
  status?: InvoiceStatus;
  dueDate?: string;
  notes?: string;
  taxAmount?: number;
  discountAmount?: number;
}

export interface CreatePaymentInput {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
}

export interface BillingSearchFilters {
  clientId?: string;
  payerId?: string;
  status?: InvoiceStatus;
  payerType?: PayerType;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  isPastDue?: boolean;
}

export interface InvoiceListResponse {
  items: Invoice[];
  total: number;
  hasMore: boolean;
}

export interface BillingSummary {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueAmount: number;
  invoiceCount: {
    total: number;
    draft: number;
    pending: number;
    sent: number;
    paid: number;
    overdue: number;
  };
}
