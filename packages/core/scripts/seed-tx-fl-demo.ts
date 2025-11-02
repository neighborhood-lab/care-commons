/**
 * TX/FL Demo Seed Data
 * 
 * Creates realistic demo scenarios for Texas and Florida EVV/scheduling workflows.
 * Includes state-specific configurations, sample clients, caregivers, and visits.
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
  texasOrgId: '00000000-0000-4000-8000-000000000001',
  floridaOrgId: '00000000-0000-4000-8000-000000000002',
  texasBranchId: '00000000-0000-4000-8000-000000000011',
  floridaBranchId: '00000000-0000-4000-8000-000000000012',
  texasAdminId: '00000000-0000-4000-8000-000000000021',
  floridaAdminId: '00000000-0000-4000-8000-000000000022',
  texasCoordinatorId: '00000000-0000-4000-8000-000000000023',
  floridaCoordinatorId: '00000000-0000-4000-8000-000000000024',
};

interface SeedContext {
  // Organizations
  texasOrgId: string;
  floridaOrgId: string;
  
  // Branches
  texasBranchId: string;
  floridaBranchId: string;
  
  // Users
  texasAdminId: string;
  floridaAdminId: string;
  texasCoordinatorId: string;
  floridaCoordinatorId: string;
  
  // Clients
  texasClientIds: string[];
  floridaClientIds: string[];
  
  // Caregivers
  texasCaregiverIds: string[];
  floridaCaregiverIds: string[];
  
  // Visits
  texasVisitIds: string[];
  floridaVisitIds: string[];
  
  // Care Plans
  texasCarePlanIds: string[];
  floridaCarePlanIds: string[];
}

async function main() {
  console.log('🌟 Seeding TX/FL demo data (idempotent)...\n');
  
  const ctx: SeedContext = {
    ...FIXED_IDS,
    texasClientIds: [],
    floridaClientIds: [],
    texasCaregiverIds: [],
    floridaCaregiverIds: [],
    texasVisitIds: [],
    floridaVisitIds: [],
    texasCarePlanIds: [],
    floridaCarePlanIds: [],
  };
  
  try {
    await seedOrganizations(ctx);
    await seedUsers(ctx);
    await seedClients(ctx);
    await seedCaregivers(ctx);
    await seedEVVStateConfig(ctx);
    await seedCarePlans(ctx);
    await seedServicePatterns(ctx);
    await seedVisits(ctx);
    await seedEVVRecords(ctx);
    await seedExceptions(ctx);
    
    console.log('\n✅ TX/FL demo data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - Organizations: 2 (TX, FL)`);
    console.log(`  - Clients: ${ctx.texasClientIds.length + ctx.floridaClientIds.length}`);
    console.log(`  - Caregivers: ${ctx.texasCaregiverIds.length + ctx.floridaCaregiverIds.length}`);
    console.log(`  - Care Plans: ${ctx.texasCarePlanIds.length + ctx.floridaCarePlanIds.length}`);
    console.log(`  - Visits: ${ctx.texasVisitIds.length + ctx.floridaVisitIds.length}`);
    
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
 * Seed Texas and Florida organizations
 */
async function seedOrganizations(ctx: SeedContext): Promise<void> {
  console.log('📋 Seeding organizations...');
  
  let txOrgCreated = false;
  let txBranchCreated = false;
  let flOrgCreated = false;
  let flBranchCreated = false;
  
  // Texas Organization - STAR+PLUS provider
  txOrgCreated = await insertIfNotExists(
    'organizations',
    'id',
    ctx.texasOrgId,
    `INSERT INTO organizations (
      id, name, legal_name, organization_type, tax_id,
      address, city, state, postal_code, country,
      phone, email, website,
      status, created_at, created_by, updated_at, updated_by
    ) VALUES (
      $1, 'Lone Star Home Care', 'Lone Star Home Care Services LLC', 'PROVIDER', '74-1234567',
      '123 Main Street', 'Austin', 'TX', '78701', 'US',
      '+1-512-555-0100', 'info@lonestarcare.example', 'https://lonestarcare.example',
      'ACTIVE', NOW(), $2, NOW(), $2
    ) ON CONFLICT (id) DO NOTHING`,
    [ctx.texasOrgId, ctx.texasAdminId]
  );
  
  txBranchCreated = await insertIfNotExists(
    'branches',
    'id',
    ctx.texasBranchId,
    `INSERT INTO branches (
      id, organization_id, name, branch_type,
      address, city, state, postal_code, country,
      phone, email,
      status, created_at, created_by, updated_at, updated_by
    ) VALUES (
      $1, $2, 'Austin Main Branch', 'MAIN',
      '123 Main Street', 'Austin', 'TX', '78701', 'US',
      '+1-512-555-0100', 'austin@lonestarcare.example',
      'ACTIVE', NOW(), $3, NOW(), $3
    ) ON CONFLICT (id) DO NOTHING`,
    [ctx.texasBranchId, ctx.texasOrgId, ctx.texasAdminId]
  );
  
  // Florida Organization - SMMC LTC provider
  flOrgCreated = await insertIfNotExists(
    'organizations',
    'id',
    ctx.floridaOrgId,
    `INSERT INTO organizations (
      id, name, legal_name, organization_type, tax_id,
      address, city, state, postal_code, country,
      phone, email, website,
      status, created_at, created_by, updated_at, updated_by
    ) VALUES (
      $1, 'Sunshine Home Health', 'Sunshine Home Health Services Inc', 'PROVIDER', '59-7654321',
      '456 Ocean Drive', 'Miami', 'FL', '33139', 'US',
      '+1-305-555-0200', 'info@sunshinehh.example', 'https://sunshinehh.example',
      'ACTIVE', NOW(), $2, NOW(), $2
    ) ON CONFLICT (id) DO NOTHING`,
    [ctx.floridaOrgId, ctx.floridaAdminId]
  );
  
  flBranchCreated = await insertIfNotExists(
    'branches',
    'id',
    ctx.floridaBranchId,
    `INSERT INTO branches (
      id, organization_id, name, branch_type,
      address, city, state, postal_code, country,
      phone, email,
      status, created_at, created_by, updated_at, updated_by
    ) VALUES (
      $1, $2, 'Miami Beach Branch', 'MAIN',
      '456 Ocean Drive', 'Miami', 'FL', '33139', 'US',
      '+1-305-555-0200', 'miami@sunshinehh.example',
      'ACTIVE', NOW(), $3, NOW(), $3
    ) ON CONFLICT (id) DO NOTHING`,
    [ctx.floridaBranchId, ctx.floridaOrgId, ctx.floridaAdminId]
  );
  
  console.log(`  ✓ Organizations (${txOrgCreated || flOrgCreated ? 'created' : 'existing'})`);
}

/**
 * Seed admin and coordinator users
 */
async function seedUsers(ctx: SeedContext): Promise<void> {
  console.log('👥 Seeding users...');
  
  // Texas users
  await pool.query(`
    INSERT INTO users (
      id, organization_id, email, first_name, last_name,
      roles, permissions, status,
      created_at, updated_at
    ) VALUES
      ($1, $2, 'admin@lonestarcare.example', 'Sarah', 'Johnson',
       '["ORG_ADMIN"]', '["*"]', 'ACTIVE', NOW(), NOW()),
      ($3, $2, 'coordinator@lonestarcare.example', 'Michael', 'Rodriguez',
       '["COORDINATOR"]', '["schedules:*", "visits:*", "evv:*"]', 'ACTIVE', NOW(), NOW())
  `, [ctx.texasAdminId, ctx.texasOrgId, ctx.texasCoordinatorId]);
  
  // Florida users
  await pool.query(`
    INSERT INTO users (
      id, organization_id, email, first_name, last_name,
      roles, permissions, status,
      created_at, updated_at
    ) VALUES
      ($1, $2, 'admin@sunshinehh.example', 'Maria', 'Garcia',
       '["ORG_ADMIN"]', '["*"]', 'ACTIVE', NOW(), NOW()),
      ($3, $2, 'coordinator@sunshinehh.example', 'James', 'Smith',
       '["COORDINATOR"]', '["schedules:*", "visits:*", "evv:*"]', 'ACTIVE', NOW(), NOW())
  `, [ctx.floridaAdminId, ctx.floridaOrgId, ctx.floridaCoordinatorId]);
  
  console.log('  ✓ Users seeded');
}

/**
 * Seed realistic clients for TX and FL
 */
async function seedClients(ctx: SeedContext): Promise<void> {
  console.log('👤 Seeding clients...');
  
  // Texas clients (STAR+PLUS eligible)
  const texasClients = [
    {
      firstName: 'Robert',
      lastName: 'Martinez',
      dob: '1945-03-15',
      medicaidId: 'TX1234567890',
      address: '789 Elm Street',
      city: 'Austin',
      zip: '78704',
      lat: 30.2458,
      lon: -97.7505,
      program: 'STAR_PLUS',
    },
    {
      firstName: 'Margaret',
      lastName: 'Thompson',
      dob: '1938-07-22',
      medicaidId: 'TX0987654321',
      address: '321 Oak Avenue',
      city: 'Austin',
      zip: '78701',
      lat: 30.2672,
      lon: -97.7431,
      program: 'COMMUNITY_FIRST_CHOICE',
    },
  ];
  
  for (const client of texasClients) {
    const clientId = uuidv4();
    ctx.texasClientIds.push(clientId);
    
    await pool.query(`
      INSERT INTO clients (
        id, organization_id, branch_id,
        first_name, last_name, date_of_birth,
        medicaid_id,
        service_address_line1, service_address_city,
        service_address_state, service_address_postal_code,
        service_address_country,
        service_address_latitude, service_address_longitude,
        service_address_verified,
        state_specific_data,
        status, created_at, created_by, updated_at, updated_by
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6,
        $7,
        $8, $9,
        'TX', $10,
        'US',
        $11, $12,
        true,
        $13::jsonb,
        'ACTIVE', NOW(), $14, NOW(), $14
      )
    `, [
      clientId, ctx.texasOrgId, ctx.texasBranchId,
      client.firstName, client.lastName, client.dob,
      client.medicaidId,
      client.address, client.city,
      client.zip,
      client.lat, client.lon,
      JSON.stringify({ texasMedicaidProgram: client.program }),
      ctx.texasAdminId,
    ]);
  }
  
  // Florida clients (SMMC LTC eligible)
  const floridaClients = [
    {
      firstName: 'Dorothy',
      lastName: 'Williams',
      dob: '1940-05-10',
      medicaidId: 'FL9876543210',
      address: '555 Collins Avenue',
      city: 'Miami Beach',
      zip: '33139',
      lat: 25.7907,
      lon: -80.1300,
      program: 'SMMC_LTC',
    },
    {
      firstName: 'Harold',
      lastName: 'Davis',
      dob: '1943-11-03',
      medicaidId: 'FL1234567890',
      address: '888 Biscayne Blvd',
      city: 'Miami',
      zip: '33132',
      lat: 25.7814,
      lon: -80.1867,
      program: 'SMMC_MMA',
    },
  ];
  
  for (const client of floridaClients) {
    const clientId = uuidv4();
    ctx.floridaClientIds.push(clientId);
    
    await pool.query(`
      INSERT INTO clients (
        id, organization_id, branch_id,
        first_name, last_name, date_of_birth,
        medicaid_id,
        service_address_line1, service_address_city,
        service_address_state, service_address_postal_code,
        service_address_country,
        service_address_latitude, service_address_longitude,
        service_address_verified,
        state_specific_data,
        status, created_at, created_by, updated_at, updated_by
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6,
        $7,
        $8, $9,
        'FL', $10,
        'US',
        $11, $12,
        true,
        $13::jsonb,
        'ACTIVE', NOW(), $14, NOW(), $14
      )
    `, [
      clientId, ctx.floridaOrgId, ctx.floridaBranchId,
      client.firstName, client.lastName, client.dob,
      client.medicaidId,
      client.address, client.city,
      client.zip,
      client.lat, client.lon,
      JSON.stringify({ floridaMedicaidProgram: client.program }),
      ctx.floridaAdminId,
    ]);
  }
  
  console.log(`  ✓ Clients seeded (TX: ${texasClients.length}, FL: ${floridaClients.length})`);
}

/**
 * Seed caregivers with proper credentials and background screenings
 */
async function seedCaregivers(ctx: SeedContext): Promise<void> {
  console.log('👨‍⚕️ Seeding caregivers...');
  
  // Texas caregivers (cleared registries)
  const texasCaregivers = [
    {
      firstName: 'Jennifer',
      lastName: 'Lopez',
      employeeId: 'TX-CG-001',
      email: 'jlopez@lonestarcare.example',
      phone: '+1-512-555-1001',
    },
    {
      firstName: 'Carlos',
      lastName: 'Hernandez',
      employeeId: 'TX-CG-002',
      email: 'chernandez@lonestarcare.example',
      phone: '+1-512-555-1002',
    },
  ];
  
  for (const cg of texasCaregivers) {
    const cgId = uuidv4();
    ctx.texasCaregiverIds.push(cgId);
    
    await pool.query(`
      INSERT INTO caregivers (
        id, organization_id, branch_id,
        first_name, last_name, employee_id,
        email, phone,
        state_specific_data,
        status, created_at, created_by, updated_at, updated_by
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6,
        $7, $8,
        $9::jsonb,
        'ACTIVE', NOW(), $10, NOW(), $10
      )
    `, [
      cgId, ctx.texasOrgId, ctx.texasBranchId,
      cg.firstName, cg.lastName, cg.employeeId,
      cg.email, cg.phone,
      JSON.stringify({
        txEmployeeMisconductRegistry: { status: 'CLEARED', checkedAt: new Date() },
        txNurseAideRegistry: { status: 'CLEARED', checkedAt: new Date() },
      }),
      ctx.texasAdminId,
    ]);
  }
  
  // Florida caregivers (Level 2 screening cleared)
  const floridaCaregivers = [
    {
      firstName: 'Ana',
      lastName: 'Rodriguez',
      employeeId: 'FL-CG-001',
      email: 'arodriguez@sunshinehh.example',
      phone: '+1-305-555-2001',
    },
    {
      firstName: 'Michael',
      lastName: 'Johnson',
      employeeId: 'FL-CG-002',
      email: 'mjohnson@sunshinehh.example',
      phone: '+1-305-555-2002',
    },
  ];
  
  for (const cg of floridaCaregivers) {
    const cgId = uuidv4();
    ctx.floridaCaregiverIds.push(cgId);
    
    await pool.query(`
      INSERT INTO caregivers (
        id, organization_id, branch_id,
        first_name, last_name, employee_id,
        email, phone,
        state_specific_data,
        status, created_at, created_by, updated_at, updated_by
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6,
        $7, $8,
        $9::jsonb,
        'ACTIVE', NOW(), $10, NOW(), $10
      )
    `, [
      cgId, ctx.floridaOrgId, ctx.floridaBranchId,
      cg.firstName, cg.lastName, cg.employeeId,
      cg.email, cg.phone,
      JSON.stringify({
        flLevel2Screening: {
          status: 'CLEARED',
          completedAt: new Date(),
          expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years
        },
      }),
      ctx.floridaAdminId,
    ]);
  }
  
  console.log(`  ✓ Caregivers seeded (TX: ${texasCaregivers.length}, FL: ${floridaCaregivers.length})`);
}

/**
 * Seed state-specific EVV configuration
 */
async function seedEVVStateConfig(ctx: SeedContext): Promise<void> {
  console.log('⚙️  Seeding EVV state configuration...');
  
  // Texas EVV Config (HHAeXchange mandatory)
  await pool.query(`
    INSERT INTO evv_state_config (
      id, organization_id, branch_id,
      state_code, aggregator_type, aggregator_entity_id, aggregator_endpoint,
      program_type,
      allowed_clock_methods, requires_gps_for_mobile, geo_perimeter_tolerance,
      clock_in_grace_period, clock_out_grace_period, late_clock_in_threshold,
      vmur_enabled, vmur_approval_required, vmur_reason_codes_required,
      is_active, effective_from,
      created_at, created_by, updated_at, updated_by
    ) VALUES (
      $1, $2, $3,
      'TX', 'HHAEEXCHANGE', 'TX-ENTITY-12345', 'https://api.hhaeexchange.com/tx/v1',
      'STAR_PLUS',
      $4::jsonb, true, 100,
      10, 10, 15,
      true, true, true,
      true, CURRENT_DATE,
      NOW(), $5, NOW(), $5
    )
  `, [
    uuidv4(), ctx.texasOrgId, ctx.texasBranchId,
    JSON.stringify(['MOBILE_GPS', 'FIXED_TELEPHONY']),
    ctx.texasAdminId,
  ]);
  
  // Florida EVV Config (Multi-aggregator)
  await pool.query(`
    INSERT INTO evv_state_config (
      id, organization_id, branch_id,
      state_code, aggregator_type, aggregator_entity_id, aggregator_endpoint,
      program_type,
      allowed_clock_methods, requires_gps_for_mobile, geo_perimeter_tolerance,
      clock_in_grace_period, clock_out_grace_period, late_clock_in_threshold,
      vmur_enabled, vmur_approval_required,
      additional_aggregators,
      is_active, effective_from,
      created_at, created_by, updated_at, updated_by
    ) VALUES (
      $1, $2, $3,
      'FL', 'HHAEEXCHANGE', 'FL-ENTITY-67890', 'https://api.hhaeexchange.com/fl/v1',
      'SMMC_LTC',
      $4::jsonb, true, 150,
      15, 15, 20,
      false, false,
      $5::jsonb,
      true, CURRENT_DATE,
      NOW(), $6, NOW(), $6
    )
  `, [
    uuidv4(), ctx.floridaOrgId, ctx.floridaBranchId,
    JSON.stringify(['MOBILE_GPS', 'TELEPHONY_IVR', 'BIOMETRIC_MOBILE']),
    JSON.stringify([
      { id: 'netsmart-fl', type: 'NETSMART_TELLUS', endpoint: 'https://api.netsmart.com/fl/v1' },
    ]),
    ctx.floridaAdminId,
  ]);
  
  console.log('  ✓ EVV state configurations seeded');
}

/**
 * Seed care plans with authorizations
 */
async function seedCarePlans(ctx: SeedContext): Promise<void> {
  console.log('📋 Seeding care plans...');
  
  // Seed care plans for Texas clients
  for (let i = 0; i < ctx.texasClientIds.length; i++) {
    const clientId = ctx.texasClientIds[i];
    const carePlanId = `00000000-0000-4000-8000-0000000001${i + 1}1`;
    
    const created = await insertIfNotExists(
      'care_plans',
      'id',
      carePlanId,
      `INSERT INTO care_plans (
        id, client_id, organization_id,
        plan_name, plan_type, status,
        start_date, end_date,
        authorized_hours_per_week,
        created_at, created_by, updated_at, updated_by
      ) VALUES (
        $1, $2, $3,
        $4, 'WAIVER', 'ACTIVE',
        CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months',
        40,
        NOW(), $5, NOW(), $5
      ) ON CONFLICT (id) DO NOTHING`,
      [carePlanId, clientId, ctx.texasOrgId, `STAR+PLUS Care Plan ${i + 1}`, ctx.texasAdminId]
    );
    
    if (created) {
      ctx.texasCarePlanIds.push(carePlanId);
    }
  }
  
  // Seed care plans for Florida clients
  for (let i = 0; i < ctx.floridaClientIds.length; i++) {
    const clientId = ctx.floridaClientIds[i];
    const carePlanId = `00000000-0000-4000-8000-0000000002${i + 1}1`;
    
    const created = await insertIfNotExists(
      'care_plans',
      'id',
      carePlanId,
      `INSERT INTO care_plans (
        id, client_id, organization_id,
        plan_name, plan_type, status,
        start_date, end_date,
        authorized_hours_per_week,
        created_at, created_by, updated_at, updated_by
      ) VALUES (
        $1, $2, $3,
        $4, 'MANAGED_CARE', 'ACTIVE',
        CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months',
        35,
        NOW(), $5, NOW(), $5
      ) ON CONFLICT (id) DO NOTHING`,
      [carePlanId, clientId, ctx.floridaOrgId, `SMMC LTC Care Plan ${i + 1}`, ctx.floridaAdminId]
    );
    
    if (created) {
      ctx.floridaCarePlanIds.push(carePlanId);
    }
  }
  
  console.log(`  ✓ Care plans seeded (TX: ${ctx.texasCarePlanIds.length}, FL: ${ctx.floridaCarePlanIds.length})`);
}

/**
 * Seed service patterns
 */
async function seedServicePatterns(ctx: SeedContext): Promise<void> {
  console.log('🔄 Seeding service patterns...');
  
  let created = 0;
  
  // Create recurring patterns for each care plan
  const allCarePlans = [...ctx.texasCarePlanIds, ...ctx.floridaCarePlanIds];
  const allClients = [...ctx.texasClientIds, ...ctx.floridaClientIds];
  
  for (let i = 0; i < allCarePlans.length; i++) {
    const patternId = `00000000-0000-4000-8000-0000000003${i + 1}1`;
    const wasCreated = await insertIfNotExists(
      'service_patterns',
      'id',
      patternId,
      `INSERT INTO service_patterns (
        id, care_plan_id, client_id,
        pattern_type, recurrence_rule,
        service_type, duration_minutes,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3,
        'RECURRING', $4::jsonb,
        'PERSONAL_CARE', 120,
        NOW(), NOW()
      ) ON CONFLICT (id) DO NOTHING`,
      [
        patternId,
        allCarePlans[i],
        allClients[i],
        JSON.stringify({
          frequency: 'WEEKLY',
          interval: 1,
          daysOfWeek: ['MON', 'WED', 'FRI'],
          startTime: '09:00',
          endTime: '11:00',
        }),
      ]
    );
    
    if (wasCreated) created++;
  }
  
  console.log(`  ✓ Service patterns seeded (${created} created)`);
}

/**
 * Seed visits for demonstration
 */
async function seedVisits(ctx: SeedContext): Promise<void> {
  console.log('📅 Seeding visits...');
  
  let created = 0;
  
  // Create visits for the next 7 days for each client-caregiver pair
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    // Texas visits
    for (let i = 0; i < Math.min(ctx.texasClientIds.length, ctx.texasCaregiverIds.length); i++) {
      const visitId = `00000000-0000-4000-8000-0000100${dayOffset}${i + 1}01`;
      const wasCreated = await insertIfNotExists(
        'visits',
        'id',
        visitId,
        `INSERT INTO visits (
          id, client_id, caregiver_id, organization_id, branch_id,
          scheduled_start, scheduled_end,
          service_type, status,
          created_at, created_by, updated_at, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5,
          CURRENT_DATE + $6 * INTERVAL '1 day' + INTERVAL '9 hours',
          CURRENT_DATE + $6 * INTERVAL '1 day' + INTERVAL '11 hours',
          'PERSONAL_CARE', 'SCHEDULED',
          NOW(), $7, NOW(), $7
        ) ON CONFLICT (id) DO NOTHING`,
        [
          visitId,
          ctx.texasClientIds[i],
          ctx.texasCaregiverIds[i],
          ctx.texasOrgId,
          ctx.texasBranchId,
          dayOffset,
          ctx.texasAdminId,
        ]
      );
      
      if (wasCreated) {
        ctx.texasVisitIds.push(visitId);
        created++;
      }
    }
    
    // Florida visits
    for (let i = 0; i < Math.min(ctx.floridaClientIds.length, ctx.floridaCaregiverIds.length); i++) {
      const visitId = `00000000-0000-4000-8000-0000200${dayOffset}${i + 1}01`;
      const wasCreated = await insertIfNotExists(
        'visits',
        'id',
        visitId,
        `INSERT INTO visits (
          id, client_id, caregiver_id, organization_id, branch_id,
          scheduled_start, scheduled_end,
          service_type, status,
          created_at, created_by, updated_at, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5,
          CURRENT_DATE + $6 * INTERVAL '1 day' + INTERVAL '14 hours',
          CURRENT_DATE + $6 * INTERVAL '1 day' + INTERVAL '16 hours',
          'PERSONAL_CARE', 'SCHEDULED',
          NOW(), $7, NOW(), $7
        ) ON CONFLICT (id) DO NOTHING`,
        [
          visitId,
          ctx.floridaClientIds[i],
          ctx.floridaCaregiverIds[i],
          ctx.floridaOrgId,
          ctx.floridaBranchId,
          dayOffset,
          ctx.floridaAdminId,
        ]
      );
      
      if (wasCreated) {
        ctx.floridaVisitIds.push(visitId);
        created++;
      }
    }
  }
  
  console.log(`  ✓ Visits seeded (${created} created)`);
}

/**
 * Seed EVV records with realistic scenarios
 */
async function seedEVVRecords(ctx: SeedContext): Promise<void> {
  console.log('🕐 Seeding EVV records...');
  
  let created = 0;
  
  // Create EVV records for visits in the past (last 3 days)
  const pastVisitIds = [...ctx.texasVisitIds.slice(0, 6), ...ctx.floridaVisitIds.slice(0, 6)];
  
  for (let i = 0; i < pastVisitIds.length; i++) {
    const evvId = `00000000-0000-4000-8000-0000300${i + 1}01`;
    const visitId = pastVisitIds[i];
    
    const wasCreated = await insertIfNotExists(
      'evv_records',
      'id',
      evvId,
      `INSERT INTO evv_records (
        id, visit_id,
        clock_in_method, clock_in_timestamp, clock_in_latitude, clock_in_longitude,
        clock_out_method, clock_out_timestamp, clock_out_latitude, clock_out_longitude,
        compliance_status,
        created_at, updated_at
      ) VALUES (
        $1, $2,
        'MOBILE_GPS', NOW() - INTERVAL '${i + 1} days' + INTERVAL '9 hours',
        ${30.2672 + (i * 0.01)}, ${-97.7431 + (i * 0.01)},
        'MOBILE_GPS', NOW() - INTERVAL '${i + 1} days' + INTERVAL '11 hours',
        ${30.2672 + (i * 0.01)}, ${-97.7431 + (i * 0.01)},
        'COMPLIANT',
        NOW(), NOW()
      ) ON CONFLICT (id) DO NOTHING`,
      [evvId, visitId]
    );
    
    if (wasCreated) created++;
  }
  
  console.log(`  ✓ EVV records seeded (${created} created)`);
}

/**
 * Seed exception queue items
 */
async function seedExceptions(ctx: SeedContext): Promise<void> {
  console.log('⚠️  Seeding exception queue...');
  
  let created = 0;
  
  // Create a few exception scenarios
  const exceptions = [
    {
      id: '00000000-0000-4000-8000-000040001',
      visitId: ctx.texasVisitIds[0] ?? null,
      type: 'LATE_CLOCK_IN',
      description: 'Caregiver clocked in 23 minutes late',
    },
    {
      id: '00000000-0000-4000-8000-000040002',
      visitId: ctx.floridaVisitIds[0] ?? null,
      type: 'GPS_MISMATCH',
      description: 'Clock-in location >150m from service address',
    },
  ];
  
  for (const exc of exceptions) {
    if (!exc.visitId) continue;
    
    const wasCreated = await insertIfNotExists(
      'exception_queue',
      'id',
      exc.id,
      `INSERT INTO exception_queue (
        id, visit_id, exception_type, description,
        status, priority,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4,
        'OPEN', 'MEDIUM',
        NOW(), NOW()
      ) ON CONFLICT (id) DO NOTHING`,
      [exc.id, exc.visitId, exc.type, exc.description]
    );
    
    if (wasCreated) created++;
  }
  
  console.log(`  ✓ Exceptions seeded (${created} created)`);
}

// Run the seed script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
