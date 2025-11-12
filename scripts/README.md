# Care Commons Deployment Scripts

This directory contains automated setup scripts for deploying Care Commons to production.

## Available Scripts

### 🔷 Vercel + Neon Setup
**File**: `setup-vercel-neon.sh`

Automated setup for Vercel + Neon deployment (primary option).

```bash
./scripts/setup-vercel-neon.sh
```

**What it does**:
1. ✅ Checks Node.js 22.x and npm installation
2. ✅ Installs Vercel and Neon CLIs
3. ✅ Creates/links Neon database project
4. ✅ Generates connection strings (pooled + direct)
5. ✅ Links Vercel project
6. ✅ Generates secure secrets (JWT, encryption keys)
7. ✅ Configures Vercel environment variables
8. ✅ Runs database migrations
9. ✅ Seeds demo data (optional)
10. ✅ Deploys to Vercel

**Time**: ~10 minutes

---

### 🟠 Cloudflare + Supabase Setup
**File**: `setup-cloudflare-supabase.sh`

Automated setup for Cloudflare + Supabase deployment (alternative option).

```bash
./scripts/setup-cloudflare-supabase.sh
```

**What it does**:
1. ✅ Checks Node.js 22.x and npm installation
2. ✅ Installs Wrangler and Supabase CLIs
3. ✅ Configures Supabase connection strings
4. ✅ Creates Hyperdrive configuration (CRITICAL for Postgres)
5. ✅ Updates `wrangler.toml` with Hyperdrive ID
6. ✅ Generates secure secrets
7. ✅ Sets Cloudflare Worker secrets
8. ✅ Runs database migrations
9. ✅ Seeds demo data (optional)
10. ✅ Deploys Workers and Pages

**Time**: ~15 minutes

---

## Prerequisites

Both scripts require:
- ✅ Node.js 22.x (`nvm install 22 && nvm use 22`)
- ✅ npm 10.9.4+ (`npm install -g npm@10.9.4`)
- ✅ Git repository initialized
- ✅ Account on deployment platform (Vercel or Cloudflare)
- ✅ Account on database platform (Neon or Supabase)

---

## Usage

### First Time Setup

1. **Choose your deployment option**:
   - Vercel + Neon: Simpler, already configured
   - Cloudflare + Supabase: Lower cost, global edge

2. **Run the appropriate script**:
   ```bash
   # For Vercel + Neon
   ./scripts/setup-vercel-neon.sh
   
   # OR for Cloudflare + Supabase
   ./scripts/setup-cloudflare-supabase.sh
   ```

3. **Follow the prompts**:
   - Scripts are interactive
   - You'll be asked to confirm each step
   - You can skip optional steps (like demo data)

4. **Test your deployment**:
   ```bash
   # Vercel
   curl https://your-app.vercel.app/health
   
   # Cloudflare
   curl https://care-commons-api.your-subdomain.workers.dev/health
   ```

---

## What Gets Created

### Vercel + Neon Script

**Files created**:
- `.vercel/project.json` - Vercel project configuration
- Connection strings stored in Vercel (not locally)

**Services configured**:
- ✅ Neon database project
- ✅ Neon database with pooled/direct connections
- ✅ Vercel project linked
- ✅ Environment variables set (production + preview)
- ✅ Database migrated and seeded

**Next steps**:
- Add GitHub secrets for CI/CD
- Push to `main` or `preview` branch

---

### Cloudflare + Supabase Script

**Files modified**:
- `wrangler.toml` - Updated with Hyperdrive binding ID
- `wrangler.toml.bak` - Backup of original

**Services configured**:
- ✅ Supabase database (existing project)
- ✅ Hyperdrive connection pool
- ✅ Cloudflare Worker secrets
- ✅ Cloudflare Pages project
- ✅ Database migrated and seeded

**Next steps**:
- Add GitHub secrets for CI/CD
- Push to `main` branch

---

## Secrets Generated

Both scripts generate:

```bash
JWT_SECRET              # 32 bytes, base64 encoded
JWT_REFRESH_SECRET      # 32 bytes, base64 encoded
SESSION_SECRET          # 32 bytes, base64 encoded
ENCRYPTION_KEY          # 32 bytes, hex encoded (64 chars)
```

**IMPORTANT**: These are set automatically but not saved locally. If you need to set them manually later, use:

```bash
# Generate new secrets
openssl rand -base64 32  # For JWT and session secrets
openssl rand -hex 32     # For encryption key
```

---

## Troubleshooting

### Script fails with "Permission denied"

**Solution**: Make script executable
```bash
chmod +x scripts/setup-vercel-neon.sh
chmod +x scripts/setup-cloudflare-supabase.sh
```

---

### "Command not found: vercel" or "Command not found: wrangler"

**Solution**: Install CLIs globally
```bash
npm install -g vercel@latest
npm install -g wrangler@latest
```

---

### "Node version mismatch"

**Solution**: Use Node.js 22.x
```bash
nvm install 22
nvm use 22
```

---

### Hyperdrive creation fails

**Solution**: Escape special characters in password
```bash
# If password is: -Q$gsyPD788qv!S
# Use in command: -Q\$gsyPD788qv\!S

wrangler hyperdrive create care-commons-db \
  --connection-string="postgres://postgres.aoxifllwcujpinwfaxmu:-Q\$gsyPD788qv\!S@..."
```

---

### "Migration failed" errors

**Solution**: Check database connection
```bash
# Test connection (Neon)
psql "postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/care_commons?sslmode=require" -c "SELECT 1"

# Test connection (Supabase)
psql "postgres://postgres:pass@db.aoxifllwcujpinwfaxmu.supabase.co:5432/postgres" -c "SELECT 1"
```

---

## Manual Alternative

If you prefer manual setup, see:
- **Full guide**: `docs/DEPLOYMENT_SETUP_COMPLETE.md`
- **GitHub secrets**: `docs/GITHUB_SECRETS.md`

Manual setup gives you more control but takes longer.

---

## Re-running Scripts

**Can I run the script again?**

Yes, but:
- ⚠️ It may fail if resources already exist
- ⚠️ It will regenerate secrets (breaking existing deployments)
- ✅ Safe to run for testing/validation

**Better approach**:
- Use `vercel env add` or `wrangler secret put` to update individual values
- Use deployment platform dashboards for ongoing management

---

## Security Notes

### ✅ What scripts do:
- Generate cryptographically secure random secrets
- Set secrets in deployment platforms (not local files)
- Use SSL/TLS for database connections
- Follow least-privilege principles

### ⚠️ What scripts DON'T do:
- Commit secrets to git
- Save secrets in plain text files
- Reuse secrets across environments
- Expose secrets in logs

### 🔒 Best practices:
1. Run scripts in a secure environment
2. Rotate secrets every 90 days
3. Use different secrets for prod/preview
4. Don't share terminal history after running scripts
5. Review `wrangler.toml` before committing (secrets should be in comments)

---

## Getting Help

**Script-specific issues**:
- Check script output for error messages
- Verify prerequisites are met
- Review troubleshooting section above

**Deployment issues**:
- See `docs/DEPLOYMENT_SETUP_COMPLETE.md#troubleshooting`
- Check platform status pages:
  - Vercel: https://www.vercel-status.com/
  - Cloudflare: https://www.cloudflarestatus.com/
  - Neon: https://neonstatus.com/
  - Supabase: https://status.supabase.com/

**General questions**:
- GitHub Issues: https://github.com/neighborhood-lab/care-commons/issues
- Documentation: `/docs` directory

---

**Care Commons** - Shared care software, community owned  
Automated deployment made simple!
