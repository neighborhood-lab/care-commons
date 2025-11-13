/**
 * Comprehensive Demo Data Seeding Script
 * 
 * Creates realistic, comprehensive demo data for ALL 50 US States + DC:
 * - Users (255 total: 5 roles × 51 states)
 * - Clients (5 per state = 255 clients)
 * - Caregivers (3 per state = 153 caregivers)
 * - Visits (10 per state = 510 visits)
 * - Care Plans (1 per client = 255 plans)
 * - Tasks (5 per care plan = 1,275 tasks)
 * - Medications (2 per client = 510 medications)
 * - Clinical Notes (3 per client = 765 notes)
 * - Incidents (1 per 10 clients = 26 incidents)
 * - Quality Audits (1 per state = 51 audits)
 * 
 * Total records: ~4,000+ realistic demo records
 */

import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { Database, DatabaseConfig } from '../src/db/connection.js';
import { PasswordUtils } from '../src/utils/password-utils.js';
import { Pool, PoolClient } from 'pg';

dotenv.config({ path: '.env', quiet: true });

// All 50 US States + DC
const US_STATES = [
  { code: 'AL', name: 'Alabama', city: 'Birmingham' },
  { code: 'AK', name: 'Alaska', city: 'Anchorage' },
  { code: 'AZ', name: 'Arizona', city: 'Phoenix' },
  { code: 'AR', name: 'Arkansas', city: 'Little Rock' },
  { code: 'CA', name: 'California', city: 'Los Angeles' },
  { code: 'CO', name: 'Colorado', city: 'Denver' },
  { code: 'CT', name: 'Connecticut', city: 'Hartford' },
  { code: 'DE', name: 'Delaware', city: 'Wilmington' },
  { code: 'FL', name: 'Florida', city: 'Miami' },
  { code: 'GA', name: 'Georgia', city: 'Atlanta' },
  { code: 'HI', name: 'Hawaii', city: 'Honolulu' },
  { code: 'ID', name: 'Idaho', city: 'Boise' },
  { code: 'IL', name: 'Illinois', city: 'Chicago' },
  { code: 'IN', name: 'Indiana', city: 'Indianapolis' },
  { code: 'IA', name: 'Iowa', city: 'Des Moines' },
  { code: 'KS', name: 'Kansas', city: 'Wichita' },
  { code: 'KY', name: 'Kentucky', city: 'Louisville' },
  { code: 'LA', name: 'Louisiana', city: 'New Orleans' },
  { code: 'ME', name: 'Maine', city: 'Portland' },
  { code: 'MD', name: 'Maryland', city: 'Baltimore' },
  { code: 'MA', name: 'Massachusetts', city: 'Boston' },
  { code: 'MI', name: 'Michigan', city: 'Detroit' },
  { code: 'MN', name: 'Minnesota', city: 'Minneapolis' },
  { code: 'MS', name: 'Mississippi', city: 'Jackson' },
  { code: 'MO', name: 'Missouri', city: 'Kansas City' },
  { code: 'MT', name: 'Montana', city: 'Billings' },
  { code: 'NE', name: 'Nebraska', city: 'Omaha' },
  { code: 'NV', name: 'Nevada', city: 'Las Vegas' },
  { code: 'NH', name: 'New Hampshire', city: 'Manchester' },
  { code: 'NJ', name: 'New Jersey', city: 'Newark' },
  { code: 'NM', name: 'New Mexico', city: 'Albuquerque' },
  { code: 'NY', name: 'New York', city: 'New York' },
  { code: 'NC', name: 'North Carolina', city: 'Charlotte' },
  { code: 'ND', name: 'North Dakota', city: 'Fargo' },
  { code: 'OH', name: 'Ohio', city: 'Cleveland' },
  { code: 'OK', name: 'Oklahoma', city: 'Oklahoma City' },
  { code: 'OR', name: 'Oregon', city: 'Portland' },
  { code: 'PA', name: 'Pennsylvania', city: 'Philadelphia' },
  { code: 'RI', name: 'Rhode Island', city: 'Providence' },
  { code: 'SC', name: 'South Carolina', city: 'Charleston' },
  { code: 'SD', name: 'South Dakota', city: 'Sioux Falls' },
  { code: 'TN', name: 'Tennessee', city: 'Nashville' },
  { code: 'TX', name: 'Texas', city: 'Houston' },
  { code: 'UT', name: 'Utah', city: 'Salt Lake City' },
  { code: 'VT', name: 'Vermont', city: 'Burlington' },
  { code: 'VA', name: 'Virginia', city: 'Virginia Beach' },
  { code: 'WA', name: 'Washington', city: 'Seattle' },
  { code: 'WV', name: 'West Virginia', city: 'Charleston' },
  { code: 'WI', name: 'Wisconsin', city: 'Milwaukee' },
  { code: 'WY', name: 'Wyoming', city: 'Cheyenne' },
  { code: 'DC', name: 'District of Columbia', city: 'Washington' },
] as const;

// First names for variety
const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa',
  'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Sharon',
  'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker'
];

// Medical conditions for realistic data
const CONDITIONS = [
  'Diabetes Type 2', 'Hypertension', 'CHF', 'COPD', 'Arthritis',
  'Dementia', 'Alzheimers', 'Parkinsons', 'Stroke Recovery', 'Post-Surgical Care',
  'Mobility Impairment', 'Fall Risk', 'Wound Care', 'Cardiac Disease', 'Renal Disease'
];

// Common medications
const MEDICATIONS = [
  { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', route: 'Oral' },
  { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', route: 'Oral' },
  { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily at bedtime', route: 'Oral' },
  { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', route: 'Oral' },
  { name: 'Omeprazole', dosage: '20mg', frequency: 'Once daily before breakfast', route: 'Oral' },
  { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily', route: 'Oral' },
  { name: 'Warfarin', dosage: '5mg', frequency: 'Once daily', route: 'Oral' },
  { name: 'Furosemide', dosage: '40mg', frequency: 'Once daily', route: 'Oral' },
  { name: 'Levothyroxine', dosage: '75mcg', frequency: 'Once daily on empty stomach', route: 'Oral' },
  { name: 'Gabapentin', dosage: '300mg', frequency: 'Three times daily', route: 'Oral' }
];

// Care tasks
const CARE_TASKS = [
  { name: 'Vital Signs Monitoring', description: 'Check blood pressure, pulse, temperature, respiration', frequency: 'Daily' },
  { name: 'Medication Administration', description: 'Administer prescribed medications per schedule', frequency: 'Per Schedule' },
  { name: 'Personal Hygiene Assistance', description: 'Assist with bathing, grooming, oral care', frequency: 'Daily' },
  { name: 'Meal Preparation', description: 'Prepare nutritious meals per dietary restrictions', frequency: 'Three times daily' },
  { name: 'Light Housekeeping', description: 'Maintain clean and safe environment', frequency: 'Daily' },
  { name: 'Ambulation Assistance', description: 'Assist with walking and mobility exercises', frequency: 'Twice daily' },
  { name: 'Diabetic Foot Care', description: 'Inspect feet for wounds, proper nail care', frequency: 'Daily' },
  { name: 'Fall Prevention', description: 'Ensure environment is safe, assist with transfers', frequency: 'Ongoing' },
  { name: 'Companionship', description: 'Engage in conversation and activities', frequency: 'Throughout visit' },
  { name: 'Documentation', description: 'Complete visit notes and update care plan', frequency: 'Each visit' }
];

// Role definitions
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
    permissions: ['organizations:*', 'users:*', 'clients:*', 'caregivers:*', 'visits:*', 'schedules:*', 'care-plans:*', 'billing:*', 'reports:*', 'settings:*']
  },
  {
    value: 'COORDINATOR',
    label: 'Care Coordinator',
    roles: ['COORDINATOR', 'SCHEDULER'],
    permissions: ['clients:create', 'clients:read', 'clients:update', 'caregivers:read', 'caregivers:assign', 'visits:*', 'schedules:*', 'care-plans:*', 'reports:read', 'reports:generate']
  },
  {
    value: 'CAREGIVER',
    label: 'Caregiver',
    roles: ['CAREGIVER'],
    permissions: ['clients:read', 'visits:read', 'visits:clock-in', 'visits:clock-out', 'visits:update', 'care-plans:read', 'tasks:read', 'tasks:update']
  },
  {
    value: 'FAMILY',
    label: 'Family Member',
    roles: ['FAMILY'],
    permissions: ['clients:read', 'visits:read', 'care-plans:read', 'schedules:read']
  },
  {
    value: 'NURSE',
    label: 'Nurse/Clinical',
    roles: ['NURSE', 'CLINICAL'],
    permissions: ['clients:read', 'clients:update', 'visits:*', 'care-plans:*', 'medications:*', 'clinical:*']
  }
];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

async function seedComprehensiveDemo() {
  console.log('🌎 COMPREHENSIVE DEMO DATA SEEDING');
  console.log('═══════════════════════════════════\n');
  console.log('Creating realistic demo data for all 50 states + DC\n');

  const env = process.env['NODE_ENV'] ?? 'development';
  const dbName = process.env['DB_NAME'] ?? 'care_commons';

  let db: Database | { 
    transaction: (callback: (client: PoolClient) => Promise<void>) => Promise<void>; 
    close: () => Promise<void> 
  };

  if (process.env['DATABASE_URL']) {
    console.log('📝 Using DATABASE_URL for seeding\n');
    const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
    
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
      host: process.env['DB_HOST'] ?? 'localhost',
      port: parseInt(process.env['DB_PORT'] ?? '5432'),
      database,
      user: process.env['DB_USER'] ?? 'postgres',
      password: process.env['DB_PASSWORD'] ?? 'postgres',
      ssl: process.env['DB_SSL'] === 'true',
    };
    
    db = new Database(config);
  }

  try {
    await db.transaction(async (client: PoolClient) => {
      // Get organization and branch
      const orgResult = await client.query(
        'SELECT id FROM organizations WHERE name = $1 LIMIT 1',
        ['Care Commons Home Health']
      );

      if (orgResult.rows.length === 0) {
        throw new Error('Organization not found. Please run db:seed first.');
      }

      const organizationId = orgResult.rows[0].id;

      const branchResult = await client.query(
        'SELECT id FROM branches WHERE organization_id = $1 AND code = $2 LIMIT 1',
        [organizationId, 'MAIN']
      );

      if (branchResult.rows.length === 0) {
        throw new Error('Branch not found. Please run db:seed first.');
      }

      const branchId = branchResult.rows[0].id;

      const stats = {
        users: 0,
        clients: 0,
        caregivers: 0,
        visits: 0,
        carePlans: 0,
        tasks: 0,
        medications: 0,
        clinicalNotes: 0,
        incidents: 0,
        audits: 0
      };

      // Process each state
      for (const state of US_STATES) {
        console.log(`\n🏛️  ${state.name} (${state.code})`);
        console.log('─'.repeat(50));

        // 1. CREATE USERS (5 roles per state)
        process.stdout.write('👤 Users: ');
        const stateUsers: Record<string, string> = {};
        
        for (const role of ROLES) {
          const stateCode = state.code.toLowerCase();
          const roleCode = role.value.toLowerCase();
          
          const email = `${roleCode}@${stateCode}.carecommons.example`;
          const username = `${roleCode}-${stateCode}`;
          const password = `Demo${state.code}${role.value}123!`;
          const passwordHash = PasswordUtils.hashPassword(password);
          
          const userId = uuidv4();
          stateUsers[role.value] = userId;

          try {
            await client.query(
              `INSERT INTO users (
                id, organization_id, username, email, password_hash,
                first_name, last_name, roles, permissions, branch_ids,
                status, created_by, updated_by
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
              ON CONFLICT (email) DO UPDATE SET
                password_hash = EXCLUDED.password_hash,
                roles = EXCLUDED.roles,
                permissions = EXCLUDED.permissions,
                updated_at = NOW()
              `,
              [
                userId, organizationId, username, email, passwordHash,
                role.label, `(${state.code})`, role.roles, role.permissions, [branchId],
                'ACTIVE', userId, userId
              ]
            );
            stats.users++;
            process.stdout.write('.');
          // eslint-disable-next-line sonarjs/no-ignored-exceptions
          } catch (_error) {
            // User exists (conflict on unique email), fetch existing ID
            const existing = await client.query(
              'SELECT id FROM users WHERE email = $1',
              [email]
            );
            if (existing.rows.length > 0) {
              stateUsers[role.value] = existing.rows[0].id;
            }
          }
        }
        console.log(` ✓ ${ROLES.length} users`);

        // 2. CREATE CLIENTS (5 per state)
        process.stdout.write('🏥 Clients: ');
        const stateClients: string[] = [];
        
        for (let i = 0; i < 5; i++) {
          const clientId = uuidv4();
          const firstName = randomElement(FIRST_NAMES);
          const lastName = randomElement(LAST_NAMES);
          const age = 65 + Math.floor(Math.random() * 30); // 65-95 years old
          const condition = randomElement(CONDITIONS);
          
          await client.query(
            `INSERT INTO clients (
              id, organization_id, branch_id, first_name, last_name,
              date_of_birth, gender, phone, email,
              address_line1, city, state, zip_code,
              status, medicaid_number, medicare_number,
              emergency_contact_name, emergency_contact_phone,
              primary_diagnosis, created_by, updated_by
            ) VALUES (
              $1, $2, $3, $4, $5,
              $6, $7, $8, $9,
              $10, $11, $12, $13,
              $14, $15, $16,
              $17, $18,
              $19, $20, $21
            )
            ON CONFLICT (id) DO NOTHING
            `,
            [
              clientId, organizationId, branchId, firstName, lastName,
              formatDate(new Date(Date.now() - age * 365.25 * 24 * 60 * 60 * 1000)),
              randomElement(['M', 'F', 'Other']),
              `(555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
              `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
              `${Math.floor(Math.random() * 9000) + 1000} ${randomElement(['Main', 'Oak', 'Maple', 'Cedar', 'Pine'])} St`,
              state.city,
              state.code,
              `${Math.floor(Math.random() * 90000) + 10000}`,
              'ACTIVE',
              `MC${state.code}${Math.floor(Math.random() * 900000) + 100000}`,
              `MR${state.code}${Math.floor(Math.random() * 900000) + 100000}`,
              randomElement(FIRST_NAMES) + ' ' + randomElement(LAST_NAMES),
              `(555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
              condition,
              stateUsers['ADMIN'],
              stateUsers['ADMIN']
            ]
          );
          stateClients.push(clientId);
          stats.clients++;
          process.stdout.write('.');
        }
        console.log(` ✓ 5 clients`);

        // 3. CREATE CAREGIVERS (3 per state)
        process.stdout.write('🤝 Caregivers: ');
        const stateCaregivers: string[] = [];
        
        for (let i = 0; i < 3; i++) {
          const caregiverId = uuidv4();
          const firstName = randomElement(FIRST_NAMES);
          const lastName = randomElement(LAST_NAMES);
          
          await client.query(
            `INSERT INTO caregivers (
              id, organization_id, branch_id, first_name, last_name,
              email, phone, hire_date, status,
              certifications, skills, hourly_rate,
              created_by, updated_by
            ) VALUES (
              $1, $2, $3, $4, $5,
              $6, $7, $8, $9,
              $10, $11, $12,
              $13, $14
            )
            ON CONFLICT (id) DO NOTHING
            `,
            [
              caregiverId, organizationId, branchId, firstName, lastName,
              `${firstName.toLowerCase()}.${lastName.toLowerCase()}@caregivers.example.com`,
              `(555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
              formatDate(randomDate(new Date(2020, 0, 1), new Date())),
              'ACTIVE',
              ['CNA', 'CPR', 'First Aid'],
              ['Personal Care', 'Medication Administration', 'Vital Signs', 'Wound Care'],
              15 + Math.floor(Math.random() * 15), // $15-$30/hr
              stateUsers['ADMIN'],
              stateUsers['ADMIN']
            ]
          );
          stateCaregivers.push(caregiverId);
          stats.caregivers++;
          process.stdout.write('.');
        }
        console.log(` ✓ 3 caregivers`);

        // 4. CREATE CARE PLANS (1 per client)
        process.stdout.write('📋 Care Plans: ');
        
        for (const clientId of stateClients) {
          const carePlanId = uuidv4();
          
          await client.query(
            `INSERT INTO care_plans (
              id, client_id, organization_id, branch_id,
              diagnosis, goals, frequency, start_date,
              status, created_by, updated_by
            ) VALUES (
              $1, $2, $3, $4,
              $5, $6, $7, $8,
              $9, $10, $11
            )
            ON CONFLICT (id) DO NOTHING
            `,
            [
              carePlanId, clientId, organizationId, branchId,
              randomElement(CONDITIONS),
              ['Maintain independence', 'Prevent falls', 'Manage chronic conditions', 'Improve mobility'],
              'Daily',
              formatDate(new Date()),
              'ACTIVE',
              stateUsers['COORDINATOR'],
              stateUsers['COORDINATOR']
            ]
          );
          stats.carePlans++;
          
          // 5. CREATE TASKS (5 per care plan)
          for (let i = 0; i < 5; i++) {
            const task = randomElement(CARE_TASKS);
            await client.query(
              `INSERT INTO care_plan_tasks (
                id, care_plan_id, name, description,
                frequency, status, created_by, updated_by
              ) VALUES (
                $1, $2, $3, $4,
                $5, $6, $7, $8
              )
              ON CONFLICT (id) DO NOTHING
              `,
              [
                uuidv4(), carePlanId, task.name, task.description,
                task.frequency, 'ACTIVE',
                stateUsers['COORDINATOR'], stateUsers['COORDINATOR']
              ]
            );
            stats.tasks++;
          }
          process.stdout.write('.');
        }
        console.log(` ✓ ${stateClients.length} plans (${stats.tasks} tasks)`);

        // 6. CREATE VISITS (10 per state = 2 per client)
        process.stdout.write('🏠 Visits: ');
        
        for (let i = 0; i < 10; i++) {
          const clientId = randomElement(stateClients);
          const caregiverId = randomElement(stateCaregivers);
          const visitDate = randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
          
          await client.query(
            `INSERT INTO visits (
              id, client_id, caregiver_id, organization_id, branch_id,
              scheduled_start_time, scheduled_end_time,
              status, visit_type, created_by, updated_by
            ) VALUES (
              $1, $2, $3, $4, $5,
              $6, $7,
              $8, $9, $10, $11
            )
            ON CONFLICT (id) DO NOTHING
            `,
            [
              uuidv4(), clientId, caregiverId, organizationId, branchId,
              visitDate,
              new Date(visitDate.getTime() + 2 * 60 * 60 * 1000), // 2 hour visit
              randomElement(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED']),
              'PERSONAL_CARE',
              stateUsers['COORDINATOR'],
              stateUsers['COORDINATOR']
            ]
          );
          stats.visits++;
          process.stdout.write('.');
        }
        console.log(` ✓ 10 visits`);

        // 7. CREATE MEDICATIONS (2 per client)
        process.stdout.write('💊 Medications: ');
        
        for (const clientId of stateClients) {
          for (let i = 0; i < 2; i++) {
            const med = randomElement(MEDICATIONS);
            await client.query(
              `INSERT INTO medications (
                id, client_id, organization_id, branch_id,
                name, dosage, frequency, route,
                prescriber_name, start_date, status,
                created_by, updated_by
              ) VALUES (
                $1, $2, $3, $4,
                $5, $6, $7, $8,
                $9, $10, $11,
                $12, $13
              )
              ON CONFLICT (id) DO NOTHING
              `,
              [
                uuidv4(), clientId, organizationId, branchId,
                med.name, med.dosage, med.frequency, med.route,
                `Dr. ${randomElement(LAST_NAMES)}`,
                formatDate(randomDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), new Date())),
                'ACTIVE',
                stateUsers['NURSE'],
                stateUsers['NURSE']
              ]
            );
            stats.medications++;
          }
          process.stdout.write('.');
        }
        console.log(` ✓ ${stateClients.length * 2} medications`);

        // 8. CREATE CLINICAL NOTES (3 per client)
        process.stdout.write('📝 Clinical Notes: ');
        
        for (const clientId of stateClients) {
          for (let i = 0; i < 3; i++) {
            await client.query(
              `INSERT INTO clinical_visit_notes (
                id, client_id, visit_id, organization_id,
                note_type, subjective, objective, assessment, plan,
                created_by, updated_by
              ) VALUES (
                $1, $2, NULL, $3,
                $4, $5, $6, $7, $8,
                $9, $10
              )
              ON CONFLICT (id) DO NOTHING
              `,
              [
                uuidv4(), clientId, organizationId,
                'PROGRESS_NOTE',
                'Client reports feeling well today. No new complaints.',
                `Vital signs stable. BP: ${110 + Math.floor(Math.random() * 40)}/${70 + Math.floor(Math.random() * 30)}. HR: ${60 + Math.floor(Math.random() * 40)} bpm. Temp: 98.${Math.floor(Math.random() * 10)}°F.`,
                'Condition stable. Continue current plan of care.',
                'Continue medications as prescribed. Monitor vital signs. Next visit scheduled.',
                stateUsers['NURSE'],
                stateUsers['NURSE']
              ]
            );
            stats.clinicalNotes++;
          }
          process.stdout.write('.');
        }
        console.log(` ✓ ${stateClients.length * 3} notes`);

        // 9. CREATE INCIDENT (1 per state, for variety)
        if (Math.random() > 0.5) {
          process.stdout.write('⚠️  Incident: ');
          const clientId = randomElement(stateClients);
          
          await client.query(
            `INSERT INTO incidents (
              id, client_id, organization_id, branch_id,
              incident_type, severity, description,
              date_occurred, location, status,
              reported_by, created_by, updated_by
            ) VALUES (
              $1, $2, $3, $4,
              $5, $6, $7,
              $8, $9, $10,
              $11, $12, $13
            )
            ON CONFLICT (id) DO NOTHING
            `,
            [
              uuidv4(), clientId, organizationId, branchId,
              randomElement(['FALL', 'MEDICATION_ERROR', 'MISSED_VISIT']),
              randomElement(['LOW', 'MEDIUM', 'HIGH']),
              'Incident documented per protocol. Immediate action taken. Family notified.',
              formatDate(randomDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), new Date())),
              'CLIENT_HOME',
              'UNDER_INVESTIGATION',
              stateUsers['CAREGIVER'],
              stateUsers['COORDINATOR'],
              stateUsers['COORDINATOR']
            ]
          );
          stats.incidents++;
          console.log(' ✓ 1 incident');
        }
      }

      console.log('\n');
      console.log('═══════════════════════════════════');
      console.log('✅ COMPREHENSIVE SEEDING COMPLETE!');
      console.log('═══════════════════════════════════\n');
      console.log('📊 Summary Statistics:\n');
      console.log(`   👤 Users:         ${stats.users.toLocaleString()}`);
      console.log(`   🏥 Clients:       ${stats.clients.toLocaleString()}`);
      console.log(`   🤝 Caregivers:    ${stats.caregivers.toLocaleString()}`);
      console.log(`   🏠 Visits:        ${stats.visits.toLocaleString()}`);
      console.log(`   📋 Care Plans:    ${stats.carePlans.toLocaleString()}`);
      console.log(`   ✅ Tasks:         ${stats.tasks.toLocaleString()}`);
      console.log(`   💊 Medications:   ${stats.medications.toLocaleString()}`);
      console.log(`   📝 Notes:         ${stats.clinicalNotes.toLocaleString()}`);
      console.log(`   ⚠️  Incidents:     ${stats.incidents.toLocaleString()}`);
      console.log(`   ───────────────────────────────────`);
      console.log(`   📈 TOTAL RECORDS: ${Object.values(stats).reduce((a, b) => a + b, 0).toLocaleString()}\n`);
      
      console.log('🔐 Login Credentials:\n');
      console.log('   Pattern: {role}@{state}.carecommons.example / Demo{STATE}{ROLE}123!\n');
      console.log('   Examples:');
      console.log('   • admin@ca.carecommons.example / DemoCAADMIN123!');
      console.log('   • coordinator@tx.carecommons.example / DemoTXCOORDINATOR123!');
      console.log('   • caregiver@fl.carecommons.example / DemoFLCAREGIVER123!');
      console.log('   • nurse@ny.carecommons.example / DemoNYNURSE123!');
      console.log('   • family@il.carecommons.example / DemoILFAMILY123!\n');
    });
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

seedComprehensiveDemo().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
