/**
 * TX/FL Demo Seed Data
 *
 * Creates realistic demo scenarios for Texas and Florida EVV/scheduling workflows.
 * Includes state-specific configurations, sample clients, caregivers, and visits.
 */
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
async function main() {
    console.log('🌟 Seeding TX/FL demo data...\n');
    const ctx = {
        texasOrgId: uuidv4(),
        floridaOrgId: uuidv4(),
        texasBranchId: uuidv4(),
        floridaBranchId: uuidv4(),
        texasAdminId: uuidv4(),
        floridaAdminId: uuidv4(),
        texasCoordinatorId: uuidv4(),
        floridaCoordinatorId: uuidv4(),
        texasClientIds: [],
        floridaClientIds: [],
        texasCaregiverIds: [],
        floridaCaregiverIds: [],
        texasVisitIds: [],
        floridaVisitIds: [],
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
        console.log(`  - Visits: ${ctx.texasVisitIds.length + ctx.floridaVisitIds.length}`);
    }
    catch (error) {
        console.error('❌ Error seeding data:', error);
        throw error;
    }
    finally {
        await pool.end();
    }
}
/**
 * Seed Texas and Florida organizations
 */
async function seedOrganizations(ctx) {
    console.log('📋 Seeding organizations...');
    // Texas Organization - STAR+PLUS provider
    await pool.query(`
    INSERT INTO organizations (
      id, name, legal_name, organization_type, tax_id,
      address, city, state, postal_code, country,
      phone, email, website,
      status, created_at, created_by, updated_at, updated_by
    ) VALUES (
      $1, 'Lone Star Home Care', 'Lone Star Home Care Services LLC', 'PROVIDER', '74-1234567',
      '123 Main Street', 'Austin', 'TX', '78701', 'US',
      '+1-512-555-0100', 'info@lonestarcare.example', 'https://lonestarcare.example',
      'ACTIVE', NOW(), $2, NOW(), $2
    )
  `, [ctx.texasOrgId, ctx.texasAdminId]);
    await pool.query(`
    INSERT INTO branches (
      id, organization_id, name, branch_type,
      address, city, state, postal_code, country,
      phone, email,
      status, created_at, created_by, updated_at, updated_by
    ) VALUES (
      $1, $2, 'Austin Main Branch', 'MAIN',
      '123 Main Street', 'Austin', 'TX', '78701', 'US',
      '+1-512-555-0100', 'austin@lonestarcare.example',
      'ACTIVE', NOW(), $3, NOW(), $3
    )
  `, [ctx.texasBranchId, ctx.texasOrgId, ctx.texasAdminId]);
    // Florida Organization - SMMC LTC provider
    await pool.query(`
    INSERT INTO organizations (
      id, name, legal_name, organization_type, tax_id,
      address, city, state, postal_code, country,
      phone, email, website,
      status, created_at, created_by, updated_at, updated_by
    ) VALUES (
      $1, 'Sunshine Home Health', 'Sunshine Home Health Services Inc', 'PROVIDER', '59-7654321',
      '456 Ocean Drive', 'Miami', 'FL', '33139', 'US',
      '+1-305-555-0200', 'info@sunshinehh.example', 'https://sunshinehh.example',
      'ACTIVE', NOW(), $2, NOW(), $2
    )
  `, [ctx.floridaOrgId, ctx.floridaAdminId]);
    await pool.query(`
    INSERT INTO branches (
      id, organization_id, name, branch_type,
      address, city, state, postal_code, country,
      phone, email,
      status, created_at, created_by, updated_at, updated_by
    ) VALUES (
      $1, $2, 'Miami Beach Branch', 'MAIN',
      '456 Ocean Drive', 'Miami', 'FL', '33139', 'US',
      '+1-305-555-0200', 'miami@sunshinehh.example',
      'ACTIVE', NOW(), $3, NOW(), $3
    )
  `, [ctx.floridaBranchId, ctx.floridaOrgId, ctx.floridaAdminId]);
    console.log('  ✓ Organizations seeded');
}
/**
 * Seed admin and coordinator users
 */
async function seedUsers(ctx) {
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
async function seedClients(ctx) {
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
async function seedCaregivers(ctx) {
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
async function seedEVVStateConfig(ctx) {
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
async function seedCarePlans(_ctx) {
    console.log('📋 Seeding care plans...');
    // Seed care plans for each client
    // This would integrate with care-plans-tasks vertical
    // For now, just log that it would be done
    console.log('  ℹ️  Care plan seeding would integrate with care-plans-tasks vertical');
}
/**
 * Seed service patterns
 */
async function seedServicePatterns(_ctx) {
    console.log('🔄 Seeding service patterns...');
    // Seed service patterns for clients
    // This creates recurring visit schedules
    console.log('  ℹ️  Service pattern seeding would create recurring visit schedules');
}
/**
 * Seed visits for demonstration
 */
async function seedVisits(_ctx) {
    console.log('📅 Seeding visits...');
    // Seed visits for today and upcoming days
    console.log('  ℹ️  Visit seeding would create scheduled visits for demo');
}
/**
 * Seed EVV records with realistic scenarios
 */
async function seedEVVRecords(_ctx) {
    console.log('🕐 Seeding EVV records...');
    // Seed EVV records showing various compliance scenarios
    console.log('  ℹ️  EVV record seeding would show compliant and non-compliant scenarios');
}
/**
 * Seed exception queue items
 */
async function seedExceptions(_ctx) {
    console.log('⚠️  Seeding exception queue...');
    // Seed exception queue items for demo
    console.log('  ℹ️  Exception queue seeding would show various EVV anomalies');
}
// Run the seed script
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
