/**
 * Debug Authentication Login Script
 *
 * This script helps diagnose login failures by:
 * 1. Checking if user exists in database
 * 2. Examining password hash format
 * 3. Testing password verification
 * 4. Checking account status and locks
 * 5. Reviewing recent failed login attempts
 *
 * Usage:
 *   tsx packages/core/scripts/debug-auth-login.ts <email> [password-to-test]
 */

import dotenv from 'dotenv';
import { Pool } from 'pg';
import { PasswordUtils } from '../src/utils/password-utils.js';

dotenv.config({ path: '.env', quiet: true });

async function debugAuthLogin(email: string, passwordToTest?: string) {
  console.log('🔍 Debugging Authentication Login\n');
  console.log(`Target email: ${email}\n`);

  // Connect to database
  const pool = new Pool({
    connectionString: process.env['DATABASE_URL']
  });

  try {
    // 1. Check if user exists
    console.log('1️⃣  Checking if user exists...');
    const userResult = await pool.query(
      `SELECT id, organization_id, email, password_hash, first_name, last_name,
              roles, permissions, status, token_version, failed_login_attempts,
              locked_until, oauth_provider, oauth_provider_id,
              last_login_at, last_failed_login_at
       FROM users
       WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found!');
      console.log('\n💡 Suggestions:');
      console.log('   - Check if the email is correct');
      console.log('   - Run: npm run db:seed-users to create users');
      console.log('   - Check for case sensitivity issues\n');
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ User found!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Roles: ${user.roles.join(', ')}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Failed attempts: ${user.failed_login_attempts}`);
    console.log(`   Locked until: ${user.locked_until ?? 'Not locked'}`);
    console.log(`   OAuth provider: ${user.oauth_provider ?? 'None (password auth)'}`);
    console.log('');

    // 2. Check account status
    console.log('2️⃣  Checking account status...');
    if (user.status !== 'ACTIVE') {
      console.log(`❌ Account status is ${user.status} (must be ACTIVE)`);
      console.log('\n💡 Fix: Update user status to ACTIVE in database\n');
      return;
    }
    console.log('✅ Account is ACTIVE\n');

    // 3. Check if account is locked
    console.log('3️⃣  Checking account lock status...');
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      console.log(`❌ Account is locked until ${new Date(user.locked_until).toISOString()}`);
      console.log(`   Current time: ${new Date().toISOString()}`);
      console.log('\n💡 Fix: Wait until lock expires or manually unlock by running:');
      console.log(`   UPDATE users SET locked_until = NULL, failed_login_attempts = 0 WHERE email = '${email}';\n`);
      return;
    }
    console.log('✅ Account is not locked\n');

    // 4. Check password hash
    console.log('4️⃣  Checking password hash format...');
    if (!user.password_hash) {
      console.log('❌ No password hash found!');
      console.log('\n💡 This user might be OAuth-only.');
      if (user.oauth_provider) {
        console.log(`   OAuth Provider: ${user.oauth_provider}`);
        console.log('   This user should login via Google OAuth, not password.\n');
      } else {
        console.log('   Fix: Set a password by running:');
        console.log(`   tsx packages/core/scripts/set-admin-password.ts\n`);
      }
      return;
    }

    const hashParts = user.password_hash.split(':');
    console.log(`   Hash format: ${hashParts.length === 2 ? '✅ Valid (salt:hash)' : '❌ Invalid'}`);
    console.log(`   Salt length: ${hashParts[0]?.length ?? 0} chars`);
    console.log(`   Hash length: ${hashParts[1]?.length ?? 0} chars`);

    if (hashParts.length !== 2) {
      console.log('\n❌ Password hash is in wrong format!');
      console.log('   Expected format: salt:hash');
      console.log(`   Actual: ${user.password_hash.substring(0, 50)}...`);
      console.log('\n💡 Fix: Reset password by running:');
      console.log(`   tsx packages/core/scripts/set-admin-password.ts\n`);
      return;
    }
    console.log('');

    // 5. Test password verification if provided
    if (passwordToTest) {
      console.log('5️⃣  Testing password verification...');
      console.log(`   Testing password: ${passwordToTest}`);

      try {
        const isValid = PasswordUtils.verifyPassword(passwordToTest, user.password_hash);
        if (isValid) {
          console.log('✅ Password verification SUCCESSFUL!');
          console.log('\n💡 The password is correct. Login should work.');
          console.log('   If login still fails, check:');
          console.log('   - Network connectivity');
          console.log('   - API endpoint configuration');
          console.log('   - Client-side request formatting\n');
        } else {
          console.log('❌ Password verification FAILED!');
          console.log('\n💡 The password is incorrect.');
          console.log('   Default password for seeded users: Admin123!');
          console.log('   Check if ADMIN_PASSWORD env var was set during seeding.');
          console.log('\n   To reset password, run:');
          console.log('   tsx packages/core/scripts/set-admin-password.ts\n');
        }
      } catch (error) {
        console.log('❌ Password verification threw an error!');
        console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        console.log('\n💡 This indicates a hash format issue. Reset password:\n');
        console.log('   tsx packages/core/scripts/set-admin-password.ts\n');
      }
    } else {
      console.log('5️⃣  Password testing skipped (no password provided)');
      console.log('   To test a password, run:');
      console.log(`   tsx packages/core/scripts/debug-auth-login.ts "${email}" "YourPassword"\n`);
    }

    // 6. Check recent failed login attempts
    console.log('6️⃣  Checking recent failed login attempts...');
    const attemptsResult = await pool.query(
      `SELECT timestamp, ip_address, user_agent, failure_reason
       FROM auth_events
       WHERE email = $1
         AND timestamp > NOW() - INTERVAL '15 minutes'
         AND result = 'FAILED'
       ORDER BY timestamp DESC
       LIMIT 10`,
      [email]
    );

    if (attemptsResult.rows.length > 0) {
      console.log(`   Found ${attemptsResult.rows.length} failed attempts in last 15 minutes:`);
      attemptsResult.rows.forEach((attempt, i) => {
        console.log(`   ${i + 1}. ${new Date(attempt.timestamp).toISOString()}`);
        console.log(`      Reason: ${attempt.failure_reason}`);
        console.log(`      IP: ${attempt.ip_address ?? 'N/A'}`);
      });
      console.log('');

      if (attemptsResult.rows.length >= 10) {
        console.log('⚠️  Rate limit may be triggered (10+ attempts in 15 minutes)');
        console.log('   Wait 15 minutes or clear auth_events for this email\n');
      }
    } else {
      console.log('   No recent failed attempts\n');
    }

    // 7. Summary
    console.log('📋 Summary:');
    console.log('   Expected password: Admin123! (or ADMIN_PASSWORD env var value)');
    console.log('   User status: ' + (user.status === 'ACTIVE' ? '✅ Ready' : `❌ ${user.status}`));
    console.log('   Password hash: ' + (hashParts.length === 2 ? '✅ Valid format' : '❌ Invalid format'));
    console.log('   Account locked: ' + (user.locked_until && new Date() < new Date(user.locked_until) ? '❌ Yes' : '✅ No'));

    if (passwordToTest) {
      const isValid = PasswordUtils.verifyPassword(passwordToTest, user.password_hash);
      console.log('   Test password: ' + (isValid ? '✅ Correct' : '❌ Incorrect'));
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error during debugging:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: tsx packages/core/scripts/debug-auth-login.ts <email> [password-to-test]');
  console.log('');
  console.log('Examples:');
  console.log('  tsx packages/core/scripts/debug-auth-login.ts admin@folkcare.example');
  console.log('  tsx packages/core/scripts/debug-auth-login.ts admin@folkcare.example Admin123!');
  console.log('');
  process.exit(1);
}

const email = args[0];
const password = args[1];

debugAuthLogin(email!, password).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
