/**
 * Data Provider Abstraction
 *
 * This module defines the contract for data providers in the Care Commons application.
 * Following SOLID principles, specifically:
 * - Interface Segregation: Providers implement only the interfaces they need
 * - Dependency Inversion: High-level modules depend on abstractions, not concretions
 *
 * Providers can be:
 * - API-based (real backend integration)
 * - Mock-based (in-memory with localStorage persistence)
 * - Hybrid (combining multiple sources)
 */

import type { PaginatedResult, SearchParams } from '../types/api';

// Import types from verticals
import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
  ClientSearchFilters,
} from '../../verticals/client-demographics/types/client.js';

import type {
  CarePlan,
  TaskInstance,
  CreateCarePlanInput,
  UpdateCarePlanInput,
  CompleteTaskInput,
  CarePlanSearchFilters,
  TaskInstanceSearchFilters,
} from '../../verticals/care-plans/types/care-plan.js';

import type {
  Caregiver,
  CreateCaregiverInput,
  UpdateCaregiverInput,
  CaregiverSearchFilters,
} from '../../verticals/caregivers/types/caregiver.js';

import type {
  Invoice,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceSearchFilters,
} from '../../verticals/billing-invoicing/types/index.js';

import type {
  PayrollPeriod,
  CreatePayrollPeriodInput,
  ProcessPayrollInput,
  PayrollSearchFilters,
} from '../../verticals/payroll-processing/types/index.js';

import type {
  ShiftListing,
  ShiftApplication,
  CreateShiftListingInput,
  UpdateShiftListingInput,
  ShiftSearchFilters,
} from '../../verticals/shift-matching/types/index.js';

// Re-export types for external consumers
export type {
  Client,
  CreateClientInput,
  UpdateClientInput,
  ClientSearchFilters,
  CarePlan,
  TaskInstance,
  CreateCarePlanInput,
  UpdateCarePlanInput,
  CompleteTaskInput,
  CarePlanSearchFilters,
  TaskInstanceSearchFilters,
  Caregiver,
  CreateCaregiverInput,
  UpdateCaregiverInput,
  CaregiverSearchFilters,
  Invoice,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceSearchFilters,
  PayrollPeriod,
  CreatePayrollPeriodInput,
  ProcessPayrollInput,
  PayrollSearchFilters,
  ShiftListing,
  ShiftApplication,
  CreateShiftListingInput,
  UpdateShiftListingInput,
  ShiftSearchFilters,
};

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
