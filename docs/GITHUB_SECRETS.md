# GitHub Secrets Configuration Guide

This document lists all GitHub Secrets required for Care Commons CI/CD pipelines.

## How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the name and value
5. Click **Add secret**

---

## Option 1: Vercel + Neon Deployment

### Required Secrets for Vercel

| Secret Name | Description | How to Get It |
|------------|-------------|---------------|
| `VERCEL_TOKEN` | Vercel API token for deployments | 1. Run `vercel token`<br>2. Or go to Vercel Dashboard → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Your Vercel organization ID | Found in `.vercel/project.json` after running `vercel link` |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | Found in `.vercel/project.json` after running `vercel link` |

### Required Secrets for Database

| Secret Name | Description | How to Get It |
|------------|-------------|---------------|
| `DATABASE_URL` | Neon pooled connection string (production) | 1. Run `neon connection-string <db-id> --pooled`<br>2. Or get from Neon Dashboard → Connection Details<br>**Format**: `postgres://user:pass@ep-xxx.pooler.neon.tech/dbname?sslmode=require` |
| `PREVIEW_DATABASE_URL` | Neon pooled connection string (preview) | Same as above, but for preview database |

### Required Secrets for Application

| Secret Name | Description | How to Generate |
|------------|-------------|----------------|
| `JWT_SECRET` | Secret key for JWT tokens | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | `openssl rand -base64 32` |
| `SESSION_SECRET` | Secret for session management | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | Key for encrypting sensitive data (SSN, etc.) | `openssl rand -hex 32` |

### Optional Secrets (Texas EVV)

| Secret Name | Description | How to Get It |
|------------|-------------|---------------|
| `HHAEXCHANGE_CLIENT_ID` | HHAeXchange OAuth client ID | From HHAeXchange portal |
| `HHAEXCHANGE_CLIENT_SECRET` | HHAeXchange OAuth client secret | From HHAeXchange portal |

---

## Option 2: Cloudflare + Supabase Deployment

### Required Secrets for Cloudflare

| Secret Name | Description | How to Get It |
|------------|-------------|---------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers/Pages permissions | 1. Go to Cloudflare Dashboard → My Profile → API Tokens<br>2. Click **Create Token**<br>3. Use "Edit Cloudflare Workers" template<br>4. Add permissions for Pages and Workers<br>5. Create and copy token |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Run `wrangler whoami` or find in Cloudflare Dashboard URL |

### Required Secrets for Supabase

| Secret Name | Description | How to Get It |
|------------|-------------|---------------|
| `SUPABASE_ACCESS_TOKEN` | Supabase API access token | 1. Go to https://supabase.com/dashboard/account/tokens<br>2. Click **Generate new token**<br>3. Copy the token |
| `SUPABASE_PROJECT_ID` | Your Supabase project reference | From project URL: `https://supabase.com/dashboard/project/[PROJECT_ID]`<br>**Example**: `aoxifllwcujpinwfaxmu` |
| `SUPABASE_DB_PASSWORD` | Database password | From initial project setup or reset in Dashboard → Settings → Database |
| `SUPABASE_DATABASE_URL` | Supabase pooler connection string | **Format**: `postgres://postgres.[ref]:[password]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true`<br>Get from: Dashboard → Settings → Database → Connection Pooling |
| `SUPABASE_ANON_KEY` | Supabase anonymous public key | Dashboard → Settings → API → Project API keys → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret!) | Dashboard → Settings → API → Project API keys → `service_role` (keep secret!) |

### Required Secrets for Application

Same as Vercel deployment:

| Secret Name | How to Generate |
|------------|----------------|
| `JWT_SECRET` | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 32` |
| `SESSION_SECRET` | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` |

---

## Complete Secrets Checklist

### For Vercel + Neon

```bash
# Deployment
- [ ] VERCEL_TOKEN
- [ ] VERCEL_ORG_ID
- [ ] VERCEL_PROJECT_ID

# Database
- [ ] DATABASE_URL
- [ ] PREVIEW_DATABASE_URL

# Application
- [ ] JWT_SECRET
- [ ] JWT_REFRESH_SECRET
- [ ] SESSION_SECRET
- [ ] ENCRYPTION_KEY

# Optional (Texas EVV)
- [ ] HHAEXCHANGE_CLIENT_ID
- [ ] HHAEXCHANGE_CLIENT_SECRET
```

### For Cloudflare + Supabase

```bash
# Deployment
- [ ] CLOUDFLARE_API_TOKEN
- [ ] CLOUDFLARE_ACCOUNT_ID

# Database
- [ ] SUPABASE_ACCESS_TOKEN
- [ ] SUPABASE_PROJECT_ID
- [ ] SUPABASE_DB_PASSWORD
- [ ] SUPABASE_DATABASE_URL
- [ ] SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY

# Application
- [ ] JWT_SECRET
- [ ] JWT_REFRESH_SECRET
- [ ] SESSION_SECRET
- [ ] ENCRYPTION_KEY

# Optional (Texas EVV)
- [ ] HHAEXCHANGE_CLIENT_ID
- [ ] HHAEXCHANGE_CLIENT_SECRET
```

---

## Quick Setup Commands

### Generate All Application Secrets at Once

```bash
# Generate and display all secrets
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo "SESSION_SECRET=$(openssl rand -base64 32)"
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
```

### Get Vercel IDs

```bash
# Link project first
vercel link

# Display org and project IDs
cat .vercel/project.json
```

### Get Cloudflare Account ID

```bash
wrangler whoami
```

### Get Neon Connection Strings

```bash
# Pooled (for serverless)
neon connection-string <PROJECT_ID> --pooled

# Direct (for migrations)
neon connection-string <PROJECT_ID>
```

### Build Supabase Connection String

```bash
# Replace [REF] and [PASSWORD] with your values
PROJECT_REF="aoxifllwcujpinwfaxmu"
PASSWORD="your_password"
REGION="us-east-1"

# Pooler connection (for applications)
echo "postgres://postgres.${PROJECT_REF}:${PASSWORD}@aws-0-${REGION}.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (for migrations)
echo "postgres://postgres:${PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"
```

---

## Security Best Practices

### ✅ DO:
- Rotate secrets regularly (every 90 days minimum)
- Use different secrets for each environment (production, preview, development)
- Generate cryptographically secure random values
- Keep `SERVICE_ROLE_KEY` secret - never expose in client code
- Use GitHub Environment protection rules for production secrets
- Document when secrets were last rotated

### ❌ DON'T:
- Reuse secrets across environments
- Commit secrets to git (even in `.env` files)
- Share secrets via email or chat
- Use weak or predictable values
- Store secrets in code comments
- Use production secrets in development

---

## Verifying Secrets

### Verify Vercel Secrets

```bash
# List environment variables
vercel env ls

# Pull environment to local
vercel env pull .env.local
```

### Verify Cloudflare Secrets

```bash
# List Worker secrets
wrangler secret list
```

### Verify GitHub Secrets

1. Go to repository Settings → Secrets and variables → Actions
2. Verify all required secrets are listed
3. Secrets values are hidden - you can only update or delete

---

## Troubleshooting

### "Secret not found" errors in GitHub Actions

**Problem**: Workflow fails with missing secret error

**Solution**:
1. Verify secret name matches exactly (case-sensitive)
2. Check secret is added to the correct repository
3. Ensure using `${{ secrets.SECRET_NAME }}` syntax
4. For organization secrets, verify repository has access

### "Invalid DATABASE_URL" errors

**Problem**: Database connection fails

**Solution**:
1. Verify using POOLED connection string for serverless
2. Check password doesn't have unescaped special characters
3. Ensure `?sslmode=require` (Neon) or `?pgbouncer=true` (Supabase) parameter
4. Test connection locally first with same string

### "Unauthorized" from Vercel/Cloudflare

**Problem**: Deployment fails with authentication error

**Solution**:
1. Verify token has correct permissions
2. Check token hasn't expired
3. Regenerate token if needed
4. Ensure ORG_ID and PROJECT_ID match your project

---

## Example GitHub Secrets Screenshot Locations

### Adding a Secret
```
Repository → Settings (top nav)
  ↓
Security section → Secrets and variables
  ↓
Actions
  ↓
Click "New repository secret"
  ↓
Enter name and value
  ↓
Click "Add secret"
```

### Environment-Specific Secrets (Optional)

For added security, use GitHub Environments:

```
Repository → Settings → Environments
  ↓
Create "production" and "preview" environments
  ↓
Add secrets specific to each environment
  ↓
Configure protection rules (require approvals, etc.)
```

---

## Additional Resources

- [GitHub Encrypted Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/platform/environment-variables/)
- [Supabase Database Credentials](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [OpenSSL Random Generation](https://www.openssl.org/docs/man1.1.1/man1/rand.html)

---

**Care Commons** - Shared care software, community owned  
Security is everyone's responsibility - protect your secrets!
