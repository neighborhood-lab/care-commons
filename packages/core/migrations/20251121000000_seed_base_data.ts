/**
 * Migration: Seed Base Operational Data
 * 
 * Seeds ONLY operational data required for any installation:
 * - Organization (minimal template)
 * - Branch (minimal template)
 * - Admin user (for first login)
 * - Family user (for family portal demo)
 * - State-specific users (all 50 states × 5 roles = 255 users)
 * 
 * This migration is idempotent and can be run multiple times safely.
 * It uses ON CONFLICT DO UPDATE to ensure data consistency.
 */

import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { PasswordUtils } from '../src/utils/password-utils.js';

// Fixed UUIDs for base data (ensures consistency across migrations)
const FIXED_ORG_ID = '00000000-0000-0000-0000-000000000001';
const FIXED_BRANCH_ID = '00000000-0000-0000-0000-000000000002';
const FIXED_ADMIN_ID = '00000000-0000-0000-0000-000000000003';
const FIXED_FAMILY_ID = '00000000-0000-0000-0000-000000000004';

// All 50 US States + DC
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
] as const;

// Role definitions for state-specific users
interface RoleDefinition {
  value: string;
  label: string;
  roles: string[];
  permissions: string[];
}

const ROLES: RoleDefinition[] = [
  {
    value: 'ADMIN',
    label: 'Administrator',
    roles: ['SUPER_ADMIN'],
    permissions: [
      'organizations:*', 'users:*', 'clients:*', 'caregivers:*',
      'visits:*', 'schedules:*', 'care-plans:*', 'tasks:*', 'billing:*',
      'reports:*', 'settings:*'
    ]
  },
  {
    value: 'COORDINATOR',
    label: 'Care Coordinator',
    roles: ['COORDINATOR', 'SCHEDULER'],
    permissions: [
      'clients:create', 'clients:read', 'clients:update',
      'caregivers:read', 'caregivers:assign',
      'visits:create', 'visits:read', 'visits:update', 'visits:delete',
      'schedules:create', 'schedules:read', 'schedules:update', 'schedules:delete',
      'care-plans:create', 'care-plans:read', 'care-plans:update',
      'tasks:create', 'tasks:read', 'tasks:update',
      'reports:read', 'reports:generate'
    ]
  },
  {
    value: 'CAREGIVER',
    label: 'Caregiver',
    roles: ['CAREGIVER'],
    permissions: [
      'clients:read', 'visits:read', 'visits:clock-in', 'visits:clock-out',
      'visits:update', 'care-plans:read', 'tasks:read', 'tasks:update'
    ]
  },
  {
    value: 'FAMILY',
    label: 'Family Member',
    roles: ['FAMILY'],
    permissions: [
      'clients:read', 'visits:read', 'care-plans:read', 'tasks:read', 'schedules:read'
    ]
  },
  {
    value: 'NURSE',
    label: 'Nurse/Clinical',
    roles: ['NURSE', 'CLINICAL'],
    permissions: [
      'clients:read', 'clients:update', 'visits:read', 'visits:create',
      'visits:update', 'care-plans:create', 'care-plans:read',
      'care-plans:update', 'tasks:create', 'tasks:read', 'tasks:update',
      'medications:*', 'clinical:*'
    ]
  }
];

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

  // ==========================================================================
  // STEP 5: Create state-specific users (all 50 states × 5 roles = 255 users)
  // ==========================================================================
  console.log(`\n👥 Creating state-specific demo users (${US_STATES.length} states × ${ROLES.length} roles = ${US_STATES.length * ROLES.length} users)...\n`);
  
  // Password format: Demo123! (simple, easy to remember)
  const demoPasswordHash = PasswordUtils.hashPassword('Demo123!');
  
  for (const state of US_STATES) {
    for (const role of ROLES) {
      const stateCode = state.code.toLowerCase();
      const roleCode = role.value.toLowerCase();
      
      // Email format: role@state.carecommons.example
      const email = `${roleCode}@${stateCode}.carecommons.example`;
      const username = `${roleCode}-${stateCode}`;
      const firstName = role.label;
      const lastName = `(${state.code})`;
      
      const userId = uuidv4();
      
      await knex.raw(`
        INSERT INTO users (
          id, organization_id, username, email, password_hash,
          first_name, last_name, roles, permissions, branch_ids,
          status, created_by, updated_by
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
        userId,
        FIXED_ORG_ID,
        username,
        email,
        demoPasswordHash,
        firstName,
        lastName,
        `{${role.roles.join(',')}}`,
        `{${role.permissions.join(',')}}`,
        `{${FIXED_BRANCH_ID}}`,
        'ACTIVE',
        FIXED_ADMIN_ID,
        FIXED_ADMIN_ID,
      ]);
    }
  }
  
  console.log('✅ Base seed completed successfully!\n');
  console.log('📊 Operational data created:');
  console.log('  Organization: Care Commons Home Health');
  console.log('  Branch: Main Office');
  console.log('  Admin User: admin@carecommons.example / Admin123!');
  console.log('  Family User: family@carecommons.example / Family123!');
  console.log(`  State Users: ${US_STATES.length * ROLES.length} users created`);
  console.log('  Login format: {role}@{state}.carecommons.example / Demo123!');
  console.log('  Example: admin@al.carecommons.example / Demo123!\n');
}

export async function down(knex: Knex): Promise<void> {
  console.log('🧹 Rolling back base seed data...\n');
  
  // Delete in reverse order of creation
  await knex('users').whereIn('email', [
    'admin@carecommons.example',
    'family@carecommons.example',
  ]).del();
  
  // Delete all state-specific users
  for (const state of US_STATES) {
    for (const role of ROLES) {
      const email = `${role.value.toLowerCase()}@${state.code.toLowerCase()}.carecommons.example`;
      await knex('users').where({ email }).del();
    }
  }
  
  await knex('branches').where({ id: FIXED_BRANCH_ID }).del();
  await knex('organizations').where({ id: FIXED_ORG_ID }).del();
  
  console.log('✅ Base seed data rolled back\n');
}
