# CLAUDE.md - Technical Reference for AI Assistants

**Document Date:** November 2025  
**Repository:** https://github.com/neighborhood-lab/folkcare  
**For OpenCode/Claude Desktop:** See [AGENTS.md](./AGENTS.md) for implementation directives

> Quick technical reference for AI assistants. For comprehensive agent directives, workflows, and deployment procedures, see AGENTS.md.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Claude Code Setup](#claude-code-setup)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Key Patterns](#key-patterns)
- [Development Commands](#development-commands)
- [Database Schema](#database-schema)
- [Testing Patterns](#testing-patterns)

---

## Quick Start

### Setup

```bash
# Clone and install
git clone https://github.com/neighborhood-lab/folkcare.git
cd folkcare
nvm use  # Use Node.js 22.x
npm install

# Database setup
cp .env.example packages/core/.env
# Edit packages/core/.env with your DATABASE_URL

# Run migrations and seed
npm run db:migrate
npm run db:seed

# Start development
npm run dev
```

### Essential Commands

```bash
npm run dev          # Start all packages in watch mode
npm run build        # Build all packages for production
npm run lint         # Lint all packages
npm run typecheck    # Type check all packages
npm run test         # Run all tests
./scripts/check.sh   # Full validation (lint + typecheck + test + build)
```

---

## Claude Code Setup

### Required MCP Servers

Claude Code uses Model Context Protocol (MCP) servers to extend capabilities. This project requires the following MCP servers:

**Essential Servers** (required):
- `sequential-thinking` - Extended reasoning for complex problems
- `fetch` - Web content retrieval with image support
- `filesystem` - File operations with proper permissions
- `github` - GitHub API access (issues, PRs, commits)
- `postgres` - Direct database queries and schema inspection

**Installation**:
```bash
# Set up secrets first
source .secrets.txt

# Add GitHub MCP
claude mcp add github npx -- -y @modelcontextprotocol/server-github -e GITHUB_TOKEN=$GITHUB_TOKEN

# Add PostgreSQL MCP
claude mcp add postgres npx -- -y @modelcontextprotocol/server-postgres $DATABASE_URL_PRODUCTION

# Verify all servers
claude mcp list
```

### Custom Slash Commands

The `.claude/commands/` directory contains project-specific slash commands:

| Command | Description |
|---------|-------------|
| `/quick-check` | Run lint + typecheck (fast validation) |
| `/full-check` | Run complete CI suite (lint + typecheck + test + build) |
| `/capture-showcase` | Capture screenshots of local showcase |
| `/capture-production` | Capture screenshots of production showcase |
| `/db-reset-local` | Reset local database with demo data |
| `/github-status` | Check GitHub Actions workflow status |
| `/vercel-status` | Check recent Vercel deployments |

### Environment Variables

Ensure these are set in your shell and accessible to Claude Code:

```bash
# Required for GitHub MCP
GITHUB_TOKEN=ghp_...

# Required for PostgreSQL MCP
DATABASE_URL_PRODUCTION=postgresql://...
DATABASE_URL_PREVIEW=postgresql://...

# Required for deployment operations
VERCEL_TOKEN=...
DISCORD_WEBHOOK_URL=...
```

All secrets should be stored in `.secrets.txt` (gitignored) and sourced when needed.

### Screenshot Verification Workflow

Screenshots are the #1 verification technique. After making UI changes:

1. Capture local screenshots: `/capture-showcase`
2. Review in `ui-screenshots-personas/showcase/`
3. Deploy to develop branch
4. Capture production screenshots: `/capture-production`
5. Compare to verify deployment

---

## Architecture Overview

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | TypeScript/Node.js + Express | REST API server |
| **Database** | PostgreSQL 14+ | Relational data with JSONB |
| **Frontend** | React 19 + Vite | Web application |
| **Mobile** | React Native (Expo) | Mobile EVV app (caregiver-first) |
| **Validation** | Zod | Runtime type safety |
| **Testing** | Vitest | ESM-native testing |
| **Build** | Turborepo | Monorepo orchestration |
| **Deployment** | Vercel + Neon | Serverless hosting |

### Core Principles

1. **ESM Everywhere**: All imports use `.js` extensions, `type: "module"` in package.json
2. **Monorepo**: Turborepo manages packages and verticals
3. **Service Layer**: Business logic separated from data access
4. **Repository Pattern**: Database access encapsulated
5. **Permission-Based**: Fine-grained access control via `PermissionService`
6. **Audit Trail**: Immutable revision history for compliance

---

## Project Structure

```
folkcare/
├── packages/
│   ├── core/              # Shared domain logic, database, permissions
│   │   ├── src/
│   │   │   ├── db.ts      # Knex database connection
│   │   │   ├── types.ts   # Shared TypeScript types
│   │   │   ├── audit.ts   # Audit logging service
│   │   │   └── permissions.ts  # Permission service
│   │   ├── migrations/    # Database migrations
│   │   └── scripts/       # DB utilities (seed, migrate, reset)
│   ├── app/               # Express REST API
│   │   ├── src/
│   │   │   ├── server.ts  # Express app setup
│   │   │   ├── middleware/ # Auth, error handling, etc.
│   │   │   └── routes/    # API route handlers
│   │   └── tests/         # Integration tests
│   ├── web/               # React frontend
│   │   └── src/
│   │       ├── pages/     # Page components
│   │       ├── components/ # Shared components
│   │       └── services/  # API client services
│   ├── mobile/            # React Native mobile app
│   │   ├── app/           # Expo Router pages
│   │   ├── components/    # Mobile components
│   │   └── services/      # Offline sync, API client
│   └── shared-components/ # Shared UI components (web + mobile)
│       └── src/
│           ├── forms/     # Form components
│           └── utils/     # Shared utilities
├── verticals/             # Business domain modules
│   ├── client-demographics/   # Client records
│   ├── caregiver-staff/       # Caregiver management
│   ├── scheduling-visits/     # Scheduling & visits
│   ├── time-tracking-evv/     # EVV compliance
│   ├── care-plans-tasks/      # Care plans
│   ├── billing-invoicing/     # Billing
│   ├── family-engagement/     # Family portal
│   └── [others]/              # Additional verticals
├── showcase/              # Static demo (GitHub Pages, localStorage)
├── api/                   # Vercel serverless functions
│   └── index.mts          # Entry point (.mts = explicit ESM)
├── scripts/               # Repository utilities
└── e2e/                   # Playwright E2E tests
```

### Vertical Structure

Each vertical follows this pattern:

```
verticals/vertical-name/
├── src/
│   ├── service.ts         # Business logic layer
│   ├── repository.ts      # Database access layer
│   ├── types.ts           # TypeScript types
│   ├── routes.ts          # Express route handlers
│   └── validation.ts      # Zod schemas
├── tests/
│   ├── service.test.ts    # Service unit tests
│   └── routes.test.ts     # API integration tests
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript config
```

---

## Key Patterns

### Service-Repository Pattern

**Repository** (Data Access):
```typescript
// verticals/client-demographics/src/repository.ts
export class ClientRepository {
  constructor(private db: Knex) {}

  async findById(id: string): Promise<Client | null> {
    const row = await this.db('clients')
      .where({ id, is_deleted: false })
      .first();
    return row ? this.mapToClient(row) : null;
  }

  async create(data: CreateClientData): Promise<Client> {
    const [row] = await this.db('clients')
      .insert(data)
      .returning('*');
    return this.mapToClient(row);
  }
}
```

**Service** (Business Logic):
```typescript
// verticals/client-demographics/src/service.ts
export class ClientService {
  constructor(
    private repository: ClientRepository,
    private auditService: AuditService,
    private permissionService: PermissionService
  ) {}

  async getClient(id: string, userId: string): Promise<Client> {
    // Check permissions
    await this.permissionService.requirePermission(
      userId,
      'clients',
      'read'
    );

    const client = await this.repository.findById(id);
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    // Log audit trail
    await this.auditService.log({
      userId,
      action: 'read',
      resource: 'client',
      resourceId: id
    });

    return client;
  }
}
```

### Permission Checking

```typescript
// Check permission
await permissionService.requirePermission(userId, 'clients', 'read');

// Check multiple permissions
await permissionService.requireAnyPermission(userId, [
  ['clients', 'read'],
  ['clients', 'write']
]);

// Check permission and get scoping
const { organizationId } = await permissionService.getPermissionScope(
  userId,
  'clients',
  'read'
);
```

### Audit Logging

```typescript
// Log audit trail
await auditService.log({
  userId,
  action: 'update',
  resource: 'client',
  resourceId: clientId,
  changes: { firstName: 'New Name' }
});
```

### ESM Import Rules

```typescript
// ✅ CORRECT - Always use .js extension
import { ClientService } from './service.js';
import { getDatabase } from '@folkcare/core/db.js';

// ❌ WRONG - No extension
import { ClientService } from './service';

// ❌ WRONG - CommonJS
const { getDatabase } = require('./db');
```

### Zod Validation

```typescript
import { z } from 'zod';

// Define schema
export const createClientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  organizationId: z.string().uuid()
});

// Validate in route handler
app.post('/api/clients', async (req, res) => {
  const data = createClientSchema.parse(req.body);
  const client = await clientService.createClient(data, req.user.id);
  res.json(client);
});
```

---

## Development Commands

### GitHub Operations (IMPORTANT)

**Use REST API, NOT `gh` CLI**

The `gh` CLI uses GraphQL which has strict rate limits and blocks new accounts. Use our **SINGLE** REST API wrapper instead:

```bash
# Set your GitHub token
export GITHUB_TOKEN="ghp_your_token_here"

# Create an issue
./scripts/github-api.sh issue-create "Title" "Body" "label1,label2"

# Create a pull request
./scripts/github-api.sh pr-create "Title" "Body" "feature/branch" "develop"

# List issues/PRs
./scripts/github-api.sh issue-list open
./scripts/github-api.sh pr-list open
```

**CRITICAL - Single Entry Point:**
- ✅ **ADD to `scripts/github-api.sh`** when you need new GitHub functionality
- ❌ **DO NOT create separate scripts** (`gh-issue.sh`, `gh-pr.sh`, etc.)
- ✅ **One script for ALL GitHub operations**

**Why?**
- ✅ REST API: 5,000 calls/hour, works for all accounts
- ❌ GraphQL (gh CLI): Rate limited, blocked for new accounts
- See `scripts/README.md` for detailed usage

### Database

```bash
# Run migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback

# Seed database
npm run db:seed

# Reset database (DESTRUCTIVE)
npm run db:reset

# Create new migration
npm run db:migration:create my_migration_name
```

### Development Server

```bash
# Start all packages in watch mode
npm run dev

# Start specific package
npm run dev --filter=@folkcare/app
```

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test verticals/client-demographics/tests/service.test.ts
```

### Linting & Type Checking

```bash
# Lint all packages
npm run lint

# Lint with auto-fix
npm run lint:fix

# Type check all packages
npm run typecheck
```

### Build

```bash
# Build all packages
npm run build

# Build specific package
npm run build --filter=@folkcare/app

# Clean build artifacts
npm run clean
```

---

## Database Schema

### Core Tables

**users** - User accounts
- `id` (uuid, PK)
- `email` (text, unique)
- `password_hash` (text)
- `first_name`, `last_name` (text)
- `role` (text) - 'admin', 'coordinator', 'caregiver', 'client', 'family'
- `organization_id` (uuid, FK → organizations)
- `created_at`, `updated_at` (timestamp)
- `is_deleted` (boolean)

**organizations** - Care agencies
- `id` (uuid, PK)
- `name` (text)
- `primary_address` (jsonb)
- `settings` (jsonb)
- `created_by`, `updated_by` (uuid, FK → users)
- `created_at`, `updated_at` (timestamp)

**permissions** - User permissions
- `id` (uuid, PK)
- `user_id` (uuid, FK → users)
- `resource` (text) - 'clients', 'caregivers', 'visits', etc.
- `action` (text) - 'create', 'read', 'update', 'delete'
- `scope` (jsonb) - Organization/client scoping
- `granted_by` (uuid, FK → users)
- `created_at` (timestamp)

**audit_logs** - Compliance audit trail
- `id` (uuid, PK)
- `user_id` (uuid, FK → users)
- `action` (text)
- `resource` (text)
- `resource_id` (uuid)
- `changes` (jsonb)
- `created_at` (timestamp)

### Vertical Tables

Each vertical adds its own tables. Common patterns:

- **Soft deletes**: `is_deleted` boolean
- **Demo data**: `is_demo_data` boolean (for seeding)
- **Audit fields**: `created_by`, `updated_by`, `created_at`, `updated_at`
- **Revisions**: Some tables have `*_revisions` tables for immutable history

---

## Testing Patterns

### Unit Tests (Service Layer)

```typescript
// verticals/client-demographics/tests/service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientService } from '../src/service.js';

describe('ClientService', () => {
  let service: ClientService;
  let mockRepository: any;
  let mockAuditService: any;
  let mockPermissionService: any;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      create: vi.fn()
    };
    mockAuditService = {
      log: vi.fn()
    };
    mockPermissionService = {
      requirePermission: vi.fn(),
      getPermissionScope: vi.fn()
    };

    service = new ClientService(
      mockRepository,
      mockAuditService,
      mockPermissionService
    );
  });

  it('should get client by id', async () => {
    const client = { id: '123', firstName: 'John' };
    mockRepository.findById.mockResolvedValue(client);
    mockPermissionService.requirePermission.mockResolvedValue(undefined);

    const result = await service.getClient('123', 'user-1');

    expect(result).toEqual(client);
    expect(mockPermissionService.requirePermission).toHaveBeenCalledWith(
      'user-1',
      'clients',
      'read'
    );
    expect(mockAuditService.log).toHaveBeenCalled();
  });
});
```

### Integration Tests (API Routes)

```typescript
// verticals/client-demographics/tests/routes.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '@folkcare/app/server.js';
import { getDatabase } from '@folkcare/core/db.js';

describe('Client API', () => {
  let app: Express;
  let db: Knex;
  let authToken: string;

  beforeEach(async () => {
    db = getDatabase();
    app = createApp();
    
    // Create test user and get auth token
    const user = await createTestUser(db);
    authToken = generateTestToken(user.id);
  });

  afterEach(async () => {
    await db('clients').where({ is_demo_data: true }).del();
  });

  it('should create a client', async () => {
    const response = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1980-01-01'
      });

    expect(response.status).toBe(201);
    expect(response.body.firstName).toBe('John');
  });
});
```

### Test Constants

```typescript
// Use fixed timestamps for deterministic tests
export const TEST_TIMESTAMP = '2025-01-01T00:00:00.000Z';
export const TEST_DATE = '2025-01-01';

// Mock Date.now() in tests
vi.spyOn(global.Date, 'now').mockReturnValue(
  new Date(TEST_TIMESTAMP).getTime()
);
```

---

## Quick Reference

### Common Errors

**Module Resolution Error**
```
Cannot find module './service' or its corresponding type declarations
```
**Fix**: Add `.js` extension to import: `import { Service } from './service.js';`

**Database Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Fix**: Check DATABASE_URL in `packages/core/.env`

**Pre-commit Hook Failure**
```
ERROR: Pre-commit hooks failed
```
**Fix**: Run `./scripts/check.sh` locally, fix all errors before committing

### File Naming Conventions

- **Routes**: `routes.ts` (express handlers)
- **Service**: `service.ts` (business logic)
- **Repository**: `repository.ts` (data access)
- **Types**: `types.ts` (TypeScript interfaces)
- **Validation**: `validation.ts` (Zod schemas)
- **Tests**: `*.test.ts` (co-located with source)

### Import Aliases

```typescript
// Workspace packages
import { getDatabase } from '@folkcare/core/db.js';
import { createApp } from '@folkcare/app/server.js';

// Verticals
import { ClientService } from '@folkcare/client-demographics';
import { CaregiverService } from '@folkcare/caregiver-staff';
```

---

## Deployment & Branching

### Branch Strategy

**Workflow**: `feature/*` → `develop` → `preview` → `production`

| Branch | Environment | URL |
|--------|-------------|-----|
| `production` | Production | folk.care |
| `preview` | Preview | preview-*.vercel.app |
| `develop` | GitHub Pages | folk.care/ |

**NOTE**: There is no `main` branch. This is intentional.

### Showcase Demo

Static client-side demo at https://folk.care/
- Uses localStorage (no backend)
- Multi-role experience (patient, family, caregiver, coordinator, admin)
- Includes mobile app simulator (work in progress)

### Screenshot Capture

AI agents can visually inspect the UI and **read PNG files directly**:

```bash
# Showcase (local or production)
npx tsx scripts/capture-screenshots.ts --showcase-only
npx tsx scripts/capture-screenshots.ts --showcase-only --production

# iOS Simulator (requires Expo running)
npx tsx scripts/capture-ios-screenshots.ts --name screen-name

# Mobile E2E with Detox
cd packages/mobile && npm run test:e2e
```

**CRITICAL: Screenshots are the #1 verification technique.** You (the LLM) can read/see image files directly. Manual E2E testing by visually inspecting screenshots is critical for quality assurance. Always capture and review screenshots to verify UI changes.

### Authentication Notes

**Working**: Demo logins (e.g., `admin@folkcare.example`)

**Not fully implemented**: Google OAuth, Stripe billing, multi-tenant signup

### Secrets

- Ask user for secrets when needed - they will provide securely
- Store ALL secrets in `.secrets.txt` (single consolidated file, gitignored)
- Also use `.env` files for environment-specific config (gitignored)
- **NEVER** commit secrets or expose in client-side code
- **NEVER** put secrets in GitHub issues, PRs, or comments
- Common: `GITHUB_TOKEN`, `DISCORD_WEBHOOK_URL`, `DATABASE_URL`, `JWT_SECRET`, `VERCEL_TOKEN`

### Vercel CLI

```bash
# Check current project
vercel project ls

# List environment variables
vercel env ls

# Update environment variable (remove then add)
vercel env rm VAR_NAME production --yes
echo "new_value" | vercel env add VAR_NAME production

# Trigger redeploy (needed after env var changes)
vercel --prod --yes

# Check deployment logs
vercel logs <deployment-url>
```

### Neon CLI

```bash
# List projects
neon projects list

# List branches (preview/production)
neon branches list --project-id <project-id>

# Get connection string
neon connection-string --project-id <project-id> --branch production --pooled

# Reset password (via API - CLI doesn't have this command)
# Use curl with access token from ~/.config/neonctl/credentials.json
curl -X POST "https://console.neon.tech/api/v2/projects/<project-id>/branches/<branch-id>/roles/<role-name>/reset_password" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Project IDs:**
- folkcare: `spring-rice-86403246`
- Production branch: `br-solitary-glitter-aemgucz8`
- Preview branch: `br-sparkling-haze-aemthibi`

---

## Vibe Coding Workflow

**THE BUCK STOPS WITH YOU**: You are your own code reviewer and merger for the develop branch.
- Drive issues from creation through merge to develop
- You create PRs, verify CI, review changes yourself, and merge
- No waiting on human review for develop branch
- Keep Discord dev-team channel updated with progress

**Speed is Essential**: You are way faster than a human developer. We maintain ~80% of human dev team best practices, but ~20% no longer apply. This is vibe coding - keep things moving at lightning speed.

**Full Authority**: You are domain expert, CTO, dev manager, all-star dev, product manager, designer, UI badass, database guru, and API stud. Do not downgrade to worse alternatives - stop and ask for help logging into things.

## Agent-Human Communication

**Issue Labels**:
- `HUMAN` - Tasks requiring Brian's action (non-blocking for agent)
- No special label - Tasks for agent to work on later

**When Blocked**: Prompt Brian inline immediately.

**When NOT Blocked**: Create GitHub issue instead of inline prompts.

**Discord Updates**: Post to dev-team channel for significant progress, completions, and blockers.

**Brian's Contact** (for external communications):
- Brian Edwards, 512-584-6841, brian.mabry.edwards@gmail.com
- Always CC Brian, never use placeholders

**GitHub Actions Timing**: Each job should take ~3 minutes. If >5 minutes, investigate.

## Async Workflow (Critical)

**NEVER wait, sleep, or thrash** on long-running operations. See AGENTS.md for full details.

**Key Rules**:
1. **Never wait** on CI/deployments - switch to background tasks immediately
2. **Never thrash** by repeatedly checking status - check once, note state, move on
3. **Always leave state on GitHub** - open Draft PRs early, update issues
4. **Use time-slice task selection** to ensure no task type starves

**Time-Slice Lookup** (by minute in hour):
- 0-8: screenshot-review
- 9-17: issue-triage  
- 18-26: documentation
- 27-32: code-review
- 33-38: backlog-grooming
- 39-44: dependency-audit
- 45-50: test-coverage
- 51-56: marketing-prep
- 57-59: quick-wins

**Crash Recovery**: Keep a GitHub issue "Agent Session State - [Date]" with current task and waiting-on status.

---

## Async Work Management

**NEVER wait or sleep** for long-running operations. Instead, leave WIP on GitHub and switch tasks.

**Draft PRs for WIP**: When blocked on CI, open a Draft PR with clear notes (e.g., "WIP - awaiting CI").

**Time-Sliced Task Selection**: To avoid starving non-urgent work, use this lookup table:

| Minute | Category |
|--------|----------|
| 0-14 | Bug fixes (blocking) |
| 15-29 | Feature implementation |
| 30-39 | Code review / PR fixes |
| 40-47 | Documentation / screenshots |
| 48-54 | Issue triage / creation |
| 55-59 | Tech debt / refactoring |

When switching tasks: Check current minute → look up category → pick task from that category.

**GitHub as Source of Truth**: All state should be visible on GitHub (branches, draft PRs, issue comments). Never keep significant state only locally - this ensures crash recovery works.

See **[AGENTS.md](./AGENTS.md)** for comprehensive workflow details.

---

## See Also

- **[AGENTS.md](./AGENTS.md)** - Comprehensive agent implementation directives
- **[DEV_SETUP.md](./DEV_SETUP.md)** - Development environment setup
- **[DEV_WORKFLOW.md](./DEV_WORKFLOW.md)** - Day-to-day development workflow
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide
- **[docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)** - REST API reference

---

**Folk** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
