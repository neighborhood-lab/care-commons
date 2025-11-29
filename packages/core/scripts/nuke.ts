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
  console.log('💣 Database Nuke Script\n');

  // Check for DATABASE_URL first (cloud/Vercel deployments)
  const databaseUrl = process.env.DATABASE_URL;
  let config: Knex.Config;

  if (databaseUrl !== undefined && databaseUrl !== '') {
    console.log('📝 Using DATABASE_URL for nuke operation');
    
    // Parse DATABASE_URL
    const url = new globalThis.URL(databaseUrl);
    
    console.log(`Database: ${url.pathname.slice(1)}`);
    console.log(`Host: ${url.hostname}\n`);
    
    config = {
      client: 'postgresql',
      connection: databaseUrl,
    };
  } else {
    // Fall back to individual DB_* variables (local development)
    const environment = process.env.NODE_ENV || 'development';
    const dbName = environment === 'test'
      ? (process.env.DB_NAME || 'folkcare') + '_test'
      : process.env.DB_NAME || 'folkcare';

    console.log(`Environment: ${environment}`);
    console.log(`Database: ${dbName}`);
    console.log(`Host: ${process.env.DB_HOST || 'localhost'}\n`);

    config = {
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
  }

  // // Confirm with user
  // if (process.env.FORCE_NUKE !== 'true') {
  //   const confirmed = await confirmNuke();
  //   if (!confirmed) {
  //     console.log('\n❌ Nuke cancelled. Database is safe.');
  //     process.exit(0);
  //   }
  // }

  // Initialize Knex
  const db = knex(config);

  try {
    console.log('\n🔄 Reading nuke.sql script...');

    // Read the nuke.sql file
    const nukeSqlPath = join(process.cwd(), 'packages/core/scripts/nuke.sql');
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
