/**
 * Simplified Types for Showcase
 *
 * These are simplified versions of the production types,
 * designed to work with the mock provider and localStorage.
 */

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  stateCode: string;
  zipCode: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
}

export interface Client {
  id: string;
  organizationId: string;
  branchId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email?: string;
  phone?: string;
  primaryAddress: Address;
  emergencyContacts: EmergencyContact[];
  status: string;
  medicaidNumber?: string;
  medicareNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  category: string;
  description: string;
  targetDate: string;
  status: string;
  progress: number;
  notes?: string;
}

export interface CarePlan {
  id: string;
  organizationId: string;
  branchId: string;
  clientId: string;
  coordinatorId: string;
  name: string;
  planType: string;
  status: string;
  priority: string;
  startDate: string;
  endDate?: string;
  description: string;
  goals: Goal[];
  complianceStatus: string;
  lastReviewDate?: string;
  nextReviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInstance {
  id: string;
  organizationId: string;
  branchId: string;
  carePlanId: string;
  clientId: string;
  assignedCaregiverId?: string;
  category: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  completedAt?: string;
  completionNotes?: string;
  requiresSignature: boolean;
  requiresEvv?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Certification {
  type: string;
  number: string;
  issuedDate: string;
  expiryDate: string;
  issuingAuthority: string;
}

export interface Caregiver {
  id: string;
  organizationId: string;
  branchId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  hireDate: string;
  status: string;
  certifications: Certification[];
  specializations: string[];
  hourlyRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  serviceDate: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  branchId: string;
  clientId: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  lineItems: InvoiceLineItem[];
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollPeriod {
  id: string;
  organizationId: string;
  branchId: string;
  startDate: string;
  endDate: string;
  payDate: string;
  status: string;
  totalHours: number;
  totalGrossPay: number;
  totalNetPay: number;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftListing {
  id: string;
  organizationId: string;
  branchId: string;
  clientId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: string;
  assignedCaregiverId?: string;
  requiredCertifications: string[];
  preferredSpecializations: string[];
  hourlyRate: number;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftApplication {
  id: string;
  shiftListingId: string;
  caregiverId: string;
  status: string;
  appliedAt: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Input types for create/update operations
export type CreateClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateClientInput = Partial<CreateClientInput>;

export type CreateCarePlanInput = Omit<CarePlan, 'id' | 'status' | 'complianceStatus' | 'createdAt' | 'updatedAt'>;
export type UpdateCarePlanInput = Partial<CreateCarePlanInput>;

export interface CompleteTaskInput {
  notes?: string;
}

export type CreateCaregiverInput = Omit<Caregiver, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCaregiverInput = Partial<CreateCaregiverInput>;

export type CreateInvoiceInput = Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInvoiceInput = Partial<CreateInvoiceInput>;

export type CreatePayrollPeriodInput = Omit<PayrollPeriod, 'id' | 'createdAt' | 'updatedAt'>;
export interface ProcessPayrollInput {
  [key: string]: unknown;
}

export type CreateShiftListingInput = Omit<ShiftListing, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateShiftListingInput = Partial<CreateShiftListingInput>;

// Search filter types
export interface ClientSearchFilters {
  query?: string;
  status?: string[];
  city?: string;
  state?: string;
}

export interface CarePlanSearchFilters {
  query?: string;
  clientId?: string;
  status?: string[];
  planType?: string[];
  coordinatorId?: string;
  expiringWithinDays?: number;
  complianceStatus?: string[];
}

export interface TaskInstanceSearchFilters {
  carePlanId?: string;
  clientId?: string;
  assignedCaregiverId?: string;
  status?: string[];
  category?: string[];
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
  overdue?: boolean;
}

export interface CaregiverSearchFilters {
  query?: string;
  status?: string[];
}

export interface InvoiceSearchFilters {
  query?: string;
  status?: string[];
}

export interface PayrollSearchFilters {
  status?: string[];
}

export interface ShiftSearchFilters {
  query?: string;
  status?: string[];
}
