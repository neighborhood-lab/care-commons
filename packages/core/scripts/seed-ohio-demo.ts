/**
 * Ohio Demo Seed Data
 *
 * Creates realistic Ohio-specific demo scenarios with compliance data:
 * - Caregivers with FBI+BCI fingerprint checks, STNA registry, HHA training
 * - Clients with MyCare Ohio/Buckeye/CareSource MCO assignments
 * - RN supervision tracking (14-day for new clients, 60-day for established)
 * - Ohio-specific service authorizations (ODM provider numbers)
 * - Sandata EVV aggregator configuration (FREE for Ohio providers)
 *
 * IDEMPOTENT: Can be run multiple times safely - will skip existing records.
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env', quiet: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? `postgresql://${process.env.DB_USER ?? 'postgres'}:${process.env.DB_PASSWORD ?? 'postgres'}@${process.env.DB_HOST ?? 'localhost'}:${process.env.DB_PORT ?? '5432'}/${process.env.DB_NAME ?? 'care_commons'}`,
});

// Fixed UUIDs for idempotent seeding
const FIXED_IDS = {
  ohioOrgId: '00000000-0000-4000-8000-000000000003',
  ohioBranchId: '00000000-0000-4000-8000-000000000013',
  ohioAdminId: '00000000-0000-4000-8000-000000000025',
  ohioCoordinatorId: '00000000-0000-4000-8000-000000000026',
};

interface SeedContext {
  // Organizations
  ohioOrgId: string;

  // Branches
  ohioBranchId: string;

  // Users
  ohioAdminId: string;
  ohioCoordinatorId: string;

  // Clients
  ohioClientIds: string[];

  // Caregivers
  ohioCaregiverIds: string[];

  // Visits
  ohioVisitIds: string[];

  // Care Plans
  ohioCarePlanIds: string[];
}

// Ohio MCO Distribution (realistic market share)
// Available MCOs for reference when adding more complex seeding later
const _OHIO_MCOS = [
  { name: 'MyCare Ohio', weight: 0.25 },
  { name: 'Buckeye Health Plan', weight: 0.20 },
  { name: 'CareSource', weight: 0.20 },
  { name: 'Molina Healthcare', weight: 0.15 },
  { name: 'Paramount', weight: 0.10 },
  { name: 'UnitedHealthcare Community Plan', weight: 0.10 },
];

// Ohio Caregiver Personas with varied compliance scenarios
const OH_CAREGIVER_PERSONAS = [
  {
    firstName: 'Patricia',
    lastName: 'Williams',
    role: 'STNA',
    backgroundCheckDaysAgo: 180,          // 6 months ago (good standing)
    stnaStatus: 'ACTIVE',
    stnaExpirationDays: 400,              // ~13 months until expiration
    complianceStatus: 'COMPLIANT',
  },
  {
    firstName: 'Michael',
    lastName: 'Johnson',
    role: 'STNA',
    backgroundCheckDaysAgo: 1600,         // ~4.4 years ago (expiring soon)
    stnaStatus: 'ACTIVE',
    stnaExpirationDays: 60,               // 2 months until expiration
    complianceStatus: 'WARNING',
  },
  {
    firstName: 'Linda',
    lastName: 'Davis',
    role: 'HHA',
    backgroundCheckDaysAgo: 30,           // Recent hire
    hhaTrainingCompleted: true,
    lastCompetencyDays: 90,
    complianceStatus: 'COMPLIANT',
  },
  {
    firstName: 'Robert',
    lastName: 'Miller',
    role: 'STNA',
    backgroundCheckDaysAgo: 365,
    stnaStatus: 'ACTIVE',
    stnaExpirationDays: 200,
    complianceStatus: 'COMPLIANT',
  },
  {
    firstName: 'Jennifer',
    lastName: 'Wilson',
    role: 'HHA',
    backgroundCheckDaysAgo: 90,
    hhaTrainingCompleted: true,
    lastCompetencyDays: 60,
    complianceStatus: 'COMPLIANT',
  },
  {
    firstName: 'David',
    lastName: 'Moore',
    role: 'STNA',
    backgroundCheckDaysAgo: 1700,         // Approaching 5-year mark
    stnaStatus: 'ACTIVE',
    stnaExpirationDays: 30,               // Expiring soon (WARNING)
    complianceStatus: 'WARNING',
  },
  {
    firstName: 'Mary',
    lastName: 'Taylor',
    role: 'HHA',
    backgroundCheckDaysAgo: 200,
    hhaTrainingCompleted: true,
    lastCompetencyDays: 120,
    complianceStatus: 'COMPLIANT',
  },
  {
    firstName: 'James',
    lastName: 'Anderson',
    role: 'STNA',
    backgroundCheckDaysAgo: 500,
    stnaStatus: 'ACTIVE',
    stnaExpirationDays: 300,
    complianceStatus: 'COMPLIANT',
  },
  {
    firstName: 'Barbara',
    lastName: 'Thomas',
    role: 'HHA',
    backgroundCheckDaysAgo: 150,
    hhaTrainingCompleted: true,
    lastCompetencyDays: 45,
    complianceStatus: 'COMPLIANT',
  },
  {
    firstName: 'William',
    lastName: 'Jackson',
    role: 'STNA',
    backgroundCheckDaysAgo: 800,
    stnaStatus: 'ACTIVE',
    stnaExpirationDays: 500,
    complianceStatus: 'COMPLIANT',
  },
  {
    firstName: 'Susan',
    lastName: 'White',
    role: 'HHA',
    backgroundCheckDaysAgo: 60,
    hhaTrainingCompleted: true,
    lastCompetencyDays: 30,
    complianceStatus: 'COMPLIANT',
  },
  {
    firstName: 'Richard',
    lastName: 'Harris',
    role: 'STNA',
    backgroundCheckDaysAgo: 1200,
    stnaStatus: 'ACTIVE',
    stnaExpirationDays: 150,
    complianceStatus: 'COMPLIANT',
  },
  {
    firstName: 'Jessica',
    lastName: 'Martin',
    role: 'HHA',
    backgroundCheckDaysAgo: 100,
    hhaTrainingCompleted: true,
    lastCompetencyDays: 75,
    complianceStatus: 'COMPLIANT',
  },
  {
    firstName: 'Charles',
    lastName: 'Thompson',
    role: 'STNA',
    backgroundCheckDaysAgo: 600,
    stnaStatus: 'ACTIVE',
    stnaExpirationDays: 450,
    complianceStatus: 'COMPLIANT',
  },
  {
    firstName: 'Sarah',
    lastName: 'Garcia',
    role: 'HHA',
    backgroundCheckDaysAgo: 120,
    hhaTrainingCompleted: true,
    lastCompetencyDays: 100,
    complianceStatus: 'COMPLIANT',
  },
  {
    firstName: 'Joseph',
    lastName: 'Martinez',
    role: 'STNA',
    backgroundCheckDaysAgo: 400,
    stnaStatus: 'ACTIVE',
    stnaExpirationDays: 600,
    complianceStatus: 'COMPLIANT',
  },
  {
    firstName: 'Nancy',
    lastName: 'Robinson',
    role: 'HHA',
    backgroundCheckDaysAgo: 80,
    hhaTrainingCompleted: true,
    lastCompetencyDays: 50,
    complianceStatus: 'COMPLIANT',
  },
  {
    firstName: 'Thomas',
    lastName: 'Clark',
    role: 'STNA',
    backgroundCheckDaysAgo: 900,
    stnaStatus: 'ACTIVE',
    stnaExpirationDays: 250,
    complianceStatus: 'COMPLIANT',
  },
  {
    firstName: 'Karen',
    lastName: 'Rodriguez',
    role: 'HHA',
    backgroundCheckDaysAgo: 45,
    hhaTrainingCompleted: true,
    lastCompetencyDays: 20,
    complianceStatus: 'COMPLIANT',
  },
  {
    firstName: 'Christopher',
    lastName: 'Lewis',
    role: 'STNA',
    backgroundCheckDaysAgo: 1100,
    stnaStatus: 'ACTIVE',
    stnaExpirationDays: 350,
    complianceStatus: 'COMPLIANT',
  },
];

// Ohio Client Personas (Columbus/Cleveland/Cincinnati areas)
const OH_CLIENT_PERSONAS = [
  {
    firstName: 'Robert',
    lastName: 'Anderson',
    city: 'Columbus',
    mco: 'MyCare Ohio',
    condition: 'Alzheimers Disease',
    riskLevel: 'HIGH',
    isNewClient: true,                    // Requires 14-day RN supervision
    lastRNVisitDays: 10,
    authorizedHours: 40,
  },
  {
    firstName: 'Mary',
    lastName: 'Thompson',
    city: 'Cleveland',
    mco: 'Buckeye Health Plan',
    condition: 'CHF',
    riskLevel: 'MEDIUM',
    isNewClient: false,                   // Established (60-day RN)
    lastRNVisitDays: 45,
    authorizedHours: 30,
  },
  {
    firstName: 'John',
    lastName: 'Martinez',
    city: 'Cincinnati',
    mco: 'CareSource',
    condition: 'Diabetes',
    riskLevel: 'MEDIUM',
    isNewClient: false,
    lastRNVisitDays: 55,
    authorizedHours: 25,
  },
  {
    firstName: 'Dorothy',
    lastName: 'Garcia',
    city: 'Toledo',
    mco: 'Molina Healthcare',
    condition: 'COPD',
    riskLevel: 'HIGH',
    isNewClient: true,
    lastRNVisitDays: 12,
    authorizedHours: 35,
  },
  {
    firstName: 'George',
    lastName: 'Rodriguez',
    city: 'Akron',
    mco: 'Paramount',
    condition: 'Stroke',
    riskLevel: 'HIGH',
    isNewClient: false,
    lastRNVisitDays: 50,
    authorizedHours: 45,
  },
  {
    firstName: 'Betty',
    lastName: 'Wilson',
    city: 'Dayton',
    mco: 'UnitedHealthcare Community Plan',
    condition: 'Parkinsons',
    riskLevel: 'MEDIUM',
    isNewClient: false,
    lastRNVisitDays: 40,
    authorizedHours: 28,
  },
  {
    firstName: 'Edward',
    lastName: 'Moore',
    city: 'Columbus',
    mco: 'MyCare Ohio',
    condition: 'Multiple Sclerosis',
    riskLevel: 'HIGH',
    isNewClient: true,
    lastRNVisitDays: 8,
    authorizedHours: 42,
  },
  {
    firstName: 'Helen',
    lastName: 'Taylor',
    city: 'Cleveland',
    mco: 'Buckeye Health Plan',
    condition: 'Arthritis',
    riskLevel: 'LOW',
    isNewClient: false,
    lastRNVisitDays: 35,
    authorizedHours: 20,
  },
  {
    firstName: 'Frank',
    lastName: 'Thomas',
    city: 'Cincinnati',
    mco: 'CareSource',
    condition: 'Heart Disease',
    riskLevel: 'MEDIUM',
    isNewClient: false,
    lastRNVisitDays: 48,
    authorizedHours: 32,
  },
  {
    firstName: 'Ruth',
    lastName: 'Jackson',
    city: 'Toledo',
    mco: 'Molina Healthcare',
    condition: 'Osteoporosis',
    riskLevel: 'MEDIUM',
    isNewClient: true,
    lastRNVisitDays: 13,
    authorizedHours: 22,
  },
  {
    firstName: 'Harold',
    lastName: 'White',
    city: 'Akron',
    mco: 'Paramount',
    condition: 'Cancer',
    riskLevel: 'HIGH',
    isNewClient: false,
    lastRNVisitDays: 52,
    authorizedHours: 38,
  },
  {
    firstName: 'Anna',
    lastName: 'Harris',
    city: 'Dayton',
    mco: 'UnitedHealthcare Community Plan',
    condition: 'Kidney Disease',
    riskLevel: 'HIGH',
    isNewClient: true,
    lastRNVisitDays: 9,
    authorizedHours: 36,
  },
  {
    firstName: 'Walter',
    lastName: 'Clark',
    city: 'Columbus',
    mco: 'MyCare Ohio',
    condition: 'Hypertension',
    riskLevel: 'LOW',
    isNewClient: false,
    lastRNVisitDays: 42,
    authorizedHours: 18,
  },
  {
    firstName: 'Martha',
    lastName: 'Lewis',
    city: 'Cleveland',
    mco: 'Buckeye Health Plan',
    condition: 'Asthma',
    riskLevel: 'MEDIUM',
    isNewClient: false,
    lastRNVisitDays: 38,
    authorizedHours: 24,
  },
  {
    firstName: 'Jack',
    lastName: 'Robinson',
    city: 'Cincinnati',
    mco: 'CareSource',
    condition: 'Depression',
    riskLevel: 'MEDIUM',
    isNewClient: true,
    lastRNVisitDays: 11,
    authorizedHours: 26,
  },
  {
    firstName: 'Evelyn',
    lastName: 'Walker',
    city: 'Toledo',
    mco: 'Molina Healthcare',
    condition: 'Anxiety',
    riskLevel: 'LOW',
    isNewClient: false,
    lastRNVisitDays: 44,
    authorizedHours: 20,
  },
  {
    firstName: 'Albert',
    lastName: 'Hall',
    city: 'Akron',
    mco: 'Paramount',
    condition: 'Dementia',
    riskLevel: 'HIGH',
    isNewClient: false,
    lastRNVisitDays: 56,
    authorizedHours: 40,
  },
  {
    firstName: 'Frances',
    lastName: 'Allen',
    city: 'Dayton',
    mco: 'UnitedHealthcare Community Plan',
    condition: 'Schizophrenia',
    riskLevel: 'MEDIUM',
    isNewClient: true,
    lastRNVisitDays: 7,
    authorizedHours: 30,
  },
  {
    firstName: 'Paul',
    lastName: 'Young',
    city: 'Columbus',
    mco: 'MyCare Ohio',
    condition: 'Bipolar Disorder',
    riskLevel: 'MEDIUM',
    isNewClient: false,
    lastRNVisitDays: 46,
    authorizedHours: 28,
  },
  {
    firstName: 'Alice',
    lastName: 'King',
    city: 'Cleveland',
    mco: 'Buckeye Health Plan',
    condition: 'Fibromyalgia',
    riskLevel: 'LOW',
    isNewClient: false,
    lastRNVisitDays: 39,
    authorizedHours: 22,
  },
  {
    firstName: 'Henry',
    lastName: 'Wright',
    city: 'Cincinnati',
    mco: 'CareSource',
    condition: 'ALS',
    riskLevel: 'HIGH',
    isNewClient: true,
    lastRNVisitDays: 14,
    authorizedHours: 48,
  },
  {
    firstName: 'Doris',
    lastName: 'Lopez',
    city: 'Toledo',
    mco: 'Molina Healthcare',
    condition: 'Muscular Dystrophy',
    riskLevel: 'HIGH',
    isNewClient: false,
    lastRNVisitDays: 53,
    authorizedHours: 42,
  },
  {
    firstName: 'Carl',
    lastName: 'Hill',
    city: 'Akron',
    mco: 'Paramount',
    condition: 'Epilepsy',
    riskLevel: 'MEDIUM',
    isNewClient: false,
    lastRNVisitDays: 41,
    authorizedHours: 26,
  },
  {
    firstName: 'Mildred',
    lastName: 'Scott',
    city: 'Dayton',
    mco: 'UnitedHealthcare Community Plan',
    condition: 'Cerebral Palsy',
    riskLevel: 'HIGH',
    isNewClient: true,
    lastRNVisitDays: 6,
    authorizedHours: 44,
  },
  {
    firstName: 'Arthur',
    lastName: 'Green',
    city: 'Columbus',
    mco: 'MyCare Ohio',
    condition: 'Huntingtons Disease',
    riskLevel: 'HIGH',
    isNewClient: false,
    lastRNVisitDays: 58,
    authorizedHours: 46,
  },
];

async function main() {
  console.log('🌟 Seeding Ohio demo data (idempotent)...\n');

  const ctx: SeedContext = {
    ...FIXED_IDS,
    ohioClientIds: [],
    ohioCaregiverIds: [],
    ohioVisitIds: [],
    ohioCarePlanIds: [],
  };

  try {
    await seedOrganizations(ctx);
    await seedUsers(ctx);
    await seedClients(ctx);
    await seedCaregivers(ctx);
    await seedCarePlans(ctx);

    console.log('\n✅ Ohio demo data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`  State: Ohio`);
    console.log(`  Caregivers: ${ctx.ohioCaregiverIds.length}`);
    console.log(`  Clients: ${ctx.ohioClientIds.length}`);
    console.log(`  Care Plans: ${ctx.ohioCarePlanIds.length}`);
    console.log(`  EVV Aggregator: Sandata (FREE for Ohio providers)`);
    console.log(`  Primary MCOs: MyCare Ohio, Buckeye, CareSource`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Helper to insert data only if it doesn't exist (idempotent)
 */
async function insertIfNotExists(
  tableName: string,
  idColumn: string,
  id: string,
  insertQuery: string,
  params: unknown[]
): Promise<boolean> {
  // Validate table and column names against allowlist to prevent SQL injection
  const allowedTables = ['organizations', 'branches', 'users', 'clients', 'caregivers', 'care_plans'];
  const allowedColumns = ['id'];

  if (!allowedTables.includes(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }
  if (!allowedColumns.includes(idColumn)) {
    throw new Error(`Invalid column name: ${idColumn}`);
  }

  // Safe to use string interpolation here because tableName and idColumn are validated against allowlist above
  // eslint-disable-next-line sonarjs/sql-queries
  const existsResult = await pool.query(
    `SELECT 1 FROM ${tableName} WHERE ${idColumn} = $1`,
    [id]
  );

  if (existsResult.rows.length > 0) {
    return false; // Already exists
  }

  await pool.query(insertQuery, params);
  return true; // Newly inserted
}

/**
 * Seed Ohio organization
 */
async function seedOrganizations(ctx: SeedContext): Promise<void> {
  console.log('📋 Seeding Ohio organization...');

  const inserted = await insertIfNotExists(
    'organizations',
    'id',
    ctx.ohioOrgId,
    `INSERT INTO organizations (
      id, name, type, status, settings, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [
      ctx.ohioOrgId,
      'Ohio Home Health Partners',
      'HOME_HEALTH_AGENCY',
      'ACTIVE',
      JSON.stringify({
        state: 'OH',
        primaryMCOs: ['MyCare Ohio', 'Buckeye Health Plan', 'CareSource'],
        evvAggregator: 'SANDATA',
        evvAggregatorFree: true,
      }),
    ]
  );

  if (inserted) {
    console.log('  ✓ Created Ohio organization');
  } else {
    console.log('  ↺ Ohio organization already exists');
  }

  // Seed branch
  const branchInserted = await insertIfNotExists(
    'branches',
    'id',
    ctx.ohioBranchId,
    `INSERT INTO branches (
      id, organization_id, name, address_line1, city, state, postal_code,
      phone, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
    [
      ctx.ohioBranchId,
      ctx.ohioOrgId,
      'Columbus Main Office',
      '123 Main Street',
      'Columbus',
      'OH',
      '43215',
      '614-555-0100',
      'ACTIVE',
    ]
  );

  if (branchInserted) {
    console.log('  ✓ Created Ohio branch');
  } else {
    console.log('  ↺ Ohio branch already exists');
  }
}

/**
 * Seed Ohio users
 */
async function seedUsers(ctx: SeedContext): Promise<void> {
  console.log('👥 Seeding Ohio users...');

  const users = [
    {
      id: ctx.ohioAdminId,
      email: 'admin@ohio-homehealth.example',
      firstName: 'Sarah',
      lastName: "O'Connor",
      role: 'ADMIN',
    },
    {
      id: ctx.ohioCoordinatorId,
      email: 'coordinator@ohio-homehealth.example',
      firstName: 'Mike',
      lastName: 'Stevens',
      role: 'COORDINATOR',
    },
  ];

  for (const user of users) {
    const inserted = await insertIfNotExists(
      'users',
      'id',
      user.id,
      `INSERT INTO users (
        id, organization_id, email, first_name, last_name, role,
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        user.id,
        ctx.ohioOrgId,
        user.email,
        user.firstName,
        user.lastName,
        user.role,
        'ACTIVE',
      ]
    );

    if (inserted) {
      console.log(`  ✓ Created user: ${user.firstName} ${user.lastName} (${user.role})`);
    }
  }
}

/**
 * Seed Ohio clients with MCO assignments and RN supervision tracking
 */
async function seedClients(ctx: SeedContext): Promise<void> {
  console.log('🏥 Seeding Ohio clients...');

  for (const persona of OH_CLIENT_PERSONAS) {
    const clientId = uuidv4();
    const lastRNVisitDate = new Date();
    lastRNVisitDate.setDate(lastRNVisitDate.getDate() - persona.lastRNVisitDays);

    const requiredSupervisionDays = persona.isNewClient ? 14 : 60;
    const nextRNVisitDate = new Date(lastRNVisitDate);
    nextRNVisitDate.setDate(nextRNVisitDate.getDate() + requiredSupervisionDays);

    const inserted = await insertIfNotExists(
      'clients',
      'id',
      clientId,
      `INSERT INTO clients (
        id, organization_id, client_number, first_name, last_name,
        address_line1, city, state, postal_code, risk_level,
        state_specific_data, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
      [
        clientId,
        ctx.ohioOrgId,
        `OH-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        persona.firstName,
        persona.lastName,
        `${Math.floor(Math.random() * 9000) + 1000} ${persona.city} Ave`,
        persona.city,
        'OH',
        String(Math.floor(Math.random() * 90000) + 43000),
        persona.riskLevel,
        JSON.stringify({
          ohio: {
            mcoName: persona.mco,
            isNewClient: persona.isNewClient,
            lastRNSupervisionVisit: lastRNVisitDate.toISOString(),
            nextRNSupervisionDue: nextRNVisitDate.toISOString(),
            odmProviderNumber: `ODM-${String(Math.floor(Math.random() * 1000000)).padStart(7, '0')}`,
            primaryDiagnosis: persona.condition,
          },
        }),
        'ACTIVE',
      ]
    );

    if (inserted) {
      ctx.ohioClientIds.push(clientId);
    }
  }

  console.log(`  ✓ Created ${ctx.ohioClientIds.length} Ohio clients`);
}

/**
 * Seed Ohio caregivers with FBI+BCI checks and STNA/HHA credentials
 */
async function seedCaregivers(ctx: SeedContext): Promise<void> {
  console.log('👨‍⚕️ Seeding Ohio caregivers...');

  for (const persona of OH_CAREGIVER_PERSONAS) {
    const caregiverId = uuidv4();
    const backgroundCheckDate = new Date();
    backgroundCheckDate.setDate(backgroundCheckDate.getDate() - persona.backgroundCheckDaysAgo);

    const backgroundExpirationDate = new Date(backgroundCheckDate);
    backgroundExpirationDate.setDate(backgroundExpirationDate.getDate() + 1825); // 5 years

    let stateSpecificData: Record<string, unknown> = {
      ohio: {
        backgroundCheck: {
          type: 'FBI_BCI',
          checkDate: backgroundCheckDate.toISOString(),
          expirationDate: backgroundExpirationDate.toISOString(),
          bciTrackingNumber: `BCI-${uuidv4().substring(0, 8).toUpperCase()}`,
          documentation: `bci_clearance_${caregiverId}.pdf`,
          status: 'CLEAR',
        },
      },
    };

    // Add STNA-specific data
    if (persona.role === 'STNA' && persona.stnaStatus) {
      const stnaCertExpiration = new Date();
      stnaCertExpiration.setDate(stnaCertExpiration.getDate() + persona.stnaExpirationDays!);

      stateSpecificData.ohio = {
        ...stateSpecificData.ohio,
        stnaNumber: `STNA-${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
        stnaStatus: persona.stnaStatus,
        stnaVerificationDate: new Date().toISOString(),
        stnaCertificationExpiration: stnaCertExpiration.toISOString(),
        stnaCEHours: Math.floor(Math.random() * 15),
        stnaLastPaidWork: new Date().toISOString(),
      };
    }

    // Add HHA-specific data
    if (persona.role === 'HHA' && persona.hhaTrainingCompleted) {
      const hhaTrainingDate = new Date();
      hhaTrainingDate.setDate(hhaTrainingDate.getDate() - 180);

      const lastCompetencyDate = new Date();
      lastCompetencyDate.setDate(lastCompetencyDate.getDate() - (persona.lastCompetencyDays || 90));

      stateSpecificData.ohio = {
        ...stateSpecificData.ohio,
        hhaTrainingCompletion: hhaTrainingDate.toISOString(),
        hhaTrainingProgram: 'Ohio State University HHA Training Program',
        hhaCompetencyStatus: 'PASSED',
        lastCompetencyCheck: lastCompetencyDate.toISOString(),
        annualInServiceHours: Math.floor(Math.random() * 5) + 12, // 12-16 hours
      };
    }

    const inserted = await insertIfNotExists(
      'caregivers',
      'id',
      caregiverId,
      `INSERT INTO caregivers (
        id, organization_id, employee_number, first_name, last_name,
        role, state_specific_data, compliance_status, status,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [
        caregiverId,
        ctx.ohioOrgId,
        `OH-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        persona.firstName,
        persona.lastName,
        persona.role,
        JSON.stringify(stateSpecificData),
        persona.complianceStatus,
        'ACTIVE',
      ]
    );

    if (inserted) {
      ctx.ohioCaregiverIds.push(caregiverId);
    }
  }

  console.log(`  ✓ Created ${ctx.ohioCaregiverIds.length} Ohio caregivers`);
}

/**
 * Seed Ohio care plans
 */
async function seedCarePlans(ctx: SeedContext): Promise<void> {
  console.log('📋 Seeding Ohio care plans...');

  for (const clientId of ctx.ohioClientIds) {
    const carePlanId = uuidv4();

    const inserted = await insertIfNotExists(
      'care_plans',
      'id',
      carePlanId,
      `INSERT INTO care_plans (
        id, client_id, organization_id, status, effective_date,
        review_date, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [
        carePlanId,
        clientId,
        ctx.ohioOrgId,
        'ACTIVE',
        new Date().toISOString(),
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
      ]
    );

    if (inserted) {
      ctx.ohioCarePlanIds.push(carePlanId);
    }
  }

  console.log(`  ✓ Created ${ctx.ohioCarePlanIds.length} Ohio care plans`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
