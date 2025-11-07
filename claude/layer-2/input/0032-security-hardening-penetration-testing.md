# Task 0032: Security Hardening and Penetration Testing

**Priority**: 🔴 CRITICAL
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 12-16 hours

## Context

Before production launch, the platform must undergo comprehensive security hardening to protect sensitive healthcare data (HIPAA-regulated PHI). This includes implementing security best practices, conducting penetration testing, and fixing identified vulnerabilities.

## Problem Statement

Current security gaps:
- No security headers configured
- Password policies not enforced
- No SQL injection protection verification
- Missing input sanitization in some areas
- No XSS protection verification
- Secrets may be logged
- No comprehensive security audit performed
- CSRF protection not verified

## Task

### 1. Implement Security Headers

**File**: `packages/app/src/middleware/security-headers.ts`

```typescript
import helmet from 'helmet';
import { Express } from 'express';

export const configureSecurityHeaders = (app: Express) => {
  // Use Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Tailwind
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", process.env.API_URL || ''],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow cross-origin resources
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      strictTransportSecurity: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      xContentTypeOptions: true, // Prevent MIME sniffing
      xFrameOptions: { action: 'deny' }, // Prevent clickjacking
      xXssProtection: true, // Enable XSS filter
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  // Additional custom headers
  app.use((req, res, next) => {
    // HIPAA compliance headers
    res.setHeader('X-Healthcare-Data', 'PHI');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    next();
  });
};
```

### 2. Strengthen Password Policy

**File**: `packages/core/src/utils/password-validator.ts`

```typescript
import zxcvbn from 'zxcvbn';

export interface PasswordValidationResult {
  valid: boolean;
  score: number;
  feedback: string[];
  warning?: string;
}

export class PasswordValidator {
  private static MIN_LENGTH = 12;
  private static MIN_SCORE = 3; // 0-4 scale (zxcvbn)

  static validate(password: string, userInputs: string[] = []): PasswordValidationResult {
    const feedback: string[] = [];

    // Check minimum length
    if (password.length < this.MIN_LENGTH) {
      feedback.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    }

    // Check for required character types
    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      feedback.push('Password must contain at least one number');
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    }

    // Check against common passwords using zxcvbn
    const result = zxcvbn(password, userInputs);

    if (result.score < this.MIN_SCORE) {
      feedback.push(
        `Password is too weak (strength: ${result.score}/4). ${
          result.feedback.warning || result.feedback.suggestions.join('. ')
        }`
      );
    }

    return {
      valid: feedback.length === 0,
      score: result.score,
      feedback,
      warning: result.feedback.warning,
    };
  }

  static async hash(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(password, 12); // Cost factor 12
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, hash);
  }
}
```

### 3. Implement Input Sanitization

**File**: `packages/core/src/middleware/sanitize-input.ts`

```typescript
import DOMPurify from 'isomorphic-dompurify';
import { Request, Response, NextFunction } from 'express';

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    // Remove HTML tags and scripts
    return DOMPurify.sanitize(obj, { ALLOWED_TAGS: [] });
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }

  return obj;
}

// SQL injection protection (additional layer beyond parameterized queries)
export const validateNoSQLInjection = (value: string): boolean => {
  const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)|(--)|(;)|(\/\*)|(\*\/)/gi;
  return !sqlInjectionPattern.test(value);
};
```

### 4. Implement CSRF Protection

**File**: `packages/app/src/middleware/csrf.ts`

```typescript
import csrf from 'csurf';
import { Express } from 'express';

export const configureCsrfProtection = (app: Express) => {
  const csrfProtection = csrf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    },
  });

  // Apply CSRF protection to state-changing routes
  app.use('/api', (req, res, next) => {
    // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Skip CSRF for mobile API (uses JWT)
    if (req.headers['x-mobile-app']) {
      return next();
    }

    // Apply CSRF protection
    csrfProtection(req, res, next);
  });

  // Endpoint to get CSRF token
  app.get('/api/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });
};
```

### 5. Implement Sensitive Data Protection

**File**: `packages/core/src/utils/sensitive-data-filter.ts`

```typescript
// Filter sensitive data from logs
export class SensitiveDataFilter {
  private static SENSITIVE_FIELDS = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret',
    'ssn',
    'socialSecurityNumber',
    'creditCard',
    'cvv',
    'pin',
    'biometric',
  ];

  static filter(data: any): any {
    if (typeof data === 'string') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.filter(item));
    }

    if (data && typeof data === 'object') {
      const filtered: any = {};
      for (const key in data) {
        if (this.SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          filtered[key] = '[REDACTED]';
        } else {
          filtered[key] = this.filter(data[key]);
        }
      }
      return filtered;
    }

    return data;
  }
}

// Update logger to use filter
import { SensitiveDataFilter } from './sensitive-data-filter';

export const logger = {
  info: (message: string, data?: any) => {
    console.log(message, data ? SensitiveDataFilter.filter(data) : '');
  },
  error: (message: string, error?: any) => {
    console.error(message, error ? SensitiveDataFilter.filter(error) : '');
  },
  // ... other log levels
};
```

### 6. SQL Injection Protection Verification

**File**: `packages/core/src/__tests__/sql-injection.test.ts`

```typescript
import { db } from '../db';

describe('SQL Injection Protection', () => {
  it('should prevent SQL injection in WHERE clause', async () => {
    const maliciousInput = "1' OR '1'='1";

    // This should NOT return all users
    const result = await db('users')
      .where({ id: maliciousInput })
      .select('*');

    expect(result).toHaveLength(0);
  });

  it('should prevent SQL injection in LIKE queries', async () => {
    const maliciousInput = "%'; DROP TABLE users; --";

    await expect(
      db('users')
        .where('name', 'like', `%${maliciousInput}%`)
        .select('*')
    ).resolves.not.toThrow();

    // Verify table still exists
    const tableExists = await db.schema.hasTable('users');
    expect(tableExists).toBe(true);
  });
});
```

### 7. XSS Protection Verification

**File**: `packages/web/src/__tests__/xss-protection.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { Card } from '../components/Card';

describe('XSS Protection', () => {
  it('should sanitize HTML in user-generated content', () => {
    const maliciousContent = '<script>alert("XSS")</script><p>Safe content</p>';

    render(<Card content={maliciousContent} />);

    // Script should not be present
    expect(screen.queryByText(/alert/)).not.toBeInTheDocument();

    // Safe content should be present
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('should prevent JavaScript execution in attributes', () => {
    const maliciousTitle = 'Normal Title" onload="alert(\'XSS\')" data-x="';

    render(<Card title={maliciousTitle} />);

    const card = screen.getByRole('article');
    expect(card.getAttribute('onload')).toBeNull();
  });
});
```

### 8. Implement Account Lockout

**File**: `packages/core/src/services/account-lockout.service.ts`

```typescript
import { getCacheService } from './cache.service';

export class AccountLockoutService {
  private static MAX_ATTEMPTS = 5;
  private static LOCKOUT_DURATION = 15 * 60; // 15 minutes in seconds

  static async recordFailedAttempt(email: string): Promise<{ locked: boolean; remaining: number }> {
    const cache = getCacheService();
    const key = `lockout:${email}`;

    const attempts = (await cache.get<number>(key)) || 0;
    const newAttempts = attempts + 1;

    await cache.set(key, newAttempts, this.LOCKOUT_DURATION);

    const locked = newAttempts >= this.MAX_ATTEMPTS;

    if (locked) {
      await cache.set(`locked:${email}`, true, this.LOCKOUT_DURATION);
    }

    return {
      locked,
      remaining: Math.max(0, this.MAX_ATTEMPTS - newAttempts),
    };
  }

  static async isLocked(email: string): Promise<boolean> {
    const cache = getCacheService();
    const locked = await cache.get<boolean>(`locked:${email}`);
    return locked === true;
  }

  static async clearAttempts(email: string): Promise<void> {
    const cache = getCacheService();
    await cache.del(`lockout:${email}`);
    await cache.del(`locked:${email}`);
  }
}
```

### 9. Run Security Audit Tools

Install and run security audit tools:

```bash
# Install security audit tools
npm install -g npm-audit-resolver
npm install --save-dev eslint-plugin-security

# Run npm audit
npm audit --production

# Fix auto-fixable vulnerabilities
npm audit fix

# Check for outdated packages with known vulnerabilities
npm outdated

# Run ESLint with security plugin
npx eslint . --ext .ts,.tsx --plugin security
```

**File**: `.eslintrc.js` (add security plugin):

```javascript
module.exports = {
  // ... existing config
  plugins: ['security'],
  extends: ['plugin:security/recommended'],
};
```

### 10. Penetration Testing Checklist

Create a comprehensive penetration testing checklist:

**File**: `docs/security/PENETRATION_TESTING_CHECKLIST.md`

```markdown
# Penetration Testing Checklist

## Authentication & Authorization

- [ ] Test password reset flow for account takeover
- [ ] Test JWT token expiration and refresh
- [ ] Test privilege escalation (caregiver → admin)
- [ ] Test session fixation attacks
- [ ] Test brute force protection (account lockout)
- [ ] Test OAuth flow security

## Input Validation

- [ ] Test SQL injection on all input fields
- [ ] Test NoSQL injection if using MongoDB
- [ ] Test XSS on text inputs, rich text editors
- [ ] Test LDAP injection
- [ ] Test XML injection
- [ ] Test command injection

## API Security

- [ ] Test rate limiting on all endpoints
- [ ] Test CSRF protection on state-changing operations
- [ ] Test CORS configuration
- [ ] Test API authentication bypass
- [ ] Test mass assignment vulnerabilities

## Data Protection

- [ ] Test encryption at rest (database)
- [ ] Test encryption in transit (HTTPS)
- [ ] Test sensitive data exposure in logs
- [ ] Test sensitive data exposure in error messages
- [ ] Test data leakage through API responses

## Business Logic

- [ ] Test EVV GPS spoofing prevention
- [ ] Test visit time manipulation
- [ ] Test billing amount manipulation
- [ ] Test unauthorized visit access
- [ ] Test unauthorized client data access

## Infrastructure

- [ ] Test security headers (CSP, HSTS, X-Frame-Options)
- [ ] Test SSL/TLS configuration
- [ ] Test exposed admin interfaces
- [ ] Test default credentials
- [ ] Test directory traversal

## Mobile App

- [ ] Test root/jailbreak detection bypass
- [ ] Test certificate pinning
- [ ] Test local data encryption
- [ ] Test biometric authentication bypass
- [ ] Test API key exposure in app bundle
```

### 11. Implement Security Monitoring

**File**: `packages/app/src/services/security-monitoring.service.ts`

```typescript
export class SecurityMonitoringService {
  static async logSecurityEvent(event: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
    ip: string;
    userAgent: string;
    details: any;
  }): Promise<void> {
    await db('security_events').insert({
      type: event.type,
      severity: event.severity,
      user_id: event.userId,
      ip_address: event.ip,
      user_agent: event.userAgent,
      details: event.details,
      created_at: new Date(),
    });

    // Alert on critical events
    if (event.severity === 'critical') {
      // Send alert to admin/security team
      await this.sendSecurityAlert(event);
    }
  }

  private static async sendSecurityAlert(event: any): Promise<void> {
    // Implement email/Slack notification
    console.error('SECURITY ALERT:', event);
  }
}
```

## Acceptance Criteria

- [ ] Security headers configured (Helmet)
- [ ] Strong password policy enforced
- [ ] Input sanitization implemented
- [ ] SQL injection protection verified
- [ ] XSS protection verified
- [ ] CSRF protection implemented
- [ ] Sensitive data filtered from logs
- [ ] Account lockout after failed attempts
- [ ] npm audit shows 0 critical/high vulnerabilities
- [ ] ESLint security plugin passes
- [ ] Penetration testing checklist completed
- [ ] Security monitoring implemented
- [ ] All tests pass

## Testing Checklist

1. **Security Headers Test**: Verify all security headers present
2. **SQL Injection Test**: Attempt SQL injection on all inputs
3. **XSS Test**: Attempt XSS attacks on all text fields
4. **CSRF Test**: Attempt CSRF attacks on state-changing operations
5. **Authentication Test**: Test authentication bypass attempts
6. **Authorization Test**: Test privilege escalation
7. **Rate Limiting Test**: Verify rate limits enforced
8. **Brute Force Test**: Verify account lockout works

## Dependencies

**Blocks**: Task 0020 (Production launch)
**Depends on**: Tasks 0021, 0022, 0024 (core functionality must work first)

## Priority Justification

This is **CRITICAL** because:
1. HIPAA compliance requirement - protect PHI
2. Legal requirement - prevent data breaches
3. Reputation protection - security breaches damage trust
4. Financial protection - breaches are expensive
5. Production blocker - cannot launch without security

---

**Next Task**: 0033 - Monitoring and Error Tracking
