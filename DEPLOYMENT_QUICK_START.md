# Deployment Quick Start Guide

**Two parallel deployment options for Care Commons**:

## 🚀 Option 1: Vercel + Neon (Recommended - Already Set Up)

**Status**: ✅ Currently deployed and working

**What you have**:
- Vercel project configured (`vercel.json`)
- GitHub Actions deployment workflow (`.github/workflows/deploy.yml`)
- Production: https://care-commons.vercel.app
- Preview deployments on `preview` branch

**To deploy manually**:
```bash
npm run build
vercel deploy --prod
```

**To deploy via GitHub**:
```bash
git push origin main        # Production
git push origin preview     # Preview environment
```

---

## 🌐 Option 2: Cloudflare + Supabase (Alternative)

**Status**: ⚙️ Ready to configure

**Quick setup** (5 minutes):
```bash
./scripts/setup-cloudflare-supabase.sh
```

**Manual setup**:

### Step 1: Create Hyperdrive (REQUIRED)
```bash
wrangler hyperdrive create care-commons-db \
  --connection-string="postgres://postgres.aoxifllwcujpinwfaxmu:-Q\$gsyPD788qv\!S@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### Step 2: Update wrangler.toml
Replace `REPLACE_WITH_YOUR_HYPERDRIVE_ID` with the ID from Step 1.

### Step 3: Set Secrets
```bash
# Generate secrets
export JWT_SECRET=$(openssl rand -base64 32)
export JWT_REFRESH_SECRET=$(openssl rand -base64 32)
export SESSION_SECRET=$(openssl rand -base64 32)
export ENCRYPTION_KEY=$(openssl rand -hex 32)

# Set them
echo "$JWT_SECRET" | wrangler secret put JWT_SECRET
echo "$JWT_REFRESH_SECRET" | wrangler secret put JWT_REFRESH_SECRET
echo "$SESSION_SECRET" | wrangler secret put SESSION_SECRET
echo "$ENCRYPTION_KEY" | wrangler secret put ENCRYPTION_KEY
```

### Step 4: Deploy
```bash
npm run build
wrangler deploy --env production
wrangler pages deploy public --project-name=care-commons-web
```

---

## 📊 Comparison

| Feature | Vercel + Neon | Cloudflare + Supabase |
|---------|---------------|----------------------|
| **Setup time** | ✅ Already done | ⏱️ ~15 minutes |
| **Cost (free tier)** | Good | Better |
| **Global edge** | US regions | Worldwide |
| **Database pooling** | Built-in | Hyperdrive required |
| **Cold start** | ~50ms | ~20ms |
| **Best for** | Quick deployment | Global scale |

---

## 📁 What Was Created

### Documentation
- `docs/DEPLOYMENT_SETUP_COMPLETE.md` - **Complete guide** (read this for details)
- `docs/GITHUB_SECRETS.md` - All required secrets with instructions
- `DEPLOYMENT_QUICK_START.md` - This file

### Configuration Files
- `.env.example` - Updated with Supabase examples
- `wrangler.toml` - Updated with Hyperdrive setup instructions
- `api/worker.ts` - Cloudflare Workers adapter

### GitHub Actions
- `.github/workflows/deploy-cloudflare.yml` - Updated with proper secrets

### Setup Scripts
- `scripts/setup-vercel-neon.sh` - Automated Vercel setup
- `scripts/setup-cloudflare-supabase.sh` - Automated Cloudflare setup

---

## 🎯 Next Steps

### If using Vercel + Neon (current):
1. ✅ You're already deployed!
2. Just push to `main` or `preview` branches
3. GitHub Actions handles everything

### If adding Cloudflare + Supabase:
1. Run: `./scripts/setup-cloudflare-supabase.sh`
2. Add GitHub secrets (see `docs/GITHUB_SECRETS.md`)
3. Push to trigger deployment

---

## 🆘 Quick Troubleshooting

**Vercel deployment fails**:
- Check `DATABASE_URL` uses `.pooler.` endpoint
- Verify all secrets are set: `vercel env ls`

**Cloudflare Workers timeout**:
- Ensure Hyperdrive is configured
- Check Supabase connection uses port 6543 + `?pgbouncer=true`

**Database connection errors**:
- Neon: Use pooled connection string
- Supabase: Use transaction pooler (port 6543)

---

## 📚 Full Documentation

For complete details, see:
- **Full setup guide**: `docs/DEPLOYMENT_SETUP_COMPLETE.md`
- **GitHub secrets**: `docs/GITHUB_SECRETS.md`
- **Connection pooling**: `docs/DEPLOYMENT_SETUP_COMPLETE.md#connection-pooling-best-practices`
- **Troubleshooting**: `docs/DEPLOYMENT_SETUP_COMPLETE.md#troubleshooting`

---

**Care Commons** - Shared care software, community owned  
Choose the deployment that fits your needs!
