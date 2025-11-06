/**
 * Test Data Fixtures
 *
 * Reusable test data for E2E tests
 */

export interface TestUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  branchId: string;
  roles: string[];
  permissions: string[];
}

export interface TestClient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  phone: string;
  email: string;
  serviceAuthorization: string;
  authorizedHours: number;
}

export interface TestCaregiver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  certifications: string[];
  skillSets: string[];
  availability: string;
}

export interface TestVisit {
  id: string;
  clientId: string;
  caregiverId: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  status: string;
  tasks: string[];
  notes?: string;
}

/**
 * Test Users
 */
export const TEST_USERS: Record<string, TestUser> = {
  admin: {
    userId: 'admin-e2e-001',
    email: 'admin@e2e-test.com',
    firstName: 'Admin',
    lastName: 'User',
    organizationId: 'org-e2e-001',
    branchId: 'branch-e2e-001',
    roles: ['SUPER_ADMIN'],
    permissions: ['*:*'],
  },
  orgAdmin: {
    userId: 'org-admin-e2e-001',
    email: 'orgadmin@e2e-test.com',
    firstName: 'Org',
    lastName: 'Admin',
    organizationId: 'org-e2e-001',
    branchId: 'branch-e2e-001',
    roles: ['ORG_ADMIN'],
    permissions: [
      'organizations:*',
      'branches:*',
      'users:*',
      'clients:*',
      'caregivers:*',
      'visits:*',
      'evv:*',
      'billing:*',
    ],
  },
  coordinator: {
    userId: 'coord-e2e-001',
    email: 'coordinator@e2e-test.com',
    firstName: 'Care',
    lastName: 'Coordinator',
    organizationId: 'org-e2e-001',
    branchId: 'branch-e2e-001',
    roles: ['COORDINATOR'],
    permissions: [
      'clients:read',
      'clients:write',
      'caregivers:read',
      'caregivers:write',
      'visits:read',
      'visits:write',
      'evv:read',
      'evv:write',
      'care-plans:read',
      'care-plans:write',
      'scheduling:read',
      'scheduling:write',
    ],
  },
  caregiver: {
    userId: 'caregiver-e2e-001',
    email: 'caregiver@e2e-test.com',
    firstName: 'Jane',
    lastName: 'Caregiver',
    organizationId: 'org-e2e-001',
    branchId: 'branch-e2e-001',
    roles: ['CAREGIVER'],
    permissions: [
      'visits:read:own',
      'evv:write:own',
      'tasks:read:own',
      'tasks:write:own',
      'care-plans:read:assigned',
    ],
  },
  familyMember: {
    userId: 'family-e2e-001',
    email: 'family@e2e-test.com',
    firstName: 'Family',
    lastName: 'Member',
    organizationId: 'org-e2e-001',
    branchId: 'branch-e2e-001',
    roles: ['FAMILY_MEMBER'],
    permissions: ['family-portal:read', 'messages:write'],
  },
};

/**
 * Test Clients
 */
export const TEST_CLIENTS: Record<string, TestClient> = {
  johnDoe: {
    id: 'client-001',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1950-06-15',
    address: '123 Main St, Austin, TX 78701',
    phone: '512-555-0101',
    email: 'john.doe@example.com',
    serviceAuthorization: 'MEDICAID_WAIVER',
    authorizedHours: 20,
  },
  janeDoe: {
    id: 'client-002',
    firstName: 'Jane',
    lastName: 'Doe',
    dateOfBirth: '1945-03-20',
    address: '456 Oak Ave, Austin, TX 78702',
    phone: '512-555-0102',
    email: 'jane.doe@example.com',
    serviceAuthorization: 'MEDICARE',
    authorizedHours: 15,
  },
  bobSmith: {
    id: 'client-003',
    firstName: 'Bob',
    lastName: 'Smith',
    dateOfBirth: '1948-11-30',
    address: '789 Elm St, Austin, TX 78703',
    phone: '512-555-0103',
    email: 'bob.smith@example.com',
    serviceAuthorization: 'PRIVATE_PAY',
    authorizedHours: 30,
  },
  emilyJohnson: {
    id: 'client-004',
    firstName: 'Emily',
    lastName: 'Johnson',
    dateOfBirth: '1955-08-10',
    address: '321 Pine Rd, Austin, TX 78704',
    phone: '512-555-0104',
    email: 'emily.johnson@example.com',
    serviceAuthorization: 'MEDICAID_WAIVER',
    authorizedHours: 25,
  },
};

/**
 * Test Caregivers
 */
export const TEST_CAREGIVERS: Record<string, TestCaregiver> = {
  janeCaregiver: {
    id: 'caregiver-001',
    firstName: 'Jane',
    lastName: 'Caregiver',
    email: 'jane.caregiver@example.com',
    phone: '512-555-0201',
    certifications: ['CNA', 'CPR', 'First Aid'],
    skillSets: ['Personal Care', 'Medication Management', 'Meal Preparation'],
    availability: 'FULL_TIME',
  },
  tomCaregiver: {
    id: 'caregiver-002',
    firstName: 'Tom',
    lastName: 'Helper',
    email: 'tom.helper@example.com',
    phone: '512-555-0202',
    certifications: ['HHA', 'CPR'],
    skillSets: ['Personal Care', 'Companionship', 'Light Housekeeping'],
    availability: 'PART_TIME',
  },
  sarahCaregiver: {
    id: 'caregiver-003',
    firstName: 'Sarah',
    lastName: 'Nurse',
    email: 'sarah.nurse@example.com',
    phone: '512-555-0203',
    certifications: ['RN', 'CPR', 'BLS'],
    skillSets: ['Skilled Nursing', 'Medication Management', 'Wound Care'],
    availability: 'FULL_TIME',
  },
};

/**
 * Test Visits
 */
export const TEST_VISITS: Record<string, TestVisit> = {
  scheduledVisit: {
    id: 'visit-001',
    clientId: 'client-001',
    caregiverId: 'caregiver-001',
    serviceType: 'PERSONAL_CARE',
    scheduledDate: '2025-01-20',
    scheduledTime: '09:00',
    duration: 2,
    status: 'SCHEDULED',
    tasks: ['Assist with bathing', 'Medication reminder', 'Meal preparation'],
  },
  inProgressVisit: {
    id: 'visit-002',
    clientId: 'client-002',
    caregiverId: 'caregiver-001',
    serviceType: 'COMPANIONSHIP',
    scheduledDate: '2025-01-20',
    scheduledTime: '14:00',
    duration: 3,
    status: 'IN_PROGRESS',
    tasks: ['Conversation', 'Light exercise', 'Social activities'],
  },
  completedVisit: {
    id: 'visit-003',
    clientId: 'client-003',
    caregiverId: 'caregiver-002',
    serviceType: 'PERSONAL_CARE',
    scheduledDate: '2025-01-19',
    scheduledTime: '10:00',
    duration: 2,
    status: 'COMPLETED',
    tasks: ['Assist with bathing', 'Medication reminder'],
    notes: 'All tasks completed successfully',
  },
};

/**
 * GPS Coordinates for Testing
 */
export const TEST_GPS_COORDINATES = {
  austinTX: {
    latitude: 30.2672,
    longitude: -97.7431,
    accuracy: 10,
  },
  newYorkNY: {
    latitude: 40.7128,
    longitude: -74.006,
    accuracy: 10,
  },
  sanFranciscoCA: {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10,
  },
};

/**
 * Service Types
 */
export const SERVICE_TYPES = [
  'PERSONAL_CARE',
  'COMPANIONSHIP',
  'SKILLED_NURSING',
  'RESPITE_CARE',
  'HOMEMAKER',
] as const;

/**
 * Visit Statuses
 */
export const VISIT_STATUSES = [
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;

/**
 * Helper function to create custom test data
 */
export function createTestVisit(overrides: Partial<TestVisit> = {}): TestVisit {
  return {
    id: `visit-${Date.now()}`,
    clientId: 'client-001',
    caregiverId: 'caregiver-001',
    serviceType: 'PERSONAL_CARE',
    scheduledDate: '2025-01-20',
    scheduledTime: '09:00',
    duration: 2,
    status: 'SCHEDULED',
    tasks: ['Task 1', 'Task 2'],
    ...overrides,
  };
}

export function createTestClient(overrides: Partial<TestClient> = {}): TestClient {
  return {
    id: `client-${Date.now()}`,
    firstName: 'Test',
    lastName: 'Client',
    dateOfBirth: '1950-01-01',
    address: '123 Test St, Austin, TX 78701',
    phone: '512-555-0000',
    email: 'test@example.com',
    serviceAuthorization: 'MEDICAID_WAIVER',
    authorizedHours: 20,
    ...overrides,
  };
}

export function createTestCaregiver(overrides: Partial<TestCaregiver> = {}): TestCaregiver {
  return {
    id: `caregiver-${Date.now()}`,
    firstName: 'Test',
    lastName: 'Caregiver',
    email: 'test.caregiver@example.com',
    phone: '512-555-0000',
    certifications: ['CNA'],
    skillSets: ['Personal Care'],
    availability: 'FULL_TIME',
    ...overrides,
  };
}
