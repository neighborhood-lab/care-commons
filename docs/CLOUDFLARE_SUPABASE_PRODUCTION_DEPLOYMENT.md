# Cloudflare + Supabase Production Deployment Guide

**Status**: Ready for Production Deployment  
**Last Updated**: November 17, 2025  
**Estimated Setup Time**: 2-4 hours

---

## Executive Summary

This document provides the complete deployment guide for Care Commons production SaaS using Cloudflare Workers (API) + Cloudflare Pages (Frontend) + Supabase (PostgreSQL database).

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│            PRODUCTION SAAS (Multi-Tenant)               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Cloudflare Pages (Static Frontend)                     │
│    ↓                                                     │
│  Cloudflare Workers (API)                               │
│    ↓                                                     │
│  Hyperdrive (Connection Pooling)                        │
│    ↓                                                     │
│  Supabase PostgreSQL (Multi-tenant database)            │
│                                                          │
│  Features:                                               │
│  ✅ Google OAuth signup                                  │
│  ✅ Stripe billing integration (DB ready)               │
│  ✅ Organization creation wizard                        │
│  ✅ Team invitations                                     │
│  ✅ Empty state (customers build own data)              │
│  ✅ Row-Level Security enforced                         │
│  ✅ HIPAA-compliant audit trails                        │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### 1. Required Accounts

- [x] **GitHub** - For code repository and CI/CD
- [ ] **Cloudflare** - For Workers, Pages, and Hyperdrive
- [ ] **Supabase** - For PostgreSQL database (Project: `aoxifllwcujpinwfaxmu`)
- [ ] **Stripe** - For subscription billing (optional for MVP)
- [ ] **Domain** - `care-commons.com` (or your custom domain)

### 2. Command-Line Tools

```bash
# Install required CLIs
npm install -g wrangler@latest     # Cloudflare Workers CLI
npm install -g supabase@latest     # Supabase CLI
npm install -g stripe@latest       # Stripe CLI (optional)

# Verify installations
wrangler --version                 # Should be v4.47.0+
supabase --version                 # Should be v2.58.0+
node --version                     # Must be v22.x
npm --version                      # Must be v10.9.0+
```

### 3. Environment Setup

```bash
# Clone repository
git clone https://github.com/neighborhood-lab/care-commons.git
cd care-commons

# Install dependencies
npm install

# Run checks to ensure everything is working
./scripts/brief-check.sh
```

---

## Part 1: Supabase Database Setup

### Step 1.1: Create Supabase Project (Already Done)

Project Reference: `aoxifllwcujpinwfaxmu`  
Region: `us-east-1`  
Status: ✅ Created

### Step 1.2: Get Connection Strings

1. Go to: https://supabase.com/dashboard/project/aoxifllwcujpinwfaxmu/settings/database
2. Copy **Transaction Pooler** connection string (port 6543):

```
postgres://postgres.aoxifllwcujpinwfaxmu:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

3. Save password securely (you'll need it for migrations)

### Step 1.3: Run Database Migrations

```bash
# Set database URL (use Transaction pooler)
export DATABASE_URL="postgres://postgres.aoxifllwcujpinwfaxmu:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Run migrations
npm run db:migrate

# Verify migrations
npm run db:migrate:status
```

**Expected Output:**
```
✅ 36 migrations applied successfully
✅ Including: subscriptions, billing_usage tables
```

### Step 1.4: Create Initial Admin User (Manual)

**IMPORTANT**: For security, create the first admin user manually in Supabase SQL Editor:

```sql
-- Create Texas demo organization
INSERT INTO organizations (
  id, name, state_code, email, primary_address, 
  created_by, updated_by
) VALUES (
  gen_random_uuid(),
  'Care Commons Demo',
  'TX',
  'admin@carecommons.example',
  '{"line1": "123 Demo St", "city": "Austin", "state": "TX", "zipCode": "78701", "country": "USA"}'::jsonb,
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000'
) RETURNING id;

-- Copy the organization ID from above, then create admin user
INSERT INTO users (
  organization_id,
  username,
  email,
  password_hash,
  first_name,
  last_name,
  role,
  status,
  created_by,
  updated_by
) VALUES (
  'PASTE_ORGANIZATION_ID_HERE',
  'admin',
  'admin@carecommons.example',
  '$2b$10$YourHashedPasswordHere', -- Generate with: bcrypt.hash('your-password', 10)
  'System',
  'Administrator',
  'ADMINISTRATOR',
  'ACTIVE',
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000'
);
```

**Generate password hash:**
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourSecurePassword123!', 10).then(console.log)"
```

---

## Part 2: Cloudflare Setup

### Step 2.1: Create Cloudflare Account

1. Go to: https://dash.cloudflare.com/sign-up
2. Verify email
3. Note your **Account ID** (found in dashboard URL)

### Step 2.2: Add Domain to Cloudflare

1. Add site: `care-commons.com`
2. Follow nameserver instructions
3. Wait for DNS propagation (~24 hours max)
4. Set up DNS records:

```
Type    Name              Content                        Proxy
────    ────              ───────                        ─────
A       @                 192.0.2.1 (placeholder)        ☑️ Proxied
A       www               192.0.2.1 (placeholder)        ☑️ Proxied
CNAME   api               care-commons-api.workers.dev   ☑️ Proxied
```

### Step 2.3: Create Hyperdrive Configuration

Hyperdrive provides connection pooling for Postgres:

```bash
# Authenticate with Cloudflare
wrangler login

# Create Hyperdrive configuration
# IMPORTANT: Escape special characters in password:
# - $ becomes \$
# - ! becomes \!
# - @ becomes \@
wrangler hyperdrive create care-commons-db \
  --connection-string="postgres://postgres.aoxifllwcujpinwfaxmu:YOUR_ESCAPED_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Expected Output:**
```
✅ Created Hyperdrive config
ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Name: care-commons-db
```

**CRITICAL**: Copy the Hyperdrive ID and update `wrangler.toml`:

```toml
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Paste your ID here
caching = { disabled = false }
```

### Step 2.4: Configure Secrets

Set all required secrets for production:

```bash
# Database (Supabase connection string)
wrangler secret put DATABASE_URL --env production
# Enter: postgres://postgres.aoxifllwcujpinwfaxmu:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# JWT secrets (generate with: openssl rand -base64 32)
wrangler secret put JWT_SECRET --env production
wrangler secret put JWT_REFRESH_SECRET --env production
wrangler secret put SESSION_SECRET --env production

# Encryption key (generate with: openssl rand -hex 32)
wrangler secret put ENCRYPTION_KEY --env production

# Google OAuth (from Google Cloud Console)
wrangler secret put GOOGLE_CLIENT_ID --env production
wrangler secret put GOOGLE_CLIENT_SECRET --env production

# Supabase API keys (from Dashboard → Settings → API)
wrangler secret put SUPABASE_URL --env production
# Enter: https://aoxifllwcujpinwfaxmu.supabase.co

wrangler secret put SUPABASE_ANON_KEY --env production
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production

# Verify secrets
wrangler secret list --env production
```

**Optional Secrets** (for advanced features):

```bash
# Geocoding API (for address validation)
wrangler secret put GEOCODING_API_KEY --env production

# HHAeXchange (Texas EVV integration)
wrangler secret put HHAEXCHANGE_CLIENT_ID --env production
wrangler secret put HHAEXCHANGE_CLIENT_SECRET --env production
wrangler secret put HHAEXCHANGE_BASE_URL --env production

# Sentry (error monitoring)
wrangler secret put SENTRY_DSN --env production

# Stripe (billing integration)
wrangler secret put STRIPE_SECRET_KEY --env production
wrangler secret put STRIPE_WEBHOOK_SECRET --env production
```

### Step 2.5: Deploy Workers (API)

```bash
# Build application
npm run build

# Deploy to production
wrangler deploy --env production

# Test health endpoint
curl https://api.care-commons.com/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-17T12:00:00.000Z",
  "database": "connected",
  "version": "0.1.0"
}
```

### Step 2.6: Deploy Pages (Frontend)

```bash
# Build frontend
npm run build:web

# Deploy to Cloudflare Pages
wrangler pages deploy public --project-name=care-commons-web --branch=main

# Or use the Pages dashboard:
# 1. Go to: https://dash.cloudflare.com/pages
# 2. Create project: care-commons-web
# 3. Connect to GitHub repo
# 4. Build settings:
#    - Build command: npm run build:web
#    - Build output: public
#    - Environment variables: Add VITE_API_URL=https://api.care-commons.com
```

---

## Part 3: GitHub Actions Setup

### Step 3.1: Add Repository Secrets

Go to: https://github.com/neighborhood-lab/care-commons/settings/secrets/actions

Add these secrets:

```
CLOUDFLARE_API_TOKEN          # From Cloudflare → My Profile → API Tokens
CLOUDFLARE_ACCOUNT_ID         # From Cloudflare dashboard URL
SUPABASE_ACCESS_TOKEN         # From Supabase → Settings → Access Tokens
SUPABASE_DB_PASSWORD          # Database password
SUPABASE_DATABASE_URL         # Full connection string
```

### Step 3.2: Enable GitHub Environments

1. Go to: https://github.com/neighborhood-lab/care-commons/settings/environments
2. Create environment: `production`
3. Add protection rules:
   - ✅ Required reviewers: 1
   - ✅ Wait timer: 0 minutes
4. Create environment: `staging`

### Step 3.3: Test Deployment Workflow

```bash
# Create production branch
git checkout -b production
git push origin production

# This triggers:
# 1. Quality checks (lint, typecheck, tests)
# 2. Database migrations
# 3. Build application
# 4. Deploy Workers (API)
# 5. Deploy Pages (Frontend)
# 6. Verification health checks
```

---

## Part 4: Stripe Integration (Optional for MVP)

### Step 4.1: Create Stripe Account

1. Go to: https://stripe.com/
2. Sign up for account
3. Complete KYC verification (1-2 days)

### Step 4.2: Create Products and Prices

```bash
# Install Stripe CLI
stripe login

# Create products
stripe products create \
  --name="Care Commons Starter" \
  --description="Up to 50 clients, 50 caregivers"

stripe prices create \
  --product=prod_xxx \
  --unit-amount=4900 \
  --currency=usd \
  --recurring[interval]=month

# Repeat for Professional and Enterprise plans
```

### Step 4.3: Set Up Webhooks

1. Go to: https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://api.care-commons.com/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy webhook signing secret

```bash
# Add webhook secret to Cloudflare
wrangler secret put STRIPE_WEBHOOK_SECRET --env production
```

---

## Part 5: Production Checklist

### Pre-Launch Verification

- [ ] **Database**: Migrations run successfully on Supabase
- [ ] **API**: Health endpoint returns 200 at https://api.care-commons.com/health
- [ ] **Frontend**: Homepage loads at https://care-commons.com
- [ ] **Login**: Admin can log in successfully
- [ ] **DNS**: Domain resolves correctly
- [ ] **SSL**: HTTPS works (Cloudflare provides SSL)
- [ ] **Secrets**: All environment variables set
- [ ] **Monitoring**: Error tracking configured (Sentry)
- [ ] **Backups**: Supabase automatic backups enabled
- [ ] **GitHub Actions**: CI/CD pipeline runs successfully

### Security Checklist

- [ ] **HTTPS**: Enforced on all routes
- [ ] **CORS**: Configured to allow only production domains
- [ ] **Rate Limiting**: Enabled on auth endpoints
- [ ] **JWT**: Secrets rotated from defaults
- [ ] **Database**: RLS policies enforced
- [ ] **Audit Logs**: PHI access tracked
- [ ] **Encryption**: At rest (Supabase) and in transit (SSL)

### Compliance Checklist

- [ ] **HIPAA**: BAA signed with Supabase (request from support)
- [ ] **HIPAA**: BAA signed with Cloudflare (Enterprise plan required - $200/month)
- [ ] **Privacy Policy**: Published and linked
- [ ] **Terms of Service**: Published and linked
- [ ] **Data Retention**: Policy documented and implemented
- [ ] **Incident Response**: Plan documented

---

## Part 6: Monitoring & Maintenance

### Cloudflare Analytics

- Dashboard: https://dash.cloudflare.com/
- Workers: Monitor request volume, CPU time, errors
- Pages: Monitor page views, bandwidth

### Supabase Monitoring

- Dashboard: https://supabase.com/dashboard/project/aoxifllwcujpinwfaxmu
- Database: Monitor connections, queries, storage
- Logs: View API logs and database logs

### Health Checks

Set up uptime monitoring (e.g., UptimeRobot, Pingdom):

```
API Health:      https://api.care-commons.com/health (every 5 min)
Frontend:        https://care-commons.com (every 5 min)
```

### Backup Strategy

Supabase automatic backups:
- Point-in-Time Recovery: 7 days (Pro plan)
- Manual backups: Weekly via Supabase dashboard

---

## Part 7: Cost Breakdown

### Monthly Infrastructure Costs

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| **Cloudflare Workers** | Paid (5M requests) | $5 | First 100k free |
| **Cloudflare Pages** | Free | $0 | Unlimited static hosting |
| **Supabase** | Pro | $25 | 8GB database, 50GB transfer |
| **Hyperdrive** | Paid (1M queries) | $5 | Connection pooling |
| **Domain** | care-commons.com | $1/month | $12/year |
| | | | |
| **Total (0-10 customers)** | | **~$36/month** | |
| **Total (10-50 customers)** | | **~$100-150/month** | May need Supabase scaling |
| **Total (50-100 customers)** | | **~$200-300/month** | + Stripe fees |

**Stripe Fees**: 2.9% + $0.30 per transaction

**Break-even Analysis** (at $49/month/customer):
- 2 customers: Break even
- 10 customers: ~$390/month profit
- 50 customers: ~$2,150/month profit

---

## Part 8: Troubleshooting

### Common Issues

#### Issue: "Hyperdrive connection failed"
**Solution**: Ensure password is properly escaped in connection string. Use Transaction pooler (port 6543), not Direct connection (port 5432).

#### Issue: "Module not found" in Workers
**Solution**: Ensure all imports use `.js` extensions. Run `npm run build` before deploying.

#### Issue: "Database connection exhausted"
**Solution**: Verify Hyperdrive is configured correctly in `wrangler.toml`. Check Supabase connection limits.

#### Issue: "CORS error in frontend"
**Solution**: Update `CORS_ORIGIN` in `wrangler.toml` to include your production domain.

#### Issue: "Login fails with 401"
**Solution**: Verify JWT secrets are set correctly. Check that admin user exists in database.

---

## Part 9: Rollback Procedure

If deployment fails:

```bash
# Rollback Workers
wrangler rollback --env production

# Rollback Pages
wrangler pages deployment tail --project-name=care-commons-web
# Copy previous deployment ID
wrangler pages deployment rollback --deployment-id=PREVIOUS_ID

# Rollback database migrations
npm run db:migrate:rollback
```

---

## Part 10: Next Steps After Launch

### Immediate (Week 1)
- [ ] Monitor error logs daily
- [ ] Verify all production features work
- [ ] Test signup flow end-to-end
- [ ] Confirm billing integration (if enabled)
- [ ] Set up uptime monitoring

### Short-term (Month 1)
- [ ] Onboard 3-5 beta customers
- [ ] Gather user feedback
- [ ] Fix critical bugs
- [ ] Implement email service (Resend) for invitations
- [ ] Complete Stripe billing service implementation

### Long-term (Quarter 1)
- [ ] Scale infrastructure as needed
- [ ] Add more US states
- [ ] Implement advanced features
- [ ] Marketing and customer acquisition
- [ ] HIPAA compliance audit

---

## Support & Resources

- **Cloudflare Docs**: https://developers.cloudflare.com/
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Care Commons Repo**: https://github.com/neighborhood-lab/care-commons
- **Issues**: https://github.com/neighborhood-lab/care-commons/issues

---

**Document Status**: ✅ Production Ready  
**Author**: OpenCode AI Assistant  
**Date**: November 17, 2025
