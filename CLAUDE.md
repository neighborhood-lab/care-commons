# CLAUDE.md - AI Assistant Guide for Care Commons

> Comprehensive guide for AI assistants working on Care Commons codebase

**Last Updated:** 2025-11-13
**Repository:** https://github.com/neighborhood-lab/care-commons

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Development Workflows](#development-workflows)
- [GitHub Integration](#github-integration)
- [Key Conventions](#key-conventions)
- [Database Management](#database-management)
- [Testing Standards](#testing-standards)
- [Deployment](#deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Common Patterns](#common-patterns)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

### What is Care Commons?

Care Commons is a **modular, self-hostable software platform** for managing home-based care services. Built with TypeScript, Node.js, PostgreSQL, and React, it emphasizes:

- **Human-scale workflows** - Not enterprise excess
- **Local autonomy** - Runs offline and on-premises if needed
- **Interoperability by design** - APIs, import/export, open schema
- **Privacy and consent first** - Least-privilege access across roles
- **Incremental adoption** - Start with one vertical, add others later

### Core Principles

1. **Human-first design** - Tools reduce burden, not add it
2. **Privacy by default** - Least-privilege access, explicit consent
3. **Offline-capable** - Core functionality works without connectivity
4. **Auditable** - All changes tracked for compliance
5. **Modular** - Verticals are independent but share common infrastructure
6. **Open** - APIs and data schemas are documented and accessible

---

## Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | TypeScript/Node.js + Express | REST API server |
| **Database** | PostgreSQL 14+ | Relational data with JSONB for flexibility |
| **Frontend** | React 19 + Vite | Web application |
| **Mobile** | React Native (Expo) | Mobile application |
| **Validation** | Zod | Runtime type safety and validation |
| **Testing** | Vitest | Unit and integration tests |
| **Build System** | Turborepo | Monorepo build orchestration |
| **Deployment** | Vercel + Neon PostgreSQL | Serverless hosting |

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Care Commons Platform                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Web App    │  │ Mobile App  │  │  API Docs   │         │
│  │ (React/Vite)│  │ (React Nat) │  │  (Swagger)  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                 │                 │                │
│         └─────────────────┴─────────────────┘                │
│                           │                                  │
│  ┌────────────────────────▼──────────────────────────────┐  │
│  │           Express API Server (@care-commons/app)      │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │              Authentication & Authorization      │ │  │
│  │  │  (JWT, Mock Auth, Permission Service)            │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │                   Verticals Layer                │ │  │
│  │  │  ┌───────────┐ ┌───────────┐ ┌───────────┐      │ │  │
│  │  │  │ Clients   │ │Caregivers │ │ Visits    │      │ │  │
│  │  │  └───────────┘ └───────────┘ └───────────┘ ...  │ │  │
│  │  │   Service → Repository → Database               │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │              Core Package Layer                  │ │  │
│  │  │  • Types & Interfaces                            │ │  │
│  │  │  • Database Connection (Knex)                    │ │  │
│  │  │  • Audit Logging                                 │ │  │
│  │  │  • Permission Service                            │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └───────────────────────────┬──────────────────────────┘  │
│                              │                              │
│  ┌───────────────────────────▼──────────────────────────┐  │
│  │          PostgreSQL Database (Neon)                  │  │
│  │  • Migrations (Knex)                                 │  │
│  │  • Seed Scripts (Demo Data)                          │  │
│  │  • JSONB for flexible data models                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Patterns

1. **Request Flow**: Client → Express → Auth Middleware → Router → Handler → Service → Repository → Database
2. **Response Flow**: Database → Repository → Service → Handler → Response Formatter → Client
3. **Audit Trail**: All mutations trigger audit logs via core audit service
4. **Permission Check**: Every service method validates UserContext permissions

---

## Project Structure

### Monorepo Layout

```
care-commons/
├── packages/                    # Shared packages
│   ├── core/                   # Core functionality (types, db, auth)
│   ├── app/                    # Express API server
│   ├── web/                    # React web application
│   ├── mobile/                 # React Native mobile app
│   └── shared-components/      # Shared UI components
│
├── verticals/                   # Feature verticals (domain modules)
│   ├── client-demographics/    # Client management
│   ├── caregiver-staff/        # Staff management
│   ├── scheduling-visits/      # Visit scheduling
│   ├── time-tracking-evv/      # Electronic Visit Verification
│   ├── care-plans-tasks/       # Care planning
│   ├── family-engagement/      # Family portal
│   ├── billing-invoicing/      # Billing & invoicing
│   ├── payroll-processing/     # Payroll
│   ├── shift-matching/         # ML-based matching
│   ├── analytics-reporting/    # Analytics & reports
│   └── ...                     # Additional verticals
│
├── scripts/                     # Build and deployment scripts
├── e2e/                        # End-to-end tests (Playwright)
├── docs/                       # Documentation
├── .github/workflows/          # CI/CD workflows
└── migrations/                 # Database migrations (in packages/core)
```

### Package Structure Pattern

Each package/vertical follows this pattern:

```
package-name/
├── src/
│   ├── types/              # TypeScript types and interfaces
│   ├── repository/         # Database access layer
│   ├── service/            # Business logic layer
│   ├── validation/         # Zod validation schemas
│   ├── api/                # Express route handlers
│   ├── utils/              # Utility functions
│   └── __tests__/          # Tests (co-located with source)
│       ├── service/        # Service tests
│       ├── repository/     # Repository tests
│       └── validation/     # Validation tests
├── dist/                   # Compiled output (gitignored)
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.js
└── README.md
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `packages/core` | Shared types, database connection, auth, audit logging |
| `packages/app` | Express server, route registration, middleware |
| `packages/web` | React web app with Vite |
| `verticals/*` | Independent feature modules (clients, visits, etc.) |
| `scripts/` | Build, deployment, database utilities |
| `e2e/` | Playwright end-to-end tests |
| `.github/workflows/` | GitHub Actions CI/CD pipelines |

---

## Development Workflows

### Initial Setup

#### Standard Setup (Docker or Cloud)

```bash
# 1. Clone repository
git clone https://github.com/neighborhood-lab/care-commons.git
cd care-commons

# 2. Install Node.js 22.x (required)
nvm install 22
nvm use 22

# 3. Install dependencies
npm install

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# 5. Start PostgreSQL (via Docker or local)
docker-compose up -d  # Or use local PostgreSQL

# 6. Run migrations
npm run db:migrate

# 7. Seed database
npm run db:seed

# 8. Optional: Add demo data
npm run db:seed:demo

# 9. Build packages
npm run build

# 10. Start development server
npm run dev
```

#### Sandboxed Environment Setup (Local PostgreSQL + Redis)

If you're in a network-restricted environment (e.g., Claude Code sandbox) where external database connections fail:

```bash
# 1. Install and configure PostgreSQL locally
# Disable SSL and start PostgreSQL
sed -i "s/^ssl = on/ssl = off/" /etc/postgresql/16/main/postgresql.conf
pg_ctlcluster 16 main start

# 2. Configure authentication
sed -i 's/^local\s*all\s*postgres\s*peer/local   all             postgres                                trust/' /etc/postgresql/16/main/pg_hba.conf
sed -i 's/^local\s*all\s*all\s*peer/local   all             all                                     md5/' /etc/postgresql/16/main/pg_hba.conf
pg_ctlcluster 16 main reload

# 3. Create database and user
su - postgres -c "psql -c 'CREATE DATABASE care_commons;'"
su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\""

# 4. Start Redis (optional, for caching)
redis-server --daemonize yes --port 6379

# 5. Set environment variables
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/care_commons"
export REDIS_URL="redis://localhost:6379"

# 6. Install dependencies and run setup
npm install
npm run db:migrate
npm run db:seed

# 7. Test database connection
# Create test file: test-db-connection.js
cat > test-db-connection.js << 'EOF'
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function test() {
  try {
    await client.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0]);
    await client.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

test();
EOF

node test-db-connection.js

# 8. Start development server
npm run dev
```

**Sandboxed Environment Credentials:**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- DATABASE_URL: `postgresql://postgres:postgres@localhost:5432/care_commons`
- Admin Login: `admin@carecommons.example` / `Admin123!`

### Daily Development

```bash
# Start dev server (watches for changes)
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Type check
npm run typecheck

# Build all packages
npm run build
```

### Creating a New Feature

1. **Identify the vertical** - Which feature domain does this belong to?
2. **Create types** - Define TypeScript interfaces in `src/types/`
3. **Create validation** - Add Zod schemas in `src/validation/`
4. **Create repository** - Add database queries in `src/repository/`
5. **Create service** - Add business logic in `src/service/`
6. **Create API handlers** - Add routes in `src/api/`
7. **Write tests** - Add tests in `src/__tests__/`
8. **Update migration** - Add database schema changes
9. **Document** - Update README.md

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and commit
# Pre-commit hooks AUTOMATICALLY run:
# - Build
# - Lint
# - Type check
# - Tests with coverage
git add .
git commit -m "feat(scope): description"

# 3. Push to GitHub
git push -u origin feature/your-feature-name

# 4. Create Pull Request
# CI will automatically run:
# - Lint (Node 20 & 22)
# - Type check (Node 20 & 22)
# - Tests (Node 20 & 22)
# - Build
# - License compliance
# - Bundle size analysis
```

**CRITICAL**: Pre-commit hooks are **MANDATORY** and **CANNOT BE BYPASSED**. Never use:
- ❌ `git commit --no-verify`
- ❌ `git commit -n`

---

## GitHub Integration

### GitHub CLI (`gh`)

Care Commons development environments include the GitHub CLI for seamless integration with GitHub repositories, pull requests, issues, and GitHub Actions.

#### Installation & Location

- **Binary Location**: `~/bin/gh`
- **Version**: 2.83.1 (automatically installed if needed)
- **Authentication**: Automatic via `GH_TOKEN` environment variable

#### Quick Setup Verification

```bash
# Verify GitHub CLI is installed and authenticated
~/bin/gh auth status

# Test repository access
~/bin/gh repo view neighborhood-lab/care-commons
```

#### Authentication

The `GH_TOKEN` environment variable is pre-configured with a GitHub Personal Access Token for the repository.

**Token Scopes**:
- `public_repo` - Access to public repository operations
- `workflow` - Manage GitHub Actions workflows

```bash
# Check authentication status
~/bin/gh auth status

# Expected output:
# ✓ Logged in to github.com
# ✓ Token: ghp_************************************
# ✓ Token scopes: 'public_repo', 'workflow'
```

#### Common Commands

##### Pull Requests

```bash
# List pull requests
~/bin/gh pr list --repo neighborhood-lab/care-commons

# View specific PR
~/bin/gh pr view <number>

# Create a new PR
~/bin/gh pr create --title "feat: Add new feature" --body "Description of changes"

# Check PR CI/test status
~/bin/gh pr checks <number>

# Watch PR checks in real-time
~/bin/gh pr checks <number> --watch

# Merge a PR
~/bin/gh pr merge <number>

# Close a PR
~/bin/gh pr close <number>
```

##### Issues

```bash
# List issues
~/bin/gh issue list --repo neighborhood-lab/care-commons

# View specific issue
~/bin/gh issue view <number>

# Create a new issue
~/bin/gh issue create --title "Bug: Description" --body "Details"

# Close an issue
~/bin/gh issue close <number>
```

##### GitHub Actions

```bash
# List recent workflow runs
~/bin/gh run list --repo neighborhood-lab/care-commons

# View specific workflow run
~/bin/gh run view <run-id>

# Watch a workflow run (real-time)
~/bin/gh run watch <run-id>

# Re-run a failed workflow
~/bin/gh run rerun <run-id>

# View workflow logs
~/bin/gh run view <run-id> --log
```

##### Repository Information

```bash
# View repository details
~/bin/gh repo view neighborhood-lab/care-commons

# Get repository metadata as JSON
~/bin/gh repo view neighborhood-lab/care-commons --json name,description,defaultBranchRef,isPrivate

# Clone repository
~/bin/gh repo clone neighborhood-lab/care-commons
```

#### Integration Patterns

##### Creating a Pull Request

```bash
# 1. Ensure you're on your feature branch
git branch --show-current

# 2. Push your changes
git push -u origin <branch-name>

# 3. Create PR with title and description
~/bin/gh pr create \
  --title "feat(scope): Add new feature" \
  --body "## Summary
- Implemented X
- Fixed Y
- Updated Z

## Test Plan
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed"

# 4. Monitor CI checks
~/bin/gh pr checks --watch
```

##### Monitoring CI/CD

```bash
# Check status of current PR
~/bin/gh pr checks

# Watch for completion
~/bin/gh pr checks --watch

# View detailed logs if checks fail
~/bin/gh pr view --json statusCheckRollup

# Get workflow run details
~/bin/gh run list --branch <branch-name>
~/bin/gh run view <run-id> --log
```

##### Working with Issues

```bash
# Create issue for a bug
~/bin/gh issue create \
  --title "Bug: Database migration fails on fresh install" \
  --body "**Description**
Migration 20251113_xxx fails when running on a fresh database.

**Steps to Reproduce**
1. Fresh PostgreSQL instance
2. Run npm run db:migrate
3. Error occurs

**Expected Behavior**
Migration should complete successfully"

# Link PR to issue
~/bin/gh pr create \
  --title "fix: Database migration issue" \
  --body "Fixes #123"  # References issue number
```

#### Best Practices

1. **Always use full path**: `~/bin/gh` (not in PATH by default in all contexts)

2. **Check authentication first**: Before any operation, verify `~/bin/gh auth status` succeeds

3. **Use JSON output for scripting**: Many commands support `--json` for structured output
   ```bash
   ~/bin/gh pr view 123 --json number,title,state,author
   ```

4. **Watch long-running operations**: Use `--watch` for CI checks and workflow runs
   ```bash
   ~/bin/gh pr checks <number> --watch
   ```

5. **Combine with jq for parsing**: Process JSON output with jq
   ```bash
   ~/bin/gh pr list --json number,title,author --limit 5 | jq '.[] | select(.author.login == "bedwards")'
   ```

#### Troubleshooting

##### Authentication Issues

```bash
# Check if GH_TOKEN is set
echo $GH_TOKEN | head -c 10

# Verify authentication
~/bin/gh auth status

# If authentication fails, check token scopes
# Token must have 'public_repo' and 'workflow' scopes
```

##### Command Not Found

```bash
# Verify gh is installed
ls -la ~/bin/gh

# If missing, install manually
mkdir -p ~/bin
cd /tmp
curl -sSL https://github.com/cli/cli/releases/download/v2.83.1/gh_2.83.1_linux_amd64.tar.gz -o gh.tar.gz
tar -xzf gh.tar.gz
cp gh_2.83.1_linux_amd64/bin/gh ~/bin/
chmod +x ~/bin/gh
```

##### API Rate Limiting

```bash
# Check rate limit status
~/bin/gh api rate_limit

# If rate limited, wait or use a different token
# Authenticated requests have higher limits (5000/hour vs 60/hour)
```

#### MCP Server Configuration (Optional)

For enhanced integration, an MCP (Model Context Protocol) server can be configured for GitHub operations. Configuration is stored at `~/.config/claude/mcp.json`.

**Note**: MCP server may require session restart to activate. The `gh` CLI commands documented above work immediately without MCP configuration.

#### Example Workflows

##### Complete Feature Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes, commit
git add .
git commit -m "feat: Implement new feature"

# 3. Push and create PR
git push -u origin feature/new-feature
~/bin/gh pr create \
  --title "feat: Implement new feature" \
  --body "Detailed description of changes"

# 4. Monitor CI checks
~/bin/gh pr checks --watch

# 5. Once approved and checks pass, merge
~/bin/gh pr merge --squash --delete-branch
```

##### Debugging Failed CI

```bash
# 1. List recent workflow runs
~/bin/gh run list --limit 5

# 2. Find failed run
~/bin/gh run view <run-id>

# 3. View detailed logs
~/bin/gh run view <run-id> --log

# 4. Re-run after fixes
git push  # Push fixes
~/bin/gh run watch  # Watch new run
```

---

## Key Conventions

### Code Style

#### TypeScript

- **Strict mode enabled** - All strict TypeScript flags are on
- **ESM only** - All packages use `"type": "module"`
- **Node 22.x required** - For ESM and modern features
- **No `any` types** - Use proper typing or `unknown`
- **Interface over type** - Prefer `interface` for object shapes
- **Explicit return types** - Always specify function return types

```typescript
// ✅ Good
interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

async function getClient(id: string): Promise<Client | null> {
  return await clientRepository.findById(id);
}

// ❌ Bad
function getClient(id: any) {  // Missing return type, uses any
  return clientRepository.findById(id);
}
```

#### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Interfaces | PascalCase | `ClientService`, `UserContext` |
| Types | PascalCase | `ClientStatus`, `RiskFlag` |
| Functions | camelCase | `createClient`, `searchClients` |
| Variables | camelCase | `clientId`, `userContext` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_PAGE_SIZE`, `DEFAULT_LIMIT` |
| Files (code) | kebab-case | `client-service.ts`, `client-repository.ts` |
| Files (test) | kebab-case + `.test.ts` | `client-service.test.ts` |
| Database tables | snake_case | `clients`, `emergency_contacts` |
| Database columns | snake_case | `first_name`, `created_at` |

#### File Organization

```typescript
// src/service/client-service.ts
import type { Client, CreateClientInput } from '../types';
import type { ClientRepository } from '../repository/client-repository';
import type { UserContext } from '@care-commons/core';

/**
 * Service for managing client records.
 * Implements business logic and permission checks.
 */
export class ClientService {
  constructor(private repository: ClientRepository) {}

  /**
   * Create a new client record.
   * @param input - Client data
   * @param context - User context for permissions
   * @returns Created client
   * @throws {PermissionError} If user lacks clients:create permission
   */
  async createClient(
    input: CreateClientInput,
    context: UserContext
  ): Promise<Client> {
    // Implementation
  }
}
```

### Layer Responsibilities

#### 1. Types Layer (`src/types/`)

- Define domain interfaces and types
- No business logic
- Shared across all layers

```typescript
// types/client.ts
export interface Client {
  id: string;
  organizationId: string;
  branchId: string;
  firstName: string;
  lastName: string;
  status: ClientStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ClientStatus =
  | 'INQUIRY'
  | 'PENDING_INTAKE'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'DISCHARGED';
```

#### 2. Validation Layer (`src/validation/`)

- Zod schemas for runtime validation
- Input validation for API endpoints
- Type inference from schemas

```typescript
// validation/client-validator.ts
import { z } from 'zod';

export const createClientSchema = z.object({
  organizationId: z.string().uuid(),
  branchId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.coerce.date(),
  status: z.enum(['INQUIRY', 'PENDING_INTAKE', 'ACTIVE']),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
```

#### 3. Repository Layer (`src/repository/`)

- Database access only
- No business logic
- Returns raw data from database
- Uses Knex query builder

```typescript
// repository/client-repository.ts
import type { Client } from '../types';
import type { Database } from '@care-commons/core';

export class ClientRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<Client | null> {
    const row = await this.db('clients')
      .where({ id, deleted_at: null })
      .first();

    return row ? this.mapRow(row) : null;
  }

  private mapRow(row: any): Client {
    // Map database row to domain type
    return {
      id: row.id,
      organizationId: row.organization_id,
      // ... map all fields
    };
  }
}
```

#### 4. Service Layer (`src/service/`)

- Business logic
- Permission checks
- Orchestrates repositories
- Validates user context

```typescript
// service/client-service.ts
export class ClientService {
  async createClient(
    input: CreateClientInput,
    context: UserContext
  ): Promise<Client> {
    // 1. Check permissions
    if (!context.permissions.includes('clients:create')) {
      throw new PermissionError('Missing clients:create permission');
    }

    // 2. Validate branch access
    if (!context.branchIds.includes(input.branchId)) {
      throw new PermissionError('No access to this branch');
    }

    // 3. Generate client number
    const clientNumber = await this.generateClientNumber(
      input.organizationId
    );

    // 4. Create client
    const client = await this.repository.create({
      ...input,
      clientNumber,
      createdBy: context.userId,
    });

    // 5. Audit log
    await this.auditService.log({
      action: 'client.created',
      userId: context.userId,
      resourceId: client.id,
    });

    return client;
  }
}
```

#### 5. API Layer (`src/api/`)

- HTTP request/response handling
- Input validation (Zod)
- Error handling
- Route definitions

```typescript
// api/client-handlers.ts
export const createClientHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1. Validate input
    const input = createClientSchema.parse(req.body);

    // 2. Get user context from middleware
    const context = req.userContext;

    // 3. Call service
    const client = await clientService.createClient(input, context);

    // 4. Return response
    res.status(201).json(client);
  } catch (error) {
    handleError(error, res);
  }
};
```

### Error Handling

```typescript
// core/src/errors/
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 404, 'NOT_FOUND');
  }
}

export class PermissionError extends AppError {
  constructor(message: string) {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}
```

---

## Database Management

### Migration Pattern

Care Commons uses Knex.js for migrations. All migrations are in `packages/core/migrations/`.

#### Creating a Migration

```bash
# Create migration file (manual - no CLI)
touch packages/core/migrations/$(date +%Y%m%d%H%M%S)_description.ts
```

#### Migration Template

```typescript
// packages/core/migrations/20251113000000_add_client_tags.ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('client_tags', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('client_id').notNullable()
      .references('id').inTable('clients').onDelete('CASCADE');
    table.string('tag_name', 50).notNullable();
    table.string('tag_value', 200);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();

    // Indexes
    table.index('client_id');
    table.index(['client_id', 'tag_name']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('client_tags');
}
```

#### Migration Commands

```bash
# Run migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:rollback

# Check migration status
npm run db:migrate:status

# Reset database (⚠️ DESTRUCTIVE)
npm run db:nuke        # Drop all tables
npm run db:migrate     # Re-run migrations
npm run db:seed        # Seed base data
```

### Database Schema Conventions

1. **Table names**: `snake_case`, plural (`clients`, `visits`)
2. **Column names**: `snake_case` (`first_name`, `created_at`)
3. **Primary keys**: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
4. **Foreign keys**: `{table}_id` (`organization_id`, `client_id`)
5. **Timestamps**: `created_at`, `updated_at`, `deleted_at`
6. **Audit columns**: `created_by`, `updated_by`, `deleted_by` (UUIDs)
7. **Soft deletes**: Use `deleted_at TIMESTAMP NULL`
8. **JSONB for flexibility**: Use JSONB for nested/flexible data

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    branch_id UUID NOT NULL REFERENCES branches(id),

    -- Identity
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,

    -- Flexible data (JSONB)
    primary_address JSONB NOT NULL,
    emergency_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Audit trail
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    deleted_at TIMESTAMP NULL,
    deleted_by UUID NULL,
    version INTEGER NOT NULL DEFAULT 1,

    -- Indexes
    INDEX idx_clients_org_branch (organization_id, branch_id),
    INDEX idx_clients_name (last_name, first_name),
    INDEX idx_clients_deleted (deleted_at)
);
```

### Seeding Data

#### Base Seed (Required)

```bash
# Creates: organization, branch, admin user
npm run db:seed
```

#### Demo Seed (Development)

```bash
# Creates: ~20 clients, caregivers, visits
npm run db:seed:demo
```

#### Comprehensive Showcase Seed

```bash
# Creates: 900+ records (clients, caregivers, visits, invoices)
npm run db:seed:showcase-comprehensive
```

All demo data is marked with `is_demo_data = true` for easy cleanup.

---

## Testing Standards

### Test Organization

```
src/
├── service/
│   └── client-service.ts
└── __tests__/
    ├── service/
    │   └── client-service.test.ts
    ├── repository/
    │   └── client-repository.test.ts
    └── validation/
        └── client-validator.test.ts
```

### Test Pattern

```typescript
// src/__tests__/service/client-service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientService } from '../../service/client-service';
import type { ClientRepository } from '../../repository/client-repository';
import type { UserContext } from '@care-commons/core';

describe('ClientService', () => {
  let service: ClientService;
  let mockRepository: ClientRepository;
  let userContext: UserContext;

  beforeEach(() => {
    // Setup
    mockRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      // ... mock all methods
    } as any;

    service = new ClientService(mockRepository);

    userContext = {
      userId: 'user-123',
      roles: ['COORDINATOR'],
      permissions: ['clients:create', 'clients:read'],
      organizationId: 'org-123',
      branchIds: ['branch-123'],
    };
  });

  describe('createClient', () => {
    it('should create a client with valid input', async () => {
      // Arrange
      const input = {
        organizationId: 'org-123',
        branchId: 'branch-123',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1950-01-01'),
        status: 'ACTIVE' as const,
      };

      const expectedClient = {
        id: 'client-123',
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRepository.create).mockResolvedValue(expectedClient);

      // Act
      const result = await service.createClient(input, userContext);

      // Assert
      expect(result).toEqual(expectedClient);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...input,
          createdBy: userContext.userId,
        })
      );
    });

    it('should throw PermissionError when user lacks permission', async () => {
      // Arrange
      const input = { /* ... */ };
      const contextWithoutPermission = {
        ...userContext,
        permissions: [], // No permissions
      };

      // Act & Assert
      await expect(
        service.createClient(input, contextWithoutPermission)
      ).rejects.toThrow('Missing clients:create permission');
    });
  });
});
```

### Coverage Requirements

Enforced in pre-commit hooks and CI:

| Metric | Threshold |
|--------|-----------|
| Lines | 82% |
| Statements | 82% |
| Branches | 70% |
| Functions | 87% |

### Test Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests for specific package
npm test -- --project core

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- client-service.test.ts
```

### Test Best Practices

1. **Deterministic tests** - No random values, fixed dates
2. **Mock external dependencies** - Database, HTTP, file system
3. **Test edge cases** - Null, empty, invalid inputs
4. **Use descriptive names** - `it('should create client with valid input')`
5. **Arrange-Act-Assert** - Clear test structure
6. **One assertion per test** - Tests should be focused
7. **No flaky tests** - Tests must pass consistently

```typescript
// ❌ Bad - Non-deterministic (multiple Date() calls)
it('should set timestamps', async () => {
  const client = await service.createClient(input, context);
  expect(client.createdAt).toEqual(new Date()); // Will fail due to timing
});

// ✅ Good - Deterministic (single timestamp)
it('should set timestamps', async () => {
  const now = new Date('2025-11-13T12:00:00Z');
  vi.setSystemTime(now);

  const client = await service.createClient(input, context);
  expect(client.createdAt).toEqual(now);

  vi.useRealTimers();
});
```

---

## Deployment

### Environment Setup

Care Commons supports multiple deployment targets:

- **Local**: Docker Compose
- **Staging**: Vercel + Neon PostgreSQL
- **Production**: Vercel + Neon PostgreSQL
- **Alternative**: Cloudflare Workers + Supabase

### Vercel Deployment (Primary)

#### Required Environment Variables

```bash
# Database (Neon pooled connection string)
DATABASE_URL=postgresql://user:pass@host.neon.tech:5432/db?sslmode=require

# Authentication
JWT_SECRET=<32-char-random-string>
JWT_REFRESH_SECRET=<32-char-random-string>
ENCRYPTION_KEY=<32-byte-hex-string>

# Application
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# Optional
REDIS_URL=redis://...
CODECOV_TOKEN=...
```

#### Deployment Commands

```bash
# Deploy to preview (automatic on PRs)
npm run deploy:preview

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

#### GitHub Actions Deployment

Deployments are automated via GitHub Actions:

- **Preview**: Every pull request
- **Staging**: Push to `develop` branch
- **Production**: Push to `main` branch

All deployments include:
1. Build all packages
2. Run database migrations
3. Health check validation
4. Optional demo data seeding

### Database Migrations on Deployment

Migrations run automatically via GitHub Actions workflow:

```yaml
# .github/workflows/deploy.yml
- name: Run database migrations
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: npm run db:migrate
```

### Health Check Endpoint

All deployments include health check at `/health`:

```bash
curl https://your-app.vercel.app/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-13T12:00:00.000Z",
  "environment": "production",
  "database": {
    "status": "connected",
    "responseTime": 45
  }
}
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

#### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers**: Pull requests, pushes to `main`/`develop`

**Jobs**:
1. **Lint** (Node 20 & 22) - ESLint validation
2. **Type Check** (Node 20 & 22) - TypeScript compilation
3. **Test** (Node 20 & 22) - Vitest with PostgreSQL
4. **Build** - Production build (depends on all above)
5. **License Compliance** - Check dependency licenses
6. **Bundle Size** - Analyze and report bundle sizes

**Branch Protection**: All jobs must pass before merge

#### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers**: Push to `main` (production), `develop` (staging)

**Steps**:
1. Build all packages
2. Run database migrations
3. Deploy to Vercel
4. Run health checks
5. Optional: Seed demo data (staging only)

#### 3. E2E Tests (`.github/workflows/e2e-tests.yml`)

**Triggers**: Manual, nightly schedule

**Steps**:
1. Deploy to test environment
2. Run Playwright E2E tests
3. Generate test report
4. Upload screenshots/videos on failure

### Pre-commit Hooks

**MANDATORY** - Runs on every commit via Husky:

```bash
# .husky/pre-commit
npm run build          # Build all packages
npm run lint           # Lint (max 0 warnings)
npm run typecheck      # Type check (max 0 errors)
npm run test:coverage  # Tests with coverage
```

**Cannot be bypassed** - Never use `--no-verify` or `-n`

---

## Common Patterns

### Adding a New Vertical

1. **Create directory structure**

```bash
mkdir -p verticals/new-vertical/src/{types,validation,repository,service,api,__tests__}
```

2. **Add package.json**

```json
{
  "name": "@care-commons/new-vertical",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

3. **Define types** (`src/types/index.ts`)
4. **Add validation** (`src/validation/validator.ts`)
5. **Create repository** (`src/repository/repository.ts`)
6. **Create service** (`src/service/service.ts`)
7. **Add API handlers** (`src/api/handlers.ts`)
8. **Write tests** (`src/__tests__/*`)
9. **Create migration** (`packages/core/migrations/`)
10. **Register routes** in `packages/app/src/routes.ts`
11. **Document** in `README.md`

### Implementing Authentication

All API endpoints require authentication via JWT:

```typescript
// middleware/auth-middleware.ts
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract token from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedError('Missing token');
    }

    // 2. Verify JWT
    const payload = jwt.verify(token, process.env.JWT_SECRET!);

    // 3. Load user context
    const userContext = await loadUserContext(payload.userId);

    // 4. Attach to request
    req.userContext = userContext;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
```

### Permission Checking

```typescript
// Check single permission
if (!context.permissions.includes('clients:create')) {
  throw new PermissionError('Missing clients:create permission');
}

// Check multiple permissions (any)
const hasAnyPermission = context.permissions.some(p =>
  ['clients:create', 'clients:update'].includes(p)
);

// Check branch access
if (!context.branchIds.includes(branchId)) {
  throw new PermissionError('No access to this branch');
}
```

### Pagination Pattern

```typescript
// Service method
async searchClients(
  filters: ClientFilters,
  pagination: PaginationParams,
  context: UserContext
): Promise<PaginatedResult<Client>> {
  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;

  const [items, total] = await Promise.all([
    this.repository.search(filters, { limit, offset }),
    this.repository.count(filters),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

### Soft Delete Pattern

```typescript
// Repository
async softDelete(id: string, userId: string): Promise<void> {
  await this.db('clients')
    .where({ id })
    .update({
      deleted_at: new Date(),
      deleted_by: userId,
    });
}

// Always filter out soft-deleted records
async findById(id: string): Promise<Client | null> {
  return await this.db('clients')
    .where({ id, deleted_at: null })  // Filter soft-deleted
    .first();
}
```

### Audit Logging Pattern

```typescript
// After every mutation
await this.auditService.log({
  action: 'client.created',
  userId: context.userId,
  resourceType: 'client',
  resourceId: client.id,
  changes: {
    before: null,
    after: client,
  },
  timestamp: new Date(),
});
```

---

## Best Practices

### Security

1. **Input validation** - Always validate with Zod schemas
2. **Permission checks** - Every service method checks UserContext
3. **SQL injection prevention** - Use Knex parameterized queries
4. **XSS prevention** - Sanitize all user input
5. **Encryption** - Encrypt sensitive fields (SSN, etc.)
6. **Rate limiting** - Apply to all API endpoints
7. **CORS** - Configure allowed origins
8. **Headers** - Security headers via Helmet.js

### Performance

1. **Database indexes** - Index frequently queried columns
2. **Connection pooling** - Use Neon pooled connections
3. **Pagination** - Always paginate large result sets
4. **Caching** - Cache frequently accessed data (Redis)
5. **Lazy loading** - Load related data only when needed
6. **Bundle optimization** - Tree shaking, code splitting

### Code Quality

1. **TypeScript strict mode** - Enable all strict flags
2. **ESLint** - Zero warnings policy
3. **Test coverage** - Meet coverage thresholds
4. **Code review** - All changes require review
5. **Documentation** - JSDoc for public APIs
6. **Consistent naming** - Follow naming conventions
7. **DRY principle** - Avoid code duplication

### Git Practices

1. **Small commits** - Atomic, focused commits
2. **Descriptive messages** - Follow commit message format
3. **Feature branches** - One branch per feature
4. **Rebase, don't merge** - Keep history clean
5. **PR descriptions** - Detailed description with screenshots
6. **Link issues** - Reference related issues

### Common Mistakes to Avoid

❌ **Don't bypass pre-commit hooks**
```bash
git commit -n  # NEVER DO THIS
```

❌ **Don't use `any` type**
```typescript
function process(data: any) { }  // Use proper types
```

❌ **Don't modify existing migrations**
```typescript
// If migration is committed, create a new one
```

❌ **Don't skip permission checks**
```typescript
async createClient(input: Input) {
  // Missing: permission check
  return await this.repository.create(input);
}
```

❌ **Don't use raw SQL**
```typescript
// Use Knex query builder
await db.raw('SELECT * FROM clients WHERE id = ?', [id]);
```

❌ **Don't forget audit logs**
```typescript
async deleteClient(id: string) {
  await this.repository.delete(id);
  // Missing: audit log
}
```

---

## Troubleshooting

### Build Failures

```bash
# Clear build cache and rebuild
npm run dev:clean
npm install
npm run build
```

### Test Failures

```bash
# Reset test database
npm run db:nuke
npm run db:migrate
npm run db:seed

# Run specific test
npm test -- client-service.test.ts
```

### Migration Issues

```bash
# Check migration status
npm run db:migrate:status

# Rollback last migration
npm run db:migrate:rollback

# Reset database (⚠️ DESTRUCTIVE)
npm run db:nuke && npm run db:migrate && npm run db:seed
```

### Deployment Issues

```bash
# Check environment variables
vercel env ls

# View deployment logs
vercel logs <deployment-url>

# Rollback deployment
vercel promote <previous-deployment-url>
```

### Database Connection Issues

#### Cloud Database Connection Failures

If you cannot connect to cloud databases (Neon, Supabase) due to network restrictions:

```bash
# Error: "getaddrinfo ENOTFOUND" or DNS resolution failures
# Solution: Set up local PostgreSQL (see Sandboxed Environment Setup above)

# Quick setup:
pg_ctlcluster 16 main start
su - postgres -c "psql -c 'CREATE DATABASE care_commons;'"
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/care_commons"
npm run db:migrate
npm run db:seed
```

#### General Connection Issues

```bash
# Test connection
psql -h host -U user -d database

# Check connection string
echo $DATABASE_URL

# For Neon: Ensure using pooled connection string
# Should end with ?pgbouncer=true or use port 6543

# For local PostgreSQL: Ensure service is running
sudo systemctl status postgresql
# Or for pg_ctlcluster:
pg_lsclusters
pg_ctlcluster 16 main status

# Check PostgreSQL logs
tail -f /var/log/postgresql/postgresql-16-main.log
```

---

## Additional Resources

- **Main README**: [`README.md`](./README.md) - Project overview
- **Contributing Guide**: [`CONTRIBUTING.md`](./CONTRIBUTING.md) - Contribution guidelines
- **API Documentation**: http://localhost:3000/api-docs - Swagger UI
- **Deployment Guide**: [`DEPLOYMENT.md`](./DEPLOYMENT.md) - Deployment instructions
- **Vertical READMEs**: `verticals/*/README.md` - Feature documentation

---

## Quick Reference

### Essential Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm test` | Run all tests |
| `npm run build` | Build all packages |
| `npm run lint` | Lint code |
| `npm run typecheck` | Type check |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed database |
| `git commit` | Commit (runs pre-commit hooks) |

### Key Files

| File | Purpose |
|------|---------|
| `package.json` | Root package configuration |
| `turbo.json` | Turborepo build configuration |
| `tsconfig.base.json` | Base TypeScript configuration |
| `vercel.json` | Vercel deployment configuration |
| `.env.example` | Environment variable template |
| `.github/workflows/ci.yml` | CI pipeline |

---

**Last Updated:** 2025-11-13
**Maintainer:** Neighborhood Lab
**Questions?** Open an issue on GitHub

---

*This document is maintained for AI assistants working on Care Commons. Keep it updated as the codebase evolves.*
