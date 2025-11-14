/**
 * Minimal Database Seeding Script
 * 
 * Seeds ONLY operational data required for any installation:
 * - Organization (minimal template)
 * - Branch (minimal template)
 * - Admin user (for first login)
 * 
 * Run `npm run db:seed:demo` to add sample clients, caregivers, and demo data.
 */

import dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid';
import { Database, DatabaseConfig } from '../src/db/connection.js';
import { Pool, PoolClient } from 'pg';
import { PasswordUtils } from '../src/utils/password-utils.js';

dotenv.config({ path: '.env', quiet: true });

async function seedDatabase() {
  console.log('🌱 Seeding minimal operational data...\n');

  const env = process.env.NODE_ENV || 'development';
  const dbName = process.env.DB_NAME || 'care_commons';

  let db: Database | { transaction: (callback: (client: PoolClient) => Promise<void>) => Promise<void>; close: () => Promise<void> };

  // Use DATABASE_URL if provided (for CI/CD and production)
  if (process.env.DATABASE_URL) {
    console.log('📝 Using DATABASE_URL for seeding\n');
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    db = {
      transaction: async (callback: (client: PoolClient) => Promise<void>) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await callback(client);
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },
      close: async () => await pool.end(),
    };
  } else {
    // Use individual DB_* variables for local development
    const database = env === 'test' ? `${dbName}_test` : dbName;
    
    const config: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_SSL === 'true',
    };
    
    db = new Database(config);
  }

  try {
    await db.transaction(async (client) => {
      // Create minimal organization
      const orgId = uuidv4();
      const systemUserId = uuidv4();

      console.log('Creating organization...');
      await client.query(
        `
        INSERT INTO organizations (
          id, name, legal_name, phone, email, primary_address, 
          status, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
        [
          orgId,
          'Care Commons Home Health',
          'Care Commons Home Health Services, Inc.',
          '555-0100',
          'info@carecommons.example',
          JSON.stringify({
            line1: '123 Main Street',
            city: 'Springfield',
            state: 'IL',
            postalCode: '62701',
            country: 'US',
          }),
          'ACTIVE',
          systemUserId,
          systemUserId,
        ]
      );

      // Create branch
      const branchId = uuidv4();
      console.log('Creating branch...');
      await client.query(
        `
        INSERT INTO branches (
          id, organization_id, name, code, phone, address, 
          status, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
        [
          branchId,
          orgId,
          'Main Office',
          'MAIN',
          '555-0101',
          JSON.stringify({
            line1: '123 Main Street',
            city: 'Springfield',
            state: 'IL',
            postalCode: '62701',
            country: 'US',
          }),
          'ACTIVE',
          systemUserId,
          systemUserId,
        ]
      );

      // Create or update admin user
      // Password: Admin123!
      const adminPasswordHash = PasswordUtils.hashPassword('Admin123!');
      console.log('Creating admin user...');

      // Try to insert, on conflict update
      await client.query(
        `
        INSERT INTO users (
          id, organization_id, username, email, password_hash,
          first_name, last_name, roles, permissions, branch_ids, status,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          roles = EXCLUDED.roles,
          permissions = EXCLUDED.permissions,
          status = EXCLUDED.status,
          updated_at = NOW()
      `,
        [
          systemUserId,
          orgId,
          'admin',
          'admin@carecommons.example',
          adminPasswordHash,
          'System',
          'Administrator',
          ['SUPER_ADMIN'],
          ['organizations:*', 'users:*', 'clients:*', 'caregivers:*', 'visits:*', 'schedules:*', 'care-plans:*', 'tasks:*', 'billing:*', 'reports:*', 'settings:*'],
          [branchId],
          'ACTIVE',
          systemUserId,
          systemUserId,
        ]
      );

      // Create or update family user
      // Password: Family123!
      const familyUserId = uuidv4();
      const familyPasswordHash = PasswordUtils.hashPassword('Family123!');
      console.log('Creating family user...');

      // Try to insert, on conflict update
      await client.query(
        `
        INSERT INTO users (
          id, organization_id, username, email, password_hash,
          first_name, last_name, roles, permissions, branch_ids, status,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          roles = EXCLUDED.roles,
          permissions = EXCLUDED.permissions,
          status = EXCLUDED.status,
          updated_at = NOW()
      `,
        [
          familyUserId,
          orgId,
          'family',
          'family@carecommons.example',
          familyPasswordHash,
          'Stein',
          'Family',
          ['FAMILY'],
          ['clients:read', 'visits:read', 'care-plans:read', 'tasks:read', 'schedules:read'],
          [branchId],
          'ACTIVE',
          systemUserId,
          systemUserId,
        ]
      );

      console.log('\n✅ Minimal seed completed successfully!\n');
      console.log('📊 Operational data created:');
      console.log('  Organization: Care Commons Home Health');
      console.log('  Branch: Main Office');
      console.log('  Admin User: admin@carecommons.example');
      console.log('  Password: Admin123!');
      console.log('  Family User: family@carecommons.example');
      console.log('  Password: Family123!\n');
      console.log('💡 Run "npm run db:seed:demo" to add sample clients, caregivers, and demo data.');
    });
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

seedDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
