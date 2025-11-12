# Cloudflare Deployment Guide

This guide covers deploying Care Commons to Cloudflare's edge platform. We maintain **dual deployment support** for both Vercel (default) and Cloudflare.

## Architecture Overview

### Cloudflare Deployment Stack

- **Frontend**: Cloudflare Pages (React SPA)
- **API**: Cloudflare Workers (Express on edge)
- **Database**: Neon PostgreSQL (via Hyperdrive for connection pooling)
- **Cache**: Cloudflare KV (optional, alternative to Redis)
- **Storage**: Cloudflare R2 (optional, for file uploads)
- **CDN**: Cloudflare global edge network

### vs Vercel Deployment

| Component | Vercel | Cloudflare |
|-----------|--------|------------|
| Frontend | Vercel Edge | Cloudflare Pages |
| API | Vercel Serverless | Cloudflare Workers |
| Database | Neon PostgreSQL | Neon PostgreSQL via Hyperdrive |
| Cache | Redis/Upstash | Cloudflare KV |
| File Storage | Vercel Blob | Cloudflare R2 |
| Pricing | $20/mo per member | ~$5/mo for typical usage |

## Prerequisites

1. **Cloudflare Account** (Free or Pro)
   - Sign up at https://dash.cloudflare.com/sign-up

2. **Wrangler CLI** (Already installed globally)
   ```bash
   wrangler --version  # Should show 4.47.0+
   ```

3. **Domain** (Optional but recommended)
   - Add your domain to Cloudflare
   - Update DNS to use Cloudflare nameservers

4. **Neon Database** (Existing PostgreSQL database)
   - Connection string from Neon dashboard

## Initial Setup

### 1. Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser to authenticate. Grant Wrangler access to your account.

### 2. Create Hyperdrive Configuration (Recommended)

Hyperdrive provides connection pooling and reduces latency for PostgreSQL:

```bash
# Get your Neon connection string
export DATABASE_URL="postgresql://user:pass@host.neon.tech:5432/dbname?sslmode=require"

# Create Hyperdrive configuration
wrangler hyperdrive create care-commons-db --connection-string="$DATABASE_URL"

# Save the returned ID and update wrangler.toml:
# [[hyperdrive]]
# binding = "DATABASE"
# id = "YOUR_HYPERDRIVE_ID"
```

### 3. Set Secrets

```bash
# Database (if not using Hyperdrive)
wrangler secret put DATABASE_URL

# JWT secrets (generate with: openssl rand -base64 32)
wrangler secret put JWT_SECRET
wrangler secret put JWT_REFRESH_SECRET
wrangler secret put SESSION_SECRET

# Encryption key (generate with: openssl rand -hex 32)
wrangler secret put ENCRYPTION_KEY

# Google OAuth (optional)
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET

# Geocoding API key
wrangler secret put GEOCODING_API_KEY

# Sentry DSN (optional)
wrangler secret put SENTRY_DSN
```

### 4. Configure KV Namespaces (Optional - for caching)

```bash
# Create KV namespace for caching
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "CACHE" --preview

# Update wrangler.toml with the returned IDs:
# [[kv_namespaces]]
# binding = "CACHE"
# id = "YOUR_KV_NAMESPACE_ID"
# preview_id = "YOUR_PREVIEW_KV_NAMESPACE_ID"
```

### 5. Configure R2 Bucket (Optional - for file uploads)

```bash
# Create R2 bucket for uploads
wrangler r2 bucket create care-commons-uploads
wrangler r2 bucket create care-commons-uploads-preview

# Update wrangler.toml
```

## Deployment

### Deploy API (Cloudflare Workers)

```bash
# Staging environment
npm run deploy:cloudflare:staging

# Production environment
npm run deploy:cloudflare:production

# Or use wrangler directly
wrangler deploy --env production
```

### Deploy Frontend (Cloudflare Pages)

#### Option 1: CLI Deployment

```bash
# Build frontend
npm run build:web

# Deploy to Cloudflare Pages
npm run deploy:cloudflare:pages
```

#### Option 2: Git Integration (Recommended for CI/CD)

1. Go to Cloudflare Dashboard → Pages
2. Click "Create a project"
3. Connect to GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build:web`
   - **Build output directory**: `packages/web/dist`
   - **Root directory**: `/`
   - **Node version**: `22`

5. Set environment variables:
   ```
   NODE_ENV=production
   VITE_API_URL=https://api.care-commons.com
   ```

6. Deploy

### Custom Domain Setup

#### API Domain (Cloudflare Workers)

1. Add route in `wrangler.toml`:
   ```toml
   routes = [
     { pattern = "api.care-commons.com/*", zone_name = "care-commons.com" }
   ]
   ```

2. Deploy: `wrangler deploy --env production`

3. DNS will be configured automatically

#### Frontend Domain (Cloudflare Pages)

1. Go to Pages project → Custom domains
2. Add `care-commons.com` and `www.care-commons.com`
3. Cloudflare will configure DNS automatically

## Environment Variables

### Worker Environment Variables (wrangler.toml)

```toml
[vars]
NODE_ENV = "production"
LOG_LEVEL = "info"
CORS_ORIGIN = "https://care-commons.com,https://www.care-commons.com"
```

### Worker Secrets (Sensitive)

Use `wrangler secret put <NAME>`:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `SESSION_SECRET` - Session encryption secret
- `ENCRYPTION_KEY` - Field encryption key (SSN, etc.)
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret
- `GEOCODING_API_KEY` - Mapbox/Google geocoding key

### Pages Environment Variables

Set in Cloudflare Dashboard → Pages → Settings → Environment variables:
- `VITE_API_URL` - API endpoint URL
- `NODE_ENV` - `production` or `staging`

## Database Migrations

Run migrations **before** deploying:

```bash
# Set DATABASE_URL to your environment
export DATABASE_URL="your_database_url_here"

# Run migrations
npm run db:migrate

# Verify
npm run db:migrate:status
```

## Monitoring and Debugging

### View Logs

```bash
# Real-time logs (tail)
wrangler tail

# Filter by environment
wrangler tail --env production

# Filter by status
wrangler tail --status error
```

### View Metrics

```bash
# View deployment details
wrangler deployments list

# View analytics
wrangler analytics
```

### Debugging

```bash
# Local development with Miniflare
wrangler dev

# Test worker locally
curl http://localhost:8787/health
```

## Rollback

### Rollback Worker Deployment

```bash
# List recent deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback <DEPLOYMENT_ID>
```

### Rollback Pages Deployment

1. Go to Cloudflare Dashboard → Pages → Project
2. Deployments tab
3. Click "..." on previous successful deployment
4. Select "Rollback to this deployment"

## Cost Estimation

Cloudflare pricing is usage-based. Typical costs for a small-medium home health agency:

### Workers (API)
- **Free tier**: 100,000 requests/day
- **Paid**: $5/mo for 10M requests
- **Typical usage**: ~$5-10/mo

### Pages (Frontend)
- **Free tier**: Unlimited bandwidth
- **Builds**: 500 builds/month free
- **Typical usage**: $0/mo

### R2 Storage (if used)
- **Free tier**: 10GB storage
- **Operations**: First 1M free
- **Typical usage**: $0-5/mo

### KV (if used)
- **Free tier**: 100,000 reads/day
- **Paid**: $0.50 per million reads
- **Typical usage**: $0-2/mo

### Hyperdrive (Database pooling)
- **Included** in Workers Paid plan
- **No additional cost**

### Total Estimated Cost
- **Small agency (< 10k requests/day)**: ~$0-5/mo
- **Medium agency (100k requests/day)**: ~$10-20/mo
- **Large agency (1M requests/day)**: ~$50-100/mo

Compare to Vercel Pro at $20/member/mo.

## CI/CD Integration

### GitHub Actions (Recommended)

Create `.github/workflows/cloudflare-deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches:
      - main
      - preview

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    name: Deploy API to Cloudflare Workers
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}

  deploy-frontend:
    runs-on: ubuntu-latest
    name: Deploy Frontend to Cloudflare Pages
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run build:web
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: care-commons
          directory: packages/web/dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### Required Secrets

Add to GitHub repository settings → Secrets:
- `CLOUDFLARE_API_TOKEN` - Create at Cloudflare Dashboard → Profile → API Tokens
- `CLOUDFLARE_ACCOUNT_ID` - Found in Cloudflare Dashboard → Workers & Pages

## Troubleshooting

### Issue: Worker fails to start

**Error**: `Module worker script timed out`

**Solution**: Check that all dependencies are compatible with Workers runtime. Some Node.js APIs are not available.

### Issue: Database connection fails

**Error**: `ECONNREFUSED` or timeout

**Solution**: 
1. Verify DATABASE_URL secret is set correctly
2. Use Hyperdrive for better connection pooling
3. Check Neon IP allowlist (Cloudflare IPs must be allowed)

### Issue: CORS errors

**Solution**: Update CORS_ORIGIN in wrangler.toml to include your frontend domain

### Issue: Build fails

**Error**: `Cannot find module ...`

**Solution**: Ensure all packages are built before deploying:
```bash
npm run build
wrangler deploy
```

## Support

For Cloudflare-specific issues:
- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- Cloudflare Pages Docs: https://developers.cloudflare.com/pages/
- Community Discord: https://discord.cloudflare.com

For Care Commons deployment issues:
- GitHub Issues: https://github.com/neighborhood-lab/care-commons/issues
- Email: support@neighborhoodlab.org

## Migration from Vercel

To migrate an existing Vercel deployment to Cloudflare:

1. **Deploy to Cloudflare** (following this guide)
2. **Test thoroughly** on Cloudflare staging
3. **Update DNS** to point to Cloudflare Pages
4. **Monitor** for 24-48 hours
5. **Decommission** Vercel deployment once stable

Both platforms can run simultaneously during migration.
