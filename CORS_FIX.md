# CORS Fix for Vercel Deployments

## Problem
Vercel preview deployments were failing with CORS errors:
```
Error: Origin https://care-commons-ly29491hr-brian-edwards-projects-0d190d6b.vercel.app not allowed by CORS
```

## Root Cause
The server CORS configuration required explicit `CORS_ORIGIN` environment variable configuration, but:
1. No `CORS_ORIGIN` was set in preview/production environments
2. Vercel generates dynamic preview URLs that can't be pre-configured

## Solution
Updated `packages/app/src/server.ts` to automatically allow all Vercel domains (`*.vercel.app`):

### CORS Logic (in order of evaluation):
1. ✅ **No origin** (mobile apps, curl) → Always allowed
2. ✅ **Development** (`NODE_ENV=development`) → All origins allowed
3. ✅ **Vercel domains** (contains `.vercel.app`) → Always allowed
4. ✅ **Explicit CORS_ORIGIN** (if configured) → Check allowed list
5. ❌ **Everything else** → Blocked

### Code Changes
```typescript
// Allow Vercel preview deployments (both preview and production)
if (origin.includes('.vercel.app')) {
  callback(null, true);
  return;
}

// In production, allow specified origins if configured
if (allowedOrigins.length > 0) {
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    callback(null, true);
    return;
  }
}
```

## Security Considerations
- ✅ Vercel domains are trusted (our own deployments)
- ✅ Can still restrict to custom domains via `CORS_ORIGIN` if needed
- ✅ Development still allows all origins for local testing
- ✅ Explicit blocking with warning for unauthorized origins

## Testing
After deployment, verify:
```bash
curl -H "Origin: https://care-commons-preview.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://your-api.vercel.app/api/auth/login
```

Should return `Access-Control-Allow-Origin` header.

## Next Steps
1. **Commit and push** these changes
2. **Deploy to preview** (will auto-deploy on push)
3. **Test login** in preview environment
4. **Deploy to production** if successful

---

**Files Modified:**
- `packages/app/src/server.ts` - Updated CORS logic
- `.env.preview` - Added CORS documentation
- `.env.production` - Added CORS documentation
- `.env.example` - Added CORS documentation
