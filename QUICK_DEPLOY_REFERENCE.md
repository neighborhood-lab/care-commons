# Quick Deployment Reference Card

## 🚨 BEFORE MERGING TO MAIN - SET THESE IN VERCEL

### Vercel Dashboard → Settings → Environment Variables → Production

```bash
# Generate these secrets locally:
openssl rand -base64 32  # Use for JWT_SECRET
openssl rand -base64 32  # Use for JWT_REFRESH_SECRET
openssl rand -hex 32     # Use for ENCRYPTION_KEY
```

Then set in Vercel:

| Variable | Value | Required? |
|----------|-------|-----------|
| `JWT_SECRET` | Output from openssl rand -base64 32 | ✅ YES |
| `JWT_REFRESH_SECRET` | Output from openssl rand -base64 32 | ✅ YES |
| `ENCRYPTION_KEY` | Output from openssl rand -hex 32 | ✅ YES |
| `DATABASE_URL` | postgresql://...?sslmode=require | ✅ YES |
| `NODE_ENV` | production | Recommended |
| `CORS_ORIGIN` | https://your-domain.vercel.app | Recommended |

---

## ✅ Pre-Merge Checklist

```bash
# Run this before merging to main:
./scripts/check.sh
```

Should output: **12 successful tasks**

---

## 🚀 Deploy

```bash
git checkout main
git merge develop
git push origin main
```

GitHub Actions automatically:
- Runs tests
- Runs migrations  
- Deploys to Vercel

---

## 🔍 Verify Deployment

```bash
# 1. Health check
curl https://your-domain.vercel.app/health

# 2. Login test
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@carecommons.example","password":"ChangeThisSecurePassword123!"}'
```

Expected: JSON response with `"success": true` and `"tokens"` object

---

## 🐛 If Login Returns 500 Error

**Cause:** Missing JWT secrets in Vercel

**Fix:**
1. Verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are set in Vercel Dashboard
2. Ensure both are at least 32 characters
3. Redeploy: `vercel --prod` (or push to main again)

---

## 👥 Create Demo Users

```bash
export DATABASE_URL="your-production-database-url"
npm run db:seed:demo
```

Creates test users with credentials in `PRODUCTION_DEPLOYMENT.md`

---

## 📊 Current Configuration Status

✅ Node.js 22.x (Vercel requirement)  
✅ ESM architecture (.mts entry point)  
✅ Build command: `npm run build`  
✅ Health endpoint: `/health`  
✅ Auth endpoints: `/api/auth/login`, `/api/auth/login/google`  
✅ Database migrations: Auto-run in GitHub Actions  

---

**Full docs:** See `PRODUCTION_DEPLOYMENT.md`
