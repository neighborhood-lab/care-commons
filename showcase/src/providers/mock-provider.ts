/**
 * Mock Data Provider
 *
 * In-memory data provider with localStorage persistence for writes.
 * Perfect for static site deployments like GitHub Pages.
 *
 * Features:
 * - Seeded with comprehensive demo data
 * - Writes are persisted to localStorage
 * - Simulates realistic API delays
 * - Supports filtering, pagination, and search
 */

import type { PaginatedResult, SearchParams } from '@/core/types/api';
import type { DataProvider } from '@/core/providers/types';
import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
  ClientSearchFilters,
} from '@/verticals/client-demographics/types';
import type {
  CarePlan,
  TaskInstance,
  CreateCarePlanInput,
  UpdateCarePlanInput,
  CompleteTaskInput,
  CarePlanSearchFilters,
  TaskInstanceSearchFilters,
} from '@/verticals/care-plans/types';
import type {
  Caregiver,
  CreateCaregiverInput,
  UpdateCaregiverInput,
  CaregiverSearchFilters,
} from '@/verticals/caregivers/types';
import type {
  Invoice,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceSearchFilters,
} from '@/verticals/billing-invoicing/types';
import type {
  PayrollPeriod,
  CreatePayrollPeriodInput,
  ProcessPayrollInput,
  PayrollSearchFilters,
} from '@/verticals/payroll-processing/types';
import type {
  ShiftListing,
  ShiftApplication,
  CreateShiftListingInput,
  UpdateShiftListingInput,
  ShiftSearchFilters,
} from '@/verticals/shift-matching/types';

const STORAGE_KEY = 'care-commons-showcase-data';
const SIMULATE_DELAY = 100; // ms

interface MockDataStore {
  clients: Client[];
  carePlans: CarePlan[];
  tasks: TaskInstance[];
  caregivers: Caregiver[];
  invoices: Invoice[];
  payrollPeriods: PayrollPeriod[];
  shiftListings: ShiftListing[];
  shiftApplications: ShiftApplication[];
}

/**
 * Simulates network delay
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates a unique ID
 */
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

/**
 * Generic pagination helper
 */
function paginate<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 20
): PaginatedResult<T> {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    items: paginatedItems,
    total: items.length,
    page,
    pageSize,
    hasMore: endIndex < items.length,
  };
}

/**
 * Generic search helper
 */
function searchItems<T extends Record<string, unknown>>(
  items: T[],
  query: string,
  searchFields: (keyof T)[]
): T[] {
  if (!query) return items;

  const lowerQuery = query.toLowerCase();
  return items.filter(item =>
    searchFields.some(field => {
      const value = item[field];
      return String(value).toLowerCase().includes(lowerQuery);
    })
  );
}

/**
 * Creates a mock data provider
 */
export const createMockProvider = (seedData: MockDataStore): DataProvider => {
  // Initialize store from localStorage or seed data
  let store: MockDataStore = { ...seedData };

  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        store = { ...seedData, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  };

  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  };

  // Load initial data
  loadFromStorage();

  return {
    name: 'Mock Provider',
    type: 'mock',

    // Client operations
    async getClients(filters?: ClientSearchFilters & SearchParams): Promise<PaginatedResult<Client>> {
      await delay(SIMULATE_DELAY);

      let results = [...store.clients];

      // Apply search
      if (filters?.query) {
        results = searchItems(results, filters.query, ['firstName', 'lastName', 'email', 'phone']);
      }

      // Apply status filter
      if (filters?.status && filters.status.length > 0) {
        results = results.filter(c => filters.status?.includes(c.status));
      }

      // Apply city filter
      if (filters?.city) {
        results = results.filter(c => c.primaryAddress.city === filters.city);
      }

      // Apply state filter
      if (filters?.state) {
        results = results.filter(c => c.primaryAddress.stateCode === filters.state);
      }

      // Apply sorting
      if (filters?.sortBy) {
        const sortField = filters.sortBy as keyof Client;
        const direction = filters.sortDirection === 'desc' ? -1 : 1;
        results.sort((a, b) => {
          const aVal = a[sortField];
          const bVal = b[sortField];
          if (aVal < bVal) return -1 * direction;
          if (aVal > bVal) return 1 * direction;
          return 0;
        });
      }

      return paginate(results, filters?.page, filters?.pageSize);
    },

    async getClientById(id: string): Promise<Client> {
      await delay(SIMULATE_DELAY);
      const client = store.clients.find(c => c.id === id);
      if (!client) throw new Error(`Client ${id} not found`);
      return client;
    },

    async createClient(input: CreateClientInput): Promise<Client> {
      await delay(SIMULATE_DELAY);
      const newClient: Client = {
        id: generateId(),
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.clients.push(newClient);
      saveToStorage();
      return newClient;
    },

    async updateClient(id: string, input: UpdateClientInput): Promise<Client> {
      await delay(SIMULATE_DELAY);
      const index = store.clients.findIndex(c => c.id === id);
      if (index === -1) throw new Error(`Client ${id} not found`);

      store.clients[index] = {
        ...store.clients[index],
        ...input,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage();
      return store.clients[index];
    },

    async deleteClient(id: string): Promise<void> {
      await delay(SIMULATE_DELAY);
      const index = store.clients.findIndex(c => c.id === id);
      if (index === -1) throw new Error(`Client ${id} not found`);

      store.clients.splice(index, 1);
      saveToStorage();
    },

    // Care Plan operations
    async getCarePlans(filters?: CarePlanSearchFilters & SearchParams): Promise<PaginatedResult<CarePlan>> {
      await delay(SIMULATE_DELAY);

      let results = [...store.carePlans];

      // Apply search
      if (filters?.query) {
        results = searchItems(results, filters.query, ['name', 'description']);
      }

      // Apply client filter
      if (filters?.clientId) {
        results = results.filter(cp => cp.clientId === filters.clientId);
      }

      // Apply status filter
      if (filters?.status && filters.status.length > 0) {
        results = results.filter(cp => filters.status?.includes(cp.status));
      }

      // Apply plan type filter
      if (filters?.planType && filters.planType.length > 0) {
        results = results.filter(cp => filters.planType?.includes(cp.planType));
      }

      // Apply coordinator filter
      if (filters?.coordinatorId) {
        results = results.filter(cp => cp.coordinatorId === filters.coordinatorId);
      }

      // Apply expiring filter
      if (filters?.expiringWithinDays) {
        const daysFromNow = new Date();
        daysFromNow.setDate(daysFromNow.getDate() + filters.expiringWithinDays);
        results = results.filter(cp =>
          cp.endDate && new Date(cp.endDate) <= daysFromNow
        );
      }

      // Apply compliance status filter
      if (filters?.complianceStatus && filters.complianceStatus.length > 0) {
        results = results.filter(cp => filters.complianceStatus?.includes(cp.complianceStatus));
      }

      return paginate(results, filters?.page, filters?.pageSize);
    },

    async getCarePlanById(id: string): Promise<CarePlan> {
      await delay(SIMULATE_DELAY);
      const carePlan = store.carePlans.find(cp => cp.id === id);
      if (!carePlan) throw new Error(`Care plan ${id} not found`);
      return carePlan;
    },

    async createCarePlan(input: CreateCarePlanInput): Promise<CarePlan> {
      await delay(SIMULATE_DELAY);
      const newCarePlan: CarePlan = {
        id: generateId(),
        ...input,
        status: 'DRAFT',
        complianceStatus: 'PENDING_REVIEW',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as CarePlan;
      store.carePlans.push(newCarePlan);
      saveToStorage();
      return newCarePlan;
    },

    async updateCarePlan(id: string, input: UpdateCarePlanInput): Promise<CarePlan> {
      await delay(SIMULATE_DELAY);
      const index = store.carePlans.findIndex(cp => cp.id === id);
      if (index === -1) throw new Error(`Care plan ${id} not found`);

      store.carePlans[index] = {
        ...store.carePlans[index],
        ...input,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage();
      return store.carePlans[index];
    },

    async activateCarePlan(id: string): Promise<CarePlan> {
      await delay(SIMULATE_DELAY);
      const index = store.carePlans.findIndex(cp => cp.id === id);
      if (index === -1) throw new Error(`Care plan ${id} not found`);

      store.carePlans[index] = {
        ...store.carePlans[index],
        status: 'ACTIVE',
        updatedAt: new Date().toISOString(),
      };
      saveToStorage();
      return store.carePlans[index];
    },

    // Task operations
    async getTasks(filters?: TaskInstanceSearchFilters & SearchParams): Promise<PaginatedResult<TaskInstance>> {
      await delay(SIMULATE_DELAY);

      let results = [...store.tasks];

      // Apply filters
      if (filters?.carePlanId) {
        results = results.filter(t => t.carePlanId === filters.carePlanId);
      }
      if (filters?.clientId) {
        results = results.filter(t => t.clientId === filters.clientId);
      }
      if (filters?.assignedCaregiverId) {
        results = results.filter(t => t.assignedCaregiverId === filters.assignedCaregiverId);
      }
      if (filters?.status && filters.status.length > 0) {
        results = results.filter(t => filters.status?.includes(t.status));
      }
      if (filters?.category && filters.category.length > 0) {
        results = results.filter(t => filters.category?.includes(t.category));
      }
      if (filters?.scheduledDateFrom) {
        results = results.filter(t => t.scheduledStartTime >= filters.scheduledDateFrom!);
      }
      if (filters?.scheduledDateTo) {
        results = results.filter(t => t.scheduledEndTime <= filters.scheduledDateTo!);
      }
      if (filters?.overdue) {
        const now = new Date().toISOString();
        results = results.filter(t => t.scheduledEndTime < now && t.status !== 'COMPLETED');
      }

      return paginate(results, filters?.page, filters?.pageSize);
    },

    async getTaskById(id: string): Promise<TaskInstance> {
      await delay(SIMULATE_DELAY);
      const task = store.tasks.find(t => t.id === id);
      if (!task) throw new Error(`Task ${id} not found`);
      return task;
    },

    async completeTask(id: string, input: CompleteTaskInput): Promise<TaskInstance> {
      await delay(SIMULATE_DELAY);
      const index = store.tasks.findIndex(t => t.id === id);
      if (index === -1) throw new Error(`Task ${id} not found`);

      store.tasks[index] = {
        ...store.tasks[index],
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        completionNotes: input.notes,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage();
      return store.tasks[index];
    },

    // Caregiver operations
    async getCaregivers(filters?: CaregiverSearchFilters & SearchParams): Promise<PaginatedResult<Caregiver>> {
      await delay(SIMULATE_DELAY);

      let results = [...store.caregivers];

      if (filters?.query) {
        results = searchItems(results, filters.query, ['firstName', 'lastName', 'email', 'phone']);
      }

      if (filters?.status && filters.status.length > 0) {
        results = results.filter(c => filters.status?.includes(c.status));
      }

      return paginate(results, filters?.page, filters?.pageSize);
    },

    async getCaregiverById(id: string): Promise<Caregiver> {
      await delay(SIMULATE_DELAY);
      const caregiver = store.caregivers.find(c => c.id === id);
      if (!caregiver) throw new Error(`Caregiver ${id} not found`);
      return caregiver;
    },

    async createCaregiver(input: CreateCaregiverInput): Promise<Caregiver> {
      await delay(SIMULATE_DELAY);
      const newCaregiver: Caregiver = {
        id: generateId(),
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Caregiver;
      store.caregivers.push(newCaregiver);
      saveToStorage();
      return newCaregiver;
    },

    async updateCaregiver(id: string, input: UpdateCaregiverInput): Promise<Caregiver> {
      await delay(SIMULATE_DELAY);
      const index = store.caregivers.findIndex(c => c.id === id);
      if (index === -1) throw new Error(`Caregiver ${id} not found`);

      store.caregivers[index] = {
        ...store.caregivers[index],
        ...input,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage();
      return store.caregivers[index];
    },

    async deleteCaregiver(id: string): Promise<void> {
      await delay(SIMULATE_DELAY);
      store.caregivers = store.caregivers.filter(c => c.id !== id);
      saveToStorage();
    },

    // Billing operations
    async getInvoices(filters?: InvoiceSearchFilters & SearchParams): Promise<PaginatedResult<Invoice>> {
      await delay(SIMULATE_DELAY);
      let results = [...store.invoices];

      if (filters?.query) {
        results = searchItems(results, filters.query, ['invoiceNumber']);
      }

      return paginate(results, filters?.page, filters?.pageSize);
    },

    async getInvoiceById(id: string): Promise<Invoice> {
      await delay(SIMULATE_DELAY);
      const invoice = store.invoices.find(i => i.id === id);
      if (!invoice) throw new Error(`Invoice ${id} not found`);
      return invoice;
    },

    async createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
      await delay(SIMULATE_DELAY);
      const newInvoice: Invoice = {
        id: generateId(),
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Invoice;
      store.invoices.push(newInvoice);
      saveToStorage();
      return newInvoice;
    },

    async updateInvoice(id: string, input: UpdateInvoiceInput): Promise<Invoice> {
      await delay(SIMULATE_DELAY);
      const index = store.invoices.findIndex(i => i.id === id);
      if (index === -1) throw new Error(`Invoice ${id} not found`);

      store.invoices[index] = {
        ...store.invoices[index],
        ...input,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage();
      return store.invoices[index];
    },

    async deleteInvoice(id: string): Promise<void> {
      await delay(SIMULATE_DELAY);
      store.invoices = store.invoices.filter(i => i.id !== id);
      saveToStorage();
    },

    // Payroll operations
    async getPayrollPeriods(filters?: PayrollSearchFilters & SearchParams): Promise<PaginatedResult<PayrollPeriod>> {
      await delay(SIMULATE_DELAY);
      return paginate(store.payrollPeriods, filters?.page, filters?.pageSize);
    },

    async getPayrollPeriodById(id: string): Promise<PayrollPeriod> {
      await delay(SIMULATE_DELAY);
      const period = store.payrollPeriods.find(p => p.id === id);
      if (!period) throw new Error(`Payroll period ${id} not found`);
      return period;
    },

    async createPayrollPeriod(input: CreatePayrollPeriodInput): Promise<PayrollPeriod> {
      await delay(SIMULATE_DELAY);
      const newPeriod: PayrollPeriod = {
        id: generateId(),
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as PayrollPeriod;
      store.payrollPeriods.push(newPeriod);
      saveToStorage();
      return newPeriod;
    },

    async processPayroll(id: string, input: ProcessPayrollInput): Promise<PayrollPeriod> {
      await delay(SIMULATE_DELAY);
      const index = store.payrollPeriods.findIndex(p => p.id === id);
      if (index === -1) throw new Error(`Payroll period ${id} not found`);

      store.payrollPeriods[index] = {
        ...store.payrollPeriods[index],
        ...input,
        status: 'PROCESSED',
        updatedAt: new Date().toISOString(),
      } as PayrollPeriod;
      saveToStorage();
      return store.payrollPeriods[index];
    },

    // Shift Matching operations
    async getShiftListings(filters?: ShiftSearchFilters & SearchParams): Promise<PaginatedResult<ShiftListing>> {
      await delay(SIMULATE_DELAY);
      let results = [...store.shiftListings];

      if (filters?.query) {
        results = searchItems(results, filters.query, ['title', 'description']);
      }

      return paginate(results, filters?.page, filters?.pageSize);
    },

    async getShiftListingById(id: string): Promise<ShiftListing> {
      await delay(SIMULATE_DELAY);
      const shift = store.shiftListings.find(s => s.id === id);
      if (!shift) throw new Error(`Shift listing ${id} not found`);
      return shift;
    },

    async createShiftListing(input: CreateShiftListingInput): Promise<ShiftListing> {
      await delay(SIMULATE_DELAY);
      const newShift: ShiftListing = {
        id: generateId(),
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as ShiftListing;
      store.shiftListings.push(newShift);
      saveToStorage();
      return newShift;
    },

    async updateShiftListing(id: string, input: UpdateShiftListingInput): Promise<ShiftListing> {
      await delay(SIMULATE_DELAY);
      const index = store.shiftListings.findIndex(s => s.id === id);
      if (index === -1) throw new Error(`Shift listing ${id} not found`);

      store.shiftListings[index] = {
        ...store.shiftListings[index],
        ...input,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage();
      return store.shiftListings[index];
    },

    async getApplicationsForShift(shiftId: string): Promise<ShiftApplication[]> {
      await delay(SIMULATE_DELAY);
      return store.shiftApplications.filter(app => app.shiftListingId === shiftId);
    },

    async applyToShift(shiftId: string, caregiverId: string): Promise<ShiftApplication> {
      await delay(SIMULATE_DELAY);
      const newApplication: ShiftApplication = {
        id: generateId(),
        shiftListingId: shiftId,
        caregiverId,
        status: 'PENDING',
        appliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as ShiftApplication;
      store.shiftApplications.push(newApplication);
      saveToStorage();
      return newApplication;
    },
  };
};
