/**
 * Organization Isolation Security Tests
 * 
 * CRITICAL SECURITY TESTS: These tests verify that organization-level
 * multi-tenancy isolation is properly enforced at multiple layers:
 * 
 * 1. Middleware layer (authentication context)
 * 2. Application layer (scoped queries)
 * 3. Database layer (RLS policies - when enabled)
 * 
 * These tests MUST pass before any production deployment.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database, DatabaseConfig } from '../../db/connection.js';
import { 
  OrganizationContext,
  scopedSelect,
  scopedInsert,
  scopedUpdate,
  scopedDelete,
  validateOrganizationOwnership,
  scopedCount,
  scopedExists
} from '../../db/scoped-queries.js';
import { v4 as uuidv4 } from 'uuid';

describe.skip('Organization Isolation Security', () => {
  let db: Database;
  let org1Context: OrganizationContext;
  let org2Context: OrganizationContext;
  let org1ClientId: string;
  let org2ClientId: string;

  beforeEach(async () => {
    // Create test database connection
    const config: DatabaseConfig = {
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      database: process.env.DB_NAME ?? 'care_commons_test',
      user: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      ssl: false,
    };

    db = new Database(config);

    // Create two organizations for testing
    const org1Id = uuidv4();
    const org2Id = uuidv4();
    const user1Id = uuidv4();
    const user2Id = uuidv4();

    org1Context = { organizationId: org1Id, userId: user1Id };
    org2Context = { organizationId: org2Id, userId: user2Id };

    // Set up test data - create organizations (if table exists)
    try {
      await db.query(
        `INSERT INTO organizations (id, name, legal_name, phone, email, primary_address, status, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          org1Id, 'Test Org 1', 'Test Organization 1 LLC', '555-0001', 'org1@test.example',
          JSON.stringify({ line1: '123 Test St', city: 'Test City', state: 'IL', postalCode: '62701', country: 'US' }),
          'ACTIVE', user1Id, user1Id
        ]
      );

      await db.query(
        `INSERT INTO organizations (id, name, legal_name, phone, email, primary_address, status, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          org2Id, 'Test Org 2', 'Test Organization 2 LLC', '555-0002', 'org2@test.example',
          JSON.stringify({ line1: '456 Test Ave', city: 'Test City', state: 'IL', postalCode: '62701', country: 'US' }),
          'ACTIVE', user2Id, user2Id
        ]
      );
    } catch {
      // Organizations table might not exist yet - tests will create their own test tables
    }

    // Create test clients for each organization (if table exists)
    try {
      org1ClientId = uuidv4();
      org2ClientId = uuidv4();

      await db.query(
        `INSERT INTO clients (
          id, organization_id, branch_id, client_number, first_name, last_name, 
          date_of_birth, primary_address, emergency_contacts, authorized_contacts,
          programs, service_eligibility, risk_flags, status, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO NOTHING`,
        [
          org1ClientId, org1Id, uuidv4(), 'CLIENT001', 'John', 'Doe',
          '1950-01-01',
          JSON.stringify({ line1: '123 Main St', city: 'Springfield', state: 'IL', postalCode: '62701', country: 'US' }),
          JSON.stringify([]), JSON.stringify([]), JSON.stringify([]),
          JSON.stringify({}), JSON.stringify([]),
          'ACTIVE', user1Id, user1Id
        ]
      );

      await db.query(
        `INSERT INTO clients (
          id, organization_id, branch_id, client_number, first_name, last_name, 
          date_of_birth, primary_address, emergency_contacts, authorized_contacts,
          programs, service_eligibility, risk_flags, status, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO NOTHING`,
        [
          org2ClientId, org2Id, uuidv4(), 'CLIENT002', 'Jane', 'Smith',
          '1955-01-01',
          JSON.stringify({ line1: '456 Oak Ave', city: 'Springfield', state: 'IL', postalCode: '62701', country: 'US' }),
          JSON.stringify([]), JSON.stringify([]), JSON.stringify([]),
          JSON.stringify({}), JSON.stringify([]),
          'ACTIVE', user2Id, user2Id
        ]
      );
    } catch {
      // Clients table might not exist - tests will handle this
    }
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await db.query('DELETE FROM clients WHERE id = ANY($1)', [[org1ClientId, org2ClientId]]);
      await db.query('DELETE FROM organizations WHERE id = ANY($1)', [[org1Context.organizationId, org2Context.organizationId]]);
    } catch {
      // Tables might not exist
    }

    await db.close();
  });

  describe('Scoped SELECT Operations', () => {
    it('should only return data from user\'s organization', async () => {
      // Try to query clients with org1 context
      const result = await scopedSelect(
        db,
        org1Context,
        'SELECT * FROM clients WHERE 1=1',
        []
      );

      // Should only see org1 clients
      const orgIds = result.rows.map((row) => row.organization_id as string);
      expect(orgIds.every((id) => id === org1Context.organizationId)).toBe(true);
      expect(orgIds.includes(org2Context.organizationId)).toBe(false);
    });

    it('should prevent cross-organization data access via query parameters', async () => {
      // Attempt to access org2 client while authenticated as org1 user
      const result = await scopedSelect(
        db,
        org1Context,
        'SELECT * FROM clients WHERE id = $1',
        [org2ClientId]
      );

      // Should return 0 rows due to organization_id mismatch
      expect(result.rows.length).toBe(0);
    });

    it('should enforce organization scoping even with malicious WHERE clauses', async () => {
      // Attempt to bypass scoping with OR condition
      const result = await scopedSelect(
        db,
        org1Context,
        `SELECT * FROM clients WHERE status = $1 OR 1=1`,
        ['ACTIVE']
      );

      // Should still only see org1 data
      const orgIds = result.rows.map((row) => row.organization_id as string);
      expect(orgIds.every((id) => id === org1Context.organizationId)).toBe(true);
    });
  });

  describe('Scoped INSERT Operations', () => {
    it('should automatically set organization_id from context', async () => {
      const testClientId = uuidv4();
      
      // Insert without specifying organization_id
      await scopedInsert(
        db,
        org1Context,
        'clients',
        {
          id: testClientId,
          branch_id: uuidv4(),
          client_number: 'TEST001',
          first_name: 'Test',
          last_name: 'Client',
          date_of_birth: new Date('1960-01-01'),
          primary_address: JSON.stringify({ line1: '789 Test Rd', city: 'Test', state: 'IL', postalCode: '62701', country: 'US' }),
          emergency_contacts: JSON.stringify([]),
          authorized_contacts: JSON.stringify([]),
          programs: JSON.stringify([]),
          service_eligibility: JSON.stringify({}),
          risk_flags: JSON.stringify([]),
          status: 'ACTIVE'
        }
      );

      // Verify organization_id was set correctly
      const result = await db.query(
        'SELECT organization_id FROM clients WHERE id = $1',
        [testClientId]
      );

      expect(result.rows[0]?.organization_id).toBe(org1Context.organizationId);

      // Clean up
      await db.query('DELETE FROM clients WHERE id = $1', [testClientId]);
    });

    it('should override any manually specified organization_id', async () => {
      const testClientId = uuidv4();
      
      // Attempt to insert with different organization_id (malicious attempt)
      await scopedInsert(
        db,
        org1Context,
        'clients',
        {
          id: testClientId,
          organization_id: org2Context.organizationId, // Malicious: trying to set different org
          branch_id: uuidv4(),
          client_number: 'TEST002',
          first_name: 'Malicious',
          last_name: 'Attempt',
          date_of_birth: new Date('1960-01-01'),
          primary_address: JSON.stringify({ line1: '999 Bad St', city: 'Test', state: 'IL', postalCode: '62701', country: 'US' }),
          emergency_contacts: JSON.stringify([]),
          authorized_contacts: JSON.stringify([]),
          programs: JSON.stringify([]),
          service_eligibility: JSON.stringify({}),
          risk_flags: JSON.stringify([]),
          status: 'ACTIVE'
        }
      );

      // Verify organization_id was set to org1, not org2
      const result = await db.query(
        'SELECT organization_id FROM clients WHERE id = $1',
        [testClientId]
      );

      expect(result.rows[0]?.organization_id).toBe(org1Context.organizationId);
      expect(result.rows[0]?.organization_id).not.toBe(org2Context.organizationId);

      // Clean up
      await db.query('DELETE FROM clients WHERE id = $1', [testClientId]);
    });
  });

  describe('Scoped UPDATE Operations', () => {
    it('should only update records in user\'s organization', async () => {
      // Attempt to update org2 client while authenticated as org1 user
      await scopedUpdate(
        db,
        org1Context,
        'clients',
        { status: 'INACTIVE' },
        'id = $1',
        [org2ClientId]
      );

      // Verify org2 client was NOT updated
      const result = await db.query(
        'SELECT status FROM clients WHERE id = $1',
        [org2ClientId]
      );

      expect(result.rows[0]?.status).toBe('ACTIVE'); // Should still be ACTIVE
    });

    it('should successfully update records in user\'s organization', async () => {
      // Update org1 client as org1 user
      await scopedUpdate(
        db,
        org1Context,
        'clients',
        { status: 'INACTIVE' },
        'id = $1',
        [org1ClientId]
      );

      // Verify org1 client was updated
      const result = await db.query(
        'SELECT status FROM clients WHERE id = $1',
        [org1ClientId]
      );

      expect(result.rows[0]?.status).toBe('INACTIVE');

      // Reset for other tests
      await db.query(
        'UPDATE clients SET status = $1 WHERE id = $2',
        ['ACTIVE', org1ClientId]
      );
    });
  });

  describe('Scoped DELETE Operations', () => {
    it('should only soft delete records in user\'s organization', async () => {
      // Attempt to delete org2 client while authenticated as org1 user
      await scopedDelete(
        db,
        org1Context,
        'clients',
        'id = $1',
        [org2ClientId]
      );

      // Verify org2 client was NOT deleted
      const result = await db.query(
        'SELECT deleted_at FROM clients WHERE id = $1',
        [org2ClientId]
      );

      expect(result.rows[0]?.deleted_at).toBeNull();
    });

    it('should successfully soft delete records in user\'s organization', async () => {
      // Create a temporary test client for deletion
      const tempClientId = uuidv4();
      await db.query(
        `INSERT INTO clients (
          id, organization_id, branch_id, client_number, first_name, last_name,
          date_of_birth, primary_address, emergency_contacts, authorized_contacts,
          programs, service_eligibility, risk_flags, status, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          tempClientId, org1Context.organizationId, uuidv4(), 'TEMP001', 'Temp', 'Client',
          '1960-01-01',
          JSON.stringify({ line1: '111 Temp St', city: 'Test', state: 'IL', postalCode: '62701', country: 'US' }),
          JSON.stringify([]), JSON.stringify([]), JSON.stringify([]),
          JSON.stringify({}), JSON.stringify([]),
          'ACTIVE', org1Context.userId, org1Context.userId
        ]
      );

      // Delete as org1 user
      await scopedDelete(
        db,
        org1Context,
        'clients',
        'id = $1',
        [tempClientId]
      );

      // Verify client was soft deleted
      const result = await db.query(
        'SELECT deleted_at, deleted_by FROM clients WHERE id = $1',
        [tempClientId]
      );

      expect(result.rows[0]?.deleted_at).not.toBeNull();
      expect(result.rows[0]?.deleted_by).toBe(org1Context.userId);

      // Clean up
      await db.query('DELETE FROM clients WHERE id = $1', [tempClientId]);
    });
  });

  describe('Organization Ownership Validation', () => {
    it('should allow access to resources in user\'s organization', async () => {
      await expect(
        validateOrganizationOwnership(db, org1Context, 'clients', org1ClientId)
      ).resolves.not.toThrow();
    });

    it('should deny access to resources in different organization', async () => {
      await expect(
        validateOrganizationOwnership(db, org1Context, 'clients', org2ClientId)
      ).rejects.toThrow('Access denied: Resource belongs to different organization');
    });

    it('should throw error for non-existent resources', async () => {
      const fakeClientId = uuidv4();
      
      await expect(
        validateOrganizationOwnership(db, org1Context, 'clients', fakeClientId)
      ).rejects.toThrow('Resource not found');
    });
  });

  describe('Scoped Count Operations', () => {
    it('should only count records in user\'s organization', async () => {
      const count = await scopedCount(
        db,
        org1Context,
        'clients',
        'status = $1',
        ['ACTIVE']
      );

      // Verify count by querying directly
      const directResult = await db.query(
        'SELECT COUNT(*) as count FROM clients WHERE organization_id = $1 AND status = $2 AND deleted_at IS NULL',
        [org1Context.organizationId, 'ACTIVE']
      );

      const expectedCount = parseInt(directResult.rows[0]?.count as string ?? '0', 10);
      expect(count).toBe(expectedCount);
    });

    it('should return 0 for different organization', async () => {
      // Count org2's clients while authenticated as org1 - should see 0
      const count = await scopedCount(
        db,
        org1Context,
        'clients',
        undefined,
        []
      );

      // Verify it only counts org1 clients
      const allClientsInOrg1 = await db.query(
        'SELECT COUNT(*) as count FROM clients WHERE organization_id = $1 AND deleted_at IS NULL',
        [org1Context.organizationId]
      );

      const expectedCount = parseInt(allClientsInOrg1.rows[0]?.count as string ?? '0', 10);
      expect(count).toBe(expectedCount);
    });
  });

  describe('Scoped Exists Operations', () => {
    it('should return true for resources in user\'s organization', async () => {
      const exists = await scopedExists(
        db,
        org1Context,
        'clients',
        'id = $1',
        [org1ClientId]
      );

      expect(exists).toBe(true);
    });

    it('should return false for resources in different organization', async () => {
      const exists = await scopedExists(
        db,
        org1Context,
        'clients',
        'id = $1',
        [org2ClientId]
      );

      expect(exists).toBe(false);
    });

    it('should return false for non-existent resources', async () => {
      const fakeClientId = uuidv4();
      
      const exists = await scopedExists(
        db,
        org1Context,
        'clients',
        'id = $1',
        [fakeClientId]
      );

      expect(exists).toBe(false);
    });
  });
});
