/**
 * Reset demo user passwords in the configured production database.
 */
import pg from 'pg';
import dotenv from 'dotenv';
import { PasswordUtils } from '../packages/core/src/utils/password-utils.js';

dotenv.config({ path: '.secrets.txt' });

const databaseUrl = process.env['DATABASE_URL_PRODUCTION'];
const demoPassword = 'Wanyama2026$';

if (!databaseUrl) {
  console.error('DATABASE_URL_PRODUCTION not set');
  process.exit(1);
}

const demoPasswordHash = PasswordUtils.hashPassword(demoPassword);

async function fixPasswords(): Promise<void> {
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const result = await client.query(
      `
        UPDATE users
        SET password_hash = $1,
            updated_at = NOW()
        WHERE email LIKE '%folkcare.example'
        RETURNING email, roles
      `,
      [demoPasswordHash],
    );

    console.log(`Updated ${result.rowCount ?? 0} demo users.`);
    console.log(`All demo users can now log in with: ${demoPassword}`);
    for (const row of result.rows) {
      console.log(`- ${row.email} (${row.roles.join(', ')})`);
    }
  } finally {
    await client.end();
  }
}

fixPasswords().catch((error: unknown) => {
  console.error('Failed to update demo passwords:', error);
  process.exitCode = 1;
});
