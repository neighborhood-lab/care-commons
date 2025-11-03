/**
 * Set Admin Password Script
 * 
 * Updates the admin user password to allow local development login
 * Default password: Admin123! (change after first login)
 */

import dotenv from 'dotenv';
import { Database, DatabaseConfig } from '../src/db/connection.js';
import { PasswordUtils } from '../src/utils/password-utils.js';

dotenv.config({ path: '.env', quiet: true });

async function setAdminPassword() {
  console.log('🔐 Setting admin password...\n');

  const env = process.env['NODE_ENV'] ?? 'development';
  const dbName = process.env['DB_NAME'] ?? 'care_commons';
  const database = env === 'test' ? `${dbName}_test` : dbName;

  // Get password from environment or use default
  const password = process.env['ADMIN_PASSWORD'] ?? 'Admin123!';

  const config: DatabaseConfig = {
    host: process.env['DB_HOST'] ?? 'localhost',
    port: parseInt(process.env['DB_PORT'] ?? '5432'),
    database,
    user: process.env['DB_USER'] ?? 'postgres',
    password: process.env['DB_PASSWORD'] ?? 'postgres',
    ssl: process.env['DB_SSL'] === 'true',
  };

  const db = new Database(config);

  try {
    // Hash the password
    console.log('Hashing password...');
    const passwordHash = PasswordUtils.hashPassword(password);

    // Update admin user
    console.log('Updating admin user password...');
    const result = await db.query(
      `
      UPDATE users
      SET password_hash = $1,
          updated_at = NOW()
      WHERE email = 'admin@carecommons.example'
      RETURNING id, email, first_name, last_name
      `,
      [passwordHash]
    );

    if (result.rows.length === 0) {
      console.error('❌ Admin user not found!');
      console.log('\n💡 Please run: npm run db:seed');
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('\n✅ Password updated successfully!');
    console.log('\n📝 Login credentials:');
    console.log(`   Email:    ${user.email}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  SECURITY: Change this password after first login in production!\n');
  } catch (error) {
    console.error('❌ Failed to set password:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

setAdminPassword().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
