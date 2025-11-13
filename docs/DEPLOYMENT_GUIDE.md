# Care Commons Deployment Guide

Complete guide for deploying Care Commons to production or preview environments.

## 📋 Table of Contents

- [Deployment Options](#deployment-options)
- [Quick Start](#quick-start)
- [Option 1: Vercel + Neon](#option-1-vercel--neon)
- [Option 2: Cloudflare + Supabase](#option-2-cloudflare--supabase)
- [GitHub Actions Setup](#github-actions-setup)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Deployment Options

Care Commons supports two deployment platforms, each with specific advantages:

### Vercel + Neon PostgreSQL

**Best For:**
- Teams prioritizing simplicity and speed
- Organizations already using Vercel
- Projects needing minimal DevOps overhead
- Rapid prototyping and MVP development

**Advantages:**
- ✅ Easiest setup (< 10 minutes)
- ✅ Automatic preview deployments for PRs
- ✅ Built-in CDN and edge caching
- ✅ Simple database branching with Neon
- ✅ Generous free tier
- ✅ Excellent DX with instant rollbacks

**Considerations:**
- Cold starts on free tier (< 1s typically)
- Function execution limits (10s on Hobby, 60s on Pro)
- Best for US-East regions (where Neon is fastest)

**Pricing:**
- Hobby: Free (non-commercial)
- Pro: $20/month + usage
- Neon: Free tier available, ~$20-50/month for production

---

### Cloudflare Workers + Supabase

**Best For:**
- Global healthcare organizations
- High-traffic applications (1000+ req/s)
- Cost-sensitive deployments
- Teams with existing Cloudflare infrastructure
- Applications requiring edge compute

**Advantages:**
- ✅ Lowest latency worldwide (300+ edge locations)
- ✅ Best cold start performance (~0ms)
- ✅ Extremely cost-effective at scale
- ✅ No function timeouts (CPU time limits)
- ✅ Built-in DDoS protection
- ✅ Superior WebSocket support

**Considerations:**
- Requires Hyperdrive for Postgres pooling
- More complex initial setup
- Need to manage Workers and Pages separately
- Learning curve for Workers platform

**Pricing:**
- Workers: Free for 100k req/day, then $5/10M requests
- Pages: Free for 500 builds/month
- Supabase: Free tier available, ~$25/month for production

---

## 🚀 Quick Start

### Prerequisites

**Required:**
- Node.js 22.x or higher
- npm 10.9.4 or higher
- Git repository
- GitHub account (for CI/CD)

**Platform-Specific:**
- **Vercel**: Vercel CLI (`npm install -g vercel`)
- **Cloudflare**: Wrangler CLI (`npm install -g wrangler`)

**Database:**
- **Neon**: Neon CLI (`npm install -g neonctl`)
- **Supabase**: Supabase CLI (`npm install -g supabase`) - optional

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/care-commons.git
cd care-commons

# Install dependencies
npm install

# Build the application
npm run build

# Run tests
npm run test
```

---

## Option 1: Vercel + Neon

### Automated Setup (Recommended)

Use our setup script for guided deployment:

```bash
# Preview environment
./scripts/setup-vercel-deployment.sh preview

# Production environment
./scripts/setup-vercel-deployment.sh production
```

The script will:
1. ✅ Verify prerequisites
2. ✅ Create Neon database and branch
3. ✅ Initialize Vercel project
4. ✅ Configure environment variables
5. ✅ Run database migrations
6. ✅ Build and deploy application
7. ✅ Verify deployment health

### Manual Setup

#### Step 1: Create Neon Database

```bash
# Login to Neon
neonctl auth

# Create project
neonctl projects create --name "care-commons"

# Create branches
neonctl branches create --name preview
neonctl branches create --name production

# Get connection strings
neonctl connection-string preview
neonctl connection-string production
```

#### Step 2: Initialize Vercel Project

```bash
# Login to Vercel
vercel login

# Link to project (or create new)
vercel link

# The CLI will prompt for:
# - Set up and deploy? Y
# - Which scope? [your-org]
# - Link to existing project? Y/N
# - What's your project's name? care-commons
```

#### Step 3: Configure Environment Variables

```bash
# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Set preview environment
echo "YOUR_PREVIEW_DATABASE_URL" | vercel env add DATABASE_URL preview
echo "$JWT_SECRET" | vercel env add JWT_SECRET preview
echo "$JWT_REFRESH_SECRET" | vercel env add JWT_REFRESH_SECRET preview
echo "$SESSION_SECRET" | vercel env add SESSION_SECRET preview
echo "$ENCRYPTION_KEY" | vercel env add ENCRYPTION_KEY preview
echo "preview" | vercel env add ENVIRONMENT preview

# Set production environment
echo "YOUR_PRODUCTION_DATABASE_URL" | vercel env add DATABASE_URL production
echo "$JWT_SECRET" | vercel env add JWT_SECRET production
echo "$JWT_REFRESH_SECRET" | vercel env add JWT_REFRESH_SECRET production
echo "$SESSION_SECRET" | vercel env add SESSION_SECRET production
echo "$ENCRYPTION_KEY" | vercel env add ENCRYPTION_KEY production
echo "production" | vercel env add ENVIRONMENT production
```

#### Step 4: Run Migrations

```bash
# Preview
export DATABASE_URL="YOUR_PREVIEW_DATABASE_URL"
npm run db:migrate

# Production
export DATABASE_URL="YOUR_PRODUCTION_DATABASE_URL"
npm run db:migrate
```

#### Step 5: Deploy

```bash
# Preview deployment
vercel deploy

# Production deployment
vercel deploy --prod
```

#### Step 6: Verify

```bash
# Check health endpoint
curl https://your-deployment-url.vercel.app/health

# Expected response:
# {
#   "status": "healthy",
#   "database": "connected",
#   "timestamp": "2025-11-13T..."
# }
```

---

## Option 2: Cloudflare + Supabase

### Automated Setup (Recommended)

Use our setup script for guided deployment:

```bash
# Preview environment
./scripts/setup-cloudflare-deployment.sh preview

# Production environment
./scripts/setup-cloudflare-deployment.sh production
```

The script will:
1. ✅ Verify prerequisites
2. ✅ Authenticate with Cloudflare
3. ✅ Create Supabase database
4. ✅ Configure Hyperdrive (connection pooling)
5. ✅ Set up secrets
6. ✅ Run database migrations
7. ✅ Deploy Workers and Pages
8. ✅ Verify deployment health

### Manual Setup

#### Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Set project name: `care-commons-preview` or `care-commons-production`
4. Choose region: US East (closest to your users)
5. Set database password (save securely!)
6. Wait for project to initialize (~2 minutes)

Get your connection details:
- Project Settings → Database
- Use **Transaction pooler** (port 6543) with `?pgbouncer=true`

```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

#### Step 2: Create Hyperdrive Configuration

Hyperdrive provides connection pooling for Postgres (CRITICAL for Workers):

```bash
# Login to Cloudflare
wrangler login

# Create Hyperdrive
wrangler hyperdrive create care-commons-db-preview \
  --connection-string="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Save the Hyperdrive ID from output
# Add to wrangler.toml:
# [[hyperdrive]]
# binding = "HYPERDRIVE"
# id = "YOUR_HYPERDRIVE_ID"
```

#### Step 3: Configure Secrets

```bash
# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Set secrets for preview environment
echo "YOUR_DATABASE_URL" | wrangler secret put DATABASE_URL --env preview
echo "$JWT_SECRET" | wrangler secret put JWT_SECRET --env preview
echo "$JWT_REFRESH_SECRET" | wrangler secret put JWT_REFRESH_SECRET --env preview
echo "$SESSION_SECRET" | wrangler secret put SESSION_SECRET --env preview
echo "$ENCRYPTION_KEY" | wrangler secret put ENCRYPTION_KEY --env preview

# Set Supabase keys (from Dashboard → Settings → API)
echo "https://PROJECT_REF.supabase.co" | wrangler secret put SUPABASE_URL --env preview
echo "YOUR_ANON_KEY" | wrangler secret put SUPABASE_ANON_KEY --env preview

# Repeat for production environment with --env production
```

#### Step 4: Run Migrations

```bash
export DATABASE_URL="YOUR_SUPABASE_DATABASE_URL"
npm run db:migrate
```

#### Step 5: Deploy Workers and Pages

```bash
# Build application
npm run build

# Deploy Workers (API backend)
wrangler deploy --env preview

# Deploy Pages (frontend)
wrangler pages deploy packages/web/dist \
  --project-name="care-commons-web" \
  --branch="preview"
```

#### Step 6: Verify

```bash
# Check Workers health
curl https://care-commons-api-preview.your-subdomain.workers.dev/health

# Check Pages deployment
curl https://preview.care-commons.pages.dev
```

---

## 🔄 GitHub Actions Setup

Automate deployments with GitHub Actions for both preview and production environments.

### Required GitHub Secrets

Navigate to: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

#### For Vercel Deployment:

| Secret Name | Description | Where to Find |
|-------------|-------------|---------------|
| `VERCEL_TOKEN` | Vercel API token | Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Organization ID | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | Project ID | `.vercel/project.json` after `vercel link` |
| `DATABASE_URL` | Production database | Neon Dashboard → Connection String |
| `PREVIEW_DATABASE_URL` | Preview database | Neon Dashboard → Preview Branch Connection |

#### For Cloudflare Deployment:

| Secret Name | Description | Where to Find |
|-------------|-------------|---------------|
| `CLOUDFLARE_API_TOKEN` | API token with Workers/Pages permissions | Cloudflare Dashboard → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID | Cloudflare Dashboard → Workers → Overview |
| `SUPABASE_DATABASE_URL` | Production database | Supabase Dashboard → Database Settings |
| `SUPABASE_DATABASE_URL_PREVIEW` | Preview database | Supabase Dashboard → Preview Project |
| `SUPABASE_ACCESS_TOKEN` | Optional for CLI operations | Supabase Dashboard → Settings → Access Tokens |

### Branch Strategy

```
develop → preview → main (production)
   ↓         ↓         ↓
  Local   Preview   Production
          Deploy    Deploy
```

- **`preview` branch**: Deploys to preview environment
- **`main` branch**: Deploys to production environment
- **Pull Requests**: Run tests and build verification

### Workflow Files

**Vercel**: `.github/workflows/deploy-vercel.yml`
**Cloudflare**: `.github/workflows/deploy-cloudflare-updated.yml`

### Manual Deployment Triggers

You can manually trigger deployments:

1. Go to **Actions** tab
2. Select workflow (Deploy to Vercel or Deploy to Cloudflare)
3. Click **Run workflow**
4. Choose environment (preview/production)
5. Optionally skip tests or migrations (emergencies only)

---

## 📊 Post-Deployment

### Health Checks

Verify your deployment:

```bash
# Check API health
curl https://your-deployment-url/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "environment": "production|preview",
  "timestamp": "2025-11-13T...",
  "version": "0.1.0"
}
```

### Seed Demo Data (Optional)

```bash
# Set DATABASE_URL for target environment
export DATABASE_URL="YOUR_DATABASE_URL"

# Seed Texas + Florida demo data
node --import tsx packages/core/scripts/seed-tx-fl-demo.ts

# Or comprehensive showcase data
node --import tsx packages/core/scripts/seed-showcase-comprehensive.ts
```

### Monitoring Setup

1. **Vercel**: Built-in analytics and logs
   - Dashboard → Your Project → Analytics
   - Real-time logs in dashboard

2. **Cloudflare**: Workers Analytics
   - Dashboard → Workers → Your Worker → Metrics
   - Set up logpush for persistent logs

3. **Sentry** (Optional):
   ```bash
   # Add Sentry DSN as secret
   echo "YOUR_SENTRY_DSN" | vercel env add SENTRY_DSN production
   # or
   echo "YOUR_SENTRY_DSN" | wrangler secret put SENTRY_DSN --env production
   ```

### Custom Domain Setup

#### Vercel:
1. Dashboard → Your Project → Settings → Domains
2. Add domain
3. Update DNS with provided records
4. SSL automatically provisioned

#### Cloudflare:
1. Dashboard → Workers → Your Worker → Triggers → Routes
2. Add route pattern: `api.yourdomain.com/*`
3. Dashboard → Pages → Your Project → Custom Domains
4. Add `yourdomain.com` and `www.yourdomain.com`

---

## 🔧 Troubleshooting

### Common Issues

#### ❌ "Module not found" errors (Vercel)

**Cause**: Missing `.js` extensions in imports (ESM requirement)

**Fix**: Ensure all relative imports include `.js`:
```typescript
// ❌ Wrong
import { foo } from './bar';

// ✅ Correct
import { foo } from './bar.js';
```

Run `npm run build` to verify all imports compile correctly.

---

#### ❌ Database connection timeout (Cloudflare)

**Cause**: Not using Hyperdrive for connection pooling

**Fix**: Ensure Hyperdrive is configured in `wrangler.toml`:
```toml
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "YOUR_HYPERDRIVE_ID"
```

Verify connection string uses Transaction pooler (port 6543).

---

#### ❌ "Too many database connections"

**Cause**: Connection pooling not properly configured

**Fix**:
- **Neon**: Use pooled connection string (includes `?pooler=true`)
- **Supabase**: Use Transaction pooler (port 6543 with `?pgbouncer=true`)
- Ensure connections are properly closed after use

---

#### ❌ Cold start performance issues (Vercel)

**Symptoms**: First request after inactivity is slow (> 3s)

**Mitigations**:
1. Upgrade to Vercel Pro (significantly reduces cold starts)
2. Use cron job to keep functions warm:
   ```bash
   # Set up external monitor (e.g., UptimeRobot) to ping /health every 5 minutes
   ```
3. Consider Cloudflare Workers (0ms cold starts)

---

#### ❌ Health check failing after deployment

**Potential Causes**:
1. Database migrations not run
2. Incorrect environment variables
3. Database connection string malformed
4. Deployment not yet propagated

**Debug Steps**:
```bash
# Check logs
vercel logs YOUR_DEPLOYMENT_URL
# or
wrangler tail --env production

# Verify environment variables
vercel env ls
# or
wrangler secret list --env production

# Test database connection locally
export DATABASE_URL="YOUR_DATABASE_URL"
npm run db:status
```

---

### Getting Help

- **Documentation**: Check other docs in `/docs` directory
- **GitHub Issues**: https://github.com/your-org/care-commons/issues
- **Community**: [Your community channel]

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Supabase Documentation](https://supabase.com/docs)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
