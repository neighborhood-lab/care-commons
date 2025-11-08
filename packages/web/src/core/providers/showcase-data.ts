/**
 * Showcase Demo Data
 *
 * Realistic demo data for the GitHub Pages showcase.
 * This data represents a realistic care coordination scenario.
 */

import type { User } from '../types/auth';

export interface DemoUser extends User {
  password: string; // Only for demo purposes
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'user-admin-1',
    email: 'admin@demo.care-commons.org',
    password: 'demo',
    name: 'Admin User',
    roles: ['ADMIN'],
    permissions: ['*'],
  },
  {
    id: 'user-coordinator-1',
    email: 'coordinator@demo.care-commons.org',
    password: 'demo',
    name: 'Care Coordinator',
    roles: ['COORDINATOR'],
    permissions: ['clients:read', 'clients:write', 'care-plans:read', 'care-plans:write', 'tasks:read', 'tasks:write'],
  },
  {
    id: 'user-caregiver-1',
    email: 'caregiver@demo.care-commons.org',
    password: 'demo',
    name: 'Sarah Johnson',
    roles: ['CAREGIVER'],
    permissions: ['tasks:read', 'shifts:read', 'evv:write'],
  },
  {
    id: 'user-billing-1',
    email: 'billing@demo.care-commons.org',
    password: 'demo',
    name: 'Billing Manager',
    roles: ['BILLING'],
    permissions: ['billing:read', 'billing:write', 'payroll:read', 'payroll:write'],
  },
  {
    id: 'user-family-1',
    email: 'family@carecommons.example',
    password: 'Family123!',
    name: 'Stein Family',
    roles: ['FAMILY'],
    permissions: ['clients:read', 'visits:read', 'care-plans:read', 'schedules:read'],
  },
];

export const DEMO_CLIENTS = [
  {
    id: 'client-1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1950-05-15',
    email: 'john.doe@example.com',
    phone: '555-0101',
    address: {
      street: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
    },
    medicaidId: 'TX-123456789',
    status: 'active',
    organizationId: 'org-1',
    assignedCoordinatorId: 'user-coordinator-1',
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-11-01').toISOString(),
  },
  {
    id: 'client-2',
    firstName: 'Mary',
    lastName: 'Smith',
    dateOfBirth: '1948-08-22',
    email: 'mary.smith@example.com',
    phone: '555-0102',
    address: {
      street: '456 Oak Ave',
      city: 'Austin',
      state: 'TX',
      zip: '78702',
    },
    medicaidId: 'TX-987654321',
    status: 'active',
    organizationId: 'org-1',
    assignedCoordinatorId: 'user-coordinator-1',
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date('2024-11-01').toISOString(),
  },
];

export const DEMO_CARE_PLANS = [
  {
    id: 'plan-1',
    clientId: 'client-1',
    title: 'Comprehensive Care Plan - John Doe',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-12-31',
    goals: [
      {
        id: 'goal-1',
        description: 'Maintain independence with daily living activities',
        targetDate: '2024-12-31',
        status: 'in_progress',
      },
      {
        id: 'goal-2',
        description: 'Improve mobility and reduce fall risk',
        targetDate: '2024-06-30',
        status: 'in_progress',
      },
    ],
    services: [
      {
        id: 'service-1',
        type: 'Personal Care',
        frequency: '5 days/week',
        duration: '2 hours',
        provider: 'Sarah Johnson',
      },
      {
        id: 'service-2',
        type: 'Meal Preparation',
        frequency: 'Daily',
        duration: '1 hour',
        provider: 'Sarah Johnson',
      },
    ],
    coordinatorId: 'user-coordinator-1',
    organizationId: 'org-1',
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-11-01').toISOString(),
  },
];

export const DEMO_TASKS = [
  {
    id: 'task-1',
    carePlanId: 'plan-1',
    clientId: 'client-1',
    title: 'Morning Personal Care',
    description: 'Assist with bathing, dressing, and grooming',
    status: 'pending',
    priority: 'high',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: 'user-caregiver-1',
    estimatedDuration: 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    carePlanId: 'plan-1',
    clientId: 'client-1',
    title: 'Lunch Preparation',
    description: 'Prepare nutritious lunch according to dietary plan',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: 'user-caregiver-1',
    estimatedDuration: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_SHIFTS = [
  {
    id: 'shift-1',
    clientId: 'client-1',
    clientName: 'John Doe',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '12:00',
    status: 'open',
    serviceType: 'Personal Care',
    requiredSkills: ['Personal Care', 'Meal Preparation'],
    hourlyRate: 18.50,
    location: {
      street: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
    },
    organizationId: 'org-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'shift-2',
    clientId: 'client-2',
    clientName: 'Mary Smith',
    date: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '18:00',
    status: 'open',
    serviceType: 'Companionship',
    requiredSkills: ['Companionship'],
    hourlyRate: 16.00,
    location: {
      street: '456 Oak Ave',
      city: 'Austin',
      state: 'TX',
      zip: '78702',
    },
    organizationId: 'org-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_EVV_RECORDS = [
  {
    id: 'evv-1',
    caregiverId: 'user-caregiver-1',
    caregiverName: 'Sarah Johnson',
    clientId: 'client-1',
    clientName: 'John Doe',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    clockIn: '08:00',
    clockOut: '12:00',
    totalHours: 4.0,
    serviceType: 'Personal Care',
    status: 'approved',
    location: {
      latitude: 30.2672,
      longitude: -97.7431,
    },
    notes: 'Assisted with morning routine, meal preparation, and light housekeeping.',
    organizationId: 'org-1',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const DEMO_INVOICES = [
  {
    id: 'invoice-1',
    invoiceNumber: 'INV-2024-001',
    clientId: 'client-1',
    clientName: 'John Doe',
    billingPeriod: {
      start: '2024-10-01',
      end: '2024-10-31',
    },
    status: 'paid',
    totalAmount: 1480.00,
    paidAmount: 1480.00,
    dueDate: '2024-11-15',
    lineItems: [
      {
        description: 'Personal Care Services',
        quantity: 80,
        unitPrice: 18.50,
        total: 1480.00,
      },
    ],
    organizationId: 'org-1',
    createdAt: new Date('2024-11-01').toISOString(),
    updatedAt: new Date('2024-11-01').toISOString(),
  },
];

export const DEMO_PAYROLL = [
  {
    id: 'payrun-1',
    payPeriod: {
      start: '2024-10-16',
      end: '2024-10-31',
    },
    status: 'processed',
    totalAmount: 5920.00,
    employeeCount: 4,
    processedDate: '2024-11-01',
    entries: [
      {
        employeeId: 'user-caregiver-1',
        employeeName: 'Sarah Johnson',
        regularHours: 80,
        overtimeHours: 0,
        regularRate: 18.50,
        overtimeRate: 27.75,
        grossPay: 1480.00,
        deductions: 222.00,
        netPay: 1258.00,
      },
    ],
    organizationId: 'org-1',
    createdAt: new Date('2024-11-01').toISOString(),
    updatedAt: new Date('2024-11-01').toISOString(),
  },
];

export interface ShowcaseData {
  users: DemoUser[];
  clients: any[];
  carePlans: any[];
  tasks: any[];
  shifts: any[];
  evvRecords: any[];
  invoices: any[];
  payroll: any[];
}

export const getInitialShowcaseData = (): ShowcaseData => ({
  users: [...DEMO_USERS],
  clients: [...DEMO_CLIENTS],
  carePlans: [...DEMO_CARE_PLANS],
  tasks: [...DEMO_TASKS],
  shifts: [...DEMO_SHIFTS],
  evvRecords: [...DEMO_EVV_RECORDS],
  invoices: [...DEMO_INVOICES],
  payroll: [...DEMO_PAYROLL],
});
