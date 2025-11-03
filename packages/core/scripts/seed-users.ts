/**
 * Seed Users Script
 * 
 * Creates user accounts for different roles in the system:
 * - Super Admin (full system access)
 * - Coordinator (scheduling, client management)
 * - Caregiver (field staff, visit tracking)
 * 
 * Default password for all users: Admin123!
 * Users should change their password after first login.
 */

import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { Database, DatabaseConfig } from '../src/db/connection.js';
import { PasswordUtils } from '../src/utils/password-utils.js';
import { Pool, PoolClient } from 'pg';

dotenv.config({ path: '.env', quiet: true });

interface UserAccount {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  description: string;
}

const USER_ACCOUNTS: UserAccount[] = [
  {
    email: 'admin@carecommons.example',
    username: 'admin',
    firstName: 'System',
    lastName: 'Administrator',
    roles: ['SUPER_ADMIN'],
    permissions: [
      'organizations:*',
      'users:*',
      'clients:*',
      'caregivers:*',
      'visits:*',
      'schedules:*',
      'care-plans:*',
      'billing:*',
      'reports:*',
      'settings:*'
    ],
    description: 'Full system administrator with unrestricted access'
  },
  {
    email: 'coordinator@carecommons.example',
    username: 'coordinator',
    firstName: 'Jane',
    lastName: 'Coordinator',
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
      'reports:read',
      'reports:generate'
    ],
    description: 'Care coordinator responsible for scheduling and client coordination'
  },
  {
    email: 'caregiver@carecommons.example',
    username: 'caregiver',
    firstName: 'John',
    lastName: 'Caregiver',
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
    ],
    description: 'Field caregiver with mobile access for visit tracking'
  }
];

async function seedUsers() {
  console.log('👥 Seeding user accounts...\n');

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

      // Get or create default password
      const defaultPassword = process.env['ADMIN_PASSWORD'] ?? 'Admin123!';
      console.log(`Using password: ${defaultPassword}\n`);
      
      const passwordHash = PasswordUtils.hashPassword(defaultPassword);

      // Create or update each user account
      for (const account of USER_ACCOUNTS) {
        console.log(`Processing: ${account.email} (${account.roles.join(', ')})...`);

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
              account.firstName,
              account.lastName,
              account.roles,
              account.permissions,
              [branchId],
              account.email
            ]
          );

          if (updateResult.rows.length > 0) {
            console.log(`  ✓ Updated existing user`);
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
                account.username,
                account.email,
                passwordHash,
                account.firstName,
                account.lastName,
                account.roles,
                account.permissions,
                [branchId],
                'ACTIVE',
                userId,
                userId
              ]
            );
            console.log(`  ✓ Created new user`);
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
                account.email,
                passwordHash,
                account.firstName,
                account.lastName,
                account.roles,
                account.permissions,
                [branchId],
                account.username
              ]
            );
            console.log(`  ✓ Updated existing user (by username)`);
          } else {
            throw error;
          }
        }
      }
    });

    console.log('\n✅ User accounts seeded successfully!\n');
    console.log('📝 Login Credentials:\n');
    
    USER_ACCOUNTS.forEach(account => {
      console.log(`   ${account.roles.join(', ')}:`);
      console.log(`   Email:    ${account.email}`);
      console.log(`   Password: ${process.env['ADMIN_PASSWORD'] ?? 'Admin123!'}`);
      console.log(`   Description: ${account.description}`);
      console.log('');
    });

    console.log('⚠️  SECURITY: Users should change their password after first login!\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

seedUsers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
