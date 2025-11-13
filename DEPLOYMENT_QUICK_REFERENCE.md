# Deployment Quick Reference

## 🎯 TL;DR - What to Use

### Right Now (Dev/Staging)
**Vercel + Neon** ✅ Already configured!
```bash
vercel deploy --prod
```

### Next Phase (Production Ready)
**Vercel + Supabase** 🚀 Best for Care Commons
- Real-time visit updates
- Built-in auth for caregivers/admins
- Storage for clinical photos
- Multi-tenant with Row Level Security

### Future Scale (Global)
**Cloudflare Workers + Neon**
- 300+ edge locations worldwide
- 3M free requests/month
- True horizontal scaling

---

## 📦 Installed CLIs

| CLI | Version | Location | Command |
|-----|---------|----------|---------|
| **Vercel** | 48.9.0 | `/Users/bedwards/.nvm/.../bin/vercel` | `vercel --help` |
| **Neon** | 2.17.1 | `/opt/homebrew/bin/neon` | `neon --help` |
| **Supabase** | 2.58.5 | `/opt/homebrew/bin/supabase` | `supabase --help` |
| **Wrangler** | 4.47.0 | `/Users/bedwards/.nvm/.../bin/wrangler` | `wrangler --help` |
| **GitHub** | 2.83.0 | `/opt/homebrew/bin/gh` | `gh --help` |

---

## ⚡ Quick Commands

### Deploy to Production
```bash
# Current setup (Vercel + Neon)
git push origin main  # Auto-deploys via GitHub Actions
# OR
vercel deploy --prod
```

### Check Deployment Status
```bash
vercel ls                    # List deployments
gh pr checks                 # Check CI status
vercel logs --follow         # Live logs
```

### Database Operations
```bash
neon projects list           # List Neon projects
neon connection-string       # Get connection string
neon branches list           # List database branches
supabase projects list       # List Supabase projects
```

### Environment Variables
```bash
vercel env ls                # List env vars
vercel env add KEY           # Add env var
vercel env pull .env.local   # Pull to local
```

---

## 🎬 Setup New Deployment

### Option 1: Vercel + Neon (Current)
```bash
# Already configured! Just deploy
vercel deploy --prod
```

### Option 2: Vercel + Supabase (Recommended Next)
```bash
# 1. Create Supabase project at dashboard.supabase.com
# 2. Link locally
supabase login
supabase link --project-ref <your-ref>

# 3. Add to Vercel
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# 4. Deploy
vercel deploy --prod
```

### Option 3: Cloudflare Workers + Neon
```bash
# 1. Create Neon project
neon auth
neon projects create --name care-commons-cf

# 2. Setup Hyperdrive
NEON_URL=$(neon connection-string care-commons-cf)
wrangler hyperdrive create care-commons-db --connection-string="$NEON_URL"

# 3. Configure wrangler.toml
cat > wrangler.toml << 'TOML'
name = "care-commons"
main = "api/index.ts"
compatibility_date = "2024-11-12"
node_compat = true

[[hyperdrive]]
binding = "HYPERDRIVE"
id = "<from-step-2>"
TOML

# 4. Deploy
wrangler deploy
```

---

## 💰 Free Tier Limits

| Platform | Database | Compute | Bandwidth | Storage |
|----------|----------|---------|-----------|---------|
| **Vercel + Vercel Postgres** | 512 MB | 100 GB-hrs | 100 GB | 100 MB |
| **Vercel + Neon** | 512 MB/branch | 100 GB-hrs | 100 GB + 3 GB | 100 MB |
| **Vercel + Supabase** | 500 MB | 100 GB-hrs | 100 GB + 2 GB | 1 GB |
| **Cloudflare + D1** | 500 MB | 3M requests | Unlimited | 10 GB |
| **Cloudflare + Neon** | 512 MB/branch | 3M requests | Unlimited | 10 GB |

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] All secrets in environment variables (not code)
- [ ] Database connection uses SSL
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Authentication enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize inputs)
- [ ] CSRF tokens for state-changing operations
- [ ] Security headers configured (Helmet.js)
- [ ] Logging and monitoring enabled
- [ ] Backup strategy in place

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Check build logs
vercel logs --follow

# Build locally first
npm run build

# Check TypeScript
npm run typecheck
```

### Database Connection Issues
```bash
# Test connection string
neon sql care-commons -c "SELECT version();"

# Check connection pooling
# Use POSTGRES_URL for pooled, POSTGRES_URL_NON_POOLING for direct
```

### Environment Variables Missing
```bash
# Pull from Vercel
vercel env pull .env.local

# Or set manually
vercel env add DATABASE_URL
```

### Cold Start Performance
```bash
# Neon: Upgrade to Scale tier ($19/mo) for always-on
# Vercel Postgres: Use connection pooling
# Supabase: Upgrade to Pro ($25/mo) for no pause
```

---

## 📚 Full Documentation

See [DEPLOYMENT_OPTIONS.md](./DEPLOYMENT_OPTIONS.md) for complete details.

---

## 🎯 Recommended Path for Care Commons

**Phase 1 (Now)**: Vercel + Neon ✅  
→ Currently deployed and working

**Phase 2 (Next)**: Migrate to Vercel + Supabase  
→ Get real-time, auth, storage, RLS

**Phase 3 (Scale)**: Consider Cloudflare Workers + Neon  
→ Global edge distribution when traffic grows

---

## 🚨 Emergency Rollback

```bash
# Rollback to previous deployment
vercel rollback

# Or via web UI: vercel.com/dashboard → Deployments → Rollback

# Rollback database migration (if needed)
neon branches create --name rollback-$(date +%s)
# Restore from backup
```

---

## ✅ Current Setup Status

**Platform**: Vercel  
**Database**: Neon Postgres  
**Production**: care-commons.vercel.app  
**Staging**: preview-*.vercel.app  
**CI/CD**: GitHub Actions  

**Environment Variables Set**:
- ✅ `POSTGRES_URL`
- ✅ `DATABASE_URL`  
- ✅ `NODE_ENV`

**Next Steps**:
1. Verify `neon projects list` shows care-commons
2. Create database branches for preview deployments
3. Consider Supabase migration for Phase 2
