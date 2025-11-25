/**
 * Test Data Fixtures
 *
 * Reusable test data for E2E tests
 */

/**
 * E2E Test UUIDs
 * 
 * These are deterministic UUIDs for E2E testing. They use the UUID v4 format
 * but are fixed values so tests are reproducible.
 * 
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where y is 8, 9, a, or b
 */
export const E2E_UUIDS = {
  // Organizations
  ORG_E2E: '00000000-e2e0-4000-8000-000000000001',
  
  // Branches
  BRANCH_E2E: '00000000-e2e0-4000-8000-000000000010',
  
  // Users
  ADMIN_USER: '00000000-e2e0-4000-8000-000000000100',
  ORG_ADMIN_USER: '00000000-e2e0-4000-8000-000000000101',
  COORDINATOR_USER: '00000000-e2e0-4000-8000-000000000102',
  CAREGIVER_USER: '00000000-e2e0-4000-8000-000000000103',
  FAMILY_USER: '00000000-e2e0-4000-8000-000000000104',
  
  // Clients
  CLIENT_001: '00000000-e2e0-4000-8000-000000001001',
  CLIENT_002: '00000000-e2e0-4000-8000-000000001002',
  CLIENT_003: '00000000-e2e0-4000-8000-000000001003',
  CLIENT_004: '00000000-e2e0-4000-8000-000000001004',
  
  // Caregivers
  CAREGIVER_001: '00000000-e2e0-4000-8000-000000002001',
  CAREGIVER_002: '00000000-e2e0-4000-8000-000000002002',
  CAREGIVER_003: '00000000-e2e0-4000-8000-000000002003',
  
  // Visits
  VISIT_001: '00000000-e2e0-4000-8000-000000003001',
  VISIT_002: '00000000-e2e0-4000-8000-000000003002',
  VISIT_003: '00000000-e2e0-4000-8000-000000003003',
} as const;

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
    userId: E2E_UUIDS.ADMIN_USER,
    email: 'admin@e2e-test.com',
    firstName: 'Admin',
    lastName: 'User',
    organizationId: E2E_UUIDS.ORG_E2E,
    branchId: E2E_UUIDS.BRANCH_E2E,
    roles: ['SUPER_ADMIN'],
    permissions: ['*:*'],
  },
  orgAdmin: {
    userId: E2E_UUIDS.ORG_ADMIN_USER,
    email: 'orgadmin@e2e-test.com',
    firstName: 'Org',
    lastName: 'Admin',
    organizationId: E2E_UUIDS.ORG_E2E,
    branchId: E2E_UUIDS.BRANCH_E2E,
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
    userId: E2E_UUIDS.COORDINATOR_USER,
    email: 'coordinator@e2e-test.com',
    firstName: 'Care',
    lastName: 'Coordinator',
    organizationId: E2E_UUIDS.ORG_E2E,
    branchId: E2E_UUIDS.BRANCH_E2E,
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
    userId: E2E_UUIDS.CAREGIVER_USER,
    email: 'caregiver@e2e-test.com',
    firstName: 'Jane',
    lastName: 'Caregiver',
    organizationId: E2E_UUIDS.ORG_E2E,
    branchId: E2E_UUIDS.BRANCH_E2E,
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
    userId: E2E_UUIDS.FAMILY_USER,
    email: 'family@e2e-test.com',
    firstName: 'Family',
    lastName: 'Member',
    organizationId: E2E_UUIDS.ORG_E2E,
    branchId: E2E_UUIDS.BRANCH_E2E,
    roles: ['FAMILY_MEMBER'],
    permissions: ['family-portal:read', 'messages:write'],
  },
};

/**
 * Test Clients
 */
export const TEST_CLIENTS: Record<string, TestClient> = {
  johnDoe: {
    id: E2E_UUIDS.CLIENT_001,
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
    id: E2E_UUIDS.CLIENT_002,
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
    id: E2E_UUIDS.CLIENT_003,
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
    id: E2E_UUIDS.CLIENT_004,
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
    id: E2E_UUIDS.CAREGIVER_001,
    firstName: 'Jane',
    lastName: 'Caregiver',
    email: 'jane.caregiver@example.com',
    phone: '512-555-0201',
    certifications: ['CNA', 'CPR', 'First Aid'],
    skillSets: ['Personal Care', 'Medication Management', 'Meal Preparation'],
    availability: 'FULL_TIME',
  },
  tomCaregiver: {
    id: E2E_UUIDS.CAREGIVER_002,
    firstName: 'Tom',
    lastName: 'Helper',
    email: 'tom.helper@example.com',
    phone: '512-555-0202',
    certifications: ['HHA', 'CPR'],
    skillSets: ['Personal Care', 'Companionship', 'Light Housekeeping'],
    availability: 'PART_TIME',
  },
  sarahCaregiver: {
    id: E2E_UUIDS.CAREGIVER_003,
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
    id: E2E_UUIDS.VISIT_001,
    clientId: E2E_UUIDS.CLIENT_001,
    caregiverId: E2E_UUIDS.CAREGIVER_001,
    serviceType: 'PERSONAL_CARE',
    scheduledDate: '2025-01-20',
    scheduledTime: '09:00',
    duration: 2,
    status: 'SCHEDULED',
    tasks: ['Assist with bathing', 'Medication reminder', 'Meal preparation'],
  },
  inProgressVisit: {
    id: E2E_UUIDS.VISIT_002,
    clientId: E2E_UUIDS.CLIENT_002,
    caregiverId: E2E_UUIDS.CAREGIVER_001,
    serviceType: 'COMPANIONSHIP',
    scheduledDate: '2025-01-20',
    scheduledTime: '14:00',
    duration: 3,
    status: 'IN_PROGRESS',
    tasks: ['Conversation', 'Light exercise', 'Social activities'],
  },
  completedVisit: {
    id: E2E_UUIDS.VISIT_003,
    clientId: E2E_UUIDS.CLIENT_003,
    caregiverId: E2E_UUIDS.CAREGIVER_002,
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
