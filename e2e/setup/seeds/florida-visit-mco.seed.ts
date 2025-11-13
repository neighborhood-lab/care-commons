import { Database } from '../../../packages/core/src/db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function seedDatabase(db: Database): Promise<void> {
  console.log('Seeding Florida MCO visit test data...');

  const orgId = 'org-e2e-001';
  const branchId = 'branch-fl-001';
  const clientId = 'client-fl-mco-001';
  const caregiverId = 'caregiver-fl-001';
  const visitId = 'visit-fl-mco-001';

  await db.query(
    `INSERT INTO branches (id, organization_id, name, address, settings, status, created_at, created_by, updated_at, updated_by, version)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, NOW(), $7, 1)
     ON CONFLICT (id) DO NOTHING`,
    [
      branchId,
      orgId,
      'Florida Branch',
      JSON.stringify({
        line1: '200 Orange Ave',
        city: 'Orlando',
        state: 'FL',
        postalCode: '32801',
        country: 'USA',
      }),
      JSON.stringify({
        evv_config: {
          aggregator: 'SANDATA',
          requiresClientSignature: true,
          requiresLevel2Screening: true,
        },
      }),
      'ACTIVE',
      'system',
    ]
  );

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
        line1: '555 Lake St',
        city: 'Orlando',
        state: 'FL',
        postalCode: '32803',
        country: 'USA',
        latitude: 28.5383,
        longitude: -81.3792,
        geofence_radius: 150,
      }),
      'FL-MCD-789012',
      'Sunshine Health',
      'Medicaid Managed Care',
      'ACTIVE',
      'system',
    ]
  );

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
      'Garcia',
      'CG-FL-001',
      JSON.stringify([
        {
          type: 'HHA',
          number: 'HHA-FL-456',
          issueDate: '2023-09-01',
          expirationDate: '2025-09-01',
          issuingAuthority: 'Florida AHCA',
          status: 'VALID',
        },
      ]),
      JSON.stringify({
        level_2_screening: {
          status: 'CLEARED',
          clearanceDate: '2023-09-01',
          expirationDate: '2028-09-01',
          checkType: 'LEVEL_2_BACKGROUND_SCREENING',
          verificationNumber: 'FL-L2-123456',
          agency: 'Florida Agency for Health Care Administration',
        },
      }),
      'COMPLIANT',
      'ACTIVE',
      'system',
    ]
  );

  await db.query(
    `INSERT INTO visits (
      id, organization_id, branch_id, client_id, caregiver_id,
      service_type, scheduled_date, scheduled_time, duration_hours,
      status, tasks, created_at, created_by, updated_at, updated_by, version
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12, NOW(), $12, 1)
    ON CONFLICT (id) DO NOTHING`,
    [
      visitId,
      orgId,
      branchId,
      clientId,
      caregiverId,
      'PERSONAL_CARE',
      '2025-01-25',
      '14:00:00',
      3,
      'SCHEDULED',
      JSON.stringify([
        {
          id: uuidv4(),
          name: 'Bathing assistance',
          critical: true,
          completed: false,
        },
      ]),
      'system',
    ]
  );

  console.log('✅ Florida MCO visit seed data created');
}
