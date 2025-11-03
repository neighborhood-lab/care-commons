# API Directory - Vercel Serverless Functions

This directory contains the entry point for Vercel serverless function
deployment.

## Security Configuration

### ✅ Helmet CSP

**Configured in:** `packages/app/src/server.ts`

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);
```

- ✅ CSP is **enabled** (not disabled)
- ✅ Proper directives configured
- ✅ Follows security best practices

### ✅ CORS Configuration

**Configured in:** `packages/app/src/server.ts`

```typescript
// Development: Allow all origins
// Production: Require CORS_ORIGIN environment variable

const allowedOrigins = process.env['CORS_ORIGIN']?.split(',') ?? [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (typeof origin !== 'string') {
        callback(null, true); // Allow non-browser requests
        return;
      }

      if (NODE_ENV === 'development') {
        callback(null, true); // Allow all in development
        return;
      }

      // Production: Only allow configured origins
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  })
);
```

- ✅ **No wildcard** (`*`) in production
- ✅ Requires explicit origin configuration
- ✅ Development-friendly (allows all in dev mode)

## Environment Variables Required

### Production Deployment

```bash
# In Vercel Dashboard or GitHub Secrets
CORS_ORIGIN=https://app.example.com,https://admin.example.com
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
NODE_ENV=production
```

### Development

```bash
# In local .env file
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=care_commons
DB_USER=postgres
DB_PASSWORD=your_password
```

## How It Works

1. **Request Flow:**

   ```
   Vercel → api/index.ts → createApp() → Express App (with security middleware)
   ```

2. **Security Layers:**
   - Helmet CSP (Content Security Policy)
   - CORS (Cross-Origin Resource Sharing)
   - Request validation
   - Error handling

3. **Caching:**
   - Express app is initialized once per cold start
   - Subsequent requests reuse the same app instance (warm starts)
   - Efficient for serverless environments

## Files

- `index.ts` - Serverless function handler (TypeScript)
- `README.md` - This file

## Important Notes

⚠️ **Do NOT create `index.js` in this directory**

- The TypeScript file (`index.ts`) is the source of truth
- JavaScript files should not exist here
- Vercel compiles TypeScript during deployment

⚠️ **Security configuration is in `packages/app/src/server.ts`**

- Do not configure Helmet or CORS in this file
- This handler simply forwards requests to the Express app
- Security middleware is applied by the Express app

## Testing Locally

```bash
# Build the project
npm run build

# Start the dev server (not Vercel)
npm run dev

# Test API endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api
```

## Deployment

Vercel automatically:

1. Detects `api/index.ts`
2. Compiles TypeScript to JavaScript
3. Creates a serverless function
4. Routes requests to the function

No additional configuration needed!

## Security Scans

✅ **GitHub Advanced Security:**

- CodeQL scanning passes
- No security vulnerabilities
- Helmet CSP properly configured
- CORS properly configured

✅ **Pre-commit Hooks:**

- Linting passes
- Type checking passes
- Tests pass with coverage

---

**Last Updated:** November 2024
