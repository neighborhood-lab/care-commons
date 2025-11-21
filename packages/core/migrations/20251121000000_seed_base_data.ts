/**
 * Migration: Seed Base Operational Data
 * 
 * Seeds ONLY operational data required for any installation:
 * - Organization (minimal template)
 * - Branch (minimal template)
 * - Admin user (for first login)
 * - Family user (for family portal demo)
 * 
 * This migration is idempotent and can be run multiple times safely.
 * It uses ON CONFLICT DO UPDATE to ensure data consistency.
 * 
 * NOTE: Demo data (clients, caregivers, visits, etc.) is seeded via the
 * db:seed:demo script, which runs after migrations to keep data evergreen.
 */

import type { Knex } from 'knex';
import { PasswordUtils } from '../src/utils/password-utils.js';

// Fixed UUIDs for base data (ensures consistency across migrations)
const FIXED_ORG_ID = '00000000-0000-0000-0000-000000000001';
const FIXED_BRANCH_ID = '00000000-0000-0000-0000-000000000002';
const FIXED_ADMIN_ID = '00000000-0000-0000-0000-000000000003';
const FIXED_FAMILY_ID = '00000000-0000-0000-0000-000000000004';

export async function up(knex: Knex): Promise<void> {
  console.log('🌱 Seeding base operational data...\n');

  // ==========================================================================
  // STEP 1: Create minimal organization
  // ==========================================================================
  console.log('Creating organization...');
  
  await knex.raw(`
    INSERT INTO organizations (
      id, name, legal_name, phone, email, primary_address,
      status, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      legal_name = EXCLUDED.legal_name,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      primary_address = EXCLUDED.primary_address,
      status = EXCLUDED.status,
      updated_at = NOW()
  `, [
    FIXED_ORG_ID,
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
    FIXED_ADMIN_ID,
    FIXED_ADMIN_ID,
  ]);

  // ==========================================================================
  // STEP 2: Create branch
  // ==========================================================================
  console.log('Creating branch...');
  
  await knex.raw(`
    INSERT INTO branches (
      id, organization_id, name, code, phone, address,
      status, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      code = EXCLUDED.code,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address,
      status = EXCLUDED.status,
      updated_at = NOW()
  `, [
    FIXED_BRANCH_ID,
    FIXED_ORG_ID,
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
    FIXED_ADMIN_ID,
    FIXED_ADMIN_ID,
  ]);

  // ==========================================================================
  // STEP 3: Create admin user
  // Password: Admin123!
  // ==========================================================================
  console.log('Creating admin user...');
  
  const adminPasswordHash = PasswordUtils.hashPassword('Admin123!');
  
  await knex.raw(`
    INSERT INTO users (
      id, organization_id, username, email, password_hash,
      first_name, last_name, roles, permissions, branch_ids, status,
      created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?::text[], ?::text[], ?::uuid[], ?, ?, ?)
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      roles = EXCLUDED.roles,
      permissions = EXCLUDED.permissions,
      status = EXCLUDED.status,
      updated_at = NOW()
  `, [
    FIXED_ADMIN_ID,
    FIXED_ORG_ID,
    'admin',
    'admin@carecommons.example',
    adminPasswordHash,
    'System',
    'Administrator',
    '{SUPER_ADMIN}',
    '{organizations:*,users:*,clients:*,caregivers:*,visits:*,schedules:*,care-plans:*,tasks:*,billing:*,reports:*,settings:*}',
    `{${FIXED_BRANCH_ID}}`,
    'ACTIVE',
    FIXED_ADMIN_ID,
    FIXED_ADMIN_ID,
  ]);

  // ==========================================================================
  // STEP 4: Create family user
  // Password: Family123!
  // ==========================================================================
  console.log('Creating family user...');
  
  const familyPasswordHash = PasswordUtils.hashPassword('Family123!');
  
  await knex.raw(`
    INSERT INTO users (
      id, organization_id, username, email, password_hash,
      first_name, last_name, roles, permissions, branch_ids, status,
      created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?::text[], ?::text[], ?::uuid[], ?, ?, ?)
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      roles = EXCLUDED.roles,
      permissions = EXCLUDED.permissions,
      status = EXCLUDED.status,
      updated_at = NOW()
  `, [
    FIXED_FAMILY_ID,
    FIXED_ORG_ID,
    'family',
    'family@carecommons.example',
    familyPasswordHash,
    'Stein',
    'Family',
    '{FAMILY}',
    '{clients:read,visits:read,care-plans:read,tasks:read,schedules:read}',
    `{${FIXED_BRANCH_ID}}`,
    'ACTIVE',
    FIXED_ADMIN_ID,
    FIXED_ADMIN_ID,
  ]);

  console.log('✅ Base seed completed successfully!\n');
  console.log('📊 Operational data created:');
  console.log('  Organization: Care Commons Home Health');
  console.log('  Branch: Main Office');
  console.log('  Admin User: admin@carecommons.example / Admin123!');
  console.log('  Family User: family@carecommons.example / Family123!');
  console.log('\n💡 Run "npm run db:seed:demo" to add comprehensive demo data (clients, caregivers, visits, etc.)\n');
}

export async function down(knex: Knex): Promise<void> {
  console.log('🧹 Rolling back base seed data...\n');
  
  // Delete in reverse order of creation
  await knex('users').whereIn('email', [
    'admin@carecommons.example',
    'family@carecommons.example',
  ]).del();
  
  await knex('branches').where({ id: FIXED_BRANCH_ID }).del();
  await knex('organizations').where({ id: FIXED_ORG_ID }).del();
  
  console.log('✅ Base seed data rolled back\n');
}
