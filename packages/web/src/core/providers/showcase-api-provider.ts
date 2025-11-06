/**
 * Showcase API Provider
 * 
 * In-browser demo implementation without backend
 */


import type { ApiProvider } from './api-provider.interface';
import type { ApiClient } from '../services/api-client';
import type { AuthResponse, LoginCredentials, User } from '../types/auth';
import type { RequestConfig } from '../types/api';
import { getInitialShowcaseData, type ShowcaseData, type DemoUser } from './showcase-data';

const STORAGE_KEY = 'care-commons-showcase-data';
const AUTH_KEY = 'care-commons-showcase-auth';

export class ShowcaseApiProvider implements ApiProvider {
  private data: ShowcaseData;
  private currentUser: DemoUser | null = null;
  private autoLogin: boolean;
  private defaultRole: string;
  private persistData: boolean;

  constructor(options: {
    autoLogin?: boolean;
    defaultRole?: string;
    persistData?: boolean;
  } = {}) {
    this.autoLogin = options.autoLogin ?? true;
    this.defaultRole = options.defaultRole ?? 'coordinator';
    this.persistData = options.persistData ?? true;
    this.data = getInitialShowcaseData();
  }

  async initialize(): Promise<void> {
    // Load data from localStorage if persistence is enabled
    if (this.persistData) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          this.data = JSON.parse(stored);
        } catch (error) {
          console.warn('Failed to load showcase data from localStorage', error);
          this.data = getInitialShowcaseData();
        }
      }

      // Load auth state
      const authStored = localStorage.getItem(AUTH_KEY);
      if (authStored) {
        try {
          const auth = JSON.parse(authStored);
          this.currentUser = this.data.users.find(u => u.id === auth.userId) || null;
        } catch (error) {
          console.warn('Failed to load auth state', error);
        }
      }
    }

    // Auto-login if enabled and no user is logged in
    if (this.autoLogin && !this.currentUser) {
      const defaultUser = this.data.users.find(u => u.roles.includes(this.defaultRole as any)) || this.data.users[0];
      this.currentUser = defaultUser;
      this.saveAuthState();
    }
  }

  getApiClient(): ApiClient {
    return this.createMockApiClient();
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const user = this.data.users.find(
      u => u.email === credentials.email && u.password === credentials.password
    );

    if (!user) {
      throw {
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      };
    }

    this.currentUser = user;
    this.saveAuthState();

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      token: `demo-token-${user.id}`,
      user: userWithoutPassword,
    };
  }

  async getCurrentUser(): Promise<User> {
    if (!this.currentUser) {
      throw {
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED',
      };
    }

    const { password, ...userWithoutPassword } = this.currentUser;
    return userWithoutPassword;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    if (this.persistData) {
      localStorage.removeItem(AUTH_KEY);
    }
  }

  requiresAuth(): boolean {
    return !this.autoLogin;
  }

  getProviderName(): string {
    return 'Showcase Demo';
  }

  /**
   * Reset all data to initial state
   */
  resetData(): void {
    this.data = getInitialShowcaseData();
    this.saveData();
  }

  /**
   * Switch to a different user role
   */
  switchRole(role: string): void {
    const user = this.data.users.find(u => u.roles.includes(role as any));
    if (user) {
      this.currentUser = user;
      this.saveAuthState();
    }
  }

  private saveData(): void {
    if (this.persistData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }
  }

  private saveAuthState(): void {
    if (this.persistData && this.currentUser) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ userId: this.currentUser.id }));
    }
  }

  private createMockApiClient(): ApiClient {
    const mockClient: ApiClient = {
      get: async <T>(url: string, config?: RequestConfig): Promise<T> => {
        return this.handleRequest('GET', url, undefined, config) as Promise<T>;
      },
      post: async <T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> => {
        return this.handleRequest('POST', url, data, config) as Promise<T>;
      },
      patch: async <T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> => {
        return this.handleRequest('PATCH', url, data, config) as Promise<T>;
      },
      put: async <T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> => {
        return this.handleRequest('PUT', url, data, config) as Promise<T>;
      },
      delete: async <T>(url: string, config?: RequestConfig): Promise<T> => {
        return this.handleRequest('DELETE', url, undefined, config) as Promise<T>;
      },
    };

    return mockClient;
  }

  private async handleRequest(
    method: string,
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    // Route to appropriate handler
    if (url.includes('/api/auth/login')) {
      return this.handleLogin(data as LoginCredentials);
    }

    if (url.includes('/api/auth/me')) {
      return this.getCurrentUser();
    }

    if (url.includes('/api/auth/logout')) {
      return this.logout();
    }

    if (url.includes('/api/clients')) {
      return this.handleClientsEndpoint(method, url, data);
    }

    if (url.includes('/api/care-plans')) {
      return this.handleCarePlansEndpoint(method, url, data);
    }

    if (url.includes('/api/tasks')) {
      return this.handleTasksEndpoint(method, url, data);
    }

    if (url.includes('/api/shifts')) {
      return this.handleShiftsEndpoint(method, url, data);
    }

    if (url.includes('/api/evv-records')) {
      return this.handleEVVEndpoint(method, url, data);
    }

    if (url.includes('/api/invoices')) {
      return this.handleInvoicesEndpoint(method, url, data);
    }

    if (url.includes('/api/payroll')) {
      return this.handlePayrollEndpoint(method, url, data);
    }

    // Default: return empty success
    return { success: true };
  }

  private async handleLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.login(credentials);
  }

  private handleClientsEndpoint(method: string, url: string, data?: unknown): any {
    if (method === 'GET') {
      // Get single client
      const match = url.match(/\/api\/clients\/([^/]+)$/);
      if (match) {
        const id = match[1];
        const client = this.data.clients.find(c => c.id === id);
        if (!client) {
          throw { message: 'Client not found', code: 'NOT_FOUND' };
        }
        return client;
      }
      // List clients
      return this.data.clients;
    }

    if (method === 'POST') {
      const newClient = {
        id: `client-${Date.now()}`,
        ...data,
        organizationId: this.currentUser?.organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.clients.push(newClient);
      this.saveData();
      return newClient;
    }

    if (method === 'PATCH' || method === 'PUT') {
      const match = url.match(/\/api\/clients\/([^/]+)$/);
      if (match) {
        const id = match[1];
        const index = this.data.clients.findIndex(c => c.id === id);
        if (index === -1) {
          throw { message: 'Client not found', code: 'NOT_FOUND' };
        }
        this.data.clients[index] = {
          ...this.data.clients[index],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        this.saveData();
        return this.data.clients[index];
      }
    }

    if (method === 'DELETE') {
      const match = url.match(/\/api\/clients\/([^/]+)$/);
      if (match) {
        const id = match[1];
        const index = this.data.clients.findIndex(c => c.id === id);
        if (index === -1) {
          throw { message: 'Client not found', code: 'NOT_FOUND' };
        }
        this.data.clients.splice(index, 1);
        this.saveData();
        return { success: true };
      }
    }

    return { success: true };
  }

  private handleCarePlansEndpoint(method: string, url: string, data?: unknown): any {
    if (method === 'GET') {
      const match = url.match(/\/api\/care-plans\/([^/]+)$/);
      if (match) {
        const id = match[1];
        const plan = this.data.carePlans.find(p => p.id === id);
        if (!plan) {
          throw { message: 'Care plan not found', code: 'NOT_FOUND' };
        }
        return plan;
      }
      return this.data.carePlans;
    }

    if (method === 'POST') {
      const newPlan = {
        id: `plan-${Date.now()}`,
        ...data,
        organizationId: this.currentUser?.organizationId,
        coordinatorId: this.currentUser?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.carePlans.push(newPlan);
      this.saveData();
      return newPlan;
    }

    if (method === 'PATCH' || method === 'PUT') {
      const match = url.match(/\/api\/care-plans\/([^/]+)$/);
      if (match) {
        const id = match[1];
        const index = this.data.carePlans.findIndex(p => p.id === id);
        if (index === -1) {
          throw { message: 'Care plan not found', code: 'NOT_FOUND' };
        }
        this.data.carePlans[index] = {
          ...this.data.carePlans[index],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        this.saveData();
        return this.data.carePlans[index];
      }
    }

    return { success: true };
  }

  private handleTasksEndpoint(method: string, url: string, data?: unknown): any {
    if (method === 'GET') {
      const match = url.match(/\/api\/tasks\/([^/]+)$/);
      if (match) {
        const id = match[1];
        const task = this.data.tasks.find(t => t.id === id);
        if (!task) {
          throw { message: 'Task not found', code: 'NOT_FOUND' };
        }
        return task;
      }
      return this.data.tasks;
    }

    if (method === 'POST') {
      const newTask = {
        id: `task-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.tasks.push(newTask);
      this.saveData();
      return newTask;
    }

    if (method === 'PATCH' || method === 'PUT') {
      const match = url.match(/\/api\/tasks\/([^/]+)$/);
      if (match) {
        const id = match[1];
        const index = this.data.tasks.findIndex(t => t.id === id);
        if (index === -1) {
          throw { message: 'Task not found', code: 'NOT_FOUND' };
        }
        this.data.tasks[index] = {
          ...this.data.tasks[index],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        this.saveData();
        return this.data.tasks[index];
      }
    }

    return { success: true };
  }

  private handleShiftsEndpoint(method: string, url: string, data?: unknown): any {
    if (method === 'GET') {
      const match = url.match(/\/api\/shifts\/([^/]+)$/);
      if (match) {
        const id = match[1];
        const shift = this.data.shifts.find(s => s.id === id);
        if (!shift) {
          throw { message: 'Shift not found', code: 'NOT_FOUND' };
        }
        return shift;
      }
      return this.data.shifts;
    }

    if (method === 'POST') {
      const newShift = {
        id: `shift-${Date.now()}`,
        ...data,
        organizationId: this.currentUser?.organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.shifts.push(newShift);
      this.saveData();
      return newShift;
    }

    if (method === 'PATCH' || method === 'PUT') {
      const match = url.match(/\/api\/shifts\/([^/]+)$/);
      if (match) {
        const id = match[1];
        const index = this.data.shifts.findIndex(s => s.id === id);
        if (index === -1) {
          throw { message: 'Shift not found', code: 'NOT_FOUND' };
        }
        this.data.shifts[index] = {
          ...this.data.shifts[index],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        this.saveData();
        return this.data.shifts[index];
      }
    }

    return { success: true };
  }

  private handleEVVEndpoint(method: string, url: string, data?: unknown): any {
    if (method === 'GET') {
      const match = url.match(/\/api\/evv-records\/([^/]+)$/);
      if (match) {
        const id = match[1];
        const record = this.data.evvRecords.find(r => r.id === id);
        if (!record) {
          throw { message: 'EVV record not found', code: 'NOT_FOUND' };
        }
        return record;
      }
      return this.data.evvRecords;
    }

    if (method === 'POST') {
      const newRecord = {
        id: `evv-${Date.now()}`,
        ...data,
        organizationId: this.currentUser?.organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.evvRecords.push(newRecord);
      this.saveData();
      return newRecord;
    }

    return { success: true };
  }

  private handleInvoicesEndpoint(method: string, url: string, data?: unknown): any {
    if (method === 'GET') {
      const match = url.match(/\/api\/invoices\/([^/]+)$/);
      if (match) {
        const id = match[1];
        const invoice = this.data.invoices.find(i => i.id === id);
        if (!invoice) {
          throw { message: 'Invoice not found', code: 'NOT_FOUND' };
        }
        return invoice;
      }
      return this.data.invoices;
    }

    if (method === 'POST') {
      const newInvoice = {
        id: `invoice-${Date.now()}`,
        invoiceNumber: `INV-${Date.now()}`,
        ...data,
        organizationId: this.currentUser?.organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.invoices.push(newInvoice);
      this.saveData();
      return newInvoice;
    }

    return { success: true };
  }

  private handlePayrollEndpoint(method: string, url: string, data?: unknown): any {
    if (method === 'GET') {
      const match = url.match(/\/api\/payroll\/([^/]+)$/);
      if (match) {
        const id = match[1];
        const payrun = this.data.payroll.find(p => p.id === id);
        if (!payrun) {
          throw { message: 'Payroll not found', code: 'NOT_FOUND' };
        }
        return payrun;
      }
      return this.data.payroll;
    }

    if (method === 'POST') {
      const newPayrun = {
        id: `payrun-${Date.now()}`,
        ...data,
        organizationId: this.currentUser?.organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.payroll.push(newPayrun);
      this.saveData();
      return newPayrun;
    }

    return { success: true };
  }
}
