# Legal Commons - Technical Stack Documentation

## Repository Structure

**GitHub Repository:** `legal-commons`

Legal Commons inherits and adapts the proven architecture from the Care Commons platform, optimized for legal document workflows, multi-jurisdictional compliance, and offline-first accessibility.

---

## Production Stack

### Frontend Architecture

#### Web Application
- **Framework:** React 19.2.0
- **Build Tool:** Vite 7.2.2
- **Routing:** React Router 6.28.0
- **Styling:** Tailwind CSS 4.1.17
- **UI Components:** Headless UI 2.2.9
- **Icons:** Lucide React 0.553.0
- **Animations:** Framer Motion 12.23.24
- **Forms:** React Hook Form 7.66.0 + Zod 4.1.12 validation
- **State Management:** Zustand 5.0.8
- **Data Fetching:** TanStack React Query 5.90.7
- **Offline Database:** WatermelonDB 0.25.5 (for offline document drafts)
- **Charts/Visualizations:** Recharts 3.3.0 (for analytics dashboards)
- **Notifications:** React Hot Toast 2.6.0

**Key Frontend Capabilities:**
- Progressive Web App (PWA) for mobile offline usage
- Automatic form state persistence
- Real-time collaborative editing (future)
- Document preview rendering
- Accessibility-first component design (WCAG AAA)

#### Mobile Application
- **Framework:** React Native (via Expo)
- **Config:** Expo Config Plugins 54.0.2
- **Offline Sync:** WatermelonDB 0.25.5
- **Shared Logic:** Monorepo packages for business logic reuse

---

### Backend Architecture

#### API Server
- **Runtime:** Node.js 22.x
- **Framework:** Express 4.21.2
- **Language:** TypeScript 5.9.3
- **Validation:** Zod 4.1.12
- **Security:**
  - Helmet 8.1.0 (HTTP headers)
  - CORS 2.8.5
  - bcrypt 6.0.0 (password hashing)
  - zxcvbn 4.4.2 (password strength)
  - isomorphic-dompurify 2.31.0 (XSS prevention)
- **Rate Limiting:** express-rate-limit 8.2.1 + rate-limit-redis 4.2.3
- **Authentication:** JWT (jsonwebtoken 9.0.2)
- **Logging:** Morgan 1.10.1 + Pino 10.1.0
- **API Documentation:** Swagger (swagger-jsdoc 6.2.8 + swagger-ui-express 5.0.1)

**Key Backend Capabilities:**
- RESTful API design
- Role-based access control (client, attorney, admin, legal aid coordinator)
- Document generation pipeline
- Court e-filing integration (state-specific adapters)
- Webhook endpoints for payment processors and filing status updates

---

### Database & Storage

#### Database (Vercel Postgres)
- **Database:** PostgreSQL (via Vercel Postgres - **replaces Neon**)
- **ORM:** Knex 3.1.0
- **Migrations:** Custom migration system (packages/core/scripts/migrate.ts)
- **Driver:** pg 8.16.3
- **Connection Pooling:** Built-in Vercel Postgres pooling

**Why Vercel Postgres:**
- Zero-config deployment with Vercel projects
- Automatic connection pooling and scaling
- Built-in high availability
- Generous free tier for early-stage projects
- Serverless-optimized connection management
- No separate database provider account needed

**Database Schema Design:**
- `users` - User accounts with role hierarchy
- `documents` - Generated legal documents with version history
- `templates` - Legal form templates with jurisdiction metadata
- `questionnaires` - Interview flows for document assembly
- `jurisdictions` - State/county-specific legal requirements
- `filings` - Court filing tracking and status
- `attorneys` - Attorney directory and availability
- `consultations` - Scheduled legal consultations
- `case_notes` - Secure client notes (encrypted at rest)
- `audit_logs` - Comprehensive activity tracking for compliance

#### Caching Layer
- **Cache:** Redis 5.9.0
- **Use Cases:**
  - Session storage
  - Rate limiting counters
  - Document generation queue
  - Court API response caching
  - Real-time collaboration state

#### File Storage
- **Provider:** Vercel Blob Storage
- **Use Cases:**
  - Generated PDF documents
  - User-uploaded supporting documents
  - Template source files
  - Court filing receipts
  - E-signatures

**Storage Security:**
- Client-side encryption for sensitive documents
- Signed URLs with expiration
- Audit logging for all file access
- Automatic retention policies (e.g., 7 years for tax docs)

---

### Deployment & Infrastructure

#### Hosting
- **Platform:** Vercel
- **Edge Network:** Vercel Edge (global CDN)
- **Serverless Functions:** Vercel Serverless Functions (Node.js 22.x runtime)
- **Environment Management:**
  - Development (local + preview branches)
  - Staging (preview deployments)
  - Production (main/develop branch)

**Vercel Configuration (`vercel.json`):**
```json
{
  "buildCommand": "npm run build",
  "framework": "vite",
  "installCommand": "npm install",
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "@database_url"
  },
  "regions": ["iad1", "sfo1", "dub1"],
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs22.x",
      "maxDuration": 30
    }
  }
}
```

#### CI/CD Pipeline
- **Version Control:** Git + GitHub
- **CI Platform:** GitHub Actions
- **Automated Checks:**
  - Linting (ESLint 9.39.1)
  - Type checking (TypeScript 5.9.3)
  - Unit tests (Vitest 4.0.8)
  - Integration tests (Vitest + Supertest 7.1.4)
  - E2E tests (Playwright 1.56.1)
  - Accessibility audits (Axe-core Playwright 4.11.0)
  - Security scanning (eslint-plugin-security 3.0.1)
  - Code duplication (jscpd 4.0.5)
  - SQL linting (sql-lint 1.0.2)
- **Pre-commit Hooks:** Husky 9.1.7
- **Deploy Triggers:**
  - PR preview deployments (ephemeral URLs)
  - Automatic production deploy on merge to `develop`
  - Rollback via Vercel CLI or dashboard

---

### Monitoring & Observability

#### Error Tracking
- **Platform:** Sentry (@sentry/node 10.23.0 + @sentry/profiling-node 10.23.0)
- **Scope:** Backend errors, frontend exceptions, performance profiling

#### Performance Monitoring
- **OpenTelemetry:** (@opentelemetry/* suite)
  - API tracing
  - HTTP instrumentation
  - Custom span creation for document generation workflows
- **Metrics:** Prometheus (prom-client 15.1.3)

#### Logging
- **Structured Logging:** Pino 10.1.0 (JSON logs)
- **Log Aggregation:** Vercel Log Drains → external service (e.g., Datadog, Axiom)
- **Log Levels:** DEBUG (dev), INFO (staging), WARN/ERROR (production)

---

## Showcase/Demo Stack

### Demo Site
- **Purpose:** Public marketing site + interactive product demos
- **Framework:** Same as production (React + Vite)
- **Hosting:** Vercel (separate project or subdomain)
- **Content Management:** Markdown-based or headless CMS (e.g., Sanity, Contentful)
- **Demo Features:**
  - Interactive document assembly walkthroughs (no backend required)
  - Sample generated documents (PDFs)
  - Video tutorials
  - Legal education modules
  - Community success stories

**Showcase-Specific Scripts (from package.json):**
```json
{
  "dev:showcase": "cd showcase && npm run dev",
  "build:showcase": "cd showcase && npm run build",
  "db:seed:showcase": "npm run db:seed -- --mode=showcase"
}
```

### Demo Data
- **Seed Scripts:** Realistic but anonymized legal scenarios
  - Sample LLC formations
  - Will and trust templates
  - Landlord-tenant scenarios
  - Small claims court filings
- **Data Privacy:** Zero PII, all fictional but legally sound examples

---

## Development Tooling Stack

### Monorepo Architecture
- **Build System:** Turbo 2.6.0
- **Package Manager:** npm 10.9.4 (with workspaces)
- **Workspace Structure:**
  ```
  packages/
    app/           # Express API server
    web/           # React web app
    mobile/        # React Native mobile app
    core/          # Shared business logic, database, types
    shared-components/  # Reusable UI components

  verticals/       # Feature verticals (legal domains)
    business-formation/
    estate-planning/
    family-law/
    immigration/
    housing-law/
    employment-law/
    intellectual-property/
    dispute-resolution/

  showcase/        # Marketing/demo site
  ```

### TypeScript Configuration
- **Base Config:** tsconfig.base.json (shared settings)
- **Per-Package Configs:** Extend base with package-specific settings
- **Strict Mode:** Enabled across all packages
- **Path Aliases:** @ prefix for clean imports (via tsc-alias 1.8.16)

**Example Path Aliases:**
```typescript
import { generateDocument } from '@care-commons/core/document-generator'
import { Button } from '@care-commons/shared-components'
import { EstateFormSchema } from '@verticals/estate-planning/schemas'
```

### Testing Infrastructure

#### Unit & Integration Tests
- **Framework:** Vitest 4.0.8
- **Environment:** happy-dom 20.0.10 (lightweight DOM)
- **Coverage:** @vitest/coverage-v8 4.0.8
- **Utilities:**
  - @testing-library/react 16.3.0
  - @testing-library/user-event 14.6.1
  - @testing-library/jest-dom 6.6.3

**Test Commands:**
```bash
npm run test              # Run all unit tests
npm run test:coverage     # Generate coverage reports
npm run test:ui           # Interactive test UI
```

#### End-to-End Tests
- **Framework:** Playwright 1.56.1
- **Browsers:** Chromium, Firefox, WebKit
- **Mobile:** iOS Safari, Chrome Android emulation
- **Accessibility:** @axe-core/playwright 4.11.0

**E2E Test Scenarios:**
- User registration and authentication
- Complete LLC formation flow (all 50 states)
- Will generation with multiple beneficiaries
- Attorney consultation booking
- Court e-filing submission
- Offline document editing + sync
- Multilingual interface switching

**Test Commands:**
```bash
npm run test:e2e          # Headless E2E tests
npm run test:e2e:ui       # Interactive mode
npm run test:e2e:debug    # Debug mode
npm run test:smoke        # Quick smoke tests
```

### Code Quality Tools

#### Linting
- **ESLint:** 9.39.1
- **Plugins:**
  - @typescript-eslint/eslint-plugin 8.46.3
  - eslint-plugin-react 7.37.5
  - eslint-plugin-react-hooks 7.0.1
  - eslint-plugin-security 3.0.1 (security vulnerability detection)
  - eslint-plugin-sonarjs 3.0.5 (code smell detection)
  - eslint-plugin-unicorn 62.0.0 (best practices)
  - eslint-plugin-promise 7.2.1 (promise handling)

#### Code Duplication Detection
- **Tool:** jscpd 4.0.5
- **Threshold:** Max 3% duplication across codebase

#### SQL Linting
- **Tool:** sql-lint 1.0.2 (PostgreSQL dialect)
- **Scope:** All migration files

### Development Workflow Tools

#### Git Hooks (Husky)
- **Pre-commit:**
  - Run ESLint on staged files
  - Type-check modified packages
  - Run affected unit tests
  - Validate commit message format (conventional commits)

- **Pre-push:**
  - Run full test suite
  - Check for type errors across monorepo
  - Verify no console.logs or debugger statements

#### CLI Tools Available
- **git** - Version control
- **gh** - GitHub CLI (for PR management, issue linking)
- **vercel** - Vercel CLI (for deployments, environment variables, logs)
- **tsx** - TypeScript execution (for scripts)
- **turbo** - Monorepo task orchestration

---

## External Integrations

### Payment Processing
- **Provider:** Stripe (for optional attorney consultations, donations)
- **Integration:** Stripe Checkout + Webhooks
- **Compliance:** PCI DSS via Stripe's hosted forms

### E-Filing Integration
- **Providers:** State-specific e-filing portals (File & ServeXpress, Tyler Technologies, etc.)
- **Method:** REST APIs + SOAP wrappers (varies by state)
- **Fallback:** Printable filing packets for non-e-filing jurisdictions

### Document Generation
- **Library:** PDFKit or Puppeteer (HTML → PDF)
- **Templates:** React components rendered to HTML, then PDF
- **Features:**
  - Form field auto-population
  - Court-specific formatting
  - Digital signature placeholders
  - Accessibility tags (PDF/UA)

### Identity Verification (Optional)
- **Provider:** Stripe Identity or Persona
- **Use Case:** Attorney consultations, sensitive document access
- **Privacy:** Zero-knowledge proof where possible

### Translation Services
- **Provider:** Community translators + machine translation fallback (e.g., DeepL API)
- **Scope:** UI strings, legal form instructions, educational content
- **Quality Assurance:** Native speaker review before production

### SMS Notifications
- **Provider:** Twilio
- **Use Cases:** Appointment reminders, filing status updates, deadline alerts
- **Opt-in Required:** TCPA compliant

---

## Database Migration from Neon to Vercel Postgres

### Setup Steps

1. **Install Vercel Postgres Package:**
   ```bash
   npm install @vercel/postgres
   ```

2. **Update Environment Variables:**
   ```bash
   # .env.local
   DATABASE_URL="postgres://default:xxx@xxx.vercel-storage.com:5432/verceldb"
   POSTGRES_PRISMA_URL="postgres://default:xxx@xxx.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15"
   POSTGRES_URL_NON_POOLING="postgres://default:xxx@xxx.vercel-storage.com:5432/verceldb"
   ```

3. **Knex Configuration (packages/core/knexfile.ts):**
   ```typescript
   import { config } from 'dotenv'
   import { Knex } from 'knex'

   config()

   const knexConfig: Knex.Config = {
     client: 'pg',
     connection: process.env.DATABASE_URL,
     pool: {
       min: 2,
       max: 10,
       acquireTimeoutMillis: 60000,
       idleTimeoutMillis: 600000,
     },
     migrations: {
       directory: './migrations',
       tableName: 'knex_migrations',
       extension: 'ts',
     },
     seeds: {
       directory: './seeds',
       extension: 'ts',
     },
   }

   export default knexConfig
   ```

4. **Connection Pooling Best Practices:**
   - Use `POSTGRES_PRISMA_URL` for serverless functions (with pgBouncer)
   - Use `POSTGRES_URL_NON_POOLING` for long-running processes (migrations)
   - Set aggressive connection timeouts (15s max)

5. **Migration Execution:**
   ```bash
   npm run db:migrate        # Run pending migrations
   npm run db:migrate:status # Check migration status
   npm run db:seed:demo      # Seed demo data
   ```

### Vercel Postgres Benefits
- **Automatic Backups:** Daily snapshots, point-in-time recovery
- **Branch Databases:** Ephemeral databases for preview deployments
- **Usage Monitoring:** Built-in query analytics in Vercel dashboard
- **Cost Efficiency:** No charge for idle time, pay per compute
- **Zero Config:** Auto-provisioned on first deployment

### Migration Checklist
- [ ] Replace `NEON_DATABASE_URL` with `DATABASE_URL` in all env files
- [ ] Update Vercel project environment variables
- [ ] Test connection pooling under load (simulate 100 concurrent users)
- [ ] Configure database branching for preview deployments
- [ ] Set up monitoring alerts (connection pool exhaustion, slow queries)
- [ ] Document backup/restore procedures
- [ ] Test disaster recovery plan (restore from backup)

---

## Performance Targets

- **Time to First Byte (TTFB):** < 200ms (Vercel Edge)
- **Largest Contentful Paint (LCP):** < 2.5s
- **First Input Delay (FID):** < 100ms
- **Cumulative Layout Shift (CLS):** < 0.1
- **Document Generation:** < 5s for complex multi-page documents
- **Offline Sync:** Background sync within 30s of connection restoration
- **API Response Time (P95):** < 500ms
- **Database Query Time (P95):** < 100ms

---

## Security Practices

### Data Protection
- **Encryption at Rest:** Vercel Postgres built-in encryption
- **Encryption in Transit:** TLS 1.3 for all connections
- **Sensitive Field Encryption:** Client-side encryption for case notes, financial info
- **Secret Management:** Vercel environment variables + secret rotation

### Access Control
- **Authentication:** JWT with short expiration (15min access, 7d refresh)
- **Authorization:** Role-based + attribute-based (e.g., jurisdiction-specific access)
- **Session Management:** Redis-backed sessions with IP validation
- **API Keys:** Scoped tokens for third-party integrations

### Compliance
- **GDPR:** Right to deletion, data portability, consent management
- **CCPA:** Do Not Sell disclosure, opt-out mechanisms
- **HIPAA (if medical directives):** Business associate agreements, audit logs
- **ABA Model Rules:** Attorney-client privilege protections in multi-tenant architecture

### Vulnerability Management
- **Dependency Scanning:** npm audit + Dependabot
- **SAST:** ESLint security plugin
- **DAST:** Automated security testing in CI/CD
- **Penetration Testing:** Annual third-party audits
- **Responsible Disclosure:** security@legal-commons.org

---

## Scalability Considerations

### Horizontal Scaling
- **Vercel Serverless:** Auto-scales to 1000s of concurrent requests
- **Database:** Connection pooling + read replicas (future)
- **Cache:** Redis cluster (future)
- **File Storage:** Vercel Blob (globally distributed)

### Vertical Scaling
- **Database:** Vercel Postgres auto-scaling (up to 256GB RAM)
- **Function Memory:** Configurable per-function (256MB → 3008MB)

### Cost Optimization
- **Edge Caching:** Cache static assets + API responses (Vercel Edge)
- **Incremental Static Regeneration:** Pre-render legal education content
- **Database Indexing:** Query optimization, covering indexes
- **Asset Optimization:** Image compression (WebP, AVIF), code splitting

---

## Disaster Recovery

### Backup Strategy
- **Database:** Daily automated backups (Vercel Postgres), 30-day retention
- **File Storage:** Vercel Blob automatic redundancy
- **Code:** Git version control + GitHub mirror

### Recovery Procedures
- **RTO (Recovery Time Objective):** < 4 hours
- **RPO (Recovery Point Objective):** < 24 hours (last daily backup)
- **Runbook:** Documented recovery steps in `/docs/runbooks/`

### Incident Response
1. Detect (monitoring alerts)
2. Assess (severity classification)
3. Contain (isolate affected systems)
4. Resolve (apply fix or rollback)
5. Post-mortem (blameless retrospective)

---

## Future Technical Enhancements

### Planned Integrations
- **E-signature:** DocuSign or HelloSign API
- **Video Consultations:** Twilio Video or Daily.co
- **Calendar Sync:** Google Calendar, Outlook API
- **Payment Plans:** Stripe Billing subscriptions
- **SMS Workflows:** Twilio Autopilot for SMS-based questionnaires

### Emerging Technologies
- **AI Document Review:** GPT-4 API for contract analysis
- **Voice Interface:** Whisper API for dictation, speech-to-form
- **Blockchain Notarization:** Timestamped document hashes on Ethereum
- **Quantum-Safe Encryption:** Preparing for post-quantum cryptography

---

## Developer Onboarding

### Local Setup (5 minutes)
```bash
# 1. Clone repository
git clone https://github.com/legal-commons/legal-commons.git
cd legal-commons

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Vercel Postgres URL

# 4. Run database migrations
npm run db:migrate

# 5. Seed demo data
npm run db:seed:demo

# 6. Start development servers
npm run dev  # Runs API server + web app concurrently

# 7. Open browser
# Web app: http://localhost:5173
# API docs: http://localhost:3000/api-docs
```

### Contributing Workflow
1. Create feature branch: `git checkout -b feature/add-immigration-forms`
2. Make changes, write tests
3. Run quality checks: `npm run lint && npm run typecheck && npm run test`
4. Commit with conventional commits: `git commit -m "feat(immigration): add I-485 form template"`
5. Push and create PR: `git push -u origin feature/add-immigration-forms`
6. Wait for CI checks (linting, tests, preview deployment)
7. Request review from domain experts
8. Merge to `develop` after approval
9. Auto-deploy to staging
10. Manual promotion to production (weekly release cadence)

---

**This tech stack is battle-tested, scalable, and optimized for rapid iteration. Let's build legal access for all.**
