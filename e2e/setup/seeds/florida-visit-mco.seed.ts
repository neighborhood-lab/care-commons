import { Database } from '../../../packages/core/src/db/connection.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Seed Data: Florida MCO Visit
 *
 * Creates test data for Florida MCO-specific requirements:
 * - Florida branch with MCO configuration
 * - MCO client (Managed Care Organization)
 * - Caregiver with Level 2 background screening
 * - Visit requiring client signature
 */
export async function seedDatabase(db: Database): Promise<void> {
  console.log('Seeding Florida MCO visit test data...');

  const orgId = 'org-e2e-001';
  const branchId = 'branch-fl-001';
  const clientId = 'client-fl-mco-001';
  const caregiverId = 'caregiver-fl-001';
  const visitId = 'visit-fl-mco-001';

  // Create Florida branch
  await db.query(
    `INSERT INTO branches (id, organization_id, name, state, address, status, created_at, created_by, updated_at, updated_by, version)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, NOW(), $7, 1)
     ON CONFLICT (id) DO NOTHING`,
    [
      branchId,
      orgId,
      'Florida Branch',
      'FL',
      JSON.stringify({
        street: '200 Orange Ave',
        city: 'Orlando',
        state: 'FL',
        zip: '32801',
      }),
      'ACTIVE',
      'system',
    ]
  );

  // Create Florida MCO client
  await db.query(
    `INSERT INTO clients (
      id, organization_id, branch_id, first_name, last_name, date_of_birth,
      primary_address, medicaid_number, mco_name, state_program, status,
      created_at, created_by, updated_at, updated_by, version
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12, NOW(), $12, 1)
    ON CONFLICT (id) DO NOTHING`,
    [
      clientId,
      orgId,
      branchId,
      'Robert',
      'Johnson',
      '1940-08-22',
      JSON.stringify({
        street: '555 Lake St',
        city: 'Orlando',
        state: 'FL',
        zip: '32803',
        latitude: 28.5383,
        longitude: -81.3792,
        geofence_radius: 150,
      }),
      'FL-MCD-789012',
      'Sunshine Health', // MCO name
      'MANAGED_MEDICAL_ASSISTANCE',
      'ACTIVE',
      'system',
    ]
  );

  // Create caregiver with Level 2 screening
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
      'Linda',
      'Thompson',
      'CG-FL-001',
      JSON.stringify([
        {
          type: 'HHA',
          number: 'HHA-FL-12345',
          issueDate: '2023-01-15',
          expirationDate: '2025-01-15',
          issuingAuthority: 'Florida Department of Health',
          status: 'VALID',
        },
      ]),
      JSON.stringify({
        level_2_screening: {
          status: 'CLEARED',
          clearanceDate: '2024-03-01',
          expirationDate: '2029-03-01', // Valid for 5 years
          screeningNumber: 'L2-FL-654321',
          agency: 'Florida Department of Children and Families',
          citation: 'F.S. §435.04', // Florida Statute
        },
        ahca_registry_check: {
          status: 'CLEARED',
          checkDate: '2024-03-01',
          registryType: 'AHCA_EXCLUSION_LIST',
        },
      }),
      'COMPLIANT',
      'ACTIVE',
      'system',
    ]
  );

  // Create MCO visit requiring signature
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
      'COMPANIONSHIP',
      '2025-01-22',
      '14:00:00',
      3,
      'SCHEDULED',
      JSON.stringify([
        {
          id: uuidv4(),
          name: 'Companionship and supervision',
          critical: true,
          completed: false,
        },
        {
          id: uuidv4(),
          name: 'Light housekeeping',
          critical: false,
          completed: false,
        },
      ]),
      JSON.stringify({
        state: 'FL',
        mco: 'SUNSHINE_HEALTH',
        requiresGPS: true,
        requiresClientSignature: true, // MCO requirement
        requiresLevel2Screening: true,
        gpsAccuracyThreshold: 100,
      }),
      'system',
    ]
  );

  console.log('✅ Florida MCO visit seed data created');
}
