import { Database } from '../../../packages/core/src/db/connection.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Seed Data: Visit Lifecycle
 *
 * Creates test data for basic visit lifecycle testing:
 * - Organization and branch
 * - Client
 * - Caregiver with valid credentials
 * - Scheduled visit with tasks
 */
export async function seedDatabase(db: Database): Promise<void> {
  console.log('Seeding visit lifecycle test data...');

  const orgId = 'org-e2e-001';
  const branchId = 'branch-e2e-001';
  const clientId = 'client-001';
  const caregiverId = 'caregiver-001';
  const visitId = 'visit-001';

  // Create organization
  await db.query(
    `INSERT INTO organizations (id, name, primary_address, status, created_at, created_by, updated_at, updated_by, version)
     VALUES ($1, $2, $3, $4, NOW(), $5, NOW(), $5, 1)
     ON CONFLICT (id) DO NOTHING`,
    [
      orgId,
      'E2E Test Organization',
      JSON.stringify({
        line1: '456 Healthcare Blvd',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'USA',
      }),
      'ACTIVE',
      'system',
    ]
  );

  // Create branch
  await db.query(
    `INSERT INTO branches (id, organization_id, name, address, status, created_at, created_by, updated_at, updated_by, version)
     VALUES ($1, $2, $3, $4, $5, NOW(), $6, NOW(), $6, 1)
     ON CONFLICT (id) DO NOTHING`,
    [
      branchId,
      orgId,
      'Main Branch',
      JSON.stringify({
        line1: '123 Main St',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'USA',
        latitude: 30.2672,
        longitude: -97.7431,
      }),
      'ACTIVE',
      'system',
    ]
  );

  // Create client
  await db.query(
    `INSERT INTO clients (
      id, organization_id, branch_id, first_name, last_name, date_of_birth,
      primary_address, status, created_at, created_by, updated_at, updated_by, version
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, NOW(), $9, 1)
    ON CONFLICT (id) DO NOTHING`,
    [
      clientId,
      orgId,
      branchId,
      'John',
      'Doe',
      '1950-01-01',
      JSON.stringify({
        street: '456 Client St',
        city: 'Austin',
        state: 'TX',
        zip: '78702',
        latitude: 30.2672,
        longitude: -97.7431,
        geofence_radius: 100, // meters
      }),
      'ACTIVE',
      'system',
    ]
  );

  // Create caregiver with valid credentials
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
      'Jane',
      'Caregiver',
      'CG-001',
      JSON.stringify([
        {
          type: 'CPR',
          number: 'CPR-123',
          issueDate: '2024-01-01',
          expirationDate: '2026-01-01',
          issuingAuthority: 'American Red Cross',
          status: 'VALID',
        },
        {
          type: 'FIRST_AID',
          number: 'FA-456',
          issueDate: '2024-01-01',
          expirationDate: '2026-01-01',
          issuingAuthority: 'American Red Cross',
          status: 'VALID',
        },
      ]),
      JSON.stringify({
        emr_check: {
          status: 'CLEARED',
          clearanceDate: '2024-01-01',
          expirationDate: '2026-01-01',
          checkType: 'EMPLOYEE_MISCONDUCT_REGISTRY',
        },
        criminal_background: {
          status: 'CLEARED',
          clearanceDate: '2024-01-01',
          expirationDate: '2026-01-01',
          checkType: 'FBI_BCI',
        },
      }),
      'COMPLIANT',
      'ACTIVE',
      'system',
    ]
  );

  // Create scheduled visit with tasks
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
      '2025-01-15',
      '09:00:00',
      2,
      'SCHEDULED',
      JSON.stringify([
        {
          id: uuidv4(),
          name: 'Assist with bathing',
          description: 'Help client with morning bath',
          critical: true,
          completed: false,
        },
        {
          id: uuidv4(),
          name: 'Medication reminder',
          description: 'Remind client to take medications',
          critical: true,
          completed: false,
        },
        {
          id: uuidv4(),
          name: 'Meal preparation',
          description: 'Prepare breakfast',
          critical: false,
          completed: false,
        },
      ]),
      'system',
    ]
  );

  console.log('✅ Visit lifecycle seed data created');
}
