/**
 * Demo Database Seeding Script
 *
 * Seeds comprehensive realistic demo data covering all states, roles, and features:
 * - 60 clients across TX, FL, OH (various demographics, conditions, care needs)
 * - 35 caregivers with certifications, specializations, varied roles
 * - 600+ visits (past, present, future) with full EVV data
 * - 50+ care plans with tasks and goals
 * - 40+ family members with portal access
 * - Billing and invoicing data
 * - Complete workflow demonstrations
 *
 * This is THE comprehensive demo - covers everything with realistic, useful fake data.
 *
 * Usage: npm run db:seed:demo
 *
 * PREREQUISITE: Run `npm run db:seed` first to create org, branch, and admin user.
 */

import { config as dotenvConfig } from "dotenv";
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';
import { Database, DatabaseConfig } from '../src/db/connection.js';
import { Pool, PoolClient } from 'pg';
import { PasswordUtils } from '../src/utils/password-utils.js';

dotenvConfig({ path: '.env', quiet: true });

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const SEED_CONFIG = {
  clients: 60,        // 20 per state (TX, FL, OH)
  caregivers: 35,     // Mix of CNAs, HHAs, companions
  visits: 600,        // ~10 visits per client
  carePlans: 50,      // ~83% of clients have care plans
  familyMembers: 40,  // ~67% of clients have family portal access
};

// All 50 US States + DC
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
] as const;

// Role definitions for state-specific users
interface RoleDefinition {
  value: string;
  label: string;
  roles: string[];
  permissions: string[];
}

const ROLES: RoleDefinition[] = [
  {
    value: 'ADMIN',
    label: 'Administrator',
    roles: ['SUPER_ADMIN'],
    permissions: [
      'organizations:*', 'users:*', 'clients:*', 'caregivers:*',
      'visits:*', 'schedules:*', 'care-plans:*', 'tasks:*', 'billing:*',
      'reports:*', 'settings:*'
    ]
  },
  {
    value: 'COORDINATOR',
    label: 'Care Coordinator',
    roles: ['COORDINATOR', 'SCHEDULER'],
    permissions: [
      'clients:create', 'clients:read', 'clients:update',
      'caregivers:read', 'caregivers:assign',
      'visits:create', 'visits:read', 'visits:update', 'visits:delete',
      'schedules:create', 'schedules:read', 'schedules:update', 'schedules:delete',
      'care-plans:create', 'care-plans:read', 'care-plans:update',
      'tasks:create', 'tasks:read', 'tasks:update',
      'reports:read', 'reports:generate'
    ]
  },
  {
    value: 'CAREGIVER',
    label: 'Caregiver',
    roles: ['CAREGIVER'],
    permissions: [
      'clients:read', 'visits:read', 'visits:clock-in', 'visits:clock-out',
      'visits:update', 'care-plans:read', 'tasks:read', 'tasks:update'
    ]
  },
  {
    value: 'FAMILY',
    label: 'Family Member',
    roles: ['FAMILY'],
    permissions: [
      'clients:read', 'visits:read', 'care-plans:read', 'tasks:read', 'schedules:read',
      'family-portal:view', 'notifications:view', 'messages:view', 'messages:write',
      'activity-feed:view'
    ]
  },
  {
    value: 'NURSE',
    label: 'Nurse/Clinical',
    roles: ['NURSE', 'CLINICAL'],
    permissions: [
      'clients:read', 'clients:update', 'visits:read', 'visits:create',
      'visits:update', 'care-plans:create', 'care-plans:read',
      'care-plans:update', 'tasks:create', 'tasks:read', 'tasks:update',
      'medications:*', 'clinical:*'
    ]
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// Set seed for reproducible data
faker.seed(2024);

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function _hoursAgo(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
}

function _hoursFromNow(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
}

function randomDateBetween(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

interface ClientData {
  id: string;
  organizationId: string;
  branchId: string;
  clientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  state: string;
  city: string;
  address: string;
  zipCode: string;
  phone: string;
  email: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicaidNumber: string | null;
  medicareNumber: string | null;
  diagnosis: string;
  mobilityLevel: string;
  careType: string;
  createdBy: string;
}

function generateClient(
  index: number,
  orgId: string,
  branchId: string,
  systemUserId: string,
  state: string
): ClientData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const gender = faker.helpers.arrayElement(['MALE', 'FEMALE', 'NON_BINARY']);
  
  // Generate age-appropriate date of birth (65-95 years old)
  const age = faker.number.int({ min: 65, max: 95 });
  const dob = new Date();
  dob.setFullYear(dob.getFullYear() - age);
  
  // State-specific phone and zip patterns
  const phoneAreaCodes = {
    TX: ['512', '210', '713', '214', '817'],
    FL: ['305', '407', '813', '904', '561'],
    OH: ['216', '614', '513', '419', '937'],
  };
  
  const areaCode = randomElement(phoneAreaCodes[state]);
  const phone = `${areaCode}-555-${String(index).padStart(4, '0')}`;
  
  // State-specific cities
  const cities = {
    TX: ['Austin', 'Houston', 'Dallas', 'San Antonio', 'Fort Worth'],
    FL: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'],
    OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'],
  };
  
  const city = randomElement(cities[state]);
  
  return {
    id: uuidv4(),
    organizationId: orgId,
    branchId,
    clientNumber: `CL-${state}-${String(index).padStart(4, '0')}`,
    firstName,
    lastName,
    dateOfBirth: dob,
    gender,
    state,
    city,
    address: faker.location.streetAddress(),
    zipCode: faker.location.zipCode(),
    phone,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    emergencyContactName: faker.person.fullName(),
    emergencyContactPhone: `${areaCode}-555-${faker.string.numeric(4)}`,
    medicaidNumber: Math.random() > 0.3 ? `MC-${state}-${faker.string.numeric(7)}` : null,
    medicareNumber: Math.random() > 0.4 ? `MCR${faker.string.numeric(9)}${randomElement(['A', 'B', 'C', 'D'])}` : null,
    diagnosis: randomElement<string>([
      'Alzheimer\'s Disease',
      'Parkinson\'s Disease', 
      'Diabetes Type 2',
      'Heart Disease',
      'Stroke Recovery',
      'COPD',
      'Arthritis',
      'Post-Surgical Rehabilitation',
      'Dementia',
      'Hypertension',
    ]),
    mobilityLevel: randomElement(['INDEPENDENT', 'WALKER', 'WHEELCHAIR', 'BEDBOUND']),
    careType: randomElement(['PERSONAL_CARE', 'SKILLED_NURSING', 'COMPANION', 'RESPITE']),
    createdBy: systemUserId,
  };
}

interface CaregiverData {
  id: string;
  organizationId: string;
  branchId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  hireDate: Date;
  employmentType: string;
  hourlyRate: number;
  certifications: string[];
  specializations: string[];
  languages: string[];
  maxDriveDistance: number;
  createdBy: string;
}

function generateCaregiver(
  index: number,
  orgId: string,
  branchId: string,
  systemUserId: string
): CaregiverData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const gender = faker.helpers.arrayElement(['MALE', 'FEMALE', 'NON_BINARY']);
  
  const age = faker.number.int({ min: 22, max: 65 });
  const dob = new Date();
  dob.setFullYear(dob.getFullYear() - age);
  
  const hireDate = randomDateBetween(daysAgo(1095), daysAgo(30)); // Hired 1-3 years ago
  
  const state = randomElement(['TX', 'FL', 'OH']);
  const cities = {
    TX: ['Austin', 'Houston', 'Dallas'],
    FL: ['Miami', 'Orlando', 'Tampa'],
    OH: ['Columbus', 'Cleveland', 'Cincinnati'],
  };
  
  const allCertifications = ['CNA', 'HHA', 'PCA', 'CPR', 'FIRST_AID', 'MEDICATION_AIDE'];
  const allSpecializations = [
    'ALZHEIMERS_CARE',
    'DEMENTIA_CARE',
    'DIABETIC_CARE',
    'WOUND_CARE',
    'MEDICATION_MANAGEMENT',
    'MOBILITY_ASSISTANCE',
    'POST_SURGICAL_CARE',
    'COMPANIONSHIP',
    'MEAL_PREPARATION',
  ];
  const allLanguages = ['English', 'Spanish', 'Mandarin', 'Vietnamese', 'Tagalog', 'French'];
  
  return {
    id: uuidv4(),
    organizationId: orgId,
    branchId,
    employeeNumber: `CG-${String(index).padStart(4, '0')}`,
    firstName,
    lastName,
    dateOfBirth: dob,
    gender,
    phone: `${faker.string.numeric(3)}-${faker.string.numeric(3)}-${faker.string.numeric(4)}`,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    address: faker.location.streetAddress(),
    city: randomElement(cities[state]),
    state,
    zipCode: faker.location.zipCode(),
    hireDate,
    employmentType: randomElement(['FULL_TIME', 'PART_TIME', 'PER_DIEM']),
    hourlyRate: faker.number.float({ min: 18, max: 32, fractionDigits: 2 }),
    certifications: randomElements(allCertifications, faker.number.int({ min: 2, max: 4 })),
    specializations: randomElements(allSpecializations, faker.number.int({ min: 2, max: 5 })),
    languages: randomElements(allLanguages, faker.number.int({ min: 1, max: 2 })),
    maxDriveDistance: randomElement([10, 15, 20, 25, 30]),
    createdBy: systemUserId,
  };
}

interface VisitData {
  id: string;
  organizationId: string;
  branchId: string;
  clientId: string;
  caregiverId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart: Date | null;
  actualEnd: Date | null;
  status: string;
  visitType: string;
  notes: string | null;
  evvClockInGPS: { lat: number; lng: number } | null;
  evvClockOutGPS: { lat: number; lng: number } | null;
  evvVerificationMethod: string | null;
  createdBy: string;
}

function generateVisit(
  orgId: string,
  branchId: string,
  clientId: string,
  caregiverId: string,
  dayOffset: number,
  systemUserId: string
): VisitData {
  const scheduledStart = new Date();
  scheduledStart.setDate(scheduledStart.getDate() + dayOffset);
  scheduledStart.setHours(faker.number.int({ min: 7, max: 18 }), faker.number.int({ min: 0, max: 59 }), 0, 0);

  const duration = randomElement([2, 3, 4, 6, 8]); // hours
  const scheduledEnd = new Date(scheduledStart);
  scheduledEnd.setHours(scheduledEnd.getHours() + duration);

  // Ensure visit doesn't span midnight (cap at 23:59 same day)
  const maxEndTime = new Date(scheduledStart);
  maxEndTime.setHours(23, 59, 0, 0);
  if (scheduledEnd > maxEndTime) {
    scheduledEnd.setTime(maxEndTime.getTime());
  }
  
  let status = 'SCHEDULED';
  let actualStart = null;
  let actualEnd = null;
  let evvClockInGPS = null;
  let evvClockOutGPS = null;
  let evvVerificationMethod = null;
  let notes = null;
  
  // Past visits are completed
  if (dayOffset < 0) {
    status = randomElement(['COMPLETED', 'COMPLETED', 'COMPLETED', 'NO_SHOW_CLIENT', 'CANCELLED']);
    
    if (status === 'COMPLETED') {
      actualStart = new Date(scheduledStart);
      actualStart.setMinutes(actualStart.getMinutes() + faker.number.int({ min: -5, max: 5 }));
      
      actualEnd = new Date(scheduledEnd);
      actualEnd.setMinutes(actualEnd.getMinutes() + faker.number.int({ min: -10, max: 10 }));
      
      evvClockInGPS = {
        lat: faker.location.latitude(),
        lng: faker.location.longitude(),
      };
      evvClockOutGPS = {
        lat: evvClockInGPS.lat + faker.number.float({ min: -0.001, max: 0.001, fractionDigits: 6 }),
        lng: evvClockInGPS.lng + faker.number.float({ min: -0.001, max: 0.001, fractionDigits: 6 }),
      };
      evvVerificationMethod = randomElement(['BIOMETRIC', 'GPS', 'PHONE']);
      
      notes = randomElement([
        'Client in good spirits. All ADLs completed as planned.',
        'Assisted with morning routine. Client needed extra help with mobility.',
        'Medication administered on schedule. Vital signs normal.',
        'Completed all tasks. Client enjoyed conversation.',
        'Client refused shower today. Will try again tomorrow.',
        'Family member present during visit. Good interaction.',
      ]);
    }
  }
  
  // Today's visits might be in progress
  if (dayOffset === 0 && Math.random() > 0.7) {
    status = 'IN_PROGRESS';
    actualStart = new Date(scheduledStart);
    evvClockInGPS = {
      lat: faker.location.latitude(),
      lng: faker.location.longitude(),
    };
    evvVerificationMethod = 'BIOMETRIC';
  }
  
  return {
    id: uuidv4(),
    organizationId: orgId,
    branchId,
    clientId,
    caregiverId,
    scheduledStart,
    scheduledEnd,
    actualStart,
    actualEnd,
    status,
    visitType: randomElement(['REGULAR', 'INITIAL', 'RESPITE', 'SUPERVISION', 'ASSESSMENT']),
    notes,
    evvClockInGPS,
    evvClockOutGPS,
    evvVerificationMethod,
    createdBy: systemUserId,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function seedDatabase() {
  console.log('🎭 Seeding demo data (all states, all roles, comprehensive)...\n');

  const env = process.env.NODE_ENV || 'development';
  const dbName = process.env.DB_NAME || 'care_commons';

  let db: Database | { transaction: (callback: (client: PoolClient) => Promise<void>) => Promise<void>; close: () => Promise<void> };

  // Use DATABASE_URL if provided (for CI/CD and production)
  if (process.env.DATABASE_URL) {
    console.log('📝 Using DATABASE_URL for seeding\n');
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    db = {
      transaction: async (callback: (client: PoolClient) => Promise<void>) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await callback(client);
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },
      close: async () => await pool.end(),
    };
  } else {
    const database = env === 'test' ? `${dbName}_test` : dbName;
    
    const config: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_SSL === 'true',
    };
    
    db = new Database(config);
  }

  try {
    await db.transaction(async (client) => {
      // ═══════════════════════════════════════════════════════════════════════════
      // STEP 1: Fetch existing organization, branch, and user
      // ═══════════════════════════════════════════════════════════════════════════
      
      console.log('📋 Fetching existing organization...');
      const orgResult = await client.query(
        'SELECT id FROM organizations ORDER BY created_at ASC LIMIT 1'
      );
      
      if (orgResult.rows.length === 0) {
        throw new Error('No organization found. Please run "npm run db:seed" first.');
      }
      
      const orgId = orgResult.rows[0].id;
      
      console.log('📋 Fetching existing branch...');
      const branchResult = await client.query(
        'SELECT id FROM branches WHERE organization_id = $1 ORDER BY created_at ASC LIMIT 1',
        [orgId]
      );
      
      if (branchResult.rows.length === 0) {
        throw new Error('No branch found. Please run "npm run db:seed" first.');
      }
      
      const branchId = branchResult.rows[0].id;
      
      console.log('📋 Fetching existing admin user...');
      const userResult = await client.query(
        'SELECT id FROM users WHERE organization_id = $1 AND $2 = ANY(roles) ORDER BY created_at ASC LIMIT 1',
        [orgId, 'SUPER_ADMIN']
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('No admin user found. Please run "npm run db:seed" first.');
      }
      
      const systemUserId = userResult.rows[0].id;

      console.log(`✅ Using org: ${orgId}, branch: ${branchId}, user: ${systemUserId}\n`);

      // ═══════════════════════════════════════════════════════════════════════════
      // STEP 1.5: Create state-specific users (all 50 states × 5 roles = 255 users)
      // ═══════════════════════════════════════════════════════════════════════════

      console.log(`👥 Creating state-specific demo users (${US_STATES.length} states × ${ROLES.length} roles = ${US_STATES.length * ROLES.length} users)...\n`);

      let usersCreated = 0;
      let usersUpdated = 0;

      // Create users for each state × role combination
      for (const state of US_STATES) {
        for (const role of ROLES) {
          const stateCode = state.code.toLowerCase();
          const roleCode = role.value.toLowerCase();

          // Email format: role@state.carecommons.example
          const email = `${roleCode}@${stateCode}.carecommons.example`;
          const username = `${roleCode}-${stateCode}`;
          const firstName = role.label;
          const lastName = `(${state.code})`;

          // Password format: Demo{State}{Role}123!
          const password = `Demo${state.code}${role.value}123!`;
          const passwordHash = PasswordUtils.hashPassword(password);

          const userId = uuidv4();

          try {
            // Try to update existing user first
            const updateResult = await client.query(
              `
              UPDATE users
              SET
                password_hash = $1,
                first_name = $2,
                last_name = $3,
                roles = $4,
                permissions = $5,
                status = 'ACTIVE',
                branch_ids = $6,
                updated_at = NOW()
              WHERE email = $7
              RETURNING id
              `,
              [
                passwordHash,
                firstName,
                lastName,
                role.roles,
                role.permissions,
                [branchId],
                email
              ]
            );

            if (updateResult.rows.length > 0) {
              usersUpdated++;
            } else {
              // User doesn't exist, create new one
              await client.query(
                `
                INSERT INTO users (
                  id, organization_id, username, email, password_hash,
                  first_name, last_name, roles, permissions, branch_ids,
                  status, created_by, updated_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `,
                [
                  userId,
                  orgId,
                  username,
                  email,
                  passwordHash,
                  firstName,
                  lastName,
                  role.roles,
                  role.permissions,
                  [branchId],
                  'ACTIVE',
                  systemUserId,
                  systemUserId
                ]
              );
              usersCreated++;
            }
          } catch (error) {
            if (error instanceof Error && 'code' in error && error.code === '23505') {
              // Unique constraint violation - try updating by username
              await client.query(
                `
                UPDATE users
                SET
                  email = $1,
                  password_hash = $2,
                  first_name = $3,
                  last_name = $4,
                  roles = $5,
                  permissions = $6,
                  status = 'ACTIVE',
                  branch_ids = $7,
                  updated_at = NOW()
                WHERE username = $8
                `,
                [
                  email,
                  passwordHash,
                  firstName,
                  lastName,
                  role.roles,
                  role.permissions,
                  [branchId],
                  username
                ]
              );
              usersUpdated++;
            } else {
              throw error;
            }
          }
        }
      }

      console.log(`✅ State-specific users: ${usersCreated} created, ${usersUpdated} updated (${usersCreated + usersUpdated} total)\n`);
      console.log(`📝 Login format: {role}@{state}.carecommons.example / Demo{STATE}{ROLE}123!`);
      console.log(`   Example: admin@al.carecommons.example / DemoALADMIN123!\n`);

      // ═══════════════════════════════════════════════════════════════════════════
      // STEP 2: Clear existing demo data (optional, based on IS_DEMO flag)
      // ═══════════════════════════════════════════════════════════════════════════
      
      console.log('🧹 Clearing previous demo data (if any)...');

      // Delete in reverse dependency order
      await client.query('DELETE FROM evv_records WHERE is_demo_data = true');
      await client.query('DELETE FROM visits WHERE is_demo_data = true');
      await client.query('DELETE FROM task_instances WHERE is_demo_data = true');
      await client.query('DELETE FROM progress_notes WHERE is_demo_data = true');
      await client.query('DELETE FROM care_plans WHERE is_demo_data = true');
      await client.query('DELETE FROM messages WHERE is_demo_data = true');
      await client.query('DELETE FROM family_notifications WHERE is_demo_data = true');
      await client.query('DELETE FROM family_members WHERE is_demo_data = true');
      await client.query('DELETE FROM invoices WHERE is_demo_data = true');
      await client.query('DELETE FROM assignment_proposals WHERE is_demo_data = true');
      await client.query('DELETE FROM open_shifts WHERE is_demo_data = true');
      await client.query('DELETE FROM caregivers WHERE is_demo_data = true');
      await client.query('DELETE FROM clients WHERE is_demo_data = true');

      console.log('✅ Previous demo data cleared\n');
      
      // ═══════════════════════════════════════════════════════════════════════════
      // STEP 3: Generate and insert clients (60 total: 20 TX, 20 FL, 20 OH)
      // ═══════════════════════════════════════════════════════════════════════════
      
      console.log(`👥 Creating ${SEED_CONFIG.clients} clients...`);
      
      const clients: ClientData[] = [];
      const states = ['TX', 'FL', 'OH'];
      const clientsPerState = Math.floor(SEED_CONFIG.clients / states.length);
      
      let clientIndex = 1;
      for (const state of states) {
        for (let i = 0; i < clientsPerState; i++) {
          const newClient = generateClient(clientIndex, orgId, branchId, systemUserId, state);
          clients.push(newClient);
          
          await client.query(
            `
            INSERT INTO clients (
              id, organization_id, branch_id, client_number,
              first_name, last_name, date_of_birth, gender,
              primary_phone, email, primary_address,
              emergency_contacts, status, intake_date,
              insurance, service_eligibility,
              created_by, updated_by, is_demo_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, true)
            `,
            [
              newClient.id,
              newClient.organizationId,
              newClient.branchId,
              newClient.clientNumber,
              newClient.firstName,
              newClient.lastName,
              newClient.dateOfBirth,
              newClient.gender,
              JSON.stringify({ number: newClient.phone, type: 'MOBILE', canReceiveSMS: true }),
              newClient.email,
              JSON.stringify({
                type: 'HOME',
                line1: newClient.address,
                city: newClient.city,
                state: newClient.state,
                postalCode: newClient.zipCode,
                country: 'US',
              }),
              JSON.stringify([{
                id: uuidv4(),
                name: newClient.emergencyContactName,
                relationship: randomElement(['Daughter', 'Son', 'Spouse', 'Sibling', 'Friend']),
                phone: { number: newClient.emergencyContactPhone, type: 'MOBILE', canReceiveSMS: true },
                isPrimary: true,
                canMakeHealthcareDecisions: true,
              }]),
              'ACTIVE',
              randomDateBetween(daysAgo(365), daysAgo(30)),
              JSON.stringify({
                primary: newClient.medicaidNumber || newClient.medicareNumber ? {
                  type: newClient.medicaidNumber ? 'MEDICAID' : 'MEDICARE',
                  memberId: newClient.medicaidNumber || newClient.medicareNumber,
                  provider: newClient.medicaidNumber ? 'State Medicaid' : 'Medicare',
                  isActive: true
                } : null,
                secondary: (newClient.medicaidNumber && newClient.medicareNumber) ? {
                  type: 'MEDICARE',
                  memberId: newClient.medicareNumber,
                  provider: 'Medicare',
                  isActive: true
                } : null
              }),
              JSON.stringify({
                medicaid: newClient.medicaidNumber ? {
                  eligible: true,
                  memberId: newClient.medicaidNumber,
                  state: newClient.state,
                  programType: 'COMMUNITY_BASED'
                } : { eligible: false },
                medicare: newClient.medicareNumber ? {
                  eligible: true,
                  memberId: newClient.medicareNumber,
                  partA: true,
                  partB: true
                } : { eligible: false }
              }),
              newClient.createdBy,
              newClient.createdBy,
            ]
          );
          
          clientIndex++;
        }
      }
      
      console.log(`✅ Created ${clients.length} clients\n`);
      
      // ═══════════════════════════════════════════════════════════════════════════
      // STEP 4: Generate and insert caregivers (35 total)
      // ═══════════════════════════════════════════════════════════════════════════
      
      console.log(`👨‍⚕️ Creating ${SEED_CONFIG.caregivers} caregivers...`);
      
      const caregivers: CaregiverData[] = [];
      
      for (let i = 1; i <= SEED_CONFIG.caregivers; i++) {
        const caregiver = generateCaregiver(i, orgId, branchId, systemUserId);
        caregivers.push(caregiver);
        
        // Create user account for caregiver
        const caregiverUserId = uuidv4();
        await client.query(
          `
          INSERT INTO users (
            id, organization_id, email, password_hash,
            first_name, last_name, roles, status,
            created_by, updated_by, is_demo_data, username
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11)
          `,
          [
            caregiverUserId,
            orgId,
            caregiver.email,
            '$2b$10$DEMO_HASH', // Demo password hash
            caregiver.firstName,
            caregiver.lastName,
            '{CAREGIVER}',
            'ACTIVE',
            systemUserId,
            systemUserId,
            caregiver.email, // username
          ]
        );
        
        // Create caregiver record
        await client.query(
          `
          INSERT INTO caregivers (
            id, organization_id, primary_branch_id, branch_ids, employee_number,
            first_name, last_name, date_of_birth, gender,
            primary_phone, email, primary_address,
            hire_date, employment_type, employment_status, pay_rate,
            credentials, specializations, languages,
            max_travel_distance, role, availability, preferred_contact_method, status,
            created_by, updated_by, is_demo_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, true)
          `,
          [
            caregiver.id,
            caregiver.organizationId,
            caregiver.branchId,
            `{${caregiver.branchId}}`, // branch_ids array
            caregiver.employeeNumber,
            caregiver.firstName,
            caregiver.lastName,
            caregiver.dateOfBirth,
            caregiver.gender,
            JSON.stringify({ number: caregiver.phone, type: 'MOBILE', canReceiveSMS: true }),
            caregiver.email,
            JSON.stringify({
              type: 'HOME',
              line1: caregiver.address,
              city: caregiver.city,
              state: caregiver.state,
              postalCode: caregiver.zipCode,
              country: 'US',
            }),
            caregiver.hireDate,
            caregiver.employmentType,
            'ACTIVE', // employment_status
            JSON.stringify({
              amount: caregiver.hourlyRate,
              currency: 'USD',
              unit: 'HOUR',
              effectiveDate: caregiver.hireDate
            }), // pay_rate
            JSON.stringify(caregiver.certifications),
            `{${Array.isArray(caregiver.specializations) ? caregiver.specializations.join(',') : ''}}`, // PostgreSQL array
            `{${Array.isArray(caregiver.languages) ? caregiver.languages.join(',') : ''}}`, // PostgreSQL array
            caregiver.maxDriveDistance,
            'CAREGIVER', // role
            JSON.stringify({
              monday: [{ start: '09:00', end: '17:00' }],
              tuesday: [{ start: '09:00', end: '17:00' }],
              wednesday: [{ start: '09:00', end: '17:00' }],
              thursday: [{ start: '09:00', end: '17:00' }],
              friday: [{ start: '09:00', end: '17:00' }]
            }), // availability
            'PHONE', // preferred_contact_method
            'ACTIVE', // status
            caregiver.createdBy,
            caregiver.createdBy,
          ]
        );
      }
      
      console.log(`✅ Created ${caregivers.length} caregivers\n`);
      
      // ═══════════════════════════════════════════════════════════════════════════
      // STEP 5: Generate and insert visits (600 total: past, present, future)
      // ═══════════════════════════════════════════════════════════════════════════
      
      console.log(`📅 Creating ${SEED_CONFIG.visits} visits...`);
      
      const visits: VisitData[] = [];
      
      for (let i = 0; i < SEED_CONFIG.visits; i++) {
        const visitClient = randomElement(clients);
        const caregiver = randomElement(caregivers);
        
        // Distribute visits across -30 days to +30 days
        const dayOffset = faker.number.int({ min: -30, max: 30 });
        
        const visit = generateVisit(
          orgId,
          branchId,
          visitClient.id,
          caregiver.id,
          dayOffset,
          systemUserId
        );
        
        visits.push(visit);
        
        await client.query(
          `
          INSERT INTO visits (
            id, organization_id, branch_id, client_id, assigned_caregiver_id,
            visit_number, visit_type, service_type_id, service_type_name,
            scheduled_date, scheduled_start_time, scheduled_end_time, scheduled_duration,
            actual_start_time, actual_end_time, actual_duration,
            address, status, completion_notes,
            created_by, updated_by, is_demo_data
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10::timestamp::date,
            $11::timestamp::time,
            $12::timestamp::time,
            $13, $14, $15, $16, $17, $18, $19, $20, $21, true
          )
          `,
          [
            visit.id,
            visit.organizationId,
            visit.branchId,
            visit.clientId,
            visit.caregiverId,
            `VIS-${visit.id.substring(0, 8)}`, // visit_number
            visit.visitType,
            visit.id, // service_type_id (placeholder)
            visit.visitType, // service_type_name
            visit.scheduledStart, // scheduled_date (will be cast to DATE)
            visit.scheduledStart, // scheduled_start_time (will be cast to TIME)
            visit.scheduledEnd, // scheduled_end_time (will be cast to TIME)
            Math.round((new Date(visit.scheduledEnd).getTime() - new Date(visit.scheduledStart).getTime()) / 60000), // scheduled_duration in minutes
            visit.actualStart, // actual_start_time
            visit.actualEnd, // actual_end_time
            visit.actualEnd ? Math.round((new Date(visit.actualEnd).getTime() - new Date(visit.actualStart).getTime()) / 60000) : null, // actual_duration
            JSON.stringify({ type: 'HOME', line1: '123 Main St', city: 'Anytown', state: 'CA', postalCode: '12345', country: 'US' }), // address (placeholder)
            visit.status,
            visit.notes,
            visit.createdBy,
            visit.createdBy,
          ]
        );
        
        // Insert EVV record if visit is completed or in progress
        if (visit.evvClockInGPS) {
          await client.query(
            `
            INSERT INTO evv_records (
              id, visit_id, organization_id, branch_id, client_id, caregiver_id,
              service_type_code, service_type_name, client_name, caregiver_name, caregiver_employee_id,
              service_date, service_address,
              clock_in_time, clock_in_verification,
              clock_out_time, clock_out_verification,
              verification_level, record_status,
              integrity_hash, integrity_checksum,
              recorded_by, sync_metadata,
              created_by, updated_by, is_demo_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, true)
            `,
            [
              uuidv4(),
              visit.id,
              visit.organizationId,
              visit.branchId,
              visit.clientId,
              visit.caregiverId,
              'SVC-001', // service_type_code (placeholder)
              visit.visitType, // service_type_name
              'Client Name', // client_name (placeholder - should be encrypted)
              'Caregiver Name', // caregiver_name (placeholder)
              'EMP-001', // caregiver_employee_id (placeholder)
              visit.scheduledStart, // service_date
              JSON.stringify({ type: 'HOME', line1: '123 Main St', city: 'Anytown', state: 'CA', postalCode: '12345', country: 'US' }), // service_address
              visit.actualStart, // clock_in_time
              JSON.stringify({ method: visit.evvVerificationMethod || 'GPS', location: visit.evvClockInGPS, timestamp: visit.actualStart }), // clock_in_verification
              visit.actualEnd, // clock_out_time
              visit.evvClockOutGPS ? JSON.stringify({ method: visit.evvVerificationMethod || 'GPS', location: visit.evvClockOutGPS, timestamp: visit.actualEnd }) : null, // clock_out_verification
              visit.evvVerificationMethod === 'BIOMETRIC' ? 'FULL' : 'PARTIAL', // verification_level
              visit.status === 'COMPLETED' ? 'COMPLETE' : 'PENDING', // record_status
              'placeholder_hash_' + visit.id.substring(0, 16), // integrity_hash (placeholder)
              'placeholder_checksum_' + visit.id.substring(0, 16), // integrity_checksum (placeholder)
              visit.createdBy, // recorded_by
              JSON.stringify({ source: 'demo_seed', timestamp: new Date().toISOString() }), // sync_metadata
              visit.createdBy,
              visit.createdBy,
            ]
          );
        }
      }
      
      console.log(`✅ Created ${visits.length} visits\n`);
      
      // ═══════════════════════════════════════════════════════════════════════════
      // STEP 6: Generate and insert care plans (50 total, ~80% of active clients)
      // ═══════════════════════════════════════════════════════════════════════════
      
      console.log(`📋 Creating ${SEED_CONFIG.carePlans} care plans...`);
      
      const carePlans: { id: string; clientId: string }[] = [];
      const activeClients = clients.slice(0, SEED_CONFIG.carePlans); // First 50 clients get care plans
      
      for (let i = 0; i < activeClients.length; i++) {
        const planClient = activeClients[i];
        const planId = uuidv4();
        const planNumber = `CP-${planClient.state}-${String(i + 1).padStart(4, '0')}`;
        
        const planType = randomElement<string>(['PERSONAL_CARE', 'SKILLED_NURSING', 'COMPANION', 'THERAPY']);
        const priority = randomElement<string>(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
        const effectiveDate = randomDateBetween(daysAgo(90), daysAgo(7));
        const expirationDate = randomDateBetween(daysFromNow(30), daysFromNow(180));
        
        const goals = [
          {
            id: uuidv4(),
            category: randomElement(['MOBILITY', 'ADL', 'MEDICATION_MANAGEMENT', 'SOCIAL_ENGAGEMENT']),
            description: randomElement([
              'Maintain safe ambulation with walker',
              'Independent bathing with standby assistance',
              'Medication self-administration with reminders',
              'Attend weekly community activities',
            ]),
            targetDate: randomDateBetween(daysFromNow(30), daysFromNow(90)),
            status: randomElement(['ON_TRACK', 'IN_PROGRESS', 'ACHIEVED', 'AT_RISK']),
            progress: faker.number.int({ min: 20, max: 95 }),
          },
        ];
        
        await client.query(
          `
          INSERT INTO care_plans (
            id, organization_id, branch_id, client_id,
            plan_number, name, plan_type, status, priority,
            effective_date, expiration_date, review_date,
            assessment_summary, goals, estimated_hours_per_week,
            compliance_status, created_by, updated_by, is_demo_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, true)
          `,
          [
            planId,
            orgId,
            branchId,
            planClient.id,
            planNumber,
            `${planType.replace('_', ' ')} Plan for ${planClient.firstName} ${planClient.lastName}`,
            planType,
            'ACTIVE',
            priority,
            effectiveDate,
            expirationDate,
            randomDateBetween(daysFromNow(7), daysFromNow(30)),
            `Comprehensive care plan for ${planClient.diagnosis}. Client requires ${planClient.mobilityLevel.toLowerCase()} assistance.`,
            JSON.stringify(goals),
            faker.number.int({ min: 10, max: 40 }),
            'COMPLIANT',
            systemUserId,
            systemUserId,
          ]
        );
        
        carePlans.push({ id: planId, clientId: planClient.id });
      }
      
      console.log(`✅ Created ${carePlans.length} care plans\n`);
      
      // ═══════════════════════════════════════════════════════════════════════════
      // STEP 7: Generate and insert family members (40 total, ~60% of clients)
      // ═══════════════════════════════════════════════════════════════════════════
      
      console.log(`👨‍👩‍👧‍👦 Creating ${SEED_CONFIG.familyMembers} family members...`);
      
      const familyMembers: { id: string; clientId: string }[] = [];
      const clientsWithFamily = clients.slice(0, SEED_CONFIG.familyMembers);
      
      for (const familyClient of clientsWithFamily) {
        const familyId = uuidv4();
        const relationship = randomElement<string>(['SPOUSE', 'CHILD', 'SIBLING', 'GRANDCHILD', 'GUARDIAN']);
        const firstName = faker.person.firstName();
        const lastName = familyClient.lastName; // Same last name
        
        await client.query(
          `
          INSERT INTO family_members (
            id, organization_id, branch_id, client_id,
            first_name, last_name, email, phone_number,
            relationship, is_primary_contact,
            preferred_contact_method, portal_access_level,
            status, invitation_status, receive_notifications,
            access_granted_by, created_by, updated_by, is_demo_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, true)
          `,
          [
            familyId,
            orgId,
            branchId,
            familyClient.id,
            firstName,
            lastName,
            faker.internet.email({ firstName, lastName }).toLowerCase(),
            `${faker.string.numeric(3)}-${faker.string.numeric(3)}-${faker.string.numeric(4)}`,
            relationship,
            true,
            'EMAIL',
            'VIEW_DETAILED',
            'ACTIVE',
            'ACCEPTED',
            true,
            systemUserId,
            systemUserId,
            systemUserId,
          ]
        );
        
        familyMembers.push({ id: familyId, clientId: familyClient.id });
      }
      
      console.log(`✅ Created ${familyMembers.length} family members\n`);

      // ═══════════════════════════════════════════════════════════════════════════
      // STEP 8: Create payers (required for invoices)
      // ═══════════════════════════════════════════════════════════════════════════

      console.log(`💳 Creating payers...`);

      // Create Medicaid payer
      const medicaidPayerId = uuidv4();
      await client.query(
        `
        INSERT INTO payers (
          id, organization_id,
          payer_name, payer_type, payer_code,
          payment_terms_days, status,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          medicaidPayerId,
          orgId,
          'Medicaid',
          'MEDICAID',
          'MEDICAID-001',
          30,
          'ACTIVE',
          systemUserId,
          systemUserId,
        ]
      );

      // Create Private Pay payer
      const privatePayPayerId = uuidv4();
      await client.query(
        `
        INSERT INTO payers (
          id, organization_id,
          payer_name, payer_type, payer_code,
          payment_terms_days, status,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          privatePayPayerId,
          orgId,
          'Private Pay',
          'PRIVATE_PAY',
          'PRIVATE-001',
          30,
          'ACTIVE',
          systemUserId,
          systemUserId,
        ]
      );

      console.log(`✅ Created 2 payers (Medicaid, Private Pay)\n`);

      // ═══════════════════════════════════════════════════════════════════════════
      // STEP 9: Generate basic invoices (for completed visits)
      // ═══════════════════════════════════════════════════════════════════════════

      console.log(`💰 Creating invoices for completed visits...`);
      
      const completedVisits = visits.filter(v => v.status === 'COMPLETED');
      const visitsByClient = new Map<string, typeof visits>();
      
      for (const visit of completedVisits) {
        if (!visitsByClient.has(visit.clientId)) {
          visitsByClient.set(visit.clientId, []);
        }
        visitsByClient.get(visit.clientId)!.push(visit);
      }
      
      let invoiceCount = 0;
      for (const [clientId, clientVisits] of visitsByClient.entries()) {
        const invoiceClient = clients.find(c => c.id === clientId);
        if (!invoiceClient || clientVisits.length === 0) continue;
        
        // Group visits by month
        const visitsByMonth = new Map<string, typeof clientVisits>();
        for (const visit of clientVisits) {
          const monthKey = visit.scheduledStart.toISOString().substring(0, 7); // YYYY-MM
          if (!visitsByMonth.has(monthKey)) {
            visitsByMonth.set(monthKey, []);
          }
          visitsByMonth.get(monthKey)!.push(visit);
        }
        
        // Create one invoice per month
        for (const [monthKey, monthVisits] of visitsByMonth.entries()) {
          const totalHours = monthVisits.reduce((sum, v) => {
            if (!v.actualStart || !v.actualEnd) return sum;
            const hours = (v.actualEnd.getTime() - v.actualStart.getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }, 0);
          
          if (totalHours === 0) continue;
          
          const ratePerHour = 25.00;
          const subtotal = totalHours * ratePerHour;
          const taxAmount = 0; // Healthcare services often tax-exempt
          const totalAmount = subtotal + taxAmount;
          
          const lineItems = monthVisits.map(v => {
            const hours = v.actualStart && v.actualEnd 
              ? (v.actualEnd.getTime() - v.actualStart.getTime()) / (1000 * 60 * 60)
              : 0;
            return {
              visitId: v.id,
              serviceDate: v.scheduledStart.toISOString().split('T')[0],
              description: `${v.visitType} Services`,
              hours: Math.round(hours * 100) / 100,
              rate: ratePerHour,
              amount: Math.round(hours * ratePerHour * 100) / 100,
            };
          });
          
          const periodStart = new Date(monthKey + '-01');
          const periodEnd = new Date(periodStart);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          periodEnd.setDate(0); // Last day of month
          
          const invoiceNumber = `INV-${monthKey}-${String(invoiceCount + 1).padStart(4, '0')}`;
          const status = randomElement<string>(['DRAFT', 'SENT', 'PAID', 'PAST_DUE']);
          
          await client.query(
            `
            INSERT INTO invoices (
              id, organization_id, branch_id,
              invoice_number, invoice_type,
              payer_id, payer_type, payer_name,
              client_id, client_name,
              period_start, period_end, invoice_date, due_date,
              billable_item_ids, line_items,
              subtotal, tax_amount, discount_amount, adjustment_amount,
              total_amount, paid_amount, balance_due,
              status, status_history, payment_terms,
              created_by, updated_by, is_demo_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, true)
            `,
            [
              uuidv4(),
              orgId,
              branchId,
              invoiceNumber,
              'STANDARD',
              invoiceClient.medicaidNumber ? medicaidPayerId : privatePayPayerId, // Medicaid or private pay
              invoiceClient.medicaidNumber ? 'MEDICAID' : 'PRIVATE_PAY',
              invoiceClient.medicaidNumber ? 'Medicaid' : 'Private Pay',
              invoiceClient.id,
              `${invoiceClient.firstName} ${invoiceClient.lastName}`,
              periodStart,
              periodEnd,
              periodEnd, // Invoice date is end of period
              new Date(periodEnd.getTime() + 30 * 24 * 60 * 60 * 1000), // Due 30 days later
              JSON.stringify([]), // billable_item_ids
              JSON.stringify(lineItems),
              subtotal,
              taxAmount,
              0, // discount_amount
              0, // adjustment_amount
              totalAmount,
              status === 'PAID' ? totalAmount : 0,
              status === 'PAID' ? 0 : totalAmount,
              status,
              JSON.stringify([{ status, date: periodEnd, notes: 'Initial invoice' }]),
              'Net 30',
              systemUserId,
              systemUserId,
            ]
          );
          
          invoiceCount++;
        }
      }
      
      console.log(`✅ Created ${invoiceCount} invoices\n`);

      // ═══════════════════════════════════════════════════════════════════════════
      // STEP 10: Create specific "Gertrude Stein" client for Family Portal demo
      // ═══════════════════════════════════════════════════════════════════════════

      console.log(`👵 Creating Gertrude Stein (family portal demo client)...`);

      const gertrudeId = uuidv4();
      const gertrudeClientNumber = 'CL-FAMILY-0001';

      await client.query(
        `
        INSERT INTO clients (
          id, organization_id, branch_id, client_number,
          first_name, last_name, date_of_birth, gender,
          primary_phone, email, primary_address,
          emergency_contacts, status, intake_date,
          insurance, service_eligibility,
          created_by, updated_by, is_demo_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, true)
        `,
        [
          gertrudeId,
          orgId,
          branchId,
          gertrudeClientNumber,
          'Gertrude',
          'Stein',
          new Date('1940-05-15'), // 84 years old
          'FEMALE',
          JSON.stringify({ number: '555-0199', type: 'MOBILE', canReceiveSMS: true }),
          'gertrude.stein@example.com',
          JSON.stringify({
            type: 'HOME',
            line1: '456 Oak Avenue',
            city: 'Springfield',
            state: 'IL',
            postalCode: '62702',
            country: 'US',
          }),
          JSON.stringify([{
            id: uuidv4(),
            name: 'Stein Family',
            relationship: 'Daughter',
            phone: { number: '555-0198', type: 'MOBILE', canReceiveSMS: true },
            isPrimary: true,
            canMakeHealthcareDecisions: true,
          }]),
          'ACTIVE',
          daysAgo(180), // Intake 6 months ago
          JSON.stringify({
            primary: {
              type: 'MEDICARE',
              memberId: 'MCR123456789A',
              provider: 'Medicare',
              isActive: true
            },
            secondary: null
          }),
          JSON.stringify({
            medicaid: { eligible: false },
            medicare: {
              eligible: true,
              memberId: 'MCR123456789A',
              partA: true,
              partB: true
            }
          }),
          systemUserId,
          systemUserId,
        ]
      );

      // Update family user to link to Gertrude
      await client.query(
        `UPDATE family_members SET client_id = $1 WHERE email = 'family@carecommons.example'`,
        [gertrudeId]
      );

      // Create a family member record for the family portal if it doesn't exist
      const familyMemberCheck = await client.query(
        `SELECT id FROM family_members WHERE client_id = $1 LIMIT 1`,
        [gertrudeId]
      );

      let familyMemberId;
      if (familyMemberCheck.rows.length === 0) {
        familyMemberId = uuidv4();
        await client.query(
          `
          INSERT INTO family_members (
            id, organization_id, branch_id, client_id,
            first_name, last_name, email, phone_number,
            relationship, is_primary_contact,
            preferred_contact_method, portal_access_level,
            status, invitation_status, receive_notifications,
            access_granted_by, created_by, updated_by, is_demo_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, true)
          `,
          [
            familyMemberId,
            orgId,
            branchId,
            gertrudeId,
            'Stein',
            'Family',
            'family@carecommons.example',
            '555-0198',
            'CHILD',
            true,
            'EMAIL',
            'VIEW_DETAILED',
            'ACTIVE',
            'ACCEPTED',
            true,
            systemUserId,
            systemUserId,
            systemUserId,
          ]
        );
      } else {
        familyMemberId = familyMemberCheck.rows[0].id;
      }

      console.log(`✅ Created Gertrude Stein client\n`);

      // ═══════════════════════════════════════════════════════════════════════════
      // STEP 11: Create care plan for Gertrude
      // ═══════════════════════════════════════════════════════════════════════════

      console.log(`📋 Creating care plan for Gertrude...`);

      const gertrudePlanId = uuidv4();
      const primaryCaregiverId = caregivers[0]?.id; // Sarah Johnson

      await client.query(
        `
        INSERT INTO care_plans (
          id, organization_id, branch_id, client_id,
          plan_number, name, plan_type, status, priority,
          effective_date, expiration_date, review_date,
          primary_caregiver_id,
          assessment_summary, goals, estimated_hours_per_week,
          compliance_status, created_by, updated_by, is_demo_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, true)
        `,
        [
          gertrudePlanId,
          orgId,
          branchId,
          gertrudeId,
          'CP-FAMILY-0001',
          'Personal Care Plan for Gertrude Stein',
          'PERSONAL_CARE',
          'ACTIVE',
          'MEDIUM',
          daysAgo(60), // Effective 2 months ago
          daysFromNow(120), // Expires in 4 months
          daysFromNow(15), // Review in 2 weeks
          primaryCaregiverId,
          'Comprehensive care plan for Gertrude Stein. Client has mild dementia and requires assistance with ADLs. Lives independently with daily caregiver support.',
          JSON.stringify([
            {
              id: uuidv4(),
              category: 'MOBILITY',
              description: 'Maintain safe ambulation with walker',
              targetDate: daysFromNow(60),
              status: 'IN_PROGRESS',
              progress: 75,
            },
            {
              id: uuidv4(),
              category: 'ADL',
              description: 'Independent bathing with standby assistance',
              targetDate: daysFromNow(45),
              status: 'ON_TRACK',
              progress: 60,
            },
            {
              id: uuidv4(),
              category: 'SOCIAL_ENGAGEMENT',
              description: 'Attend weekly community activities',
              targetDate: daysFromNow(90),
              status: 'ACHIEVED',
              progress: 100,
            },
          ]),
          20, // 20 hours per week
          'COMPLIANT',
          systemUserId,
          systemUserId,
        ]
      );

      console.log(`✅ Created care plan for Gertrude\n`);

      // ═══════════════════════════════════════════════════════════════════════════
      // STEP 12: Create visits for Gertrude (upcoming and recent)
      // ═══════════════════════════════════════════════════════════════════════════

      console.log(`📅 Creating visits for Gertrude...`);

      const gertrudeVisits = [];

      // Create 3 visits today
      for (let i = 0; i < 3; i++) {
        const visitId = uuidv4();
        const caregiver = caregivers[i % caregivers.length];

        const scheduledStart = new Date();
        scheduledStart.setHours(8 + (i * 4), 0, 0, 0); // 8am, 12pm, 4pm

        const scheduledEnd = new Date(scheduledStart);
        scheduledEnd.setHours(scheduledEnd.getHours() + 2); // 2 hour visits

        await client.query(
          `
          INSERT INTO visits (
            id, organization_id, branch_id, client_id, assigned_caregiver_id,
            visit_number, visit_type, service_type_id, service_type_name,
            scheduled_date, scheduled_start_time, scheduled_end_time, scheduled_duration,
            address, status,
            created_by, updated_by, is_demo_data
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10::timestamp::date,
            $11::timestamp::time,
            $12::timestamp::time,
            $13, $14, $15, $16, $17, true
          )
          `,
          [
            visitId,
            orgId,
            branchId,
            gertrudeId,
            caregiver.id,
            `VIS-GERT-${String(i + 1).padStart(3, '0')}`,
            'REGULAR',
            visitId,
            'Personal Care',
            scheduledStart,
            scheduledStart,
            scheduledEnd,
            120, // 2 hours
            JSON.stringify({ type: 'HOME', line1: '456 Oak Avenue', city: 'Springfield', state: 'IL', postalCode: '62702', country: 'US' }),
            'SCHEDULED',
            systemUserId,
            systemUserId,
          ]
        );

        gertrudeVisits.push({ id: visitId, caregiverId: caregiver.id, scheduledStart, scheduledEnd, status: 'SCHEDULED' });
      }

      // Create 2 completed visits (yesterday)
      for (let i = 0; i < 2; i++) {
        const visitId = uuidv4();
        const caregiver = caregivers[i % caregivers.length];

        const scheduledStart = daysAgo(1);
        scheduledStart.setHours(8 + (i * 6), 0, 0, 0); // 8am, 2pm yesterday

        const scheduledEnd = new Date(scheduledStart);
        scheduledEnd.setHours(scheduledEnd.getHours() + 3); // 3 hour visits

        const actualStart = new Date(scheduledStart);
        actualStart.setMinutes(actualStart.getMinutes() + 5); // Started 5 mins late

        const actualEnd = new Date(scheduledEnd);
        actualEnd.setMinutes(actualEnd.getMinutes() - 10); // Ended 10 mins early

        await client.query(
          `
          INSERT INTO visits (
            id, organization_id, branch_id, client_id, assigned_caregiver_id,
            visit_number, visit_type, service_type_id, service_type_name,
            scheduled_date, scheduled_start_time, scheduled_end_time, scheduled_duration,
            actual_start_time, actual_end_time, actual_duration,
            address, status, completion_notes,
            created_by, updated_by, is_demo_data
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10::timestamp::date,
            $11::timestamp::time,
            $12::timestamp::time,
            $13, $14, $15, $16, $17, $18, $19, $20, $21, true
          )
          `,
          [
            visitId,
            orgId,
            branchId,
            gertrudeId,
            caregiver.id,
            `VIS-GERT-${String(i + 10).padStart(3, '0')}`,
            'REGULAR',
            visitId,
            'Personal Care',
            scheduledStart,
            scheduledStart,
            scheduledEnd,
            180, // 3 hours
            actualStart,
            actualEnd,
            170, // actual duration
            JSON.stringify({ type: 'HOME', line1: '456 Oak Avenue', city: 'Springfield', state: 'IL', postalCode: '62702', country: 'US' }),
            'COMPLETED',
            i === 0 ? 'Client in good spirits. Assisted with morning routine and medication. All tasks completed.' : 'Helped with afternoon ADLs. Client enjoyed conversation about gardening.',
            systemUserId,
            systemUserId,
          ]
        );

        gertrudeVisits.push({ id: visitId, caregiverId: caregiver.id, scheduledStart, actualStart, actualEnd, status: 'COMPLETED' });

        // Create visit summary for family
        await client.query(
          `
          INSERT INTO family_visit_summaries (
            id, visit_id, client_id, family_member_ids,
            scheduled_start_time, scheduled_end_time,
            actual_start_time, actual_end_time,
            caregiver_name, tasks_completed, visit_notes,
            status, visible_to_family, published_at, viewed_by_family,
            organization_id, branch_id,
            created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          `,
          [
            uuidv4(),
            visitId,
            gertrudeId,
            `{${familyMemberId}}`,
            scheduledStart,
            scheduledEnd,
            actualStart,
            actualEnd,
            `${caregiver.firstName} ${caregiver.lastName}`,
            JSON.stringify([
              { task: 'Morning hygiene assistance', completed: true },
              { task: 'Medication administration', completed: true },
              { task: 'Light housekeeping', completed: true },
              { task: 'Meal preparation', completed: true },
            ]),
            i === 0 ? 'Gertrude was in excellent spirits today. We completed all morning routines smoothly.' : 'Great visit today. Gertrude shared stories about her garden.',
            'COMPLETED',
            true,
            actualEnd,
            false,
            orgId,
            branchId,
            systemUserId,
            systemUserId,
          ]
        );
      }

      console.log(`✅ Created ${gertrudeVisits.length} visits for Gertrude\n`);

      // ═══════════════════════════════════════════════════════════════════════════
      // STEP 13: Create task instances for caregivers (7 pending tasks)
      // ═══════════════════════════════════════════════════════════════════════════

      console.log(`✅ Creating task instances for caregivers...`);

      const taskCategories = [
        { category: 'BATHING', name: 'Assist with morning bath', description: 'Help client with bathing, ensure safety', instructions: 'Use walk-in shower, ensure non-slip mat is in place', timeOfDay: 'MORNING' },
        { category: 'MEDICATION', name: 'Administer morning medications', description: 'Give prescribed medications', instructions: 'Check medication list, verify dosage, document administration', timeOfDay: 'MORNING' },
        { category: 'MEAL_PREPARATION', name: 'Prepare lunch', description: 'Prepare nutritious lunch', instructions: 'Follow dietary restrictions, ensure proper portion sizes', timeOfDay: 'AFTERNOON' },
        { category: 'MOBILITY', name: 'Assist with walking exercise', description: 'Help client walk with walker', instructions: 'Use walker, supervise closely, 15-minute walk', timeOfDay: 'AFTERNOON' },
        { category: 'HOUSEKEEPING', name: 'Light housekeeping', description: 'Tidy living areas', instructions: 'Vacuum living room, dust surfaces, organize items', timeOfDay: 'AFTERNOON' },
        { category: 'COMPANIONSHIP', name: 'Social engagement activity', description: 'Engage in conversation or activity', instructions: 'Discuss interests, play cards, or watch favorite show', timeOfDay: 'AFTERNOON' },
        { category: 'DOCUMENTATION', name: 'Complete visit documentation', description: 'Document all care provided', instructions: 'Record all tasks completed, note any changes in condition', timeOfDay: 'ANY' },
      ];

      let taskCount = 0;
      for (let i = 0; i < Math.min(7, taskCategories.length); i++) {
        const task = taskCategories[i];
        const assignedCaregiver = caregivers[i % caregivers.length];
        const assignedClient = i < 3 ? gertrudeId : clients[i % clients.length].id;
        const scheduledDate = i < 4 ? new Date() : daysFromNow(1); // 4 today, 3 tomorrow

        await client.query(
          `
          INSERT INTO task_instances (
            id, care_plan_id, client_id, assigned_caregiver_id,
            name, description, category, instructions,
            scheduled_date, time_of_day, estimated_duration,
            status, required_signature, required_note,
            created_by, updated_by, is_demo_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true)
          `,
          [
            uuidv4(),
            gertrudePlanId,
            assignedClient,
            assignedCaregiver.id,
            task.name,
            task.description,
            task.category,
            task.instructions,
            scheduledDate,
            task.timeOfDay,
            30, // 30 minutes
            'SCHEDULED',
            task.category === 'MEDICATION',
            true,
            systemUserId,
            systemUserId,
          ]
        );
        taskCount++;
      }

      console.log(`✅ Created ${taskCount} task instances\n`);

      // ═══════════════════════════════════════════════════════════════════════════
      // STEP 14: Create message threads and messages for family portal
      // ═══════════════════════════════════════════════════════════════════════════

      console.log(`💬 Creating message threads for family portal...`);

      // Get the family user ID for sending messages
      const familyUserResult = await client.query(
        `SELECT id FROM users WHERE email = 'family@carecommons.example' LIMIT 1`
      );
      const familyUserId = familyUserResult.rows.length > 0 ? familyUserResult.rows[0].id : systemUserId;

      const messageThreads = [
        {
          subject: 'Question about medication schedule',
          messages: [
            { sender: 'FAMILY', text: 'Hi, I noticed the medication schedule changed. Can you explain the new timing?', hoursAgo: 48 },
            { sender: 'STAFF', text: 'Hello! The doctor adjusted the timing to optimize effectiveness. Morning meds are now at 9am instead of 8am.', hoursAgo: 46 },
            { sender: 'FAMILY', text: 'Thank you for clarifying! That makes sense.', hoursAgo: 45 },
          ]
        },
        {
          subject: 'Update on mom\'s progress',
          messages: [
            { sender: 'STAFF', text: 'Wanted to share some good news - Gertrude has been doing wonderfully with her walking exercises!', hoursAgo: 24 },
            { sender: 'FAMILY', text: 'That\'s wonderful to hear! She mentioned enjoying her time with Sarah.', hoursAgo: 22 },
            { sender: 'STAFF', text: 'Yes, they have a great rapport. We\'re seeing consistent improvement in her mobility.', hoursAgo: 20 },
          ]
        },
        {
          subject: 'Upcoming care plan review',
          messages: [
            { sender: 'STAFF', text: 'This is a reminder that Gertrude\'s care plan review is scheduled for next week. Would you like to attend?', hoursAgo: 4 },
          ]
        },
      ];

      let threadCount = 0;
      let messageCount = 0;

      for (const threadData of messageThreads) {
        const threadId = uuidv4();
        const lastMessageTime = _hoursAgo(threadData.messages[threadData.messages.length - 1].hoursAgo);

        await client.query(
          `
          INSERT INTO message_threads (
            id, family_member_id, client_id,
            subject, status, priority,
            participants, last_message_at, message_count,
            unread_count_family, unread_count_staff,
            organization_id, branch_id,
            created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          `,
          [
            threadId,
            familyMemberId,
            gertrudeId,
            threadData.subject,
            threadData.messages.length === 1 ? 'OPEN' : 'OPEN',
            'NORMAL',
            `{${systemUserId},${familyMemberId}}`,
            lastMessageTime,
            threadData.messages.length,
            threadData.messages[threadData.messages.length - 1].sender === 'STAFF' ? 1 : 0,
            threadData.messages[threadData.messages.length - 1].sender === 'FAMILY' ? 1 : 0,
            orgId,
            branchId,
            systemUserId,
            systemUserId,
          ]
        );

        threadCount++;

        for (const msg of threadData.messages) {
          const isStaff = msg.sender === 'STAFF';

          await client.query(
            `
            INSERT INTO messages (
              id, thread_id, family_member_id, client_id,
              sent_by, sender_type, sender_name,
              message_text, status,
              organization_id,
              created_by, updated_by, is_demo_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
            `,
            [
              uuidv4(),
              threadId,
              familyMemberId,
              gertrudeId,
              isStaff ? systemUserId : familyUserId,
              msg.sender,
              isStaff ? 'Care Coordinator' : 'Stein Family',
              msg.text,
              'SENT',
              orgId,
              systemUserId,
              systemUserId,
            ]
          );

          messageCount++;
        }
      }

      console.log(`✅ Created ${threadCount} message threads with ${messageCount} messages\n`);

      // ═══════════════════════════════════════════════════════════════════════════
      // STEP 15: Create activity feed entries for family portal
      // ═══════════════════════════════════════════════════════════════════════════

      console.log(`📰 Creating activity feed entries...`);

      const activities = [
        { type: 'VISIT_COMPLETED', title: 'Visit completed', description: 'Morning care visit completed by Sarah Johnson', relatedType: 'VISIT', relatedId: gertrudeVisits[3]?.id, hoursAgo: 2, icon: 'check-circle' },
        { type: 'TASK_COMPLETED', title: 'Medication administered', description: 'Morning medications administered and documented', relatedType: 'TASK', relatedId: uuidv4(), hoursAgo: 4, icon: 'pill' },
        { type: 'NOTE_ADDED', title: 'Progress note added', description: 'Care coordinator added notes about improved mobility', relatedType: 'NOTE', relatedId: uuidv4(), hoursAgo: 24, icon: 'file-text' },
        { type: 'VISIT_SCHEDULED', title: 'New visit scheduled', description: 'Visit scheduled for tomorrow at 9:00 AM', relatedType: 'VISIT', relatedId: gertrudeVisits[0]?.id, hoursAgo: 48, icon: 'calendar' },
        { type: 'CARE_PLAN_UPDATED', title: 'Care plan updated', description: 'Care plan goals updated - walking exercise goal achieved', relatedType: 'CARE_PLAN', relatedId: gertrudePlanId, hoursAgo: 72, icon: 'clipboard' },
      ];

      let activityCount = 0;
      for (const activity of activities) {
        if (!activity.relatedId) continue; // Skip if no related ID

        await client.query(
          `
          INSERT INTO family_activity_feed (
            id, family_member_id, client_id,
            activity_type, title, description,
            related_entity_type, related_entity_id,
            performed_by, performed_by_name, occurred_at,
            icon_type, viewed_by_family,
            organization_id, branch_id,
            created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          `,
          [
            uuidv4(),
            familyMemberId,
            gertrudeId,
            activity.type,
            activity.title,
            activity.description,
            activity.relatedType,
            activity.relatedId,
            systemUserId,
            'Care Team',
            _hoursAgo(activity.hoursAgo),
            activity.icon,
            false,
            orgId,
            branchId,
            systemUserId,
            systemUserId,
          ]
        );
        activityCount++;
      }

      console.log(`✅ Created ${activityCount} activity feed entries\n`);

      // ═══════════════════════════════════════════════════════════════════════════
      // SUMMARY
      // ═══════════════════════════════════════════════════════════════════════════
      
      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('✅ DEMO DATA SEEDED SUCCESSFULLY!');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`📊 Summary:`);
      console.log(`   - ${clients.length + 1} clients (${clients.filter(c => c.state === 'TX').length} TX, ${clients.filter(c => c.state === 'FL').length} FL, ${clients.filter(c => c.state === 'OH').length} OH, 1 Gertrude Stein)`);
      console.log(`   - ${caregivers.length} caregivers`);
      console.log(`   - ${visits.length + gertrudeVisits.length} visits (${visits.length} general + ${gertrudeVisits.length} Gertrude)`);
      console.log(`   - ${visits.filter(v => v.status === 'COMPLETED').length + gertrudeVisits.filter(v => v.status === 'COMPLETED').length} completed visits with EVV data`);
      console.log(`   - ${visits.filter(v => v.status === 'IN_PROGRESS').length} visits in progress`);
      console.log(`   - ${visits.filter(v => v.status === 'SCHEDULED').length + gertrudeVisits.filter(v => v.status === 'SCHEDULED').length} scheduled future visits`);
      console.log(`   - ${carePlans.length + 1} care plans with goals (includes Gertrude's plan)`);
      console.log(`   - ${familyMembers.length + 1} family members with portal access`);
      console.log(`   - ${taskCount} task instances for caregivers`);
      console.log(`   - ${threadCount} message threads with ${messageCount} messages`);
      console.log(`   - ${activityCount} activity feed entries`);
      console.log(`   - ${invoiceCount} invoices generated`);
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('\n📋 Special Demo Data:');
      console.log(`   🎯 Gertrude Stein (Family Portal Demo):`);
      console.log(`      - Client ID: ${gertrudeId.substring(0, 8)}...`);
      console.log(`      - ${gertrudeVisits.length} visits (3 today, 2 completed yesterday)`);
      console.log(`      - ${taskCount} pending tasks for caregivers`);
      console.log(`      - ${threadCount} message conversations with care team`);
      console.log(`      - ${activityCount} recent activities logged`);
      console.log(`      - Family portal: family@carecommons.example / Family123!`);
      console.log('═══════════════════════════════════════════════════════════════\n');
    });

    await db.close();
    console.log('✅ Database connection closed');
    console.log('\n🎉 Done! Your demo environment is ready with comprehensive data across all states and roles.\n');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed script
seedDatabase()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
