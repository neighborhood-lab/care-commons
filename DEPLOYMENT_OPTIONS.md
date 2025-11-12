# Deployment Options for Care Commons

## Overview

This document outlines **always-free deployment options** for Care Commons, prioritizing cost-effective solutions for development, staging, and small-scale production deployments.

---

## Option 1: 100% Vercel (Recommended for Node.js/Next.js)

### ✅ Vercel Platform + Vercel Postgres

**Compute**: Vercel Serverless Functions  
**Database**: Vercel Postgres (powered by Neon)  
**Storage**: Vercel Blob Storage  

### Free Tier Limits

**Vercel Hobby (Free)**:
- ✅ **Unlimited deployments**
- ✅ **100 GB bandwidth/month**
- ✅ **100 GB-hours serverless function execution**
- ✅ **6,000 build minutes/month**
- ✅ **Unlimited preview deployments**
- ✅ **Automatic HTTPS**
- ✅ **Custom domains** (free SSL)
- ✅ **Edge Network** (global CDN)
- ❌ No team collaboration (single developer)
- ❌ Pauses after 7 days inactivity (projects, not functions)

**Vercel Postgres (Free)**:
- ✅ **512 MB database storage**
- ✅ **60 hours compute time/month** (~2 days)
- ✅ **5 GB data transfer/month**
- ✅ **Connection pooling built-in**
- ✅ **Automatic backups** (1 day retention)
- ✅ **PostgreSQL 15+**
- ❌ Compute pauses after 5 minutes inactivity
- ❌ Max 1 database

**Vercel Blob Storage (Free)**:
- ✅ **100 MB storage**
- ✅ **10 GB bandwidth/month**
- ✅ **CDN-backed** (global edge)

### Setup Commands

```bash
# 1. Login to Vercel
vercel login

# 2. Link project to Vercel
cd /Users/bedwards/care-commons
vercel link

# 3. Create Vercel Postgres database
vercel postgres create care-commons-db

# 4. Pull environment variables
vercel env pull .env.local

# 5. Deploy
vercel deploy --prod
```

### Environment Variables

Vercel automatically sets these for Vercel Postgres:
```bash
POSTGRES_URL="postgres://..."          # Connection string
POSTGRES_PRISMA_URL="postgres://..."   # Prisma-optimized
POSTGRES_URL_NON_POOLING="postgres://..." # Direct connection
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."
```

### Configuration

**vercel.json** (already configured):
```json
{
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "public",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "NODE_ENV": "production",
    "NODE_VERSION": "22.x"
  }
}
```

### Pros & Cons

**Pros**:
- ✅ **Easiest setup** - One platform, one login
- ✅ **Integrated** - Database, functions, storage all in one place
- ✅ **Fast cold starts** - Vercel-optimized infrastructure
- ✅ **Preview deployments** - Every PR gets a unique URL
- ✅ **Edge functions** - Run at the edge for low latency
- ✅ **Great DX** - Best developer experience

**Cons**:
- ❌ **Compute limits** - Database pauses after 5 min inactivity
- ❌ **Storage limits** - Only 512 MB database (enough for dev/small prod)
- ❌ **No team collaboration** on free tier
- ❌ **Vendor lock-in** - Harder to migrate off Vercel

### Best For
- **Development** and **staging** environments
- **Small production** deployments (<10,000 users)
- **Demos** and **MVPs**
- **Single developer** projects

---

## Option 2: 100% Cloudflare (Best for Global Scale)

### ✅ Cloudflare Workers + D1 Database

**Compute**: Cloudflare Workers (Edge Runtime)  
**Database**: Cloudflare D1 (SQLite at the edge) **OR** Neon/Supabase via Hyperdrive  
**Storage**: Cloudflare R2  

### Free Tier Limits

**Cloudflare Workers (Free)**:
- ✅ **100,000 requests/day** (~3M/month)
- ✅ **Unlimited deployments**
- ✅ **Runs in 300+ cities** (true edge)
- ✅ **10ms CPU time/invocation**
- ✅ **Custom domains** (free SSL)
- ✅ **Automatic HTTPS**
- ✅ **No cold starts** (instant)
- ✅ **Team collaboration**
- ❌ No Node.js built-ins (V8 isolates, not containers)
- ❌ Limited npm packages (must be ESM-compatible)

**Cloudflare D1 (Free)**:
- ✅ **500 MB storage/database**
- ✅ **5M reads/day**
- ✅ **100K writes/day**
- ✅ **Unlimited databases**
- ✅ **SQLite at the edge** (read replicas everywhere)
- ✅ **No cold starts**
- ✅ **Point-in-time recovery** (PITR)
- ❌ **SQLite not Postgres** (limited ecosystem)
- ❌ **No extensions** (PostGIS, pg_vector unavailable)

**Cloudflare R2 (Free)**:
- ✅ **10 GB storage**
- ✅ **1M Class A operations/month** (writes)
- ✅ **10M Class B operations/month** (reads)
- ✅ **No egress fees** (major advantage over S3)
- ✅ **S3-compatible API**

### Setup Commands

```bash
# 1. Login to Cloudflare
wrangler login

# 2. Create wrangler.toml configuration
cat > wrangler.toml << 'EOF'
name = "care-commons"
main = "api/index.ts"
compatibility_date = "2024-11-12"
node_compat = true

[[d1_databases]]
binding = "DB"
database_name = "care-commons-db"
database_id = "<will-be-generated>"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "care-commons-files"
EOF

# 3. Create D1 database
wrangler d1 create care-commons-db

# 4. Create R2 bucket
wrangler r2 bucket create care-commons-files

# 5. Deploy
wrangler deploy
```

### Pros & Cons

**Pros**:
- ✅ **Truly global** - Runs in 300+ cities, not just 1 region
- ✅ **No cold starts** - Instant response times
- ✅ **Generous limits** - 3M requests/month free
- ✅ **No egress fees** - R2 has no bandwidth charges
- ✅ **Team collaboration** on free tier
- ✅ **Scales automatically** - No configuration needed

**Cons**:
- ❌ **SQLite not Postgres** - Different SQL dialect, no extensions
- ❌ **No Node.js runtime** - V8 isolates only (limited npm packages)
- ❌ **Migration effort** - Requires code changes from Express to Workers
- ❌ **Learning curve** - Different mental model than traditional servers

### Best For
- **High-scale applications** needing global distribution
- **Public APIs** with heavy read traffic
- **Static sites** with serverless functions
- **Projects without Postgres-specific needs**

---

## Option 3: Vercel + Neon Postgres (Best Postgres Free Tier)

### ✅ Vercel Functions + Neon Database

**Compute**: Vercel Serverless Functions  
**Database**: Neon Postgres (serverless Postgres)  
**Storage**: Vercel Blob or R2  

### Free Tier Limits

**Vercel Hobby** (same as Option 1)

**Neon Free Tier**:
- ✅ **512 MB storage/branch**
- ✅ **3 GB data transfer/month**
- ✅ **1 project with unlimited branches**
- ✅ **Unlimited databases per project**
- ✅ **PostgreSQL 15+**
- ✅ **Connection pooling** built-in
- ✅ **Instant branching** (copy-on-write, perfect for previews)
- ✅ **Point-in-time recovery** (7 days)
- ✅ **Autoscaling compute** (0.25 - 2 vCPU)
- ❌ **Autosuspends after 5 min** inactivity (cold start ~1s)
- ❌ **Max 100 hours compute/month** (~3 days)

### Setup Commands

```bash
# 1. Install Neon CLI (already installed)
# neon is at /opt/homebrew/bin/neon

# 2. Login to Neon
neon auth

# 3. Create project
neon projects create --name care-commons

# 4. Get connection string
neon connection-string care-commons

# 5. Add to Vercel
vercel env add POSTGRES_URL
# Paste Neon connection string

# 6. Deploy to Vercel
vercel deploy --prod
```

### Database Branching (Powerful Feature)

```bash
# Create branch for preview deployment (instant, copy-on-write)
neon branches create --project care-commons --name preview-pr-123

# Get connection string for branch
neon connection-string care-commons --branch preview-pr-123

# Each Vercel preview deployment can have its own database branch!
```

### Pros & Cons

**Pros**:
- ✅ **Best free Postgres** - 512 MB storage, full Postgres features
- ✅ **Database branching** - Perfect for preview deployments
- ✅ **True Postgres** - PostGIS, pg_vector, all extensions work
- ✅ **Longer compute time** - 100 hours vs Vercel Postgres 60 hours
- ✅ **More storage** - 512 MB per branch (unlimited branches)
- ✅ **Better cold starts** - ~1s vs ~2-3s for Vercel Postgres
- ✅ **No vendor lock-in** - Standard Postgres protocol

**Cons**:
- ❌ **Two platforms** - Manage Vercel + Neon separately
- ❌ **Still autosuspends** - 5 min inactivity (but cold start faster)
- ❌ **Manual env vars** - Need to copy connection strings

### Best For
- **Production-ready free tier** - Best Postgres limits
- **Branch-based workflows** - Database per PR
- **Postgres-specific features** - PostGIS, pg_vector, extensions
- **Future scaling** - Easy upgrade path to paid

---

## Option 4: Cloudflare Workers + Neon/Supabase via Hyperdrive

### ✅ Cloudflare Workers + Postgres via Hyperdrive

**Compute**: Cloudflare Workers  
**Database**: Neon or Supabase Postgres via Hyperdrive  
**Storage**: Cloudflare R2  

### Free Tier Limits

**Cloudflare Workers** (same as Option 2)

**Cloudflare Hyperdrive (Free)**:
- ✅ **Free tier** (currently in beta, may change)
- ✅ **Connection pooling** for Workers → Postgres
- ✅ **Caching** at the edge
- ✅ **Reduces latency** to Postgres by ~80%
- ✅ **Works with any Postgres** (Neon, Supabase, RDS, etc.)

**Neon or Supabase** (same limits as Option 3)

### Setup Commands

```bash
# 1. Create Neon database
neon projects create --name care-commons

# 2. Get connection string
NEON_URL=$(neon connection-string care-commons)

# 3. Create Hyperdrive configuration
wrangler hyperdrive create care-commons-db --connection-string="$NEON_URL"

# 4. Update wrangler.toml
cat >> wrangler.toml << 'EOF'

[[hyperdrive]]
binding = "HYPERDRIVE"
id = "<hyperdrive-id-from-step-3>"
EOF

# 5. Deploy
wrangler deploy
```

### Pros & Cons

**Pros**:
- ✅ **Best of both worlds** - Cloudflare edge + real Postgres
- ✅ **Global edge** - 300+ cities with Workers
- ✅ **Full Postgres** - All extensions (PostGIS, pg_vector)
- ✅ **Connection pooling** - Hyperdrive handles connections efficiently
- ✅ **Reduced latency** - Edge caching + smart routing
- ✅ **No vendor lock-in** - Standard Postgres

**Cons**:
- ❌ **Most complex** - Three platforms (Cloudflare, Neon, Hyperdrive)
- ❌ **Workers limitations** - No Node.js built-ins
- ❌ **Migration effort** - Rewrite from Express to Workers
- ❌ **Beta features** - Hyperdrive still evolving

### Best For
- **Global applications** needing Postgres
- **High-traffic APIs** with complex queries
- **Real-time features** with edge compute
- **Advanced use cases** (PostGIS geofencing, pg_vector search)

---

## Option 5: Vercel + Supabase Postgres (Best Auth + Storage)

### ✅ Vercel Functions + Supabase Backend

**Compute**: Vercel Serverless Functions  
**Database**: Supabase Postgres  
**Storage**: Supabase Storage (with CDN)  
**Auth**: Supabase Auth (built-in)  
**Realtime**: Supabase Realtime subscriptions  

### Free Tier Limits

**Vercel Hobby** (same as Option 1)

**Supabase Free Tier**:
- ✅ **500 MB database storage**
- ✅ **Unlimited API requests**
- ✅ **50,000 monthly active users**
- ✅ **1 GB file storage**
- ✅ **2 GB bandwidth**
- ✅ **Realtime subscriptions** (unlimited)
- ✅ **Auto-generated REST APIs** from schema
- ✅ **Auto-generated GraphQL APIs** (optional)
- ✅ **Row Level Security** (RLS)
- ✅ **Auth** (Email, OAuth, Magic Links, Phone)
- ✅ **Storage CDN** (global distribution)
- ✅ **PostgreSQL 15+** with extensions
- ❌ **Pauses after 7 days** of inactivity (easily resumed)

### Setup Commands

```bash
# 1. Login to Supabase
supabase login

# 2. Create project (via dashboard.supabase.com)
# Get your project URL and anon key

# 3. Initialize locally
cd /Users/bedwards/care-commons
supabase init

# 4. Link to remote project
supabase link --project-ref <your-project-ref>

# 5. Add to Vercel environment
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# 6. Deploy
vercel deploy --prod
```

### Using Supabase Features

```typescript
// Auto-generated REST API
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .eq('organization_id', orgId);

// Realtime subscriptions
supabase
  .channel('visits')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'visits' },
    (payload) => console.log('New visit:', payload)
  )
  .subscribe();

// Storage with CDN
const { data, error } = await supabase.storage
  .from('clinical-photos')
  .upload('wound-assessment.jpg', file);

// Auth
const { user, session, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### Pros & Cons

**Pros**:
- ✅ **Complete backend** - Database, Auth, Storage, Realtime all-in-one
- ✅ **Auto-generated APIs** - REST and GraphQL from schema
- ✅ **Real-time subscriptions** - Built-in WebSocket support
- ✅ **Row Level Security** - Perfect for multi-tenant (Care Commons!)
- ✅ **Auth built-in** - OAuth, Magic Links, Phone, Email
- ✅ **Storage with CDN** - Perfect for clinical photos/documents
- ✅ **Great free tier** - 500 MB database, 1 GB storage, unlimited requests
- ✅ **PostGIS support** - For EVV geofencing
- ✅ **pg_vector support** - For AI/ML features

**Cons**:
- ❌ **Pauses after 7 days** inactivity (but easy resume)
- ❌ **Two platforms** - Vercel + Supabase
- ❌ **Learning curve** - Supabase-specific patterns (RLS, etc.)

### Best For
- **Multi-tenant SaaS** (Row Level Security perfect for Care Commons)
- **Real-time features** (visit updates, schedule changes)
- **File storage needs** (clinical photos, documents)
- **Authentication** (built-in, no custom code)
- **Rapid development** (auto-generated APIs)

---

## Recommended Setup for Care Commons

### 🏆 **Phase 1: Development (Current)**

**Option 3: Vercel + Neon**
- Free tier sufficient for development
- Database branching for PR previews
- Full Postgres with PostGIS (EVV geofencing)
- pg_vector for ML-based shift matching
- Easy migration to production

```bash
# Setup commands
neon auth
neon projects create --name care-commons-dev
neon connection-string care-commons-dev | vercel env add POSTGRES_URL
vercel link
vercel deploy
```

### 🚀 **Phase 2: Staging + Small Production**

**Option 5: Vercel + Supabase**
- Real-time updates (visit status, scheduling)
- Row Level Security (multi-tenant isolation)
- Built-in Auth (caregivers, admins, family)
- Storage for clinical photos
- Auto-generated APIs reduce backend code

```bash
# Setup commands
supabase login
# Create project on supabase.com
supabase link --project-ref <ref>
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel deploy
```

### 🌍 **Phase 3: Global Scale Production**

**Option 4: Cloudflare Workers + Neon via Hyperdrive**
- 300+ edge locations (low latency globally)
- 3M requests/month free (upgradeable to 10M+)
- Full Postgres with extensions
- R2 storage (no egress fees)
- True horizontal scaling

```bash
# Migration required - rewrite Express → Workers
wrangler init
# Create Hyperdrive connection to Neon
wrangler hyperdrive create --connection-string="<neon-url>"
wrangler deploy
```

---

## Cost Comparison (Monthly)

### Free Tier Comparison

| Feature | Vercel + Vercel Postgres | Vercel + Neon | Vercel + Supabase | Cloudflare + D1 | Cloudflare + Neon |
|---------|-------------------------|---------------|-------------------|-----------------|-------------------|
| **Compute** | 100 GB-hrs | 100 GB-hrs | 100 GB-hrs | 3M requests | 3M requests |
| **Database** | 512 MB | 512 MB/branch | 500 MB | 500 MB | 512 MB/branch |
| **Bandwidth** | 100 GB | 100 GB | 100 GB + 2 GB (DB) | Unlimited | Unlimited |
| **Storage** | 100 MB | 100 MB | 1 GB | 10 GB (R2) | 10 GB (R2) |
| **Features** | Basic | Branching | Auth+Realtime+APIs | Edge+SQLite | Edge+Postgres |
| **Cold Start** | ~2-3s | ~1s | ~1s | None (instant) | ~1s |
| **Global** | Single region | Single region | Single region | 300+ cities | 300+ cities |
| **Team** | No | No | No | Yes | Yes |

### Paid Tier Costs (When Scaling)

**Vercel Pro**: $20/month (team features, more bandwidth)  
**Neon Pro**: $19/month (always-on, more compute)  
**Supabase Pro**: $25/month (no pause, more storage)  
**Cloudflare Workers Paid**: $5/month (10M requests)  

---

## Decision Matrix

### Choose **Vercel + Neon** if:
- ✅ You want the best free Postgres tier
- ✅ You need database branching for PRs
- ✅ You need PostGIS or pg_vector
- ✅ You want fastest path to production
- ✅ Current Express/Node.js app (no rewrite)

### Choose **Vercel + Supabase** if:
- ✅ You need real-time subscriptions
- ✅ You want auto-generated APIs
- ✅ You need built-in auth
- ✅ You need file storage with CDN
- ✅ Multi-tenant with Row Level Security
- ✅ You want fastest development speed

### Choose **Cloudflare Workers + D1** if:
- ✅ You need global edge distribution
- ✅ You don't need Postgres-specific features
- ✅ You want zero cold starts
- ✅ You have high read traffic
- ✅ You're willing to rewrite for Workers

### Choose **Cloudflare Workers + Neon** if:
- ✅ You need global edge + full Postgres
- ✅ You have high traffic (3M+ requests/month)
- ✅ You need advanced Postgres features
- ✅ You want lowest latency globally
- ✅ You're willing to invest in migration

---

## Current Care Commons Setup

### ✅ Already Configured

**Platform**: Vercel (deployed to production)  
**Database**: Neon Postgres  
**Branch**: `main` → production, `preview` → staging  

**Environment Variables** (already set):
```bash
POSTGRES_URL=<neon-connection-string>
DATABASE_URL=<neon-connection-string>
NODE_ENV=production
```

**Deployment**:
- `main` branch → **care-commons.vercel.app** (production)
- `preview` branch → **preview-*.vercel.app** (staging)
- PRs → automatic preview URLs

### Next Steps

1. **Verify Neon project**:
   ```bash
   neon projects list
   ```

2. **Create database branches** for preview environments:
   ```bash
   neon branches create --project care-commons --name preview
   ```

3. **Consider migrating to Supabase** for Phase 2:
   - Real-time visit updates
   - Built-in auth for caregivers/admins
   - Storage for clinical photos
   - Auto-generated REST APIs

---

## CLI Quick Reference

### Vercel CLI
```bash
vercel login              # Login
vercel link               # Link project
vercel env ls             # List environment variables
vercel env add KEY        # Add environment variable
vercel deploy             # Deploy to preview
vercel deploy --prod      # Deploy to production
vercel logs               # View logs
vercel postgres create    # Create Vercel Postgres DB
```

### Neon CLI
```bash
neon auth                         # Login
neon projects list                # List projects
neon projects create              # Create project
neon branches list                # List branches
neon branches create              # Create branch
neon connection-string <project>  # Get connection string
neon sql <project> -f schema.sql  # Run SQL file
```

### Supabase CLI
```bash
supabase login              # Login
supabase init               # Initialize local project
supabase start              # Start local Supabase
supabase link               # Link to remote project
supabase db push            # Push migrations
supabase db pull            # Pull schema
supabase functions deploy   # Deploy Edge Functions
supabase projects list      # List projects
```

### Wrangler CLI (Cloudflare)
```bash
wrangler login               # Login
wrangler init                # Initialize project
wrangler dev                 # Local development
wrangler deploy              # Deploy to production
wrangler d1 create <name>    # Create D1 database
wrangler r2 bucket create    # Create R2 bucket
wrangler hyperdrive create   # Create Hyperdrive
wrangler tail                # Live logs
```

---

## Summary

For **Care Commons** specifically:

1. **Now (Development)**: Stay on **Vercel + Neon** ✅
   - Already configured and working
   - Best free Postgres tier
   - Database branching available

2. **Next (Staging/Small Production)**: Migrate to **Vercel + Supabase**
   - Real-time updates for scheduling/visits
   - Row Level Security for multi-tenant
   - Built-in auth
   - Storage for clinical documentation photos
   - Auto-generated APIs reduce backend code

3. **Future (Scale)**: Consider **Cloudflare Workers + Neon via Hyperdrive**
   - When traffic exceeds 3M requests/month
   - Global edge distribution
   - Lower latency worldwide
   - Requires code migration from Express to Workers

**Recommendation**: Start exploring Supabase integration for Phase 2 to get real-time features and built-in auth, while staying on Vercel for compute.
