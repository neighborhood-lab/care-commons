# Task 0075: Production Deployment Runbook and Automation

**Priority:** 🔴 CRITICAL
**Estimated Effort:** 1 week
**Type:** DevOps / Production Readiness
**Vertical:** Infrastructure

---

## Context

Care Commons has comprehensive code and documentation, but lacks a battle-tested, step-by-step deployment runbook that a new agency can follow to go from zero to production. This creates a barrier to adoption and increases support burden.

**Current State:**
- Documentation exists for Vercel and self-hosted deployment
- No unified runbook combining all deployment steps
- No validation checklist to ensure correct setup
- No automated health checks post-deployment
- No rollback procedures documented
- First deployment likely requires 4-8 hours of troubleshooting

**Goal State:**
- Any agency can deploy to production in <2 hours
- One-command deployment where possible
- Automated validation of deployment health
- Clear rollback procedures
- Monitoring and alerting configured by default

---

## Objectives

1. **Create Comprehensive Deployment Runbooks**
   - Vercel deployment (serverless, recommended)
   - Self-hosted Docker deployment
   - Hybrid deployment (API self-hosted, web on Vercel)

2. **Automate Common Deployment Tasks**
   - One-command deployment script
   - Automated database migrations
   - Environment variable validation
   - Post-deployment health checks

3. **Document Production Operations**
   - Monitoring setup
   - Backup and restore procedures
   - Scaling guidelines
   - Incident response playbooks

---

## Deliverable 1: Vercel Deployment Runbook

**File:** `docs/deployment/vercel-production-deployment.md`

### Prerequisites Checklist

```markdown
## Before You Begin

Ensure you have:
- [ ] Vercel account (free or pro)
- [ ] GitHub account with repository access
- [ ] PostgreSQL database (Vercel Postgres, Supabase, or self-hosted)
- [ ] Domain name (optional, for custom domain)
- [ ] SendGrid API key (for email notifications)
- [ ] Twilio account (for SMS notifications, optional)
- [ ] Expo account (for push notifications)
- [ ] 1-2 hours of dedicated time

## Required Information

Have these ready before starting:
- Database connection string (PostgreSQL)
- Admin email and password
- Agency name and operating states
- EVV provider credentials (per state)
```

### Step-by-Step Deployment

```markdown
## Step 1: Fork and Clone Repository

1. Fork the repository to your GitHub account
2. Clone to your local machine:
   ```bash
   git clone https://github.com/YOUR-ORG/care-commons.git
   cd care-commons
   ```

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Fill in required values:
   ```bash
   # Database
   DATABASE_URL=postgresql://user:pass@host:5432/dbname

   # Authentication
   JWT_SECRET=$(openssl rand -base64 32)
   JWT_REFRESH_SECRET=$(openssl rand -base64 32)

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret

   # SendGrid (email notifications)
   SENDGRID_API_KEY=SG.xxxx
   SENDGRID_FROM_EMAIL=notifications@youragency.com

   # Twilio (SMS notifications, optional)
   TWILIO_ACCOUNT_SID=ACxxxx
   TWILIO_AUTH_TOKEN=xxxx
   TWILIO_FROM_NUMBER=+1234567890

   # Application
   NODE_ENV=production
   APP_URL=https://your-app.vercel.app
   ```

3. **Validate environment variables:**
   ```bash
   npm run validate:env
   ```
   This script checks that all required variables are set and formatted correctly.

## Step 3: Set Up Database

1. **Run migrations:**
   ```bash
   npm run migrate:latest
   ```

2. **Seed initial data:**
   ```bash
   npm run seed:initial
   ```
   This creates:
   - System admin user
   - Default rate schedules
   - EVV provider configurations
   - Care plan templates

3. **Verify database:**
   ```bash
   npm run db:verify
   ```
   Checks that all tables exist and are properly configured.

## Step 4: Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Link project:**
   ```bash
   vercel link
   ```
   Follow prompts to create new project or link existing.

4. **Set environment variables in Vercel:**
   ```bash
   npm run deploy:setup-env
   ```
   This script automatically copies .env variables to Vercel.

5. **Deploy:**
   ```bash
   vercel --prod
   ```

6. **Run post-deployment checks:**
   ```bash
   npm run deploy:verify --url https://your-app.vercel.app
   ```

## Step 5: Configure Domain (Optional)

1. In Vercel dashboard, go to project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update APP_URL environment variable
5. Redeploy:
   ```bash
   vercel --prod
   ```

## Step 6: Create First Admin User

1. Access the deployed application
2. Navigate to /admin/setup
3. Create admin account:
   - Email: admin@youragency.com
   - Password: (secure password)
   - Agency name: Your Agency Name
   - Operating states: TX, FL, OH, etc.

4. Verify admin access by logging in

## Step 7: Configure Monitoring

1. **Set up Vercel monitoring:**
   - Analytics: Enable in Vercel dashboard
   - Logs: Configure log drains (optional)

2. **Set up Sentry (error tracking):**
   ```bash
   npm install @sentry/nextjs @sentry/node
   ```
   Configure Sentry DSN in environment variables.

3. **Set up uptime monitoring:**
   - Option A: Vercel Status (built-in)
   - Option B: UptimeRobot (free)
   - Option C: Pingdom

## Step 8: Configure Backups

1. **Database backups:**
   - If using Vercel Postgres: Automatic backups enabled
   - If using external DB: Configure automated backups

2. **Verify backup restoration:**
   ```bash
   npm run backup:test
   ```

## Step 9: Final Validation

Run the production readiness checklist:

```bash
npm run production:checklist
```

This validates:
- [ ] Database is accessible and migrations current
- [ ] All environment variables are set
- [ ] API endpoints respond correctly
- [ ] Authentication works
- [ ] Email notifications send
- [ ] File uploads work
- [ ] Mobile app can connect
- [ ] HTTPS is enforced
- [ ] Security headers are set
- [ ] Monitoring is configured

## Step 10: Go Live!

1. Announce to your team
2. Start with pilot users (2-3 coordinators, 5 caregivers)
3. Monitor for issues in first 48 hours
4. Gradually onboard more users

## Post-Deployment

- [ ] Bookmark monitoring dashboards
- [ ] Set up alerting (email/SMS for downtime)
- [ ] Schedule weekly backup verification
- [ ] Review documentation for operations team
```

---

## Deliverable 2: Self-Hosted Docker Deployment

**File:** `docs/deployment/docker-production-deployment.md`

### Docker Compose Configuration

**docker-compose.production.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: care_commons_production
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: packages/app/Dockerfile
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/care_commons_production
      JWT_SECRET: ${JWT_SECRET}
      # ... other environment variables
    ports:
      - "3001:3001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    build:
      context: .
      dockerfile: packages/web/Dockerfile
    restart: always
    depends_on:
      - api
    environment:
      VITE_API_URL: ${API_URL}
    ports:
      - "3000:80"

  nginx:
    image: nginx:alpine
    restart: always
    depends_on:
      - web
      - api
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  redis_data:
```

### Deployment Script

**scripts/deploy-docker.sh:**
```bash
#!/bin/bash
set -e

echo "🚀 Care Commons Production Deployment"
echo "======================================"

# Validate environment
if [ ! -f .env ]; then
  echo "❌ .env file not found. Copy .env.example and configure it."
  exit 1
fi

source .env

# Validate required variables
required_vars=("DB_USER" "DB_PASSWORD" "JWT_SECRET" "SENDGRID_API_KEY")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Required environment variable $var is not set"
    exit 1
  fi
done

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Build images
echo "🏗️  Building Docker images..."
docker-compose -f docker-compose.production.yml build

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.production.yml run --rm api npm run migrate:latest

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Run health checks
echo "✅ Running health checks..."
./scripts/health-check.sh

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Application: http://localhost"
echo "📊 API: http://localhost:3001"
echo ""
echo "Next steps:"
echo "1. Verify application is accessible"
echo "2. Create first admin user at /admin/setup"
echo "3. Configure monitoring and backups"
```

---

## Deliverable 3: Automated Deployment Scripts

### Environment Validation Script

**scripts/validate-env.js:**
```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'NODE_ENV',
  'APP_URL',
];

const OPTIONAL_VARS = [
  'SENDGRID_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'GOOGLE_CLIENT_ID',
];

console.log('🔍 Validating environment variables...\n');

let hasErrors = false;

// Check required variables
REQUIRED_VARS.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.error(`❌ Missing required variable: ${varName}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName} is set`);
  }
});

// Check optional variables
console.log('\n📋 Optional variables:');
OPTIONAL_VARS.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.warn(`⚠️  ${varName} is not set (optional)`);
  } else {
    console.log(`✅ ${varName} is set`);
  }
});

// Validate DATABASE_URL format
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    if (!url.protocol.startsWith('postgres')) {
      console.error('❌ DATABASE_URL must be a PostgreSQL connection string');
      hasErrors = true;
    }
  } catch (e) {
    console.error('❌ DATABASE_URL is not a valid URL');
    hasErrors = true;
  }
}

// Validate JWT secrets are strong
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️  JWT_SECRET should be at least 32 characters for security');
}

if (hasErrors) {
  console.error('\n❌ Environment validation failed');
  process.exit(1);
} else {
  console.log('\n✅ Environment validation passed');
  process.exit(0);
}
```

### Post-Deployment Health Check

**scripts/health-check.sh:**
```bash
#!/bin/bash

APP_URL=${1:-http://localhost:3000}
API_URL=${2:-http://localhost:3001}

echo "🏥 Running health checks..."
echo "App URL: $APP_URL"
echo "API URL: $API_URL"
echo ""

# Check API health endpoint
echo "1. Checking API health..."
if curl -f -s "$API_URL/health" > /dev/null; then
  echo "   ✅ API is healthy"
else
  echo "   ❌ API health check failed"
  exit 1
fi

# Check database connection
echo "2. Checking database connection..."
if curl -f -s "$API_URL/health/db" > /dev/null; then
  echo "   ✅ Database is connected"
else
  echo "   ❌ Database connection failed"
  exit 1
fi

# Check web app loads
echo "3. Checking web app..."
if curl -f -s "$APP_URL" > /dev/null; then
  echo "   ✅ Web app is accessible"
else
  echo "   ❌ Web app failed to load"
  exit 1
fi

# Check authentication endpoint
echo "4. Checking authentication..."
if curl -f -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}' | grep -q "error"; then
  echo "   ✅ Auth endpoint is responding"
else
  echo "   ⚠️  Auth endpoint may have issues (check logs)"
fi

echo ""
echo "✅ All health checks passed!"
```

---

## Deliverable 4: Production Operations Documentation

### Monitoring Setup

**docs/operations/monitoring.md:**
- Vercel Analytics configuration
- Sentry error tracking setup
- Database performance monitoring
- API response time tracking
- Uptime monitoring
- Alert configuration (email/SMS/Slack)

### Backup and Restore Procedures

**docs/operations/backup-restore.md:**
- Automated daily backups
- Backup verification procedures
- Point-in-time recovery
- Disaster recovery playbook
- RTO/RPO targets

### Scaling Guidelines

**docs/operations/scaling.md:**
- When to scale up (metrics to watch)
- Vercel auto-scaling (serverless)
- Database scaling (connection pooling, read replicas)
- Redis caching for performance
- CDN configuration for static assets

### Incident Response Playbook

**docs/operations/incident-response.md:**
- Severity levels (P0-P3)
- On-call procedures
- Rollback procedures
- Common issues and solutions
- Escalation paths

---

## Success Criteria

- [ ] Vercel deployment completes in <2 hours following runbook
- [ ] Docker deployment completes in <3 hours
- [ ] All deployment steps are documented with screenshots
- [ ] Environment validation catches missing/incorrect variables
- [ ] Health checks verify deployment success
- [ ] Rollback procedures are tested and documented
- [ ] Monitoring is configured by default
- [ ] Backups are automated and verified
- [ ] Operations team can deploy without developer support

---

## Related Tasks

- Task 0033: Monitoring, Error Tracking, Observability
- Task 0034: Backup and Disaster Recovery
- Task 0053: Load Testing and Performance Baselines
- Task 0054: Production Monitoring Dashboard
- Task 0077: HIPAA Compliance Verification
