# Task 0014: Security Enhancements - RBAC Hardening and Security Audit

**Priority**: 🔴 CRITICAL
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 8-10 hours

## Context

Before production launch, perform comprehensive security audit and harden role-based access control (RBAC), input validation, and data protection.

## Security Goals

- ✅ Zero high/critical vulnerabilities
- ✅ HIPAA-compliant data handling
- ✅ Strong authentication and authorization
- ✅ Protection against OWASP Top 10 threats
- ✅ Security headers properly configured

## Task

### 1. Audit and Harden RBAC

**Review permission system**:

**File**: `packages/core/src/middleware/permissions.ts`

```typescript
// Verify all routes have permission checks
export function requirePermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has ANY of the required permissions
    const hasPermission = permissions.some(permission =>
      user.permissions.includes(permission)
    );

    if (!hasPermission) {
      // Log unauthorized access attempt
      await auditLog({
        userId: user.id,
        action: 'unauthorized_access_attempt',
        resource: req.path,
        requiredPermissions: permissions,
        timestamp: new Date()
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
}
```

**Audit all routes**:

Create script to verify all routes have permission checks:

**File**: `scripts/audit-route-permissions.ts`

```typescript
import fs from 'fs';
import path from 'path';

// Find all route files
const routeFiles = [
  'packages/app/src/routes/**/*.routes.ts',
  'verticals/*/src/routes/**/*.routes.ts'
];

// Parse route files and check for permission middleware
function auditRoutes() {
  const unprotectedRoutes = [];

  // ... scan files for routes without requirePermission()

  if (unprotectedRoutes.length > 0) {
    console.error('❌ Unprotected routes found:');
    unprotectedRoutes.forEach(route => console.error(`  ${route}`));
    process.exit(1);
  } else {
    console.log('✅ All routes have permission checks');
  }
}

auditRoutes();
```

### 2. Implement Rate Limiting

**File**: `packages/core/src/middleware/rate-limit.ts`

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { CacheService } from '../services/cache.service';

// General API rate limit
export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: CacheService.getInstance().client
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limit for auth endpoints
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: CacheService.getInstance().client
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true // Don't count successful logins
});

// Apply in routes
router.post('/login', authLimiter, loginHandler);
router.use('/api', apiLimiter);
```

### 3. Add Input Validation and Sanitization

**Create validation middleware**:

**File**: `packages/core/src/middleware/validation.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

export function validateBody<T extends ZodSchema>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize strings to prevent XSS
      const sanitized = sanitizeObject(req.body);

      // Validate against schema
      req.body = schema.parse(sanitized);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
}

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

// Usage
const createClientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\d{10}$/).optional()
});

router.post('/clients', validateBody(createClientSchema), createClientHandler);
```

### 4. Implement CSRF Protection

**File**: `packages/core/src/middleware/csrf.ts`

```typescript
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Apply to routes
app.use(cookieParser());
app.use(csrfProtection);

// Provide token to frontend
router.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

### 5. Strengthen Security Headers

**File**: `packages/core/src/middleware/security-headers.ts`

```typescript
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Remove unsafe-inline in production
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.care-commons.com'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  xssFilter: true
});

app.use(securityHeaders);
```

### 6. Implement Secure Password Reset

**File**: `packages/core/src/services/password-reset.service.ts`

```typescript
import crypto from 'crypto';
import { sendEmail } from './email.service';

export class PasswordResetService {
  async requestReset(email: string): Promise<void> {
    const user = await this.findUserByEmail(email);

    if (!user) {
      // Don't reveal if email exists (security)
      return;
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Store hashed token with expiration (1 hour)
    await knex('password_reset_tokens').insert({
      user_id: user.id,
      token: hashedToken,
      expires_at: new Date(Date.now() + 3600000)
    });

    // Send email with token (not hashed)
    const resetLink = `https://care-commons.com/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      body: `Click here to reset your password: ${resetLink}\n\nThis link expires in 1 hour.`
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const resetToken = await knex('password_reset_tokens')
      .where('token', hashedToken)
      .where('expires_at', '>', new Date())
      .first();

    if (!resetToken) {
      throw new Error('Invalid or expired token');
    }

    // Update password
    const hashedPassword = await hashPassword(newPassword);
    await knex('users')
      .where('id', resetToken.user_id)
      .update({ password: hashedPassword });

    // Delete used token
    await knex('password_reset_tokens').where('id', resetToken.id).del();

    // Invalidate all existing sessions
    await knex('refresh_tokens').where('user_id', resetToken.user_id).del();
  }
}
```

### 7. Add Security Logging

**File**: `packages/core/src/services/security-logger.service.ts`

```typescript
export class SecurityLogger {
  static async logSecurityEvent(event: {
    type: 'login_failed' | 'login_success' | 'unauthorized_access' | 'suspicious_activity' | 'data_export';
    userId?: string;
    ip: string;
    userAgent: string;
    details?: any;
  }) {
    await knex('security_logs').insert({
      event_type: event.type,
      user_id: event.userId,
      ip_address: event.ip,
      user_agent: event.userAgent,
      details: JSON.stringify(event.details),
      timestamp: new Date()
    });

    // Alert on critical events
    if (event.type === 'suspicious_activity') {
      await this.alertSecurityTeam(event);
    }
  }

  static async detectBruteForce(ip: string): Promise<boolean> {
    const recentFailures = await knex('security_logs')
      .where('ip_address', ip)
      .where('event_type', 'login_failed')
      .where('timestamp', '>', new Date(Date.now() - 15 * 60 * 1000))
      .count('* as count');

    return parseInt(recentFailures[0].count) >= 5;
  }
}
```

### 8. Implement SQL Injection Prevention

**Audit all queries**:

- ❌ **Never** use raw string concatenation in SQL
- ✅ **Always** use parameterized queries with Knex

**Bad** (vulnerable to SQL injection):
```typescript
const userId = req.params.id;
const query = `SELECT * FROM users WHERE id = '${userId}'`; // DANGEROUS!
```

**Good** (safe):
```typescript
const userId = req.params.id;
const user = await knex('users').where('id', userId).first(); // Safe
```

Create linting rule to catch raw SQL:

**File**: `.eslintrc.js`

```javascript
rules: {
  'no-template-curly-in-string': 'error',
  // Add custom rule to detect SQL concatenation
}
```

### 9. Add Security Tests

**File**: `packages/core/src/__tests__/security.test.ts`

```typescript
describe('Security Tests', () => {
  test('should prevent SQL injection', async () => {
    const maliciousInput = "1' OR '1'='1";
    const result = await request(app)
      .get(`/api/clients/${maliciousInput}`)
      .set('Authorization', `Bearer ${token}`);

    expect(result.status).not.toBe(200);
  });

  test('should prevent XSS', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    const result = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: xssPayload });

    // Should sanitize input
    const client = await knex('clients').where('id', result.body.id).first();
    expect(client.first_name).not.toContain('<script>');
  });

  test('should enforce rate limiting', async () => {
    // Attempt 6 login requests (limit is 5)
    const requests = Array(6).fill(null).map(() =>
      request(app).post('/auth/login').send({ email: 'test@example.com', password: 'wrong' })
    );

    const results = await Promise.all(requests);
    const rateLimited = results.filter(r => r.status === 429);

    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('should not leak user existence', async () => {
    const result = await request(app)
      .post('/auth/password-reset')
      .send({ email: 'nonexistent@example.com' });

    // Should return success even if email doesn't exist
    expect(result.status).toBe(200);
  });
});
```

### 10. Run Security Audit Tools

**Install security tools**:
```bash
npm install --save-dev snyk eslint-plugin-security
```

**Add to CI/CD**:

**File**: `.github/workflows/security.yml`

```yaml
name: Security Audit

on:
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday
  push:
    branches: [main, develop]

jobs:
  security-audit:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Run Snyk security scan
        run: npx snyk test --severity-threshold=high
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run ESLint security plugin
        run: npm run lint:security
```

## Acceptance Criteria

- [ ] All routes have permission checks
- [ ] Rate limiting implemented
- [ ] Input validation with Zod schemas
- [ ] CSRF protection enabled
- [ ] Security headers configured (helmet)
- [ ] Secure password reset flow
- [ ] Security event logging
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] Security tests passing
- [ ] Security audit tools passing (npm audit, Snyk)
- [ ] Zero high/critical vulnerabilities
- [ ] OWASP Top 10 threats mitigated

## OWASP Top 10 Mitigation Checklist

- [ ] A01:2021 – Broken Access Control → RBAC enforced on all routes
- [ ] A02:2021 – Cryptographic Failures → Passwords hashed with PBKDF2, PHI encrypted
- [ ] A03:2021 – Injection → Parameterized queries, input sanitization
- [ ] A04:2021 – Insecure Design → Security by design, threat modeling
- [ ] A05:2021 – Security Misconfiguration → Security headers, HTTPS enforced
- [ ] A06:2021 – Vulnerable Components → npm audit, dependency updates
- [ ] A07:2021 – Authentication Failures → Rate limiting, secure password reset
- [ ] A08:2021 – Software and Data Integrity → Package lock files, SRI
- [ ] A09:2021 – Security Logging Failures → Comprehensive security logging
- [ ] A10:2021 – Server-Side Request Forgery → Input validation, URL allowlists

## Reference

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- HIPAA Security Rule: https://www.hhs.gov/hipaa/for-professionals/security/
- Helmet.js: https://helmetjs.github.io/
