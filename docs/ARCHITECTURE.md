# Architecture Overview

> **Care Commons System Architecture**  
> Last Updated: November 27, 2025

## Table of Contents

- [Philosophy](#philosophy)
- [System Overview](#system-overview)
- [Core Principles](#core-principles)
- [Technology Stack](#technology-stack)
- [Monorepo Structure](#monorepo-structure)
- [Data Architecture](#data-architecture)
- [Security Architecture](#security-architecture)
- [Deployment Architecture](#deployment-architecture)
- [State Management](#state-management)
- [API Design](#api-design)
- [Testing Strategy](#testing-strategy)

---

## Philosophy

Care Commons is designed around these fundamental principles:

### 1. Human-Scale, Not Enterprise-Scale

Traditional healthcare IT systems are designed for large hospital networks with complex enterprise requirements. Care Commons is built for **small to medium home healthcare agencies** (5-100 employees) that need:

- Simple workflows without enterprise complexity
- Quick setup without months of implementation
- Affordable pricing without vendor lock-in
- Easy customization for agency-specific needs

### 2. Vertical Architecture

Instead of a monolithic application, Care Commons is organized as **independently deployable verticals**:

```
Core ────┬──── Client Demographics
         ├──── Caregiver Staff
         ├──── Scheduling & Visits
         ├──── Time Tracking & EVV
         ├──── Care Plans & Tasks
         ├──── Billing & Invoicing
         └──── ... (more verticals)
```

Each vertical:
- Has its own **database schema** (in `schema.sql`)
- Provides its own **API routes** (in `routes.ts`)
- Implements its own **repository pattern** (in `repository.ts`)
- Defines its own **domain types** (in `types.ts`)
- Can be **deployed independently** (future capability)

### 3. State-Specific Compliance

Home healthcare regulations vary dramatically by state. Care Commons handles this by:

- **Regulatory database**: State-specific rules stored as data, not code
- **Dynamic validation**: Rules applied at runtime based on client location
- **Extensible design**: New states can be added without code changes
- **Compliance engine**: Centralized logic for EVV, licensing, background checks

Example: Texas requires HHAeXchange EVV aggregator submission with 100m geofence tolerance, while Florida uses Sandata with 150m tolerance. Care Commons applies the correct rules automatically.

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Web App (React)  │  Mobile App (React Native)  │  API Clients │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Express Server (packages/app)                                  │
│  - Authentication (JWT)                                         │
│  - Authorization (Permission Service)                           │
│  - Rate Limiting                                                │
│  - Request Validation (Zod)                                     │
│  - Audit Logging                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       VERTICAL LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Verticals (Business Logic)                                     │
│  - Client Demographics   - Caregiver Staff                      │
│  - Scheduling & Visits   - Time Tracking & EVV                  │
│  - Care Plans & Tasks    - Billing & Invoicing                  │
│  - Family Engagement     - Payroll Processing                   │
│  - Analytics & Reporting - Quality Assurance                    │
│                                                                 │
│  Each vertical provides:                                        │
│  - Repository (data access)                                     │
│  - Service (business logic)                                     │
│  - Routes (API endpoints)                                       │
│  - Types (domain model)                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CORE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Shared Infrastructure (packages/core)                          │
│  - Database (PostgreSQL connection, migrations)                 │
│  - Permissions (role-based access control)                      │
│  - Audit (change tracking, revision history)                    │
│  - Types (base types, interfaces)                               │
│  - Utilities (validation, encryption, logging)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL 17                                                  │
│  - JSONB for flexible schemas                                   │
│  - Row-level security (future)                                  │
│  - Audit triggers                                               │
│  - Performance indexes (83 indexes)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Principles

### 1. Repository Pattern

Every vertical implements the **Repository Pattern** for data access:

```typescript
// verticals/client-demographics/src/repository.ts
export class ClientDemographicsRepository {
  constructor(private db: DatabaseConnection) {}

  async createClient(data: CreateClientInput): Promise<Client> {
    // Data access logic
  }

  async getClient(id: string): Promise<Client | null> {
    // Data access logic
  }
}
```

**Benefits:**
- Separation of concerns (data access vs. business logic)
- Easy to test (mock the repository)
- Consistent API across verticals
- Database abstraction (could swap PostgreSQL for another DB)

### 2. Permission-Based Access Control

Fine-grained permissions control what users can see and do:

```typescript
// packages/core/src/permissions/service.ts
export class PermissionService {
  async checkPermission(
    userId: string,
    resource: string,
    action: 'create' | 'read' | 'update' | 'delete'
  ): Promise<boolean> {
    // Permission check logic
  }
}
```

**Permission Model:**
- **Resources**: `client`, `caregiver`, `visit`, `care_plan`, etc.
- **Actions**: `create`, `read`, `update`, `delete`
- **Scopes**: Organization-scoped, role-based
- **Field-level**: Some fields require additional permissions (e.g., SSN)

**Example:**
- Coordinator can `read` all clients in their organization
- Caregiver can only `read` clients assigned to them
- Family member can only `read` their loved one's non-sensitive data
- Administrator can `read` all fields including SSN

### 3. Audit Trail

Every data change is logged for compliance:

```typescript
// packages/core/src/audit/logger.ts
export async function logAudit(params: {
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
}) {
  // Insert into audit_log table
}
```

**Audit Events:**
- User authentication/authorization
- Data creation, update, deletion
- Permission grants/revokes
- Configuration changes
- PHI access (HIPAA requirement)

### 4. Event-Driven Architecture

Visit lifecycle events trigger cross-vertical workflows:

```typescript
// Visit lifecycle events
enum VisitEvent {
  SCHEDULED = 'visit.scheduled',
  STARTED = 'visit.started',
  COMPLETED = 'visit.completed',
  CANCELLED = 'visit.cancelled',
  EXCEPTION = 'visit.exception'
}
```

**Event Handlers:**
- `visit.started` → Update caregiver location, start EVV timer
- `visit.completed` → Process timesheet, generate invoice line item
- `visit.exception` → Create incident report, notify supervisor

---

## Technology Stack

### Backend

| Technology | Purpose | Why |
|------------|---------|-----|
| **Node.js 22.x** | Runtime | Required for Vercel, ES Modules support |
| **TypeScript 5.9** | Language | Type safety, developer experience |
| **Express 5.1** | Web framework | Simple, well-documented, industry standard |
| **PostgreSQL 17** | Database | JSONB for flexibility, performance, HIPAA-compliant hosting |
| **Zod 4.x** | Validation | Runtime type checking, schema validation |
| **Vitest** | Testing | ESM-native, fast, modern test runner |

### Frontend

| Technology | Purpose | Why |
|------------|---------|-----|
| **React 19** | UI framework | Component model, ecosystem, developer pool |
| **TypeScript** | Language | Shared types with backend |
| **Vite** | Build tool | Fast dev server, optimized production builds |
| **Tailwind CSS** | Styling | Utility-first, consistent design system |
| **React Query** | Data fetching | Caching, optimistic updates, offline support |

### Mobile

| Technology | Purpose | Why |
|------------|---------|-----|
| **React Native 0.81** | Mobile framework | Code sharing with web, native performance |
| **Expo 54** | Development platform | Simplified builds, OTA updates |
| **WatermelonDB** | Offline database | Lazy loading, sync, SQLite under the hood |
| **React Navigation 7** | Routing | Native feel, deep linking |

### Infrastructure

| Technology | Purpose | Why |
|------------|---------|-----|
| **Vercel** | Hosting (API + Web) | Serverless, edge CDN, GitHub integration |
| **Neon** | PostgreSQL hosting | Serverless, branching, auto-scaling |
| **GitHub Actions** | CI/CD | Built-in, free for open source |
| **GitHub Pages** | Showcase demo | Static site hosting, free |

---

## Monorepo Structure

Care Commons uses **Turborepo** for monorepo management:

```
care-commons/
├── packages/                 # Shared packages
│   ├── core/                # Shared infrastructure
│   │   ├── src/
│   │   │   ├── db/         # Database connection, migrations
│   │   │   ├── permissions/ # Permission service
│   │   │   ├── audit/      # Audit logging
│   │   │   ├── types/      # Base types
│   │   │   └── utils/      # Utilities
│   │   └── migrations/     # Database migrations (SQL)
│   │
│   ├── app/                 # Express API server
│   │   ├── src/
│   │   │   ├── middleware/ # Auth, rate limiting, CORS
│   │   │   ├── routes/     # API route aggregation
│   │   │   └── server.ts   # Express app setup
│   │   └── dist/           # Compiled output
│   │
│   ├── web/                 # React web application
│   │   ├── src/
│   │   │   ├── components/ # Shared components
│   │   │   ├── pages/      # Page components
│   │   │   ├── hooks/      # Custom hooks
│   │   │   └── api/        # API client
│   │   └── dist/           # Production build
│   │
│   ├── mobile/              # React Native mobile app
│   │   ├── src/
│   │   │   ├── screens/    # Screen components
│   │   │   ├── components/ # Mobile components
│   │   │   ├── navigation/ # Navigation setup
│   │   │   └── store/      # Offline storage
│   │   └── ios/            # iOS native code
│   │
│   └── shared-components/   # Shared UI components (web + mobile)
│       ├── src/
│       │   ├── Button/
│       │   ├── Card/
│       │   └── ...
│       └── dist/
│
├── verticals/               # Business verticals
│   ├── client-demographics/
│   │   ├── src/
│   │   │   ├── repository.ts  # Data access
│   │   │   ├── service.ts     # Business logic
│   │   │   ├── routes.ts      # API routes
│   │   │   └── types.ts       # Domain types
│   │   ├── schema.sql         # Database schema
│   │   ├── test-data.sql      # Demo data
│   │   └── README.md          # Documentation
│   │
│   ├── caregiver-staff/
│   ├── scheduling-visits/
│   ├── time-tracking-evv/
│   ├── care-plans-tasks/
│   ├── billing-invoicing/
│   ├── family-engagement/
│   ├── payroll-processing/
│   └── analytics-reporting/
│
├── api/                     # Vercel serverless functions
│   ├── index.mts           # API entry point (.mts for ESM)
│   └── _server/            # Server setup
│
├── showcase/                # GitHub Pages demo
│   ├── src/
│   │   ├── mock-api.ts    # Mock API using localStorage
│   │   └── pages/         # Showcase pages
│   └── dist/              # Static build
│
├── scripts/                 # Utilities and tooling
│   ├── migrations/         # Migration utilities
│   ├── backup-database.sh  # Backup scripts
│   └── dev-setup.ts        # Development setup
│
└── docs/                    # Documentation
    ├── compliance/         # State-specific compliance docs
    ├── operations/         # Operational runbooks
    ├── security/           # Security policies
    └── marketing/          # Launch materials
```

### Build Process

**Turborepo** orchestrates parallel builds with caching:

```bash
# Build all packages in dependency order
npm run build

# Turborepo build graph:
core → verticals → app → web
       ↓
   shared-components → mobile
```

**Build Output:**
- `packages/*/dist/` - Compiled JavaScript + type definitions
- `packages/web/dist/` - Static website bundle
- `api/dist/` - Serverless function bundle

---

## Data Architecture

### Database Schema Organization

Each vertical owns its database tables:

```sql
-- Client Demographics vertical
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  -- ... more fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Caregiver Staff vertical
CREATE TABLE caregivers (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  -- ... fields
);

-- Scheduling & Visits vertical
CREATE TABLE visits (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  client_id UUID REFERENCES clients(id),
  caregiver_id UUID REFERENCES caregivers(id),
  -- ... fields
);
```

### Multi-Tenancy

**Organization Scoping** ensures data isolation:

```sql
-- Every table has organization_id
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,  -- Tenant isolation
  -- ...
);

-- Row-level security (future)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON clients
  FOR ALL
  USING (organization_id = current_setting('app.current_org')::UUID);
```

**Current Implementation:**
- Application-level filtering (all queries include `WHERE organization_id = ?`)
- Future: PostgreSQL Row-Level Security for defense-in-depth

### JSONB for Flexibility

State-specific data uses JSONB columns:

```sql
CREATE TABLE visits (
  id UUID PRIMARY KEY,
  -- ... standard fields
  state_specific_data JSONB,  -- Texas: HHAeXchange submission status
                               -- Florida: Sandata batch number
  metadata JSONB               -- Extensible data
);
```

**Why JSONB:**
- State regulations change frequently
- Each state has unique requirements
- Avoid schema migrations for state additions
- PostgreSQL JSONB is indexed and queryable

### Audit Tables

Every table has a corresponding audit table:

```sql
-- Main table
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  -- ... fields
  version INTEGER DEFAULT 1
);

-- Audit table (revision history)
CREATE TABLE clients_audit (
  audit_id SERIAL PRIMARY KEY,
  id UUID NOT NULL,               -- Original record ID
  version INTEGER NOT NULL,       -- Version number
  changed_by UUID NOT NULL,       -- User who made change
  changed_at TIMESTAMPTZ NOT NULL,
  operation TEXT NOT NULL,        -- 'INSERT', 'UPDATE', 'DELETE'
  old_values JSONB,              -- Previous state
  new_values JSONB               -- New state
);
```

**Triggers automatically populate audit tables:**

```sql
CREATE TRIGGER clients_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### Performance Indexes

Care Commons has **83 indexes** for query performance:

```sql
-- Organization scoping (on every table)
CREATE INDEX idx_clients_org ON clients(organization_id);

-- Common queries
CREATE INDEX idx_visits_client ON visits(client_id);
CREATE INDEX idx_visits_caregiver ON visits(caregiver_id);
CREATE INDEX idx_visits_scheduled_date ON visits(scheduled_date);

-- Composite indexes for complex queries
CREATE INDEX idx_visits_org_status_date 
  ON visits(organization_id, status, scheduled_date);

-- JSONB indexes for state-specific queries
CREATE INDEX idx_visits_state_data ON visits 
  USING GIN (state_specific_data);
```

---

## Security Architecture

### Authentication

**JWT (JSON Web Tokens)** for stateless authentication:

```typescript
// Login flow
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "role": "..." }
}

// Subsequent requests
Authorization: Bearer <token>
```

**Token Contents:**
```json
{
  "userId": "uuid",
  "organizationId": "uuid",
  "role": "administrator",
  "iat": 1638360000,
  "exp": 1638446400
}
```

**Security Features:**
- Tokens expire after 24 hours
- Stored in httpOnly cookies (web) or secure storage (mobile)
- Refresh token flow (future enhancement)
- Token revocation on password change

### Authorization

**Permission Service** checks every request:

```typescript
// In API route handler
const canRead = await permissionService.checkPermission(
  req.user.id,
  'client',
  'read'
);

if (!canRead) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

**Permission Matrix:**

| Role | Client | Caregiver | Visit | Care Plan | Billing |
|------|--------|-----------|-------|-----------|---------|
| **Administrator** | Full | Full | Full | Full | Full |
| **Coordinator** | Full | Full | Full | Full | Read |
| **Caregiver** | Assigned only | Read own | Own visits | Assigned | None |
| **Family** | Loved one only | None | Loved one | Loved one | None |

### Data Encryption

**Sensitive fields encrypted at rest:**

```typescript
// Encryption for SSN, credit card numbers
import { encrypt, decrypt } from '@care-commons/core/crypto';

const encryptedSSN = await encrypt(ssn, process.env.ENCRYPTION_KEY);
// Store: "encrypted:AES256:base64encodeddata"

const decryptedSSN = await decrypt(encryptedSSN, process.env.ENCRYPTION_KEY);
```

**What's encrypted:**
- Social Security Numbers
- Bank account numbers
- Payment card data (if stored)
- Protected Health Information (PHI) designated by agency

**Not encrypted (indexed for search):**
- Names, addresses (not considered PHI for EVV purposes)
- Email addresses, phone numbers
- Visit times, locations (required for compliance reporting)

### HIPAA Compliance

**Technical Safeguards:**
- ✅ **Access Control** - Role-based permissions
- ✅ **Audit Controls** - Comprehensive audit logging
- ✅ **Integrity** - Audit trail prevents data tampering
- ✅ **Transmission Security** - HTTPS/TLS everywhere

**Administrative Safeguards:**
- ✅ **Security Policy** - Documented in `SECURITY.md`
- ✅ **Training** - Required for production deployments
- ✅ **Incident Response** - Runbook in `docs/operations/`

**Physical Safeguards:**
- ✅ **Facility Access** - Cloud hosting (Vercel, Neon) with SOC 2 compliance
- ✅ **Workstation Security** - Encrypted devices required (policy)
- ✅ **Device/Media Controls** - No PHI on portable devices

---

## Deployment Architecture

### Production Environment

```
┌──────────────────────────────────────────────────────────────┐
│                         VERCEL EDGE                          │
│  - Global CDN                                                │
│  - SSL/TLS termination                                       │
│  - DDoS protection                                           │
└──────────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│   STATIC SITE    │          │  API FUNCTIONS   │
│  (React SPA)     │          │  (Serverless)    │
│  - /index.html   │          │  - /api/*        │
│  - /assets/*     │          │  - Node.js 22.x  │
└──────────────────┘          └──────────────────┘
                                       │
                                       ▼
                         ┌──────────────────────┐
                         │   NEON POSTGRES      │
                         │  - Serverless        │
                         │  - Auto-scaling      │
                         │  - Point-in-time     │
                         │    recovery          │
                         └──────────────────────┘
```

### Branching Strategy

```
production   ← Live system (care-commons.vercel.app)
    ↑
    │ (PR + review)
    │
preview      ← Pre-production (preview-*.vercel.app)
    ↑
    │ (PR + CI)
    │
develop      ← Integration (GitHub Pages showcase)
    ↑
    │ (PRs)
    │
feature/*    ← Development branches
```

**Deployment Triggers:**
- Push to `develop` → GitHub Pages showcase updated
- Push to `preview` → Vercel preview deployment
- Push to `production` → Vercel production deployment

### Environment Variables

**Required Secrets:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db

# Authentication
JWT_SECRET=random-secret-key

# Optional
REDIS_URL=redis://host:port  # For rate limiting (falls back to in-memory)
SENTRY_DSN=https://...        # Error monitoring
```

**Configuration:**
- Local: `.env` file (gitignored)
- Vercel: Dashboard environment variables
- GitHub Actions: Repository secrets

---

## State Management

### Frontend State

**React Query** for server state:

```typescript
// Fetch client data
const { data: client, isLoading } = useQuery({
  queryKey: ['client', clientId],
  queryFn: () => api.getClient(clientId),
  staleTime: 5 * 60 * 1000,  // 5 minutes
});

// Update client
const mutation = useMutation({
  mutationFn: (updates) => api.updateClient(clientId, updates),
  onSuccess: () => {
    queryClient.invalidateQueries(['client', clientId]);
  },
});
```

**Zustand** for UI state:

```typescript
// Global UI state
const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ 
    sidebarOpen: !state.sidebarOpen 
  })),
}));
```

### Mobile Offline State

**WatermelonDB** for offline-first mobile:

```typescript
// Define schema
const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'visits',
      columns: [
        { name: 'client_id', type: 'string' },
        { name: 'scheduled_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),
  ],
});

// Query offline data
const visits = await database
  .get('visits')
  .query(Q.where('client_id', clientId))
  .fetch();

// Sync to server
await synchronize({
  database,
  pullChanges: async ({ lastPulledAt }) => {
    const response = await api.sync({ since: lastPulledAt });
    return response;
  },
  pushChanges: async ({ changes }) => {
    await api.pushChanges(changes);
  },
});
```

---

## API Design

### RESTful Conventions

```
GET    /api/clients          - List clients (paginated)
POST   /api/clients          - Create client
GET    /api/clients/:id      - Get client by ID
PATCH  /api/clients/:id      - Update client
DELETE /api/clients/:id      - Delete client (soft delete)

GET    /api/clients/:id/visits           - List client's visits
GET    /api/clients/:id/care-plans       - List client's care plans
GET    /api/clients/:id/family-members   - List client's family
```

### Request/Response Format

**Request:**
```http
PATCH /api/clients/123
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "Jane",
  "phone": "555-0100"
}
```

**Success Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "123",
  "first_name": "Jane",
  "last_name": "Doe",
  "phone": "555-0100",
  "updated_at": "2025-11-27T14:30:00Z"
}
```

**Error Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Validation failed",
  "details": {
    "phone": ["Invalid phone number format"]
  }
}
```

### Pagination

```http
GET /api/clients?page=2&limit=20

Response:
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

### Filtering & Sorting

```http
GET /api/clients?status=active&sort=last_name:asc

GET /api/visits?scheduled_date_gte=2025-11-01&scheduled_date_lte=2025-11-30
```

---

## Testing Strategy

### Unit Tests

**Vitest** for all business logic:

```typescript
// verticals/client-demographics/src/__tests__/service.test.ts
describe('ClientService', () => {
  it('should create client with valid data', async () => {
    const service = new ClientService(mockDb);
    const client = await service.createClient({
      firstName: 'John',
      lastName: 'Doe',
      organizationId: 'org-123',
    });

    expect(client.id).toBeDefined();
    expect(client.firstName).toBe('John');
  });

  it('should reject invalid phone number', async () => {
    const service = new ClientService(mockDb);
    await expect(
      service.createClient({
        firstName: 'John',
        lastName: 'Doe',
        phone: 'invalid',
      })
    ).rejects.toThrow('Invalid phone number');
  });
});
```

**Coverage Goals:**
- Repositories: 90%+ coverage
- Services: 85%+ coverage
- Routes: 80%+ coverage

### Integration Tests

**API integration tests** with real database:

```typescript
// packages/app/src/__tests__/integration/clients.test.ts
describe('Client API Integration', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  it('should create and retrieve client', async () => {
    const response = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ firstName: 'John', lastName: 'Doe' });

    expect(response.status).toBe(201);

    const getResponse = await request(app)
      .get(`/api/clients/${response.body.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getResponse.body.firstName).toBe('John');
  });
});
```

### E2E Tests

**Playwright** for web, **Detox** for mobile:

```typescript
// e2e/tests/client-workflow.spec.ts
test('coordinator can create and assign client', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=email]', 'coordinator@tx.demo');
  await page.fill('[name=password]', 'demo1234');
  await page.click('button[type=submit]');

  await page.goto('/clients');
  await page.click('text=Add Client');
  await page.fill('[name=firstName]', 'Jane');
  await page.fill('[name=lastName]', 'Smith');
  await page.click('button:has-text("Save")');

  await expect(page.locator('text=Jane Smith')).toBeVisible();
});
```

### Visual Regression Tests

**Screenshot capture** for visual verification:

```bash
# Capture all showcase pages
npm run capture-screenshots:showcase

# Capture production deployment
npm run capture-screenshots:production

# Capture iOS simulator
npm run capture-screenshots:ios
```

See `docs/UI_VISIBILITY_TOOLING.md` for details.

---

## Next Steps

For developers getting started:

1. **Read**: `DEV_SETUP.md` - Local development setup
2. **Read**: `CONTRIBUTING.md` - Contribution guidelines
3. **Explore**: `docs/compliance/` - State-specific requirements
4. **Try**: Run `npm run dev` and explore the showcase

For architects and technical leads:

1. **Database**: `packages/core/migrations/` - Schema design
2. **Security**: `docs/security/` - Security policies and practices
3. **Operations**: `docs/operations/` - Deployment and monitoring
4. **Compliance**: `docs/compliance/` - Regulatory considerations

---

## Questions?

- **Discord**: https://discord.gg/EkeXQZFq
- **GitHub Issues**: https://github.com/neighborhood-lab/care-commons/issues
- **Email**: brian.mabry.edwards@gmail.com
