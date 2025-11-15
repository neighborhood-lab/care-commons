/**
 * Texas EVV Compliance Demo Scenarios Seed
 *
 * Creates three demo scenarios showcasing Texas HHSC EVV compliance features:
 * 1. Compliant Visit - Perfect clock-in/out with full compliance
 * 2. Geofence Warning - Barely outside range but within GPS accuracy allowance
 * 3. VMUR Required - Forgot to clock out, needs correction workflow
 *
 * This seed is used for demonstrating Texas-specific EVV features including:
 * - Geofence validation (100m base + GPS accuracy)
 * - Six required EVV elements
 * - 10-minute grace period
 * - HHAeXchange aggregator integration (mock)
 * - VMUR (Visit Maintenance Unlock Request) workflow
 */

import { Database, getDatabase } from '../src/db/connection.js';
import { v4 as uuidv4 } from 'uuid';

interface TexasEVVScenarioIds {
  organizationId: string;
  branchId: string;

  // Scenario 1: Compliant Visit
  compliantClientId: string;
  compliantCaregiverId: string;
  compliantVisitId: string;
  compliantEVVRecordId: string;

  // Scenario 2: Geofence Warning
  warningClientId: string;
  warningCaregiverId: string;
  warningVisitId: string;
  warningEVVRecordId: string;

  // Scenario 3: VMUR Required
  vmurClientId: string;
  vmurCaregiverId: string;
  vmurVisitId: string;
  vmurEVVRecordId: string;
  vmurId: string;
}

export async function seedTexasEVVScenarios(): Promise<TexasEVVScenarioIds> {
  const db = await getDatabase();

  console.log('🔵 Seeding Texas EVV Compliance Demo Scenarios...');

  // Organization and branch (shared across scenarios)
  const organizationId = 'org-texas-evv-demo';
  const branchId = 'branch-texas-evv-demo';
  const adminUserId = 'user-texas-evv-admin';

  // Scenario 1: Compliant Visit
  const compliantClientId = 'client-tx-compliant';
  const compliantCaregiverId = 'caregiver-tx-compliant';
  const compliantVisitId = 'visit-tx-compliant';
  const compliantEVVRecordId = 'evv-tx-compliant';

  // Scenario 2: Geofence Warning
  const warningClientId = 'client-tx-warning';
  const warningCaregiverId = 'caregiver-tx-warning';
  const warningVisitId = 'visit-tx-warning';
  const warningEVVRecordId = 'evv-tx-warning';

  // Scenario 3: VMUR Required
  const vmurClientId = 'client-tx-vmur';
  const vmurCaregiverId = 'caregiver-tx-vmur';
  const vmurVisitId = 'visit-tx-vmur';
  const vmurEVVRecordId = 'evv-tx-vmur';
  const vmurId = 'vmur-tx-demo-001';

  try {
    // Create organization
    await createOrganization(db, organizationId);

    // Create branch
    await createBranch(db, organizationId, branchId);

    // Create admin user for VMUR approval
    await createAdminUser(db, organizationId, branchId, adminUserId);

    // Create Texas EVV configuration
    await createTexasEVVConfig(db, organizationId);

    // ========================================================================
    // SCENARIO 1: Compliant Visit (Perfect Clock-In/Out)
    // ========================================================================
    console.log('  📍 Scenario 1: Creating compliant visit...');
    await createScenario1CompliantVisit(
      db,
      organizationId,
      branchId,
      compliantClientId,
      compliantCaregiverId,
      compliantVisitId,
      compliantEVVRecordId
    );

    // ========================================================================
    // SCENARIO 2: Geofence Warning (Barely Outside Range)
    // ========================================================================
    console.log('  ⚠️  Scenario 2: Creating geofence warning visit...');
    await createScenario2GeofenceWarning(
      db,
      organizationId,
      branchId,
      warningClientId,
      warningCaregiverId,
      warningVisitId,
      warningEVVRecordId
    );

    // ========================================================================
    // SCENARIO 3: VMUR Required (Forgot to Clock Out)
    // ========================================================================
    console.log('  🔧 Scenario 3: Creating VMUR-required visit...');
    await createScenario3VMURRequired(
      db,
      organizationId,
      branchId,
      vmurClientId,
      vmurCaregiverId,
      vmurVisitId,
      vmurEVVRecordId,
      vmurId,
      adminUserId
    );

    console.log('✅ Texas EVV Compliance Demo Scenarios seeded successfully!');
    console.log('');
    console.log('Demo Scenarios Created:');
    console.log('  1. Compliant Visit (client:', compliantClientId, ')');
    console.log('  2. Geofence Warning (client:', warningClientId, ')');
    console.log('  3. VMUR Required (client:', vmurClientId, ')');
    console.log('');

    return {
      organizationId,
      branchId,
      compliantClientId,
      compliantCaregiverId,
      compliantVisitId,
      compliantEVVRecordId,
      warningClientId,
      warningCaregiverId,
      warningVisitId,
      warningEVVRecordId,
      vmurClientId,
      vmurCaregiverId,
      vmurVisitId,
      vmurEVVRecordId,
      vmurId,
    };
  } catch (error) {
    console.error('❌ Failed to seed Texas EVV scenarios:', error);
    throw error;
  }
}

// ============================================================================
// Organization and Branch Setup
// ============================================================================

async function createOrganization(db: Database, orgId: string): Promise<void> {
  await db.query(
    `INSERT INTO organizations (
      id, name, slug, type, settings, status,
      created_at, created_by, updated_at, updated_by, version
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'system', NOW(), 'system', 1)
    ON CONFLICT (id) DO NOTHING`,
    [
      orgId,
      'Texas EVV Demo Agency',
      'texas-evv-demo',
      'AGENCY',
      JSON.stringify({
        demo_data: true,
        demo_scenario: 'texas_evv_compliance',
      }),
      'ACTIVE',
    ]
  );
}

async function createBranch(db: Database, orgId: string, branchId: string): Promise<void> {
  await db.query(
    `INSERT INTO branches (
      id, organization_id, name, address, settings, status,
      created_at, created_by, updated_at, updated_by, version
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'system', NOW(), 'system', 1)
    ON CONFLICT (id) DO NOTHING`,
    [
      branchId,
      orgId,
      'Austin EVV Demo Branch',
      JSON.stringify({
        line1: '100 Congress Ave',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'USA',
      }),
      JSON.stringify({
        demo_data: true,
        state: 'TX',
      }),
      'ACTIVE',
    ]
  );
}

async function createAdminUser(
  db: Database,
  orgId: string,
  branchId: string,
  userId: string
): Promise<void> {
  await db.query(
    `INSERT INTO users (
      id, email, password_hash, first_name, last_name,
      organization_id, branch_id, roles, status,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING`,
    [
      userId,
      'admin@texas-evv-demo.example',
      'hashed-password', // In production, use proper hashing
      'Demo',
      'Administrator',
      orgId,
      branchId,
      JSON.stringify(['COORDINATOR', 'BRANCH_ADMIN']),
      'ACTIVE',
    ]
  );
}

async function createTexasEVVConfig(db: Database, orgId: string): Promise<void> {
  await db.query(
    `INSERT INTO evv_state_config (
      id, organization_id, state_code, aggregator_type, aggregator_endpoint,
      medicaid_program, agency_npi, config_settings, is_active,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(), $1, 'TX', 'HHAEEXCHANGE',
      'https://sandbox.hhaexchange.com/api/evv',
      'STAR+PLUS', '1234567890',
      $2::jsonb, true, NOW(), NOW()
    )
    ON CONFLICT (organization_id, state_code) DO NOTHING`,
    [
      orgId,
      JSON.stringify({
        geofence_base_radius: 100,
        max_gps_accuracy: 100,
        grace_period_minutes: 10,
        requires_vmur: true,
        demo_mode: true,
      }),
    ]
  );
}

// ============================================================================
// SCENARIO 1: Compliant Visit
// ============================================================================

async function createScenario1CompliantVisit(
  db: Database,
  orgId: string,
  branchId: string,
  clientId: string,
  caregiverId: string,
  visitId: string,
  evvRecordId: string
): Promise<void> {
  // Client - perfect location for geofence
  await db.query(
    `INSERT INTO clients (
      id, organization_id, branch_id, first_name, last_name,
      date_of_birth, primary_address, medicaid_number, state_program,
      status, created_at, created_by, updated_at, updated_by, version, is_demo_data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 'system', NOW(), 'system', 1, true)
    ON CONFLICT (id) DO NOTHING`,
    [
      clientId,
      orgId,
      branchId,
      'Maria',
      'Johnson',
      '1950-05-15',
      JSON.stringify({
        line1: '500 E 7th St',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'USA',
        latitude: 30.2672, // Perfect location
        longitude: -97.7431,
        geofence_radius: 100,
      }),
      'TX-MCD-COMP-001',
      'STAR+PLUS',
      'ACTIVE',
    ]
  );

  // Caregiver
  await db.query(
    `INSERT INTO caregivers (
      id, organization_id, branch_id, first_name, last_name,
      employee_number, national_provider_id, credentials, status,
      created_at, created_by, updated_at, updated_by, version, is_demo_data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 'system', NOW(), 'system', 1, true)
    ON CONFLICT (id) DO NOTHING`,
    [
      caregiverId,
      orgId,
      branchId,
      'Sarah',
      'Williams',
      'EMP-COMP-001',
      '1234567890',
      JSON.stringify(['HHA', 'PCA']),
      'ACTIVE',
    ]
  );

  // Visit
  const visitDate = new Date();
  visitDate.setDate(visitDate.getDate() - 1); // Yesterday
  const scheduledStart = new Date(visitDate);
  scheduledStart.setHours(9, 0, 0, 0);
  const scheduledEnd = new Date(visitDate);
  scheduledEnd.setHours(13, 0, 0, 0);

  await db.query(
    `INSERT INTO visits (
      id, organization_id, branch_id, client_id, caregiver_id,
      service_type_code, service_type_name, scheduled_start, scheduled_end,
      status, created_at, created_by, updated_at, updated_by, version, is_demo_data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 'system', NOW(), 'system', 1, true)
    ON CONFLICT (id) DO NOTHING`,
    [
      visitId,
      orgId,
      branchId,
      clientId,
      caregiverId,
      'T1019',
      'Personal Care Services',
      scheduledStart,
      scheduledEnd,
      'COMPLETED',
    ]
  );

  // EVV Record - Compliant
  await db.query(
    `INSERT INTO evv_records (
      id, visit_id, organization_id, branch_id, client_id, caregiver_id,
      service_type_code, service_type_name, client_name, client_medicaid_id,
      caregiver_name, caregiver_employee_id, caregiver_national_provider_id,
      service_date, service_address, clock_in_time, clock_out_time, total_duration,
      clock_in_verification, clock_out_verification, record_status, verification_level,
      compliance_flags, integrity_hash, integrity_checksum,
      recorded_at, recorded_by, sync_metadata,
      created_at, updated_at, is_demo_data
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
      NOW(), NOW(), true
    )
    ON CONFLICT (id) DO NOTHING`,
    [
      evvRecordId,
      visitId,
      orgId,
      branchId,
      clientId,
      caregiverId,
      'T1019',
      'Personal Care Services',
      'Maria Johnson',
      'TX-MCD-COMP-001',
      'Sarah Williams',
      'EMP-COMP-001',
      '1234567890',
      visitDate,
      JSON.stringify({
        line1: '500 E 7th St',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'USA',
        latitude: 30.2672,
        longitude: -97.7431,
        geofence_radius: 100,
      }),
      scheduledStart, // Perfect timing
      scheduledEnd,
      240, // 4 hours
      JSON.stringify({
        method: 'GPS',
        latitude: 30.2672, // Same as address - perfect!
        longitude: -97.7431,
        accuracy: 15, // Good GPS accuracy
        timestamp: scheduledStart,
        verified: true,
        device_id: 'device-compliant-001',
      }),
      JSON.stringify({
        method: 'GPS',
        latitude: 30.2672,
        longitude: -97.7431,
        accuracy: 18,
        timestamp: scheduledEnd,
        verified: true,
        device_id: 'device-compliant-001',
      }),
      'COMPLETE',
      'FULL',
      JSON.stringify(['COMPLIANT']),
      'integrity-hash-compliant',
      'checksum-compliant',
      scheduledEnd,
      caregiverId,
      JSON.stringify({
        sync_id: 'sync-compliant-001',
        synced_at: scheduledEnd,
        device_id: 'device-compliant-001',
      }),
    ]
  );
}

// ============================================================================
// SCENARIO 2: Geofence Warning
// ============================================================================

async function createScenario2GeofenceWarning(
  db: Database,
  orgId: string,
  branchId: string,
  clientId: string,
  caregiverId: string,
  visitId: string,
  evvRecordId: string
): Promise<void> {
  // Client
  await db.query(
    `INSERT INTO clients (
      id, organization_id, branch_id, first_name, last_name,
      date_of_birth, primary_address, medicaid_number, state_program,
      status, created_at, created_by, updated_at, updated_by, version, is_demo_data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 'system', NOW(), 'system', 1, true)
    ON CONFLICT (id) DO NOTHING`,
    [
      clientId,
      orgId,
      branchId,
      'Robert',
      'Martinez',
      '1948-08-22',
      JSON.stringify({
        line1: '1200 Barton Springs Rd',
        city: 'Austin',
        state: 'TX',
        postalCode: '78704',
        country: 'USA',
        latitude: 30.2640, // Expected location
        longitude: -97.7710,
        geofence_radius: 100,
      }),
      'TX-MCD-WARN-002',
      'STAR+PLUS',
      'ACTIVE',
    ]
  );

  // Caregiver
  await db.query(
    `INSERT INTO caregivers (
      id, organization_id, branch_id, first_name, last_name,
      employee_number, national_provider_id, credentials, status,
      created_at, created_by, updated_at, updated_by, version, is_demo_data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 'system', NOW(), 'system', 1, true)
    ON CONFLICT (id) DO NOTHING`,
    [
      caregiverId,
      orgId,
      branchId,
      'Michael',
      'Davis',
      'EMP-WARN-002',
      '2345678901',
      JSON.stringify(['HHA', 'PCA']),
      'ACTIVE',
    ]
  );

  // Visit
  const visitDate = new Date();
  visitDate.setDate(visitDate.getDate() - 1);
  const scheduledStart = new Date(visitDate);
  scheduledStart.setHours(14, 0, 0, 0);
  const scheduledEnd = new Date(visitDate);
  scheduledEnd.setHours(16, 30, 0, 0);

  await db.query(
    `INSERT INTO visits (
      id, organization_id, branch_id, client_id, caregiver_id,
      service_type_code, service_type_name, scheduled_start, scheduled_end,
      status, created_at, created_by, updated_at, updated_by, version, is_demo_data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 'system', NOW(), 'system', 1, true)
    ON CONFLICT (id) DO NOTHING`,
    [
      visitId,
      orgId,
      branchId,
      clientId,
      caregiverId,
      'T1019',
      'Personal Care Services',
      scheduledStart,
      scheduledEnd,
      'COMPLETED',
    ]
  );

  // EVV Record - Geofence Warning
  // Location is 120m away with 30m GPS accuracy
  // Effective radius = 100m + 30m = 130m
  // 120m < 130m = WARNING (acceptable)
  await db.query(
    `INSERT INTO evv_records (
      id, visit_id, organization_id, branch_id, client_id, caregiver_id,
      service_type_code, service_type_name, client_name, client_medicaid_id,
      caregiver_name, caregiver_employee_id, caregiver_national_provider_id,
      service_date, service_address, clock_in_time, clock_out_time, total_duration,
      clock_in_verification, clock_out_verification, record_status, verification_level,
      compliance_flags, integrity_hash, integrity_checksum,
      recorded_at, recorded_by, sync_metadata,
      created_at, updated_at, is_demo_data
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
      NOW(), NOW(), true
    )
    ON CONFLICT (id) DO NOTHING`,
    [
      evvRecordId,
      visitId,
      orgId,
      branchId,
      clientId,
      caregiverId,
      'T1019',
      'Personal Care Services',
      'Robert Martinez',
      'TX-MCD-WARN-002',
      'Michael Davis',
      'EMP-WARN-002',
      '2345678901',
      visitDate,
      JSON.stringify({
        line1: '1200 Barton Springs Rd',
        city: 'Austin',
        state: 'TX',
        postalCode: '78704',
        country: 'USA',
        latitude: 30.2640,
        longitude: -97.7710,
        geofence_radius: 100,
      }),
      scheduledStart,
      scheduledEnd,
      150, // 2.5 hours
      JSON.stringify({
        method: 'GPS',
        latitude: 30.2651, // ~120m north of expected
        longitude: -97.7710,
        accuracy: 30, // GPS accuracy provides allowance
        timestamp: scheduledStart,
        verified: true,
        device_id: 'device-warning-002',
      }),
      JSON.stringify({
        method: 'GPS',
        latitude: 30.2640, // Back at correct location
        longitude: -97.7710,
        accuracy: 20,
        timestamp: scheduledEnd,
        verified: true,
        device_id: 'device-warning-002',
      }),
      'COMPLETE',
      'FULL',
      JSON.stringify(['GEOFENCE_WARNING']),
      'integrity-hash-warning',
      'checksum-warning',
      scheduledEnd,
      caregiverId,
      JSON.stringify({
        sync_id: 'sync-warning-002',
        synced_at: scheduledEnd,
        device_id: 'device-warning-002',
      }),
    ]
  );
}

// ============================================================================
// SCENARIO 3: VMUR Required
// ============================================================================

async function createScenario3VMURRequired(
  db: Database,
  orgId: string,
  branchId: string,
  clientId: string,
  caregiverId: string,
  visitId: string,
  evvRecordId: string,
  vmurId: string,
  adminUserId: string
): Promise<void> {
  // Client
  await db.query(
    `INSERT INTO clients (
      id, organization_id, branch_id, first_name, last_name,
      date_of_birth, primary_address, medicaid_number, state_program,
      status, created_at, created_by, updated_at, updated_by, version, is_demo_data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 'system', NOW(), 'system', 1, true)
    ON CONFLICT (id) DO NOTHING`,
    [
      clientId,
      orgId,
      branchId,
      'Linda',
      'Thompson',
      '1952-12-10',
      JSON.stringify({
        line1: '2900 Medical Arts St',
        city: 'Austin',
        state: 'TX',
        postalCode: '78705',
        country: 'USA',
        latitude: 30.2830,
        longitude: -97.7440,
        geofence_radius: 100,
      }),
      'TX-MCD-VMUR-003',
      'STAR+PLUS',
      'ACTIVE',
    ]
  );

  // Caregiver
  await db.query(
    `INSERT INTO caregivers (
      id, organization_id, branch_id, first_name, last_name,
      employee_number, national_provider_id, credentials, status,
      created_at, created_by, updated_at, updated_by, version, is_demo_data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 'system', NOW(), 'system', 1, true)
    ON CONFLICT (id) DO NOTHING`,
    [
      caregiverId,
      orgId,
      branchId,
      'Jennifer',
      'Garcia',
      'EMP-VMUR-003',
      '3456789012',
      JSON.stringify(['HHA', 'PCA']),
      'ACTIVE',
    ]
  );

  // Visit - 35 days ago (> 30 days, requires VMUR)
  const visitDate = new Date();
  visitDate.setDate(visitDate.getDate() - 35); // 35 days ago
  const scheduledStart = new Date(visitDate);
  scheduledStart.setHours(10, 0, 0, 0);
  const scheduledEnd = new Date(visitDate);
  scheduledEnd.setHours(14, 0, 0, 0);

  await db.query(
    `INSERT INTO visits (
      id, organization_id, branch_id, client_id, caregiver_id,
      service_type_code, service_type_name, scheduled_start, scheduled_end,
      status, created_at, created_by, updated_at, updated_by, version, is_demo_data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 'system', NOW(), 'system', 1, true)
    ON CONFLICT (id) DO NOTHING`,
    [
      visitId,
      orgId,
      branchId,
      clientId,
      caregiverId,
      'T1019',
      'Personal Care Services',
      scheduledStart,
      scheduledEnd,
      'COMPLETED',
    ]
  );

  // EVV Record - Missing clock-out (forgot to clock out)
  await db.query(
    `INSERT INTO evv_records (
      id, visit_id, organization_id, branch_id, client_id, caregiver_id,
      service_type_code, service_type_name, client_name, client_medicaid_id,
      caregiver_name, caregiver_employee_id, caregiver_national_provider_id,
      service_date, service_address, clock_in_time, clock_out_time, total_duration,
      clock_in_verification, clock_out_verification, record_status, verification_level,
      compliance_flags, integrity_hash, integrity_checksum,
      recorded_at, recorded_by, sync_metadata,
      created_at, updated_at, is_demo_data
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
      NOW(), NOW(), true
    )
    ON CONFLICT (id) DO NOTHING`,
    [
      evvRecordId,
      visitId,
      orgId,
      branchId,
      clientId,
      caregiverId,
      'T1019',
      'Personal Care Services',
      'Linda Thompson',
      'TX-MCD-VMUR-003',
      'Jennifer Garcia',
      'EMP-VMUR-003',
      '3456789012',
      visitDate,
      JSON.stringify({
        line1: '2900 Medical Arts St',
        city: 'Austin',
        state: 'TX',
        postalCode: '78705',
        country: 'USA',
        latitude: 30.2830,
        longitude: -97.7440,
        geofence_radius: 100,
      }),
      scheduledStart,
      null, // MISSING CLOCK-OUT!
      null, // No duration
      JSON.stringify({
        method: 'GPS',
        latitude: 30.2830, // Correct location
        longitude: -97.7440,
        accuracy: 12,
        timestamp: scheduledStart,
        verified: true,
        device_id: 'device-vmur-003',
      }),
      null, // No clock-out verification
      'PENDING', // Still pending due to missing clock-out
      'FULL',
      JSON.stringify(['INCOMPLETE_VISIT']),
      'integrity-hash-vmur',
      'checksum-vmur',
      scheduledStart, // Recorded at clock-in
      caregiverId,
      JSON.stringify({
        sync_id: 'sync-vmur-003',
        synced_at: scheduledStart,
        device_id: 'device-vmur-003',
      }),
    ]
  );

  // Create VMUR for this visit
  const vmurRequestedAt = new Date();
  vmurRequestedAt.setDate(vmurRequestedAt.getDate() - 2); // Requested 2 days ago
  const expiresAt = new Date(vmurRequestedAt);
  expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 28 days from now

  await db.query(
    `INSERT INTO texas_vmur (
      id, evv_record_id, visit_id, requested_by, requested_by_name,
      requested_at, request_reason, request_reason_details,
      approval_status, original_data, corrected_data, changes_summary,
      submitted_to_aggregator, expires_at, compliance_notes,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING`,
    [
      vmurId,
      evvRecordId,
      visitId,
      caregiverId,
      'Jennifer Garcia',
      vmurRequestedAt,
      'FORGOT_TO_CLOCK',
      'Caregiver forgot to clock out after completing the visit. Client confirmed visit ended at scheduled time.',
      'PENDING', // Awaiting supervisor approval
      JSON.stringify({
        clockInTime: scheduledStart,
        clockOutTime: null,
        clockInLatitude: 30.2830,
        clockInLongitude: -97.7440,
        clockOutLatitude: null,
        clockOutLongitude: null,
        clockMethod: 'MOBILE_GPS',
        totalDuration: null,
      }),
      JSON.stringify({
        clockInTime: scheduledStart,
        clockOutTime: scheduledEnd,
        clockInLatitude: 30.2830,
        clockInLongitude: -97.7440,
        clockOutLatitude: 30.2830,
        clockOutLongitude: -97.7440,
        clockMethod: 'MOBILE_GPS',
        totalDuration: 240,
      }),
      JSON.stringify([
        'Added missing clock-out time: ' + scheduledEnd.toISOString(),
        'Added clock-out location: (30.2830, -97.7440)',
        'Calculated duration: 240 minutes',
      ]),
      false,
      expiresAt,
      'VMUR created for missing clock-out. Awaiting coordinator approval.',
    ]
  );
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTexasEVVScenarios()
    .then(() => {
      console.log('✅ Seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}
