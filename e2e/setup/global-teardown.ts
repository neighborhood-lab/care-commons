/**
 * Global Teardown for Playwright E2E Tests
 *
 * This runs once after all tests complete.
 * We intentionally keep the test database for debugging purposes.
 * To drop the database, set E2E_DROP_DATABASE=true
 */
export default async function globalTeardown() {
  console.log('\n🧹 Cleaning up E2E test environment...\n');

  const dropDatabase = process.env['E2E_DROP_DATABASE'] === 'true';

  if (dropDatabase) {
    const dbName = process.env['E2E_DATABASE_NAME'] || 'folkcare_e2e_test';
    console.log(`⚠️  Dropping test database: ${dbName}...`);

    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      await execAsync(`dropdb ${dbName}`);
      console.log(`✅ Database ${dbName} dropped successfully`);
    } catch (error: unknown) {
      const err = error as Error;
      console.error(`⚠️  Failed to drop database: ${err.message}`);
    }
  } else {
    console.log('ℹ️  Test database preserved for debugging');
    console.log('   To drop the database, run: dropdb folkcare_e2e_test');
    console.log('   Or set E2E_DROP_DATABASE=true in environment');
  }

  console.log('\n✨ E2E test environment cleanup complete!\n');
}
