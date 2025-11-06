# Task 0010: Improve Local Development Setup (One-Command Start)

**Priority**: 🟡 MEDIUM
**Phase**: Phase 3 - Polish & Developer Experience
**Estimated Effort**: 4-6 hours

## Context

Currently, local development setup requires multiple manual steps: install dependencies, set up database, run migrations, seed data, start backend, start frontend. This should be streamlined to a single command for better developer experience.

## Goal

New developers should be able to run `npm run dev:setup` and have a fully functional local environment in <5 minutes.

## Current Setup Steps (Manual)

1. Clone repository
2. Install Node.js 22.x
3. Install PostgreSQL 14+
4. Create `.env` file from `.env.example`
5. Run `npm install`
6. Run `npm run db:create`
7. Run `npm run db:migrate`
8. Run `npm run db:seed`
9. Run `npm run dev` (or multiple terminal windows)

## Task

### 1. Create All-in-One Setup Script

**File**: `scripts/dev-setup.ts`

```typescript
#!/usr/bin/env tsx

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
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
  const dbUrl = await prompt('Database URL [postgresql://postgres:postgres@localhost:5432/care_commons]: ')
    || 'postgresql://postgres:postgres@localhost:5432/care_commons';

  const jwtSecret = generateSecret();
  const jwtRefreshSecret = generateSecret();
  const encryptionKey = generateSecret(32);

  const envContent = envTemplate
    .replace('your-secret-key-here', jwtSecret)
    .replace('your-refresh-secret-key-here', jwtRefreshSecret)
    .replace('your-encryption-key-here', encryptionKey)
    .replace('postgresql://user:password@localhost:5432/care_commons', dbUrl);

  fs.writeFileSync('.env', envContent);
  console.log(chalk.green('✓ .env file created'));
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
    execSync('npm run db:create', { stdio: 'inherit' });
    console.log(chalk.green('✓ Database created'));
  } catch (error) {
    console.log(chalk.yellow('⚠ Database may already exist'));
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
```

### 2. Create Unified Dev Server Script

**File**: `scripts/dev-server.ts`

Start backend and frontend concurrently:

```typescript
import concurrently from 'concurrently';
import chalk from 'chalk';

const { result } = concurrently([
  {
    command: 'npm run dev:api',
    name: 'API',
    prefixColor: 'blue'
  },
  {
    command: 'npm run dev:web',
    name: 'Web',
    prefixColor: 'magenta'
  }
], {
  prefix: 'name',
  killOthers: ['failure', 'success'],
  restartTries: 3
});

result.then(
  () => console.log(chalk.green('All servers stopped')),
  (error) => console.error(chalk.red('Server error:', error))
);
```

### 3. Add Docker Compose for Local Development

**File**: `docker-compose.dev.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: care-commons-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: care_commons
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: care-commons-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### 4. Update package.json Scripts

```json
{
  "scripts": {
    "dev:setup": "tsx scripts/dev-setup.ts",
    "dev": "tsx scripts/dev-server.ts",
    "dev:api": "turbo run dev --filter=@care-commons/app",
    "dev:web": "turbo run dev --filter=@care-commons/web",
    "dev:mobile": "turbo run dev --filter=@care-commons/mobile",
    "dev:docker": "docker-compose -f docker-compose.dev.yml up -d",
    "dev:docker:down": "docker-compose -f docker-compose.dev.yml down",
    "dev:reset": "npm run db:reset && npm run db:migrate && npm run db:seed:demo",
    "dev:clean": "turbo run clean && rm -rf node_modules"
  }
}
```

### 5. Add VS Code Development Tasks

**File**: `.vscode/tasks.json`

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Development Servers",
      "type": "npm",
      "script": "dev",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Start Docker Services",
      "type": "shell",
      "command": "docker-compose -f docker-compose.dev.yml up -d",
      "problemMatcher": []
    },
    {
      "label": "Run Database Migrations",
      "type": "npm",
      "script": "db:migrate",
      "problemMatcher": []
    }
  ]
}
```

### 6. Add VS Code Launch Configurations

**File**: `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API Server",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:api"],
      "skipFiles": ["<node_internals>/**"],
      "envFile": "${workspaceFolder}/.env"
    },
    {
      "name": "Debug Web App",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/packages/web"
    }
  ]
}
```

### 7. Create Developer Onboarding Guide

**File**: `docs/DEVELOPMENT.md`

```markdown
# Development Guide

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/neighborhood-lab/care-commons.git
   cd care-commons
   ```

2. **Run setup script**
   ```bash
   npm run dev:setup
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

4. **Open browser**
   - Web app: http://localhost:5173
   - API: http://localhost:3000
   - API docs: http://localhost:3000/api-docs

## Using Docker (Optional)

If you prefer using Docker for PostgreSQL:

```bash
npm run dev:docker
```

## Default Credentials

- **Admin**: admin@example.com / password123
- **Coordinator**: coordinator@example.com / password123
- **Caregiver**: caregiver@example.com / password123

## Common Tasks

- **Reset database**: `npm run dev:reset`
- **Run migrations**: `npm run db:migrate`
- **Seed demo data**: `npm run db:seed:demo`
- **Run tests**: `npm test`
- **Type check**: `npm run typecheck`
- **Lint**: `npm run lint`

## Troubleshooting

### Database connection error

If you see "connection refused" errors:
1. Check PostgreSQL is running: `pg_isadmin`
2. Check database exists: `psql -l | grep care_commons`
3. Check DATABASE_URL in `.env`

### Port already in use

If port 3000 or 5173 is in use:
1. Find process: `lsof -i :3000`
2. Kill process: `kill -9 <PID>`

### Build errors

Clean and rebuild:
```bash
npm run dev:clean
npm install
npm run build
```

## VS Code Setup

Recommended extensions:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features

Run development servers from VS Code:
- Press `Cmd+Shift+B` (Mac) or `Ctrl+Shift+B` (Windows/Linux)
- Select "Start Development Servers"
```

### 8. Add Health Check Endpoint

**File**: `packages/app/src/routes/health.routes.ts`

```typescript
import express from 'express';
import knex from '../db/knex.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await knex.raw('SELECT 1');

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
```

## Acceptance Criteria

- [ ] `npm run dev:setup` script working end-to-end
- [ ] Script checks prerequisites (Node, PostgreSQL)
- [ ] Script generates secure secrets automatically
- [ ] Script creates database and runs migrations
- [ ] Script offers to seed demo data
- [ ] `npm run dev` starts both backend and frontend
- [ ] Docker Compose configuration for local services
- [ ] VS Code tasks and launch configurations
- [ ] Developer onboarding guide created
- [ ] Health check endpoint implemented
- [ ] Setup completes in <5 minutes
- [ ] Works on macOS, Linux, and Windows

## Testing

Test the setup script on a fresh clone:
1. Delete local repository
2. Clone fresh
3. Run `npm run dev:setup`
4. Verify all services start
5. Verify login works
6. Verify database seeded

## Reference

- concurrently: https://github.com/open-cli-tools/concurrently
- Docker Compose: https://docs.docker.com/compose/
