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
  
  let status = 'SCHEDULED';
  let actualStart = null;
  let actualEnd = null;
  let evvClockInGPS = null;
  let evvClockOutGPS = null;
  let evvVerificationMethod = null;
  let notes = null;
  
  // Past visits are completed
  if (dayOffset < 0) {
    status = randomElement(['COMPLETED', 'COMPLETED', 'COMPLETED', 'NO_SHOW', 'CANCELLED']);
    
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
    visitType: randomElement(['PERSONAL_CARE', 'SKILLED_NURSING', 'COMPANION', 'RESPITE']),
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
            first_name, last_name, role, status,
            created_by, updated_by, is_demo_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
          `,
          [
            caregiverUserId,
            orgId,
            caregiver.email,
            '$2b$10$DEMO_HASH', // Demo password hash
            caregiver.firstName,
            caregiver.lastName,
            'CAREGIVER',
            'ACTIVE',
            systemUserId,
            systemUserId,
          ]
        );
        
        // Create caregiver record
        await client.query(
          `
          INSERT INTO caregivers (
            id, organization_id, branch_id, user_id, employee_number,
            first_name, last_name, date_of_birth, gender,
            phone, email, address,
            hire_date, employment_type, hourly_rate,
            certifications, specializations, languages,
            max_drive_distance_miles, status,
            created_by, updated_by, is_demo_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, true)
          `,
          [
            caregiver.id,
            caregiver.organizationId,
            caregiver.branchId,
            caregiverUserId,
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
            caregiver.hourlyRate,
            JSON.stringify(caregiver.certifications),
            JSON.stringify(caregiver.specializations),
            JSON.stringify(caregiver.languages),
            caregiver.maxDriveDistance,
            'ACTIVE',
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
            id, organization_id, branch_id, client_id, caregiver_id,
            scheduled_start, scheduled_end, actual_start, actual_end,
            status, visit_type, visit_notes,
            created_by, updated_by, is_demo_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
          `,
          [
            visit.id,
            visit.organizationId,
            visit.branchId,
            visit.clientId,
            visit.caregiverId,
            visit.scheduledStart,
            visit.scheduledEnd,
            visit.actualStart,
            visit.actualEnd,
            visit.status,
            visit.visitType,
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
              id, visit_id, clock_in_time, clock_in_gps_location,
              clock_out_time, clock_out_gps_location,
              verification_method, compliance_status,
              created_by, updated_by, is_demo_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
            `,
            [
              uuidv4(),
              visit.id,
              visit.actualStart,
              JSON.stringify(visit.evvClockInGPS),
              visit.actualEnd,
              visit.evvClockOutGPS ? JSON.stringify(visit.evvClockOutGPS) : null,
              visit.evvVerificationMethod,
              visit.status === 'COMPLETED' ? 'COMPLIANT' : 'PENDING',
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
      // STEP 8: Generate basic invoices (for completed visits)
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
          const status = randomElement<string>(['DRAFT', 'SENT', 'PAID', 'OVERDUE']);
          
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
              'SERVICE',
              invoiceClient.medicaidNumber ? orgId : invoiceClient.id, // Medicaid or private pay
              invoiceClient.medicaidNumber ? 'MEDICAID' : 'PRIVATE_PAY',
              invoiceClient.medicaidNumber ? 'Medicaid' : `${invoiceClient.firstName} ${invoiceClient.lastName}`,
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
      // SUMMARY
      // ═══════════════════════════════════════════════════════════════════════════
      
      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('✅ DEMO DATA SEEDED SUCCESSFULLY!');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`📊 Summary:`);
      console.log(`   - ${clients.length} clients (${clients.filter(c => c.state === 'TX').length} TX, ${clients.filter(c => c.state === 'FL').length} FL, ${clients.filter(c => c.state === 'OH').length} OH)`);
      console.log(`   - ${caregivers.length} caregivers`);
      console.log(`   - ${visits.length} visits`);
      console.log(`   - ${visits.filter(v => v.status === 'COMPLETED').length} completed visits with EVV data`);
      console.log(`   - ${visits.filter(v => v.status === 'IN_PROGRESS').length} visits in progress`);
      console.log(`   - ${visits.filter(v => v.status === 'SCHEDULED').length} scheduled future visits`);
      console.log(`   - ${carePlans.length} care plans with goals`);
      console.log(`   - ${familyMembers.length} family members with portal access`);
      console.log(`   - ${invoiceCount} invoices generated`);
      console.log(`   - Total records created: ${clients.length + caregivers.length + visits.length + carePlans.length + familyMembers.length + invoiceCount + visits.filter(v => v.evvClockInGPS).length}`);
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
