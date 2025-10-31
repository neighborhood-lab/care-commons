/**
 * Database nuke script
 * 
 * WARNING: This script will DROP ALL TABLES and EXTENSIONS!
 * Use with extreme caution - this is a destructive operation.
 */

import dotenv from "dotenv";
import knex, { Knex } from 'knex';
import { readFileSync } from 'fs';
import { join } from 'path';
// import * as readline from 'readline';

dotenv.config({ path: '.env', quiet: true });

// async function confirmNuke(): Promise<boolean> {
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
//   });

//   return new Promise((resolve) => {
//     rl.question('⚠️  WARNING: This will DROP ALL TABLES! Type "NUKE" to confirm: ', (answer) => {
//       rl.close();
//       resolve(answer === 'NUKE');
//     });
//   });
// }

async function nukeDatabase() {
  // Determine environment
  const environment = process.env.NODE_ENV || 'development';
  const dbName = environment === 'test'
    ? (process.env.DB_NAME || 'care_commons') + '_test'
    : process.env.DB_NAME || 'care_commons';

  console.log('💣 Database Nuke Script\n');
  console.log(`Environment: ${environment}`);
  console.log(`Database: ${dbName}`);
  console.log(`Host: ${process.env.DB_HOST || 'localhost'}\n`);

  // // Confirm with user
  // if (process.env.FORCE_NUKE !== 'true') {
  //   const confirmed = await confirmNuke();
  //   if (!confirmed) {
  //     console.log('\n❌ Nuke cancelled. Database is safe.');
  //     process.exit(0);
  //   }
  // }

  // Build Knex config
  const config: Knex.Config = {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: dbName,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
  };

  // Initialize Knex
  const db = knex(config);

  try {
    console.log('\n🔄 Reading nuke.sql script...');

    // Read the nuke.sql file
    const nukeSqlPath = join(__dirname, 'nuke.sql');
    const nukeSql = readFileSync(nukeSqlPath, 'utf-8');

    console.log('💥 Executing DROP statements...\n');

    // Execute the nuke SQL
    await db.raw(nukeSql);

    console.log('✅ Database nuked successfully!');
    console.log('   - All tables dropped');
    console.log('   - All functions dropped');
    console.log('   - All extensions dropped');
    console.log('   - Migration tracking tables dropped');
    console.log('\n💡 Run `npm run db:migrate` to rebuild the database.');
  } catch (error) {
    console.error('\n❌ Nuke failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Run nuke
nukeDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
