/**
 * Seed All States Users Script
 * 
 * Creates demo user accounts for ALL 50 US States + DC for EACH role:
 * - Admin
 * - Coordinator  
 * - Caregiver
 * - Family
 * - Nurse
 * 
 * Email format: {role}@{state}.carecommons.example
 * Password format: Demo{State}{Role}123!
 * 
 * Total users created: 51 states x 5 roles = 255 users
 */

import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { Database, DatabaseConfig } from '../src/db/connection.js';
import { PasswordUtils } from '../src/utils/password-utils.js';
import { Pool, PoolClient } from 'pg';

dotenv.config({ path: '.env', quiet: true });

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

// Role definitions
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
      'organizations:*',
      'users:*',
      'clients:*',
      'caregivers:*',
      'visits:*',
      'schedules:*',
      'care-plans:*',
      'tasks:*',
      'billing:*',
      'reports:*',
      'settings:*'
    ]
  },
  {
    value: 'COORDINATOR',
    label: 'Care Coordinator',
    roles: ['COORDINATOR', 'SCHEDULER'],
    permissions: [
      'clients:create',
      'clients:read',
      'clients:update',
      'caregivers:read',
      'caregivers:assign',
      'visits:create',
      'visits:read',
      'visits:update',
      'visits:delete',
      'schedules:create',
      'schedules:read',
      'schedules:update',
      'schedules:delete',
      'care-plans:create',
      'care-plans:read',
      'care-plans:update',
      'tasks:create',
      'tasks:read',
      'tasks:update',
      'reports:read',
      'reports:generate'
    ]
  },
  {
    value: 'CAREGIVER',
    label: 'Caregiver',
    roles: ['CAREGIVER'],
    permissions: [
      'clients:read',
      'visits:read',
      'visits:clock-in',
      'visits:clock-out',
      'visits:update',
      'care-plans:read',
      'tasks:read',
      'tasks:update'
    ]
  },
  {
    value: 'FAMILY',
    label: 'Family Member',
    roles: ['FAMILY'],
    permissions: [
      'clients:read',
      'visits:read',
      'care-plans:read',
      'tasks:read',
      'schedules:read'
    ]
  },
  {
    value: 'NURSE',
    label: 'Nurse/Clinical',
    roles: ['NURSE', 'CLINICAL'],
    permissions: [
      'clients:read',
      'clients:update',
      'visits:read',
      'visits:create',
      'visits:update',
      'care-plans:create',
      'care-plans:read',
      'care-plans:update',
      'tasks:create',
      'tasks:read',
      'tasks:update',
      'medications:*',
      'clinical:*'
    ]
  }
];

async function seedAllStatesUsers() {
  console.log('🌎 Seeding users for ALL 50 US States + DC...\n');
  console.log(`📊 Creating ${US_STATES.length} states x ${ROLES.length} roles = ${US_STATES.length * ROLES.length} users\n`);

  const env = process.env['NODE_ENV'] ?? 'development';
  const dbName = process.env['DB_NAME'] ?? 'care_commons';

  let db: Database | { 
    transaction: (callback: (client: PoolClient) => Promise<void>) => Promise<void>; 
    close: () => Promise<void> 
  };

  // Use DATABASE_URL if provided (for CI/CD and production)
  if (process.env['DATABASE_URL']) {
    console.log('📝 Using DATABASE_URL for seeding\n');
    const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
    
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
    const database = env === 'test' ? `${dbName}_test` : dbName;
    
    const config: DatabaseConfig = {
      host: process.env['DB_HOST'] ?? 'localhost',
      port: parseInt(process.env['DB_PORT'] ?? '5432'),
      database,
      user: process.env['DB_USER'] ?? 'postgres',
      password: process.env['DB_PASSWORD'] ?? 'postgres',
      ssl: process.env['DB_SSL'] === 'true',
    };
    
    db = new Database(config);
  }

  try {
    await db.transaction(async (client: PoolClient) => {
      // Get organization and branch IDs from existing data
      const orgResult = await client.query(
        'SELECT id FROM organizations WHERE name = $1 LIMIT 1',
        ['Care Commons Home Health']
      );

      if (orgResult.rows.length === 0) {
        throw new Error('Organization not found. Please run db:seed first.');
      }

      const organizationId = orgResult.rows[0].id;

      const branchResult = await client.query(
        'SELECT id FROM branches WHERE organization_id = $1 AND code = $2 LIMIT 1',
        [organizationId, 'MAIN']
      );

      if (branchResult.rows.length === 0) {
        throw new Error('Branch not found. Please run db:seed first.');
      }

      const branchId = branchResult.rows[0].id;

      let usersCreated = 0;
      let usersUpdated = 0;

      // Create users for each state x role combination
      for (const state of US_STATES) {
        console.log(`\n🏛️  ${state.name} (${state.code}):`);
        
        for (const role of ROLES) {
          const stateCode = state.code.toLowerCase();
          const roleCode = role.value.toLowerCase();
          
          // Email format: role@state.carecommons.example
          const email = `${roleCode}@${stateCode}.carecommons.example`;
          const username = `${roleCode}-${stateCode}`;
          const firstName = role.label;
          const lastName = `(${state.code})`;
          
          // Password format: Demo{State}{Role}123!
          const password = `Demo${state.code}${role.value}123!`;
          const passwordHash = PasswordUtils.hashPassword(password);
          
          const userId = uuidv4();

          try {
            // Try to update existing user first
            const updateResult = await client.query(
              `
              UPDATE users 
              SET 
                password_hash = $1,
                first_name = $2,
                last_name = $3,
                roles = $4,
                permissions = $5,
                status = 'ACTIVE',
                branch_ids = $6,
                updated_at = NOW()
              WHERE email = $7
              RETURNING id
              `,
              [
                passwordHash,
                firstName,
                lastName,
                role.roles,
                role.permissions,
                [branchId],
                email
              ]
            );

            if (updateResult.rows.length > 0) {
              usersUpdated++;
              process.stdout.write('.');
            } else {
              // User doesn't exist, create new one
              await client.query(
                `
                INSERT INTO users (
                  id, organization_id, username, email, password_hash,
                  first_name, last_name, roles, permissions, branch_ids,
                  status, created_by, updated_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `,
                [
                  userId,
                  organizationId,
                  username,
                  email,
                  passwordHash,
                  firstName,
                  lastName,
                  role.roles,
                  role.permissions,
                  [branchId],
                  'ACTIVE',
                  userId,
                  userId
                ]
              );
              usersCreated++;
              process.stdout.write('+');
            }
          } catch (error) {
            if (error instanceof Error && 'code' in error && error.code === '23505') {
              // Unique constraint violation - try updating by username
              await client.query(
                `
                UPDATE users 
                SET 
                  email = $1,
                  password_hash = $2,
                  first_name = $3,
                  last_name = $4,
                  roles = $5,
                  permissions = $6,
                  status = 'ACTIVE',
                  branch_ids = $7,
                  updated_at = NOW()
                WHERE username = $8
                `,
                [
                  email,
                  passwordHash,
                  firstName,
                  lastName,
                  role.roles,
                  role.permissions,
                  [branchId],
                  username
                ]
              );
              usersUpdated++;
              process.stdout.write('.');
            } else {
              throw error;
            }
          }
        }
      }

      console.log('\n\n✅ All states seeded successfully!\n');
      console.log(`📈 Statistics:`);
      console.log(`   ✨ New users created: ${usersCreated}`);
      console.log(`   🔄 Existing users updated: ${usersUpdated}`);
      console.log(`   📊 Total users: ${usersCreated + usersUpdated}`);
      console.log('');
      console.log('📝 Login Pattern:\n');
      console.log('   Email:    {role}@{state}.carecommons.example');
      console.log('   Password: Demo{STATE}{ROLE}123!');
      console.log('');
      console.log('   Examples:');
      console.log('   - admin@tx.carecommons.example / DemoTXADMIN123!');
      console.log('   - caregiver@ca.carecommons.example / DemoCACAREGIVER123!');
      console.log('   - family@fl.carecommons.example / DemoFLFAMILY123!');
      console.log('   - nurse@ny.carecommons.example / DemoNYNURSE123!');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

seedAllStatesUsers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
