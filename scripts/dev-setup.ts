#!/usr/bin/env tsx

import { execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';
import chalk from 'chalk';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log(chalk.blue.bold('🏥 Care Commons - Development Setup\n'));

  // Check prerequisites
  console.log(chalk.yellow('Checking prerequisites...'));
  await checkNode();
  await checkPostgres();

  // Set up environment
  console.log(chalk.yellow('\nSetting up environment...'));
  await setupEnvFile();

  // Install dependencies
  console.log(chalk.yellow('\nInstalling dependencies...'));
  await installDependencies();

  // Set up database
  console.log(chalk.yellow('\nSetting up database...'));
  await setupDatabase();

  // Run migrations
  console.log(chalk.yellow('\nRunning migrations...'));
  await runMigrations();

  // Seed data
  console.log(chalk.yellow('\nSeeding demo data...'));
  await seedData();

  // Build packages
  console.log(chalk.yellow('\nBuilding packages...'));
  await buildPackages();

  // Success
  console.log(chalk.green.bold('\n✅ Setup complete!\n'));
  console.log(chalk.cyan('To start development servers, run:'));
  console.log(chalk.white('  npm run dev\n'));
  console.log(chalk.cyan('Default login credentials:'));
  console.log(chalk.white('  Email: admin@example.com'));
  console.log(chalk.white('  Password: password123\n'));

  rl.close();
}

async function checkNode() {
  try {
    const version = execSync('node --version').toString().trim();
    const major = parseInt(version.slice(1).split('.')[0]);
    if (major < 22) {
      throw new Error(`Node.js 22.x or higher required (found ${version})`);
    }
    console.log(chalk.green(`✓ Node.js ${version}`));
  } catch (error) {
    console.error(chalk.red('✗ Node.js 22.x or higher is required'));
    process.exit(1);
  }
}

async function checkPostgres() {
  try {
    execSync('psql --version', { stdio: 'ignore' });
    console.log(chalk.green('✓ PostgreSQL installed'));
  } catch (error) {
    console.error(chalk.red('✗ PostgreSQL is not installed'));
    console.log(chalk.yellow('\nInstall PostgreSQL:'));
    console.log('  macOS: brew install postgresql@14');
    console.log('  Ubuntu: sudo apt install postgresql-14');
    console.log('  Windows: https://www.postgresql.org/download/windows/\n');

    const useDocker = await prompt('Use Docker for PostgreSQL instead? (y/n): ');
    if (useDocker.toLowerCase() === 'y') {
      await startPostgresDocker();
    } else {
      process.exit(1);
    }
  }
}

async function startPostgresDocker() {
  console.log(chalk.yellow('Starting PostgreSQL in Docker...'));
  execSync('docker run -d --name care-commons-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:14', { stdio: 'inherit' });
  console.log(chalk.green('✓ PostgreSQL started in Docker'));
}

async function setupEnvFile() {
  if (fs.existsSync('.env')) {
    const overwrite = await prompt('.env file exists. Overwrite? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log(chalk.yellow('Skipping .env setup'));
      return;
    }
  }

  const envTemplate = fs.readFileSync('.env.example', 'utf-8');

  const jwtSecret = generateSecret();
  const jwtRefreshSecret = generateSecret();
  const sessionSecret = generateSecret();
  const encryptionKey = generateSecret(32);
  const mockPassword = generateSecret(16);

  const envContent = envTemplate
    .replace('your_jwt_secret_here_change_in_production_min_32_chars', jwtSecret)
    .replace('your_jwt_refresh_secret_here_change_in_production_min_32_chars', jwtRefreshSecret)
    .replace('your_session_secret_here_change_in_production', sessionSecret)
    .replace('your_32_byte_encryption_key_here_change_in_production', encryptionKey)
    .replace('your_secure_mock_password_here', mockPassword)
    .replace('your_secure_database_password_here', 'postgres');

  fs.writeFileSync('.env', envContent);
  console.log(chalk.green('✓ .env file created with secure secrets'));
}

function generateSecret(bytes = 32): string {
  const crypto = require('crypto');
  return crypto.randomBytes(bytes).toString('hex');
}

async function installDependencies() {
  execSync('npm install', { stdio: 'inherit' });
  console.log(chalk.green('✓ Dependencies installed'));
}

async function setupDatabase() {
  try {
    // Check if database exists by trying to connect
    const dbName = process.env.DB_NAME || 'care_commons';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || 'postgres';

    try {
      execSync(`psql -U ${dbUser} -lqt | cut -d \\| -f 1 | grep -qw ${dbName}`, { stdio: 'ignore' });
      console.log(chalk.yellow('⚠ Database already exists'));
    } catch (error) {
      // Database doesn't exist, create it
      execSync(`createdb -U ${dbUser} ${dbName}`, { stdio: 'inherit' });
      console.log(chalk.green('✓ Database created'));
    }
  } catch (error) {
    console.log(chalk.yellow('⚠ Database setup encountered an issue, continuing...'));
  }
}

async function runMigrations() {
  execSync('npm run db:migrate', { stdio: 'inherit' });
  console.log(chalk.green('✓ Migrations complete'));
}

async function seedData() {
  const seedDemo = await prompt('Seed demo data? (y/n): ');
  if (seedDemo.toLowerCase() === 'y') {
    execSync('npm run db:seed:demo', { stdio: 'inherit' });
    console.log(chalk.green('✓ Demo data seeded'));
  } else {
    execSync('npm run db:seed', { stdio: 'inherit' });
    console.log(chalk.green('✓ Minimal data seeded'));
  }
}

async function buildPackages() {
  execSync('npm run build', { stdio: 'inherit' });
  console.log(chalk.green('✓ Packages built'));
}

main().catch(console.error);
