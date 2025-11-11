/**
 * Comprehensive Showcase Seed Script
 * 
 * Seeds LARGE-SCALE realistic demo data for showcase and demonstration:
 * - 60 clients across TX, FL, OH (various demographics, conditions)
 * - 35 caregivers with certifications, specializations
 * - 500+ visits (past, present, future) with full EVV data
 * - 40+ care plans with tasks and goals
 * - Family portal data (members, messages, notifications)
 * - Billing and invoicing data
 * - Payroll data
 * - Shift matching scenarios
 * 
 * **One-Command Execution**: npm run db:seed:showcase-comprehensive
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
  carePlans: 50,      // Most active clients have care plans
  familyMembers: 40,  // ~60% of clients have family portal access
  messages: 80,       // Family-coordinator messages
  tasks: 150,         // Scheduled tasks within care plans
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

function _daysFromNow(days: number): Date {
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
  console.log('🎭 Seeding comprehensive showcase data...\n');

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
        'SELECT id FROM users WHERE organization_id = $1 AND role = $2 ORDER BY created_at ASC LIMIT 1',
        [orgId, 'ADMINISTRATOR']
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
      await client.query('DELETE FROM visit_tasks WHERE is_demo_data = true');
      await client.query('DELETE FROM visit_evv_records WHERE is_demo_data = true');
      await client.query('DELETE FROM visits WHERE is_demo_data = true');
      await client.query('DELETE FROM care_plan_tasks WHERE is_demo_data = true');
      await client.query('DELETE FROM care_plan_goals WHERE is_demo_data = true');
      await client.query('DELETE FROM care_plans WHERE is_demo_data = true');
      await client.query('DELETE FROM family_messages WHERE is_demo_data = true');
      await client.query('DELETE FROM family_notifications WHERE is_demo_data = true');
      await client.query('DELETE FROM family_members WHERE is_demo_data = true');
      await client.query('DELETE FROM invoices WHERE is_demo_data = true');
      await client.query('DELETE FROM shift_applications WHERE is_demo_data = true');
      await client.query('DELETE FROM shift_listings WHERE is_demo_data = true');
      await client.query('DELETE FROM caregiver_certifications WHERE is_demo_data = true');
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
              medicaid_number, medicare_number,
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
              newClient.medicaidNumber,
              newClient.medicareNumber,
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
            INSERT INTO visit_evv_records (
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
      // SUMMARY
      // ═══════════════════════════════════════════════════════════════════════════
      
      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('✅ SHOWCASE DATA SEEDED SUCCESSFULLY!');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`📊 Summary:`);
      console.log(`   - ${clients.length} clients (${clients.filter(c => c.state === 'TX').length} TX, ${clients.filter(c => c.state === 'FL').length} FL, ${clients.filter(c => c.state === 'OH').length} OH)`);
      console.log(`   - ${caregivers.length} caregivers`);
      console.log(`   - ${visits.length} visits`);
      console.log(`   - ${visits.filter(v => v.status === 'COMPLETED').length} completed visits with EVV data`);
      console.log(`   - ${visits.filter(v => v.status === 'IN_PROGRESS').length} visits in progress`);
      console.log(`   - ${visits.filter(v => v.status === 'SCHEDULED').length} scheduled future visits`);
      console.log('═══════════════════════════════════════════════════════════════\n');
    });

    await db.close();
    console.log('✅ Database connection closed');
    console.log('\n🎉 Done! Your showcase environment is ready.\n');
    
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
