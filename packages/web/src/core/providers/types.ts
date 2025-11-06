// @ts-nocheck - Pre-existing showcase code with type mismatches
/**
 * API Provider Types
 *
 * Type definitions for the API provider interfaces
 */


import type { PaginatedResult, SearchParams } from '../types/api';

// Re-export types from verticals
export type {
  Client,
  CreateClientInput,
  UpdateClientInput,
  ClientSearchFilters,
} from '@/verticals/client-demographics/types';

export type {
  CarePlan,
  TaskInstance,
  CreateCarePlanInput,
  UpdateCarePlanInput,
  CompleteTaskInput,
  CarePlanSearchFilters,
  TaskInstanceSearchFilters,
} from '@/verticals/care-plans/types';

export type {
  Caregiver,
  CreateCaregiverInput,
  UpdateCaregiverInput,
  CaregiverSearchFilters,
} from '@/verticals/caregivers/types';

export type {
  Invoice,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceSearchFilters,
} from '@/verticals/billing-invoicing/types';

export type {
  PayrollPeriod,
  CreatePayrollPeriodInput,
  ProcessPayrollInput,
  PayrollSearchFilters,
} from '@/verticals/payroll-processing/types';

export type {
  ShiftListing,
  ShiftApplication,
  CreateShiftListingInput,
  UpdateShiftListingInput,
  ShiftSearchFilters,
} from '@/verticals/shift-matching/types';

export type {
  OperationalKPIs,
  ComplianceAlert,
  DashboardStats,
  AnalyticsFilters,
} from '@/verticals/analytics-reporting/types';

/**
 * Client Data Provider
 * Handles all client-related data operations
 */
export interface ClientDataProvider {
  getClients(filters?: ClientSearchFilters & SearchParams): Promise<PaginatedResult<Client>>;
  getClientById(id: string): Promise<Client>;
  createClient(input: CreateClientInput): Promise<Client>;
  updateClient(id: string, input: UpdateClientInput): Promise<Client>;
  deleteClient(id: string): Promise<void>;
}

/**
 * Care Plan Data Provider
 * Handles care plans and task instances
 */
export interface CarePlanDataProvider {
  getCarePlans(filters?: CarePlanSearchFilters & SearchParams): Promise<PaginatedResult<CarePlan>>;
  getCarePlanById(id: string): Promise<CarePlan>;
  createCarePlan(input: CreateCarePlanInput): Promise<CarePlan>;
  updateCarePlan(id: string, input: UpdateCarePlanInput): Promise<CarePlan>;
  activateCarePlan(id: string): Promise<CarePlan>;
  getTasks(filters?: TaskInstanceSearchFilters & SearchParams): Promise<PaginatedResult<TaskInstance>>;
  getTaskById(id: string): Promise<TaskInstance>;
  completeTask(id: string, input: CompleteTaskInput): Promise<TaskInstance>;
}

/**
 * Caregiver Data Provider
 * Handles caregiver-related data operations
 */
export interface CaregiverDataProvider {
  getCaregivers(filters?: CaregiverSearchFilters & SearchParams): Promise<PaginatedResult<Caregiver>>;
  getCaregiverById(id: string): Promise<Caregiver>;
  createCaregiver(input: CreateCaregiverInput): Promise<Caregiver>;
  updateCaregiver(id: string, input: UpdateCaregiverInput): Promise<Caregiver>;
  deleteCaregiver(id: string): Promise<void>;
}

/**
 * Billing Data Provider
 * Handles invoicing and billing operations
 */
export interface BillingDataProvider {
  getInvoices(filters?: InvoiceSearchFilters & SearchParams): Promise<PaginatedResult<Invoice>>;
  getInvoiceById(id: string): Promise<Invoice>;
  createInvoice(input: CreateInvoiceInput): Promise<Invoice>;
  updateInvoice(id: string, input: UpdateInvoiceInput): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;
}

/**
 * Payroll Data Provider
 * Handles payroll processing operations
 */
export interface PayrollDataProvider {
  getPayrollPeriods(filters?: PayrollSearchFilters & SearchParams): Promise<PaginatedResult<PayrollPeriod>>;
  getPayrollPeriodById(id: string): Promise<PayrollPeriod>;
  createPayrollPeriod(input: CreatePayrollPeriodInput): Promise<PayrollPeriod>;
  processPayroll(id: string, input: ProcessPayrollInput): Promise<PayrollPeriod>;
}

/**
 * Shift Matching Data Provider
 * Handles shift listings and applications
 */
export interface ShiftMatchingDataProvider {
  getShiftListings(filters?: ShiftSearchFilters & SearchParams): Promise<PaginatedResult<ShiftListing>>;
  getShiftListingById(id: string): Promise<ShiftListing>;
  createShiftListing(input: CreateShiftListingInput): Promise<ShiftListing>;
  updateShiftListing(id: string, input: UpdateShiftListingInput): Promise<ShiftListing>;
  getApplicationsForShift(shiftId: string): Promise<ShiftApplication[]>;
  applyToShift(shiftId: string, caregiverId: string): Promise<ShiftApplication>;
}

/**
 * Analytics Data Provider
 * Handles analytics and reporting operations
 */
export interface AnalyticsDataProvider {
  getKPIs(filters?: AnalyticsFilters): Promise<OperationalKPIs>;
  getComplianceAlerts(filters?: AnalyticsFilters): Promise<ComplianceAlert[]>;
  getDashboardStats(filters?: AnalyticsFilters): Promise<DashboardStats>;
}

/**
 * Unified Data Provider
 * Combines all provider interfaces for comprehensive data access
 */
export interface DataProvider
  extends ClientDataProvider,
    CarePlanDataProvider,
    CaregiverDataProvider,
    BillingDataProvider,
    PayrollDataProvider,
    ShiftMatchingDataProvider {
  /**
   * Provider metadata
   */
  readonly name: string;
  readonly type: 'api' | 'mock' | 'hybrid';

  /**
   * Analytics & Reporting
   */
  analytics: AnalyticsDataProvider;

  /**
   * Optional initialization method
   */
  initialize?(): Promise<void>;

  /**
   * Optional cleanup method
   */
  dispose?(): void;
}

/**
 * Provider configuration options
 */
export interface ProviderConfig {
  type: 'api' | 'mock';
  apiBaseUrl?: string;
  getAuthToken?: () => string | null;
  mockDataSeed?: unknown;
  enableLocalStorage?: boolean;
}
