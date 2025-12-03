/**
 * Fix production user passwords - EMERGENCY SCRIPT
 */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.secrets.txt' });

const DATABASE_URL = process.env['DATABASE_URL_PRODUCTION'];

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL_PRODUCTION not set');
  process.exit(1);
}

// Pre-generated hash for 'Demo123!'
const DEMO_PASSWORD_HASH = 'f929addc8f396d247e832aa9d6b965d6:6d5c6839811af807abeadc331ed1b8c517b8f17d838abf4b251b177ddde01c718a13a4df966969ac4ce9bc54d6467f379c9947c6baded6555b05f3084b067f33';

async function fixPasswords() {
  console.log('🔐 Fixing production user passwords...\n');

  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to production database\n');

    // Update TX users
    const result = await client.query(`
      UPDATE users
      SET password_hash = $1,
          updated_at = NOW()
      WHERE email LIKE '%@tx.folkcare.example'
      RETURNING id, email, roles
    `, [DEMO_PASSWORD_HASH]);

    console.log(`✅ Updated ${result.rowCount} Texas users:\n`);
    for (const row of result.rows) {
      console.log(`   - ${row.email} (${row.roles.join(', ')})`);
    }

    // Also update other state users
    const result2 = await client.query(`
      UPDATE users
      SET password_hash = $1,
          updated_at = NOW()
      WHERE email LIKE '%folkcare.example'
        AND email NOT LIKE '%@tx.folkcare.example'
      RETURNING id, email, roles
    `, [DEMO_PASSWORD_HASH]);

    console.log(`\n✅ Updated ${result2.rowCount} other demo users`);

    console.log('\n🎉 All demo users can now login with: Demo123!\n');
    console.log('Test logins:');
    console.log('   admin@tx.folkcare.example / Demo123!');
    console.log('   coordinator@tx.folkcare.example / Demo123!');
    console.log('   caregiver@tx.folkcare.example / Demo123!');
    console.log('   family@tx.folkcare.example / Demo123!');
    console.log('   nurse@tx.folkcare.example / Demo123!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixPasswords();
