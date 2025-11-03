# Care Commons

[![CI](https://github.com/neighborhood-lab/care-commons/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/neighborhood-lab/care-commons/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/neighborhood-lab/care-commons/branch/develop/graph/badge.svg)](https://codecov.io/gh/neighborhood-lab/care-commons/tree/develop)
[![Known Vulnerabilities](https://snyk.io/test/github/neighborhood-lab/care-commons/badge.svg)](https://snyk.io/test/github/neighborhood-lab/care-commons)

> Shared care software, community owned.

**Care Commons** is a modular, self-hostable software platform designed to support the administration and daily operations of home-based care services. Built by the people at **Neighborhood Lab**.

[Care Commons](https://care-commons.vercel.app/) (web application demo)

[Substack](https://neighborhoodlab.substack.com/) (updates, news and commentary)  
[Patreon](https://www.patreon.com/cw/neighborhood_lab) (give your financial support for continued development)

[Care Commons](https://neighborhood-lab.github.io/product/) (product marketing website)  
[Neighborhood Lab](https://neighborhood-lab.github.io/) (organization website)

## Vision

A human-scale alternative to enterprise care management systems. Care Commons emphasizes:

- 🏡 **Human-scale workflows** - Not enterprise excess
- 🔒 **Local autonomy** - Runs offline and on-premises if needed
- 🔌 **Interoperability by design** - APIs, import/export, open schema
- 🛡️ **Privacy and consent first** - Least-privilege access across roles
- 📦 **Incremental adoption** - Start with one vertical, add others later

## Architecture

Care Commons is structured as a set of independently deployable **verticals** that share a common core:

- Unified domain model shared across verticals
- Event-driven data flows for visit lifecycle
- Fine-grained permissions and perspective-based UI
- Durable offline data capture with conflict resolution
- Extensible APIs that allow community-developed modules
- Encryption for sensitive health and payroll-related data
- Automated validation, audit trails, and revision history

## Technology Stack

- **Backend**: TypeScript/Node.js with Express
- **Database**: PostgreSQL with JSONB for flexible data models
- **Monorepo**: Turborepo for efficient builds
- **Validation**: Zod for runtime type safety
- **Testing**: Vitest

## Project Structure

```
care-commons/
├── packages/
│   └── core/              # Shared core functionality
│       ├── src/
│       │   ├── types/     # Base types and interfaces
│       │   ├── db/        # Database connection and repository
│       │   ├── permissions/  # Permission service
│       │   └── audit/     # Audit logging
│       └── migrations/    # Database migrations
│
└── verticals/             # Feature verticals
    ├── client-demographics/   ✅ Implemented
    ├── caregiver-staff/       ✅ Implemented
    ├── scheduling-visits/     ✅ Implemented
    └── ...
```

## Verticals

### ✅ Implemented

- **[Client & Demographics Management](./verticals/client-demographics/)** - Foundational record system for individuals receiving care
- **[Caregiver & Staff Management](./verticals/caregiver-staff/)** - Secure directory of personnel providing care services
- **[Scheduling & Visit Management](./verticals/scheduling-visits/)** - Service patterns, automated scheduling, and real-time visit tracking
- **[Care Plans & Tasks Library](./verticals/care-plans-tasks/)** - Structured care plans with goals, interventions, and task management

### 📋 Planned
- Time Tracking & Electronic Visit Verification (EVV)
- Shift Matching & Assignment
- Billing & Invoicing
- Payroll Processing
- Compliance & Documentation
- Mobile App for Field Staff
- Family Portal / Client Portal
- Care Notes & Progress Reporting
- Incident & Risk Reporting
- Referral & Intake Management
- Medication Management
- Training & Certification Tracking
- Quality Assurance & Audits
- Reporting & Analytics
- Communication & Messaging
- Document Management & eSignatures
- Inventory & Supplies Tracking
- HR & Onboarding
- Mileage & Expense Tracking
- Role-Based Access Control & Security
- Data Backup & Offline Support

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/neighborhood-lab/care-commons.git
cd care-commons

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run db:migrate

# Seed sample data (optional)
npm run db:seed

# Build all packages
npm run build

# Start development
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=care_commons
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# Development Mock Authentication
MOCK_USER_PASSWORD=password123
```

### Development Login Credentials

The development environment includes three mock users for testing:

| Email                      | Password      | Role        |
|----------------------------|---------------|-------------|
| `admin@example.com`        | `password123` | ADMIN       |
| `coordinator@example.com`  | `password123` | COORDINATOR |
| `caregiver@example.com`    | `password123` | CAREGIVER   |

**Note:** These credentials are for development only. In production, proper authentication with hashed passwords and JWT tokens should be implemented.

## Development

```bash
# Run all packages in development mode
npm run dev

# Build all packages
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type checking
npm run typecheck

# Lint code
npm run lint
```

### Code Coverage

This project uses Codecov for tracking code coverage. Coverage reports are automatically generated and uploaded during CI runs. The project maintains a minimum coverage threshold of 70% across all packages.

To generate coverage reports locally:
```bash
npm run test:coverage
```

Coverage reports are available in the `coverage/` directory of each package.

## GitHub Actions

This project uses GitHub Actions for automated CI/CD workflows:

### Workflows

- **CI** (`ci.yml`) - Runs on pull requests and pushes to main/develop
  - Linting and type checking
  - Unit and integration tests with PostgreSQL
  - Build verification
  - Code coverage reporting

- **Deploy** (`deploy.yml`) - Automated deployments
  - Production deployments on main branch pushes
  - Staging deployments on develop branch pushes
  - Database migrations during deployment

- **Database Operations** (`database.yml`) - Manual database management
  - Run migrations, rollbacks, and seeding
  - Support for staging and production environments
  - Manual workflow dispatch with safety checks

- **Security and Dependencies** (`security.yml`) - Automated security
  - Weekly security audits
  - Dependency updates with PR creation
  - CodeQL analysis and Snyk scanning

- **Release** (`release.yml`) - Version management
  - Automated releases on git tags
  - Changelog generation
  - Version bumping and npm publishing

### Required Secrets

Configure these repository secrets for full functionality:

```bash
# Database connections
DATABASE_URL=postgresql://user:pass@host:port/db
STAGING_DATABASE_URL=postgresql://user:pass@host:port/staging_db

# Application secrets
JWT_SECRET=your-jwt-secret
STAGING_JWT_SECRET=your-staging-jwt-secret

# Optional services
CODECOV_TOKEN=your-codecov-token
SNYK_TOKEN=your-snyk-token
```

### Manual Workflows

Some workflows can be triggered manually:

1. **Database Operations** - Go to Actions → Database Operations → Run workflow
2. **Security Scans** - Go to Actions → Security and Dependencies → Run workflow  
3. **Release** - Go to Actions → Release → Run workflow (or push a git tag)

## Database Management

```bash
# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Seed TX/FL demo data (idempotent)
npm run db:seed:demo

# Check migration status
npm run db:migrate:status

# Rollback last migration
npm run db:migrate:rollback
```

## Cloud Deployment

Care Commons supports deployment to **Vercel** with **Neon PostgreSQL** for production-ready, serverless hosting.

### Prerequisites for Cloud Deployment

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **Neon PostgreSQL** - Create a database at [neon.tech](https://neon.tech)
3. **Vercel CLI** - Install globally: `npm install -g vercel`

### Neon PostgreSQL Setup

1. Create a new project at [console.neon.tech](https://console.neon.tech)
2. Create two databases:
   - `care_commons_staging` (for staging environment)
   - `care_commons_production` (for production environment)
3. Enable connection pooling for each database
4. Copy the connection strings (with pooling enabled)

### Vercel Project Setup

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Link your project:
   ```bash
   vercel link
   ```

4. Add environment variables to Vercel:
   ```bash
   # For production
   vercel env add DATABASE_URL production
   # Paste your Neon production connection string (with pooling)
   
   # For staging
   vercel env add DATABASE_URL preview
   # Paste your Neon staging connection string (with pooling)
   
   # Add other secrets
   vercel env add JWT_SECRET production
   vercel env add ENCRYPTION_KEY production
   ```

### Deployment Commands

```bash
# Deploy to preview (automatic on PRs)
npm run deploy:preview

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

### GitHub Actions Deployment

The project includes automated deployment workflows:

#### Preview Deployments
- Automatically deploy on every pull request
- Preview URL posted as PR comment
- Uses staging database

#### Staging Deployments
- Deploy to staging on `develop` branch pushes
- Runs database migrations automatically
- Health check validation

#### Production Deployments
- Deploy to production on `main` branch pushes
- Runs database migrations automatically
- Health check validation
- Optional demo data seeding

### Required GitHub Secrets

Add these secrets in your repository settings (Settings → Secrets and variables → Actions):

```bash
# Vercel
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-vercel-org-id>
VERCEL_PROJECT_ID=<your-vercel-project-id>

# Database
DATABASE_URL=<neon-production-connection-string>
STAGING_DATABASE_URL=<neon-staging-connection-string>

# Application
JWT_SECRET=<random-secret-string>
STAGING_JWT_SECRET=<random-secret-string>
ENCRYPTION_KEY=<32-byte-random-string>
```

### Health Check Endpoint

After deployment, verify your application:

```bash
# Check production health
curl https://your-app.vercel.app/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2025-11-01T12:00:00.000Z",
  "environment": "production",
  "uptime": 3600,
  "responseTime": 45,
  "database": {
    "status": "connected",
    "responseTime": 45
  },
  "memory": {
    "used": 128,
    "total": 256
  }
}
```

### Database Migrations on Vercel

Migrations run automatically during deployment via GitHub Actions. To run manually:

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="your-neon-connection-string"

# Run migrations
npm run db:migrate

# Seed demo data (optional)
npm run db:seed:demo
```

### Monitoring and Logging

- **Vercel Dashboard**: View deployment logs and metrics
- **Neon Console**: Monitor database performance and queries
- **Health Endpoint**: `/health` for uptime monitoring
- **Error Tracking**: Configure Sentry DSN in environment variables (optional)

### Rollback

To rollback a deployment:

```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote <deployment-url> --scope <team-name>
```

### Best Practices

1. **Database Pooling**: Always use Neon's pooled connection string for serverless environments
2. **Environment Variables**: Never commit secrets to git - use Vercel environment variables
3. **Migrations**: Test migrations on staging before deploying to production
4. **Health Checks**: Monitor the `/health` endpoint for database connectivity
5. **Preview Deployments**: Review changes on preview URLs before merging to main

## Documentation

- [Technical Plan](./care-commons-tech-plan.md) - Overall product vision and vertical descriptions
- [Client & Demographics](./verticals/client-demographics/README.md) - Client management vertical documentation
- [Caregiver & Staff Management](./verticals/caregiver-staff/README.md) - Caregiver and staff management documentation
- [Scheduling & Visit Management](./verticals/scheduling-visits/README.md) - Scheduling and visit tracking documentation
- [Care Plans & Tasks Library](./verticals/care-plans-tasks/README.md) - Care plans, goals, interventions, and task management
- [Core Package](./packages/core/README.md) - Core functionality documentation

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Principles

1. **Human-first design** - Tools should reduce burden, not add it
2. **Privacy by default** - Least-privilege access, explicit consent
3. **Offline-capable** - Core functionality works without connectivity
4. **Auditable** - All changes tracked for compliance and debugging
5. **Modular** - Verticals are independent but share common infrastructure
6. **Open** - APIs and data schemas are documented and accessible

## License

See [LICENSE](./LICENSE) for details.

## Community

- **GitHub**: [neighborhood-lab/care-commons](https://github.com/neighborhood-lab/care-commons)
- **Issues**: [Report bugs or request features](https://github.com/neighborhood-lab/care-commons/issues)

---

**Care Commons** is brought to you by [Neighborhood Lab](https://neighborhoodlab.org) 🏡

Shared care software, community owned.

[Product website](https://neighborhood-lab.github.io/care-commons-home/)  
[Organization website](https://neighborhood-lab.github.io/home/)
