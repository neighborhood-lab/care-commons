/**
 * Payroll Service
 *
 * Manages caregiver payment settings including direct deposit information.
 * Features:
 * - View and update bank account details
 * - Payment history and upcoming payments
 * - Tax document access
 * - Pay stubs viewing
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PAYMENT_SETTINGS_KEY = 'payment_settings';
const PAY_HISTORY_KEY = 'pay_history';

export type AccountType = 'CHECKING' | 'SAVINGS';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export interface BankAccount {
  id: string;
  bankName: string;
  accountType: AccountType;
  routingNumber: string; // Last 4 only for display
  accountNumber: string; // Last 4 only for display
  isPrimary: boolean;
  isVerified: boolean;
  addedAt: Date;
}

export interface DirectDepositSettings {
  isEnrolled: boolean;
  accounts: BankAccount[];
  splitPayment: boolean;
  primaryAccountPercentage?: number;
}

export interface PayPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  payDate: Date;
  status: PaymentStatus;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  hoursWorked: number;
  regularHours: number;
  overtimeHours: number;
  regularRate: number;
  overtimeRate: number;
  visits: number;
}

export interface TaxDocument {
  id: string;
  type: 'W2' | 'W4' | '1099';
  year: number;
  issuedAt: Date;
  downloadUrl?: string;
}

export interface PayrollSummary {
  ytdGross: number;
  ytdNet: number;
  ytdDeductions: number;
  ytdHours: number;
  lastPayDate: Date | null;
  nextPayDate: Date | null;
  nextPayAmount: number | null;
}

class PayrollService {
  private settings: DirectDepositSettings | null = null;
  private payHistory: PayPeriod[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const storedSettings = await AsyncStorage.getItem(PAYMENT_SETTINGS_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        this.settings = {
          ...parsed,
          accounts: parsed.accounts.map((a: BankAccount) => ({
            ...a,
            addedAt: new Date(a.addedAt),
          })),
        };
      }

      const storedHistory = await AsyncStorage.getItem(PAY_HISTORY_KEY);
      if (storedHistory) {
        this.payHistory = JSON.parse(storedHistory).map((p: PayPeriod) => ({
          ...p,
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate),
          payDate: new Date(p.payDate),
        }));
      }

      if (!this.settings) {
        await this.loadMockData();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize payroll service:', error);
      await this.loadMockData();
      this.initialized = true;
    }
  }

  private async loadMockData(): Promise<void> {
    this.settings = {
      isEnrolled: true,
      accounts: [
        {
          id: 'acct-1',
          bankName: 'Chase Bank',
          accountType: 'CHECKING',
          routingNumber: '****1234',
          accountNumber: '****5678',
          isPrimary: true,
          isVerified: true,
          addedAt: new Date('2024-03-15'),
        },
      ],
      splitPayment: false,
    };

    // Generate mock pay history
    const now = new Date();
    this.payHistory = [];

    for (let i = 0; i < 6; i++) {
      const payDate = new Date(now);
      payDate.setDate(payDate.getDate() - i * 14); // Bi-weekly

      const endDate = new Date(payDate);
      endDate.setDate(endDate.getDate() - 3);

      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 13);

      const regularHours = 70 + Math.floor(Math.random() * 10);
      const overtimeHours = Math.floor(Math.random() * 5);
      const regularRate = 18.5;
      const overtimeRate = regularRate * 1.5;
      const grossAmount = regularHours * regularRate + overtimeHours * overtimeRate;
      const deductions = grossAmount * 0.22; // ~22% for taxes/benefits
      const netAmount = grossAmount - deductions;

      this.payHistory.push({
        id: `pay-${i}`,
        startDate,
        endDate,
        payDate,
        status: i === 0 ? 'PENDING' : 'COMPLETED',
        grossAmount,
        deductions,
        netAmount,
        hoursWorked: regularHours + overtimeHours,
        regularHours,
        overtimeHours,
        regularRate,
        overtimeRate,
        visits: 15 + Math.floor(Math.random() * 5),
      });
    }

    await this.saveToStorage();
  }

  private async saveToStorage(): Promise<void> {
    try {
      if (this.settings) {
        await AsyncStorage.setItem(PAYMENT_SETTINGS_KEY, JSON.stringify(this.settings));
      }
      await AsyncStorage.setItem(PAY_HISTORY_KEY, JSON.stringify(this.payHistory));
    } catch (error) {
      console.error('Failed to save payroll data:', error);
    }
  }

  async getDirectDepositSettings(): Promise<DirectDepositSettings> {
    await this.initialize();
    return this.settings || {
      isEnrolled: false,
      accounts: [],
      splitPayment: false,
    };
  }

  async getPayHistory(): Promise<PayPeriod[]> {
    await this.initialize();
    return [...this.payHistory].sort(
      (a, b) => b.payDate.getTime() - a.payDate.getTime()
    );
  }

  async getPayrollSummary(): Promise<PayrollSummary> {
    await this.initialize();

    const currentYear = new Date().getFullYear();
    const ytdPayments = this.payHistory.filter(
      (p) => p.payDate.getFullYear() === currentYear && p.status === 'COMPLETED'
    );

    const ytdGross = ytdPayments.reduce((sum, p) => sum + p.grossAmount, 0);
    const ytdNet = ytdPayments.reduce((sum, p) => sum + p.netAmount, 0);
    const ytdDeductions = ytdPayments.reduce((sum, p) => sum + p.deductions, 0);
    const ytdHours = ytdPayments.reduce((sum, p) => sum + p.hoursWorked, 0);

    const completedPayments = this.payHistory.filter((p) => p.status === 'COMPLETED');
    const pendingPayments = this.payHistory.filter((p) => p.status === 'PENDING');

    return {
      ytdGross,
      ytdNet,
      ytdDeductions,
      ytdHours,
      lastPayDate: completedPayments.length > 0 ? completedPayments[0].payDate : null,
      nextPayDate: pendingPayments.length > 0 ? pendingPayments[0].payDate : null,
      nextPayAmount: pendingPayments.length > 0 ? pendingPayments[0].netAmount : null,
    };
  }

  async addBankAccount(
    bankName: string,
    accountType: AccountType,
    routingNumber: string,
    accountNumber: string,
    makePrimary: boolean
  ): Promise<BankAccount> {
    await this.initialize();

    if (!this.settings) {
      this.settings = {
        isEnrolled: true,
        accounts: [],
        splitPayment: false,
      };
    }

    // Mask numbers for storage (only store last 4)
    const maskedRouting = '****' + routingNumber.slice(-4);
    const maskedAccount = '****' + accountNumber.slice(-4);

    const newAccount: BankAccount = {
      id: `acct-${Date.now()}`,
      bankName,
      accountType,
      routingNumber: maskedRouting,
      accountNumber: maskedAccount,
      isPrimary: makePrimary || this.settings.accounts.length === 0,
      isVerified: false, // Would be verified via micro-deposits in real implementation
      addedAt: new Date(),
    };

    if (makePrimary) {
      this.settings.accounts = this.settings.accounts.map((a) => ({
        ...a,
        isPrimary: false,
      }));
    }

    this.settings.accounts.push(newAccount);
    this.settings.isEnrolled = true;

    await this.saveToStorage();
    return newAccount;
  }

  async removeBankAccount(accountId: string): Promise<void> {
    await this.initialize();

    if (!this.settings) return;

    const accountToRemove = this.settings.accounts.find((a) => a.id === accountId);
    this.settings.accounts = this.settings.accounts.filter((a) => a.id !== accountId);

    // If removed account was primary, make another one primary
    if (accountToRemove?.isPrimary && this.settings.accounts.length > 0) {
      this.settings.accounts[0].isPrimary = true;
    }

    if (this.settings.accounts.length === 0) {
      this.settings.isEnrolled = false;
    }

    await this.saveToStorage();
  }

  async setPrimaryAccount(accountId: string): Promise<void> {
    await this.initialize();

    if (!this.settings) return;

    this.settings.accounts = this.settings.accounts.map((a) => ({
      ...a,
      isPrimary: a.id === accountId,
    }));

    await this.saveToStorage();
  }

  async getTaxDocuments(): Promise<TaxDocument[]> {
    await this.initialize();

    // Mock tax documents
    const currentYear = new Date().getFullYear();
    return [
      {
        id: 'doc-1',
        type: 'W2',
        year: currentYear - 1,
        issuedAt: new Date(`${currentYear}-01-31`),
      },
      {
        id: 'doc-2',
        type: 'W4',
        year: currentYear,
        issuedAt: new Date(`${currentYear}-03-15`),
      },
    ];
  }
}

// Singleton instance
export const payrollService = new PayrollService();

// Helper functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatHours(hours: number): string {
  return `${hours.toFixed(1)} hrs`;
}

export function getPaymentStatusInfo(status: PaymentStatus): {
  label: string;
  color: string;
  badgeVariant: 'success' | 'warning' | 'danger' | 'secondary';
} {
  switch (status) {
    case 'COMPLETED':
      return { label: 'Paid', color: '#10B981', badgeVariant: 'success' };
    case 'PROCESSING':
      return { label: 'Processing', color: '#F59E0B', badgeVariant: 'warning' };
    case 'PENDING':
      return { label: 'Upcoming', color: '#3B82F6', badgeVariant: 'secondary' };
    case 'FAILED':
      return { label: 'Failed', color: '#EF4444', badgeVariant: 'danger' };
    default:
      return { label: 'Unknown', color: '#6B7280', badgeVariant: 'secondary' };
  }
}
