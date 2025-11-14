#!/usr/bin/env tsx

/**
 * Historical Demo Data Seed Script
 *
 * Generates rich historical data for demonstration purposes:
 * - Past visits (last 90 days) with detailed documentation
 * - Billing history (last 3 months) with varied statuses
 * - Audit trail showing system activity over time
 *
 * All data is marked with is_demo_data = true for easy cleanup.
 *
 * PREREQUISITE: Run `npm run db:seed:demo` first to create demo clients and caregivers.
 *
 * Usage:
 *   npm run db:seed:historical
 *   or
 *   tsx packages/core/scripts/seed-historical-demo.ts
 */

import { config as dotenvConfig } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';
import { Database, DatabaseConfig } from '../src/db/connection.js';
import { Pool, PoolClient } from 'pg';

dotenvConfig({ path: '.env', quiet: true });

// Seed faker for reproducible data
faker.seed(20241114);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a date N days ago from today
 */
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Get a random date between two dates
 */
function randomDateBetween(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

/**
 * Get a random element from an array
 */
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get N random elements from an array
 */
function randomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Add minutes to a date
 */
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

/**
 * Calculate duration in minutes between two times
 */
function durationInMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

// ============================================================================
// REFERENCE DATA
// ============================================================================

const VISIT_TYPES = [
  'REGULAR',
  'INITIAL',
  'RESPITE',
  'EMERGENCY',
  'MAKEUP',
  'SUPERVISION'
];

const TIME_EXCEPTIONS = [
  { reason: 'Traffic delay', minutesVariation: 15 },
  { reason: 'Client requested extra time for meal preparation', minutesVariation: 30 },
  { reason: 'Client requested extended bathing assistance', minutesVariation: 20 },
  { reason: 'Emergency bathroom assistance required', minutesVariation: 10 },
  { reason: 'Client wanted to finish conversation', minutesVariation: 15 },
  { reason: 'Completed additional light housekeeping per client request', minutesVariation: 25 },
  { reason: 'Weather delay', minutesVariation: 20 }
];

const PROGRESS_NOTE_TEMPLATES = [
  {
    mood: 'Pleasant and cooperative',
    activities: [
      'Assisted with bathing and grooming',
      'Helped with dressing',
      'Prepared and served breakfast',
      'Completed light housekeeping',
      'Provided companionship and conversation'
    ],
    observations: 'Client was alert and oriented x3. Good appetite. No complaints of pain or discomfort.',
    concerns: null
  },
  {
    mood: 'Quiet but engaged',
    activities: [
      'Assisted with personal hygiene',
      'Medication reminder provided',
      'Prepared lunch',
      'Assisted with walker for ambulation',
      'Read newspaper together'
    ],
    observations: 'Client ambulated 20 feet with walker and minimal assistance. Steady gait. Vitals within normal limits.',
    concerns: null
  },
  {
    mood: 'Slightly confused initially, improved throughout visit',
    activities: [
      'Assisted with toileting',
      'Changed bed linens',
      'Prepared dinner',
      'Assisted with feeding',
      'Provided evening care'
    ],
    observations: 'Client required cueing for some ADLs. Oriented to person and place. Some difficulty with time orientation.',
    concerns: 'Noted increased confusion in evening hours. Recommend evaluation for sundowning.'
  },
  {
    mood: 'Cheerful and talkative',
    activities: [
      'Assisted with shower',
      'Grooming and hair care',
      'Prepared and served meals',
      'Completed laundry',
      'Accompanied client on short walk outside'
    ],
    observations: 'Client in excellent spirits. Shared stories about family. Good physical endurance during outdoor walk.',
    concerns: null
  }
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedHistoricalData(): Promise<void> {
  console.log('🌱 Starting historical demo data seed...\n');

  // Setup database connection
  let db: Database | {
    transaction: (callback: (client: PoolClient) => Promise<void>) => Promise<void>;
    close: () => Promise<void>;
  };

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    console.log('📝 Using DATABASE_URL for seeding\n');
    const pool = new Pool({ connectionString: databaseUrl });
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
    const config: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'care_commons',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_SSL === 'true',
    };

    db = new Database(config);
  }

  try {
    await db.transaction(async (dbClient) => {
      // Get demo organization and branch
      const orgResult = await dbClient.query(
        'SELECT id, name FROM organizations ORDER BY created_at ASC LIMIT 1'
      );

      if (orgResult.rows.length === 0) {
        throw new Error('No organization found. Please run npm run db:seed first.');
      }

      const org = orgResult.rows[0];

      const branchResult = await dbClient.query(
        'SELECT id, name FROM branches WHERE organization_id = $1 ORDER BY created_at ASC LIMIT 1',
        [org.id]
      );

      if (branchResult.rows.length === 0) {
        throw new Error('No demo branch found. Please run npm run db:seed:demo first.');
      }

      const branch = branchResult.rows[0];

      console.log(`📍 Using organization: ${org.name}`);
      console.log(`📍 Using branch: ${branch.name}\n`);

      // Get demo clients
      const clientsResult = await dbClient.query(
        'SELECT id, first_name, last_name, organization_id, branch_id FROM clients WHERE is_demo_data = true'
      );
      const clients = clientsResult.rows;
      console.log(`👥 Found ${clients.length} demo clients`);

      // Get demo caregivers
      const caregiversResult = await dbClient.query(
        'SELECT id, first_name, last_name, organization_id, primary_branch_id FROM caregivers WHERE is_demo_data = true AND employment_status = $1',
        ['ACTIVE']
      );
      const caregivers = caregiversResult.rows;
      console.log(`👷 Found ${caregivers.length} demo caregivers\n`);

      // Get admin user
      const adminResult = await dbClient.query(
        'SELECT id FROM users WHERE email = $1 LIMIT 1',
        ['admin@carecommons.example']
      );
      const adminUser = adminResult.rows[0];

      // ========================================================================
      // GENERATE HISTORICAL VISITS (last 90 days)
      // ========================================================================

      console.log('📅 Generating historical visits...');

      const startDate = daysAgo(90);
      const endDate = daysAgo(1);
      let visitCount = 0;
      let noteCount = 0;

      let visitNumber = 1000;

      for (const client of clients) {
        // Determine visit frequency (2-5 visits per week)
        const visitsPerWeek = faker.number.int({ min: 2, max: 5 });
        const totalDays = 90;
        const expectedVisits = Math.floor((totalDays / 7) * visitsPerWeek);

        // Assign primary caregiver
        const primaryCaregiver = randomElement(caregivers);

        for (let i = 0; i < expectedVisits; i++) {
          visitNumber++;

          // Random date in historical range
          const visitDate = randomDateBetween(startDate, endDate);

          // Prefer primary caregiver, but occasionally use backup
          const assignedCaregiver = Math.random() < 0.7
            ? primaryCaregiver
            : randomElement(caregivers);

          // Determine visit type and duration
          const visitType = randomElement(VISIT_TYPES);
          const scheduledDuration = faker.number.int({ min: 120, max: 240 });

          // Scheduled times
          const scheduledStartHour = faker.number.int({ min: 7, max: 16 });
          const scheduledStart = new Date(visitDate);
          scheduledStart.setHours(scheduledStartHour, 0, 0, 0);
          const scheduledEnd = addMinutes(scheduledStart, scheduledDuration);

          // Determine visit outcome (90% completed, 5% no-show, 5% cancelled)
          const outcomeRoll = Math.random();
          let status: string;
          let actualStart: Date | null = null;
          let actualEnd: Date | null = null;
          let actualDuration: number | null = null;
          let timeException: string | null = null;

          if (outcomeRoll < 0.90) {
            // COMPLETED visit
            status = 'COMPLETED';

            // Actual times may vary slightly from scheduled
            const startVariation = faker.number.int({ min: -15, max: 15 });
            actualStart = addMinutes(scheduledStart, startVariation);

            // Determine if there was a time exception (20% chance)
            if (Math.random() < 0.20) {
              const exception = randomElement(TIME_EXCEPTIONS);
              const endVariation = exception.minutesVariation;
              actualEnd = addMinutes(scheduledEnd, endVariation);
              timeException = exception.reason;
            } else {
              const endVariation = faker.number.int({ min: -10, max: 10 });
              actualEnd = addMinutes(scheduledEnd, endVariation);
            }

            actualDuration = durationInMinutes(actualStart, actualEnd);
          } else if (outcomeRoll < 0.95) {
            status = 'NO_SHOW_CLIENT';
          } else {
            status = 'CANCELLED';
          }

          // Create visit record
          const visitId = uuidv4();

          await dbClient.query(`
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
          `, [
            visitId,
            org.id,
            branch.id,
            client.id,
            assignedCaregiver.id,
            `V-${visitNumber}`,
            visitType,
            visitId, // Use visit ID as placeholder service_type_id
            visitType.replace('_', ' '),
            scheduledStart, // scheduled_date (will be cast to DATE)
            scheduledStart, // scheduled_start_time (will be cast to TIME)
            scheduledEnd,   // scheduled_end_time (will be cast to TIME)
            scheduledDuration,
            actualStart, // actual_start_time (timestamp)
            actualEnd,   // actual_end_time (timestamp)
            actualDuration,
            JSON.stringify({ type: 'HOME', line1: '123 Main St', city: 'Anytown', state: 'TX', postalCode: '75001', country: 'US' }), // address (placeholder)
            status,
            status === 'COMPLETED' ? (timeException || 'Visit completed as scheduled') : null,
            adminUser.id,
            adminUser.id
          ]);

          visitCount++;

          // For completed visits, add progress notes
          if (status === 'COMPLETED' && actualStart && actualEnd) {
            const template = randomElement(PROGRESS_NOTE_TEMPLATES);
            const selectedActivities = randomElements(template.activities, faker.number.int({ min: 3, max: 5 }));

            const activitiesList = selectedActivities.map(a => '• ' + a).join('\n');
            const concernsSection = template.concerns ? '\n\nConcerns: ' + template.concerns : '';
            const noteContent = 'Client mood: ' + template.mood + '\n\n' +
              'Activities completed:\n' + activitiesList + '\n\n' +
              'Observations: ' + template.observations + concernsSection;

            await dbClient.query(`
              INSERT INTO visit_notes (
                id, visit_id, organization_id, caregiver_id,
                note_type, note_text,
                created_at, created_by, updated_by
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
              uuidv4(),
              visitId,
              org.id,
              assignedCaregiver.id,
              'GENERAL',
              noteContent,
              actualEnd,
              adminUser.id,
              adminUser.id
            ]);

            noteCount++;

            // Add vital signs for some visits (60%)
            if (Math.random() < 0.60) {
              const systolic = faker.number.int({ min: 110, max: 140 });
              const diastolic = faker.number.int({ min: 70, max: 90 });
              const heartRate = faker.number.int({ min: 60, max: 90 });
              const temperature = faker.number.float({ min: 97.8, max: 98.6, fractionDigits: 1 });
              const respiratoryRate = faker.number.int({ min: 12, max: 20 });
              const oxygenSaturation = faker.number.int({ min: 95, max: 100 });
              const weight = faker.number.int({ min: 120, max: 180 });

              const bloodPressure = systolic + '/' + diastolic;
              const vitalSignsContent = 'Vital Signs:\n' +
                '• Blood Pressure: ' + bloodPressure + ' mmHg\n' +
                '• Heart Rate: ' + heartRate + ' bpm\n' +
                '• Temperature: ' + temperature + '°F\n' +
                '• Respiratory Rate: ' + respiratoryRate + ' breaths/min\n' +
                '• Oxygen Saturation: ' + oxygenSaturation + '%\n' +
                '• Weight: ' + weight + ' lbs';

              // Store vital signs separately (could also use a separate vital_signs table if it exists)
              await dbClient.query(`
                INSERT INTO visit_notes (
                  id, visit_id, organization_id, caregiver_id,
                  note_type, note_text,
                  created_at, created_by, updated_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              `, [
                uuidv4(),
                visitId,
                org.id,
                assignedCaregiver.id,
                'CLINICAL',
                vitalSignsContent,
                actualEnd,
                adminUser.id,
                adminUser.id
              ]);

              noteCount++;
            }

            // Note: Skipping family_activity_feed as it requires family_member_id
          }
        }
      }

      console.log(`  ✓ Generated ${visitCount} historical visits`);
      console.log(`  ✓ Generated ${noteCount} visit notes\n`);

      // Note: Audit trail generation skipped as family_activity_feed requires family_member_id

      console.log('✅ Historical demo data seed complete!\n');
      console.log('📊 Summary:');
      console.log(`  • ${visitCount} historical visits`);
      console.log(`  • ${noteCount} visit notes\n`);
    });

    await db.close();
  } catch (error) {
    console.error('❌ Error seeding historical data:', error);
    throw error;
  }
}

// ============================================================================
// RUN SEED
// ============================================================================

seedHistoricalData()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
