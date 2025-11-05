# Vercel Environment Variables Setup

## Problem
The application needs secrets (JWT_SECRET, ENCRYPTION_KEY, etc.) to function, but these are:
1. **Not in git** (correctly gitignored in `.env.preview` and `.env.production`)
2. **Not in Vercel** (need to be added via Vercel dashboard or CLI)

## Quick Fix: Set Environment Variables in Vercel

### Option 1: Via Vercel Dashboard (Easiest)

1. **Go to your Vercel project**: https://vercel.com/dashboard
2. **Select your project**: `care-commons`
3. **Go to Settings → Environment Variables**
4. **Add these variables** for **Preview** and **Production** environments:

#### Required Variables

Copy these values (already generated for you):

```bash
# JWT Authentication
JWT_SECRET=CUKaqpTVKrMzhVFRlV0vUIDValoClhjqjrfkNgbPf+E=
JWT_REFRESH_SECRET=eXaRVJ0Rxt0jr3Ru0QrqRHVxxdE0jg0rvY1ylOltOLU=
SESSION_SECRET=dLkXj8ftiY4fGMhQtqHu5wpmCNNkOgP7LXXS5anibB8=

# Encryption
ENCRYPTION_KEY=3e070612e4d91bad0129cc46c5bcb35b2670fb174918c1fc6a6cd398442c9b5f

# Database (already set via secrets)
DATABASE_URL=[your preview database URL]
PREVIEW_DATABASE_URL=[your preview database URL]

# Environment
NODE_ENV=production
```

#### For Each Variable:
1. Click **"Add New"**
2. **Name**: Enter the variable name (e.g., `JWT_SECRET`)
3. **Value**: Paste the generated value
4. **Environments**: Select **Preview** and **Production** (or specific as needed)
5. Click **"Save"**

### Option 2: Via Vercel CLI (Faster)

```bash
# Install Vercel CLI if not already installed
npm install -g vercel@latest

# Login
vercel login

# Link to your project (if not already linked)
vercel link

# Add environment variables
vercel env add JWT_SECRET
# Paste: CUKaqpTVKrMzhVFRlV0vUIDValoClhjqjrfkNgbPf+E=
# Select: Preview, Production

vercel env add JWT_REFRESH_SECRET
# Paste: eXaRVJ0Rxt0jr3Ru0QrqRHVxxdE0jg0rvY1ylOltOLU=
# Select: Preview, Production

vercel env add SESSION_SECRET
# Paste: dLkXj8ftiY4fGMhQtqHu5wpmCNNkOgP7LXXS5anibB8=
# Select: Preview, Production

vercel env add ENCRYPTION_KEY
# Paste: 3e070612e4d91bad0129cc46c5bcb35b2670fb174918c1fc6a6cd398442c9b5f
# Select: Preview, Production
```

### Option 3: Bulk Add via Script (Fastest)

Create a temporary script:

```bash
cat > /tmp/add-vercel-env.sh << 'SCRIPT'
#!/bin/bash
echo "CUKaqpTVKrMzhVFRlV0vUIDValoClhjqjrfkNgbPf+E=" | vercel env add JWT_SECRET preview production
echo "eXaRVJ0Rxt0jr3Ru0QrqRHVxxdE0jg0rvY1ylOltOLU=" | vercel env add JWT_REFRESH_SECRET preview production
echo "dLkXj8ftiY4fGMhQtqHu5wpmCNNkOgP7LXXS5anibB8=" | vercel env add SESSION_SECRET preview production
echo "3e070612e4d91bad0129cc46c5bcb35b2670fb174918c1fc6a6cd398442c9b5f" | vercel env add ENCRYPTION_KEY preview production
SCRIPT

chmod +x /tmp/add-vercel-env.sh
/tmp/add-vercel-env.sh
rm /tmp/add-vercel-env.sh
```

## After Adding Environment Variables

### 1. Redeploy Preview
The easiest way is to push a new commit or trigger a redeploy:

```bash
# Option A: Trigger redeploy via dashboard
# Go to Vercel → Deployments → Click "..." → Redeploy

# Option B: Push a dummy commit
git commit --allow-empty -m "chore: trigger redeployment with new env vars"
git push origin preview
```

### 2. Test Login
Once redeployed, try logging in at:
- Preview: `https://care-commons-<hash>.vercel.app/login`
- Email: `admin@carecommons.example`
- Password: `Admin123!`

### 3. Check Logs
If still having issues, check Vercel logs:
```bash
vercel logs
```

## Environment Variables Summary

### Already Set (via GitHub Secrets)
- ✅ `DATABASE_URL` - Production database
- ✅ `PREVIEW_DATABASE_URL` - Preview database
- ✅ `VERCEL_TOKEN` - Deployment token
- ✅ `VERCEL_ORG_ID` - Organization ID
- ✅ `VERCEL_PROJECT_ID` - Project ID

### Need to Add (This Guide)
- ❌ `JWT_SECRET` - JWT signing secret
- ❌ `JWT_REFRESH_SECRET` - Refresh token secret
- ❌ `SESSION_SECRET` - Session signing secret
- ❌ `ENCRYPTION_KEY` - Field encryption key

### Optional (Can Add Later)
- `CORS_ORIGIN` - Custom domains (Vercel domains already allowed)
- `LOG_LEVEL` - Logging verbosity (defaults to `info`)
- `GOOGLE_CLIENT_ID` - Google OAuth (if using)
- `GOOGLE_CLIENT_SECRET` - Google OAuth (if using)

## Security Notes

### ⚠️ IMPORTANT
- **Different secrets for preview vs production**: For maximum security, generate separate secrets for each environment
- **Never commit secrets**: All `.env*` files are gitignored
- **Rotate regularly**: Change secrets periodically (JWT secrets, encryption keys)
- **Use Vercel environment-specific**: Mark secrets as "Preview" or "Production" appropriately

### Generating New Secrets (If Needed)

If you want different secrets for preview vs production:

```bash
# For Preview Environment
echo "Preview JWT_SECRET:" && openssl rand -base64 32
echo "Preview JWT_REFRESH_SECRET:" && openssl rand -base64 32
echo "Preview SESSION_SECRET:" && openssl rand -base64 32
echo "Preview ENCRYPTION_KEY:" && openssl rand -hex 32

# For Production Environment
echo "Production JWT_SECRET:" && openssl rand -base64 32
echo "Production JWT_REFRESH_SECRET:" && openssl rand -base64 32
echo "Production SESSION_SECRET:" && openssl rand -base64 32
echo "Production ENCRYPTION_KEY:" && openssl rand -hex 32
```

## Troubleshooting

### "JWT_SECRET environment variable not set"
- **Cause**: Environment variable not added to Vercel
- **Fix**: Add via dashboard or CLI (see above)
- **Verify**: Run `vercel env ls` to list all environment variables

### "Origin not allowed by CORS"
- **Cause**: CORS configuration (should be fixed now)
- **Fix**: Already handled - Vercel domains automatically allowed

### "Database connection failed"
- **Cause**: DATABASE_URL not set or incorrect
- **Fix**: Verify `DATABASE_URL` in Vercel environment variables matches Neon connection string

### Still not working?
Check the Vercel function logs:
```bash
vercel logs --follow
```

Look for startup errors related to environment variables.

## Quick Reference

### Check Current Environment Variables
```bash
vercel env ls
```

### Pull Environment Variables Locally
```bash
vercel env pull .env.local
```

### Remove an Environment Variable
```bash
vercel env rm JWT_SECRET
```

---

**Next Steps:**
1. ✅ Add the 4 secrets to Vercel (JWT_SECRET, JWT_REFRESH_SECRET, SESSION_SECRET, ENCRYPTION_KEY)
2. ✅ Redeploy preview (push commit or manual redeploy)
3. ✅ Test login at preview URL
4. ✅ If successful, push to main for production deployment

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
