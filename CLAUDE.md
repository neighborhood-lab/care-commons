# CLAUDE.md - Technical Reference for AI Assistants

**Document Date:** November 2025  
**Repository:** https://github.com/neighborhood-lab/care-commons  
**For OpenCode/Claude Desktop:** See [AGENTS.md](./AGENTS.md) for implementation directives

> Quick technical reference for AI assistants. For comprehensive agent directives, workflows, and deployment procedures, see AGENTS.md.

---

## Table of Contents

- [Quick Start](#quick-start)
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
git clone https://github.com/neighborhood-lab/care-commons.git
cd care-commons
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

## Architecture Overview

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | TypeScript/Node.js + Express | REST API server |
| **Database** | PostgreSQL 14+ | Relational data with JSONB |
| **Frontend** | React 19 + Vite | Web application |
| **Mobile** | React Native (Expo) | Mobile application |
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
care-commons/
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
import { getDatabase } from '@care-commons/core/db.js';

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
npm run dev --filter=@care-commons/app
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
npm run build --filter=@care-commons/app

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
import { createApp } from '@care-commons/app/server.js';
import { getDatabase } from '@care-commons/core/db.js';

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
import { getDatabase } from '@care-commons/core/db.js';
import { createApp } from '@care-commons/app/server.js';

// Verticals
import { ClientService } from '@care-commons/client-demographics';
import { CaregiverService } from '@care-commons/caregiver-staff';
```

---

## See Also

- **[AGENTS.md](./AGENTS.md)** - Comprehensive agent implementation directives
- **[DEV_SETUP.md](./DEV_SETUP.md)** - Development environment setup
- **[DEV_WORKFLOW.md](./DEV_WORKFLOW.md)** - Day-to-day development workflow
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide
- **[docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)** - REST API reference

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
