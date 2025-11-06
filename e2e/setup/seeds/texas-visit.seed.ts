import { Database } from '../../../packages/core/src/db/connection.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Seed Data: Texas Visit with EVV Requirements
 *
 * Creates test data for Texas-specific EVV compliance testing:
 * - Texas branch
 * - Client in Texas with geofence
 * - Caregiver with EMR clearance
 * - Visit configured for HHAeXchange
 * - EVV configuration for Texas
 */
export async function seedDatabase(db: Database): Promise<void> {
  console.log('Seeding Texas visit test data...');

  const orgId = 'org-e2e-001';
  const branchId = 'branch-tx-001';
  const clientId = 'client-tx-001';
  const caregiverId = 'caregiver-tx-001';
  const visitId = 'visit-tx-001';

  // Create Texas branch
  await db.query(
    `INSERT INTO branches (id, organization_id, name, state, address, evv_config, status, created_at, created_by, updated_at, updated_by, version)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, NOW(), $8, 1)
     ON CONFLICT (id) DO NOTHING`,
    [
      branchId,
      orgId,
      'Texas Branch',
      'TX',
      JSON.stringify({
        street: '100 Congress Ave',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
      }),
      JSON.stringify({
        aggregator: 'HHAEEXCHANGE',
        apiEndpoint: 'https://api.hhaeexchange.com/evv/tx',
        geoPerimeterTolerance: 50, // 50 meters (Texas requirement)
        gracePeriodMinutes: 10, // 10-minute grace period for clock-in
        requiresGPSMobile: true,
        requiresVMURForAmendments: true,
      }),
      'ACTIVE',
      'system',
    ]
  );

  // Create Texas client
  await db.query(
    `INSERT INTO clients (
      id, organization_id, branch_id, first_name, last_name, date_of_birth,
      primary_address, medicaid_number, state_program, status,
      created_at, created_by, updated_at, updated_by, version
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, NOW(), $11, 1)
    ON CONFLICT (id) DO NOTHING`,
    [
      clientId,
      orgId,
      branchId,
      'Maria',
      'Rodriguez',
      '1945-03-15',
      JSON.stringify({
        street: '789 Riverside Dr',
        city: 'Austin',
        state: 'TX',
        zip: '78704',
        latitude: 30.2500,
        longitude: -97.7600,
        geofence_radius: 100,
      }),
      'TX-MCD-123456',
      'STAR+PLUS',
      'ACTIVE',
      'system',
    ]
  );

  // Create caregiver with Texas EMR clearance
  await db.query(
    `INSERT INTO caregivers (
      id, organization_id, branch_id, first_name, last_name, employee_number,
      credentials, background_checks, compliance_status, status,
      created_at, created_by, updated_at, updated_by, version
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, NOW(), $11, 1)
    ON CONFLICT (id) DO NOTHING`,
    [
      caregiverId,
      orgId,
      branchId,
      'Carlos',
      'Martinez',
      'CG-TX-001',
      JSON.stringify([
        {
          type: 'CPR',
          number: 'CPR-TX-789',
          issueDate: '2024-06-01',
          expirationDate: '2026-06-01',
          issuingAuthority: 'American Heart Association',
          status: 'VALID',
        },
      ]),
      JSON.stringify({
        emr_check: {
          status: 'CLEARED',
          clearanceDate: '2024-06-01',
          expirationDate: '2029-06-01', // Texas EMR valid for 5 years
          checkType: 'EMPLOYEE_MISCONDUCT_REGISTRY',
          verificationNumber: 'EMR-TX-987654',
          agency: 'Texas Health and Human Services',
          citation: '26 TAC §558.353', // Texas statute
        },
        criminal_background: {
          status: 'CLEARED',
          clearanceDate: '2024-06-01',
          expirationDate: '2026-06-01',
          checkType: 'FBI_FINGERPRINT',
        },
      }),
      'COMPLIANT',
      'ACTIVE',
      'system',
    ]
  );

  // Create visit
  await db.query(
    `INSERT INTO visits (
      id, organization_id, branch_id, client_id, caregiver_id,
      service_type, scheduled_date, scheduled_time, duration_hours,
      status, tasks, evv_requirements, created_at, created_by, updated_at, updated_by, version
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, NOW(), $13, 1)
    ON CONFLICT (id) DO NOTHING`,
    [
      visitId,
      orgId,
      branchId,
      clientId,
      caregiverId,
      'PERSONAL_CARE',
      '2025-01-20',
      '10:00:00',
      2,
      'SCHEDULED',
      JSON.stringify([
        {
          id: uuidv4(),
          name: 'Personal care assistance',
          critical: true,
          completed: false,
        },
        {
          id: uuidv4(),
          name: 'Medication reminder',
          critical: true,
          completed: false,
        },
      ]),
      JSON.stringify({
        state: 'TX',
        aggregator: 'HHAEEXCHANGE',
        requiresGPS: true,
        requiresSignature: false, // Texas doesn't always require signature
        gpsAccuracyThreshold: 50, // meters
        vmurRequired: false, // Unless amendment needed
      }),
      'system',
    ]
  );

  console.log('✅ Texas visit seed data created');
}
