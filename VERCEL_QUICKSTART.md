# Vercel Environment Setup - Quick Start

## The Problem
Login fails with: `JWT_SECRET environment variable not set`

## The Solution (2 minutes)

### Step 1: Add Secrets to Vercel

**Via Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Select project: `care-commons`
3. Settings → Environment Variables → Add New

**Add these 4 variables** (copy-paste exactly):

| Name | Value | Environment |
|------|-------|-------------|
| `JWT_SECRET` | `CUKaqpTVKrMzhVFRlV0vUIDValoClhjqjrfkNgbPf+E=` | Preview, Production |
| `JWT_REFRESH_SECRET` | `eXaRVJ0Rxt0jr3Ru0QrqRHVxxdE0jg0rvY1ylOltOLU=` | Preview, Production |
| `SESSION_SECRET` | `dLkXj8ftiY4fGMhQtqHu5wpmCNNkOgP7LXXS5anibB8=` | Preview, Production |
| `ENCRYPTION_KEY` | `3e070612e4d91bad0129cc46c5bcb35b2670fb174918c1fc6a6cd398442c9b5f` | Preview, Production |

### Step 2: Redeploy
```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push origin preview
```

### Step 3: Test Login
- URL: Your preview URL from Vercel
- Email: `admin@carecommons.example`
- Password: `Admin123!`

---

**That's it!** See `VERCEL_ENV_SETUP.md` for detailed instructions.
