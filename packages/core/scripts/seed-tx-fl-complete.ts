/**
 * Complete TX/FL EVV Seed Data
 * 
 * Seeds comprehensive test data for Texas and Florida EVV implementations:
 * - Organizations with branches in TX and FL
 * - Clients with state-specific data
 * - Caregivers with proper credentials
 * - Visits for testing
 * - EVV state configurations
 * - Sample EVV records
 * - VMUR examples (Texas)
 */

import { Database } from '../src/db/connection.js';

interface SeedResult {
  organizations: Array<{ id: string; name: string; state: string }>;
  branches: Array<{ id: string; name: string; state: string }>;
  clients: Array<{ id: string; name: string; state: string }>;
  caregivers: Array<{ id: string; name: string }>;
  visits: Array<{ id: string; clientId: string; caregiverId: string; state: string }>;
  evvRecords: Array<{ id: string; visitId: string; state: string }>;
}

export async function seedTXFLComplete(db: Database): Promise<SeedResult> {
  console.log('🌱 Seeding comprehensive TX/FL EVV data...');

  const result: SeedResult = {
    organizations: [],
    branches: [],
    clients: [],
    caregivers: [],
    visits: [],
    evvRecords: [],
  };

  // Use a known system user ID for audit fields
  const systemUserId = '00000000-0000-0000-0000-000000000001';

  // ============================================================================
  // 1. Organizations
  // ============================================================================

  console.log('  Creating organizations...');
  
  const txOrgResult = await db.query(`
    INSERT INTO organizations (
      id, name, ein, phone, email, 
      address_line1, address_city, address_state, address_postal_code, address_country,
      status, settings,
      created_by, updated_by
    ) VALUES (
      gen_random_uuid(),
      'Lone Star Home Healthcare',
      '75-1234567',
      '+1-512-555-0100',
      'admin@lonestarhhc.example.com',
      '123 Congress Ave',
      'Austin',
      'TX',
      '78701',
      'US',
      'ACTIVE',
      '{}'::jsonb,
      $1, $1
    ) RETURNING id, name, address_state as state
  `, [systemUserId]);

  const txOrg = txOrgResult.rows[0] as Record<string, unknown>;
  result.organizations.push({ id: txOrg['id'] as string, name: txOrg['name'] as string, state: txOrg['state'] as string });

  const flOrgResult = await db.query(`
    INSERT INTO organizations (
      id, name, ein, phone, email,
      address_line1, address_city, address_state, address_postal_code, address_country,
      status, settings,
      created_by, updated_by
    ) VALUES (
      gen_random_uuid(),
      'Sunshine State Care Services',
      '59-9876543',
      '+1-305-555-0200',
      'admin@sunshinecare.example.com',
      '456 Ocean Drive',
      'Miami',
      'FL',
      '33139',
      'US',
      'ACTIVE',
      '{}'::jsonb,
      $1, $1
    ) RETURNING id, name, address_state as state
  `, [systemUserId]);

  const flOrg = flOrgResult.rows[0] as Record<string, unknown>;
  result.organizations.push({ id: flOrg['id'] as string, name: flOrg['name'] as string, state: flOrg['state'] as string });

  // ============================================================================
  // 2. Branches
  // ============================================================================

  console.log('  Creating branches...');

  const txBranchResult = await db.query(`
    INSERT INTO branches (
      id, organization_id, name, branch_code, phone, email,
      address_line1, address_city, address_state, address_postal_code, address_country,
      status, settings,
      created_by, updated_by
    ) VALUES (
      gen_random_uuid(),
      $1,
      'Austin Branch',
      'ATX-001',
      '+1-512-555-0101',
      'austin@lonestarhhc.example.com',
      '123 Congress Ave',
      'Austin',
      'TX',
      '78701',
      'US',
      'ACTIVE',
      '{}'::jsonb,
      $2, $2
    ) RETURNING id, name, address_state as state
  `, [txOrg['id'], systemUserId]);

  const txBranch = txBranchResult.rows[0] as Record<string, unknown>;
  result.branches.push({ id: txBranch['id'] as string, name: txBranch['name'] as string, state: txBranch['state'] as string });

  const flBranchResult = await db.query(`
    INSERT INTO branches (
      id, organization_id, name, branch_code, phone, email,
      address_line1, address_city, address_state, address_postal_code, address_country,
      status, settings,
      created_by, updated_by
    ) VALUES (
      gen_random_uuid(),
      $1,
      'Miami Beach Branch',
      'MIA-001',
      '+1-305-555-0201',
      'miami@sunshinecare.example.com',
      '456 Ocean Drive',
      'Miami Beach',
      'FL',
      '33139',
      'US',
      'ACTIVE',
      '{}'::jsonb,
      $2, $2
    ) RETURNING id, name, address_state as state
  `, [flOrg['id'], systemUserId]);

  const flBranch = flBranchResult.rows[0] as Record<string, unknown>;
  result.branches.push({ id: flBranch['id'] as string, name: flBranch['name'] as string, state: flBranch['state'] as string });

  // ============================================================================
  // 3. EVV State Configurations
  // ============================================================================

  console.log('  Creating EVV state configurations...');

  // Texas Configuration
  await db.query(`
    INSERT INTO evv_state_config (
      id, organization_id, branch_id, state_code,
      aggregator_type, aggregator_entity_id, aggregator_endpoint,
      program_type,
      allowed_clock_methods, requires_gps_for_mobile, geo_perimeter_tolerance,
      clock_in_grace_period, clock_out_grace_period, late_clock_in_threshold,
      vmur_enabled, vmur_approval_required, vmur_reason_codes_required,
      is_active, effective_from,
      created_by, updated_by
    ) VALUES (
      gen_random_uuid(),
      $1,
      $2,
      'TX',
      'HHAEEXCHANGE',
      'TX-HHSC-12345',
      'https://api.hhaeexchange.com/v2/texas',
      'STAR_PLUS',
      '["MOBILE_GPS", "FIXED_TELEPHONY", "MOBILE_TELEPHONY"]'::jsonb,
      true,
      100,
      10,
      10,
      15,
      true,
      true,
      true,
      true,
      CURRENT_DATE,
      $3, $3
    )
  `, [txOrg['id'], txBranch['id'], systemUserId]);

  // Florida Configuration
  await db.query(`
    INSERT INTO evv_state_config (
      id, organization_id, branch_id, state_code,
      aggregator_type, aggregator_entity_id, aggregator_endpoint,
      program_type,
      allowed_clock_methods, requires_gps_for_mobile, geo_perimeter_tolerance,
      clock_in_grace_period, clock_out_grace_period, late_clock_in_threshold,
      vmur_enabled, vmur_approval_required, vmur_reason_codes_required,
      additional_aggregators,
      mco_requirements,
      is_active, effective_from,
      created_by, updated_by
    ) VALUES (
      gen_random_uuid(),
      $1,
      $2,
      'FL',
      'HHAEEXCHANGE',
      'FL-AHCA-67890',
      'https://api.hhaeexchange.com/v2/florida',
      'SMMC_LTC',
      '["MOBILE_GPS", "TELEPHONY_IVR", "BIOMETRIC_MOBILE"]'::jsonb,
      false,
      150,
      15,
      15,
      20,
      false,
      false,
      false,
      '[{"id": "NETSMART_TELLUS", "name": "Netsmart Tellus", "endpoint": "https://tellus.netsmart.com/api/v1", "isActive": true}]'::jsonb,
      '{"mcoName": "Sunshine Health", "mcoId": "SH-001", "requiresClientSignature": true}'::jsonb,
      true,
      CURRENT_DATE,
      $3, $3
    )
  `, [flOrg['id'], flBranch['id'], systemUserId]);

  // ============================================================================
  // 4. Clients
  // ============================================================================

  console.log('  Creating clients...');

  // Texas Clients
  const txClient1Result = await db.query(`
    INSERT INTO clients (
      id, organization_id, branch_id,
      first_name, last_name, date_of_birth, sex,
      address_line1, address_city, address_state, address_postal_code, address_country,
      phone, email,
      medicaid_id,
      state,
      state_specific,
      status,
      created_by, updated_by
    ) VALUES (
      gen_random_uuid(),
      $1,
      $2,
      'Maria',
      'Rodriguez',
      '1955-03-15',
      'FEMALE',
      '789 Guadalupe St',
      'Austin',
      'TX',
      '78701',
      'US',
      '+1-512-555-1001',
      'maria.rodriguez@example.com',
      'TX-MCD-111111111',
      'TX',
      '{"texas": {"program": "STAR_PLUS", "evv_aggregator": "HHAEEXCHANGE"}}'::jsonb,
      'ACTIVE',
      $3, $3
    ) RETURNING id, first_name, last_name, state
  `, [txOrg['id'], txBranch['id'], systemUserId]);

  const txClient1 = txClient1Result.rows[0] as Record<string, unknown>;
  result.clients.push({ 
    id: txClient1['id'] as string, 
    name: `${txClient1['first_name'] as string} ${txClient1['last_name'] as string}`, 
    state: txClient1['state'] as string
  });

  // Florida Clients
  const flClient1Result = await db.query(`
    INSERT INTO clients (
      id, organization_id, branch_id,
      first_name, last_name, date_of_birth, sex,
      address_line1, address_city, address_state, address_postal_code, address_country,
      phone, email,
      medicaid_id,
      state,
      state_specific,
      status,
      created_by, updated_by
    ) VALUES (
      gen_random_uuid(),
      $1,
      $2,
      'Robert',
      'Johnson',
      '1948-07-22',
      'MALE',
      '321 Collins Ave',
      'Miami Beach',
      'FL',
      '33139',
      'US',
      '+1-305-555-2001',
      'robert.johnson@example.com',
      'FL-MCD-222222222',
      'FL',
      '{"florida": {"program": "SMMC_LTC", "evv_aggregator": "HHAEEXCHANGE", "mco": "Sunshine Health"}}'::jsonb,
      'ACTIVE',
      $3, $3
    ) RETURNING id, first_name, last_name, state
  `, [flOrg['id'], flBranch['id'], systemUserId]);

  const flClient1 = flClient1Result.rows[0] as Record<string, unknown>;
  result.clients.push({ 
    id: flClient1['id'] as string, 
    name: `${flClient1['first_name'] as string} ${flClient1['last_name'] as string}`, 
    state: flClient1['state'] as string
  });

  // ============================================================================
  // 5. Caregivers
  // ============================================================================

  console.log('  Creating caregivers...');

  const txCaregiverResult = await db.query(`
    INSERT INTO caregivers (
      id, organization_id, branch_id,
      first_name, last_name, employee_id, email,
      phone, date_of_birth,
      background_screening_status, background_screening_expires,
      credentials, certifications,
      status,
      created_by, updated_by
    ) VALUES (
      gen_random_uuid(),
      $1,
      $2,
      'Sarah',
      'Williams',
      'CG-TX-001',
      'sarah.williams@lonestarhhc.example.com',
      '+1-512-555-3001',
      '1990-05-12',
      'CLEARED',
      CURRENT_DATE + INTERVAL '365 days',
      '["CNA", "MEDICATION_AIDE"]'::jsonb,
      '["CPR", "FIRST_AID"]'::jsonb,
      'ACTIVE',
      $3, $3
    ) RETURNING id, first_name, last_name
  `, [txOrg['id'], txBranch['id'], systemUserId]);

  const txCaregiver = txCaregiverResult.rows[0] as Record<string, unknown>;
  result.caregivers.push({ 
    id: txCaregiver['id'] as string, 
    name: `${txCaregiver['first_name'] as string} ${txCaregiver['last_name'] as string}`
  });

  const flCaregiverResult = await db.query(`
    INSERT INTO caregivers (
      id, organization_id, branch_id,
      first_name, last_name, employee_id, email,
      phone, date_of_birth,
      background_screening_status, background_screening_expires,
      credentials, certifications,
      status,
      created_by, updated_by
    ) VALUES (
      gen_random_uuid(),
      $1,
      $2,
      'Michael',
      'Davis',
      'CG-FL-001',
      'michael.davis@sunshinecare.example.com',
      '+1-305-555-4001',
      '1988-09-30',
      'CLEARED',
      CURRENT_DATE + INTERVAL '1825 days',
      '["HHA", "PCA"]'::jsonb,
      '["CPR", "ALZHEIMERS_CARE"]'::jsonb,
      'ACTIVE',
      $3, $3
    ) RETURNING id, first_name, last_name
  `, [flOrg['id'], flBranch['id'], systemUserId]);

  const flCaregiver = flCaregiverResult.rows[0] as Record<string, unknown>;
  result.caregivers.push({ 
    id: flCaregiver['id'] as string, 
    name: `${flCaregiver['first_name'] as string} ${flCaregiver['last_name'] as string}`
  });

  // ============================================================================
  // 6. Visits
  // ============================================================================

  console.log('  Creating visits...');

  // Texas Visit
  const txVisitResult = await db.query(`
    INSERT INTO visits (
      id, organization_id, branch_id, client_id, assigned_to,
      service_date, scheduled_start_time, scheduled_end_time, scheduled_duration,
      service_type_code, service_type_name,
      service_address_line1, service_address_city, service_address_state, 
      service_address_postal_code, service_address_country,
      service_address_latitude, service_address_longitude,
      status, requirements,
      created_by, updated_by
    ) VALUES (
      gen_random_uuid(),
      $1, $2, $3, $4,
      CURRENT_DATE,
      '09:00',
      '11:00',
      120,
      'PAS',
      'Personal Assistance Services',
      '789 Guadalupe St',
      'Austin',
      'TX',
      '78701',
      'US',
      30.2711,
      -97.7437,
      'SCHEDULED',
      '{"requiredSkills": ["PERSONAL_CARE"], "requiredCertifications": ["CPR"]}'::jsonb,
      $5, $5
    ) RETURNING id
  `, [txOrg['id'], txBranch['id'], txClient1['id'], txCaregiver['id'], systemUserId]);

  const txVisit = txVisitResult.rows[0] as Record<string, unknown>;
  const txClientId = txClient1['id'] as string;
  const txCaregiverId = txCaregiver['id'] as string;
  result.visits.push({ 
    id: txVisit['id'] as string, 
    clientId: txClientId, 
    caregiverId: txCaregiverId,
    state: 'TX'
  });

  // Florida Visit
  const flVisitResult = await db.query(`
    INSERT INTO visits (
      id, organization_id, branch_id, client_id, assigned_to,
      service_date, scheduled_start_time, scheduled_end_time, scheduled_duration,
      service_type_code, service_type_name,
      service_address_line1, service_address_city, service_address_state,
      service_address_postal_code, service_address_country,
      service_address_latitude, service_address_longitude,
      status, requirements,
      created_by, updated_by
    ) VALUES (
      gen_random_uuid(),
      $1, $2, $3, $4,
      CURRENT_DATE,
      '14:00',
      '16:00',
      120,
      'HHA',
      'Home Health Aide Services',
      '321 Collins Ave',
      'Miami Beach',
      'FL',
      '33139',
      'US',
      25.7907,
      -80.1301,
      'SCHEDULED',
      '{"requiredSkills": ["HOME_HEALTH_AIDE"], "requiredCertifications": ["CPR"]}'::jsonb,
      $5, $5
    ) RETURNING id
  `, [flOrg['id'], flBranch['id'], flClient1['id'], flCaregiver['id'], systemUserId]);

  const flVisit = flVisitResult.rows[0] as Record<string, unknown>;
  const flClientId = flClient1['id'] as string;
  const flCaregiverId = flCaregiver['id'] as string;
  result.visits.push({ 
    id: flVisit['id'] as string, 
    clientId: flClientId, 
    caregiverId: flCaregiverId,
    state: 'FL'
  });

  console.log('✅ TX/FL EVV seed data complete');
  console.log('');
  console.log('Summary:');
  console.log(`  Organizations: ${result.organizations.length}`);
  console.log(`  Branches: ${result.branches.length}`);
  console.log(`  Clients: ${result.clients.length}`);
  console.log(`  Caregivers: ${result.caregivers.length}`);
  console.log(`  Visits: ${result.visits.length}`);
  console.log('');
  console.log('Texas Organization ID:', txOrg['id']);
  console.log('Florida Organization ID:', flOrg['id']);
  console.log('');

  return result;
}

// Allow running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const { getDatabase } = await import('../src/db/connection.js');
  const db = getDatabase();
  
  try {
    await seedTXFLComplete(db);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}
